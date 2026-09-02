/* ============================================
   SWASTHYA SETU — Voice Command Parser v3.0
   Universal multi-language intent recognition
   Fast-path < 2ms + AI semantic fallback
   ============================================ */

import { VOICE_COMMANDS } from './LanguagePack';
import aiCommandEngine from '../engine/AICommandEngine';
import voiceAIService from './VoiceAIService';

// Levenshtein distance for fuzzy matching
function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] = a[i - 1] === b[j - 1]
        ? matrix[i - 1][j - 1]
        : 1 + Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]);
    }
  }
  return matrix[a.length][b.length];
}

// Normalize text for comparison
function normalize(text) {
  return text.toLowerCase().trim().replace(/[.,!?;:'"]/g, '').replace(/\s+/g, ' ');
}

// Calculate similarity score (0-1)
function similarity(input, target) {
  const a = normalize(input);
  const b = normalize(target);
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.9;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(a, b);
  return 1 - dist / maxLen;
}

class CommandParser {
  constructor() {
    this.pageCommands = {};
    this.confidenceThreshold = 0.6;
    this.currentLanguage = 'en';
    this.routes = [];
    this.currentPage = null;
  }

  setLanguage(lang) {
    this.currentLanguage = lang;
  }

  setCurrentPage(page) {
    this.currentPage = page;
  }

  setRoutes(routes) {
    this.routes = Array.isArray(routes) ? routes : [];
  }

  // Register page-specific commands
  registerPageCommands(pageId, commands) {
    this.pageCommands[pageId] = commands;
  }

  unregisterPageCommands(pageId) {
    delete this.pageCommands[pageId];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FAST-PATH INTENT MATCHER — handles all 9 Indian languages < 2ms
  // Philosophy: detect INTENT from ANY phrasing, ANY language, ANY order
  // ─────────────────────────────────────────────────────────────────────────
  _fastMatchIntent(input, context = {}) {
    const raw = input.toLowerCase().trim();
    const words = raw.split(/\s+/).filter(Boolean);

    // Skip command parsing for descriptive free-text (form filling mode)
    const isDescriptiveSentence = words.length > 3 || /\b(?:naam|name|umar|age|phone|saal|years|number|\d{4,}|symptom|takleef|dard|problem|bimari|fever|pain)\b/i.test(raw);
    if (context.expectsFreeText && isDescriptiveSentence) {
      return null;
    }

    // ──────────────────────────────────────────
    // 1. LANGUAGE SWITCHING (9 languages)
    // ──────────────────────────────────────────
    if (/\b(?:hindi|hindi me|hindi mein|हिंदी|हिन्दी)\b/i.test(raw) || /^(hindi|हिंदी|हिन्दी)$/i.test(raw)) {
      return { intent: 'set_language_hi', confidence: 0.99, value: 'hi' };
    }
    if (/\b(?:marathi|marathi me|marathi madhe|मराठी)\b/i.test(raw) || /^(marathi|मराठी)$/i.test(raw)) {
      return { intent: 'set_language_mr', confidence: 0.99, value: 'mr' };
    }
    if (/\b(?:gujarati|gujarati ma|ગુજરાતી|ગુજ)\b/i.test(raw) || /^(gujarati|ગુજરાતી)$/i.test(raw)) {
      return { intent: 'set_language_gu', confidence: 0.99, value: 'gu' };
    }
    if (/\b(?:tamil|tamil il|தமிழ்|தமி)\b/i.test(raw) || /^(tamil|தமிழ்)$/i.test(raw)) {
      return { intent: 'set_language_ta', confidence: 0.99, value: 'ta' };
    }
    if (/\b(?:telugu|telugu lo|తెలుగు)\b/i.test(raw) || /^(telugu|తెలుగు)$/i.test(raw)) {
      return { intent: 'set_language_te', confidence: 0.99, value: 'te' };
    }
    if (/\b(?:bengali|bangla|bangla te|বাংলা)\b/i.test(raw) || /^(bengali|bangla|বাংলা)$/i.test(raw)) {
      return { intent: 'set_language_bn', confidence: 0.99, value: 'bn' };
    }
    if (/\b(?:kannada|kannada dalli|ಕನ್ನಡ)\b/i.test(raw) || /^(kannada|ಕನ್ನಡ)$/i.test(raw)) {
      return { intent: 'set_language_kn', confidence: 0.99, value: 'kn' };
    }
    if (/\b(?:malayalam|malayalam il|മലയാളം)\b/i.test(raw) || /^(malayalam|മലയാളം)$/i.test(raw)) {
      return { intent: 'set_language_ml', confidence: 0.99, value: 'ml' };
    }
    if (/\b(?:english|angrezi|अंग्रेजी|ஆங்கிலம்|ఆంగ్లం|ইংরেজি|ઇંગ્લિশ|ಆಂಗ್ಲ|ഇംഗ്ലീഷ്)\b/i.test(raw)) {
      return { intent: 'set_language_en', confidence: 0.99, value: 'en' };
    }

    // ──────────────────────────────────────────
    // 2. EMERGENCY / SOS (highest priority)
    // ──────────────────────────────────────────
    if (
      /^(emergency|sos|madad|aapatkaal|kavach|urgent|108|102|help me|avasaram|atyavasaram|बचाओ|आपत्कालीन|அவசரம்|అత్యవసరం|জরুরী|કટোકટী|ತುರ್ತು|അടിയന്തരം)$/i.test(raw) ||
      /\b(?:emergency|aapatkaal|madad karo|bachao|sahayam|avasaram|atyavasaram|108 ambulance|jaldi bhejo|ambulance bulao|emergency hai|help karo|bachao mujhe)\b/i.test(raw)
    ) {
      return { intent: 'emergency', confidence: 0.99, value: null };
    }

    // ──────────────────────────────────────────
    // 3. HOME / MAIN MENU
    // ──────────────────────────────────────────
    if (
      /^(home|main menu|shuruat|mukhyaprastha|illu|ghor|mughappu|ghar|mukhya|pratham|होम|मुख्य पृष्ठ|முகப்பு|హోమ్|বাড়ি|ઘર|ಮುಖ್ಯ ಪುಟ|ഹോം)$/i.test(raw) ||
      /\b(?:home jao|main menu|go home|ghar jao|mukhyaprastha|landing page|wapas ghar|home page|back to home|main page pe jao)\b/i.test(raw)
    ) {
      return { intent: 'home', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 4. BACK / GO BACK / PREVIOUS
    // ──────────────────────────────────────────
    if (
      /^(back|go back|peeche|pinnadi|venakki|piche|paathimukham|hinde|pirakil|वापस|பின்னால்|వెనక్కి|ফিরে যান|પાછા|ಹಿಂದೆ|പുറകിലോട്ട്|peechhe)$/i.test(raw) ||
      /\b(?:peeche jao|wapas jao|go back|wapas chalo|previous page|pichle page|peeche chalo|chalo picche|back karo|previous step|picche jao)\b/i.test(raw)
    ) {
      return { intent: 'back', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 5. LOGOUT
    // ──────────────────────────────────────────
    if (
      /^(logout|log out|signout|sign out|exit|bahar jao|niklo|निकलो|வெளியேறு|నిష్క్రమించు|লগআউট|લૉગ આઉટ|ಲಾಗ್ ಔಟ್|ലോഗ്ഔട്ട്)$/i.test(raw) ||
      /\b(?:logout karo|log out karo|bahar jao|session khatam|sign out karo|exit karo)\b/i.test(raw)
    ) {
      return { intent: 'logout', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 6. BOOK APPOINTMENT (before generic appointment check)
    // ──────────────────────────────────────────
    if (
      /\b(?:book appointment|appointment book|doctor dikhao|doctor se milna|doctor bulao|doctor chahiye|mujhe doctor|doctor appointment|naya appointment|book karo|appointment lena|appointment chahiye|appointment banana|doctor visit|doctor check|doctor paarkanum|daktar dekhate|doctorine kaananam|doctor mulakat|doctor visit beku|doctor ni mulakat|doctor ko dikhana|doctor dekhna|appointment fix|fix appointment|doctor fix|consultation book|doc appointment|new appointment)\b/i.test(raw) ||
      /^(book|booking|appointment|doctor appointment|mulakat|bhet|sandhi|veti|appointment book|niyamana|قرار|अपॉइंटमेंट बुक|சந்திப்பை முன்பதிவு|అపాయింట్‌మెంట్ బుక్|অ্যাপয়েন্টমেন্ট বুক|મુલાકાત બuuk|ಬుಕ್ ಮಾಡಿ|ബുക്ക് ചെയ്യുക)$/i.test(raw)
    ) {
      return { intent: 'bookAppointment', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 7. VIEW APPOINTMENTS TAB
    // ──────────────────────────────────────────
    if (
      /\b(?:my appointments|meri appointments|appointments dikhao|upcoming appointments|show appointments|view appointments|appointment list|mere appointments|meri milakat|appointments tab|sandhi dikhao|veti dikhao)\b/i.test(raw) ||
      /^(appointments|sanndhi|veti|bhet|mulakat|नियमन|kūṭikāzhcha|अपॉइंटमेंट|मुलाकात|சந்திப்புகள்|అపాయింట్‌మెంట్లు|অ্যাপয়েন্টমেন্ট|મુलাकातो|ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು|അപ്പോയ്ന്റ്മെന്റുകൾ)$/i.test(raw)
    ) {
      return { intent: 'viewAppointments', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 8. VIEW HISTORY TAB
    // ──────────────────────────────────────────
    if (
      /\b(?:history dikhao|purani appointments|past appointments|appointment history|medical history|meri history|purana record dikhao|history tab|show history|view history|itihas dikhao|charitra dikhao|varalaru dikhao|purana dikhao|old appointments|previous visits)\b/i.test(raw) ||
      /^(history|itihas|charitra|varalaru|purva|purani|itibritta|rekha|इतिहास|வரலாறு|చరిత్ర|ইতিহাস|ઇતિહાસ|ಇತಿಹಾಸ|ചരിത്രം)$/i.test(raw)
    ) {
      return { intent: 'viewHistory', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 9. VIEW REPORTS TAB
    // ──────────────────────────────────────────
    if (
      /\b(?:reports dikhao|medical reports|test results|lab reports|mere reports|report dikhao|show reports|view reports|reports tab|test report|diagnostic report|mera parcha|lab test|scans dikhao|x-ray dikhao|blood report)\b/i.test(raw) ||
      /^(reports|report|medical records|health locker|parcha|varalaru|rekharu|itibritta|दस्तावेज़|पर्चा|பதிவுகள்|రికార్డులు|নথি|દส்தாவேஜ்|ದಾಖಲೆಗಳು|രേഖകൾ)$/i.test(raw)
    ) {
      return { intent: 'viewReports', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 10. VIEW DONATIONS TAB
    // ──────────────────────────────────────────
    if (
      /\b(?:donations dikhao|daan dikhao|charity|donate|donation tab|blood donate|organ donate|donation history|mere donations|daan karna)\b/i.test(raw) ||
      /^(donations|donation|daan|charity|दान|நன்கொடைகள்|విరాళాలు|অনুদান|દান|ದೇಣಗಿಗಳು|സംഭാവനകൾ)$/i.test(raw)
    ) {
      return { intent: 'viewDonations', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 11. VIEW COMMUNITIES TAB
    // ──────────────────────────────────────────
    if (
      /\b(?:communities dikhao|community tab|samudaay|health community|patient community|group dikhao|join community|show community|forum)\b/i.test(raw) ||
      /^(communities|community|samudaay|samaj|समुदाय|சமூகங்கள்|కమ్యూనిటీలు|সম্প্রদায়|સمुدाय|ಸಮುದಾಯಗಳು|കമ്മ്യൂണിറ്റികൾ)$/i.test(raw)
    ) {
      return { intent: 'viewCommunities', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 12. VIEW HELP / SUPPORT TAB
    // ──────────────────────────────────────────
    if (
      /\b(?:help dikhao|support karo|help chahiye|madad chahiye|help tab|support tab|customer care|helpline|contact us|help me|sahayata chahiye|udhavi chahiye)\b/i.test(raw) ||
      /^(help|support|madad|udhavi|sahayam|sahajjo|saahaay|neravu|मदद|உதவி|సహాయం|সাহায্য|मदत|મدद|ಸಹಾಯ| സഹായം)$/i.test(raw)
    ) {
      return { intent: 'viewHelp', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 13. START CONSULTATION / HEALTH INTERVIEW
    // ──────────────────────────────────────────
    if (
      /\b(?:start consultation|health check|symptom check|check karo|interview start|anamnesis|clinical intake|pre-visit|health intake|doctor se baat|medical interview|bimari batao|takleef batao|consultation shuru|health session start)\b/i.test(raw) ||
      /^(consultation|intake|interview|anamnesis|checkup|check-up|स्वास्थ्य जांच|ஆரோக்கிய சோதனை|ఆరోగ్య తనిఖీ|স্বাস্থ্য পরীক্ষা)$/i.test(raw)
    ) {
      return { intent: 'startConsultation', confidence: 0.97, value: null };
    }

    // ──────────────────────────────────────────
    // 14. MEDICAL RECORDS / HEALTH LOCKER
    // ──────────────────────────────────────────
    if (
      /\b(?:medical records|parcha|swasthya record|parcha kidhar|meri reports|report dikhao|hospital record|purane kagaz|purana record|health locker|documents dikhao)\b/i.test(raw) ||
      /^(records|record|health locker|parcha|दस्तावेज़|பதிவுகள்|రికార్డులు|নথি|દсতাবেজ|ದಾಖಲೆಗಳು|രേഖകൾ)$/i.test(raw)
    ) {
      return { intent: 'records', confidence: 0.97, value: null };
    }

    // ──────────────────────────────────────────
    // 15. PRESCRIPTIONS / MEDICINES
    // ──────────────────────────────────────────
    if (
      /\b(?:dawa|dawai|medicine|goli|tablet|marundhu|mandulu|aushadh|osudh|dawai ka list|dawai dikhao|marundhu vendum|aushadham kaavali|aushadh dakhva|prescription dikhao|mere prescriptions)\b/i.test(raw) ||
      /^(prescription|prescriptions|medicine|medicines|dawa|dawai|marundhu|mandulu|aushadh|osudh|davaa|oushadham|औषध|மருந்து|మందులు|ঔষধ|દวาઓ|ಔಷಧಿಗಳು|മരുന്നുകൾ|दवाई|दवाएं)$/i.test(raw)
    ) {
      return { intent: 'prescriptions', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 16. SYMPTOMS / TRIAGE CHECK
    // ──────────────────────────────────────────
    if (
      /\b(?:lakshan janch|check lakshan|symptom check|bimari janch|takleef check|triage|check symptoms|check up|pet dard|sar dard|bukhar hai|takleef ho rahi hai|mujhe takleef|mujhe dard|mera lakshan|body pain|fever hai|cough hai)\b/i.test(raw) ||
      /^(symptoms|symptom|check symptoms|lakshan|kuriyeedu|lakshanalu|rogalakshan|lakshano|chihnangal|लक्षण|அறிகுறிகள்|లక్షణాలు|লক্ষণ|ચিহ्नो|ರೋಗಲಕ್ಷಣಗಳು|ലക്ഷണങ്ങൾ)$/i.test(raw)
    ) {
      return { intent: 'triage', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 17. DOCTOR PORTAL / PHYSICIAN LOGIN
    // ──────────────────────────────────────────
    if (
      /\b(?:doctor portal|doctor login|doctor panel|main doctor|physician login|vaidya login|doctor hoon|physician hoon|doc portal)\b/i.test(raw) ||
      /^(doctor portal|doctor login|doctor panel|physician|physician login|vaidya login|maruthuvar|daakthar login|চিকিৎসক লগইন|డాక్టర్ లాగిన్|மருத்துவர் உள்நுழைவு|వైद்ய లॉগিন|ಡಾಕ್ಟರ್ ಲಾಗಿನ್|ഡോക്ടർ ലോഗിൻ|डॉक्टर लॉगिन|डॉक्टर पोर्टल|doctor|dr|physician)$/i.test(raw)
    ) {
      return { intent: 'login_doctor', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 18. ADMIN PORTAL
    // ──────────────────────────────────────────
    if (
      /\b(?:admin portal|admin login|administrator login|staff login|prabandhak login)\b/i.test(raw) ||
      /^(admin|administrator|sysadmin|admin portal|admin login|staff login|prabandhak|nirvagi|parichalok|nirvahaka|അഡ്മിൻ|व्यवस्थापक|प्रशासक)$/i.test(raw)
    ) {
      return { intent: 'login_admin', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 19. PATIENT PORTAL / PATIENT LOGIN
    // ──────────────────────────────────────────
    if (
      /\b(?:patient portal|patient login|mareez portal|patient hoon|mareez login|patient entry|patient access)\b/i.test(raw) ||
      /^(patient portal|patient login|mareez portal|patient|mareez|rogi|darodi|രോഗി ലോഗിൻ|நோயாளி உள்நுழைவு|రోగి లాగిన్|রোগী লগইন|रुग्ण लॉगिन|दर्दी लॉगिन|ರೋಗಿ ಲಾಗಿನ್|मरीज़ लॉगिन|मरीज पोर्टल)$/i.test(raw)
    ) {
      return { intent: 'login_patient', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 20. ABHA LOGIN
    // ──────────────────────────────────────────
    if (
      /\b(?:abha login|abha se login|abha number se|abha card se)\b/i.test(raw) ||
      /^(abha|abha login|abha number|aabha|आभा|ஆபா|ఆభా|আভা)$/i.test(raw)
    ) {
      return { intent: 'login_abha', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 21. AADHAAR LOGIN
    // ──────────────────────────────────────────
    if (
      /\b(?:aadhaar login|aadhaar se login|aadhar se|aadhar card se)\b/i.test(raw) ||
      /^(aadhaar|aadhar|aadhar number|aadhaar card|आधार|ஆதார்|ఆధార్|আধার)$/i.test(raw)
    ) {
      return { intent: 'login_aadhaar', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 22. NEW PATIENT REGISTRATION
    // ──────────────────────────────────────────
    if (
      /\b(?:register|registration|naya registration|naya mareez ka form|new patient registration|new patient|naya patient|pehli baar|first time|naye patient|patient register karna|register karo)\b/i.test(raw) ||
      /^(new patient|naya mareez|naya patient|register new|pudhiya rogi|kottha rogi|notun rogi|naveen rogi|hosa rogi|puthiya rogi|नया मरीज़|புதிய நோயாளி|కొత్త రోగి|নতুন রোগী|नवीन रुग्ण|નवो दर्दी|ಹೊಸ ರೋಗಿ|പുതിയ രോഗി)$/i.test(raw)
    ) {
      return { intent: 'register_new', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 23. SCAN / DOCUMENT UPLOAD
    // ──────────────────────────────────────────
    if (
      /\b(?:parcha scan|scan parcha|upload report|scan document|upload document|prescription scan|lab report scan|document upload|scan karo|report upload|photo upload|image upload)\b/i.test(raw) ||
      /^(scan|scanner|document|prescription|parcha|report|scan document|parcha scan|doc scan|ஆவணம்|పత్రం|দলিল|દстावеज|ದಾಖಲೆ|രേഖ|दस्तावेज़|पर्चा)$/i.test(raw)
    ) {
      return { intent: 'scanRecord', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 24. NEXT / NEXT STEP (Booking Flow, Forms)
    // ──────────────────────────────────────────
    if (
      /^(next|agla|aage|aage jao|next step|aage chalte|chaliye|proceed|continue|आगे|அடுத்தது|తదుపరి|পরবর্তী|આગળ|ಮುಂದಿನ|അടുത്തത്)$/i.test(raw) ||
      /\b(?:next step|aage jao|aage chalo|proceed karo|continue karo|next karo|go next|move next|agla step|agle step pe|step next)\b/i.test(raw)
    ) {
      return { intent: 'next', confidence: 0.97, value: null };
    }

    // ──────────────────────────────────────────
    // 25. READ SUMMARY / LISTEN
    // ──────────────────────────────────────────
    if (
      /\b(?:summary padho|summary sunao|read summary|mujhe padho|sunao|padh ke batao|summary bolo)\b/i.test(raw) ||
      /^(read|read summary|listen|padho|sunao|vasi|chaduvu|poro|vacha|vaachh|oodhu|vaayikkuka|पढ़ो|सुनाओ|வாசி|చదువు|পড়ুন|वाचा|વাંચો|ಓದಿ|വായിക്കുക)$/i.test(raw)
    ) {
      return { intent: 'read_summary', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 26. CONFIRM / SUBMIT / FINISH
    // ──────────────────────────────────────────
    if (
      /\b(?:submit karo|confirm karo|jama karo|book kar do|appointment confirm|done karo|theek hai|finalise|finalize|appointment pakka|pakka karo|confirm appointment|yes confirm)\b/i.test(raw) ||
      /^(confirm|submit|send|finish|done|jama|jama karein|samarpi|dhakkal|drudikarisiri|samarpikkuka|जमा|पुष्टि|சமர்ப்பி|సమర్పించు|জমা|सबमिट|સবमित|ಸಲ್ಲಿಸಿ|സമർപ്പിക്കുക)$/i.test(raw)
    ) {
      return { intent: 'confirm', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 27. SKIP / LEAVE
    // ──────────────────────────────────────────
    if (
      /\b(?:skip karo|chhod do|leave this|skip this|abhi nahi|baad mein|later|not now|skip it|is step ko chhodo)\b/i.test(raw) ||
      /^(skip|leave|chodo|chhoden|vittuvidu|vadileyi|bad|soda|sodi|bidi|ozhivakkuka|छोड़ें|தவிர்|వదిలివేయి|বাদ|সোডা|છोडो|ಬಿಡಿ|ഒഴിവാക്കുക)$/i.test(raw)
    ) {
      return { intent: 'skip', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 28. YES / AGREE / ACCEPT
    // ──────────────────────────────────────────
    if (
      /^(yes|haan|ha|sahi|agree|accept|aam|avunu|hyn|ho|howdu|athe|हाँ|சரி|అవును|হ্যাঁ|होय|હा|ಹೌದು|അതെ)$/i.test(raw) ||
      /^(haan ji|yes please|bilkul|zaroor|of course|theek hai|sahi hai|bilkul sahi)$/i.test(raw)
    ) {
      return { intent: 'yes', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 29. NO / DISAGREE / REJECT
    // ──────────────────────────────────────────
    if (
      /^(no|nahi|nahin|illai|kaadhu|na|naahi|alla|illa|nah|नहीं|இல்லை|కాదు|না|नाही|ના|ಇಲ್ಲ|ഇല്ല)$/i.test(raw) ||
      /^(nahi ji|no thanks|nahi chahiye|nahin chahiye|mat karo)$/i.test(raw)
    ) {
      return { intent: 'no', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 30. LANGUAGE SELECTION PAGE
    // ──────────────────────────────────────────
    if (
      /\b(?:bhasha badlo|change language|bhasha badal|mozhi maathru|bhasha select karo|language change karo)\b/i.test(raw) ||
      /^(language|change language|select language|bhasha|bhasha badlo|boli|mozhi|bhashayein|భాష|மொழி|ভাষা|ભाষа|ಭಾಷೆ|ഭാഷ|भाषा)$/i.test(raw)
    ) {
      return { intent: 'select_language', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 31. SCROLL UP / DOWN
    // ──────────────────────────────────────────
    if (/\b(?:scroll up|upar jao|scroll upar|page upar|upar dikhao)\b/i.test(raw) ||
        /^(scroll up|scrollup|upar|mele|paiki|upore|varth|ऊपर|மேலே)$/i.test(raw)) {
      return { intent: 'scrollUp', confidence: 0.98, value: null };
    }
    if (/\b(?:scroll down|neeche jao|scroll neeche|page neeche|neeche dikhao)\b/i.test(raw) ||
        /^(scroll down|scrolldown|neeche|keezhe|kindiki|niche|khali|नीचे|கீழே)$/i.test(raw)) {
      return { intent: 'scrollDown', confidence: 0.98, value: null };
    }

    // ──────────────────────────────────────────
    // 32. AYUSH / TRADITIONAL MEDICINE TOGGLE
    // ──────────────────────────────────────────
    if (
      /\b(?:ayush mode|toggle ayush|ayurveda|homeopathy|unani|siddha|naturopathy|traditional medicine|desi ilaj|ayurvedic)\b/i.test(raw) ||
      /^(ayush|ayurveda|ayurvedic|homeopathy|unani|siddha|आयुष|आयुर्वेद|ஆயுஷ்|ఆయుష్|আয়ুষ|આयुष|ಆಯುಷ|ആയുഷ്)$/i.test(raw)
    ) {
      return { intent: 'toggleAyush', confidence: 0.97, value: null };
    }

    // ──────────────────────────────────────────
    // 33. SELECT DOCTOR BY NUMBER (Booking Flow)
    // ──────────────────────────────────────────
    const doctorSelectMatch = raw.match(/(?:doctor|dr\.?|vaidya|maruthuvar|daktar)\s*(?:number|no\.?|#)?\s*(\d+)/i)
      || raw.match(/(?:pehla|pahila|first|ek|1st|modati)\s*(?:doctor|dr\.?|option)/i)
      || raw.match(/(?:doosra|second|do|2nd|irandaam)\s*(?:doctor|dr\.?|option)/i)
      || raw.match(/(?:teesra|third|teen|3rd|moondram)\s*(?:doctor|dr\.?|option)/i);
    if (doctorSelectMatch) {
      let val = 0;
      if (doctorSelectMatch[1]) val = parseInt(doctorSelectMatch[1]) - 1;
      else if (/pehla|pahila|first|ek|1st|modati/i.test(raw)) val = 0;
      else if (/doosra|second|do|2nd|irandaam/i.test(raw)) val = 1;
      else if (/teesra|third|teen|3rd|moondram/i.test(raw)) val = 2;
      return { intent: 'select_doctor', confidence: 0.95, value: val };
    }

    // ──────────────────────────────────────────
    // 34. SELECT HOSPITAL BY NUMBER
    // ──────────────────────────────────────────
    const hospitalSelectMatch = raw.match(/(?:hospital|aspatal|aspathal|haspatal)\s*(?:number|no\.?|#)?\s*(\d+)/i)
      || raw.match(/(?:pehla|pahila|first|ek|1st)\s*(?:hospital|aspatal)/i)
      || raw.match(/(?:doosra|second|do|2nd)\s*(?:hospital|aspatal)/i);
    if (hospitalSelectMatch) {
      let val = 0;
      if (hospitalSelectMatch[1]) val = parseInt(hospitalSelectMatch[1]) - 1;
      else if (/pehla|pahila|first|ek|1st/i.test(raw)) val = 0;
      else if (/doosra|second|do|2nd/i.test(raw)) val = 1;
      return { intent: 'select_hospital', confidence: 0.94, value: val };
    }

    // ──────────────────────────────────────────
    // 35. SEARCH HOSPITALS / DOCTORS
    // ──────────────────────────────────────────
    if (
      /\b(?:search hospital|hospital dhundo|doctor dhundo|find hospital|find doctor|hospital search|doctor search|kaunsa hospital|which hospital|nearest hospital|paas ka hospital|aiims|apollo|fortis|medanta|max|manipal)\b/i.test(raw)
    ) {
      return { intent: 'searchHospital', confidence: 0.94, value: raw };
    }

    // ──────────────────────────────────────────
    // 36. NUMBER & OPTION SELECTION (Fast-Path)
    // ──────────────────────────────────────────
    const optionMatch = raw.match(/^option\s*(\d+)$/i);
    if (optionMatch) {
      return { intent: 'selectOption', confidence: 0.99, value: parseInt(optionMatch[1], 10) - 1 };
    }

    const numberWords = {
      '1': 0, 'one': 0, 'first': 0, 'ek': 0, 'pehla': 0, 'pahila': 0, 'pahelu': 0, 'ondraam': 0, 'modati': 0, 'prothom': 0, 'modalane': 0, 'onnamathu': 0,
      '2': 1, 'two': 1, 'second': 1, 'do': 1, 'doosra': 1, 'dusra': 1, 'biju': 1, 'irandaam': 1, 'rendava': 1, 'ditiyo': 1, 'eradu': 1, 'randamathu': 1,
      '3': 2, 'three': 2, 'third': 2, 'teen': 2, 'teesra': 2, 'tisra': 2, 'triju': 2, 'moondram': 2, 'moodava': 2, 'tritiyo': 2, 'mooru': 2, 'moonnamathu': 2,
      '4': 3, 'four': 3, 'fourth': 3, 'chaar': 3, 'chautha': 3, 'chauthu': 3, 'naangaam': 3, 'naalgava': 3, 'churtho': 3, 'naalku': 3, 'naalamathu': 3,
    };
    if (numberWords[raw] !== undefined) {
      return { intent: 'selectOption', confidence: 0.99, value: numberWords[raw] };
    }

    // ──────────────────────────────────────────
    // 37. ABHA CARD / DIGITAL HEALTH ID
    // ──────────────────────────────────────────
    if (
      /\b(?:abha card|health id|digital health card|ayushman card|abha dikhao|health card dikhao|mera abha)\b/i.test(raw)
    ) {
      return { intent: 'showAbhaCard', confidence: 0.95, value: null };
    }

    // ──────────────────────────────────────────
    // 38. VIEW PROFILE / MY PROFILE
    // ──────────────────────────────────────────
    if (
      /\b(?:mera profile|my profile|profile dikhao|personal details|meri jankari|account details|patient details)\b/i.test(raw) ||
      /^(profile|my profile|account|mera account|मेरा प्रोफाइल|என்னுடைய சுயவிவரம்|నా ప్రొఫైల్|আমার প্রোফাইল|ಮೊ ಪ್ರೊಫೈಲ್|എന്റെ പ്രൊഫൈൽ)$/i.test(raw)
    ) {
      return { intent: 'viewProfile', confidence: 0.96, value: null };
    }

    return null;
  }

  // Parse a transcript into an intent
  async parse(transcript, currentPage = null, context = {}) {
    const input = normalize(transcript);
    if (!input) return { intent: null, confidence: 0, raw: transcript };

    // On mixed navigation/form pages, resolve an explicit navigation command
    // first, but never let it hijack speech that actually contains patient data.
    if (context.expectsFreeText) {
      const containsPatientData = /\d{3,}|\b(?:my name|mera naam|naam|name|age|umar|phone|mobile|years|saal|male|female|purush|mahila|aadhaar|aadhar|abha)\b|(?:என் பெயர்|வயது|தொலைபேசி|ஆதார்|నా పేరు|వయస్సు|ఫోన్|ఆధార్|আমার নাম|বয়স|ফোন|আধার|माझे नाव|वय|फोन|आधार|મારું નામ|ઉંમર|ફોન|આધાર|ನನ್ನ ಹೆಸರು|ವಯಸ್ಸು|ಫೋನ್|ಆಧಾರ್|എന്റെ പേര്|വയസ്സ്|ഫോൺ|ആധാർ)/iu.test(input);
      const explicitNavigation = this._fastMatchIntent(input, { ...context, expectsFreeText: false });
      if (explicitNavigation && !containsPatientData) {
        return { ...explicitNavigation, raw: transcript };
      }
      if (containsPatientData) {
        return { intent: 'free_text', confidence: 1, raw: transcript, value: transcript };
      }
      return { intent: 'free_text', confidence: 1, raw: transcript, value: transcript };
    }

    // 1. FAST-PATH: Direct instant hotword match ONLY for pure short navigation commands (<= 2 words e.g. 'home', 'back', 'hindi')
    const wordsCount = input.trim().split(/\s+/).filter(Boolean).length;
    if (wordsCount <= 2) {
      const recognitionInputs = [input, ...(context.recognitionAlternatives || []).map(normalize)]
        .filter((value, index, all) => value && all.indexOf(value) === index);
      const fastCandidates = recognitionInputs
        .map(candidate => ({ candidate, result: this._fastMatchIntent(candidate, context) }))
        .filter(item => item.result);
      const fastIntents = new Set(fastCandidates.map(item => item.result.intent));

      // Instant match if unambiguous single control intent
      if (fastCandidates.length && fastIntents.size === 1) {
        return { ...fastCandidates[0].result, raw: transcript };
      }
    }

    // 2. AI SEMANTIC INTENT PARSER (Primary Engine for any natural phrasing across all 9 languages)
    try {
      const availableCommands = (currentPage && this.pageCommands[currentPage]) ? this.pageCommands[currentPage] : {};
      const globalCommands = this.pageCommands['__global__'] || {};
      
      const contextCommands = {};
      if (context.actions) {
        context.actions.forEach(a => { contextCommands[a.intent] = a.description; });
      }

      const semantic = await aiCommandEngine.parseIntent(
        transcript,
        { ...availableCommands, ...contextCommands },
        globalCommands,
        {
          page: currentPage || this.currentPage,
          language: this.currentLanguage,
          routes: this.routes,
          recognitionAlternatives: context.recognitionAlternatives || [],
          expectsFreeText: Boolean(context.expectsFreeText),
        }
      );
      
      if (semantic && semantic.intent && semantic.intent !== 'out_of_context') {
        return {
          ...semantic,
          raw: transcript,
          value: semantic.intent === 'free_text' ? transcript : semantic.value,
        };
      }
    } catch (error) {
      console.warn('AI intent parsing failed; evaluating offline fallback.', error);
    }

    // 3. Check number/option selection (Fuzzy Matching)
    const optionResult = this._matchOptionSelection(input);
    if (optionResult.confidence >= 0.8) {
      return { ...optionResult, raw: transcript };
    }

    // 4. Offline Multi-lingual Semantic Fallback
    const offlineSemantic = aiCommandEngine._multilingualFallbackIntent(transcript, {}, {}, { page: currentPage, language: this.currentLanguage, routes: this.routes });
    if (offlineSemantic) {
      return { ...offlineSemantic, raw: transcript };
    }

    // 5. Default free_text / unhandled
    return { intent: 'free_text', confidence: 0.5, raw: transcript, value: transcript };
  }

  _matchGlobalCommands(input) {
    let bestMatch = { intent: null, confidence: 0, value: null };

    Object.entries(VOICE_COMMANDS.global).forEach(([intent, langPhrases]) => {
      // Check ALL languages, not just current — user might switch mid-sentence
      Object.entries(langPhrases).forEach(([, phrases]) => {
        phrases.forEach(phrase => {
          const score = similarity(input, phrase);
          if (score > bestMatch.confidence) {
            bestMatch = { intent, confidence: score, value: null };
          }
        });
      });
    });

    return bestMatch;
  }

  _matchCommands(input, commands) {
    let bestMatch = { intent: null, confidence: 0, value: null };

    Object.entries(commands).forEach(([intent, triggers]) => {
      if (Array.isArray(triggers)) {
        triggers.forEach(trigger => {
          const score = similarity(input, trigger);
          if (score > bestMatch.confidence) {
            bestMatch = { intent, confidence: score, value: null };
          }
        });
      } else if (typeof triggers === 'object') {
        // Nested by language
        Object.values(triggers).forEach(phrases => {
          if (Array.isArray(phrases)) {
            phrases.forEach(phrase => {
              const score = similarity(input, phrase);
              if (score > bestMatch.confidence) {
                bestMatch = { intent, confidence: score, value: null };
              }
            });
          }
        });
      }
    });

    return bestMatch;
  }

  _matchOptionSelection(input) {
    const numberMap = {
      '1': 0, 'one': 0, 'first': 0, 'ek': 0, 'pehla': 0, 'pahila': 0, 'pahelu': 0,
      'ondraam': 0, 'modati': 0, 'prothom': 0, 'modalane': 0, 'onnamathu': 0,
      '2': 1, 'two': 1, 'second': 1, 'do': 1, 'doosra': 1, 'dusra': 1, 'biju': 1,
      'irandaam': 1, 'rendava': 1, 'ditiyo': 1, 'eradu': 1, 'randamathu': 1,
      '3': 2, 'three': 2, 'third': 2, 'teen': 2, 'teesra': 2, 'tisra': 2, 'triju': 2,
      'moondram': 2, 'moodava': 2, 'tritiyo': 2, 'mooru': 2, 'moonnamathu': 2,
      '4': 3, 'four': 3, 'fourth': 3, 'chaar': 3, 'chautha': 3, 'chauthu': 3,
      'naangaam': 3, 'naalgava': 3, 'churtho': 3, 'naalku': 3, 'naalamathu': 3,
    };

    // Try "option N" pattern
    const optionMatch = input.match(/option\s*(\d+)/i);
    if (optionMatch) {
      const num = parseInt(optionMatch[1]) - 1;
      return { intent: 'selectOption', confidence: 0.95, value: num };
    }

    // Try direct number/ordinal matching
    const words = input.split(/\s+/);
    for (const word of words) {
      if (numberMap[word] !== undefined) {
        return { intent: 'selectOption', confidence: 0.85, value: numberMap[word] };
      }
    }

    return { intent: null, confidence: 0, value: null };
  }

  // Check if transcript matches a specific language name (for language selection)
  matchLanguage(transcript) {
    const input = normalize(transcript);
    let bestMatch = { lang: null, confidence: 0 };

    Object.entries(VOICE_COMMANDS.languageSelect).forEach(([langCode, triggers]) => {
      triggers.forEach(trigger => {
        const score = similarity(input, trigger);
        if (score > bestMatch.confidence) {
          bestMatch = { lang: langCode, confidence: score };
        }
      });
    });

    return bestMatch.confidence >= this.confidenceThreshold ? bestMatch : { lang: null, confidence: 0 };
  }
}

// Singleton instance
const commandParser = new CommandParser();

export default commandParser;
export { CommandParser };
