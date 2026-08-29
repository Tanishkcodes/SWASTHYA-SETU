const fs = require('fs');
const filePath = 'src/voicenav/LanguagePack.js';
let content = fs.readFileSync(filePath, 'utf-8');

// New keys to add per language
const newKeys = {
  ta: {
    enterPortal: 'போர்ட்டலில் நுழையவும்',
    patientPortal: 'நோயாளி போர்ட்டல்',
    doctorPortal: 'மருத்துவர் போர்ட்டல்',
    adminPortal: 'நிர்வாக போர்ட்டல்',
    patientPortalDesc: 'மருத்துவரை சந்திப்பதற்கு முன்பு நோயாளிகள் தமிழில் தங்கள் வரலாற்றை வழங்கலாம்.',
    doctorPortalDesc: 'AI-உருவாக்கிய சுருக்கங்களை மதிப்பாய்வு செய்து நோயாளி பதிவுகளை நிர்வகிக்கவும்.',
    adminPortalDesc: 'நோயாளி பதிவு, அமைப்புகள் மற்றும் மருத்துவமனை ஊழியர் கணக்குகளை நிர்வகிக்கும் மையம்.',
    patientBadge: 'நோயாளி',
    doctorBadge: 'மருத்துவர்',
    adminBadge: 'நிர்வாகி',
  },
  te: {
    enterPortal: 'పోర్టల్‌లో ప్రవేశించండి',
    patientPortal: 'రోగి పోర్టల్',
    doctorPortal: 'డాక్టర్ పోర్టల్',
    adminPortal: 'అడ్మిన్ పోర్టల్',
    patientPortalDesc: 'వైద్యుడిని కలవడానికి ముందు రోగులు వారి భాషలో వైద్య చరిత్రను అందించవచ్చు.',
    doctorPortalDesc: 'AI-సృష్టించిన సారాంశాలను సమీక్షించి రోగి రికార్డులను సమర్థవంతంగా నిర్వహించండి.',
    adminPortalDesc: 'రోగి నమోదు, సిస్టమ్ సెట్టింగులు మరియు ఆసుపత్రి సిబ్బంది ఖాతాలను నిర్వహించే కేంద్రం.',
    patientBadge: 'రోగి',
    doctorBadge: 'డాక్టర్',
    adminBadge: 'అడ్మిన్',
  },
  bn: {
    enterPortal: 'পোর্টালে প্রবেশ করুন',
    patientPortal: 'রোগী পোর্টাল',
    doctorPortal: 'ডাক্তার পোর্টাল',
    adminPortal: 'অ্যাডমিন পোর্টাল',
    patientPortalDesc: 'ডাক্তারের সাথে দেখা করার আগে রোগীরা তাদের ভাষায় ইতিহাস প্রদান করতে পারে।',
    doctorPortalDesc: 'AI-তৈরি সারসংক্ষেপ পর্যালোচনা করুন এবং রোগীর রেকর্ড দক্ষতার সাথে পরিচালনা করুন।',
    adminPortalDesc: 'রোগী নিবন্ধন, সিস্টেম সেটিংস এবং হাসপাতাল কর্মী অ্যাকাউন্ট পরিচালনার কেন্দ্র।',
    patientBadge: 'রোগী',
    doctorBadge: 'ডাক্তার',
    adminBadge: 'অ্যাডমিন',
  },
  mr: {
    enterPortal: 'पोर्टलमध्ये प्रवेश करा',
    patientPortal: 'रुग्ण पोर्टल',
    doctorPortal: 'डॉक्टर पोर्टल',
    adminPortal: 'अ‍ॅडमिन पोर्टल',
    patientPortalDesc: 'डॉक्टरांना भेटण्यापूर्वी रुग्ण त्यांच्या भाषेत वैद्यकीय इतिहास देऊ शकतात.',
    doctorPortalDesc: 'AI-निर्मित सारांश पुनरावलोकन करा आणि रुग्ण रेकॉर्ड कार्यक्षमतेने व्यवस्थापित करा.',
    adminPortalDesc: 'रुग्ण नोंदणी, सिस्टम सेटिंग्ज आणि रुग्णालय कर्मचारी खाती व्यवस्थापित करण्याचे केंद्र.',
    patientBadge: 'रुग्ण',
    doctorBadge: 'डॉक्टर',
    adminBadge: 'अ‍ॅडमिन',
  },
  gu: {
    enterPortal: 'પોર્ટલમાં પ્રવેશ કરો',
    patientPortal: 'દર્દી પોર્ટલ',
    doctorPortal: 'ડૉક્ટર પોર્ટલ',
    adminPortal: 'એડમિન પોર્ટલ',
    patientPortalDesc: 'ડૉક્ટરને મળતા પહેલા દર્દીઓ તેમની ભાષામાં ઈતિહાસ આપી શકે છે.',
    doctorPortalDesc: 'AI-જનિત સારાંશ સમીક્ષા કરો અને દર્દી રેકૉર્ડ્સ કાર્યક્ષમ રીતે સંચાલિત કરો.',
    adminPortalDesc: 'દર્દી નોંધણી, સિસ્ટમ સેટિંગ્સ અને હૉસ્પિટલ સ્ટાફ ખાતાઓ સંચાલિત કરવાનું કેન્દ્ર.',
    patientBadge: 'દર્દી',
    doctorBadge: 'ડૉક્ટર',
    adminBadge: 'એડમિન',
  },
  kn: {
    enterPortal: 'ಪೋರ್ಟಲ್ ಪ್ರವೇಶಿಸಿ',
    patientPortal: 'ರೋಗಿ ಪೋರ್ಟಲ್',
    doctorPortal: 'ವೈದ್ಯರ ಪೋರ್ಟಲ್',
    adminPortal: 'ಅಡ್ಮಿನ್ ಪೋರ್ಟಲ್',
    patientPortalDesc: 'ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡುವ ಮೊದಲು ರೋಗಿಗಳು ತಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಇತಿಹಾಸ ನೀಡಬಹುದು.',
    doctorPortalDesc: 'AI-ರಚಿತ ಸಾರಾಂಶಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ರೋಗಿ ದಾಖಲೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ.',
    adminPortalDesc: 'ರೋಗಿ ನೋಂದಣಿ, ಸಿಸ್ಟಮ್ ಸೆಟ್ಟಿಂಗ್ಗಳು ಮತ್ತು ಆಸ್ಪತ್ರೆ ಸಿಬ್ಬಂದಿ ಖಾತೆಗಳ ನಿರ್ವಹಣಾ ಕೇಂದ್ರ.',
    patientBadge: 'ರೋಗಿ',
    doctorBadge: 'ವೈದ್ಯರು',
    adminBadge: 'ಅಡ್ಮಿನ್',
  },
  ml: {
    enterPortal: 'പോർട്ടലിൽ പ്രവേശിക്കുക',
    patientPortal: 'രോഗി പോർട്ടൽ',
    doctorPortal: 'ഡോക്ടർ പോർട്ടൽ',
    adminPortal: 'അഡ്മിൻ പോർട്ടൽ',
    patientPortalDesc: 'ഡോക്ടറെ കാണുന്നതിന് മുൻപ് രോഗികൾ അവരുടെ ഭാഷയിൽ ചരിത്രം നൽകാം.',
    doctorPortalDesc: 'AI-നിർമ്മിത സംഗ്രഹങ്ങൾ അവലോകനം ചെയ്ത് രോഗി രേഖകൾ കാര്യക്ഷമമായി നിർവഹിക്കുക.',
    adminPortalDesc: 'രോഗി രജിസ്ട്രേഷൻ, സിസ്റ്റം ക്രമീകരണങ്ങൾ, ആശുപത്രി ജീവനക്കാർ ഖാതകൾ നിർവഹിക്കുന്ന കേന്ദ്രം.',
    patientBadge: 'രോഗി',
    doctorBadge: 'ഡോക്ടർ',
    adminBadge: 'അഡ്മിൻ',
  },
};

