import { supabase } from './supabaseClient';

const pendingReads = new Map();
export async function slotGateway(action, params) {
  const key = action === 'availability' ? JSON.stringify(params) : null;
  if (key && pendingReads.has(key)) return pendingReads.get(key);
  const request = (async () => {
    const { data, error } = await supabase.functions.invoke('slot-gateway', { body: { action, params } });
    if (error || data?.error) throw new Error(data?.error || error?.message || 'Slot service is temporarily unavailable');
    return data;
  })();
  if (key) pendingReads.set(key, request);
  try { return await request; }
  finally { if (key) pendingReads.delete(key); }
}
