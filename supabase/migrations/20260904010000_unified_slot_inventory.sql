BEGIN;

-- Replace the old random 2-4 patient generator with one configurable baseline.
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS capacity_per_slot INTEGER NOT NULL DEFAULT 6 CHECK (capacity_per_slot BETWEEN 1 AND 30);
ALTER TABLE public.slot_schedules ALTER COLUMN capacity SET DEFAULT 6;
-- Existing generated low-capacity windows used random values, not a pacing rule.
-- Keep closed windows closed and retain higher capacities. Subsequent per-slot
-- edits are authoritative; the client must never silently increase them.
UPDATE public.slot_schedules s SET capacity = d.capacity_per_slot
FROM public.doctors d WHERE s.doctor_id=d.id AND s.date>=timezone('Asia/Kolkata',now())::date
AND s.is_open AND s.capacity BETWEEN 2 AND 4;

CREATE OR REPLACE FUNCTION public.generate_doctor_slots(p_doctor_id TEXT,p_date DATE)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_capacity INTEGER; v_min INTEGER; v_time TIME; v_session TEXT;
BEGIN
  SELECT capacity_per_slot INTO v_capacity FROM public.doctors WHERE id=p_doctor_id AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Doctor is unavailable'; END IF;
  FOR v_min IN 0..20 LOOP
    v_time := TIME '09:00' + make_interval(mins=>v_min*30);
    v_session := CASE WHEN v_time<TIME '12:30' THEN 'morning' WHEN v_time<TIME '16:00' THEN 'afternoon' ELSE 'evening' END;
    INSERT INTO public.slot_schedules(doctor_id,date,time_24,time_label,session,capacity,is_open)
    VALUES(p_doctor_id,p_date,to_char(v_time,'HH24:MI'),to_char(v_time,'HH12:MI AM'),v_session,v_capacity,true)
    ON CONFLICT(doctor_id,date,time_24) DO NOTHING;
  END LOOP;
END; $$;

ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS consultation_started_at TIMESTAMPTZ;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS consultation_ended_at TIMESTAMPTZ;
UPDATE public.appointments SET consultation_started_at=COALESCE(updated_at,booked_at)
WHERE status='in_consultation' AND consultation_started_at IS NULL;

CREATE OR REPLACE FUNCTION public.track_consultation_clock() RETURNS trigger
LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.status='in_consultation' THEN
    IF TG_OP='UPDATE' AND OLD.status='in_consultation' THEN
      NEW.consultation_started_at:=OLD.consultation_started_at;
    ELSE
      NEW.consultation_started_at:=now(); NEW.consultation_ended_at:=NULL;
    END IF;
  ELSIF TG_OP='UPDATE' AND OLD.status='in_consultation' THEN
    NEW.consultation_ended_at:=now();
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER consultation_clock BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.track_consultation_clock();

-- Competing doctor sessions cannot start two consultations simultaneously.
CREATE UNIQUE INDEX IF NOT EXISTS one_active_consultation_per_doctor
ON public.appointments(doctor_id) WHERE status='in_consultation';

CREATE OR REPLACE FUNCTION public.consultation_overrun_minutes(p_started TIMESTAMPTZ,p_capacity INTEGER,p_now TIMESTAMPTZ DEFAULT now())
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN p_started IS NULL OR extract(epoch FROM p_now-p_started)/60 < 30.0/GREATEST(1,p_capacity)+2 THEN 0
    ELSE LEAST(90,CEIL(30+extract(epoch FROM p_now-p_started)/60-30.0/GREATEST(1,p_capacity))::INTEGER) END;
$$;

