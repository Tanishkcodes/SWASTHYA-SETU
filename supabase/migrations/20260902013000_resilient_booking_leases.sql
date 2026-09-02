-- Resilient booking leases: renewable checkout holds plus idempotent booking.
BEGIN;

ALTER TABLE public.appointment_slot_holds
  ADD COLUMN IF NOT EXISTS renewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS max_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS client_request_id UUID;

UPDATE public.appointment_slot_holds
   SET renewed_at = COALESCE(renewed_at, created_at),
       max_expires_at = COALESCE(max_expires_at, created_at + INTERVAL '30 minutes'),
       client_request_id = COALESCE(client_request_id, gen_random_uuid())
 WHERE renewed_at IS NULL OR max_expires_at IS NULL OR client_request_id IS NULL;

ALTER TABLE public.appointment_slot_holds
  ALTER COLUMN renewed_at SET DEFAULT NOW(),
  ALTER COLUMN renewed_at SET NOT NULL,
  ALTER COLUMN max_expires_at SET NOT NULL,
  ALTER COLUMN client_request_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_slot_hold_client_request
  ON public.appointment_slot_holds(client_request_id);

ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS booking_request_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS uq_appointment_booking_request
  ON public.appointments(booking_request_id) WHERE booking_request_id IS NOT NULL;

DROP FUNCTION IF EXISTS public.acquire_appointment_slot_hold(UUID,TEXT,DATE,TEXT,INTEGER);
CREATE FUNCTION public.acquire_appointment_slot_hold(
  p_patient_id UUID,
  p_doctor_id TEXT,
  p_date DATE,
  p_time_24 TEXT,
  p_client_request_id UUID,
  p_ttl_seconds INTEGER DEFAULT 600,
  p_max_lifetime_seconds INTEGER DEFAULT 1800
) RETURNS public.appointment_slot_holds
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE
  v_slot public.slot_schedules%ROWTYPE; v_booked INTEGER; v_held INTEGER;
  v_hold public.appointment_slot_holds%ROWTYPE;
  v_ttl INTEGER:=LEAST(900,GREATEST(120,COALESCE(p_ttl_seconds,600)));
  v_max_lifetime INTEGER:=LEAST(3600,GREATEST(v_ttl,COALESCE(p_max_lifetime_seconds,1800)));
BEGIN
  IF p_patient_id IS NULL OR p_client_request_id IS NULL THEN RAISE EXCEPTION 'Patient and request ID are required'; END IF;
  IF p_date<timezone('Asia/Kolkata',NOW())::DATE THEN RAISE EXCEPTION 'Past slots cannot be held'; END IF;

  SELECT * INTO v_slot FROM public.slot_schedules
   WHERE doctor_id=p_doctor_id AND date=p_date AND time_24=p_time_24 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Slot not found'; END IF;
  IF NOT v_slot.is_open THEN RAISE EXCEPTION 'Slot is closed'; END IF;
  IF public.is_slot_blocked_by_active_consultation(p_doctor_id,p_date,p_time_24) THEN
    RAISE EXCEPTION 'Doctor is still attending the current patient. Please choose a later slot.';
  END IF;

  DELETE FROM public.appointment_slot_holds WHERE expires_at<=NOW();
  -- Exact retries return the same lease instead of consuming capacity twice.
  SELECT * INTO v_hold FROM public.appointment_slot_holds
   WHERE client_request_id=p_client_request_id AND patient_id=p_patient_id
     AND doctor_id=p_doctor_id AND date=p_date AND time_24=p_time_24 AND expires_at>NOW();
  IF FOUND THEN RETURN v_hold; END IF;

  DELETE FROM public.appointment_slot_holds WHERE patient_id=p_patient_id;
  SELECT COUNT(*) INTO v_booked FROM public.appointments
   WHERE doctor_id=p_doctor_id AND date=p_date AND time_24=p_time_24 AND status<>'cancelled';
  SELECT COUNT(*) INTO v_held FROM public.appointment_slot_holds
   WHERE doctor_id=p_doctor_id AND date=p_date AND time_24=p_time_24 AND expires_at>NOW();
  IF v_booked+v_held>=v_slot.capacity THEN
    RAISE EXCEPTION 'This slot is fully booked or temporarily held by another patient';
  END IF;

  INSERT INTO public.appointment_slot_holds
    (patient_id,doctor_id,date,time_24,expires_at,max_expires_at,renewed_at,client_request_id)
  VALUES
    (p_patient_id,p_doctor_id,p_date,p_time_24,NOW()+make_interval(secs=>v_ttl),
     NOW()+make_interval(secs=>v_max_lifetime),NOW(),p_client_request_id)
  RETURNING * INTO v_hold;
  RETURN v_hold;
END;
$$;

