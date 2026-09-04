import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const source = await fs.readFile('src/voicenav/VoiceAIService.js','utf8');
const url = source.match(/https:\/\/[^']+\.supabase\.co/)[0];
const key = source.match(/sb_publishable_[^']+/)[0];
const cases = [
  ['en','Could you move my appointment to half past nine in the morning?'],
  ['hi','मेरी अपॉइंटमेंट सुबह साढ़े नौ बजे कर दीजिए।'],
  ['ta','எனது சந்திப்பை காலை ஒன்பதரை மணிக்கு மாற்றுங்கள்.'],
  ['te','నా అపాయింట్‌మెంట్‌ను ఉదయం తొమ్మిదిన్నరకు మార్చండి.'],
  ['bn','আমার অ্যাপয়েন্টমেন্ট সকাল সাড়ে নটায় করে দিন।'],
  ['mr','माझी अपॉइंटमेंट सकाळी साडेनऊ वाजता करा.'],
  ['gu','મારી એપોઇન્ટમેન્ટ સવારે સાડા નવ વાગ્યે કરો.'],
  ['kn','ನನ್ನ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಅನ್ನು ಬೆಳಿಗ್ಗೆ ಒಂಬತ್ತೂವರೆಗೆ ಬದಲಾಯಿಸಿ.'],
  ['ml','എന്റെ അപ്പോയിന്റ്മെന്റ് രാവിലെ ഒമ്പതരയ്ക്ക് മാറ്റൂ.'],
];
// Read-only AI checks, no booking requests or patient records.
for (const [language, transcript] of cases.filter(([language]) => process.argv.length < 3 || process.argv.slice(2).includes(language))) {
  const started = Date.now();
  const response = await fetch(`${url}/functions/v1/voice-ai`, { method: 'POST', headers: { 'Content-Type':'application/json', apikey:key, Authorization:`Bearer ${key}` }, body: JSON.stringify({ action:'intent', transcript, language, pageId:'patientDashboard', expectsFreeText:false, actions:[{intent:'select_time',description:'Reschedule time selection. Available times: 09:00 (9 AM), 09:30 (9:30 AM), 10:00 (10 AM). Return time24 in value.'},{intent:'select_date',description:'Change reschedule date; return YYYY-MM-DD in value.'},{intent:'confirm',description:'Confirm the selected reschedule date/time.'}] }), signal:AbortSignal.timeout(30000) });
  if (!response.ok) {
    console.error(`FAIL ${language}: HTTP ${response.status}`, await response.text());
    process.exitCode = 1;
    continue;
  }
  const result=await response.json();
  if (result.intent !== 'select_time' || result.value !== '09:30') {
    console.error(`FAIL ${language}: interpretation`, result);
    process.exitCode = 1;
    continue;
  }
  console.log(`PASS ${language}: correct action and time (${Date.now()-started}ms)`);
}
