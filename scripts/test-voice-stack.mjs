import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { transform } from 'esbuild';
import { resolveVoiceSelection } from '../src/voicenav/resolveVoiceSelection.js';

const source = (await fs.readFile('supabase/functions/voice-ai/index.ts', 'utf8')).replace(/^import .*;\s*/m, '');
const { code } = await transform(source, { loader: 'ts', format: 'cjs' });
function server(mockFetch, env = { ELEVENLABS_API_KEY: 'test', NVIDIA_API_KEY: 'test', GEMINI_API_KEY: 'test' }) {
  let handler;
  vm.runInNewContext(code, { Deno: { env: { get: key => env[key] }, serve: fn => { handler = fn; } }, fetch: mockFetch, Response, Request, AbortSignal, console, Uint8Array, DataView });
  return body => handler(new Request('https://example.test', { method: 'POST', body: JSON.stringify(body) }));
}
const response = body => new Response(JSON.stringify(body));
const llama = body => response({ choices: [{ message: { content: JSON.stringify(body) } }] });
const languages = ['en','hi','ta','te','bn','mr','gu','kn','ml'];

test('doctor matching never defaults to the first doctor', () => {
  const doctors = [{ name: 'Dr. Meera', specialty: 'Cardiology' }, { name: 'Dr. Ravi', specialty: 'Cardiology' }];
  const labels = d => [d.name, d.specialty];
  assert.equal(resolveVoiceSelection(doctors, '2', labels), doctors[1]);
  assert.equal(resolveVoiceSelection(doctors, 1, labels), doctors[0]);
  assert.equal(resolveVoiceSelection(doctors, 'Dr. Ravi', labels), doctors[1]);
  for (const query of ['', 'unknown', 'Cardiology', '0', '3']) assert.equal(resolveVoiceSelection(doctors, query, labels), null);
});

test('all nine speech languages use ElevenLabs v3 exclusively', async () => {
  const calls = [];
  const call = server(async (url, options) => { calls.push([url, JSON.parse(options.body)]); return new Response('audio', { headers: { 'Content-Type': 'audio/mpeg' } }); });
  for (const language of languages) assert.equal((await call({ action: 'tts', text: 'Test', language })).status, 200);
  assert.equal(calls.length, 9);
  calls.forEach(([url, body], index) => { assert.match(url, /api.elevenlabs.io/); assert.equal(body.model_id, 'eleven_v3'); assert.equal(body.language_code, languages[index]); });
});

test('speech token is single-use and never cached; missing key fails closed', async () => {
  const call = server(async url => { assert.match(url, /single-use-token\/realtime_scribe$/); return response({ token: 'one-use' }); });
  const result = await call({ action: 'stt_token' });
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.equal((await result.json()).token, 'one-use');
  assert.equal((await server(() => { throw Error('must not fetch'); }, {})({ action: 'stt_token' })).status, 503);
});

test('Gemini receives contextual doctor navigation in all nine languages', async () => {
  const call = server(async (url, options) => {
    assert.match(url, /generativelanguage.googleapis.com/);
    const body = JSON.parse(options.body);
    assert.match(body.contents[0].parts[0].text, /Dr. Ravi/);
    assert.equal(body.generationConfig.thinkingConfig.thinkingBudget, 0);
    return response({ candidates: [{ content: { parts: [{ text: JSON.stringify({ intent: 'select_doctor', confidence: .99, value: 'Dr. Ravi', target: '', message: '' }) }] } }] });
  });
  for (const language of languages) {
    const result = await call({ action: 'intent', language, transcript: 'Please select Ravi', actions: [{ intent: 'select_doctor', description: 'Dr. Ravi' }] });
    assert.equal((await result.json()).value, 'Dr. Ravi');
  }
});

test('nonmedical image never enters medical extraction', async () => {
  let calls = 0;
  const call = server(async () => { calls++; return llama({ readableMedicalDocument: false, description: 'A landscape', evidenceText: [] }); });
  const data = await (await call({ action: 'analyze_report', image: 'data:image/png;base64,YWJj', fileName: 'blood-report.png' })).json();
  assert.equal(calls, 1);
  assert.equal(data.isMedicalDocument, false);
  assert.deepEqual(data.detectedParameters, []);
  assert.equal(data.summary, 'A landscape');
});

