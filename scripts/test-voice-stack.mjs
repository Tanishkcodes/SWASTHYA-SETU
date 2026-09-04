import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { transform } from 'esbuild';
import { resolveVoiceSelection } from '../src/voicenav/resolveVoiceSelection.js';
import { createPatientSelectionActions } from '../src/voicenav/PatientVoiceActions.js';
import { TranscriptRegistry } from '../src/voicenav/TranscriptRegistry.js';
import { registrationFields } from '../src/voicenav/registrationFields.js';
import { normalizeDigits, localizeSpokenIdentifiers } from '../src/voicenav/numberLocale.js';

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

test('Llama 3.2 interview keeps dynamic cards and rejects duplicate or repeated questions', async () => {
  for (const invalid of ['', 'cards', 'question']) {
    const call = server(async (url, options) => {
      assert.equal(JSON.parse(options.body).model, 'meta/llama-3.2-11b-vision-instruct');
      return llama({ isFinished: false, question: 'When did it start?', responseType: 'single_choice', options: [{text:'Today'}, {text: invalid === 'cards' ? 'Today' : 'Earlier'}] });
    });
    const result = await call({ action: 'anamnesis', disease: 'Headache', history: invalid === 'question' ? [{sender:'ai',text:'When did it start?'}] : [] });
    assert.equal(result.status, invalid ? 422 : 200);
  }
});

test('OCR rejects cross-row and partial numeric matches', async () => {
  let calls = 0;
  const call = server(async (url, options) => {
    assert.equal(JSON.parse(options.body).model, 'meta/llama-3.2-11b-vision-instruct');
    return ++calls === 1 ? llama({readableMedicalDocument:true,evidenceText:['Hemoglobin 12 g/dL','Glucose 100 mg/dL']}) : llama({isMedicalDocument:true,confidence:0.9,detectedParameters:[{name:'Hemoglobin',result:'100'},{name:'Glucose',result:'10'},{name:'Glucose',result:'100'}]});
  });
  const result = await (await call({action:'analyze_report',image:'data:image/png;base64,YWJj'})).json();
  assert.deepEqual(result.detectedParameters.map(item=>[item.name,item.result]),[['Glucose','100']]);
});

test('registration rejects invented names and ambiguous corrections, preserving native names', async () => {
  for (const [transcript, name, ambiguous, expected] of [
    ['My name is Tanishk', 'Tanisha Sharma', false, ''],
    ['Suresh no Ramesh maybe', 'Ramesh', true, ''],
    ['मेरा नाम तनिष्क है', 'तनिष्क', false, 'तनिष्क'],
    ['My name is Ramesh no Rajesh Kumar', 'Rajesh Kumar', false, 'Rajesh Kumar'],
  ]) {
    const call = server(async () => response({ candidates: [{ content: { parts: [{ text: JSON.stringify({ name, needsClarification: ambiguous, confirmationMessage: 'Saved' }) }] } }] }));
    const result = await (await call({ action: 'extract_registration', transcript, language: 'hi', context: { field: 'name' } })).json();
    assert.equal(result.name, expected);
    if (!expected) { assert.equal(result.needsClarification, true); assert.equal(result.confirmationMessage, ''); }
  }
});

test('native numerals preserve identifiers and regional speech uses local digit words', () => {
  for (const digits of ['०१२३४५६७८९', '০১২৩৪৫৬৭৮৯', '૦૧૨૩૪૫૬૭૮૯', '௦௧௨௩௪௫௬௭௮௯', '౦౧౨౩౪౫౬౭౮౯', '೦೧೨೩೪೫೬೭೮೯', '൦൧൨൩൪൫൬൭൮൯']) assert.equal(normalizeDigits(digits), '0123456789');
  for (const language of languages.filter(l => l !== 'en')) assert.doesNotMatch(localizeSpokenIdentifiers('0123456789', language), /[0-9A-Za-z]/);
  assert.equal(localizeSpokenIdentifiers('उम्र 35', 'hi'), 'उम्र 35');
});

