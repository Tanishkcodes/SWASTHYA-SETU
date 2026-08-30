// Comprehensive Unit & Functional Test for Swasthya Setu Voice Input & Output System
import commandParser from '../src/voicenav/CommandParser.js';
import { VOICE_COMMANDS, AUDIO_PROMPTS, getAudioPrompt, getLanguageInfo } from '../src/voicenav/LanguagePack.jsx';
import aiCommandEngine from '../src/engine/AICommandEngine.js';

console.log('====================================================');
console.log('🧪 TESTING SWASTHYA SETU VOICE PIPELINE');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

// ==========================================
// TEST 1: Language Code Mappings & Info
// ==========================================
console.log('--- TEST 1: Language Code Mappings for Speech Input & Output ---');
const supportedLangs = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml'];
supportedLangs.forEach(lang => {
  const info = getLanguageInfo(lang);
  assert(info && info.code === lang && !!info.speechCode, `Language '${lang}' speechCode is '${info?.speechCode}' (${info?.name})`);
});

// ==========================================
// TEST 2: Voice Output Audio Prompts Coverage
// ==========================================
console.log('\n--- TEST 2: Audio Prompts Completeness (Voice Output) ---');
const requiredPrompts = [
  'welcomeLanding',
  'welcomePatientDashboard',
  'welcomeInterview',
  'welcomeScan',
  'welcomeSummary',
  'welcomeCompletion',
  'idlePrompt',
  'errorPrompt',
  'encouragement',
  'sectionDone'
];

supportedLangs.forEach(lang => {
  requiredPrompts.forEach(promptKey => {
    const text = getAudioPrompt(lang, promptKey);
    assert(typeof text === 'string' && text.trim().length > 0, `Prompt '${promptKey}' exists in language '${lang}': "${text?.slice(0, 30)}..."`);
  });
});

// ==========================================
// TEST 3: Multi-lingual Voice Input Intent Parsing
// ==========================================
console.log('\n--- TEST 3: Multi-lingual Voice Command Parser (Offline Fast-Path) ---');

const testCases = [
  // English
  { input: 'emergency', expectedIntent: 'emergency' },
  { input: 'book appointment', expectedIntent: 'bookAppointment' },
  { input: 'records', expectedIntent: 'records' },
  { input: 'prescriptions', expectedIntent: 'prescriptions' },
  { input: 'check symptoms', expectedIntent: 'triage' },
  { input: 'go back', expectedIntent: 'back' },
  { input: 'help', expectedIntent: 'help' },
  { input: 'scroll up', expectedIntent: 'scrollUp' },
  { input: 'scroll down', expectedIntent: 'scrollDown' },
  { input: 'doctor portal', expectedIntent: 'login_doctor' },
  { input: 'admin portal', expectedIntent: 'login_admin' },
  { input: 'patient login', expectedIntent: 'login_patient' },

  // Hindi
  { input: 'aapatkaal', expectedIntent: 'emergency' },
  { input: 'doctor dikhao', expectedIntent: 'bookAppointment' },
  { input: 'parcha', expectedIntent: 'records' },
  { input: 'dawai', expectedIntent: 'prescriptions' },
  { input: 'lakshan', expectedIntent: 'triage' },
  { input: 'wapas jao', expectedIntent: 'back' },
  { input: 'madad', expectedIntent: 'emergency' }, // or emergency/help
  { input: 'hindi mein', expectedIntent: 'set_language_hi' },
  { input: 'bhasha badlo', expectedIntent: 'select_language' },
  { input: 'naya mareez', expectedIntent: 'register_new' },

  // Tamil
  { input: 'avasaram', expectedIntent: 'emergency' },
  { input: 'marundhu', expectedIntent: 'prescriptions' },
  { input: 'kuriyeedu', expectedIntent: 'triage' },
  { input: 'tamil il', expectedIntent: 'set_language_ta' },
  { input: 'pudhiya rogi', expectedIntent: 'register_new' },

  // Telugu
  { input: 'atyavasaram', expectedIntent: 'emergency' },
  { input: 'mandulu', expectedIntent: 'prescriptions' },
  { input: 'lakshanalu', expectedIntent: 'triage' },
  { input: 'telugu lo', expectedIntent: 'set_language_te' },

  // Bengali
  { input: 'osudh', expectedIntent: 'prescriptions' },
  { input: 'bangla te', expectedIntent: 'set_language_bn' },

  // Marathi
  { input: 'aushadh', expectedIntent: 'prescriptions' },
  { input: 'marathi madhe', expectedIntent: 'set_language_mr' },

  // Gujarati
  { input: 'gujarati ma', expectedIntent: 'set_language_gu' },

  // Kannada
  { input: 'kannada dalli', expectedIntent: 'set_language_kn' },

  // Malayalam
  { input: 'malayalam il', expectedIntent: 'set_language_ml' }
];

