import fs from 'fs';
import path from 'path';

// 1. Read environment variables from .env.local
const envPath = path.resolve('.env.local');
const envFile = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '');
const env = {};
envFile.split(/\r?\n/).forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      env[key] = val;
    }
  }
});

const apiKey = env['GEMINI_API_KEY'];
const geminiModel = env['GEMINI_MODEL'] || 'gemini-3.5-flash-lite';

if (!apiKey) {
  console.error("❌ No GEMINI_API_KEY found in .env.local");
  process.exit(1);
}

// 2. Exact Gemini extraction logic as in Supabase Edge Function
async function extractViaGemini(transcript, language) {
  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'string' },
      phone: { type: 'string' },
      gender: { type: 'string', enum: ['', 'Male', 'Female', 'Other'] },
    },
    required: ['name', 'age', 'phone', 'gender'],
    additionalProperties: false,
  };

  const prompt = `You are an intelligent clinical registration entity extraction engine for Indian healthcare kiosks.
The user may speak in ANY Indian language (Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia), English, or code-mixed dialects (Hinglish/Tanglish/etc.), in ANY arbitrary word order, with conversational padding, spoken digits, or self-corrections (e.g., "age 30 no 35", "my name is Rajesh sorry Ramesh Kumar", "phone number 9876543210").

Task: Extract patient registration fields accurately from the transcript:
- name: The patient's clean personal name in Title Case (strip honorifics and phrases like 'mera naam', 'my name is', 'likhiye', 'myself'). If absent, return empty string.
- age: Only numerical age digits (e.g., '32'). Respect self-corrections (e.g., '30 nahi 35' -> '35'). If absent, return empty string.
- phone: 10-digit mobile number digits (e.g., '9876543210'). Convert any spoken number words into digits. If absent, return empty string.
- gender: Exactly 'Male', 'Female', 'Other', or empty string if not mentioned (e.g., 'purush'/'aadmi'/'man' -> 'Male', 'mahila'/'aurat'/'woman' -> 'Female').

Transcript: ${JSON.stringify(String(transcript || '').slice(0, 2000))}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', responseJsonSchema: schema, temperature: 0 },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const cleanText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(cleanText);
}

// 1 test per language (9 languages) + 3 complex variations = 12 focused tests
const delay = (ms) => new Promise(r => setTimeout(r, ms));
const testCases = [
  // 1. English Variations
  {
    lang: 'en',
    name: 'English (Standard Order)',
    transcript: 'My name is Sarah Jenkins, age 29, phone number is 9876543210, female',
    expected: { name: 'Sarah Jenkins', age: '29', phone: '9876543210', gender: 'Female' }
  },
  {
    lang: 'en',
    name: 'English (Reverse Order & Spoken Digits)',
    transcript: 'Phone is nine eight seven six five four three two one zero, I am a male, thirty five years old, call me David Miller',
    expected: { name: 'David Miller', age: '35', phone: '9876543210', gender: 'Male' }
  },
  {
    lang: 'en',
    name: 'English (Self-Correction & Conversational Fillers)',
    transcript: 'Hi doctor, my name is Robert... sorry Robert Williams, age 40 no 42, phone 9123456780, male',
    expected: { name: 'Robert Williams', age: '42', phone: '9123456780', gender: 'Male' }
  },

  // 2. Hindi Variations
  {
    lang: 'hi',
    name: 'Hindi (Natural Conversational)',
    transcript: 'मेरा नाम रमेश कुमार है, उम्र पैंतालीस साल, फोन नंबर ९८७६५४३२१०, पुरुष',
    expected: { name: 'Ramesh Kumar', age: '45', phone: '9876543210', gender: 'Male' }
  },
  {
    lang: 'hi',
    name: 'Hindi (Hinglish & Self-Correction)',
    transcript: 'Mera naam likhiye Suresh... nahi Suresh Patel, umar 30 nahi 35 saal, phone number 9822334455, male',
    expected: { name: 'Suresh Patel', age: '35', phone: '9822334455', gender: 'Male' }
  },
  {
    lang: 'hi',
    name: 'Hindi (Phone First + Spoken Words)',
    transcript: 'Phone number note karo nau aath ek do teen char panch che saat aath, aurat hu, umar 50 saal, naam Sunita Sharma',
    expected: { name: 'Sunita Sharma', age: '50', phone: '9812345678', gender: 'Female' }
  },

  // 3. Tamil Variations
  {
    lang: 'ta',
    name: 'Tamil (Pure Script)',
    transcript: 'என் பெயர் கார்த்திக் ராஜா, வயது முப்பத்து இரண்டு, தொலைபேசி எண் 9876543210, ஆண்',
    expected: { name: 'Karthik Raja', age: '32', phone: '9876543210', gender: 'Male' }
  },
  {
    lang: 'ta',
    name: 'Tamil (Tanglish Mix & Reverse Order)',
    transcript: 'Phone number 9840123456, enaku vayasu 28, female, en name Priya Sundaram',
    expected: { name: 'Priya Sundaram', age: '28', phone: '9840123456', gender: 'Female' }
  },

  // 4. Telugu Variations
  {
    lang: 'te',
    name: 'Telugu (Pure Script)',
    transcript: 'నా పేరు వెంకటేశ్వర రావు, వయస్సు 48 సంవత్సరాలు, ఫోన్ నంబర్ 9848012345, పురుషుడు',
    expected: { name: 'Venkateshwara Rao', age: '48', phone: '9848012345', gender: 'Male' }
  },
  {
    lang: 'te',
    name: 'Telugu (Telugish Conversational)',
    transcript: 'Naa peru Lakshmi Devi, age 36 years, phone number 9876543210, female',
    expected: { name: 'Lakshmi Devi', age: '36', phone: '9876543210', gender: 'Female' }
  },

  // 5. Bengali Variations
  {
    lang: 'bn',
    name: 'Bengali (Pure Script)',
    transcript: 'আমার নাম অমিত চ্যাটার্জী, বয়স ৪২ বছর, ফোন নম্বর ৯৮৩০০১২৩৪৫, পুরুষ',
    expected: { name: 'Amit Chatterjee', age: '42', phone: '9830012345', gender: 'Male' }
  },
  {
    lang: 'bn',
    name: 'Bengali (Banglish Mix)',
    transcript: 'Amar naam Ananya Sen, umar 31, phone 9876543210, mohila',
    expected: { name: 'Ananya Sen', age: '31', phone: '9876543210', gender: 'Female' }
  },

  // 6. Marathi Variations
  {
    lang: 'mr',
    name: 'Marathi (Natural Script)',
    transcript: 'माझे नाव ज्ञानेश्वर कदम, वय ५२ वर्षे, फोन नंबर ९८२००१२३४५, पुरुष',
    expected: { name: 'Dnyaneshwar Kadam', age: '52', phone: '9820012345', gender: 'Male' }
  },
  {
    lang: 'mr',
    name: 'Marathi (Conversational Mix)',
    transcript: 'Nav ahe Pooja Deshmukh, umar 26 saal, phone 9876543210, stri',
    expected: { name: 'Pooja Deshmukh', age: '26', phone: '9876543210', gender: 'Female' }
  },

  // 7. Gujarati Variations
  {
    lang: 'gu',
    name: 'Gujarati (Natural Script)',
    transcript: 'મારું નામ હર્ષદ મહેતા છે, ઉંમર ૫૫ વર્ષ, ફોન નંબર ૯૮૯૮૦૧૨૩૪૫, પુરૂષ',
    expected: { name: 'Harshad Mehta', age: '55', phone: '9898012345', gender: 'Male' }
  },
  {
    lang: 'gu',
    name: 'Gujarati (Conversational Mix)',
    transcript: 'Maru naam Neha Patel, age 30, phone number 9876543210, stree',
    expected: { name: 'Neha Patel', age: '30', phone: '9876543210', gender: 'Female' }
  },

  // 8. Kannada Variations
  {
    lang: 'kn',
    name: 'Kannada (Natural Script)',
    transcript: 'ನನ್ನ ಹೆಸರು ಮಂಜುನಾಥ್ ಗೌಡ, ವಯಸ್ಸು 40 ವರ್ಷ, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ 9845012345, ಪುರುಷ',
    expected: { name: 'Manjunath Gowda', age: '40', phone: '9845012345', gender: 'Male' }
  },
  {
    lang: 'kn',
    name: 'Kannada (Conversational Mix)',
    transcript: 'Hesaru Kavya Kumar, age 27, phone 9876543210, female',
    expected: { name: 'Kavya Kumar', age: '27', phone: '9876543210', gender: 'Female' }
  },

  // 9. Malayalam Variations
  {
    lang: 'ml',
    name: 'Malayalam (Natural Script)',
    transcript: 'എന്റെ പേര് മോഹൻലാൽ കുറുപ്പ്, പ്രായം 50 വയസ്സ്, ഫോൺ നമ്പർ 9847012345, പുരുഷൻ',
    expected: { name: 'Mohanlal Kurup', age: '50', phone: '9847012345', gender: 'Male' }
  },
  {
    lang: 'ml',
    name: 'Malayalam (Conversational Mix)',
    transcript: 'Ente peru Divya Menon, age 33, phone 9876543210, sthree',
    expected: { name: 'Divya Menon', age: '33', phone: '9876543210', gender: 'Female' }
  }
];

async function runAllTests() {
  console.log("===============================================================================");
  console.log("🏥 SWASTHYA SETU — MULTI-LINGUAL 9-LANGUAGE REGISTRATION EXTRACTION TEST SUITE");
  console.log("===============================================================================\n");

  let passed = 0;
  let failed = 0;
  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i];
    console.log(`▶ Test ${i + 1}/${testCases.length}: [${test.lang.toUpperCase()}] ${test.name}`);
    console.log(`  🗣️ Transcript: "${test.transcript}"`);

    try {
      await delay(2500);
      const extracted = await extractViaGemini(test.transcript, test.lang);
      console.log(`  🤖 Extracted:  `, JSON.stringify(extracted));

      // Validate extraction
      const phoneOk = !test.expected.phone || (extracted.phone && extracted.phone.replace(/\D/g, '') === test.expected.phone);
      const ageOk = !test.expected.age || (extracted.age && String(extracted.age).includes(test.expected.age));
      const genderOk = !test.expected.gender || (extracted.gender && extracted.gender.toLowerCase() === test.expected.gender.toLowerCase());
      const nameOk = !test.expected.name || (extracted.name && extracted.name.toLowerCase().includes(test.expected.name.toLowerCase().split(' ')[0]));

      if (phoneOk && ageOk && genderOk && nameOk) {
        console.log(`  ✅ PASSED\n`);
        passed++;
        results.push({ test: test.name, lang: test.lang, status: 'PASSED', extracted });
      } else {
        console.log(`  ⚠️ PARTIAL / MISMATCH: Expected:`, JSON.stringify(test.expected));
        console.log(`  ❌ FAILED\n`);
        failed++;
        results.push({ test: test.name, lang: test.lang, status: 'FAILED', extracted, expected: test.expected });
      }
    } catch (err) {
      console.error(`  💥 ERROR:`, err.message, `\n`);
      failed++;
      results.push({ test: test.name, lang: test.lang, status: 'ERROR', error: err.message });
    }
  }

  console.log("===============================================================================");
  console.log(`🎯 FINAL RESULTS: Total: ${testCases.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`🏆 Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
  console.log("===============================================================================");

  // Save report to scratchpad
  fs.writeFileSync('test_extraction_report.json', JSON.stringify({ passed, failed, total: testCases.length, results }, null, 2));
}

runAllTests();