test('Gemini extracts code-mixed numbers in the focused field using selected output language', async () => {
  const call = server(async (url, options) => {
    assert.match(url, /googleapis/);
    const prompt = JSON.parse(options.body).contents[0].parts[0].text;
    assert.match(prompt, /Tamil/);
    assert.match(prompt, /"field":"age"/);
    assert.match(prompt, /double\/triple/);
    return response({ candidates: [{ content: { parts: [{ text: JSON.stringify({ age: '35', confirmationMessage: 'வயது பதிவு செய்யப்பட்டது.' }) }] } }] });
  });
  assert.equal((await (await call({ action: 'extract_registration', transcript: 'thirty five', language: 'ta', context: { field: 'age' } })).json()).age, '35');
});

test('DOM translations switch between regional languages and batch unknown labels', async () => {
  const input = (await fs.readFile('src/engine/DOMTranslator.js', 'utf8')).replace(/^import .*;\s*/gm, '').replace('export default domTranslator;', 'globalThis.translator = domTranslator;');
  const calls = [];
  const sandbox = { UI_STRINGS: { en: { title: 'Reports' }, hi: { title: 'रिपोर्ट' }, ta: { title: 'அறிக்கைகள்' } }, MULTI_DICT: {}, Node: { TEXT_NODE: 3 }, setTimeout: () => 1, clearTimeout() {}, console, voiceAIService: { batchTranslate: async (texts, lang) => { calls.push([texts, lang]); return { translations: texts.map(text => `தமிழ் ${text}`) }; } } };
  vm.runInNewContext(input, sandbox);
  const translator = sandbox.translator;
  const node = text => ({ nodeType: 3, nodeValue: text, isConnected: true, parentElement: { tagName: 'SPAN', closest: () => null } });
  const title = node('Reports');
  translator.targetLang = 'hi'; translator.isActive = true;
  translator._queueNode(title);
  assert.equal(title.nodeValue, 'रिपोर्ट');
  assert.equal(translator._isValidTextNode(title), true);
  translator.targetLang = 'ta'; translator._queueNode(title);
  assert.equal(title.nodeValue, 'அறிக்கைகள்');
  for (const label of ['Unknown label one', 'Unknown label two']) translator._queueNode(node(label));
  await translator._processBatch();
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0].length, 2);
  title.nodeValue = 'New React content'; translator._queueNode(title);
  assert.equal(translator.originalTexts.get(title), 'New React content');
});

test('English speech is localized before ElevenLabs and cancelled translations never play', async () => {
  const input = (await fs.readFile('src/voicenav/AudioFeedback.js', 'utf8')).replace(/^import .*;\s*/gm, '').replace('export default audioFeedback;', 'globalThis.engine = audioFeedback;').replace(/export \{[^}]+\};/g, '');
  let resolveTranslation;
  const spoken = [];
  class AudioMock { play() { queueMicrotask(() => this.onended?.()); return Promise.resolve(); } pause() {} }
  const sandbox = { localizeSpokenIdentifiers, Audio: AudioMock, console, URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} }, window: { location: { pathname: '/' } }, voiceAIService: { translate: () => new Promise(resolve => { resolveTranslation = resolve; }), synthesize: async (text, lang) => { spoken.push([text, lang]); return new Blob(['audio']); } } };
  vm.runInNewContext(input, sandbox);
  const pending = sandbox.engine.speak('Open reports', 'ta');
  resolveTranslation({ text: 'அறிக்கைகள் திறக்கப்படுகின்றன.' });
  assert.equal(await pending, true);
  assert.equal(spoken[0][1], 'ta');
  assert.doesNotMatch(spoken[0][0], /[A-Za-z]/);
  const cancelled = sandbox.engine.speak('Open history', 'hi');
  sandbox.engine.stop();
  resolveTranslation({ text: 'इतिहास खोल रहे हैं।' });
  assert.equal(await cancelled, false);
  assert.equal(spoken.length, 1);
});

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
    assert.equal(body.generationConfig.thinkingConfig.thinkingLevel, 'minimal');
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
  const call = server(async (url, options) => { assert.match(url, /nvidia/); assert.equal(JSON.parse(options.body).model, 'meta/llama-3.2-11b-vision-instruct'); return llama({ isFinished: true, question: '', options: [] }); });
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
  const input = (await fs.readFile('src/voicenav/AudioFeedback.js', 'utf8')).replace(/^import .*;\s*/gm, '').replace('export default audioFeedback;', 'globalThis.engine = audioFeedback;');
  let finishSynthesis;
  let plays = 0;
  class AudioMock { play() { plays++; return Promise.resolve(); } pause() {} }
  const sandbox = { localizeSpokenIdentifiers, Audio: AudioMock, voiceAIService: { synthesize: () => new Promise(resolve => { finishSynthesis = resolve; }) }, window: { location: { pathname: '/', search: '' }, dispatchEvent() {} }, URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} }, console };
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

