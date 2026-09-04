// Public inventory reads are coalesced at the edge. Mutations retain the caller's
// database permissions and are serialized/idempotent in Postgres, never in RAM.
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const reads = new Map<string, { until: number; value: unknown }>();
const pending = new Map<string, Promise<unknown>>();
let activeWrites = 0;
const actions: Record<string, { rpc: string; fields: string[] }> = {
  availability: { rpc: 'get_appointment_slot_availability', fields: ['p_doctor_id', 'p_date'] },
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
    const database = async (path: string, body?: unknown) => {
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/${path}`, {
        method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', apikey: Deno.env.get('SUPABASE_ANON_KEY')!, Authorization: request.headers.get('Authorization') || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(12000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'The slot could not be updated. Refresh and try again.');
      return result;
    };
    const invoke = () => database(`rpc/${spec.rpc}`, payload);
    const availability = async () => {
      // Use the already deployed inventory contract. Slot visibility must not
      // depend on an optional, unapplied database migration.
      const query = new URLSearchParams({ select:'time_24,time_label,session,capacity,is_open', doctor_id:`eq.${payload.p_doctor_id}`, date:`eq.${payload.p_date}`, order:'time_24' });
      let rows = await database(`slot_schedules?${query}`);
      if (!Array.isArray(rows)) throw new Error('The server returned an invalid schedule.');
      if (!rows.length) {
        await database('rpc/generate_doctor_slots', payload);
        rows = await database(`slot_schedules?${query}`);
      }
      const live = await invoke();
      if (!Array.isArray(rows) || !Array.isArray(live)) throw new Error('The server returned invalid availability.');
      const inventory = new Map(live.map((slot: any) => [slot.time_24, slot]));
      const now = new Date();
      const localNow = new Intl.DateTimeFormat('sv-SE', { timeZone:'Asia/Kolkata', year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23' }).format(now);
      const slots = rows.map((slot: any) => {
        const current: any = inventory.get(slot.time_24);
        if (!current) throw new Error('Availability changed while loading. Please retry.');
        const isPast = `${payload.p_date} ${slot.time_24}` <= localNow;
        const blocked = Boolean(current.consultation_blocked);
        const closed = !slot.is_open || isPast || blocked;
        const left = closed ? 0 : Math.max(0, Number(current.slots_left));
        return { time24:slot.time_24, label:slot.time_label, session:slot.session,
          capacity:Number(slot.capacity), booked:Number(current.booked_count), activeHolds:Number(current.active_hold_count || 0),
          consultationBlocked:blocked, slotsLeft:left, isPast,
          state:closed ? 'closed' : left === 0 ? 'full' : left <= 2 ? 'fast' : 'open' };
      });
      return { slots, onLeave:false, serverNow:now.toISOString() };
    };
    if (action === 'availability') {
      if (!payload.p_doctor_id || String(payload.p_doctor_id).length > 160) return json({ error: 'Doctor is required' }, 400);
      const key = JSON.stringify(payload);
      const cached = reads.get(key);
      if (cached && cached.until > Date.now()) return json(cached.value);
      let task = pending.get(key);
      if (!task) {
        if (pending.size >= 64) return json({ error: 'Slot service is busy. Please retry shortly.' }, 429);
        task = availability().then(value => {
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
