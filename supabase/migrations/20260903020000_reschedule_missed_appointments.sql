-- Atomically move a patient's missed appointment to a newly selected slot.
-- The existing appointment is updated so history, reports, and consultation
-- links remain attached to the same durable record.
BEGIN;

CREATE OR REPLACE FUNCTION public.reschedule_missed_appointment(
  p_appointment_id UUID,
  p_patient_id UUID,
  p_date DATE,
  p_time_24 TEXT,
  p_time_label TEXT
) RETURNS public.appointments
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE
  v_appointment public.appointments%ROWTYPE;
  v_slot public.slot_schedules%ROWTYPE;
  v_booked INTEGER;
  v_token_sequence BIGINT;
  v_token TEXT;
  v_local_now TIMESTAMP:=timezone('Asia/Kolkata',NOW());
  v_previous_time TIMESTAMP;
BEGIN
  IF p_appointment_id IS NULL OR p_patient_id IS NULL OR p_date IS NULL OR
     p_time_24 IS NULL OR p_time_label IS NULL THEN
    RAISE EXCEPTION 'Appointment, patient, date, and time are required';
  END IF;

  SELECT * INTO v_appointment
    FROM public.appointments
   WHERE id=p_appointment_id AND patient_id=p_patient_id
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Appointment not found'; END IF;

  v_previous_time:=v_appointment.date::TIMESTAMP+v_appointment.time_24::TIME;
  IF v_appointment.status NOT IN ('confirmed','no_show') OR
     (v_appointment.status='confirmed' AND v_previous_time>v_local_now) THEN
    RAISE EXCEPTION 'Only a missed appointment can be rescheduled';
  END IF;

  SELECT * INTO v_slot
    FROM public.slot_schedules
   WHERE doctor_id=v_appointment.doctor_id AND date=p_date AND time_24=p_time_24
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Slot not found'; END IF;
  IF NOT v_slot.is_open THEN RAISE EXCEPTION 'Slot is closed'; END IF;
  IF p_date<v_local_now::DATE OR
     (p_date=v_local_now::DATE AND p_time_24::TIME<=v_local_now::TIME) THEN
    RAISE EXCEPTION 'This appointment time has already passed';
  END IF;
  IF public.is_slot_blocked_by_active_consultation(v_appointment.doctor_id,p_date,p_time_24) THEN
    RAISE EXCEPTION 'Doctor is still attending the current patient. Please choose a later slot.';
  END IF;

  IF EXISTS(
    SELECT 1 FROM public.appointments
     WHERE id<>p_appointment_id AND patient_id=p_patient_id
       AND doctor_id=v_appointment.doctor_id AND date=p_date
       AND time_24=p_time_24 AND status<>'cancelled'
  ) THEN
    RAISE EXCEPTION 'You already have an appointment with this doctor at that time';
  END IF;

  SELECT COUNT(*) INTO v_booked
    FROM public.appointments
   WHERE id<>p_appointment_id AND doctor_id=v_appointment.doctor_id
     AND date=p_date AND time_24=p_time_24 AND status<>'cancelled';
  IF v_booked>=v_slot.capacity THEN
    RAISE EXCEPTION 'This slot was just filled. Please choose another available time.';
  END IF;

  INSERT INTO public.appointment_token_counters(token_date,last_value,updated_at)
  VALUES(p_date,1,NOW())
  ON CONFLICT(token_date) DO UPDATE
    SET last_value=public.appointment_token_counters.last_value+1,updated_at=NOW()
  RETURNING last_value INTO v_token_sequence;
  v_token:='APT-'||TO_CHAR(p_date,'YYYYMMDD')||'-'||
    LPAD(v_token_sequence::TEXT,GREATEST(3,LENGTH(v_token_sequence::TEXT)),'0');

  UPDATE public.appointments
     SET date=p_date,
         time_24=p_time_24,
         time_label=p_time_label,
         token_number=v_token,
         status='confirmed',
         updated_at=NOW()
   WHERE id=p_appointment_id
   RETURNING * INTO v_appointment;

  UPDATE public.doctor_queue
     SET date=p_date,queue_position=v_token_sequence::INTEGER,
         status='waiting',checked_in_at=NULL
   WHERE appointment_id=p_appointment_id;
  IF NOT FOUND THEN
    INSERT INTO public.doctor_queue(appointment_id,doctor_id,date,queue_position,status)
    VALUES(p_appointment_id,v_appointment.doctor_id,p_date,v_token_sequence::INTEGER,'waiting');
  END IF;

  RETURN v_appointment;
END;
$$;

REVOKE ALL ON FUNCTION public.reschedule_missed_appointment(UUID,UUID,DATE,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reschedule_missed_appointment(UUID,UUID,DATE,TEXT,TEXT) TO anon,authenticated;

COMMIT;