async function runParserTests() {
  for (const tc of testCases) {
    const res = await commandParser.parse(tc.input);
    assert(
      res && res.intent === tc.expectedIntent,
      `Spoken: "${tc.input}" -> Got intent: '${res?.intent}' (Expected: '${tc.expectedIntent}', conf: ${res?.confidence})`
    );
  }

  // ==========================================
  // TEST 4: Spoken Number and Option Selection
  // ==========================================
  console.log('\n--- TEST 4: Spoken Ordinals & Option Selection ---');
  const optionTests = [
    { input: 'option 1', expectedValue: 0 },
    { input: 'option 2', expectedValue: 1 },
    { input: 'option 3', expectedValue: 2 },
    { input: 'first', expectedValue: 0 },
    { input: 'second', expectedValue: 1 },
    { input: 'pehla', expectedValue: 0 },
    { input: 'doosra', expectedValue: 1 },
    { input: 'teesra', expectedValue: 2 },
    { input: 'chautha', expectedValue: 3 }
  ];

  for (const ot of optionTests) {
    const res = await commandParser.parse(ot.input);
    assert(
      res && res.intent === 'selectOption' && res.value === ot.expectedValue,
      `Spoken: "${ot.input}" -> Selected option index: ${res?.value} (Expected: ${ot.expectedValue})`
    );
  }

  // ==========================================
  // TEST 5: Spoken Registration Entity Extraction
  // ==========================================
  console.log('\n--- TEST 5: Spoken Registration Details Entity Extraction (Speech-to-Form) ---');
  const entityTests = [
    {
      input: 'Mera naam Ramesh Kumar hai, umar 45 saal, male, phone number 9876543210',
      expectedName: 'Ramesh Kumar',
      expectedAge: '45',
      expectedGender: 'Male',
      expectedPhone: '9876543210'
    },
    {
      input: 'My name is Sunita Devi, female, age 32 years, mobile 9123456780',
      expectedName: 'Sunita Devi',
      expectedAge: '32',
      expectedGender: 'Female',
      expectedPhone: '9123456780'
    },
    {
      input: 'Umr 28 saal, naam Rahul Sharma, male, 9811223344',
      expectedName: 'Rahul Sharma',
      expectedAge: '28',
      expectedGender: 'Male',
      expectedPhone: '9811223344'
    }
  ];

  for (const et of entityTests) {
    const extracted = await aiCommandEngine.extractRegistrationDetails(et.input, 'hi');
    assert(
      extracted &&
      extracted.name.includes(et.expectedName.split(' ')[0]) &&
      extracted.age === et.expectedAge &&
      extracted.gender === et.expectedGender &&
      extracted.phone === et.expectedPhone,
      `Extracted from "${et.input.slice(0, 35)}...": Name='${extracted.name}', Age='${extracted.age}', Gender='${extracted.gender}', Phone='${extracted.phone}'`
    );
  }

  console.log('\n====================================================');
  console.log(`🏁 TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('====================================================');
}

runParserTests();