test('medical extraction strips invented values, medicines and diagnoses', async () => {
  let calls = 0;
  const call = server(async () => ++calls === 1 ? llama({ readableMedicalDocument: true, evidenceText: ['Hemoglobin 12 g/dL'], description: 'Lab report' }) : llama({ isMedicalDocument: true, confidence: .99, detectedParameters: [{ name: 'Hemoglobin', result: '12', unit: 'g/dL', flag: 'Normal' }, { name: 'Glucose', result: '100' }], medications: [{ name: 'Aspirin' }], summary: 'Diabetes', findings: 'Cancer', impression: 'Healthy', evidenceText: ['Invented text'] }));
  const data = await (await call({ action: 'analyze_report', image: 'data:image/png;base64,YWJj' })).json();
  assert.equal(data.detectedParameters.length, 1);
  assert.equal(data.detectedParameters[0].flag, '');
  assert.deepEqual(data.medications, []);
  assert.equal(data.findings, '');
  assert.equal(data.impression, '');
  assert.equal(data.summary, 'Hemoglobin 12 g/dL');
});

test('Ayurveda cannot finish with missing Dashavidha coverage', async () => {
  const call = server(async (url, options) => { assert.match(url, /nvidia/); assert.equal(JSON.parse(options.body).model, 'meta/llama-3.3-70b-instruct'); return llama({ isFinished: true, question: '', options: [] }); });
  assert.equal((await call({ action: 'anamnesis', isAyurvedic: true, questionCount: 15 })).status, 422);
});

test('completed Dashavidha and emergency referral are accepted', async () => {
  const coverage = Object.fromEntries(['prakriti','vikriti','sara','samhanana','pramana','satmya','satva','aharaShakti','vyayamaShakti','vaya'].map(key => [key, 'answered']));
  for (const result of [{ dashavidhaCoverage: coverage }, { urgentReferral: true }]) {
    const call = server(async () => llama({ isFinished: true, question: '', options: [], ...result }));
    assert.equal((await call({ action: 'anamnesis', isAyurvedic: true })).status, 200);
  }
});

test('stopping during synthesis prevents late playback; successful playback resolves true', async () => {
  const input = (await fs.readFile('src/voicenav/AudioFeedback.js', 'utf8')).replace(/^import .*;\s*/m, '').replace('export default audioFeedback;', 'globalThis.engine = audioFeedback;');
  let finishSynthesis;
  let plays = 0;
  class AudioMock { play() { plays++; return Promise.resolve(); } pause() {} }
  const sandbox = { Audio: AudioMock, voiceAIService: { synthesize: () => new Promise(resolve => { finishSynthesis = resolve; }) }, window: { location: { pathname: '/', search: '' }, dispatchEvent() {} }, URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} }, console };
  vm.runInNewContext(input.replace(/export \{[^}]+\};/g, ''), sandbox);
  const engine = sandbox.engine;
  const pending = engine.speak('Hello');
  engine.stop();
  finishSynthesis(new Blob(['audio']));
  assert.equal(await pending, false);
  assert.equal(plays, 0);
  const next = engine.speak('New message');
  finishSynthesis(new Blob(['audio']));
  await new Promise(resolve => setImmediate(resolve));
  engine.elevenLabsAudio.onended();
  assert.equal(await next, true);
  assert.equal(plays, 1);
  assert.equal(engine.isSpeaking, false);
});

test('stopping microphone startup releases delayed permission stream', async () => {
  const input = (await fs.readFile('src/voicenav/ElevenLabsRecognition.js', 'utf8')).replace(/^import .*;\s*/m, '').replace('export default class ElevenLabsRecognition', 'globalThis.Recognition = class ElevenLabsRecognition');
  let grant;
  let stopped = 0;
  let tokenCalls = 0;
  const sandbox = { navigator: { mediaDevices: { getUserMedia: () => new Promise(resolve => { grant = resolve; }) } }, WebSocket: class {}, voiceAIService: { createSpeechToken: () => { tokenCalls++; } }, clearTimeout, setTimeout };
  vm.runInNewContext(input, sandbox);
  const recognition = new sandbox.Recognition();
  recognition.start();
  recognition.stop();
  grant({ getTracks: () => [{ stop: () => stopped++ }] });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(stopped, 1);
  assert.equal(tokenCalls, 0);
  assert.equal(recognition.active, false);
});
