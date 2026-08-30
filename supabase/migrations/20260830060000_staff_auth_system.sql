-- =============================================================================
-- Migration: Complete Staff Authentication & Encrypted Password System
-- =============================================================================

-- Ensure pgcrypto extension is active in extensions or public schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- 1. Create staff_accounts table
CREATE TABLE IF NOT EXISTS public.staff_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'doctor' CHECK (role IN ('doctor', 'admin', 'nurse')),
  department TEXT,
  doctor_id TEXT REFERENCES public.doctors(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  password_changed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_username ON public.staff_accounts(LOWER(username));

-- Drop existing functions first to allow return type / table signature changes
DROP FUNCTION IF EXISTS public.create_staff_account(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_staff_account(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_staff_account(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.staff_login(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.change_staff_password(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.list_staff_accounts();

-- 2. Function to create a staff account with encrypted password (called by Admin)
CREATE OR REPLACE FUNCTION public.create_staff_account(
  p_username TEXT,
  p_password TEXT,
  p_name TEXT,
  p_role TEXT DEFAULT 'doctor',
  p_department TEXT DEFAULT NULL,
  p_doctor_id TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_id UUID;
  v_hash TEXT;
  v_doc_id TEXT := p_doctor_id;
BEGIN
  IF p_username IS NULL OR p_password IS NULL OR p_name IS NULL THEN
    RAISE EXCEPTION 'Username, password, and name are required';
  END IF;

  -- Hash password securely with pgcrypto Blowfish/bcrypt
  v_hash := extensions.crypt(p_password, extensions.gen_salt('bf'));

  -- Auto-match doctor_id if not explicitly provided
  IF v_doc_id IS NULL AND p_role = 'doctor' THEN
    SELECT id INTO v_doc_id
    FROM public.doctors
    WHERE LOWER(name) = LOWER(p_name) OR LOWER(email) = LOWER(p_username)
    LIMIT 1;
  END IF;

  INSERT INTO public.staff_accounts (username, password_hash, name, role, department, doctor_id)
  VALUES (LOWER(TRIM(p_username)), v_hash, p_name, p_role, p_department, v_doc_id)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 3. Function to authenticate staff (Doctor / Admin Login)
CREATE OR REPLACE FUNCTION public.staff_login(
  p_username TEXT,
  p_password TEXT
) RETURNS TABLE (
  id UUID,
  username TEXT,
  name TEXT,
  role TEXT,
  department TEXT,
  doctor_id TEXT,
  is_active BOOLEAN,
  password_changed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.username,
    s.name,
    s.role,
    s.department,
    s.doctor_id,
    s.is_active,
    s.password_changed_at
  FROM public.staff_accounts s
  WHERE LOWER(s.username) = LOWER(TRIM(p_username))
    AND s.is_active = TRUE
    AND s.password_hash = extensions.crypt(p_password, s.password_hash);
END;
$$;

-- 4. Function for Doctor to change password from Physician Dashboard
CREATE OR REPLACE FUNCTION public.change_staff_password(
  p_username TEXT,
  p_old_password TEXT,
  p_new_password TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_found BOOLEAN;
  v_new_hash TEXT;
BEGIN
  IF LENGTH(p_new_password) < 6 THEN
    RAISE EXCEPTION 'New password must be at least 6 characters long';
  END IF;

  -- Verify old password
  SELECT EXISTS (
    SELECT 1 FROM public.staff_accounts
    WHERE LOWER(username) = LOWER(TRIM(p_username))
      AND is_active = TRUE
      AND password_hash = extensions.crypt(p_old_password, password_hash)
  ) INTO v_found;

  IF NOT v_found THEN
    RAISE EXCEPTION 'Current password is incorrect';
  END IF;

  -- Hash new password securely
  v_new_hash := extensions.crypt(p_new_password, extensions.gen_salt('bf'));

  UPDATE public.staff_accounts
  SET
    password_hash = v_new_hash,
    password_changed_at = NOW(),
    updated_at = NOW()
  WHERE LOWER(username) = LOWER(TRIM(p_username));

  RETURN TRUE;
END;
$$;

-- 5. Function to list staff accounts for Admin Dashboard
CREATE OR REPLACE FUNCTION public.list_staff_accounts()
RETURNS TABLE (
  id UUID,
  username TEXT,
  name TEXT,
  role TEXT,
  department TEXT,
  doctor_id TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.username,
    s.name,
    s.role,
    s.department,
    s.doctor_id,
    s.is_active,
    s.created_at,
    s.password_changed_at
  FROM public.staff_accounts s
  ORDER BY s.created_at DESC;
END;
$$;

-- 7. Seed all partner hospitals
INSERT INTO public.hospitals (id, name, address, city, type, rating) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'AIIMS New Delhi', 'Ansari Nagar, New Delhi', 'New Delhi', 'Government', 4.9),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'Sawai Man Singh Hospital', 'J.L.N. Marg, Jaipur', 'Jaipur', 'Government', 4.6),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'Indraprastha Apollo Hospitals', 'Sarita Vihar, Mathura Road, New Delhi', 'New Delhi', 'Private', 4.8),
  ('a1b2c3d4-0004-0004-0004-000000000004', 'Shalby Hospital Jaipur', 'Vaishali Nagar, Jaipur', 'Jaipur', 'Private', 4.7)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  type = EXCLUDED.type,
  rating = EXCLUDED.rating;

-- 8. Seed all doctors into public.doctors with full attributes
INSERT INTO public.doctors (id, hospital_id, name, degrees, speciality, system, experience, age, gender, email, avatar_url, rating) VALUES
  ('d0000001-0001-0001-0001-000000000001', 'a1b2c3d4-0001-0001-0001-000000000001', 'Dr. Randeep Guleria', 'MBBS, MD (Pulmonary Medicine)', 'Pulmonology', 'Allopathy', 26, 56, 'Male', 'drrandeepguleria@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/men/11.jpg', 4.9),
  ('d0000001-0002-0002-0002-000000000001', 'a1b2c3d4-0002-0002-0002-000000000002', 'Dr. Ananya Sharma', 'MBBS, MD (Internal Medicine)', 'General Physician', 'Allopathy', 12, 36, 'Female', 'drananyasharma@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/women/44.jpg', 4.8),
  ('d0000001-0003-0003-0003-000000000002', 'a1b2c3d4-0002-0002-0002-000000000002', 'Dr. Anil Mehta', 'MBBS, MS (Orthopaedics)', 'Orthopaedics', 'Allopathy', 18, 48, 'Male', 'dranilmehta@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/men/32.jpg', 4.6),
  ('d0000001-0004-0004-0004-000000000002', 'a1b2c3d4-0002-0002-0002-000000000002', 'Vaidya R. Mehta', 'BAMS, MD (Ayurveda)', 'Ayurveda & Panchakarma', 'Ayurveda', 18, 49, 'Male', 'vaidyarmehta@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/men/52.jpg', 4.9),
  ('d0000001-0005-0002-0002-000000000002', 'a1b2c3d4-0002-0002-0002-000000000002', 'Dr. Priya Verma', 'MBBS, DGO (Family Medicine)', 'General Medicine', 'Allopathy', 10, 35, 'Female', 'drpriyaverma@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/women/65.jpg', 4.8),
  ('d0000001-0006-0002-0002-000000000002', 'a1b2c3d4-0002-0002-0002-000000000002', 'Dr. Rohan Mehta', 'MBBS, MD (Internal Medicine)', 'General Medicine', 'Allopathy', 8, 34, 'Male', 'drrohanmehta@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/men/32.jpg', 4.7),
  ('d0000001-0007-0002-0002-000000000002', 'a1b2c3d4-0002-0002-0002-000000000002', 'Dr. Neha Agarwal', 'MBBS, DNB (Family Medicine)', 'General Medicine', 'Allopathy', 7, 33, 'Female', 'drnehaagarwal@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/women/68.jpg', 4.9),
  ('d0000001-0008-0002-0002-000000000002', 'a1b2c3d4-0002-0002-0002-000000000002', 'Dr. Amit Singh', 'MBBS, MS', 'General Medicine', 'Allopathy', 15, 44, 'Male', 'dramitsingh@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/men/46.jpg', 4.8),
  ('d0000001-0009-0002-0002-000000000002', 'a1b2c3d4-0002-0002-0002-000000000002', 'Vaidya Sanjeev Sharma', 'BAMS, Ph.D. (Ayurveda)', 'Ayurveda & Panchakarma', 'Ayurveda', 22, 53, 'Male', 'vaidyasanjeev@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/men/61.jpg', 5.0)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  degrees = EXCLUDED.degrees,
  speciality = EXCLUDED.speciality,
  system = EXCLUDED.system,
  experience = EXCLUDED.experience,
  age = EXCLUDED.age,
  gender = EXCLUDED.gender,
  email = EXCLUDED.email,
  avatar_url = EXCLUDED.avatar_url,
  rating = EXCLUDED.rating;

-- 9. Insert or Update Staff Credentials with exact linked doctor_id
INSERT INTO public.staff_accounts (username, password_hash, name, role, department, doctor_id)
VALUES
  ('admin', extensions.crypt('admin123', extensions.gen_salt('bf')), 'Hospital Administrator', 'admin', 'Central Administration', NULL),
  ('swasthya_admin', extensions.crypt('SwasthyaAdmin@2026', extensions.gen_salt('bf')), 'Chief Systems Admin', 'admin', 'Executive Operations', NULL),
  ('drananyasharma', extensions.crypt('doctor123', extensions.gen_salt('bf')), 'Dr. Ananya Sharma', 'doctor', 'General Physician', 'd0000001-0002-0002-0002-000000000001'),
  ('drrandeepguleria', extensions.crypt('doctor123', extensions.gen_salt('bf')), 'Dr. Randeep Guleria', 'doctor', 'Pulmonology', 'd0000001-0001-0001-0001-000000000001'),
  ('drpriyaverma', extensions.crypt('doctor123', extensions.gen_salt('bf')), 'Dr. Priya Verma', 'doctor', 'General Medicine', 'd0000001-0005-0002-0002-000000000002'),
  ('drrohanmehta', extensions.crypt('doctor123', extensions.gen_salt('bf')), 'Dr. Rohan Mehta', 'doctor', 'General Medicine', 'd0000001-0006-0002-0002-000000000002'),
  ('vaidyarmehta', extensions.crypt('doctor123', extensions.gen_salt('bf')), 'Vaidya R. Mehta', 'doctor', 'Ayurveda & Panchakarma', 'd0000001-0004-0004-0004-000000000002')
ON CONFLICT (username) DO UPDATE SET
  doctor_id = EXCLUDED.doctor_id,
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  role = EXCLUDED.role;
