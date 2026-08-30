// Deep Complex Voice Understanding Test Suite
// Tests arbitrary order, code-mixed languages, conversational noise, self-corrections, and natural navigation
import commandParser from '../src/voicenav/CommandParser.js';
import aiCommandEngine from '../src/engine/AICommandEngine.js';

console.log('================================================================');
console.log('🧠 DEEP TESTING: VOICE INPUT & ENTITY UNDERSTANDING IN ANY FORMAT');
console.log('================================================================\n');

let pass = 0;
let fail = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    pass++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    fail++;
  }
}

async function runDeepTests() {
  // -------------------------------------------------------------
  // TEST PART A: Complex, Out-of-Order Details Filling in Any Language
  // -------------------------------------------------------------
  console.log('--- TEST PART A: Details Filling (Any Order, Any Language, Conversational) ---');

  const complexRegistrationInputs = [
    {
      desc: 'Symptoms first + Age + Phone + Name + Gender (English/Hindi mix)',
      input: 'I have fever and severe chest pain, age 45, phone number 9876543210, name Dr Ramesh Patel, male',
      expected: { name: 'Ramesh Patel', age: '45', gender: 'Male', phone: '9876543210' }
    },
    {
      desc: 'Self-corrections in age and phone (Hindi)',
      input: 'Mera naam Ananya Roy, female, umar 30 nahi 32 saal, mobile number 9830012340 nahi 9830012345, sar dard hai',
      expected: { name: 'Ananya Roy', age: '32', gender: 'Female', phone: '9830012345' }
    },
    {
      desc: 'Tamil patient with code-mixed medical details',
      input: 'En peyar Muthu Kumar, vayasu 40, aan, phone 9444012345, enakku thalavali irukku',
      expected: { name: 'Muthu Kumar', age: '40', gender: 'Male', phone: '9444012345' }
    },
    {
      desc: 'Telugu patient with symptoms first',
      input: 'Jwaram vachindi, naa peru Lakshmi, vayas 28, mahila, mobile 9848012345',
      expected: { name: 'Lakshmi', age: '28', gender: 'Female', phone: '9848012345' }
    },
    {
      desc: 'Bengali patient with arbitrary order',
      input: 'Amar naam Subhashish Ghosh, boyos 52, purush, phone 9831012345',
      expected: { name: 'Subhashish Ghosh', age: '52', gender: 'Male', phone: '9831012345' }
    },
    {
      desc: 'Marathi patient with Marathi words',
      input: 'Maaze naav Sunita Kulkarni, vaya 35, stri, phone 9823012345, pet dard ahe',
      expected: { name: 'Sunita Kulkarni', age: '35', gender: 'Female', phone: '9823012345' }
    },
    {
      desc: 'Spoken numbers in words + English (e.g. "thirty five", "nine eight...")',
      input: 'Name is Amit Verma, age thirty five, mobile nine eight seven six five four three two one zero, male',
      expected: { name: 'Amit Verma', age: '35', gender: 'Male', phone: '9876543210' }
    },
    {
      desc: 'Gujarati patient with age & phone first',
      input: 'Phone 9898012345, umar 38 varsh, maru naam Hitesh Shah, purush',
      expected: { name: 'Hitesh Shah', age: '38', gender: 'Male', phone: '9898012345' }
    },
    {
      desc: 'Kannada patient with symptoms & hesaru',
      input: 'Nanna hesaru Manjunath Gowda, vayas 42, purusha, 9845012345, body pain',
      expected: { name: 'Manjunath Gowda', age: '42', gender: 'Male', phone: '9845012345' }
    },
    {
      desc: 'Malayalam patient with ente peru',
      input: 'Ente peru Divya Menon, vayassu 31, sthree, phone 9847012345',
      expected: { name: 'Divya Menon', age: '31', gender: 'Female', phone: '9847012345' }
    }
  ];

  for (const tc of complexRegistrationInputs) {
    const res = await aiCommandEngine.extractRegistrationDetails(tc.input, 'en');
    const nameMatch = res && res.name.toLowerCase().includes(tc.expected.name.toLowerCase().split(' ')[0]);
    const ageMatch = res && res.age === tc.expected.age;
    const genderMatch = res && res.gender === tc.expected.gender;
    const phoneMatch = res && res.phone === tc.expected.phone;

    assert(
      nameMatch && ageMatch && genderMatch && phoneMatch,
      `[${tc.desc}]\n    Extracted -> Name: "${res?.name}", Age: "${res?.age}", Gender: "${res?.gender}", Phone: "${res?.phone}"`
    );
  }

  // -------------------------------------------------------------
  // TEST PART B: Natural, Colloquial, Arbitrary Navigation in 9 Languages
  // -------------------------------------------------------------
  console.log('\n--- TEST PART B: Natural & Colloquial Voice Navigation Across Languages ---');

  const colloquialNavigationCases = [
    { speech: 'Mujhe kal ke doctor ki appointment dikhao na please', expected: 'bookAppointment' },
    { speech: 'Hospital ka parcha kidhar hai', expected: 'records' },
    { speech: 'Dawai ka list kholo', expected: 'prescriptions' },
    { speech: 'Main doctor hoon login karna chahta hoon', expected: 'login_doctor' },
    { speech: 'Arey yaar wapas chalo picche', expected: 'back' },
    { speech: 'Mera pet dard kar raha hai check karo', expected: 'triage' },
    { speech: 'Enakku doctor paarkanum', expected: 'bookAppointment' }, // Tamil
    { speech: 'Naaku aushadham kaavali', expected: 'prescriptions' }, // Telugu
    { speech: 'Aami daktar ke dekhate chai', expected: 'bookAppointment' }, // Bengali
    { speech: 'Mala aushadh dakhva', expected: 'prescriptions' }, // Marathi
    { speech: 'Mane doctor ni mulakat karav', expected: 'bookAppointment' }, // Gujarati
    { speech: 'Nanage doctor visit beku', expected: 'bookAppointment' }, // Kannada
    { speech: 'Enikku doctorine kaananam', expected: 'bookAppointment' }, // Malayalam
    { speech: 'Emergency 108 ambulance jaldi bhejo', expected: 'emergency' },
    { speech: 'Bhasha badlo mujhe Tamil me chahiye', expected: 'select_language' },
    { speech: 'Naya mareez ka form bharo', expected: 'register_new' }
  ];

  for (const nc of colloquialNavigationCases) {
    const res = await commandParser.parse(nc.speech);
    assert(
      res && res.intent === nc.expected,
      `Spoken: "${nc.speech}" -> Intent: '${res?.intent}' (Expected: '${nc.expected}', conf: ${res?.confidence})`
    );
  }

  console.log('\n================================================================');
  console.log(`🏁 RESULT: ${pass} PASSED, ${fail} FAILED`);
  console.log('================================================================');
}

runDeepTests();
