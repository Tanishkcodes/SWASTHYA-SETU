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
  token_number  TEXT,                        -- e.g. "APT-20260830-001"
  reason        TEXT,
  status        TEXT DEFAULT 'confirmed'
                CHECK (status IN ('confirmed','completed','cancelled','no_show')),
  opd_room      TEXT,
  doctor_notes  TEXT,
  prescription  TEXT,
  booked_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- One atomic sequence per appointment date. The date is embedded in the
-- public token, so every stored token remains globally unique across dates.
CREATE TABLE IF NOT EXISTS public.appointment_token_counters (
  token_date  DATE PRIMARY KEY,
  last_value BIGINT NOT NULL DEFAULT 0 CHECK (last_value >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

-- Convert old #001-style values without changing tokens that already use the
-- new format. Legacy rows are numbered deterministically within their date.
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

-- Bring counters forward to the greatest token already stored for each date.
INSERT INTO public.appointment_token_counters(token_date, last_value)
SELECT date, MAX(SUBSTRING(token_number FROM '([0-9]+)$')::BIGINT)
  FROM public.appointments
 WHERE token_number ~ '^APT-[0-9]{8}-[0-9]+$'
 GROUP BY date
ON CONFLICT(token_date) DO UPDATE
  SET last_value = GREATEST(public.appointment_token_counters.last_value, EXCLUDED.last_value),
      updated_at = NOW();

DROP INDEX IF EXISTS public.uq_doctor_daily_token;
CREATE UNIQUE INDEX IF NOT EXISTS uq_appointment_token
  ON public.appointments(token_number)
  WHERE token_number IS NOT NULL;

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
ALTER TABLE public.appointment_token_counters ENABLE ROW LEVEL SECURITY;

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

-- ═══════════════════════════════════════════════════════════════════════════
-- LIVE DONATIONS — no sample requests or contributions are seeded
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS blood_group TEXT
  CHECK (blood_group IS NULL OR blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-'));

CREATE TABLE IF NOT EXISTS public.donation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id TEXT NOT NULL REFERENCES public.hospitals(id) ON DELETE RESTRICT,
  created_by_staff_id UUID REFERENCES public.staff_accounts(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK(category IN ('blood','financial','equipment','medicine','other')),
  title TEXT NOT NULL CHECK(char_length(trim(title)) BETWEEN 3 AND 140),
  description TEXT NOT NULL CHECK(char_length(trim(description)) BETWEEN 10 AND 2000),
  patient_summary TEXT CHECK(patient_summary IS NULL OR char_length(patient_summary)<=500),
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK(urgency IN ('normal','medium','high','critical')),
  urgency_rank SMALLINT GENERATED ALWAYS AS (CASE urgency WHEN 'critical' THEN 4 WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END) STORED,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('draft','active','fulfilled','closed','cancelled')),
  amount_target NUMERIC(12,2) CHECK(amount_target IS NULL OR amount_target>0),
  amount_received NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK(amount_received>=0),
  blood_group TEXT CHECK(blood_group IS NULL OR blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  units_needed INTEGER CHECK(units_needed IS NULL OR units_needed BETWEEN 1 AND 10000),
  units_fulfilled INTEGER NOT NULL DEFAULT 0 CHECK(units_fulfilled>=0),
  location TEXT CHECK(location IS NULL OR char_length(location)<=300),
  contact_instructions TEXT CHECK(contact_instructions IS NULL OR char_length(contact_instructions)<=500),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK((category='blood' AND blood_group IS NOT NULL AND units_needed IS NOT NULL AND amount_target IS NULL)
     OR (category='financial' AND amount_target IS NOT NULL AND blood_group IS NULL AND units_needed IS NULL)
     OR (category IN ('equipment','medicine','other') AND blood_group IS NULL AND units_needed IS NULL)),
  CHECK(expires_at IS NULL OR expires_at>created_at)
);

CREATE TABLE IF NOT EXISTS public.donation_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.donation_requests(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  contribution_type TEXT NOT NULL CHECK(contribution_type IN ('funds','blood_response','equipment','medicine','other')),
  amount_inr NUMERIC(12,2) CHECK(amount_inr IS NULL OR amount_inr>0),
  units_offered INTEGER CHECK(units_offered IS NULL OR units_offered BETWEEN 1 AND 20),
  blood_group TEXT CHECK(blood_group IS NULL OR blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  message TEXT CHECK(message IS NULL OR char_length(message)<=1000),
  status TEXT NOT NULL DEFAULT 'pledged' CHECK(status IN ('pledged','contact_requested','confirmed','completed','declined','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK((contribution_type='funds' AND amount_inr IS NOT NULL AND units_offered IS NULL)
     OR (contribution_type='blood_response' AND units_offered IS NOT NULL AND blood_group IS NOT NULL AND amount_inr IS NULL)
     OR (contribution_type IN ('equipment','medicine','other') AND amount_inr IS NULL AND units_offered IS NULL))
);

CREATE INDEX IF NOT EXISTS idx_donation_requests_live ON public.donation_requests(status,urgency_rank DESC,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donation_requests_hospital ON public.donation_requests(hospital_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donation_contributions_patient ON public.donation_contributions(patient_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donation_contributions_request ON public.donation_contributions(request_id,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_patient_request_response ON public.donation_contributions(request_id,patient_id) WHERE status NOT IN ('declined','cancelled');
ALTER TABLE public.donation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_contributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read live donation requests" ON public.donation_requests;
DROP POLICY IF EXISTS "Staff app can manage donation requests" ON public.donation_requests;
DROP POLICY IF EXISTS "Patients can read contributions" ON public.donation_contributions;
CREATE POLICY "Public can read live donation requests" ON public.donation_requests FOR SELECT USING(true);
CREATE POLICY "Staff app can manage donation requests" ON public.donation_requests FOR ALL USING(true) WITH CHECK(true);
CREATE POLICY "Patients can read contributions" ON public.donation_contributions FOR SELECT USING(true);

CREATE OR REPLACE FUNCTION public.respond_to_donation_request(
  p_request_id UUID,p_patient_id UUID,p_contribution_type TEXT,p_amount_inr NUMERIC DEFAULT NULL,
  p_units_offered INTEGER DEFAULT NULL,p_blood_group TEXT DEFAULT NULL,p_message TEXT DEFAULT NULL
) RETURNS public.donation_contributions LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_request public.donation_requests%ROWTYPE; v_response public.donation_contributions%ROWTYPE;
BEGIN
  SELECT * INTO v_request FROM public.donation_requests WHERE id=p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Donation request not found'; END IF;
  IF v_request.status<>'active' OR (v_request.expires_at IS NOT NULL AND v_request.expires_at<=NOW()) THEN RAISE EXCEPTION 'This donation request is no longer active'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.patients WHERE id=p_patient_id) THEN RAISE EXCEPTION 'Patient session not found'; END IF;
  IF (v_request.category='blood' AND p_contribution_type<>'blood_response') OR (v_request.category='financial' AND p_contribution_type<>'funds') OR (v_request.category IN ('equipment','medicine','other') AND p_contribution_type<>v_request.category) THEN RAISE EXCEPTION 'Response type does not match this request'; END IF;
  IF p_contribution_type='funds' AND (p_amount_inr IS NULL OR p_amount_inr<=0) THEN RAISE EXCEPTION 'Enter a valid pledge amount'; END IF;
  IF p_contribution_type='blood_response' AND (p_units_offered IS NULL OR p_units_offered<1 OR p_blood_group IS NULL) THEN RAISE EXCEPTION 'Blood group and offered units are required'; END IF;
  INSERT INTO public.donation_contributions(request_id,patient_id,contribution_type,amount_inr,units_offered,blood_group,message,status)
  VALUES(p_request_id,p_patient_id,p_contribution_type,p_amount_inr,p_units_offered,p_blood_group,NULLIF(trim(p_message),''),CASE WHEN p_contribution_type='blood_response' THEN 'contact_requested' ELSE 'pledged' END)
  RETURNING * INTO v_response; RETURN v_response;
END; $$;
GRANT EXECUTE ON FUNCTION public.respond_to_donation_request(UUID,UUID,TEXT,NUMERIC,INTEGER,TEXT,TEXT) TO anon,authenticated;

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

-- ─── LIVE HELP & SUPPORT ─────────────────────────────────────────────────────
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS support_phone TEXT, ADD COLUMN IF NOT EXISTS emergency_phone TEXT,
 ADD COLUMN IF NOT EXISTS support_email TEXT, ADD COLUMN IF NOT EXISTS website_url TEXT,
 ADD COLUMN IF NOT EXISTS support_hours TEXT, ADD COLUMN IF NOT EXISTS contact_verified_at TIMESTAMPTZ,
 ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.support_channels (
 id TEXT PRIMARY KEY, channel_type TEXT NOT NULL CHECK(channel_type IN ('phone','emergency','email','website','chat')),
 label TEXT NOT NULL, description TEXT, label_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
 description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb, phone TEXT, email TEXT, url TEXT, hours TEXT,
 languages TEXT[] NOT NULL DEFAULT '{}', is_active BOOLEAN NOT NULL DEFAULT TRUE, is_verified BOOLEAN NOT NULL DEFAULT FALSE,
 display_order INTEGER NOT NULL DEFAULT 100, verified_source_url TEXT, verified_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK((channel_type IN ('phone','emergency') AND phone IS NOT NULL) OR (channel_type='email' AND email IS NOT NULL) OR (channel_type IN ('website','chat') AND url IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS public.support_faqs (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), category TEXT NOT NULL DEFAULT 'general',
 question TEXT NOT NULL CHECK(char_length(trim(question)) BETWEEN 5 AND 300), answer TEXT NOT NULL CHECK(char_length(trim(answer)) BETWEEN 5 AND 4000),
 question_i18n JSONB NOT NULL DEFAULT '{}'::jsonb, answer_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
 is_active BOOLEAN NOT NULL DEFAULT TRUE, display_order INTEGER NOT NULL DEFAULT 100,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.support_requests (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
 hospital_id TEXT REFERENCES public.hospitals(id) ON DELETE SET NULL,
 category TEXT NOT NULL CHECK(category IN ('appointment','medical_record','donation','community','technical','accessibility','feedback','other')),
 subject TEXT NOT NULL CHECK(char_length(trim(subject)) BETWEEN 3 AND 180), message TEXT NOT NULL CHECK(char_length(trim(message)) BETWEEN 10 AND 4000),
 preferred_contact TEXT NOT NULL DEFAULT 'in_app' CHECK(preferred_contact IN ('in_app','phone','email')),
 language TEXT NOT NULL DEFAULT 'en', status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','assigned','in_progress','resolved','closed')),
 assigned_staff_id UUID REFERENCES public.staff_accounts(id) ON DELETE SET NULL, resolution_note TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_support_requests_patient ON public.support_requests(patient_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_requests_queue ON public.support_requests(status,created_at);
ALTER TABLE public.support_channels ENABLE ROW LEVEL SECURITY; ALTER TABLE public.support_faqs ENABLE ROW LEVEL SECURITY; ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read verified support channels" ON public.support_channels; DROP POLICY IF EXISTS "Public can read active support faqs" ON public.support_faqs; DROP POLICY IF EXISTS "Public can read patient support requests" ON public.support_requests;
CREATE POLICY "Public can read verified support channels" ON public.support_channels FOR SELECT USING(is_active AND is_verified);
CREATE POLICY "Public can read active support faqs" ON public.support_faqs FOR SELECT USING(is_active);
CREATE OR REPLACE FUNCTION public.create_support_request(p_patient_id UUID,p_hospital_id TEXT,p_category TEXT,p_subject TEXT,p_message TEXT,p_preferred_contact TEXT DEFAULT 'in_app',p_language TEXT DEFAULT 'en')
RETURNS public.support_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE v_request public.support_requests%ROWTYPE; BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.patients WHERE id=p_patient_id) THEN RAISE EXCEPTION 'Patient session not found'; END IF;
 IF p_hospital_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.hospitals WHERE id=p_hospital_id) THEN RAISE EXCEPTION 'Hospital not found'; END IF;
 INSERT INTO public.support_requests(patient_id,hospital_id,category,subject,message,preferred_contact,language)
 VALUES(p_patient_id,p_hospital_id,p_category,trim(p_subject),trim(p_message),p_preferred_contact,COALESCE(NULLIF(p_language,''),'en')) RETURNING * INTO v_request; RETURN v_request; END; $$;
CREATE OR REPLACE FUNCTION public.list_support_requests(p_patient_id UUID) RETURNS SETOF public.support_requests LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ SELECT request.* FROM public.support_requests request WHERE request.patient_id=p_patient_id ORDER BY request.created_at DESC $$;
GRANT SELECT ON public.support_channels,public.support_faqs TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_support_request(UUID,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.list_support_requests(UUID) TO anon,authenticated;
INSERT INTO public.support_channels(id,channel_type,label,description,phone,hours,languages,is_active,is_verified,display_order,verified_source_url,verified_at)
VALUES('india-erss-112','emergency','Emergency Response Support System','Pan-India emergency assistance for medical, police, fire and rescue services.','112','24x7',ARRAY['en','hi'],TRUE,TRUE,10,'https://112.gov.in/',NOW())
ON CONFLICT(id) DO UPDATE SET phone=EXCLUDED.phone,hours=EXCLUDED.hours,is_active=TRUE,is_verified=TRUE,verified_source_url=EXCLUDED.verified_source_url,verified_at=EXCLUDED.verified_at,updated_at=NOW();
