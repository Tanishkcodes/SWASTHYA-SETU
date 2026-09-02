-- Canonical hospital assignments for existing hospital-admin accounts.
-- Central/system admins are intentionally left unassigned to this hospital-only view.
WITH assignments(username, hospital_id) AS (
  VALUES
    ('admin', 'sms-jaipur'),
    ('admin.sms', 'sms-jaipur'),
    ('admin.aiims', 'aiims-delhi'),
    ('admin.apollo', 'apollo-delhi'),
    ('admin.shalby', 'shalby-jaipur'),
    ('admin.fortis', 'fortis-jaipur'),
    ('admin.narayana', 'narayana-bangalore'),
    ('admin.jaipur', 'jaipur-hospital'),
    ('admin.pgimer', 'pgimer-chandigarh'),
    ('admin.kem', 'kem-mumbai'),
    ('admin.aiia', 'aiia-delhi'),
    ('admin.nia', 'nia-jaipur'),
    ('admin.nimhans', 'nimhans-bangalore'),
    ('admin.tata', 'tata-mumbai')
)
UPDATE public.staff_accounts s
SET hospital_id = a.hospital_id,
    hospital_name = h.name,
    updated_at = NOW()
FROM assignments a
JOIN public.hospitals h ON h.id = a.hospital_id
WHERE LOWER(s.username) = a.username
  AND s.role = 'admin';

