-- Server-side appointment hold gateway.
-- Every contender for a doctor/date/time is serialized by locking the
-- slot_schedules row. A confirmed appointment can only be created by
-- consuming an unexpired hold owned by that patient.
BEGIN;

CREATE TABLE IF NOT EXISTS public.appointment_slot_holds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL,
  doctor_id   TEXT NOT NULL,
  date        DATE NOT NULL,
  time_24     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL,
  CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_appointment_slot_holds_slot
  ON public.appointment_slot_holds(doctor_id, date, time_24, expires_at);
CREATE INDEX IF NOT EXISTS idx_appointment_slot_holds_patient
  ON public.appointment_slot_holds(patient_id, expires_at);

ALTER TABLE public.appointment_slot_holds ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.appointment_slot_holds FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.acquire_appointment_slot_hold(
  p_patient_id UUID,
  p_doctor_id TEXT,
  p_date DATE,
  p_time_24 TEXT,
  p_ttl_seconds INTEGER DEFAULT 300
) RETURNS public.appointment_slot_holds
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot public.slot_schedules%ROWTYPE;
  v_booked INTEGER;
  v_held INTEGER;
  v_hold public.appointment_slot_holds%ROWTYPE;
  v_ttl INTEGER := LEAST(600, GREATEST(60, COALESCE(p_ttl_seconds, 300)));