test('realtime session captures PCM and delivers final speech only after connection', async () => {
  const input = (await fs.readFile('src/voicenav/ElevenLabsRecognition.js', 'utf8')).replace(/^import .*;\s*/m, '').replace('export default class ElevenLabsRecognition', 'globalThis.Recognition = class ElevenLabsRecognition');
  let socket;
  let processor;
  let started = 0;
  let stopped = 0;
  const events = [];
  class Socket {
    static OPEN = 1;
    readyState = 1;
    sent = [];
    constructor(url) { this.url = url; socket = this; }
    send(data) { this.sent.push(JSON.parse(data)); }
    close() { this.readyState = 3; }
  }
  class Context {
    sampleRate = 16000;
    resume() { return Promise.resolve(); }
    close() { return Promise.resolve(); }
    createMediaStreamSource() { return { connect() {}, disconnect() {} }; }
    createScriptProcessor() { processor = { connect() {}, disconnect() {} }; return processor; }
  }
  const sandbox = { navigator: { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop: () => stopped++ }] }) } }, WebSocket: Socket, AudioContext: Context, voiceAIService: { createSpeechToken: async () => ({ token: 'test' }) }, clearTimeout, setTimeout, URLSearchParams, btoa };
  vm.runInNewContext(input, sandbox);
  const recognition = new sandbox.Recognition();
  recognition.lang = 'hi-IN';
  recognition.onstart = () => started++;
  recognition.onresult = event => events.push(event.results[0]);
  recognition.start();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(started, 0);
  assert.equal(new URL(socket.url).searchParams.get('language_code'), 'hi');
  socket.onmessage({ data: JSON.stringify({ message_type: 'session_started' }) });
  assert.equal(started, 1);
  processor.onaudioprocess({ inputBuffer: { getChannelData: () => new Float32Array([0, .5, -.5]) } });
  assert.equal(socket.sent[0].message_type, 'input_audio_chunk');
  assert.equal(socket.sent[0].sample_rate, 16000);
  assert.equal(Buffer.from(socket.sent[0].audio_base_64, 'base64').length, 6);
  for (const message_type of ['partial_transcript', 'committed_transcript']) socket.onmessage({ data: JSON.stringify({ message_type, text: 'डॉक्टर से मिलना है' }) });
  assert.equal(events[0].isFinal, false);
  assert.equal(events[1].isFinal, true);
  assert.equal(events[1][0].transcript, 'डॉक्टर से मिलना है');
  recognition.stop();
  assert.equal(stopped, 1);
  assert.equal(socket.readyState, 3);
});

