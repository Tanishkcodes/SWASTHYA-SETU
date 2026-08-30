-- Real community directory, memberships, verified professionals and posts.
-- Catalog rows below create actual empty communities only. No members, posts,
-- reactions, comments, doctors or engagement totals are fabricated.

ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS disease_key TEXT,
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS theme_key TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS icon_key TEXT NOT NULL DEFAULT 'community',
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS eligible_specialities TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS title_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS tagline_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.community_professionals (
  community_id TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff_accounts(id) ON DELETE CASCADE,
  doctor_id TEXT REFERENCES public.doctors(id) ON DELETE CASCADE,
  role_label TEXT,
  is_moderator BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(community_id, staff_id)
);

CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  author_staff_id UUID NOT NULL REFERENCES public.staff_accounts(id) ON DELETE RESTRICT,
  author_doctor_id TEXT REFERENCES public.doctors(id) ON DELETE SET NULL,
  title TEXT CHECK(title IS NULL OR char_length(trim(title)) BETWEEN 3 AND 180),
  body TEXT NOT NULL CHECK(char_length(trim(body)) BETWEEN 10 AND 5000),
  post_type TEXT NOT NULL DEFAULT 'guidance' CHECK(post_type IN ('guidance','awareness','nutrition','exercise','announcement','research')),
  content_language TEXT NOT NULL DEFAULT 'en',
  translations JSONB NOT NULL DEFAULT '{}'::jsonb,
  media_url TEXT,
  media_alt TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft','published','archived','removed')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK(media_url IS NULL OR media_url ~ '^https://')
);

CREATE TABLE IF NOT EXISTS public.community_post_reactions (
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'helpful' CHECK(reaction_type IN ('helpful','support','thanks')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(post_id, patient_id)
);

CREATE TABLE IF NOT EXISTS public.community_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.staff_accounts(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK(char_length(trim(body)) BETWEEN 1 AND 2000),
  status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('published','hidden','removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK((patient_id IS NOT NULL AND staff_id IS NULL) OR (patient_id IS NULL AND staff_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_community_posts_feed ON public.community_posts(community_id,status,published_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON public.community_post_comments(post_id,status,created_at);
CREATE INDEX IF NOT EXISTS idx_community_memberships_community ON public.patient_community_memberships(community_id,joined_at DESC);

ALTER TABLE public.community_professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read community professionals" ON public.community_professionals;
DROP POLICY IF EXISTS "Public can read published community posts" ON public.community_posts;
DROP POLICY IF EXISTS "Public can read community reactions" ON public.community_post_reactions;
DROP POLICY IF EXISTS "Public can read published community comments" ON public.community_post_comments;
CREATE POLICY "Public can read community professionals" ON public.community_professionals FOR SELECT USING(true);
CREATE POLICY "Public can read published community posts" ON public.community_posts FOR SELECT USING(status='published');
CREATE POLICY "Public can read community reactions" ON public.community_post_reactions FOR SELECT USING(true);
CREATE POLICY "Public can read published community comments" ON public.community_post_comments FOR SELECT USING(status='published');

CREATE OR REPLACE FUNCTION public.set_community_membership(p_patient_id UUID,p_community_id TEXT,p_joined BOOLEAN)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.patients WHERE id=p_patient_id) THEN RAISE EXCEPTION 'Patient session not found'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.communities WHERE id=p_community_id AND is_active) THEN RAISE EXCEPTION 'Community not found'; END IF;
  IF p_joined THEN
    INSERT INTO public.patient_community_memberships(patient_id,community_id) VALUES(p_patient_id,p_community_id) ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.patient_community_memberships WHERE patient_id=p_patient_id AND community_id=p_community_id;
  END IF;
  RETURN p_joined;
END; $$;

CREATE OR REPLACE FUNCTION public.set_community_post_reaction(p_patient_id UUID,p_post_id UUID,p_reaction_type TEXT DEFAULT 'helpful')
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.community_posts WHERE id=p_post_id AND status='published') THEN RAISE EXCEPTION 'Post not found'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.patient_community_memberships m JOIN public.community_posts p ON p.community_id=m.community_id WHERE m.patient_id=p_patient_id AND p.id=p_post_id) THEN RAISE EXCEPTION 'Join this community before reacting'; END IF;
  IF EXISTS(SELECT 1 FROM public.community_post_reactions WHERE patient_id=p_patient_id AND post_id=p_post_id) THEN
    DELETE FROM public.community_post_reactions WHERE patient_id=p_patient_id AND post_id=p_post_id;
    RETURN FALSE;
  END IF;
  INSERT INTO public.community_post_reactions(post_id,patient_id,reaction_type) VALUES(p_post_id,p_patient_id,p_reaction_type);
  RETURN TRUE;
