// Public inventory reads are coalesced at the edge. Mutations retain the caller's
// database permissions and are serialized/idempotent in Postgres, never in RAM.
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const reads = new Map<string, { until: number; value: unknown }>();
const pending = new Map<string, Promise<unknown>>();
let activeWrites = 0;
const actions: Record<string, { rpc: string; fields: string[] }> = {
  availability: { rpc: 'get_booking_slots', fields: ['p_doctor_id', 'p_date'] },
  book: { rpc: 'book_appointment', fields: ['p_patient_id','p_doctor_id','p_hospital_id','p_date','p_time_24','p_time_label','p_reason','p_hold_id','p_booking_request_id'] },
  reschedule: { rpc: 'reschedule_missed_appointment', fields: ['p_appointment_id','p_patient_id','p_date','p_time_24','p_time_label'] },
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...(status === 429 ? { 'Retry-After': '2' } : {}) } });
Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  let write = false;
  try {
    const input = await request.text();
    if (input.length > 16000) return json({ error: 'Request too large' }, 413);
    const { action, params } = JSON.parse(input);
    const spec = actions[action];
    if (!spec || !params || typeof params !== 'object') return json({ error: 'Invalid slot action' }, 400);
    const payload = Object.fromEntries(spec.fields.filter(field => field in params).map(field => [field, params[field]]));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(payload.p_date || ''))) return json({ error: 'A valid date is required' }, 400);
    const invoke = async () => {
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/${spec.rpc}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', apikey: Deno.env.get('SUPABASE_ANON_KEY')!, Authorization: request.headers.get('Authorization') || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` },
        body: JSON.stringify(payload), signal: AbortSignal.timeout(12000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'The slot could not be updated. Refresh and try again.');
      return result;
    };
    if (action === 'availability') {
      if (!payload.p_doctor_id || String(payload.p_doctor_id).length > 160) return json({ error: 'Doctor is required' }, 400);
      const key = JSON.stringify(payload);
      const cached = reads.get(key);
      if (cached && cached.until > Date.now()) return json(cached.value);
      let task = pending.get(key);
      if (!task) {
        if (pending.size >= 64) return json({ error: 'Slot service is busy. Please retry shortly.' }, 429);
        task = invoke().then(value => {
          if (reads.size >= 500) reads.delete(reads.keys().next().value!);
          reads.set(key, { value, until: Date.now() + 1500 });
          return value;
        }).finally(() => pending.delete(key));
        pending.set(key, task);
      }
      return json(await task);
    }
    if (activeWrites >= 32) return json({ error: 'Booking service is busy. Please retry shortly; your request ID is preserved.' }, 429);
    write = true; activeWrites++;
    const result = await invoke();
    reads.clear();
    return json(result);
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Slot service unavailable' }, 409); }
  finally { if (write) activeWrites--; }
});
