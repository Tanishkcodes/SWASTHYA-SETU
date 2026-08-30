-- Live hospital donation requests and patient responses.
-- Intentionally contains no sample requests, contributions, donors, or totals.

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS blood_group TEXT
  CHECK (blood_group IS NULL OR blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-'));

CREATE TABLE IF NOT EXISTS public.donation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id TEXT NOT NULL REFERENCES public.hospitals(id) ON DELETE RESTRICT,
  created_by_staff_id UUID REFERENCES public.staff_accounts(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('blood','financial','equipment','medicine','other')),
  title TEXT NOT NULL CHECK (char_length(trim(title)) BETWEEN 3 AND 140),
  description TEXT NOT NULL CHECK (char_length(trim(description)) BETWEEN 10 AND 2000),
  patient_summary TEXT CHECK (patient_summary IS NULL OR char_length(patient_summary) <= 500),
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('normal','medium','high','critical')),
  urgency_rank SMALLINT GENERATED ALWAYS AS (
    CASE urgency WHEN 'critical' THEN 4 WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END
  ) STORED,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','fulfilled','closed','cancelled')),
  amount_target NUMERIC(12,2) CHECK (amount_target IS NULL OR amount_target > 0),
  amount_received NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (amount_received >= 0),
  blood_group TEXT CHECK (blood_group IS NULL OR blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  units_needed INTEGER CHECK (units_needed IS NULL OR units_needed BETWEEN 1 AND 10000),
  units_fulfilled INTEGER NOT NULL DEFAULT 0 CHECK (units_fulfilled >= 0),
  location TEXT CHECK (location IS NULL OR char_length(location) <= 300),
  contact_instructions TEXT CHECK (contact_instructions IS NULL OR char_length(contact_instructions) <= 500),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (category = 'blood' AND blood_group IS NOT NULL AND units_needed IS NOT NULL AND amount_target IS NULL)
    OR (category = 'financial' AND amount_target IS NOT NULL AND blood_group IS NULL AND units_needed IS NULL)
    OR (category IN ('equipment','medicine','other') AND blood_group IS NULL AND units_needed IS NULL)
  ),
  CHECK (expires_at IS NULL OR expires_at > created_at)
);

CREATE TABLE IF NOT EXISTS public.donation_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.donation_requests(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  contribution_type TEXT NOT NULL CHECK (contribution_type IN ('funds','blood_response','equipment','medicine','other')),
  amount_inr NUMERIC(12,2) CHECK (amount_inr IS NULL OR amount_inr > 0),
  units_offered INTEGER CHECK (units_offered IS NULL OR units_offered BETWEEN 1 AND 20),
  blood_group TEXT CHECK (blood_group IS NULL OR blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  message TEXT CHECK (message IS NULL OR char_length(message) <= 1000),
  status TEXT NOT NULL DEFAULT 'pledged' CHECK (status IN ('pledged','contact_requested','confirmed','completed','declined','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (contribution_type = 'funds' AND amount_inr IS NOT NULL AND units_offered IS NULL)
    OR (contribution_type = 'blood_response' AND units_offered IS NOT NULL AND blood_group IS NOT NULL AND amount_inr IS NULL)
    OR (contribution_type IN ('equipment','medicine','other') AND amount_inr IS NULL AND units_offered IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_donation_requests_live
  ON public.donation_requests(status, urgency_rank DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donation_requests_hospital
  ON public.donation_requests(hospital_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donation_contributions_patient
  ON public.donation_contributions(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donation_contributions_request
  ON public.donation_contributions(request_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_patient_request_response
  ON public.donation_contributions(request_id, patient_id)
  WHERE status NOT IN ('declined','cancelled');

ALTER TABLE public.donation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_contributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read live donation requests" ON public.donation_requests;
DROP POLICY IF EXISTS "Staff app can manage donation requests" ON public.donation_requests;
DROP POLICY IF EXISTS "Patients can read contributions" ON public.donation_contributions;
CREATE POLICY "Public can read live donation requests"
  ON public.donation_requests FOR SELECT USING (true);
CREATE POLICY "Staff app can manage donation requests"
  ON public.donation_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Patients can read contributions"
  ON public.donation_contributions FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.respond_to_donation_request(
  p_request_id UUID,
  p_patient_id UUID,
  p_contribution_type TEXT,
  p_amount_inr NUMERIC DEFAULT NULL,
  p_units_offered INTEGER DEFAULT NULL,
  p_blood_group TEXT DEFAULT NULL,
  p_message TEXT DEFAULT NULL
) RETURNS public.donation_contributions
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_request public.donation_requests%ROWTYPE;
  v_response public.donation_contributions%ROWTYPE;
BEGIN
  SELECT * INTO v_request FROM public.donation_requests
   WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Donation request not found'; END IF;
  IF v_request.status <> 'active' OR (v_request.expires_at IS NOT NULL AND v_request.expires_at <= NOW()) THEN
    RAISE EXCEPTION 'This donation request is no longer active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.patients WHERE id = p_patient_id) THEN
    RAISE EXCEPTION 'Patient session not found';
  END IF;
  IF (v_request.category = 'blood' AND p_contribution_type <> 'blood_response')
     OR (v_request.category = 'financial' AND p_contribution_type <> 'funds')
     OR (v_request.category IN ('equipment','medicine','other') AND p_contribution_type <> v_request.category) THEN
    RAISE EXCEPTION 'Response type does not match this request';
  END IF;
  IF p_contribution_type = 'funds' AND (p_amount_inr IS NULL OR p_amount_inr <= 0) THEN
    RAISE EXCEPTION 'Enter a valid pledge amount';
  END IF;
  IF p_contribution_type = 'blood_response' AND
     (p_units_offered IS NULL OR p_units_offered < 1 OR p_blood_group IS NULL) THEN
    RAISE EXCEPTION 'Blood group and offered units are required';
  END IF;

  INSERT INTO public.donation_contributions(
    request_id, patient_id, contribution_type, amount_inr,
    units_offered, blood_group, message, status
  ) VALUES (
    p_request_id, p_patient_id, p_contribution_type, p_amount_inr,
    p_units_offered, p_blood_group, NULLIF(trim(p_message),''),
    CASE WHEN p_contribution_type = 'blood_response' THEN 'contact_requested' ELSE 'pledged' END
  ) RETURNING * INTO v_response;
  RETURN v_response;
END; $$;

GRANT EXECUTE ON FUNCTION public.respond_to_donation_request(UUID,UUID,TEXT,NUMERIC,INTEGER,TEXT,TEXT)
  TO anon, authenticated;
