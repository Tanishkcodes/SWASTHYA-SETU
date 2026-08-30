-- Fix repeated #001 appointment tokens in the already-deployed project.
-- Safe to run more than once.
BEGIN;

CREATE TABLE IF NOT EXISTS public.appointment_token_counters (
  token_date  DATE PRIMARY KEY,
  last_value BIGINT NOT NULL DEFAULT 0 CHECK (last_value >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.appointment_token_counters ENABLE ROW LEVEL SECURITY;

DROP INDEX IF EXISTS public.uq_doctor_daily_token;

-- Preserve tokens already using the new format. Convert every legacy token
-- (including repeated #001 values) deterministically without collisions.
WITH existing_max AS (
  SELECT date,
         MAX(SUBSTRING(token_number FROM '([0-9]+)$')::BIGINT) AS max_value
    FROM public.appointments
   WHERE token_number ~ '^APT-[0-9]{8}-[0-9]+$'
   GROUP BY date
), legacy AS (
  SELECT a.id, a.date,
         ROW_NUMBER() OVER (PARTITION BY a.date ORDER BY a.booked_at, a.id) AS row_num
    FROM public.appointments a
   WHERE a.token_number IS NULL
      OR a.token_number !~ '^APT-[0-9]{8}-[0-9]+$'
)
UPDATE public.appointments a
   SET token_number = 'APT-' || TO_CHAR(legacy.date, 'YYYYMMDD') || '-' ||
       LPAD((COALESCE(existing_max.max_value, 0) + legacy.row_num)::TEXT,
            GREATEST(3, LENGTH((COALESCE(existing_max.max_value, 0) + legacy.row_num)::TEXT)), '0')
  FROM legacy
  LEFT JOIN existing_max ON existing_max.date = legacy.date
 WHERE a.id = legacy.id;

INSERT INTO public.appointment_token_counters(token_date, last_value)
SELECT date, MAX(SUBSTRING(token_number FROM '([0-9]+)$')::BIGINT)
  FROM public.appointments
 WHERE token_number ~ '^APT-[0-9]{8}-[0-9]+$'
 GROUP BY date
ON CONFLICT(token_date) DO UPDATE
  SET last_value = GREATEST(public.appointment_token_counters.last_value, EXCLUDED.last_value),
      updated_at = NOW();

CREATE UNIQUE INDEX IF NOT EXISTS uq_appointment_token
  ON public.appointments(token_number)
  WHERE token_number IS NOT NULL;

CREATE OR REPLACE FUNCTION public.book_appointment(
  p_patient_id UUID,
  p_doctor_id TEXT,
  p_hospital_id TEXT,
  p_date DATE,
  p_time_24 TEXT,
  p_time_label TEXT,
  p_reason TEXT DEFAULT NULL
) RETURNS public.appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot public.slot_schedules%ROWTYPE;
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

  SELECT count(*) INTO v_booked FROM public.appointments
   WHERE doctor_id = p_doctor_id AND date = p_date AND time_24 = p_time_24
     AND status <> 'cancelled';
  IF v_booked >= v_slot.capacity THEN RAISE EXCEPTION 'Slot is fully booked'; END IF;

  INSERT INTO public.appointment_token_counters(token_date, last_value, updated_at)
  VALUES (p_date, 1, NOW())
  ON CONFLICT(token_date) DO UPDATE
    SET last_value = public.appointment_token_counters.last_value + 1,
        updated_at = NOW()
  RETURNING last_value INTO v_token_sequence;

  v_token := 'APT-' || TO_CHAR(p_date, 'YYYYMMDD') || '-' ||
    LPAD(v_token_sequence::TEXT,
         GREATEST(3, LENGTH(v_token_sequence::TEXT)), '0');

  INSERT INTO public.appointments
    (patient_id, doctor_id, hospital_id, date, time_24, time_label, token_number, reason, status)
  VALUES
    (p_patient_id, p_doctor_id, p_hospital_id, p_date, p_time_24, p_time_label, v_token, p_reason, 'confirmed')
  RETURNING * INTO v_appointment;

  INSERT INTO public.doctor_queue(appointment_id, doctor_id, date, queue_position, status)
  VALUES(v_appointment.id, p_doctor_id, p_date, v_token_sequence::INTEGER, 'waiting');

  RETURN v_appointment;
END;
$$;

GRANT EXECUTE ON FUNCTION public.book_appointment(UUID,TEXT,TEXT,DATE,TEXT,TEXT,TEXT)
  TO anon, authenticated;

COMMIT;
