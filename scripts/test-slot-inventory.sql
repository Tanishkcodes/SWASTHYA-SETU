-- Run after the migration, or include it in the migration's rollback validation.
-- All fixtures and counters created by these checks are rolled back by the caller.
DO $$
DECLARE v_doc TEXT:='slot-test-'||gen_random_uuid()::TEXT; v_hosp TEXT:='slot-test-'||gen_random_uuid()::TEXT;
 v_patient UUID:=gen_random_uuid(); v_other UUID:=gen_random_uuid(); v_request UUID:=gen_random_uuid();
 v_date DATE:=timezone('Asia/Kolkata',now())::DATE+360;
 v_data JSONB; v_appt public.appointments%ROWTYPE; v_retry public.appointments%ROWTYPE; v_started TIMESTAMPTZ;
BEGIN
 INSERT INTO public.hospitals(id,name) VALUES(v_hosp,'Synthetic Slot Test');
 INSERT INTO public.doctors(id,hospital_id,name) VALUES(v_doc,v_hosp,'Synthetic Slot Doctor');
 INSERT INTO public.patients(id,name) VALUES(v_patient,'Synthetic Patient A'),(v_other,'Synthetic Patient B');
 v_data:=public.get_booking_slots(v_doc,v_date);
 IF jsonb_array_length(v_data->'slots')<>21 THEN RAISE EXCEPTION 'Expected 21 half-hour windows'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(v_data->'slots') x WHERE (x->>'capacity')::INTEGER<>6 OR (x->>'slotsLeft')::INTEGER<>6) THEN RAISE EXCEPTION 'Capacity mismatch'; END IF;
 UPDATE public.slot_schedules SET capacity=1 WHERE doctor_id=v_doc AND date=v_date AND time_24='09:00';
 v_appt:=public.book_appointment(v_patient,v_doc,v_hosp,v_date,'09:00','09:00 AM','test',NULL,v_request);
 v_retry:=public.book_appointment(v_patient,v_doc,v_hosp,v_date,'09:00','09:00 AM','test',NULL,v_request);
 IF v_appt.id<>v_retry.id THEN RAISE EXCEPTION 'Retry created duplicate'; END IF;
 BEGIN
  PERFORM public.book_appointment(v_other,v_doc,v_hosp,v_date,'09:00','09:00 AM','test',NULL,gen_random_uuid());
  RAISE EXCEPTION 'TEST_OVERBOOKED';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='TEST_OVERBOOKED' THEN RAISE; END IF; END;
 v_data:=public.get_booking_slots(v_doc,v_date);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(v_data->'slots') x WHERE x->>'time24'='09:00' AND x->>'state'='full' AND x->>'slotsLeft'='0' AND x->>'capacity'='1') THEN RAISE EXCEPTION 'Live inventory is inconsistent'; END IF;
 UPDATE public.slot_schedules SET is_open=false WHERE doctor_id=v_doc AND date=v_date AND time_24='09:30';
 BEGIN
  PERFORM public.book_appointment(v_other,v_doc,v_hosp,v_date,'09:30','09:30 AM','test',NULL,gen_random_uuid());
  RAISE EXCEPTION 'TEST_CLOSED_BOOKED';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='TEST_CLOSED_BOOKED' THEN RAISE; END IF; END;
 PERFORM public.start_doctor_consultation(v_appt.id,v_doc);
 SELECT consultation_started_at INTO v_started FROM public.appointments WHERE id=v_appt.id;
 PERFORM public.start_doctor_consultation(v_appt.id,v_doc);
 IF (SELECT consultation_started_at FROM public.appointments WHERE id=v_appt.id) IS DISTINCT FROM v_started THEN RAISE EXCEPTION 'Start clock reset'; END IF;
 IF public.consultation_overrun_minutes(now()-interval '20 minutes',6)<=0 THEN RAISE EXCEPTION 'Overrun not blocked'; END IF;
 IF public.consultation_overrun_minutes(now()-interval '2 minutes',6)<>0 THEN RAISE EXCEPTION 'Early consultation incorrectly blocked'; END IF;
 PERFORM public.end_doctor_consultation(v_appt.id,v_doc);
 IF (SELECT consultation_ended_at FROM public.appointments WHERE id=v_appt.id) IS NULL THEN RAISE EXCEPTION 'End clock not recorded'; END IF;
END; $$;
SELECT 'PASS capacity, retry, full/closed gates, consultation clock and overrun' AS result;
