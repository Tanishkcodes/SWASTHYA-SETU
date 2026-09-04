import fs from 'node:fs/promises';
const source = await fs.readFile('src/lib/supabaseClient.js', 'utf8');
const url = source.match(/https:\/\/[^']+/)[0];
const key = source.match(/sb_publishable_[^']+/)[0];
const start = Date.now();
const response = await fetch(`${url}/functions/v1/voice-ai`, {
  method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'anamnesis', language: 'hi', phase: 'interview', disease: 'Headache', patient: { age: 30, gender: 'Female' }, doctorSpecialty: 'General Medicine', latestInput: 'Mild headache since yesterday, no fever.', history: [{ sender: 'user', text: 'Mild headache since yesterday, no fever.' }], caseSummary: { duration: 'Since yesterday', severity: 'Mild' } }),
  signal: AbortSignal.timeout(45000),
});
const result = await response.json();
console.log(JSON.stringify({ status: response.status, elapsedMs: Date.now() - start, question: result.question, options: result.options, isFinished: result.isFinished, error: result.error, validation: result.validation }));
if (!response.ok || (!result.isFinished && result.options?.length < 2)) process.exitCode = 1;
