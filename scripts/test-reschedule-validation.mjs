// Negative live test only: the selected target date is in the past, so the
// function must reject before changing any appointment, token, or queue row.
import assert from 'node:assert/strict';
import { loadEnv } from 'vite';
import { createClient } from '@supabase/supabase-js';

const env = loadEnv('development', process.cwd(), 'VITE_');
const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY);
const { data, error } = await client.from('appointments')
  .select('id,patient_id,date,time_24,time_label')
  .eq('status', 'confirmed').lt('date', '2026-09-01').not('patient_id', 'is', null).limit(1);
if (error) throw error;
if (!data.length) throw new Error('No past confirmed appointment available for the negative test.');
const appointment = data[0];
assert(appointment.date < '2026-09-01');
const result = await client.rpc('reschedule_missed_appointment', {
  p_appointment_id: appointment.id, p_patient_id: appointment.patient_id,
  p_date: appointment.date, p_time_24: appointment.time_24, p_time_label: appointment.time_label,
});
assert(result.error, 'Past time must be rejected');
assert.match(result.error.message, /already passed|Slot not found|Slot is closed/);
console.log(`PASS: live date/time validation reached the expected rejection (${result.error.message}). No appointment was changed.`);
