-- Durable, hospital-scoped doctor login/logout and duty-duration tracking.
-- Direct table access is denied; clients use opaque login-session tokens via RPC.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.staff_accounts ADD COLUMN IF NOT EXISTS hospital_id TEXT;
ALTER TABLE public.staff_accounts ADD COLUMN IF NOT EXISTS hospital_name TEXT;

UPDATE public.staff_accounts s
SET hospital_id = d.hospital_id
FROM public.doctors d
WHERE s.role = 'doctor'
  AND s.doctor_id = d.id
  AND s.hospital_id IS DISTINCT FROM d.hospital_id;

UPDATE public.staff_accounts s
SET hospital_name = h.name
FROM public.hospitals h
WHERE s.hospital_id = h.id
  AND (s.hospital_name IS NULL OR s.hospital_name = '');

CREATE TABLE IF NOT EXISTS public.staff_portal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff_accounts(id) ON DELETE CASCADE,
  doctor_id TEXT REFERENCES public.doctors(id) ON DELETE CASCADE,
  hospital_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('doctor', 'admin', 'nurse')),
  login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logout_at TIMESTAMPTZ,
  logout_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (logout_at IS NULL OR logout_at >= login_at)
);

CREATE INDEX IF NOT EXISTS idx_staff_portal_sessions_staff_time
  ON public.staff_portal_sessions(staff_id, login_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_portal_sessions_hospital_time
  ON public.staff_portal_sessions(hospital_id, login_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_portal_sessions_doctor_time
  ON public.staff_portal_sessions(doctor_id, login_at DESC);

ALTER TABLE public.staff_portal_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.staff_portal_sessions FROM anon, authenticated;

-- Replace login so a successful password verification atomically starts a
-- server-side portal session. Extra return columns are accepted by the client.
DROP FUNCTION IF EXISTS public.staff_login(TEXT, TEXT);
CREATE FUNCTION public.staff_login(p_username TEXT, p_password TEXT)
RETURNS TABLE (
  id UUID,
  username TEXT,
  name TEXT,
  role TEXT,
  department TEXT,
  doctor_id TEXT,
  is_active BOOLEAN,
  password_changed_at TIMESTAMPTZ,
  hospital_id TEXT,
  hospital_name TEXT,
  activity_session_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_staff public.staff_accounts%ROWTYPE;
  v_hospital_id TEXT;
  v_hospital_name TEXT;
  v_session_id UUID;
BEGIN
  SELECT s.* INTO v_staff
  FROM public.staff_accounts s
  WHERE LOWER(s.username) = LOWER(TRIM(p_username))
    AND s.is_active = TRUE
    AND s.password_hash = extensions.crypt(p_password, s.password_hash)
  LIMIT 1;

  IF NOT FOUND THEN RETURN; END IF;

  v_hospital_id := v_staff.hospital_id;
  IF v_hospital_id IS NULL AND v_staff.doctor_id IS NOT NULL THEN
    SELECT d.hospital_id INTO v_hospital_id FROM public.doctors d WHERE d.id = v_staff.doctor_id;
  END IF;
  SELECT h.name INTO v_hospital_name FROM public.hospitals h WHERE h.id = v_hospital_id;
  v_hospital_name := COALESCE(v_staff.hospital_name, v_hospital_name);

  INSERT INTO public.staff_portal_sessions(staff_id, doctor_id, hospital_id, role)
  VALUES (v_staff.id, v_staff.doctor_id, v_hospital_id, v_staff.role)
  RETURNING staff_portal_sessions.id INTO v_session_id;

  RETURN QUERY SELECT
    v_staff.id, v_staff.username, v_staff.name, v_staff.role,
    v_staff.department, v_staff.doctor_id, v_staff.is_active,
    v_staff.password_changed_at, v_hospital_id, v_hospital_name, v_session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_activity_heartbeat(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_updated INTEGER;
BEGIN
  UPDATE public.staff_portal_sessions
  SET last_seen_at = NOW()
  WHERE id = p_session_id AND logout_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_activity_logout(
  p_session_id UUID,
  p_reason TEXT DEFAULT 'user_logout'
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_updated INTEGER;
BEGIN
  UPDATE public.staff_portal_sessions
  SET logout_at = NOW(), last_seen_at = NOW(), logout_reason = LEFT(COALESCE(p_reason, 'user_logout'), 80)
  WHERE id = p_session_id AND logout_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated = 1;
END;
$$;

-- Hospital identity comes only from the opaque authenticated admin session.
-- A caller cannot supply a different hospital id.
CREATE OR REPLACE FUNCTION public.admin_doctor_activity(
  p_admin_session_id UUID,
  p_local_date DATE DEFAULT ((NOW() AT TIME ZONE 'Asia/Kolkata')::DATE)
) RETURNS TABLE (
  doctor_id TEXT,
  staff_id UUID,
  hospital_id TEXT,
  first_login_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  last_logout_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  is_online BOOLEAN,
  duty_seconds_today BIGINT,
  sessions_today JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_admin_hospital_id TEXT;
BEGIN
  SELECT ps.hospital_id INTO v_admin_hospital_id
  FROM public.staff_portal_sessions ps
  JOIN public.staff_accounts sa ON sa.id = ps.staff_id
  WHERE ps.id = p_admin_session_id
    AND ps.role = 'admin'
    AND sa.role = 'admin'
    AND sa.is_active = TRUE
    AND ps.logout_at IS NULL
  LIMIT 1;

  IF v_admin_hospital_id IS NULL THEN
    RAISE EXCEPTION 'Invalid admin session or hospital assignment';
  END IF;

  RETURN QUERY
  WITH scoped AS (
    SELECT
      ps.*,
      (ps.logout_at IS NULL AND ps.last_seen_at >= NOW() - INTERVAL '90 seconds') AS currently_online,
      CASE
        WHEN ps.logout_at IS NOT NULL THEN ps.logout_at
        WHEN ps.last_seen_at < NOW() - INTERVAL '90 seconds' THEN ps.last_seen_at
        ELSE NOW()
      END AS effective_end
    FROM public.staff_portal_sessions ps
    WHERE ps.role = 'doctor'
      AND ps.hospital_id = v_admin_hospital_id
      AND (ps.login_at AT TIME ZONE 'Asia/Kolkata')::DATE = p_local_date
  )
  SELECT
    s.doctor_id,
    s.staff_id,
    s.hospital_id,
    MIN(s.login_at) AS first_login_at,
    MAX(s.login_at) AS last_login_at,
    MAX(s.logout_at) AS last_logout_at,
    MAX(s.last_seen_at) AS last_seen_at,
    BOOL_OR(s.currently_online) AS is_online,
    SUM(GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (s.effective_end - s.login_at)))))::BIGINT AS duty_seconds_today,
    JSONB_AGG(
      JSONB_BUILD_OBJECT(
        'loginAt', s.login_at,
        'logoutAt', CASE WHEN s.currently_online THEN NULL ELSE s.effective_end END,
        'durationSeconds', GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (s.effective_end - s.login_at))))::BIGINT,
        'isOnline', s.currently_online
      ) ORDER BY s.login_at
    ) AS sessions_today
  FROM scoped s
  GROUP BY s.doctor_id, s.staff_id, s.hospital_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.staff_login(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.staff_activity_heartbeat(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.staff_activity_logout(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_doctor_activity(UUID, DATE) TO anon, authenticated;