END; $$;

CREATE OR REPLACE FUNCTION public.add_community_post_comment(p_patient_id UUID,p_post_id UUID,p_body TEXT)
RETURNS public.community_post_comments LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_comment public.community_post_comments%ROWTYPE;
BEGIN
  IF char_length(trim(COALESCE(p_body,''))) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Comment must be between 1 and 2000 characters'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.patient_community_memberships m JOIN public.community_posts p ON p.community_id=m.community_id WHERE m.patient_id=p_patient_id AND p.id=p_post_id AND p.status='published') THEN RAISE EXCEPTION 'Join this community before commenting'; END IF;
  INSERT INTO public.community_post_comments(post_id,patient_id,body) VALUES(p_post_id,p_patient_id,trim(p_body)) RETURNING * INTO v_comment;
  RETURN v_comment;
END; $$;

GRANT EXECUTE ON FUNCTION public.set_community_membership(UUID,TEXT,BOOLEAN) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.set_community_post_reaction(UUID,UUID,TEXT) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.add_community_post_comment(UUID,UUID,TEXT) TO anon,authenticated;

-- Future doctor portal entry point. It deliberately is not granted to anonymous
-- users; the doctor portal must call it through its authenticated server path.
CREATE OR REPLACE FUNCTION public.publish_verified_community_post(
  p_staff_id UUID,p_community_id TEXT,p_title TEXT,p_body TEXT,
  p_post_type TEXT DEFAULT 'guidance',p_content_language TEXT DEFAULT 'en',
  p_translations JSONB DEFAULT '{}'::jsonb,p_media_url TEXT DEFAULT NULL,p_media_alt TEXT DEFAULT NULL
) RETURNS public.community_posts LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_staff public.staff_accounts%ROWTYPE; v_doctor public.doctors%ROWTYPE; v_community public.communities%ROWTYPE; v_post public.community_posts%ROWTYPE;
BEGIN
  SELECT * INTO v_staff FROM public.staff_accounts WHERE id=p_staff_id AND role='doctor' AND is_active;
  IF NOT FOUND OR v_staff.doctor_id IS NULL THEN RAISE EXCEPTION 'Active verified doctor account required'; END IF;
  SELECT * INTO v_doctor FROM public.doctors WHERE id=v_staff.doctor_id AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Doctor profile not found'; END IF;
  SELECT * INTO v_community FROM public.communities WHERE id=p_community_id AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Community not found'; END IF;
  IF cardinality(v_community.eligible_specialities)>0
     AND NOT EXISTS(SELECT 1 FROM unnest(v_community.eligible_specialities) allowed WHERE lower(allowed)=lower(v_doctor.speciality))
     AND NOT EXISTS(SELECT 1 FROM public.community_professionals WHERE community_id=p_community_id AND staff_id=p_staff_id)
  THEN RAISE EXCEPTION 'Doctor speciality is not approved for this community'; END IF;
  INSERT INTO public.community_professionals(community_id,staff_id,doctor_id,role_label)
  VALUES(p_community_id,p_staff_id,v_doctor.id,v_doctor.speciality)
  ON CONFLICT(community_id,staff_id) DO UPDATE SET doctor_id=EXCLUDED.doctor_id,role_label=EXCLUDED.role_label;
  INSERT INTO public.community_posts(community_id,author_staff_id,author_doctor_id,title,body,post_type,content_language,translations,media_url,media_alt,status,published_at)
  VALUES(p_community_id,p_staff_id,v_doctor.id,NULLIF(trim(p_title),''),trim(p_body),p_post_type,p_content_language,COALESCE(p_translations,'{}'::jsonb),p_media_url,p_media_alt,'published',NOW())
  RETURNING * INTO v_post;
  RETURN v_post;