CREATE OR REPLACE FUNCTION public.is_slot_blocked_by_active_consultation(p_doctor_id TEXT,p_date DATE,p_time_24 TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path=public STABLE AS $$
DECLARE v_started TIMESTAMPTZ; v_expected NUMERIC; v_elapsed NUMERIC;
  v_now TIMESTAMP:=timezone('Asia/Kolkata',now()); v_horizon INTERVAL;
BEGIN
  IF p_date<>v_now::DATE THEN RETURN FALSE; END IF;
  SELECT a.consultation_started_at,30.0/GREATEST(1,COALESCE(s.capacity,d.capacity_per_slot,6))
  INTO v_started,v_expected FROM public.appointments a
  JOIN public.doctors d ON d.id=a.doctor_id
  LEFT JOIN public.slot_schedules s ON s.doctor_id=a.doctor_id AND s.date=a.date AND s.time_24=a.time_24
  WHERE a.doctor_id=p_doctor_id AND a.status='in_consultation' LIMIT 1;
  IF v_started IS NULL THEN RETURN FALSE; END IF;
  v_elapsed:=extract(epoch FROM now()-v_started)/60;
  IF v_elapsed<v_expected+2 THEN RETURN FALSE; END IF;
  v_horizon:=make_interval(mins=>public.consultation_overrun_minutes(v_started,round(30/v_expected)::INTEGER,now()));
  RETURN p_date+p_time_24::TIME>v_now AND p_date+p_time_24::TIME<=v_now+v_horizon;
END; $$;

-- Shared capacity enforcement also protects legacy/direct writers and rescheduling.
CREATE OR REPLACE FUNCTION public.enforce_slot_inventory() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_slot public.slot_schedules%ROWTYPE; v_count INTEGER;
BEGIN
  IF NEW.status='cancelled' THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' AND OLD.status<>'cancelled' AND
    (OLD.doctor_id,OLD.date,OLD.time_24) IS NOT DISTINCT FROM (NEW.doctor_id,NEW.date,NEW.time_24) THEN RETURN NEW; END IF;
  SELECT * INTO v_slot FROM public.slot_schedules
  WHERE doctor_id=NEW.doctor_id AND date=NEW.date AND time_24=NEW.time_24 FOR UPDATE;
  IF NOT FOUND OR NOT v_slot.is_open THEN RAISE EXCEPTION 'Slot is closed or unavailable'; END IF;
  IF NEW.date+NEW.time_24::TIME<=timezone('Asia/Kolkata',now()) THEN RAISE EXCEPTION 'This appointment time has already passed'; END IF;
  IF public.is_slot_blocked_by_active_consultation(NEW.doctor_id,NEW.date,NEW.time_24) THEN RAISE EXCEPTION 'Doctor consultation is running late. Choose a later time.'; END IF;
  SELECT count(*) INTO v_count FROM public.appointments
  WHERE doctor_id=NEW.doctor_id AND date=NEW.date AND time_24=NEW.time_24 AND status<>'cancelled' AND id<>NEW.id;
  IF v_count>=v_slot.capacity THEN RAISE EXCEPTION 'This slot was just filled. Please select another time.'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER enforce_shared_slot_inventory BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.enforce_slot_inventory();

CREATE OR REPLACE FUNCTION public.get_booking_slots(p_doctor_id TEXT,p_date DATE)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_slots JSONB; v_now TIMESTAMP:=timezone('Asia/Kolkata',now());
BEGIN
  IF p_date<v_now::DATE OR p_date>v_now::DATE+366 THEN RAISE EXCEPTION 'Select a date within the next year'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.slot_schedules WHERE doctor_id=p_doctor_id AND date=p_date) THEN
    PERFORM public.generate_doctor_slots(p_doctor_id,p_date);
  END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'time24',s.time_24,'label',s.time_label,'session',s.session,'capacity',s.capacity,
    'booked',a.booked,'slotsLeft',CASE WHEN NOT s.is_open OR s.date+s.time_24::TIME<=v_now OR a.blocked THEN 0 ELSE GREATEST(0,s.capacity-a.booked) END,
    'consultationBlocked',a.blocked,'isPast',s.date+s.time_24::TIME<=v_now,
    'state',CASE WHEN NOT s.is_open OR s.date+s.time_24::TIME<=v_now OR a.blocked THEN 'closed'
      WHEN a.booked>=s.capacity THEN 'full' WHEN s.capacity-a.booked<=2 THEN 'fast' ELSE 'open' END
  ) ORDER BY s.time_24),'[]'::jsonb) INTO v_slots
  FROM public.slot_schedules s CROSS JOIN LATERAL (
    SELECT count(*)::INTEGER AS booked,public.is_slot_blocked_by_active_consultation(s.doctor_id,s.date,s.time_24) AS blocked
    FROM public.appointments WHERE doctor_id=s.doctor_id AND date=s.date AND time_24=s.time_24 AND status<>'cancelled'
  ) a WHERE s.doctor_id=p_doctor_id AND s.date=p_date;
  RETURN jsonb_build_object('slots',v_slots,'onLeave',false,'serverNow',now());
END; $$;
REVOKE ALL ON FUNCTION public.get_booking_slots(TEXT,DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booking_slots(TEXT,DATE) TO anon,authenticated;

-- Atomically move a patient's missed appointment to a newly selected slot.
-- The existing appointment is updated so history, reports, and consultation
-- links remain attached to the same durable record.


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

  IF v_appointment.status='confirmed' AND v_appointment.date=p_date AND v_appointment.time_24=p_time_24 AND p_date+p_time_24::TIME>v_local_now THEN RETURN v_appointment; END IF;
  v_previous_time:=v_appointment.date+v_appointment.time_24::TIME;
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

