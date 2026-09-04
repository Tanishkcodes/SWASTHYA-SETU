-- Verified, appointment-scoped doctor ratings.
-- A patient can review a doctor once, and only after that consultation ends.

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS review_rating SMALLINT CHECK (review_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS review_comment TEXT CHECK (char_length(review_comment) <= 2000),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.doctor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
  doctor_id TEXT NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  hospital_id TEXT REFERENCES public.hospitals(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review TEXT CHECK (char_length(review) <= 2000),
  tags TEXT[] NOT NULL DEFAULT '{}',
  verified_consultation BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctor_reviews_doctor_created
  ON public.doctor_reviews(doctor_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.refresh_doctor_review_summary(p_doctor_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_average NUMERIC(3,1);
  v_count INTEGER;
BEGIN
  SELECT ROUND(AVG(rating)::NUMERIC, 1), COUNT(*)::INTEGER
    INTO v_average, v_count
    FROM public.doctor_reviews
   WHERE doctor_id = p_doctor_id
     AND verified_consultation = TRUE;

  UPDATE public.doctors
     SET rating = CASE WHEN v_count = 0 THEN NULL ELSE v_average END,
         reviews_count = v_count
   WHERE id = p_doctor_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_doctor_review_summary()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_doctor_review_summary(OLD.doctor_id);
    RETURN OLD;
  END IF;

  PERFORM public.refresh_doctor_review_summary(NEW.doctor_id);
  IF TG_OP = 'UPDATE' AND NEW.doctor_id IS DISTINCT FROM OLD.doctor_id THEN
    PERFORM public.refresh_doctor_review_summary(OLD.doctor_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_doctor_review_summary ON public.doctor_reviews;
CREATE TRIGGER trg_sync_doctor_review_summary
AFTER INSERT OR UPDATE OR DELETE ON public.doctor_reviews
FOR EACH ROW EXECUTE FUNCTION public.sync_doctor_review_summary();

CREATE OR REPLACE FUNCTION public.submit_doctor_review(
  p_appointment_id UUID,
  p_patient_id UUID,
  p_rating SMALLINT,
  p_review TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT '{}'
)
RETURNS public.doctor_reviews
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_appointment public.appointments%ROWTYPE;
  v_result public.doctor_reviews%ROWTYPE;
  v_review TEXT := NULLIF(BTRIM(COALESCE(p_review, '')), '');
BEGIN
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Please select a rating from 1 to 5 stars.' USING ERRCODE = '22023';
  END IF;
  IF char_length(COALESCE(v_review, '')) > 2000 THEN
    RAISE EXCEPTION 'Review must be 2,000 characters or fewer.' USING ERRCODE = '22001';
  END IF;

  SELECT * INTO v_appointment
    FROM public.appointments
   WHERE id = p_appointment_id
   FOR UPDATE;

  IF NOT FOUND OR v_appointment.patient_id IS DISTINCT FROM p_patient_id THEN
    RAISE EXCEPTION 'This consultation does not belong to the current patient.' USING ERRCODE = '42501';
  END IF;
  IF v_appointment.status <> 'completed' THEN
    RAISE EXCEPTION 'Reviews are available only after the consultation is completed.' USING ERRCODE = '23514';
  END IF;
  IF v_appointment.doctor_id IS NULL THEN
    RAISE EXCEPTION 'The consultation has no doctor assigned.' USING ERRCODE = '23502';
  END IF;

  INSERT INTO public.doctor_reviews(
    appointment_id, doctor_id, hospital_id, patient_id, rating, review, tags
  ) VALUES (
    v_appointment.id,
    v_appointment.doctor_id,
    v_appointment.hospital_id,
    v_appointment.patient_id,
    p_rating,
    v_review,
    COALESCE(p_tags, '{}')
  )
  RETURNING * INTO v_result;

  UPDATE public.appointments
     SET reviewed = TRUE,
         review_rating = p_rating,
         review_comment = v_review,
         reviewed_at = v_result.created_at,
         updated_at = NOW()
   WHERE id = p_appointment_id;

  RETURN v_result;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'You have already reviewed this consultation.' USING ERRCODE = '23505';
END;
$$;

ALTER TABLE public.doctor_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Doctor reviews are publicly readable" ON public.doctor_reviews;
CREATE POLICY "Doctor reviews are publicly readable"
  ON public.doctor_reviews FOR SELECT
  TO anon, authenticated
  USING (verified_consultation = TRUE);

REVOKE INSERT, UPDATE, DELETE ON public.doctor_reviews FROM anon, authenticated;
GRANT SELECT ON public.doctor_reviews TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_doctor_review(UUID, UUID, SMALLINT, TEXT, TEXT[]) TO anon, authenticated;
