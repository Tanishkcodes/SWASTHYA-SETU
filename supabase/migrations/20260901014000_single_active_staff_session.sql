-- Prevent duplicated duty duration when the same staff account signs in again.
CREATE OR REPLACE FUNCTION public.close_previous_staff_portal_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.staff_portal_sessions
  SET logout_at = GREATEST(login_at, last_seen_at),
      logout_reason = 'superseded_by_new_login'
  WHERE staff_id = NEW.staff_id
    AND logout_at IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_single_active_staff_portal_session ON public.staff_portal_sessions;
CREATE TRIGGER trg_single_active_staff_portal_session
BEFORE INSERT ON public.staff_portal_sessions
FOR EACH ROW EXECUTE FUNCTION public.close_previous_staff_portal_sessions();

