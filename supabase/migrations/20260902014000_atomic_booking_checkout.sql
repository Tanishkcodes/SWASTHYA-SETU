-- Giant-site style optimistic selection and atomic final checkout.
-- Browsing/intake never reserves inventory. The slot row is locked only for
-- the final transaction, which rechecks capacity and commits exactly once.
BEGIN;

-- Retire outstanding leases from the earlier checkout model and prevent new
-- browser callers from creating long-lived capacity reservations.
DELETE FROM public.appointment_slot_holds;
REVOKE EXECUTE ON FUNCTION public.acquire_appointment_slot_hold(UUID,TEXT,DATE,TEXT,UUID,INTEGER,INTEGER) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.renew_appointment_slot_hold(UUID,UUID,INTEGER) FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.book_appointment(
  p_patient_id UUID, p_doctor_id TEXT, p_hospital_id TEXT, p_date DATE,
  p_time_24 TEXT, p_time_label TEXT, p_reason TEXT, p_hold_id UUID,
  p_booking_request_id UUID
) RETURNS public.appointments
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE
  v_slot public.slot_schedules%ROWTYPE;
  v_booked INTEGER;
  v_token_sequence BIGINT;
  v_token TEXT;
  v_appointment public.appointments%ROWTYPE;
  v_local_now TIMESTAMP:=timezone('Asia/Kolkata',NOW());
BEGIN
  IF p_patient_id IS NULL OR p_booking_request_id IS NULL THEN
    RAISE EXCEPTION 'Patient and booking request ID are required';
  END IF;

  -- The request identity serializes double-clicks and network retries even
  -- before the slot row lock is acquired.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_booking_request_id::TEXT,0));
  SELECT * INTO v_appointment FROM public.appointments
   WHERE booking_request_id=p_booking_request_id AND patient_id=p_patient_id;
  IF FOUND THEN RETURN v_appointment; END IF;

  -- Every final contender for the same inventory row queues here. This makes
  -- capacity checking and insertion one atomic operation across all devices.
  SELECT * INTO v_slot FROM public.slot_schedules
   WHERE doctor_id=p_doctor_id AND date=p_date AND time_24=p_time_24 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Slot not found'; END IF;
  IF NOT v_slot.is_open THEN RAISE EXCEPTION 'Slot is closed'; END IF;
  IF p_date<v_local_now::DATE OR
     (p_date=v_local_now::DATE AND p_time_24::TIME<=v_local_now::TIME) THEN
    RAISE EXCEPTION 'This appointment time has already passed';
  END IF;

  -- A changed request ID must still never create a duplicate appointment for
  -- the same patient and exact slot.
  SELECT * INTO v_appointment FROM public.appointments
   WHERE patient_id=p_patient_id AND doctor_id=p_doctor_id AND date=p_date
     AND time_24=p_time_24 AND status<>'cancelled' ORDER BY booked_at LIMIT 1;
  IF FOUND THEN RETURN v_appointment; END IF;

  IF public.is_slot_blocked_by_active_consultation(p_doctor_id,p_date,p_time_24) THEN
    RAISE EXCEPTION 'Doctor is still attending the current patient. Please choose a later slot.';
  END IF;

  SELECT COUNT(*) INTO v_booked FROM public.appointments
   WHERE doctor_id=p_doctor_id AND date=p_date AND time_24=p_time_24 AND status<>'cancelled';
  IF v_booked>=v_slot.capacity THEN
    RAISE EXCEPTION 'This slot was just filled. Please choose another available time.';
  END IF;

  INSERT INTO public.appointment_token_counters(token_date,last_value,updated_at) VALUES(p_date,1,NOW())
  ON CONFLICT(token_date) DO UPDATE
    SET last_value=public.appointment_token_counters.last_value+1,updated_at=NOW()
  RETURNING last_value INTO v_token_sequence;
  v_token:='APT-'||TO_CHAR(p_date,'YYYYMMDD')||'-'||LPAD(v_token_sequence::TEXT,GREATEST(3,LENGTH(v_token_sequence::TEXT)),'0');

  INSERT INTO public.appointments
    (patient_id,doctor_id,hospital_id,date,time_24,time_label,token_number,reason,status,booking_request_id)
  VALUES
    (p_patient_id,p_doctor_id,p_hospital_id,p_date,p_time_24,p_time_label,v_token,p_reason,'confirmed',p_booking_request_id)
  RETURNING * INTO v_appointment;
  INSERT INTO public.doctor_queue(appointment_id,doctor_id,date,queue_position,status)
  VALUES(v_appointment.id,p_doctor_id,p_date,v_token_sequence::INTEGER,'waiting');
  RETURN v_appointment;
END;
$$;

COMMIT;
