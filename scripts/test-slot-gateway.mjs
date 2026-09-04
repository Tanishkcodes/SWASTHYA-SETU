import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { transform } from 'esbuild';
const { code } = await transform(await fs.readFile('supabase/functions/slot-gateway/index.ts','utf8'),{loader:'ts',format:'cjs'});
function gateway(fetch) {
  let handler;
  vm.runInNewContext(code,{Deno:{env:{get:key=>({SUPABASE_URL:'https://example.test',SUPABASE_ANON_KEY:'public-test-key'})[key]},serve:fn=>{handler=fn;}},fetch,Response,Request,AbortSignal,URLSearchParams,console});
  return body=>handler(new Request('https://example.test/gateway',{method:'POST',headers:{Authorization:'Bearer caller-token'},body:JSON.stringify(body)}));
}
test('50 simultaneous inventory reads share one legacy schedule and inventory fetch',async()=>{
  let calls=0,release;
  const call=gateway(async(url,options)=>{
    calls++; assert.equal(options.headers.Authorization,'Bearer caller-token');
    if (url.includes('slot_schedules?')) {
      await new Promise(resolve=>{release=resolve;});
      return Response.json([{time_24:'09:30',time_label:'09:30 AM',session:'morning',capacity:3,is_open:true}]);
    }
    assert.match(url,/get_appointment_slot_availability$/);
    return Response.json([{time_24:'09:30',booked_count:1,slots_left:2,consultation_blocked:false}]);
  });
  const requests=Array.from({length:50},()=>call({action:'availability',params:{p_doctor_id:'test',p_date:'2026-12-10'}}));
  await new Promise(resolve=>setImmediate(resolve)); release();
  const responses=await Promise.all(requests);
  assert.equal(calls,2); responses.forEach(response=>assert.equal(response.status,200));
  const result = await responses[0].json();
  assert.equal(result.slots[0].capacity,3);
  assert.equal(result.slots[0].slotsLeft,2);
  assert.equal(result.slots[0].state,'fast');
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

test('missing schedules are generated and closed, full and blocked windows stay unavailable',async()=>{
  const paths=[];
  let reads=0;
  const rows=['09:00','09:30','10:00'].map((time,index)=>({time_24:time,time_label:time,session:'morning',capacity:3,is_open:index!==0}));
  const call=gateway(async(url,options)=>{
    paths.push(url);
    if(url.includes('slot_schedules?')) return Response.json(++reads===1?[]:rows);
    if(url.endsWith('generate_doctor_slots')) {
      assert.deepEqual(JSON.parse(options.body),{p_doctor_id:'test',p_date:'2099-12-10'});
      return Response.json(null);
    }
    return Response.json(rows.map((row,index)=>({time_24:row.time_24,booked_count:index===1?3:0,slots_left:index===1?0:3,consultation_blocked:index===2})));
  });
  const response=await call({action:'availability',params:{p_doctor_id:'test',p_date:'2099-12-10'}});
  assert.equal(response.status,200);
  assert.equal(paths.length,4);
  const result=await response.json();
  assert.deepEqual(result.slots.map(slot=>slot.slotsLeft),[0,0,0]);
  assert.deepEqual(result.slots.map(slot=>slot.state),['closed','full','closed']);
});