test('authentication navigation reaches Gemini even while form input is registered', async () => {
  const input = (await fs.readFile('src/voicenav/CommandParser.js', 'utf8')).replace(/^import .*;\s*/gm, '').replace(/export default commandParser;/, 'globalThis.parser = commandParser;').replace(/export \{[^}]+\};/g, '');
  let calls = 0;
  const sandbox = { VOICE_COMMANDS: { global: {} }, console, aiCommandEngine: {
    parseIntent: async (text, actions, globals, ctx) => { calls++; assert.equal(ctx.expectsFreeText, true); return { intent: text.includes('login') ? 'login_aadhaar' : 'free_text', confidence: 1 }; },
  } };
  vm.runInNewContext(input, sandbox);
  sandbox.parser.registerPageCommands('auth', { login_aadhaar: ['Use Aadhaar to log in'] });
  assert.equal((await sandbox.parser.parse('Please take me to Aadhaar login', 'auth', { expectsFreeText: true })).intent, 'login_aadhaar');
  assert.equal((await sandbox.parser.parse('My name is Test Patient and my age is 30', 'auth', { expectsFreeText: true })).intent, 'free_text');
  assert.equal(calls, 2);
});

test('visible tab labels work locally in all nine languages on form pages', async () => {
  const input = (await fs.readFile('src/voicenav/CommandParser.js', 'utf8')).replace(/^import .*;\s*/gm, '').replace(/export default commandParser;/, 'globalThis.parser = commandParser;').replace(/export \{[^}]+\};/g, '');
  const sandbox = { VOICE_COMMANDS: { global: {} }, aiCommandEngine: { parseIntent: () => { throw Error('Local label must not call AI'); } }, console };
  vm.runInNewContext(input, sandbox);
  for (const label of ['Aadhaar', 'आधार', 'ஆதார்', 'ఆధార్', 'আধার', 'आधार लॉगिन', 'આધાર', 'ಆಧಾರ್', 'ആധാർ']) {
    const result = await sandbox.parser.parse(label, 'auth', { expectsFreeText: true, actions: [{ intent: 'activate_0', description: label }] });
    assert.equal(result.intent, 'activate_0');
  }
});

test('Gemini quota failure uses Llama instead of breaking navigation', async () => {
  let fallback = false;
  const call = server(async (url, options) => {
    if (url.includes('googleapis')) return new Response('quota', { status: 429 });
    fallback = true;
    assert.equal(JSON.parse(options.body).model, 'nvidia/llama-3.1-nemotron-70b-instruct');
    return llama({ intent: 'login_abha', confidence: 1, value: '', target: '', message: 'Opening ABHA.' });
  });
  const data = await (await call({ action: 'intent', transcript: 'Open ABHA', expectsFreeText: true })).json();
  assert.equal(data.intent, 'login_abha');
  assert.equal(fallback, true);
});

test('a Gemini timeout tries the next model instead of skipping recovery', async () => {
  let calls = 0;
  const call = server(async (url) => {
    assert.match(url, /googleapis/);
    if (++calls === 1) throw new Error('Signal timed out');
    return response({ candidates: [{ content: { parts: [{ text: JSON.stringify({ intent:'select_time',confidence:1,target:'',value:'09:30',message:'Time selected.' }) }] } }] });
  });
  const result = await (await call({action:'intent',transcript:'half past nine',actions:[{intent:'select_time',description:'Choose a time'}]})).json();
  assert.equal(result.intent,'select_time');
  assert.equal(calls,2);
});

test('parsed hospital and doctor results actually advance the booking flow', () => {
  const hospital = { id: 'hospital-42', name: 'City Care Hospital', doctors: [{ id: 'doctor-9', name: 'Dr. Meera Rao', specialty: 'Cardiology' }] };
  const state = { tab: 'reports', hospital: null, doctor: null, step: 'main', modal: true };
  const create = () => createPatientSelectionActions({
    hospitals: [hospital], doctors: hospital.doctors, selectedHospital: state.hospital,
    hospitalAliases: item => [item.name, 'सिटी केयर अस्पताल'],
    openTab: tab => { state.tab = tab; state.modal = false; },
    onHospital: item => { state.hospital = item; state.step = 'doctor_select'; },
    onDoctor: item => { state.doctor = item; state.step = 'booking_steps'; },
    onCrossHospitalDoctor: () => { throw Error('Doctor must stay in selected hospital'); },
  });
  assert.equal(create().selectHospital({ target: 'hospital-42', value: 'सिटी केयर अस्पताल' }), true);
  assert.equal(state.hospital, hospital);
  assert.equal(state.tab, 'appointments');
  assert.equal(state.modal, false);
  assert.equal(state.step, 'doctor_select');
  assert.equal(create().selectDoctor({ value: 'I want to consult Dr. Meera Rao' }), true);
  assert.equal(state.doctor, hospital.doctors[0]);
  assert.equal(state.step, 'booking_steps');
});

