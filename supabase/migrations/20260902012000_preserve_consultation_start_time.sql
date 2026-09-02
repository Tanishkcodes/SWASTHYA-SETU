-- Reopening an active consultation must not reset its original start time.
BEGIN;

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
  SELECT * INTO v_appointment
    FROM public.appointments
   WHERE id = p_appointment_id AND doctor_id = p_doctor_id
   FOR UPDATE;
  IF NOT FOUND OR v_appointment.status IN ('cancelled', 'completed') THEN
    RAISE EXCEPTION 'Appointment cannot be started';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.appointments
     WHERE doctor_id = p_doctor_id AND status = 'in_consultation' AND id <> p_appointment_id
  ) THEN
    RAISE EXCEPTION 'Another consultation is still active. End it before starting the next patient.';
  END IF;

  -- Idempotent reopen: return the active row without touching updated_at,
  -- because updated_at is the authoritative consultation start timestamp.
  IF v_appointment.status = 'in_consultation' THEN RETURN v_appointment; END IF;

  UPDATE public.appointments
     SET status = 'in_consultation', updated_at = NOW()
   WHERE id = p_appointment_id
  RETURNING * INTO v_appointment;
  UPDATE public.doctor_queue SET status = 'in_consultation'
   WHERE appointment_id = p_appointment_id;
  RETURN v_appointment;
END;
$$;

COMMIT;