END; $$;
REVOKE ALL ON FUNCTION public.publish_verified_community_post(UUID,TEXT,TEXT,TEXT,TEXT,TEXT,JSONB,TEXT,TEXT) FROM PUBLIC,anon,authenticated;

-- Real empty community catalog. Counts remain zero until actual users join and
-- feeds remain empty until a related verified doctor publishes in the future.
INSERT INTO public.communities(id,title,category,description,disease_key,tagline,theme_key,icon_key,eligible_specialities,sort_order) VALUES
 ('blood-donor-network','Blood Donor Network','Emergency & Donation','Connect with compatible blood donors and verified hospital blood banks.','blood','Every drop can save a life.','blood','droplet',ARRAY['Hematology','Transfusion Medicine','Emergency Medicine'],10),
 ('cancer-support','Cancer Support Group','Cancer Care','A safe community for cancer awareness, treatment guidance and caregiver support.','cancer','Support. Strength. Together.','cancer','ribbon',ARRAY['Medical Oncology','Surgical Oncology','Radiation Oncology','Clinical Nutrition'],20),
 ('diabetes-care','Diabetes & Nutrition Support','Chronic Care','Practical support for glucose monitoring, nutrition, medicine adherence and healthy activity.','diabetes','Small steps, steadier health.','diabetes','activity',ARRAY['Endocrinology','Diabetology','Clinical Nutrition','General Medicine'],30),
 ('heart-health','Heart Health Circle','Cardiac Care','Evidence-based guidance for blood pressure, cardiac rehabilitation and heart-healthy living.','cardiac','Stronger hearts, healthier lives.','cardiac','heart',ARRAY['Cardiology','Cardiothoracic Surgery','Clinical Nutrition','Physiotherapy'],40),
 ('mental-wellness','Mental Wellness Circle','Mental Health','A moderated space for emotional wellbeing, coping skills and professional mental-health guidance.','mental-health','Talk, listen and heal together.','mental','brain',ARRAY['Psychiatry','Clinical Psychology','Counselling Psychology'],50),
 ('maternal-health','Mother & Child Care Community','Family Health','Verified prenatal, postnatal, vaccination, infant nutrition and pediatric guidance.','maternal-child','Healthy beginnings, supported families.','maternal','baby',ARRAY['Obstetrics and Gynaecology','Pediatrics','Neonatology','Clinical Nutrition'],60),
 ('senior-care','Senior Health & Mobility Circle','Senior Care','Support for healthy ageing, mobility, medicine safety and caregiver coordination.','geriatrics','Age with dignity and confidence.','senior','users',ARRAY['Geriatrics','General Medicine','Orthopaedics','Physiotherapy'],70),
 ('respiratory-care','Respiratory & Asthma Support','Respiratory Care','Guidance for asthma, COPD, inhaler technique, breathing exercises and air-quality awareness.','respiratory','Breathe better, live fuller.','respiratory','lungs',ARRAY['Pulmonology','Respiratory Medicine','Allergy and Immunology'],80),
 ('ayush-wellness','AYUSH & Daily Wellness','AYUSH','Responsible Ayurveda, yoga and lifestyle guidance alongside appropriate clinical care.','ayush','Tradition guided by safe care.','ayush','leaf',ARRAY['Ayurveda','Yoga and Naturopathy','Integrative Medicine'],90),
 ('caregiver-support','Caregiver Support Network','Caregiver Support','Practical and emotional support for people caring for family members with health needs.','caregiver','Care for those who care.','caregiver','hands',ARRAY['Palliative Care','General Medicine','Psychiatry','Nursing'],100),
 ('health-awareness','Health Awareness Hub','Preventive Care','Verified public-health education, screening awareness, vaccination guidance and prevention resources.','preventive-health','Knowledge for healthier communities.','general','community',ARRAY['Public Health','Preventive Medicine','General Medicine'],110)
ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title,category=EXCLUDED.category,description=EXCLUDED.description,
 disease_key=EXCLUDED.disease_key,tagline=EXCLUDED.tagline,theme_key=EXCLUDED.theme_key,icon_key=EXCLUDED.icon_key,
 eligible_specialities=EXCLUDED.eligible_specialities,sort_order=EXCLUDED.sort_order,updated_at=NOW(),is_active=TRUE;
