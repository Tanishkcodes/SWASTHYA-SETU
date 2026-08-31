const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'src', 'pages', 'PatientDashboard.jsx');
let code = fs.readFileSync(targetFile, 'utf8');

const updatedLocalizationHelpers = `
function localizeDoctor(doc, lang = 'en') {
  if (!doc) return lang === 'hi' ? 'डॉक्टर' : 'Doctor';
  const clean = String(doc).trim();
  const target = lang || 'en';

  for (const [key, prof] of Object.entries(DOCTOR_PROFILES)) {
    if (prof.name) {
      if (clean.toLowerCase() === prof.name.toLowerCase() || clean.includes(prof.name)) {
        if (target === 'en') return prof.name;
        return aiTranslationService.translate(prof.name, target, 'doctor') || prof.name;
      }
    }
  }
  return aiTranslationService.translate(clean, target, 'doctor') || clean;
}

const SPECIALTY_MAP = {
  'general medicine': {
    en: 'General Medicine', hi: 'सामान्य चिकित्सा', mr: 'सामान्य औषधोपचार', gu: 'જનરલ મેડિસિન', ta: 'பொது மருத்துவம்', te: 'జనరల్ మెడిసిన్', kn: 'ಸಾಮಾನ್ಯ ವೈದ್ಯಕೀಯ', bn: 'জেনারেল মেডিসিন', ml: 'ജനറൽ മെഡിസിൻ'
  },
  'cardiology': {
    en: 'Cardiology', hi: 'हृदय रोग विभाग (कार्डियोलॉजी)', mr: 'हृदयरोगशास्त्र', gu: 'કાર્ડિયોલોજી', ta: 'இதயவியல்', te: 'కార్డియాలజీ', kn: 'ಹೃದ್ರೋಗ ಶಾಸ್ತ್ರ', bn: 'কার্ডিওলজি', ml: 'കാർഡിയോളജി'
  },
  'pulmonology': {
    en: 'Pulmonology', hi: 'श्वसन एवं फेफड़ा रोग', mr: 'श्वसनविकारशास्त्र', gu: 'પલ્મોનોલોજી', ta: 'சுவாசவியல்', te: 'పల్మోనాలజీ', kn: 'ಶ್ವಾಸಕೋಶ ಶಾಸ್ತ್ರ', bn: 'পালমোনোলজি', ml: 'പൾമണോളജി'
  },
  'ayurveda & panchakarma': {
    en: 'Ayurveda & Panchakarma', hi: 'आयुर्वेद एवं पंचकर्म', mr: 'आयुर्वेद आणि पंचकर्म', gu: 'આયુર્વેદ અને પંચકર્મ', ta: 'ஆயுர்வேதம் மற்றும் பஞ்சகர்மா', te: 'ఆయుర్వేదం & పంచకర్మ', kn: 'ಆಯುರ್ವೇದ ಮತ್ತು ಪಂಚಕರ್ಮ', bn: 'আয়ুর্বেদ ও পঞ্চকর্ম', ml: 'ആയുർവേദവും പഞ്ചകർമ്മയും'
  },
  'ayurveda': {
    en: 'Ayurveda', hi: 'आयुर्वेद', mr: 'आयुर्वेद', gu: 'આયુર્વેદ', ta: 'ஆயுர்வேதம்', te: 'ఆయుర్వేదం', kn: 'ಆಯುರ್ವೇದ', bn: 'আয়ুর্বেদ', ml: 'ആയുർവേദം'
  },
  'pediatrics': {
    en: 'Pediatrics', hi: 'बाल रोग विशेषज्ञ', mr: 'बालरोगशास्त्र', gu: 'બાળરોગ ચિકિત્સા', ta: 'குழந்தை மருத்துவம்', te: 'పీడియాట్రిక్స్', kn: 'ಮಕ್ಕಳ ವೈದ್ಯಶಾಸ್ತ್ರ', bn: 'শিশুচিকিৎসা', ml: 'പീഡിയാട്രിക്സ്'
  },
  'neurology': {
    en: 'Neurology', hi: 'न्यूरोलॉजी (तंत्रिका रोग)', mr: 'मज्जासंस्थेचा विकार', gu: 'ન્યુરોલોજી', ta: 'நரம்பியல்', te: 'న్యూరాలజీ', kn: 'ನರವಿಜ್ಞಾನ', bn: 'নিউরোলজি', ml: 'ന്യൂറോളജി'
  },
  'orthopedics': {
    en: 'Orthopedics', hi: 'अस्थि एवं जोड़ रोग (ऑर्थोपेडिक्स)', mr: 'अस्थिव्यंगोपचार', gu: 'ઓર્થોપેડિક્સ', ta: 'எலும்பியல்', te: 'ఆర్థోపెడిక్స్', kn: 'ಮೂಳೆ ರೋಗಶಾಸ್ತ್ರ', bn: 'অর্থোপেডিকস', ml: 'ഓർത്തോപീഡിക്സ്'
  }
};

function localizeSpecialty(spec, lang = 'en') {
  if (!spec) return lang === 'hi' ? 'सामान्य चिकित्सा' : 'General Medicine';
  const clean = String(spec).trim();
  const target = lang || 'en';

  for (const [key, data] of Object.entries(SPECIALTY_MAP)) {
    if (Object.values(data).some(val => val.toLowerCase() === clean.toLowerCase()) || clean.toLowerCase().includes(key)) {
      return data[target] || data.en || clean;
    }
  }
  return aiTranslationService.translate(clean, target, 'general') || clean;
}

function localizeHospitalName(hName, lang = 'en') {
  if (!hName) return '';
  const clean = String(hName).trim();
  const target = lang || 'en';

  // Search across HOSPITAL_LOCALIZATION for exact or partial matches
  for (const [key, data] of Object.entries(HOSPITAL_LOCALIZATION)) {
    if (!data?.name) continue;
    const names = Object.values(data.name);
    if (
      names.some(n => n.toLowerCase() === clean.toLowerCase()) ||
      (data.name.en && clean.toLowerCase().includes(data.name.en.toLowerCase())) ||
      (data.name.en && data.name.en.toLowerCase().includes(clean.toLowerCase())) ||
      (data.name.hi && clean.includes(data.name.hi)) ||
      (data.name.hi && data.name.hi.includes(clean))
    ) {
      return data.name[target] || data.name.en || clean;
    }
  }

  // Fallback
  if (target === 'en') {
    // If text is in Devanagari or other Indic script, transliterate/translate back to English
    if (/^[\\u0900-\\u0DFF]/.test(clean)) {
      return aiTranslationService.translate(clean, 'en', 'hospital') || clean;
    }
    return clean;
  }
  return aiTranslationService.translate(clean, target, 'hospital') || clean;
}

function localizeMonth(mon, lang = 'en') {
  if (!mon) return 'AUG';
  const key = String(mon).trim().toUpperCase();
  const target = lang || 'en';
  return MONTH_LOCALIZATION[key]?.[target] || MONTH_LOCALIZATION[key]?.en || mon;
}
`;

const startMarker = 'function localizeDoctor(doc, lang) {';
const endMarker = 'const DOCTOR_PROFILES = {';

const sIdx = code.indexOf(startMarker);
const eIdx = code.indexOf(endMarker);

if (sIdx !== -1 && eIdx !== -1) {
  code = code.slice(0, sIdx) + updatedLocalizationHelpers.trim() + '\n\n/* =========================================================================\n   COMPREHENSIVE DOCTOR PROFILES DATABASE (EXACT MATCH TO REFERENCE DESIGNS)\n   ========================================================================= */\n' + code.slice(eIdx);
  fs.writeFileSync(targetFile, code, 'utf8');
  console.log('Successfully updated localizeHospitalName, localizeDoctor, localizeSpecialty, localizeMonth in PatientDashboard.jsx');
} else {
  console.error('Could not locate markers in PatientDashboard.jsx');
}
