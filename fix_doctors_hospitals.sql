-- ═══════════════════════════════════════════════════════════════════════════
-- SWASTHYA SETU — COMPLETE DATABASE MIGRATION & UNIFICATION
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Ensure columns exist on tables
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS hospital_id TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS hospital_name TEXT;
ALTER TABLE public.staff_accounts ADD COLUMN IF NOT EXISTS hospital_id TEXT;
ALTER TABLE public.staff_accounts ADD COLUMN IF NOT EXISTS hospital_name TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS hospital_id TEXT;

-- Relax community_posts columns
ALTER TABLE public.community_posts ALTER COLUMN author_staff_id DROP NOT NULL;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS doctor_id TEXT;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS poll_data JSONB;
ALTER TABLE public.community_posts DROP CONSTRAINT IF EXISTS community_posts_post_type_check;
ALTER TABLE public.community_posts DROP CONSTRAINT IF EXISTS community_posts_media_url_check;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. OPEN ROW LEVEL SECURITY (RLS) POLICIES FOR ALL 24 TABLES (LIVE SYNC)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.appointment_token_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for appointment_token_counters" ON public.appointment_token_counters;
DROP POLICY IF EXISTS "Allow all for appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow all for clinical_intakes" ON public.clinical_intakes;
DROP POLICY IF EXISTS "Allow all for communities" ON public.communities;
DROP POLICY IF EXISTS "Allow all for community_post_comments" ON public.community_post_comments;
DROP POLICY IF EXISTS "Allow all for community_post_reactions" ON public.community_post_reactions;
DROP POLICY IF EXISTS "Allow all for community_posts" ON public.community_posts;
DROP POLICY IF EXISTS "Allow all for community_professionals" ON public.community_professionals;
DROP POLICY IF EXISTS "Allow all for doctor_queue" ON public.doctor_queue;
DROP POLICY IF EXISTS "Allow all for doctors" ON public.doctors;
DROP POLICY IF EXISTS "Allow all for donation_contributions" ON public.donation_contributions;
DROP POLICY IF EXISTS "Allow all for donation_pledges" ON public.donation_pledges;
DROP POLICY IF EXISTS "Allow all for donation_requests" ON public.donation_requests;
DROP POLICY IF EXISTS "Allow all for feedback" ON public.feedback;
DROP POLICY IF EXISTS "Allow all for hospitals" ON public.hospitals;
DROP POLICY IF EXISTS "Allow all for medical_reports" ON public.medical_reports;
DROP POLICY IF EXISTS "Allow all for patient_community_memberships" ON public.patient_community_memberships;
DROP POLICY IF EXISTS "Allow all for patients" ON public.patients;
DROP POLICY IF EXISTS "Allow all for slot_schedules" ON public.slot_schedules;
DROP POLICY IF EXISTS "Allow all for staff_accounts" ON public.staff_accounts;
DROP POLICY IF EXISTS "Allow all for support_channels" ON public.support_channels;
DROP POLICY IF EXISTS "Allow all for support_faqs" ON public.support_faqs;
DROP POLICY IF EXISTS "Allow all for support_requests" ON public.support_requests;
DROP POLICY IF EXISTS "Allow all for voice_interactions" ON public.voice_interactions;