BEGIN
  IF p_patient_id IS NULL THEN RAISE EXCEPTION 'Patient is required'; END IF;
  IF p_date < CURRENT_DATE THEN RAISE EXCEPTION 'Past slots cannot be held'; END IF;

  SELECT * INTO v_slot
    FROM public.slot_schedules
   WHERE doctor_id = p_doctor_id AND date = p_date AND time_24 = p_time_24
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Slot not found'; END IF;
  IF NOT v_slot.is_open THEN RAISE EXCEPTION 'Slot is closed'; END IF;

  DELETE FROM public.appointment_slot_holds WHERE expires_at <= NOW();
  -- A patient may hold only one choice at a time.
  DELETE FROM public.appointment_slot_holds WHERE patient_id = p_patient_id;

  SELECT COUNT(*) INTO v_booked
    FROM public.appointments
   WHERE doctor_id = p_doctor_id AND date = p_date AND time_24 = p_time_24
     AND status <> 'cancelled';

  SELECT COUNT(*) INTO v_held
    FROM public.appointment_slot_holds
   WHERE doctor_id = p_doctor_id AND date = p_date AND time_24 = p_time_24
     AND expires_at > NOW();

  IF v_booked + v_held >= v_slot.capacity THEN
    RAISE EXCEPTION 'This slot is fully booked or temporarily held by another patient';
  END IF;

  INSERT INTO public.appointment_slot_holds(patient_id, doctor_id, date, time_24, expires_at)
  VALUES (p_patient_id, p_doctor_id, p_date, p_time_24, NOW() + make_interval(secs => v_ttl))
  RETURNING * INTO v_hold;
  RETURN v_hold;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_appointment_slot_hold(
  p_hold_id UUID,
  p_patient_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.appointment_slot_holds
   WHERE id = p_hold_id AND patient_id = p_patient_id;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_appointment_slot_availability(
  p_doctor_id TEXT,
  p_date DATE,
  p_patient_id UUID DEFAULT NULL
) RETURNS TABLE(time_24 TEXT, booked_count BIGINT, active_hold_count BIGINT, slots_left INTEGER)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT s.time_24,
         COUNT(a.id) FILTER (WHERE a.status <> 'cancelled') AS booked_count,
         (SELECT COUNT(*)
            FROM public.appointment_slot_holds h
           WHERE h.doctor_id = s.doctor_id AND h.date = s.date AND h.time_24 = s.time_24
             AND h.expires_at > NOW()
             AND (p_patient_id IS NULL OR h.patient_id <> p_patient_id)) AS active_hold_count,
         GREATEST(0, s.capacity
           - COUNT(a.id) FILTER (WHERE a.status <> 'cancelled')::INTEGER
           - (SELECT COUNT(*)::INTEGER
                FROM public.appointment_slot_holds h
               WHERE h.doctor_id = s.doctor_id AND h.date = s.date AND h.time_24 = s.time_24
                 AND h.expires_at > NOW()
                 AND (p_patient_id IS NULL OR h.patient_id <> p_patient_id))) AS slots_left
    FROM public.slot_schedules s
    LEFT JOIN public.appointments a
      ON a.doctor_id = s.doctor_id AND a.date = s.date AND a.time_24 = s.time_24
   WHERE s.doctor_id = p_doctor_id AND s.date = p_date
   GROUP BY s.doctor_id, s.date, s.time_24, s.capacity;
$$;

DROP FUNCTION IF EXISTS public.book_appointment(UUID,TEXT,TEXT,DATE,TEXT,TEXT,TEXT);

CREATE FUNCTION public.book_appointment(
  p_patient_id UUID,
  p_doctor_id TEXT,
  p_hospital_id TEXT,
  p_date DATE,
  p_time_24 TEXT,
  p_time_label TEXT,
  p_reason TEXT,
  p_hold_id UUID
) RETURNS public.appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot public.slot_schedules%ROWTYPE;
  v_hold public.appointment_slot_holds%ROWTYPE;
  v_booked INTEGER;
  v_token_sequence BIGINT;
  v_token TEXT;
  v_appointment public.appointments%ROWTYPE;
BEGIN
  SELECT * INTO v_slot FROM public.slot_schedules
   WHERE doctor_id = p_doctor_id AND date = p_date AND time_24 = p_time_24
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Slot not found'; END IF;
  IF NOT v_slot.is_open THEN RAISE EXCEPTION 'Slot is closed'; END IF;

  DELETE FROM public.appointment_slot_holds WHERE expires_at <= NOW();
  SELECT * INTO v_hold FROM public.appointment_slot_holds
   WHERE id = p_hold_id AND patient_id = p_patient_id
     AND doctor_id = p_doctor_id AND date = p_date AND time_24 = p_time_24
     AND expires_at > NOW()
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'A valid temporary slot hold is required'; END IF;

  SELECT COUNT(*) INTO v_booked FROM public.appointments
   WHERE doctor_id = p_doctor_id AND date = p_date AND time_24 = p_time_24
     AND status <> 'cancelled';
  IF v_booked >= v_slot.capacity THEN RAISE EXCEPTION 'Slot is fully booked'; END IF;

  INSERT INTO public.appointment_token_counters(token_date, last_value, updated_at)
  VALUES (p_date, 1, NOW())
  ON CONFLICT(token_date) DO UPDATE
    SET last_value = public.appointment_token_counters.last_value + 1, updated_at = NOW()
  RETURNING last_value INTO v_token_sequence;

  v_token := 'APT-' || TO_CHAR(p_date, 'YYYYMMDD') || '-' ||
    LPAD(v_token_sequence::TEXT, GREATEST(3, LENGTH(v_token_sequence::TEXT)), '0');

  INSERT INTO public.appointments
    (patient_id, doctor_id, hospital_id, date, time_24, time_label, token_number, reason, status)
  VALUES
    (p_patient_id, p_doctor_id, p_hospital_id, p_date, p_time_24, p_time_label, v_token, p_reason, 'confirmed')
  RETURNING * INTO v_appointment;

  INSERT INTO public.doctor_queue(appointment_id, doctor_id, date, queue_position, status)
  VALUES(v_appointment.id, p_doctor_id, p_date, v_token_sequence::INTEGER, 'waiting');

  DELETE FROM public.appointment_slot_holds WHERE id = v_hold.id;
  RETURN v_appointment;
END;
$$;

REVOKE ALL ON FUNCTION public.acquire_appointment_slot_hold(UUID,TEXT,DATE,TEXT,INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_appointment_slot_hold(UUID,UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_appointment_slot_availability(TEXT,DATE,UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.book_appointment(UUID,TEXT,TEXT,DATE,TEXT,TEXT,TEXT,UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.acquire_appointment_slot_hold(UUID,TEXT,DATE,TEXT,INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_appointment_slot_hold(UUID,UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_appointment_slot_availability(TEXT,DATE,UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_appointment(UUID,TEXT,TEXT,DATE,TEXT,TEXT,TEXT,UUID) TO anon, authenticated;

COMMIT;
