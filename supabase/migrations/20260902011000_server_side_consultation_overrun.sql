-- Server-enforced OPD overrun protection.
-- An appointment left in in_consultation state progressively blocks immediate
-- future slots until the doctor explicitly ends the session.
BEGIN;

CREATE OR REPLACE FUNCTION public.is_slot_blocked_by_active_consultation(
  p_doctor_id TEXT,
  p_date DATE,
  p_time_24 TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_started_at TIMESTAMPTZ;
  v_elapsed INTERVAL;
  v_horizon INTERVAL;
  v_local_now TIMESTAMP := timezone('Asia/Kolkata', NOW());
  v_slot_at TIMESTAMP;
BEGIN
  IF p_date <> v_local_now::DATE THEN RETURN FALSE; END IF;

  SELECT MAX(COALESCE(updated_at, booked_at)) INTO v_started_at
    FROM public.appointments
   WHERE doctor_id = p_doctor_id AND date = p_date AND status = 'in_consultation';
  IF v_started_at IS NULL THEN RETURN FALSE; END IF;

  v_elapsed := NOW() - v_started_at;
  -- The existing OPD model expects roughly ten minutes per patient. Allow a
  -- small grace period before protecting the next slot.
  IF v_elapsed < INTERVAL '12 minutes' THEN RETURN FALSE; END IF;

  v_horizon := CASE
    WHEN v_elapsed >= INTERVAL '22 minutes' THEN INTERVAL '90 minutes'
    WHEN v_elapsed >= INTERVAL '15 minutes' THEN INTERVAL '60 minutes'
    ELSE INTERVAL '30 minutes'
  END;
  v_slot_at := p_date::TIMESTAMP + p_time_24::TIME;
  RETURN v_slot_at > v_local_now AND v_slot_at <= v_local_now + v_horizon;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_doctor_consultation(
  p_appointment_id UUID,
  p_doctor_id TEXT
) RETURNS public.appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_appointment public.appointments%ROWTYPE;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.appointments
     WHERE doctor_id = p_doctor_id AND status = 'in_consultation' AND id <> p_appointment_id
  ) THEN
    RAISE EXCEPTION 'Another consultation is still active. End it before starting the next patient.';
  END IF;

  UPDATE public.appointments
     SET status = 'in_consultation', updated_at = NOW()
   WHERE id = p_appointment_id AND doctor_id = p_doctor_id
     AND status NOT IN ('cancelled', 'completed')
  RETURNING * INTO v_appointment;
  IF NOT FOUND THEN RAISE EXCEPTION 'Appointment cannot be started'; END IF;

  UPDATE public.doctor_queue SET status = 'in_consultation'
   WHERE appointment_id = p_appointment_id;
  RETURN v_appointment;
END;
$$;

CREATE OR REPLACE FUNCTION public.end_doctor_consultation(
  p_appointment_id UUID,
  p_doctor_id TEXT
) RETURNS public.appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_appointment public.appointments%ROWTYPE;
BEGIN
  UPDATE public.appointments
     SET status = 'completed', updated_at = NOW()
   WHERE id = p_appointment_id AND doctor_id = p_doctor_id
     AND status = 'in_consultation'
  RETURNING * INTO v_appointment;
  IF NOT FOUND THEN RAISE EXCEPTION 'No active consultation found'; END IF;

  UPDATE public.doctor_queue SET status = 'completed'
   WHERE appointment_id = p_appointment_id;
  RETURN v_appointment;
END;
$$;

-- Add the server-side overrun gate to hold acquisition.
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
  IF p_date < timezone('Asia/Kolkata', NOW())::DATE THEN RAISE EXCEPTION 'Past slots cannot be held'; END IF;

  SELECT * INTO v_slot FROM public.slot_schedules
   WHERE doctor_id = p_doctor_id AND date = p_date AND time_24 = p_time_24 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Slot not found'; END IF;
  IF NOT v_slot.is_open THEN RAISE EXCEPTION 'Slot is closed'; END IF;
  IF public.is_slot_blocked_by_active_consultation(p_doctor_id, p_date, p_time_24) THEN
    RAISE EXCEPTION 'Doctor is still attending the current patient. Please choose a later slot.';
  END IF;

  DELETE FROM public.appointment_slot_holds WHERE expires_at <= NOW();
  DELETE FROM public.appointment_slot_holds WHERE patient_id = p_patient_id;
  SELECT COUNT(*) INTO v_booked FROM public.appointments
   WHERE doctor_id = p_doctor_id AND date = p_date AND time_24 = p_time_24 AND status <> 'cancelled';
  SELECT COUNT(*) INTO v_held FROM public.appointment_slot_holds
   WHERE doctor_id = p_doctor_id AND date = p_date AND time_24 = p_time_24 AND expires_at > NOW();
  IF v_booked + v_held >= v_slot.capacity THEN
    RAISE EXCEPTION 'This slot is fully booked or temporarily held by another patient';
  END IF;

  INSERT INTO public.appointment_slot_holds(patient_id, doctor_id, date, time_24, expires_at)
  VALUES (p_patient_id, p_doctor_id, p_date, p_time_24, NOW() + make_interval(secs => v_ttl))
  RETURNING * INTO v_hold;
  RETURN v_hold;
END;
$$;