test('ambiguous and unknown hospital names do not advance the flow', () => {
  let mutations = 0;
  const actions = createPatientSelectionActions({ hospitals: [{ id: 'a', name: 'City Hospital' }, { id: 'b', name: 'City Clinic' }], doctors: [], hospitalAliases: h => [h.name], openTab: () => mutations++, onHospital: () => mutations++ });
  assert.equal(actions.selectHospital({ value: 'City' }), false);
  assert.equal(actions.selectHospital({ value: 'Unknown Hospital' }), false);
  assert.equal(mutations, 0);
});

test('doctor profile action opens the requested profile without starting a booking', () => {
  const doctor = { id: 'doctor-42', name: 'Dr. Meera Rao', hospitalId: 'hospital-9' };
  const state = { tab: 'communities', view: 'main', doctor: null };
  const actions = createPatientSelectionActions({ hospitals: [], doctors: [doctor], openTab: tab => { state.tab = tab; }, onDoctor: () => { throw Error('Must not book'); }, onCrossHospitalDoctor: () => { throw Error('Must not book'); }, onCrossHospitalDoctorProfile: doc => { state.doctor = doc; state.view = 'doctor_profile'; } });
  assert.equal(actions.openDoctorProfile({ target: doctor.id, value: 'मीरा राव' }), true);
  assert.equal(state.tab, 'appointments');
  assert.equal(state.view, 'doctor_profile');
  assert.equal(state.doctor, doctor);
  assert.equal(actions.openDoctorProfile({ value: 'Unknown doctor' }), false);
});

test('specific community action opens the requested group from another tab and rejects ambiguity', () => {
  const communities = [{ id: 'group-a', title: 'Heart Health', title_i18n: { hi: 'हृदय स्वास्थ्य' } }, { id: 'group-b', title: 'Diabetes Support' }, { id: 'group-c', title: 'Diabetes Nutrition' }];
  const state = { tab: 'reports', selectedCommunityId: null };
  const actions = createPatientSelectionActions({ hospitals: [], doctors: [], communities, openTab: tab => { state.tab = tab; }, onCommunity: community => { state.selectedCommunityId = community.id; } });
  assert.equal(actions.openCommunity({ target: 'group-a', value: 'हृदय स्वास्थ्य' }), true);
  assert.equal(state.tab, 'communities');
  assert.equal(state.selectedCommunityId, 'group-a');
  assert.equal(actions.openCommunity({ value: 'Diabetes' }), false);
  assert.equal(state.selectedCommunityId, 'group-a');
  assert.equal(actions.openCommunity({ value: 'Diabetes Support' }), true);
  assert.equal(state.selectedCommunityId, 'group-b');
});

test('field dictation releases only its own listener and restores the latest form listener', () => {
  const registry = new TranscriptRegistry();
  const oldPage = () => 'old page';
  const newPage = () => 'new page';
  const field = () => 'field';
  const releaseOld = registry.add(oldPage);
  const releaseField = registry.add(field, 10);
  const releaseNew = registry.add(newPage);
  releaseOld();
  assert.equal(registry.current, field);
  releaseField();
  assert.equal(registry.current, newPage);
  releaseNew();
  assert.equal(registry.current, null);
});

test('registration intent and extracted numeric details produce a form patch together', () => {
  const patch = registrationFields({ requestedAction: 'new_patient', name: 'Test Patient', age: 38, phone: 9999999999, gender: 'Female' });
  assert.deepEqual(patch, { name: 'Test Patient', age: '38', phone: '9999999999', gender: 'Female' });
  assert.deepEqual({ name: 'Existing', age: '38', ...registrationFields({ phone: '9999999999' }) }, { name: 'Existing', age: '38', phone: '9999999999' });
});