// Find where each language block is in UI_STRINGS and append keys before its closing brace
const uiStrIdx = content.indexOf('const UI_STRINGS = {');

for (const [lang, keys] of Object.entries(newKeys)) {
  // Find the lang block inside UI_STRINGS section
  const searchFrom = uiStrIdx;
  const langOpen = `  ${lang}: {`;
  const langStart = content.indexOf(langOpen, searchFrom);
  
  if (langStart === -1) {
    console.log(`${lang}: block not found`);
    continue;
  }
  
  // Find the closing of this lang block: look for \n  }, after langStart
  // We'll look for the next top-level closing pattern
  let depth = 0;
  let i = langStart + langOpen.length;
  let closingPos = -1;
  
  while (i < content.length) {
    if (content[i] === '{') depth++;
    if (content[i] === '}') {
      if (depth === 0) {
        // This is the closing brace of our lang block
        closingPos = i;
        break;
      }
      depth--;
    }
    i++;
  }
  
  if (closingPos === -1) {
    console.log(`${lang}: closing brace not found`);
    continue;
  }
  
  // Build insertion string (only for missing keys)
  const blockContent = content.slice(langStart, closingPos);
  let insertion = '';
  for (const [k, v] of Object.entries(keys)) {
    if (!blockContent.includes(`${k}:`)) {
      insertion += `\n    ${k}: '${v.replace(/'/g, "\\'")}',`;
    }
  }
  
  if (insertion) {
    // Insert just before the closing brace
    content = content.slice(0, closingPos) + insertion + '\n  ' + content.slice(closingPos);
    console.log(`${lang}: inserted keys`);
  } else {
    console.log(`${lang}: all keys already present`);
  }
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Done!');
