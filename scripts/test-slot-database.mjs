import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs/promises';
const db = new PGlite();
try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated;
    CREATE TABLE hospitals(id TEXT PRIMARY KEY,name TEXT NOT NULL);
    CREATE TABLE doctors(id TEXT PRIMARY KEY,hospital_id TEXT REFERENCES hospitals(id),name TEXT NOT NULL,is_active BOOLEAN DEFAULT TRUE);
    CREATE TABLE patients(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),name TEXT NOT NULL);
    CREATE TABLE slot_schedules(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),doctor_id TEXT REFERENCES doctors(id),date DATE,time_24 TEXT,time_label TEXT,session TEXT,capacity INTEGER DEFAULT 3,is_open BOOLEAN DEFAULT TRUE,created_at TIMESTAMPTZ DEFAULT now(),UNIQUE(doctor_id,date,time_24));
    CREATE TABLE appointments(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),patient_id UUID REFERENCES patients(id),doctor_id TEXT REFERENCES doctors(id),hospital_id TEXT REFERENCES hospitals(id),date DATE,time_24 TEXT,time_label TEXT,token_number TEXT UNIQUE,reason TEXT,status TEXT,booking_request_id UUID UNIQUE,booked_at TIMESTAMPTZ DEFAULT now(),updated_at TIMESTAMPTZ DEFAULT now());
    CREATE TABLE doctor_queue(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),appointment_id UUID REFERENCES appointments(id),doctor_id TEXT,date DATE,queue_position INTEGER,status TEXT,checked_in_at TIMESTAMPTZ);
    CREATE TABLE appointment_token_counters(token_date DATE PRIMARY KEY,last_value BIGINT,updated_at TIMESTAMPTZ);
    CREATE TABLE appointment_slot_holds(id UUID PRIMARY KEY);
    CREATE FUNCTION acquire_appointment_slot_hold(UUID,TEXT,DATE,TEXT,UUID,INTEGER,INTEGER) RETURNS void LANGUAGE sql AS 'SELECT';
    CREATE FUNCTION renew_appointment_slot_hold(UUID,UUID,INTEGER) RETURNS void LANGUAGE sql AS 'SELECT';
  `);
  const read = name => fs.readFile(`supabase/migrations/${name}.sql`, 'utf8');
  const overrun = await read('20260902011000_server_side_consultation_overrun');
  await db.exec(overrun.slice(overrun.indexOf('CREATE OR REPLACE FUNCTION public.is_slot'), overrun.indexOf('-- Add the server-side overrun gate')));
  await db.exec(await read('20260902012000_preserve_consultation_start_time'));
  await db.exec(await read('20260902014000_atomic_booking_checkout'));
  await db.exec(await read('20260903021000_fix_reschedule_datetime'));
  await db.exec(await read('20260904010000_unified_slot_inventory'));
  await db.exec(`BEGIN; ${await fs.readFile('scripts/test-slot-inventory.sql','utf8')} ROLLBACK;`);
  console.log('PASS: migration executes on isolated PostgreSQL; inventory and booking regression checks pass.');
} finally { await db.close(); }
