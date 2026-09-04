import { readFile } from 'node:fs/promises';

const envText = await readFile(new URL('../.env.local', import.meta.url), 'utf8');
const env = Object.fromEntries(envText.split(/\r?\n/).filter(line => /^\w+=/.test(line)).map(line => {
  const index = line.indexOf('=');
  return [line.slice(0, index), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')];
}));
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error('Supabase environment is missing.');

// An empty one-pixel PNG is deliberately not a medical document. The filename
// is misleading on purpose: it must never cause fabricated medical values.
const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aV7sAAAAASUVORK5CYII=';
const response = await fetch(`${url}/functions/v1/voice-ai`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
  body: JSON.stringify({ action: 'analyze_report', image, fileName: 'blood-cbc-hba1c-prescription.png' }),
  signal: AbortSignal.timeout(60000),
});
const body = await response.json();
console.log(JSON.stringify({ status: response.status, provider: body.provider, model: body.model, isMedicalDocument: body.isMedicalDocument, parameterCount: body.detectedParameters?.length, summary: body.summary, error: body.error }, null, 2));
if (response.ok && (body.isMedicalDocument !== false || body.detectedParameters?.length)) {
  throw new Error('Non-medical fixture was incorrectly accepted as clinical data.');
}
if (!response.ok) process.exitCode = 2;