CREATE POLICY "Allow all for appointment_token_counters" ON public.appointment_token_counters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for clinical_intakes" ON public.clinical_intakes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for communities" ON public.communities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for community_post_comments" ON public.community_post_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for community_post_reactions" ON public.community_post_reactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for community_posts" ON public.community_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for community_professionals" ON public.community_professionals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for doctor_queue" ON public.doctor_queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for doctors" ON public.doctors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for donation_contributions" ON public.donation_contributions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for donation_pledges" ON public.donation_pledges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for donation_requests" ON public.donation_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for feedback" ON public.feedback FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for hospitals" ON public.hospitals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for medical_reports" ON public.medical_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for patient_community_memberships" ON public.patient_community_memberships FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for patients" ON public.patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for slot_schedules" ON public.slot_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for staff_accounts" ON public.staff_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for support_channels" ON public.support_channels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for support_faqs" ON public.support_faqs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for support_requests" ON public.support_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for voice_interactions" ON public.voice_interactions FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. INSERT THE 13 OFFICIAL CLEAN HOSPITALS (CLEAN SLUGS ONLY)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.hospitals (id, name, address, city, state, type, rating, opd_timings) VALUES
  ('aiims-delhi', 'AIIMS New Delhi', 'Ansari Nagar, New Delhi', 'New Delhi', 'Delhi', 'Government', 4.9, '8:00 AM – 2:00 PM'),
  ('sms-jaipur', 'Sawai Man Singh Hospital', 'Jawahar Lal Nehru Marg, Jaipur, Rajasthan', 'Jaipur', 'Rajasthan', 'Government', 4.6, '9:00 AM – 4:00 PM'),
  ('apollo-delhi', 'Indraprastha Apollo Hospitals', 'Sarita Vihar, Mathura Road, New Delhi', 'New Delhi', 'Delhi', 'Private', 4.8, '8:30 AM – 5:00 PM'),
  ('shalby-jaipur', 'Shalby Hospital Jaipur', 'Vaishali Nagar, Jaipur, Rajasthan', 'Jaipur', 'Rajasthan', 'Private', 4.7, '9:00 AM – 5:00 PM'),
  ('aiia-delhi', 'All India Institute of Ayurveda (AIIA)', 'Ayush Campus, Sarita Vihar, New Delhi', 'New Delhi', 'Delhi', 'Government', 4.8, '8:00 AM – 2:00 PM'),
  ('nia-jaipur', 'National Institute of Ayurveda (NIA)', 'Jorawar Singh Gate, Amer Road, Jaipur, Rajasthan', 'Jaipur', 'Rajasthan', 'Government', 4.9, '8:30 AM – 3:30 PM'),
  ('narayana-bangalore', 'Narayana Health City', 'Bommasandra Industrial Area, Bangalore', 'Bangalore', 'Karnataka', 'Private', 4.8, '9:00 AM – 5:00 PM'),
  ('fortis-jaipur', 'Fortis Escorts Hospital', 'J.L.N. Marg, Malviya Nagar, Jaipur', 'Jaipur', 'Rajasthan', 'Private', 4.7, '8:00 AM – 4:00 PM'),
  ('tata-mumbai', 'Tata Memorial Hospital', 'Dr. E Borges Road, Parel, Mumbai', 'Mumbai', 'Maharashtra', 'Government', 4.8, '8:00 AM – 4:00 PM'),
  ('jaipur-hospital', 'Jaipur Hospital', 'Lal Kothi, Near SMS Stadium, Jaipur, Rajasthan', 'Jaipur', 'Rajasthan', 'Private', 4.5, '9:00 AM – 5:00 PM'),
  ('pgimer-chandigarh', 'PGIMER Chandigarh', 'Sector 12, Chandigarh', 'Chandigarh', 'Punjab', 'Government', 4.7, '8:30 AM – 2:30 PM'),
  ('kem-mumbai', 'KEM Hospital Mumbai', 'Acharya Dhonde Marg, Parel, Mumbai', 'Mumbai', 'Maharashtra', 'Government', 4.5, '9:00 AM – 3:00 PM'),
  ('nimhans-bangalore', 'NIMHANS Bangalore', 'Hosur Road, Bangalore', 'Bangalore', 'Karnataka', 'Government', 4.6, '9:00 AM – 1:00 PM')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  type = EXCLUDED.type,
  rating = EXCLUDED.rating,
  opd_timings = EXCLUDED.opd_timings;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. MIGRATE & CLEAN UP ALL LEGACY UUID REFERENCES
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE public.doctors SET hospital_id = 'aiims-delhi', hospital_name = 'AIIMS New Delhi'
 WHERE hospital_id = 'a1b2c3d4-0001-0001-0001-000000000001' OR hospital_id ILIKE '%aiims%';

UPDATE public.appointments SET hospital_id = 'aiims-delhi'
 WHERE hospital_id = 'a1b2c3d4-0001-0001-0001-000000000001' OR hospital_id ILIKE '%aiims%';

UPDATE public.staff_accounts SET hospital_id = 'aiims-delhi', hospital_name = 'AIIMS New Delhi'
 WHERE hospital_id = 'a1b2c3d4-0001-0001-0001-000000000001' OR hospital_id ILIKE '%aiims%';

UPDATE public.doctors SET hospital_id = 'sms-jaipur', hospital_name = 'Sawai Man Singh Hospital'
 WHERE hospital_id = 'a1b2c3d4-0002-0002-0002-000000000002' OR hospital_id ILIKE '%sawai%' OR hospital_id ILIKE '%sms%';

UPDATE public.appointments SET hospital_id = 'sms-jaipur'
 WHERE hospital_id = 'a1b2c3d4-0002-0002-0002-000000000002' OR hospital_id ILIKE '%sawai%' OR hospital_id ILIKE '%sms%';

UPDATE public.staff_accounts SET hospital_id = 'sms-jaipur', hospital_name = 'Sawai Man Singh Hospital'
 WHERE hospital_id = 'a1b2c3d4-0002-0002-0002-000000000002' OR hospital_id ILIKE '%sawai%' OR hospital_id ILIKE '%sms%';

UPDATE public.doctors SET hospital_id = 'apollo-delhi', hospital_name = 'Indraprastha Apollo Hospitals'
 WHERE hospital_id = 'a1b2c3d4-0003-0003-0003-000000000003' OR hospital_id ILIKE '%apollo%';

UPDATE public.appointments SET hospital_id = 'apollo-delhi'
 WHERE hospital_id = 'a1b2c3d4-0003-0003-0003-000000000003' OR hospital_id ILIKE '%apollo%';

