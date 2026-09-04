import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { transform } from 'esbuild';
const { code } = await transform(await fs.readFile('supabase/functions/slot-gateway/index.ts','utf8'),{loader:'ts',format:'cjs'});
function gateway(fetch) {
  let handler;
  vm.runInNewContext(code,{Deno:{env:{get:key=>({SUPABASE_URL:'https://example.test',SUPABASE_ANON_KEY:'public-test-key'})[key]},serve:fn=>{handler=fn;}},fetch,Response,Request,AbortSignal,console});
  return body=>handler(new Request('https://example.test/gateway',{method:'POST',headers:{Authorization:'Bearer caller-token'},body:JSON.stringify(body)}));
}
test('50 simultaneous inventory reads share one upstream request',async()=>{
  let calls=0,release;
  const call=gateway(async(url,options)=>{calls++;assert.match(url,/get_booking_slots$/);assert.equal(options.headers.Authorization,'Bearer caller-token');await new Promise(resolve=>{release=resolve;});return Response.json({slots:[{time24:'09:30',capacity:6,slotsLeft:6,state:'open'}]});});
  const requests=Array.from({length:50},()=>call({action:'availability',params:{p_doctor_id:'test',p_date:'2026-12-10'}}));
  await new Promise(resolve=>setImmediate(resolve)); release();
  const responses=await Promise.all(requests);
  assert.equal(calls,1); responses.forEach(response=>assert.equal(response.status,200));
});
test('checkout preserves idempotency key, bounds in-flight writes and never escalates database privileges',async()=>{
  const releases=[];let calls=0;
  const call=gateway(async(url,options)=>{calls++;const body=JSON.parse(options.body);assert.equal(body.p_booking_request_id,'retry-id');assert.equal(body.arbitrary,undefined);assert.equal(options.headers.apikey,'public-test-key');await new Promise(resolve=>releases.push(resolve));return Response.json({id:'test'});});
  const requests=Array.from({length:40},()=>call({action:'book',params:{p_date:'2026-12-10',p_booking_request_id:'retry-id',arbitrary:'must-not-forward'}}));
  await new Promise(resolve=>setImmediate(resolve));releases.forEach(resolve=>resolve());
  const results=await Promise.all(requests);
  assert.equal(calls,32);assert.equal(results.filter(response=>response.status===429).length,8);
});
test('unknown RPC names cannot be called through the gateway',async()=>{
  const call=gateway(()=>{throw Error('Must not call database');});
  assert.equal((await call({action:'delete_patients',params:{}})).status,400);
});
