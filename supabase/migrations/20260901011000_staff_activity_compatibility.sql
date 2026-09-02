-- Bring older live staff_accounts installations up to the columns used by the
-- current authentication and activity functions without overwriting data.
ALTER TABLE public.staff_accounts ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
ALTER TABLE public.staff_accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