UPDATE public.staff_accounts SET hospital_id = 'apollo-delhi', hospital_name = 'Indraprastha Apollo Hospitals'
 WHERE hospital_id = 'a1b2c3d4-0003-0003-0003-000000000003' OR hospital_id ILIKE '%apollo%';

UPDATE public.doctors SET hospital_id = 'shalby-jaipur', hospital_name = 'Shalby Hospital Jaipur'
 WHERE hospital_id = 'a1b2c3d4-0004-0004-0004-000000000004' OR hospital_id ILIKE '%shalby%';

UPDATE public.appointments SET hospital_id = 'shalby-jaipur'
 WHERE hospital_id = 'a1b2c3d4-0004-0004-0004-000000000004' OR hospital_id ILIKE '%shalby%';

UPDATE public.staff_accounts SET hospital_id = 'shalby-jaipur', hospital_name = 'Shalby Hospital Jaipur'
 WHERE hospital_id = 'a1b2c3d4-0004-0004-0004-000000000004' OR hospital_id ILIKE '%shalby%';

UPDATE public.doctors SET hospital_id = 'nimhans-bangalore', hospital_name = 'NIMHANS Bangalore'
 WHERE hospital_id LIKE 'a1b2c3d4-0005%' OR hospital_id ILIKE '%nimhans%';

UPDATE public.appointments SET hospital_id = 'nimhans-bangalore'
 WHERE hospital_id LIKE 'a1b2c3d4-0005%' OR hospital_id ILIKE '%nimhans%';

UPDATE public.staff_accounts SET hospital_id = 'nimhans-bangalore', hospital_name = 'NIMHANS Bangalore'
 WHERE hospital_id LIKE 'a1b2c3d4-0005%' OR hospital_id ILIKE '%nimhans%';

-- Delete duplicate UUID hospital rows
DELETE FROM public.hospitals WHERE id LIKE 'a1b2c3d4-%';
DELETE FROM public.hospitals WHERE id LIKE '% %';

