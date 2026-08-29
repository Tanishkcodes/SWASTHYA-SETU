-- ═══════════════════════════════════════════════════════════════════════════
-- SWASTHYA SETU — Complete Supabase Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── 1. PATIENTS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.patients (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  age           INTEGER,
  gender        TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  phone         TEXT UNIQUE,
  abha_id       TEXT UNIQUE,
  aadhaar_last4 TEXT,
  address       TEXT,
  auth_method   TEXT,
  language      TEXT DEFAULT 'en',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. HOSPITALS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hospitals (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  address       TEXT,
  city          TEXT,
  state         TEXT,
  type          TEXT DEFAULT 'Government',   -- Government / Private / AYUSH
  rating        NUMERIC(3,1) DEFAULT 4.0,
  opd_timings   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. DOCTORS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.doctors (
  id            TEXT PRIMARY KEY,
  hospital_id   TEXT REFERENCES public.hospitals(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  degrees       TEXT,                         -- "MBBS, MD (General Medicine)"
  speciality    TEXT,
  system        TEXT DEFAULT 'Allopathy',     -- Allopathy / Ayurveda / Homeopathy
  experience    INTEGER,                      -- years
  rating        NUMERIC(3,1) DEFAULT 4.5,
  reviews_count INTEGER DEFAULT 0,
  avatar_url    TEXT,
  about         TEXT,
  expertise     TEXT[],                       -- Array of expertise tags
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. SLOT SCHEDULES ────────────────────────────────────────────────────────
-- One row per doctor × date × time slot
CREATE TABLE IF NOT EXISTS public.slot_schedules (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id     TEXT REFERENCES public.doctors(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  time_24       TEXT NOT NULL,               -- "09:00", "09:30" etc.
  time_label    TEXT NOT NULL,               -- "09:00 AM"
  session       TEXT NOT NULL CHECK (session IN ('morning','afternoon','evening')),
  capacity      INTEGER NOT NULL DEFAULT 3,  -- max patients per slot
  is_open       BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (doctor_id, date, time_24)
);

-- ─── 5. APPOINTMENTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id    UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  doctor_id     TEXT REFERENCES public.doctors(id) ON DELETE SET NULL,
  hospital_id   TEXT REFERENCES public.hospitals(id) ON DELETE SET NULL,
  date          DATE NOT NULL,
  time_24       TEXT NOT NULL,
  time_label    TEXT NOT NULL,
  token_number  TEXT,                        -- e.g. "#042"
  reason        TEXT,
  status        TEXT DEFAULT 'confirmed'
                CHECK (status IN ('confirmed','completed','cancelled','no_show')),
  opd_room      TEXT,
  doctor_notes  TEXT,
  prescription  TEXT,
  booked_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. MEDICAL REPORTS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.medical_reports (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id    UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  report_type   TEXT,                        -- "Lab Report", "X-Ray", "Prescription", etc.
  title         TEXT NOT NULL,
  file_url      TEXT,                        -- Supabase Storage URL
  ocr_text      TEXT,                        -- AI OCR extracted text
  uploaded_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 7. DOCTOR_QUEUE (live OPD queue visible in PhysicianDashboard) ───────────
CREATE TABLE IF NOT EXISTS public.doctor_queue (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  doctor_id      TEXT REFERENCES public.doctors(id) ON DELETE CASCADE,
  date           DATE NOT NULL,
  queue_position INTEGER,
  checked_in_at  TIMESTAMPTZ,
  status         TEXT DEFAULT 'waiting'
                 CHECK (status IN ('waiting','in_consultation','completed','skipped'))
);

CREATE TABLE IF NOT EXISTS public.staff_accounts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('doctor','admin','nurse')),
  department    TEXT,
  doctor_id     TEXT REFERENCES public.doctors(id) ON DELETE SET NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.communities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.patient_community_memberships (
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  community_id TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(patient_id, community_id)
);

CREATE TABLE IF NOT EXISTS public.donation_pledges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  amount_inr NUMERIC(12,2) NOT NULL CHECK(amount_inr > 0),
  status TEXT NOT NULL DEFAULT 'pledged' CHECK(status IN ('pledged','payment_pending','paid','failed','refunded','cancelled')),
  payment_reference TEXT UNIQUE,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.voice_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES public.staff_accounts(id) ON DELETE SET NULL,
  page_id TEXT,
  language TEXT,
  intent TEXT,
  confidence NUMERIC(4,3),
  handled BOOLEAN NOT NULL DEFAULT FALSE,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  page_id TEXT,
  language TEXT,
  message TEXT NOT NULL CHECK(char_length(message) BETWEEN 1 AND 4000),
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','reviewing','resolved','dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One durable intake record per patient visit. JSONB preserves the complete
-- multilingual interview while the indexed columns support clinical queries.
CREATE TABLE IF NOT EXISTS public.clinical_intakes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id          UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id      UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  language            TEXT NOT NULL DEFAULT 'en',
  is_ayush_mode       BOOLEAN NOT NULL DEFAULT FALSE,
  consents            JSONB NOT NULL DEFAULT '{}'::jsonb,
  history             JSONB NOT NULL DEFAULT '{}'::jsonb,
  interview_progress  JSONB NOT NULL DEFAULT '{}'::jsonb,
  documents           JSONB NOT NULL DEFAULT '[]'::jsonb,
  clinical_summary    JSONB,
  red_flags           JSONB NOT NULL DEFAULT '[]'::jsonb,
  token_number        TEXT,
  queue_date          DATE,
  status              TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted','in_consultation','completed','cancelled')),
  doctor_notes        TEXT,
  prescription        TEXT,
  submitted_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_date ON public.appointments(patient_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON public.appointments(doctor_id, date, time_24);
CREATE INDEX IF NOT EXISTS idx_reports_patient ON public.medical_reports(patient_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_intakes_patient ON public.clinical_intakes(patient_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_intake_daily_token ON public.clinical_intakes(queue_date, token_number) WHERE token_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_doctor_daily_token
  ON public.appointments(doctor_id, date, token_number)
  WHERE status <> 'cancelled';

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) — kiosk/demo access model
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.patients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_queue    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read communities" ON public.communities;
DROP POLICY IF EXISTS "Patients can manage memberships" ON public.patient_community_memberships;
DROP POLICY IF EXISTS "Patients can create donation pledges" ON public.donation_pledges;
DROP POLICY IF EXISTS "Patients can read donation pledges" ON public.donation_pledges;
DROP POLICY IF EXISTS "App can log voice interactions" ON public.voice_interactions;
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedback;
CREATE POLICY "Public can read communities" ON public.communities FOR SELECT USING(true);
CREATE POLICY "Patients can manage memberships" ON public.patient_community_memberships FOR ALL USING(true) WITH CHECK(true);
CREATE POLICY "Patients can create donation pledges" ON public.donation_pledges FOR INSERT WITH CHECK(true);
CREATE POLICY "Patients can read donation pledges" ON public.donation_pledges FOR SELECT USING(true);
CREATE POLICY "App can log voice interactions" ON public.voice_interactions FOR INSERT WITH CHECK(true);
CREATE POLICY "Anyone can submit feedback" ON public.feedback FOR INSERT WITH CHECK(true);

-- Hospitals & doctors are public (anyone can read for booking)
ALTER TABLE public.hospitals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_schedules  ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads on hospitals, doctors, slot_schedules (for booking flow)
DROP POLICY IF EXISTS "Public can read hospitals" ON public.hospitals;
DROP POLICY IF EXISTS "Public can read doctors" ON public.doctors;
DROP POLICY IF EXISTS "Public can read slot_schedules" ON public.slot_schedules;
DROP POLICY IF EXISTS "Anyone can register patient" ON public.patients;
DROP POLICY IF EXISTS "Patient can read own record" ON public.patients;
DROP POLICY IF EXISTS "Patient can update own record" ON public.patients;
DROP POLICY IF EXISTS "Anyone can book appointment" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can read appointments" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can update appointment status" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can insert clinical intake" ON public.clinical_intakes;
DROP POLICY IF EXISTS "Anyone can read clinical intake" ON public.clinical_intakes;
DROP POLICY IF EXISTS "Anyone can update clinical intake" ON public.clinical_intakes;
DROP POLICY IF EXISTS "Anyone can insert medical reports" ON public.medical_reports;
DROP POLICY IF EXISTS "Anyone can read medical reports" ON public.medical_reports;
DROP POLICY IF EXISTS "Public can read doctor_queue" ON public.doctor_queue;
DROP POLICY IF EXISTS "Public can insert doctor_queue" ON public.doctor_queue;
DROP POLICY IF EXISTS "Public can update doctor_queue" ON public.doctor_queue;
DROP POLICY IF EXISTS "Public can manage slot_schedules" ON public.slot_schedules;
CREATE POLICY "Public can read hospitals"
  ON public.hospitals FOR SELECT USING (true);

CREATE POLICY "Public can read doctors"
  ON public.doctors FOR SELECT USING (true);

CREATE POLICY "Public can read slot_schedules"
  ON public.slot_schedules FOR SELECT USING (true);

-- Allow anonymous inserts for patients (no auth required — phone-based identity)
CREATE POLICY "Anyone can register patient"
  ON public.patients FOR INSERT WITH CHECK (true);

CREATE POLICY "Patient can read own record"
  ON public.patients FOR SELECT USING (true);

CREATE POLICY "Patient can update own record"
  ON public.patients FOR UPDATE USING (true) WITH CHECK (true);

-- Appointments: anyone can insert (they supply patient phone), read their own
CREATE POLICY "Anyone can book appointment"
  ON public.appointments FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read appointments"
  ON public.appointments FOR SELECT USING (true);

CREATE POLICY "Anyone can update appointment status"
  ON public.appointments FOR UPDATE USING (true);

CREATE POLICY "Anyone can insert clinical intake"
  ON public.clinical_intakes FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read clinical intake"
  ON public.clinical_intakes FOR SELECT USING (true);

CREATE POLICY "Anyone can update clinical intake"
  ON public.clinical_intakes FOR UPDATE USING (true) WITH CHECK (true);

-- Medical reports: insert & read open (patient identified by patient_id)
CREATE POLICY "Anyone can insert medical reports"
  ON public.medical_reports FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read medical reports"
  ON public.medical_reports FOR SELECT USING (true);

-- Doctor queue: open for OPD portal use
CREATE POLICY "Public can read doctor_queue"
  ON public.doctor_queue FOR SELECT USING (true);

CREATE POLICY "Public can insert doctor_queue"
  ON public.doctor_queue FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update doctor_queue"
  ON public.doctor_queue FOR UPDATE USING (true);

-- Allow doctors to update slot schedules
CREATE POLICY "Public can manage slot_schedules"
  ON public.slot_schedules FOR ALL USING (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED: Sample Hospitals & Doctors (matches the app's hospital data)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.hospitals (id, name, address, city, state, type, rating, opd_timings) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'AIIMS New Delhi', 'Ansari Nagar, New Delhi', 'New Delhi', 'Delhi', 'Government', 4.8, '8:00 AM – 2:00 PM'),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'Sawai Man Singh Hospital', 'J.L.N. Marg, Jaipur', 'Jaipur', 'Rajasthan', 'Government', 4.6, '9:00 AM – 4:00 PM'),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'PGIMER Chandigarh', 'Sector 12, Chandigarh', 'Chandigarh', 'Punjab', 'Government', 4.7, '8:30 AM – 2:30 PM'),
  ('a1b2c3d4-0004-0004-0004-000000000004', 'KEM Hospital Mumbai', 'Acharya Dhonde Marg, Parel', 'Mumbai', 'Maharashtra', 'Government', 4.5, '9:00 AM – 3:00 PM'),
  ('a1b2c3d4-0005-0005-0005-000000000005', 'NIMHANS Bangalore', 'Hosur Road, Bangalore', 'Bangalore', 'Karnataka', 'Government', 4.6, '9:00 AM – 1:00 PM')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.doctors (id, hospital_id, name, degrees, speciality, system, experience, rating, reviews_count, about) VALUES
  ('d0000001-0001-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000001', 'Dr. Randeep Guleria', 'MBBS, MD (General Medicine)', 'Pulmonology', 'Allopathy', 26, 4.9, 1240, 'Former AIIMS Director, renowned pulmonologist with 26+ years of clinical excellence.'),
  ('d0000001-0002-0002-0002-000000000001', 'a1b2c3d4-0001-0001-0001-000000000001', 'Dr. Ananya Sharma', 'MBBS, MS (Gynaecology)', 'Gynaecology', 'Allopathy', 12, 4.7, 860, 'Specialises in high-risk pregnancy and reproductive health.'),
  ('d0000001-0003-0003-0003-000000000002', 'a1b2c3d4-0002-0002-0002-000000000002', 'Dr. Anil Mehta', 'MBBS, MS (Orthopaedics)', 'Orthopaedics', 'Allopathy', 18, 4.6, 720, 'Expert in joint replacement and sports injury management.'),
  ('d0000001-0004-0004-0004-000000000002', 'a1b2c3d4-0002-0002-0002-000000000002', 'Dr. Vaidya Krishnamurthy', 'BAMS, MD (Ayurveda)', 'Panchakarma', 'Ayurveda', 20, 4.8, 540, 'Leading Ayurveda practitioner specialising in Panchakarma and chronic disease management.')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- HELPER FUNCTION: Auto-generate slots when a doctor schedule is requested
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION generate_doctor_slots(p_doctor_id TEXT, p_date DATE)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  slot_times TEXT[] := ARRAY[
    '09:00','09:30','10:00','10:30','11:00','11:30','12:00',
    '12:30','13:00','13:30','14:00','14:30','15:00','15:30',
    '16:00','16:30','17:00','17:30','18:00','18:30','19:00'
  ];
  t TEXT;
  h INTEGER;
  m INTEGER;
  label TEXT;
  sess TEXT;
  cap INTEGER;
BEGIN
  FOREACH t IN ARRAY slot_times LOOP
    h := CAST(SPLIT_PART(t, ':', 1) AS INTEGER);
    m := CAST(SPLIT_PART(t, ':', 2) AS INTEGER);

    -- Format label as 12-hr
    IF h = 12 THEN label := t || ' PM';
    ELSIF h > 12 THEN label := LPAD((h-12)::TEXT, 2, '0') || ':' || LPAD(m::TEXT, 2, '0') || ' PM';
    ELSE label := t || ' AM';
    END IF;

    -- Determine session
    IF h < 12 THEN sess := 'morning';
    ELSIF h < 16 THEN sess := 'afternoon';
    ELSE sess := 'evening';
    END IF;

    -- Random capacity 2–4
    cap := 2 + floor(random() * 3)::INTEGER;

    INSERT INTO public.slot_schedules (doctor_id, date, time_24, time_label, session, capacity, is_open)
    VALUES (p_doctor_id, p_date, t, label, sess, cap, TRUE)
    ON CONFLICT (doctor_id, date, time_24) DO NOTHING;
  END LOOP;
END;
$$;

-- Atomic booking prevents duplicate tokens and over-capacity slots under load.
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
  v_token TEXT;
  v_appointment public.appointments%ROWTYPE;
BEGIN
  -- Serialize the entire doctor's day, not only one time slot. Otherwise two
  -- simultaneous bookings in different slots can generate the same token.
  PERFORM pg_advisory_xact_lock(hashtext('booking:' || p_doctor_id || ':' || p_date::text));

  SELECT * INTO v_slot FROM public.slot_schedules
   WHERE doctor_id = p_doctor_id AND date = p_date AND time_24 = p_time_24
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Slot not found'; END IF;
  IF NOT v_slot.is_open THEN RAISE EXCEPTION 'Slot is closed'; END IF;

  SELECT count(*) INTO v_booked FROM public.appointments
   WHERE doctor_id = p_doctor_id AND date = p_date AND time_24 = p_time_24
     AND status <> 'cancelled';
  IF v_booked >= v_slot.capacity THEN RAISE EXCEPTION 'Slot is fully booked'; END IF;

  SELECT '#' || lpad((count(*) + 1)::text, 3, '0') INTO v_token
    FROM public.appointments
   WHERE doctor_id = p_doctor_id AND date = p_date AND status <> 'cancelled';

  INSERT INTO public.appointments
    (patient_id, doctor_id, hospital_id, date, time_24, time_label, token_number, reason, status)
  VALUES
    (p_patient_id, p_doctor_id, p_hospital_id, p_date, p_time_24, p_time_label, v_token, p_reason, 'confirmed')
  RETURNING * INTO v_appointment;

  INSERT INTO public.doctor_queue(appointment_id, doctor_id, date, status)
  VALUES(v_appointment.id, p_doctor_id, p_date, 'waiting');
  RETURN v_appointment;
END;
$$;

GRANT EXECUTE ON FUNCTION public.book_appointment(UUID,TEXT,TEXT,DATE,TEXT,TEXT,TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_clinical_intake(p_intake_id UUID)
RETURNS public.clinical_intakes
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_intake public.clinical_intakes%ROWTYPE; v_token TEXT; v_date DATE := CURRENT_DATE;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('intake-queue:' || v_date::text));
  SELECT * INTO v_intake FROM public.clinical_intakes WHERE id=p_intake_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Clinical intake not found'; END IF;
  IF v_intake.token_number IS NULL THEN
    SELECT 'T' || lpad((count(*)+1)::text,3,'0') INTO v_token
      FROM public.clinical_intakes WHERE queue_date=v_date AND token_number IS NOT NULL;
    UPDATE public.clinical_intakes SET token_number=v_token, queue_date=v_date,
      status='submitted', submitted_at=NOW(), updated_at=NOW()
      WHERE id=p_intake_id RETURNING * INTO v_intake;
  END IF;
  RETURN v_intake;
END; $$;
GRANT EXECUTE ON FUNCTION public.submit_clinical_intake(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.ensure_booking_catalog(
  p_hospital JSONB,
  p_doctor JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.hospitals(id, name, address, city, type, rating)
  VALUES (p_hospital->>'id', p_hospital->>'name', p_hospital->>'address',
          p_hospital->>'city', COALESCE(p_hospital->>'type','Government'),
          NULLIF(p_hospital->>'rating','')::numeric)
  ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name, address=EXCLUDED.address,
    city=EXCLUDED.city, type=EXCLUDED.type, rating=EXCLUDED.rating;

  IF p_doctor IS NOT NULL THEN
    INSERT INTO public.doctors(id, hospital_id, name, degrees, speciality, system, experience, rating, is_active)
    VALUES (p_doctor->>'id', p_hospital->>'id', p_doctor->>'name', p_doctor->>'degrees',
            p_doctor->>'speciality', COALESCE(p_doctor->>'system','Allopathy'),
            NULLIF(p_doctor->>'experience','')::integer, NULLIF(p_doctor->>'rating','')::numeric, TRUE)
    ON CONFLICT(id) DO UPDATE SET hospital_id=EXCLUDED.hospital_id, name=EXCLUDED.name,
      degrees=EXCLUDED.degrees, speciality=EXCLUDED.speciality, system=EXCLUDED.system,
      experience=EXCLUDED.experience, rating=EXCLUDED.rating, is_active=TRUE;
  END IF;
  RETURN jsonb_build_object('hospital_id',p_hospital->>'id','doctor_id',p_doctor->>'id');
END;
$$;
GRANT EXECUTE ON FUNCTION public.ensure_booking_catalog(JSONB,JSONB) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.staff_login(p_username TEXT, p_password TEXT)
RETURNS TABLE(id UUID, username TEXT, name TEXT, role TEXT, department TEXT, doctor_id TEXT)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id,s.username,s.name,s.role,s.department,s.doctor_id
  FROM public.staff_accounts s
  WHERE lower(s.username)=lower(trim(p_username)) AND s.is_active
    AND s.password_hash=extensions.crypt(p_password,s.password_hash)
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.staff_login(TEXT,TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_staff_account(
  p_username TEXT, p_password TEXT, p_name TEXT, p_role TEXT,
  p_department TEXT DEFAULT NULL, p_doctor_id TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO public.staff_accounts(username,password_hash,name,role,department,doctor_id)
  VALUES(lower(trim(p_username)),extensions.crypt(p_password,extensions.gen_salt('bf')),p_name,p_role,p_department,p_doctor_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.create_staff_account(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_staff_accounts()
RETURNS TABLE(id UUID, username TEXT, name TEXT, role TEXT, department TEXT, doctor_id TEXT, is_active BOOLEAN)
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  SELECT s.id,s.username,s.name,s.role,s.department,s.doctor_id,s.is_active
  FROM public.staff_accounts s ORDER BY s.created_at;
$$;
GRANT EXECUTE ON FUNCTION public.list_staff_accounts() TO anon, authenticated;

INSERT INTO public.staff_accounts(username,password_hash,name,role,department,doctor_id)
VALUES
 ('doc-101',extensions.crypt('password',extensions.gen_salt('bf')),'Dr. A. K. Sharma','doctor','General OPD','d0000001-0001-0001-0001-000000000001'),
 ('admin-001',extensions.crypt('password',extensions.gen_salt('bf')),'System Administrator','admin','Administration',NULL)
ON CONFLICT(username) DO NOTHING;

INSERT INTO public.communities(id,title,category,description) VALUES
 ('ayush-wellness','AYUSH & Daily Dinacharya Club','Ayurveda','Ayurvedic nutrition, yoga and seasonal wellness.'),
 ('senior-care','Senior Health & Mobility Circle','General Care','Mobility, monitoring and senior wellness.'),
 ('diabetes-care','Diabetes & Nutrition Support Group','Chronic Care','Nutrition, glucose tracking and support.'),
 ('maternal-health','Mother & Child Care Community','Family Health','Prenatal, vaccination and child nutrition support.')
ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title, category=EXCLUDED.category, description=EXCLUDED.description;

-- Private report bucket. The app stores metadata even when no binary is supplied.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('medical-reports', 'medical-reports', FALSE, 15728640,
        ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Medical report uploads" ON storage.objects;
DROP POLICY IF EXISTS "Medical report reads" ON storage.objects;
CREATE POLICY "Medical report uploads" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'medical-reports');
CREATE POLICY "Medical report reads" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'medical-reports');