DROP FUNCTION IF EXISTS public.get_appointment_slot_availability(TEXT,DATE,UUID);
CREATE FUNCTION public.get_appointment_slot_availability(
  p_doctor_id TEXT,
  p_date DATE,
  p_patient_id UUID DEFAULT NULL
) RETURNS TABLE(time_24 TEXT, booked_count BIGINT, active_hold_count BIGINT, slots_left INTEGER, consultation_blocked BOOLEAN)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT s.time_24,
         COUNT(a.id) FILTER (WHERE a.status <> 'cancelled') AS booked_count,
         (SELECT COUNT(*) FROM public.appointment_slot_holds h
           WHERE h.doctor_id=s.doctor_id AND h.date=s.date AND h.time_24=s.time_24
             AND h.expires_at>NOW() AND (p_patient_id IS NULL OR h.patient_id<>p_patient_id)) AS active_hold_count,
         CASE WHEN public.is_slot_blocked_by_active_consultation(s.doctor_id,s.date,s.time_24) THEN 0
              ELSE GREATEST(0, s.capacity
                - COUNT(a.id) FILTER (WHERE a.status <> 'cancelled')::INTEGER
                - (SELECT COUNT(*)::INTEGER FROM public.appointment_slot_holds h
                    WHERE h.doctor_id=s.doctor_id AND h.date=s.date AND h.time_24=s.time_24
                      AND h.expires_at>NOW() AND (p_patient_id IS NULL OR h.patient_id<>p_patient_id))) END AS slots_left,
         public.is_slot_blocked_by_active_consultation(s.doctor_id,s.date,s.time_24) AS consultation_blocked
    FROM public.slot_schedules s
    LEFT JOIN public.appointments a
      ON a.doctor_id=s.doctor_id AND a.date=s.date AND a.time_24=s.time_24
   WHERE s.doctor_id=p_doctor_id AND s.date=p_date
   GROUP BY s.doctor_id,s.date,s.time_24,s.capacity;
$$;

-- Final booking rechecks the overrun gate while holding the slot row lock.
CREATE OR REPLACE FUNCTION public.book_appointment(
  p_patient_id UUID, p_doctor_id TEXT, p_hospital_id TEXT, p_date DATE,
  p_time_24 TEXT, p_time_label TEXT, p_reason TEXT, p_hold_id UUID
) RETURNS public.appointments
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE
  v_slot public.slot_schedules%ROWTYPE; v_hold public.appointment_slot_holds%ROWTYPE;
  v_booked INTEGER; v_token_sequence BIGINT; v_token TEXT; v_appointment public.appointments%ROWTYPE;
BEGIN
  SELECT * INTO v_slot FROM public.slot_schedules
   WHERE doctor_id=p_doctor_id AND date=p_date AND time_24=p_time_24 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Slot not found'; END IF;
  IF NOT v_slot.is_open THEN RAISE EXCEPTION 'Slot is closed'; END IF;
  IF public.is_slot_blocked_by_active_consultation(p_doctor_id,p_date,p_time_24) THEN
    RAISE EXCEPTION 'Doctor is still attending the current patient. Please choose a later slot.';
  END IF;
  DELETE FROM public.appointment_slot_holds WHERE expires_at<=NOW();
  SELECT * INTO v_hold FROM public.appointment_slot_holds
   WHERE id=p_hold_id AND patient_id=p_patient_id AND doctor_id=p_doctor_id
     AND date=p_date AND time_24=p_time_24 AND expires_at>NOW() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'A valid temporary slot hold is required'; END IF;
  SELECT COUNT(*) INTO v_booked FROM public.appointments
   WHERE doctor_id=p_doctor_id AND date=p_date AND time_24=p_time_24 AND status<>'cancelled';
  IF v_booked>=v_slot.capacity THEN RAISE EXCEPTION 'Slot is fully booked'; END IF;
  INSERT INTO public.appointment_token_counters(token_date,last_value,updated_at) VALUES(p_date,1,NOW())
  ON CONFLICT(token_date) DO UPDATE SET last_value=public.appointment_token_counters.last_value+1,updated_at=NOW()
  RETURNING last_value INTO v_token_sequence;
  v_token:='APT-'||TO_CHAR(p_date,'YYYYMMDD')||'-'||LPAD(v_token_sequence::TEXT,GREATEST(3,LENGTH(v_token_sequence::TEXT)),'0');
  INSERT INTO public.appointments(patient_id,doctor_id,hospital_id,date,time_24,time_label,token_number,reason,status)
  VALUES(p_patient_id,p_doctor_id,p_hospital_id,p_date,p_time_24,p_time_label,v_token,p_reason,'confirmed')
  RETURNING * INTO v_appointment;
  INSERT INTO public.doctor_queue(appointment_id,doctor_id,date,queue_position,status)
  VALUES(v_appointment.id,p_doctor_id,p_date,v_token_sequence::INTEGER,'waiting');
  DELETE FROM public.appointment_slot_holds WHERE id=v_hold.id;
  RETURN v_appointment;
END;
$$;

REVOKE ALL ON FUNCTION public.is_slot_blocked_by_active_consultation(TEXT,DATE,TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.start_doctor_consultation(UUID,TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.end_doctor_consultation(UUID,TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_appointment_slot_availability(TEXT,DATE,UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_slot_blocked_by_active_consultation(TEXT,DATE,TEXT) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.start_doctor_consultation(UUID,TEXT) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.end_doctor_consultation(UUID,TEXT) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_appointment_slot_availability(TEXT,DATE,UUID) TO anon,authenticated;

COMMIT;
