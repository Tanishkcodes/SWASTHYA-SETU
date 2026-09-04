BEGIN;
-- Add the status already written by start_doctor_consultation, preserving all
-- existing allowed statuses. This migration does not update appointment data.
DO $$
DECLARE status_constraint RECORD;
BEGIN
  FOR status_constraint IN
    SELECT c.conname, pg_get_expr(c.conbin, c.conrelid) AS expression
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attname = 'status'
    WHERE c.conrelid = 'public.appointments'::regclass
      AND c.contype = 'c' AND c.conkey = ARRAY[a.attnum]::smallint[]
  LOOP
    EXECUTE format('ALTER TABLE public.appointments DROP CONSTRAINT %I', status_constraint.conname);
    EXECUTE format('ALTER TABLE public.appointments ADD CONSTRAINT %I CHECK ((%s) OR status = %L)',
      status_constraint.conname, status_constraint.expression, 'in_consultation');
  END LOOP;
END $$;
COMMIT;
