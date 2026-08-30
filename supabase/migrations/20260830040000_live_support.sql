-- Live, extensible patient support directory and ticketing.
-- No sample hospital telephone numbers are inserted. Hospital contacts only
-- become visible after a hospital/admin stores and verifies them.

ALTER TABLE public.hospitals
  ADD COLUMN IF NOT EXISTS support_phone TEXT,
  ADD COLUMN IF NOT EXISTS emergency_phone TEXT,
  ADD COLUMN IF NOT EXISTS support_email TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS support_hours TEXT,
  ADD COLUMN IF NOT EXISTS contact_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.support_channels (
  id TEXT PRIMARY KEY,
  channel_type TEXT NOT NULL CHECK(channel_type IN ('phone','emergency','email','website','chat')),
  label TEXT NOT NULL,
  description TEXT,
  label_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  phone TEXT,
  email TEXT,
  url TEXT,
  hours TEXT,
  languages TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 100,
  verified_source_url TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK(
    (channel_type IN ('phone','emergency') AND phone IS NOT NULL)
    OR (channel_type='email' AND email IS NOT NULL)
    OR (channel_type IN ('website','chat') AND url IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.support_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL DEFAULT 'general',
  question TEXT NOT NULL CHECK(char_length(trim(question)) BETWEEN 5 AND 300),
  answer TEXT NOT NULL CHECK(char_length(trim(answer)) BETWEEN 5 AND 4000),
  question_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  answer_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  hospital_id TEXT REFERENCES public.hospitals(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK(category IN ('appointment','medical_record','donation','community','technical','accessibility','feedback','other')),
  subject TEXT NOT NULL CHECK(char_length(trim(subject)) BETWEEN 3 AND 180),
  message TEXT NOT NULL CHECK(char_length(trim(message)) BETWEEN 10 AND 4000),
  preferred_contact TEXT NOT NULL DEFAULT 'in_app' CHECK(preferred_contact IN ('in_app','phone','email')),
  language TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','assigned','in_progress','resolved','closed')),
  assigned_staff_id UUID REFERENCES public.staff_accounts(id) ON DELETE SET NULL,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_support_requests_patient ON public.support_requests(patient_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_requests_queue ON public.support_requests(status,created_at);
CREATE INDEX IF NOT EXISTS idx_support_faqs_active ON public.support_faqs(is_active,display_order);

ALTER TABLE public.support_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read verified support channels" ON public.support_channels;
DROP POLICY IF EXISTS "Public can read active support faqs" ON public.support_faqs;
CREATE POLICY "Public can read verified support channels" ON public.support_channels
  FOR SELECT USING(is_active AND is_verified);
CREATE POLICY "Public can read active support faqs" ON public.support_faqs
  FOR SELECT USING(is_active);
DROP POLICY IF EXISTS "Public can read patient support requests" ON public.support_requests;

CREATE OR REPLACE FUNCTION public.create_support_request(
  p_patient_id UUID,
  p_hospital_id TEXT,
  p_category TEXT,
  p_subject TEXT,
  p_message TEXT,
  p_preferred_contact TEXT DEFAULT 'in_app',
  p_language TEXT DEFAULT 'en'
) RETURNS public.support_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_request public.support_requests%ROWTYPE;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.patients WHERE id=p_patient_id) THEN
    RAISE EXCEPTION 'Patient session not found';
  END IF;
  IF p_hospital_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.hospitals WHERE id=p_hospital_id) THEN
    RAISE EXCEPTION 'Hospital not found';
  END IF;
  INSERT INTO public.support_requests(patient_id,hospital_id,category,subject,message,preferred_contact,language)
  VALUES(p_patient_id,p_hospital_id,p_category,trim(p_subject),trim(p_message),p_preferred_contact,COALESCE(NULLIF(p_language,''),'en'))
  RETURNING * INTO v_request;
  RETURN v_request;
END; $$;

CREATE OR REPLACE FUNCTION public.list_support_requests(p_patient_id UUID)
RETURNS SETOF public.support_requests
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  SELECT request.* FROM public.support_requests request
  WHERE request.patient_id=p_patient_id ORDER BY request.created_at DESC;
$$;

GRANT SELECT ON public.support_channels,public.support_faqs TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_support_request(UUID,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.list_support_requests(UUID) TO anon,authenticated;

-- Official Government of India Emergency Response Support System. The
-- verified source states that 112 is the pan-India single emergency number,
-- available 24x7 for police, fire, medical and other emergencies.
INSERT INTO public.support_channels(
  id,channel_type,label,description,phone,hours,languages,is_active,is_verified,
  display_order,verified_source_url,verified_at
) VALUES (
  'india-erss-112','emergency','Emergency Response Support System',
  'Pan-India emergency assistance for medical, police, fire and rescue services.',
  '112','24x7',ARRAY['en','hi'],TRUE,TRUE,10,'https://112.gov.in/',NOW()
) ON CONFLICT(id) DO UPDATE SET
  channel_type=EXCLUDED.channel_type,label=EXCLUDED.label,description=EXCLUDED.description,
  phone=EXCLUDED.phone,hours=EXCLUDED.hours,languages=EXCLUDED.languages,
  is_active=TRUE,is_verified=TRUE,display_order=EXCLUDED.display_order,
  verified_source_url=EXCLUDED.verified_source_url,verified_at=EXCLUDED.verified_at,updated_at=NOW();
