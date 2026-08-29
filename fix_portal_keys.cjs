const fs = require('fs');
const filePath = 'src/voicenav/LanguagePack.js';
let content = fs.readFileSync(filePath, 'utf-8');

// Keys to inject per language (after loginAdmin key in each lang's UI_STRINGS block)
const portalKeys = {
  en: {
    enterPortal: 'Enter Portal',
    patientPortalDesc: 'Self-service kiosk for patients to provide their history in their native language before seeing the doctor.',
    doctorPortalDesc: 'Secure dashboard to review AI-generated clinical summaries and manage patient records efficiently.',
    adminPortalDesc: 'Centralized hub for managing patient registrations, system settings, and hospital staff accounts.',
    patientBadge: 'Patient',
    doctorBadge: 'Doctor',
    adminBadge: 'Admin',
  },
  hi: {
    enterPortal: 'पोर्टल में प्रवेश करें',
    patientPortal: 'मरीज़ पोर्टल',
    doctorPortal: 'डॉक्टर पोर्टल',
    adminPortal: 'एडमिन पोर्टल',
    patientPortalDesc: 'डॉक्टर से मिलने से पहले मरीज़ अपनी भाषा में चिकित्सा इतिहास दर्ज करें।',
    doctorPortalDesc: 'AI-जनित क्लिनिकल सारांश की समीक्षा करें और मरीज़ रिकॉर्ड प्रबंधित करें।',
    adminPortalDesc: 'मरीज़ पंजीकरण, सिस्टम सेटिंग्स और अस्पताल कर्मचारी खातों के प्रबंधन का केंद्र।',
    patientBadge: 'मरीज़',
    doctorBadge: 'डॉक्टर',
    adminBadge: 'एडमिन',
  },
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
    enterPortal: 'ಪೋರ್ಟಲ್‌ ಪ್ರವೇಶಿಸಿ',
    patientPortal: 'ರೋಗಿ ಪೋರ್ಟಲ್',
    doctorPortal: 'ವೈದ್ಯರ ಪೋರ್ಟಲ್',
    adminPortal: 'ಅಡ್ಮಿನ್ ಪೋರ್ಟಲ್',
    patientPortalDesc: 'ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡುವ ಮೊದಲು ರೋಗಿಗಳು ತಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಇತಿಹಾಸ ನೀಡಬಹುದು.',
    doctorPortalDesc: 'AI-ರಚಿತ ಸಾರಾಂಶಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ರೋಗಿ ದಾಖಲೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ.',
    adminPortalDesc: 'ರೋಗಿ ನೋಂದಣಿ, ಸಿಸ್ಟಮ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು ಮತ್ತು ಆಸ್ಪತ್ರೆ ಸಿಬ್ಬಂದಿ ಖಾತೆಗಳ ನಿರ್ವಹಣಾ ಕೇಂದ್ರ.',
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

// For each language, find its UI_STRINGS block and inject missing keys before closing
Object.entries(portalKeys).forEach(([lang, keys]) => {
  // Find the language block inside UI_STRINGS (after "const UI_STRINGS")
  const uiStringsIdx = content.indexOf('const UI_STRINGS = {');
  const langPattern = new RegExp(`(  ${lang}: \\{)([\\s\\S]*?)(  \\},)`, 'g');
  langPattern.lastIndex = uiStringsIdx;

  let match;
  let found = false;
  const fullContent = content.slice(uiStringsIdx);
  const localPattern = new RegExp(`(  ${lang}: \\{)([\\s\\S]*?)(  \\},)`, 'g');

  let result = fullContent.replace(localPattern, (m, open, body, close) => {
    if (found) return m; // only replace first match
    found = true;
    // Build new key lines for missing keys only
    let newKeys = '';
    Object.entries(keys).forEach(([k, v]) => {
      if (!body.includes(`${k}:`)) {
        newKeys += `\n    ${k}: '${v.replace(/'/g, "\\'")}',`;
      }
    });
    return open + body + newKeys + '\n' + close;
  });

  content = content.slice(0, uiStringsIdx) + result;
  console.log(`${lang}: injected keys`);
});

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Done!');
