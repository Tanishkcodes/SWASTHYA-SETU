import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
// Read-only live checks with synthetic patient details.
const source = await fs.readFile(new URL('../src/voicenav/VoiceAIService.js', import.meta.url), 'utf8');
const url = source.match(/https:\/\/[^']+\.supabase\.co/)[0];
const key = source.match(/sb_publishable_[^']+/)[0];
async function check(label, payload, validate) {
  const start = Date.now();
  const response = await fetch(`${url}/functions/v1/voice-ai`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` }, body: JSON.stringify(payload), signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, label);
  validate(await response.json());
  console.log(`PASS ${label}: ${Date.now() - start}ms`);
}
const results = await Promise.allSettled([
  check('English number, Tamil confirmation', { action: 'extract_registration', language: 'ta', context: { field: 'age' }, transcript: 'thirty five, sorry thirty six' }, data => { assert.equal(data.age, '36'); assert.match(data.confirmationMessage, /[\u0B80-\u0BFF]/); }),
  check('Hindi digits, normalized field', { action: 'extract_registration', language: 'hi', context: { field: 'phone' }, transcript: 'मेरा फोन नंबर ९८७६५४३२१० है' }, data => { assert.equal(data.phone, '9876543210'); assert.match(data.confirmationMessage, /[\u0900-\u097F]/); }),
  check('Tamil interface batch', { action: 'batch_translate', targetLanguage: 'ta', texts: ['Select a hospital', 'Open reports', 'Continue'] }, data => { assert.equal(data.translations.length, 3); data.translations.forEach(text => { assert.match(text, /[\u0B80-\u0BFF]/); assert.doesNotMatch(text, /[A-Za-z]/); }); }),
  check('Hindi speech and number words', { action: 'translate', targetLanguage: 'hi', contextType: 'speech', text: 'Your age is 36. Opening reports.' }, data => { assert.match(data.text, /[\u0900-\u097F]/); assert.doesNotMatch(data.text, /[A-Za-z0-9]/); }),
]);
for (const result of results) if (result.status === 'rejected') { console.error(result.reason); process.exitCode = 1; }