-- Delete duplicate doctor rows with old temporary IDs
DELETE FROM public.doctors WHERE id IN (
  'd0000001-0003-0003-0003-000000000002',
  'd0000001-0004-0004-0004-000000000002',
  'sms-jaipur-dr-priya-verma',
  'sms-jaipur-dr-rohan-mehta',
  'sms-jaipur-vaidya-r-mehta',
  'sms-jaipur-vaidya-sanjeev-sharma',
  'aiims-delhi-dr-vikramaditya-rathore'
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. RE-INSERT ALL 17 OFFICIAL DOCTORS WITH CLEAN SLUG HOSPITAL IDs
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.doctors (
  id, hospital_id, hospital_name, name, degrees, speciality, system,
  experience, age, gender, email, avatar_url, rating, reviews_count, about, is_active
) VALUES
  ('d0000001-0001-0001-0001-000000000001', 'aiims-delhi', 'AIIMS New Delhi', 'Dr. Randeep Guleria', 'MBBS, MD (Pulmonary Medicine)', 'Pulmonology', 'Allopathy', 26, 56, 'Male', 'drrandeepguleria@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/men/11.jpg', 4.9, 1240, 'Former AIIMS Director, renowned pulmonologist with 26+ years of clinical excellence.', TRUE),
  ('d0000001-0002-0002-0002-000000000001', 'sms-jaipur', 'Sawai Man Singh Hospital', 'Dr. Ananya Sharma', 'MBBS, MD (Internal Medicine)', 'General Physician', 'Allopathy', 12, 36, 'Female', 'drananyasharma@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/women/44.jpg', 4.8, 860, 'Specialises in internal medicine, comprehensive primary care, and clinical triage.', TRUE),
  ('d0000001-0003-0001-0001-000000000001', 'aiims-delhi', 'AIIMS New Delhi', 'Dr. Vikramaditya Rathore', 'MBBS, MD, DM (Cardiology)', 'Cardiology', 'Allopathy', 20, 52, 'Male', 'drvikramaditya@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/men/18.jpg', 4.9, 940, 'Leading Interventional Cardiologist with 20+ years of complex cardiac care experience.', TRUE),
  ('d0000001-0004-0002-0002-000000000002', 'sms-jaipur', 'Sawai Man Singh Hospital', 'Dr. Priya Verma', 'MBBS, DGO (Family Medicine)', 'General Medicine', 'Allopathy', 10, 35, 'Female', 'drpriyaverma@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/women/65.jpg', 4.8, 95, 'Experienced general medicine and women health practitioner.', TRUE),
  ('d0000001-0005-0002-0002-000000000002', 'sms-jaipur', 'Sawai Man Singh Hospital', 'Dr. Rohan Mehta', 'MBBS, MD (Internal Medicine)', 'General Medicine', 'Allopathy', 8, 34, 'Male', 'drrohanmehta@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/men/32.jpg', 4.7, 84, 'Consultant Physician specialising in adult acute and chronic health management.', TRUE),
  ('d0000001-0006-0002-0002-000000000002', 'sms-jaipur', 'Sawai Man Singh Hospital', 'Dr. Neha Agarwal', 'MBBS, DNB (Family Medicine)', 'General Medicine', 'Allopathy', 7, 33, 'Female', 'drnehaagarwal@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/women/68.jpg', 4.9, 110, 'Dedicated primary care physician focused on preventive health checkups.', TRUE),
  ('d0000001-0007-0002-0002-000000000002', 'sms-jaipur', 'Sawai Man Singh Hospital', 'Dr. Amit Singh', 'MBBS, MS', 'General Medicine', 'Allopathy', 15, 44, 'Male', 'dramitsingh@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/men/46.jpg', 4.8, 210, 'Senior Medical Officer with comprehensive inpatient and outpatient clinical experience.', TRUE),
  ('d0000001-0008-0002-0002-000000000002', 'sms-jaipur', 'Sawai Man Singh Hospital', 'Vaidya R. Mehta', 'BAMS, MD (Ayurveda)', 'Ayurveda & Panchakarma', 'Ayurveda', 18, 49, 'Male', 'vaidyarmehta@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/men/52.jpg', 4.9, 190, 'Traditional Ayurveda practitioner with extensive clinical experience in Panchakarma therapies.', TRUE),
  ('d0000001-0009-0002-0002-000000000002', 'sms-jaipur', 'Sawai Man Singh Hospital', 'Vaidya Sanjeev Sharma', 'BAMS, Ph.D. (Ayurveda)', 'Ayurveda & Panchakarma', 'Ayurveda', 22, 53, 'Male', 'vaidyasanjeev@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/men/61.jpg', 5.0, 340, 'Renowned Ayurvedic physician and researcher in chronic disease remission.', TRUE),
  ('d0000001-0010-0003-0003-000000000003', 'apollo-delhi', 'Indraprastha Apollo Hospitals', 'Dr. Naresh Trehan', 'MBBS, MS, FRCS (Cardiology)', 'Cardiology', 'Allopathy', 24, 58, 'Male', 'drnareshtrehan@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/men/24.jpg', 4.9, 1520, 'Renowned cardiovascular and thoracic surgeon with global recognition.', TRUE),
  ('d0000001-0011-0003-0003-000000000003', 'apollo-delhi', 'Indraprastha Apollo Hospitals', 'Dr. Arjun Mehta', 'MBBS, MD (General Medicine)', 'General Medicine', 'Allopathy', 15, 46, 'Male', 'drarjunmehta@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/men/35.jpg', 4.8, 670, 'Expert in adult diagnostic medicine, metabolic disorders, and critical care.', TRUE),
  ('d0000001-0012-0004-0004-000000000004', 'shalby-jaipur', 'Shalby Hospital Jaipur', 'Dr. Rajesh Verma', 'MBBS, MS (Orthopedics)', 'Orthopedics & Joint Replacement', 'Allopathy', 15, 45, 'Male', 'drrajeshverma@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/men/43.jpg', 4.7, 480, 'Pioneer in minimally invasive joint replacement and sports orthopedics.', TRUE),
  ('d0000001-0013-0004-0004-000000000004', 'shalby-jaipur', 'Shalby Hospital Jaipur', 'Dr. Neha Gupta', 'MBBS, MD (General Medicine)', 'General Medicine', 'Allopathy', 9, 35, 'Female', 'drnehagupta@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/women/12.jpg', 4.8, 310, 'Internal Medicine specialist dedicated to lifestyle diseases and preventive health.', TRUE),
  ('d0000001-0014-0005-0005-000000000005', 'aiia-delhi', 'All India Institute of Ayurveda (AIIA)', 'Dr. Gayatri Joshi', 'BAMS, MD (Kayachikitsa)', 'Nadi Pariksha & Kayachikitsa', 'Ayurveda', 14, 41, 'Female', 'drgayatrijoshi@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/women/28.jpg', 4.9, 520, 'Expert in holistic Nadi Pariksha diagnostics and personalized Ayurvedic regimens.', TRUE),
  ('d0000001-0015-0007-0007-000000000007', 'narayana-bangalore', 'Narayana Health City', 'Dr. Devi Shetty', 'MBBS, MS, FRCS (Cardiac Surgery)', 'Cardiology', 'Allopathy', 30, 62, 'Male', 'drdevishetty@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/men/57.jpg', 5.0, 3800, 'World-renowned cardiac surgeon and healthcare visionary.', TRUE),
  ('d0000001-0016-0010-0010-000000000010', 'jaipur-hospital', 'Jaipur Hospital', 'Dr. Manoj Saxena', 'MBBS, MD (General Medicine)', 'General Medicine', 'Allopathy', 11, 39, 'Male', 'drmanojsaxena@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/men/64.jpg', 4.7, 290, 'Consultant physician specializing in infectious diseases and family medicine.', TRUE),
  ('d0000001-0017-0010-0010-000000000010', 'jaipur-hospital', 'Jaipur Hospital', 'Dr. Sunita Khandelwal', 'MBBS, DCH (Pediatrics)', 'Pediatrics', 'Allopathy', 8, 34, 'Female', 'drsunitakhandelwal@swasthyasetu.ac.in', 'https://randomuser.me/api/portraits/women/39.jpg', 4.9, 410, 'Compassionate pediatrician focusing on neonatal and child development health.', TRUE)
ON CONFLICT (id) DO UPDATE SET
  hospital_id = EXCLUDED.hospital_id,
  hospital_name = EXCLUDED.hospital_name,
  name = EXCLUDED.name,
  degrees = EXCLUDED.degrees,
  speciality = EXCLUDED.speciality,
  system = EXCLUDED.system,
  experience = EXCLUDED.experience,
  avatar_url = EXCLUDED.avatar_url,
  rating = EXCLUDED.rating,
  is_active = TRUE;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. PROVISION ALL HOSPITAL ADMINS IN staff_accounts
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.staff_accounts (username, password_hash, name, role, department, hospital_id, hospital_name, doctor_id, is_active)
VALUES
  ('admin.sms', extensions.crypt('admin.sms123', extensions.gen_salt('bf')), 'SMS Hospital Admin', 'admin', 'Hospital Administration', 'sms-jaipur', 'Sawai Man Singh Hospital', NULL, TRUE),
  ('admin.aiims', extensions.crypt('admin.aiims123', extensions.gen_salt('bf')), 'AIIMS Delhi Admin', 'admin', 'Hospital Administration', 'aiims-delhi', 'AIIMS New Delhi', NULL, TRUE),
  ('admin.apollo', extensions.crypt('admin.apollo123', extensions.gen_salt('bf')), 'Apollo Delhi Admin', 'admin', 'Hospital Administration', 'apollo-delhi', 'Indraprastha Apollo Hospitals', NULL, TRUE),
  ('admin.shalby', extensions.crypt('admin.shalby123', extensions.gen_salt('bf')), 'Shalby Jaipur Admin', 'admin', 'Hospital Administration', 'shalby-jaipur', 'Shalby Hospital Jaipur', NULL, TRUE),
  ('admin.aiia', extensions.crypt('admin.aiia123', extensions.gen_salt('bf')), 'AIIA Delhi Admin', 'admin', 'AYUSH Administration', 'aiia-delhi', 'All India Institute of Ayurveda (AIIA)', NULL, TRUE),
  ('admin.nia', extensions.crypt('admin.nia123', extensions.gen_salt('bf')), 'NIA Jaipur Admin', 'admin', 'AYUSH Administration', 'nia-jaipur', 'National Institute of Ayurveda (NIA)', NULL, TRUE),
  ('admin.narayana', extensions.crypt('admin.narayana123', extensions.gen_salt('bf')), 'Narayana Health Admin', 'admin', 'Hospital Administration', 'narayana-bangalore', 'Narayana Health City', NULL, TRUE),
  ('admin.fortis', extensions.crypt('admin.fortis123', extensions.gen_salt('bf')), 'Fortis Jaipur Admin', 'admin', 'Hospital Administration', 'fortis-jaipur', 'Fortis Escorts Hospital', NULL, TRUE),
  ('admin.tata', extensions.crypt('admin.tata123', extensions.gen_salt('bf')), 'Tata Memorial Admin', 'admin', 'Hospital Administration', 'tata-mumbai', 'Tata Memorial Hospital', NULL, TRUE),
  ('admin.jaipur', extensions.crypt('admin.jaipur123', extensions.gen_salt('bf')), 'Jaipur Hospital Admin', 'admin', 'Hospital Administration', 'jaipur-hospital', 'Jaipur Hospital', NULL, TRUE),
  ('admin.pgimer', extensions.crypt('admin.pgimer123', extensions.gen_salt('bf')), 'PGIMER Admin', 'admin', 'Hospital Administration', 'pgimer-chandigarh', 'PGIMER Chandigarh', NULL, TRUE),
  ('admin.kem', extensions.crypt('admin.kem123', extensions.gen_salt('bf')), 'KEM Mumbai Admin', 'admin', 'Hospital Administration', 'kem-mumbai', 'KEM Hospital Mumbai', NULL, TRUE),
  ('admin.nimhans', extensions.crypt('admin.nimhans123', extensions.gen_salt('bf')), 'NIMHANS Admin', 'admin', 'Hospital Administration', 'nimhans-bangalore', 'NIMHANS Bangalore', NULL, TRUE),
  ('admin', extensions.crypt('admin123', extensions.gen_salt('bf')), 'Master Clinic Admin', 'admin', 'Central Administration', 'sms-jaipur', 'Sawai Man Singh Hospital', NULL, TRUE),
  ('drananyasharma', extensions.crypt('drananyasharma123', extensions.gen_salt('bf')), 'Dr. Ananya Sharma', 'doctor', 'General Physician', 'sms-jaipur', 'Sawai Man Singh Hospital', 'd0000001-0002-0002-0002-000000000001', TRUE),
  ('drrandeepguleria', extensions.crypt('drrandeepguleria123', extensions.gen_salt('bf')), 'Dr. Randeep Guleria', 'doctor', 'Pulmonology', 'aiims-delhi', 'AIIMS New Delhi', 'd0000001-0001-0001-0001-000000000001', TRUE)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  hospital_id = EXCLUDED.hospital_id,
  hospital_name = EXCLUDED.hospital_name,
  doctor_id = EXCLUDED.doctor_id,
  is_active = TRUE;

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. SEED ALL 10 CORE HEALTH COMMUNITIES IN public.communities
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.communities (id, title, category, theme_key, disease_key, tagline, description, is_verified, is_active, sort_order) VALUES
  ('c0000001-0001-0001-0001-000000000001', 'Mental Health & Wellness', 'Mental Health', 'mental', 'mental', 'You are not alone. We listen. We support. We care.', 'A safe and supportive space to share, learn and grow together. Let us break the stigma and build a mentally healthier world.', TRUE, TRUE, 1),
  ('c0000001-0002-0002-0002-000000000002', 'Diabetes & Metabolic Wellness', 'Chronic Conditions', 'diabetes', 'diabetes', 'Empowering healthy living through nutrition, exercise, and clinical monitoring.', 'Evidence-based glycemic control guidance, dietary plans, insulin management, and peer encouragement for diabetic patients.', TRUE, TRUE, 2),
  ('c0000001-0003-0003-0003-000000000003', 'Maternal & Child Care', 'Women & Children', 'maternal', 'maternal', 'Comprehensive care for mothers and little ones at every step.', 'Prenatal wellness, safe delivery awareness, postnatal recovery, newborn immunization, and pediatric nutrition guidance.', TRUE, TRUE, 3),
  ('c0000001-0004-0004-0004-000000000004', 'Heart Health Circle', 'Cardiology', 'cardiac', 'cardiac', 'Protecting your heart with preventive cardiology and post-op care.', 'Managing hypertension, cholesterol, coronary wellness, and rehabilitation routines led by verified cardiologists.', TRUE, TRUE, 4),
  ('c0000001-0005-0005-0005-000000000005', 'Cancer Warriors Network', 'Oncology', 'cancer', 'cancer', 'Standing strong with cancer patients and families with hope and courage.', 'Oncology care navigation, chemotherapy support, radiation therapy insights, and survivor stories.', TRUE, TRUE, 5),
  ('c0000001-0006-0006-0006-000000000006', 'AYUSH & Integrative Healing', 'AYUSH / Alternative', 'ayush', 'ayush', 'Ancient wisdom meets modern evidence for holistic well-being.', 'Ayurvedic Rasayana, Dinacharya, herbal formulations, Yoga therapy, and Panchakarma lifestyle management.', TRUE, TRUE, 6),
  ('c0000001-0007-0007-0007-000000000007', 'Respiratory & Asthma Health', 'Pulmonology', 'respiratory', 'respiratory', 'Breathing easy through clear air, inhaler techniques, and allergy care.', 'Guidance on managing asthma, COPD, seasonal allergies, post-viral respiratory recovery, and breathing exercises.', TRUE, TRUE, 7),
  ('c0000001-0008-0008-0008-000000000008', 'Senior Wellness & Care', 'Geriatrics', 'senior', 'geriatrics', 'Dignified, healthy, and joyous golden years for our elders.', 'Joint mobility, dementia care, fall prevention, balanced nutrition, and medication management for seniors.', TRUE, TRUE, 8),
  ('c0000001-0009-0009-0009-000000000009', 'Caregivers Sanctuary', 'Support & Caregiving', 'caregiver', 'caregiver', 'Caring for those who care for others.', 'Burnout prevention, peer coping circles, respite care tips, and emotional resilience for family caregivers.', TRUE, TRUE, 9),
  ('c0000001-0010-0010-0010-000000000010', 'Blood & Hematology Network', 'Hematology', 'blood', 'blood', 'Every drop counts. Life-saving blood donation and anemia awareness.', 'Emergency blood drives, thalassemia support, anemia prevention, and voluntary donor mobilization.', TRUE, TRUE, 10)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  theme_key = EXCLUDED.theme_key,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  is_verified = TRUE,
  is_active = TRUE;

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. COMMUNITY POSTS (REAL DOCTOR POSTS ONLY)
-- ═══════════════════════════════════════════════════════════════════════════
-- No sample or fake posts are seeded. Posts appear here when doctors publish them.
DELETE FROM public.community_posts WHERE id::TEXT LIKE 'a0000001-%' OR id::TEXT LIKE 'p0000001-%';


-- ═══════════════════════════════════════════════════════════════════════════
-- 10. CLEAN UP MOCK / TEST DONATION REQUESTS (REAL REQUESTS ONLY)
-- ═══════════════════════════════════════════════════════════════════════════

-- Remove any legacy test / seed donation requests so only real admin requests appear
DELETE FROM public.donation_requests WHERE id::TEXT LIKE 'b0000001-%' OR id::TEXT LIKE 'r0000001-%';


-- ═══════════════════════════════════════════════════════════════════════════
-- 11. FEEDBACK (REAL USER SUBMISSIONS ONLY)
-- ═══════════════════════════════════════════════════════════════════════════
-- Real patient / doctor feedback is inserted directly from the application.


-- ═══════════════════════════════════════════════════════════════════════════
-- 12. AUTOMATED TRIGGERS FOR HOSPITALS & DOCTORS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.fn_standardize_hospital_record()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_slug TEXT;
BEGIN
  IF NEW.id IS NULL OR TRIM(NEW.id) = '' OR NEW.id LIKE 'a1b2c3d4-%' OR NEW.id LIKE '% %' THEN
    v_slug := LOWER(REGEXP_REPLACE(TRIM(NEW.name), '[^a-zA-Z0-9]+', '-', 'g'));
    IF NEW.city IS NOT NULL AND TRIM(NEW.city) <> '' THEN
      v_slug := v_slug || '-' || LOWER(REGEXP_REPLACE(TRIM(NEW.city), '[^a-zA-Z0-9]+', '-', 'g'));
    END IF;
    v_slug := REGEXP_REPLACE(v_slug, '^-+|-+$', '', 'g');
    IF v_slug = '' THEN
      v_slug := 'hosp-' || LOWER(SUBSTR(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 8));
    END IF;
    NEW.id := v_slug;
  END IF;

  IF NEW.rating IS NULL THEN NEW.rating := 4.5; END IF;
  IF NEW.type IS NULL THEN NEW.type := 'Government'; END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_standardize_hospital_record ON public.hospitals;
CREATE TRIGGER trg_standardize_hospital_record
  BEFORE INSERT OR UPDATE ON public.hospitals
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_standardize_hospital_record();

CREATE OR REPLACE FUNCTION public.fn_hospital_auto_create_admin()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_admin_username TEXT;
BEGIN
  v_admin_username := 'admin.' || LOWER(REGEXP_REPLACE(NEW.id, '[^a-zA-Z0-9]+', '.', 'g'));
  v_admin_username := REGEXP_REPLACE(v_admin_username, '^\.+|\.+$', '', 'g');

  INSERT INTO public.staff_accounts (
    username, password_hash, name, role, department, hospital_id, hospital_name, is_active
  ) VALUES (
    v_admin_username,
    extensions.crypt('password123', extensions.gen_salt('bf')),
    NEW.name || ' Admin',
    'admin',
    'Hospital Administration',
    NEW.id,
    NEW.name,
    TRUE
  )
  ON CONFLICT (username) DO UPDATE SET
    hospital_id = EXCLUDED.hospital_id,
    hospital_name = EXCLUDED.hospital_name,
    is_active = TRUE;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_hospital_auto_create_admin ON public.hospitals;
CREATE TRIGGER trg_hospital_auto_create_admin
  AFTER INSERT ON public.hospitals
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_hospital_auto_create_admin();

CREATE OR REPLACE FUNCTION public.fn_standardize_doctor_record()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_hosp_id TEXT;
  v_hosp_name TEXT;
BEGIN
  IF NEW.id IS NULL OR TRIM(NEW.id) = '' THEN
    NEW.id := 'doc-' || LOWER(SUBSTR(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 12));
  END IF;

  IF NEW.hospital_id IS NOT NULL AND TRIM(NEW.hospital_id) <> '' AND NEW.hospital_id NOT LIKE 'a1b2c3d4-%' AND NEW.hospital_id NOT LIKE '% %' THEN
    SELECT name INTO v_hosp_name FROM public.hospitals WHERE id = NEW.hospital_id;
    IF v_hosp_name IS NOT NULL THEN
      NEW.hospital_name := v_hosp_name;
    END IF;
  END IF;

  IF (NEW.hospital_id IS NULL OR TRIM(NEW.hospital_id) = '' OR NEW.hospital_id LIKE 'a1b2c3d4-%' OR NEW.hospital_id LIKE '% %') AND NEW.hospital_name IS NOT NULL THEN
    SELECT id INTO v_hosp_id FROM public.hospitals WHERE LOWER(name) = LOWER(TRIM(NEW.hospital_name)) LIMIT 1;
    IF v_hosp_id IS NOT NULL THEN
      NEW.hospital_id := v_hosp_id;
    ELSE
      SELECT id INTO v_hosp_id FROM public.hospitals WHERE name ILIKE '%' || TRIM(NEW.hospital_name) || '%' LIMIT 1;
      IF v_hosp_id IS NOT NULL THEN
        NEW.hospital_id := v_hosp_id;
      ELSE
        NEW.hospital_id := 'sms-jaipur';
        NEW.hospital_name := 'Sawai Man Singh Hospital';
      END IF;
    END IF;
  END IF;

  IF NEW.rating IS NULL THEN NEW.rating := 4.8; END IF;
  IF NEW.reviews_count IS NULL THEN NEW.reviews_count := 0; END IF;
  IF NEW.is_active IS NULL THEN NEW.is_active := TRUE; END IF;
  IF NEW.system IS NULL THEN NEW.system := 'Allopathy'; END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_standardize_doctor_record ON public.doctors;
CREATE TRIGGER trg_standardize_doctor_record
  BEFORE INSERT OR UPDATE ON public.doctors
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_standardize_doctor_record();

-- Slot Generator Function
CREATE OR REPLACE FUNCTION public.generate_doctor_slots(p_doctor_id TEXT, p_date DATE)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  slot_times TEXT[] := ARRAY[
    '09:00','09:30','10:00','10:30','11:00','11:30','12:00',
    '12:30','13:00','13:30','14:00','14:30','15:00','15:30',
    '16:00','16:30','17:00','17:30','18:00','18:30','19:00'
  ];
  slot_labels TEXT[] := ARRAY[
    '09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM',
    '12:30 PM','01:00 PM','01:30 PM','02:00 PM','02:30 PM','03:00 PM','03:30 PM',
    '04:00 PM','04:30 PM','05:00 PM','05:30 PM','06:00 PM','06:30 PM','07:00 PM'
  ];
  sessions TEXT[] := ARRAY[
    'morning','morning','morning','morning','morning','morning','afternoon',
    'afternoon','afternoon','afternoon','afternoon','afternoon','afternoon','afternoon',
    'evening','evening','evening','evening','evening','evening','evening'
  ];
  i INTEGER;
BEGIN
  FOR i IN 1..array_length(slot_times, 1) LOOP
    INSERT INTO public.slot_schedules (
      doctor_id, date, time_24, time_label, session, capacity, is_open
    ) VALUES (
      p_doctor_id, p_date, slot_times[i], slot_labels[i], sessions[i], 3, TRUE
    )
    ON CONFLICT (doctor_id, date, time_24) DO NOTHING;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.initialize_doctor_schedule_range(p_doctor_id TEXT)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  d DATE;
BEGIN
  FOR d IN SELECT CURRENT_DATE + i FROM generate_series(0, 13) AS i LOOP
    PERFORM public.generate_doctor_slots(p_doctor_id, d);
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.initialize_doctor_schedule_range(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_doctor_slots(TEXT,DATE) TO anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 13. STAFF AUTHENTICATION & PASSWORD MANAGEMENT FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.staff_login(TEXT,TEXT);
DROP FUNCTION IF EXISTS public.change_staff_password(TEXT,TEXT,TEXT);
DROP FUNCTION IF EXISTS public.create_staff_account(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT);

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
  hospital_id TEXT,
  hospital_name TEXT,
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
    s.hospital_id,
    s.hospital_name,
    s.is_active,
    s.password_changed_at
  FROM public.staff_accounts s
  WHERE LOWER(s.username) = LOWER(TRIM(p_username))
    AND s.is_active = TRUE
    AND s.password_hash = extensions.crypt(p_password, s.password_hash);
END;
$$;

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

  -- Verify current password
  SELECT EXISTS (
    SELECT 1 FROM public.staff_accounts
    WHERE LOWER(username) = LOWER(TRIM(p_username))
      AND is_active = TRUE
      AND password_hash = extensions.crypt(p_old_password, password_hash)
  ) INTO v_found;

  IF NOT v_found THEN
    RAISE EXCEPTION 'Current password is incorrect';
  END IF;

  -- Hash new password with bcrypt
  v_new_hash := extensions.crypt(p_new_password, extensions.gen_salt('bf', 10));

  -- Update password
  UPDATE public.staff_accounts
  SET password_hash = v_new_hash,
      password_changed_at = NOW(),
      updated_at = NOW()
  WHERE LOWER(username) = LOWER(TRIM(p_username));

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_staff_account(
  p_username TEXT,
  p_password TEXT,
  p_name TEXT,
  p_role TEXT DEFAULT 'doctor',
  p_department TEXT DEFAULT NULL,
  p_doctor_id TEXT DEFAULT NULL,
  p_hospital_id TEXT DEFAULT NULL,
  p_hospital_name TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_id UUID;
  v_hash TEXT;
BEGIN
  IF LENGTH(p_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters long';
  END IF;

  IF EXISTS (SELECT 1 FROM public.staff_accounts WHERE LOWER(username) = LOWER(TRIM(p_username))) THEN
    RAISE EXCEPTION 'Username already exists';
  END IF;

  v_hash := extensions.crypt(p_password, extensions.gen_salt('bf', 10));

  INSERT INTO public.staff_accounts (
    username, password_hash, name, role, department, doctor_id, hospital_id, hospital_name, is_active
  ) VALUES (
    LOWER(TRIM(p_username)), v_hash, TRIM(p_name), p_role, p_department, p_doctor_id, p_hospital_id, p_hospital_name, TRUE
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.staff_login(TEXT,TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.change_staff_password(TEXT,TEXT,TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_staff_account(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT) TO anon, authenticated;