CREATE OR REPLACE FUNCTION public.renew_appointment_slot_hold(
  p_hold_id UUID,
  p_patient_id UUID,
  p_ttl_seconds INTEGER DEFAULT 600
) RETURNS public.appointment_slot_holds
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE
  v_hold public.appointment_slot_holds%ROWTYPE;
  v_slot public.slot_schedules%ROWTYPE;
  v_ttl INTEGER:=LEAST(900,GREATEST(120,COALESCE(p_ttl_seconds,600)));
BEGIN
  SELECT * INTO v_hold FROM public.appointment_slot_holds
   WHERE id=p_hold_id AND patient_id=p_patient_id FOR UPDATE;
  IF NOT FOUND OR v_hold.expires_at<=NOW() THEN RAISE EXCEPTION 'Temporary slot hold has expired'; END IF;
  IF v_hold.max_expires_at<=NOW() THEN RAISE EXCEPTION 'Maximum booking time reached; please select the slot again'; END IF;

  SELECT * INTO v_slot FROM public.slot_schedules
   WHERE doctor_id=v_hold.doctor_id AND date=v_hold.date AND time_24=v_hold.time_24 FOR UPDATE;
  IF NOT FOUND OR NOT v_slot.is_open THEN RAISE EXCEPTION 'Slot is no longer available'; END IF;
  IF public.is_slot_blocked_by_active_consultation(v_hold.doctor_id,v_hold.date,v_hold.time_24) THEN
    RAISE EXCEPTION 'Doctor is still attending the current patient. Please choose a later slot.';
  END IF;

  UPDATE public.appointment_slot_holds
     SET expires_at=LEAST(NOW()+make_interval(secs=>v_ttl),max_expires_at), renewed_at=NOW()
   WHERE id=v_hold.id RETURNING * INTO v_hold;
  RETURN v_hold;
END;
$$;

DROP FUNCTION IF EXISTS public.book_appointment(UUID,TEXT,TEXT,DATE,TEXT,TEXT,TEXT,UUID);
CREATE FUNCTION public.book_appointment(
  p_patient_id UUID, p_doctor_id TEXT, p_hospital_id TEXT, p_date DATE,
  p_time_24 TEXT, p_time_label TEXT, p_reason TEXT, p_hold_id UUID,
  p_booking_request_id UUID
) RETURNS public.appointments
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE
  v_slot public.slot_schedules%ROWTYPE; v_hold public.appointment_slot_holds%ROWTYPE;
  v_booked INTEGER; v_token_sequence BIGINT; v_token TEXT; v_appointment public.appointments%ROWTYPE;
BEGIN
  IF p_booking_request_id IS NULL THEN RAISE EXCEPTION 'Booking request ID is required'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_booking_request_id::TEXT,0));
  SELECT * INTO v_appointment FROM public.appointments
   WHERE booking_request_id=p_booking_request_id AND patient_id=p_patient_id;
  IF FOUND THEN RETURN v_appointment; END IF;

  SELECT * INTO v_slot FROM public.slot_schedules
   WHERE doctor_id=p_doctor_id AND date=p_date AND time_24=p_time_24 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Slot not found'; END IF;
  IF NOT v_slot.is_open THEN RAISE EXCEPTION 'Slot is closed'; END IF;

  -- Different request IDs still cannot give one patient duplicate appointments.
  SELECT * INTO v_appointment FROM public.appointments
   WHERE patient_id=p_patient_id AND doctor_id=p_doctor_id AND date=p_date
     AND time_24=p_time_24 AND status<>'cancelled' ORDER BY booked_at LIMIT 1;
  IF FOUND THEN RETURN v_appointment; END IF;

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
  INSERT INTO public.appointments
    (patient_id,doctor_id,hospital_id,date,time_24,time_label,token_number,reason,status,booking_request_id)
  VALUES
    (p_patient_id,p_doctor_id,p_hospital_id,p_date,p_time_24,p_time_label,v_token,p_reason,'confirmed',p_booking_request_id)
  RETURNING * INTO v_appointment;
  INSERT INTO public.doctor_queue(appointment_id,doctor_id,date,queue_position,status)
  VALUES(v_appointment.id,p_doctor_id,p_date,v_token_sequence::INTEGER,'waiting');
  DELETE FROM public.appointment_slot_holds WHERE id=v_hold.id;
  RETURN v_appointment;
END;
$$;

REVOKE ALL ON FUNCTION public.acquire_appointment_slot_hold(UUID,TEXT,DATE,TEXT,UUID,INTEGER,INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.renew_appointment_slot_hold(UUID,UUID,INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.book_appointment(UUID,TEXT,TEXT,DATE,TEXT,TEXT,TEXT,UUID,UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.acquire_appointment_slot_hold(UUID,TEXT,DATE,TEXT,UUID,INTEGER,INTEGER) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.renew_appointment_slot_hold(UUID,UUID,INTEGER) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.book_appointment(UUID,TEXT,TEXT,DATE,TEXT,TEXT,TEXT,UUID,UUID) TO anon,authenticated;

COMMIT;
