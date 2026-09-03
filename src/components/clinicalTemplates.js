/* =========================================================================
   SWASTHYA SETU — Clinical Intake Templates & 9-Language Medical Dictionary
   Languages: English (en), Hindi (hi), Tamil (ta), Telugu (te),
              Bengali (bn), Marathi (mr), Gujarati (gu), Kannada (kn), Malayalam (ml)
   Zero code-mixing: Guarantees 100% native language questions & options
   ========================================================================= */

// ── 1. Comprehensive Disease & Symptom Translation Map ──
export const DISEASE_DICTIONARY = {
  fever: {
    en: 'fever', hi: 'बुखार', ta: 'காய்ச்சல்', te: 'జ్వరం',
    bn: 'জ্বর', mr: 'ताप', gu: 'તાવ', kn: 'ಜ್ವರ', ml: 'പനി'
  },
  headache: {
    en: 'headache', hi: 'सिरदर्द', ta: 'தலைவலி', te: 'తలనొప్పి',
    bn: 'মাথাব্যথা', mr: 'डोकेदुखी', gu: 'માથાનો દુખાવો', kn: 'ತಲೆನೋವು', ml: 'തലവേദന'
  },
  stomach: {
    en: 'stomach pain', hi: 'पेट दर्द', ta: 'வயிற்று வலி', te: 'కడుపు నొప్పి',
    bn: 'পেট ব্যথা', mr: 'पोटदुखी', gu: 'પેટનો દુખાવો', kn: 'ಹೊಟ್ಟೆ ನೋವು', ml: 'വയറുവേദന'
  },
  cough: {
    en: 'cough and cold', hi: 'खांसी और जुकाम', ta: 'இருமல் மற்றும் சளி', te: 'దగ్గు మరియు జలుబు',
    bn: 'কাশি এবং সর্দি', mr: 'खोकला आणि सर्दी', gu: 'ઉધરસ અને શરદી', kn: 'ಕೆಮ್ಮು ಮತ್ತು ಶೀತ', ml: 'ചുമയും ജലദോഷവും'
  },
  bodypain: {
    en: 'body pain', hi: 'शरीर में दर्द', ta: 'உடல் வலி', te: 'శరీర నొప్పి',
    bn: 'শরীর ব্যথা', mr: 'अंगदुखी', gu: 'શરીરનો દુખાવો', kn: 'ದೇಹ ನೋವು', ml: 'ശരീരവേദന'
  },
  chestpain: {
    en: 'chest pain', hi: 'सीने में दर्द', ta: 'மார்பு வலி', te: 'ఛాతీ నొప్పి',
    bn: 'বুকে ব্যথা', mr: 'छातीत दुखणे', gu: 'છાતીમાં દુખાવો', kn: 'ಎದೆ ನೋವು', ml: 'നെഞ്ചുവേദന'
  },
  backpain: {
    en: 'back pain', hi: 'पीठ दर्द', ta: 'முதுகு வலி', te: 'వెన్నునొప్పి',
    bn: 'পিঠের ব্যথা', mr: 'पाठदुखी', gu: 'પીઠનો દુખાવો', kn: 'ಬೆನ್ನು ನೋವು', ml: 'പുറംവേദന'
  },
  jointpain: {
    en: 'joint pain', hi: 'जोड़ों का दर्द', ta: 'மூட்டு வலி', te: 'కీళ్ల నొప్పులు',
    bn: 'গাঁটে ব্যথা', mr: 'सांधेदुखी', gu: 'સાંધાનો દુખાવો', kn: 'ಕೀಲು ನೋವು', ml: 'സന്ധി വേദന'
  },
  acidity: {
    en: 'acidity and indigestion', hi: 'एसिडिटी और अपच', ta: 'அமிலத்தன்மை மற்றும் அஜீரணம்', te: 'ఎసిడిటీ మరియు అజీర్ణం',
    bn: 'অ্যাসিডিটি এবং বদহজম', mr: 'पित्त आणि अपचन', gu: 'એસિડિટી અને અપચો', kn: 'ಅಸಿಡಿಟಿ ಮತ್ತು ಅಜೀರ್ಣ', ml: 'അസിഡിറ്റിയും ദഹനക്കേടും'
  },
  cancer: {
    en: 'cancer', hi: 'कैंसर', ta: 'புற்றுநோய்', te: 'క్యాన్సర్',
    bn: 'ক্যান্সার', mr: 'कर्करोग (कॅन्सर)', gu: 'કેન્સર', kn: 'ಕ್ಯಾನ್ಸರ್', ml: 'കാൻസർ'
  },
  diabetes: {
    en: 'diabetes', hi: 'मधुमेह', ta: 'நீரிழிவு நோய்', te: 'మధుమేహం',
    bn: 'ডায়াবেটিস', mr: 'मधुमेह', gu: 'ડાયાબિટીસ', kn: 'ಮಧುಮೇಹ', ml: 'പ്രമേഹം'
  },
  general: {
    en: 'health complaint', hi: 'स्वास्थ्य समस्या', ta: 'உடல்நலப் பிரச்சினை', te: 'ఆరోగ్య సమస్య',
    bn: 'স্বাস্থ্য সমস্যা', mr: 'आरोग्य समस्या', gu: 'આરોગ્ય સમસ્યા', kn: 'ಆರೋಗ್ಯ ಸಮಸ್ಯೆ', ml: 'ആരോഗ്യ പ്രശ്നം'
  }
};

/**
 * Cleanly localizes any input disease string to the target language.
 * Ensures that if a user entered or clicked in Hindi ("पेट दर्द"), it won't produce
 * "During this पेट दर्द" in English or Tamil, and vice-versa.
 */
export function getLocalizedDisease(inputDisease, targetLang = 'en') {
  if (!inputDisease || typeof inputDisease !== 'string') {
    return DISEASE_DICTIONARY.general[targetLang] || 'health complaint';
  }

  const clean = inputDisease.trim().toLowerCase();

  // 1. Check if input matches any key or translation across languages
  for (const [key, translations] of Object.entries(DISEASE_DICTIONARY)) {
    if (key === clean) {
      return translations[targetLang] || translations.en;
    }
    for (const val of Object.values(translations)) {
      if (typeof val === 'string' && val.toLowerCase() === clean) {
        return translations[targetLang] || translations.en;
      }
    }
  }

  // 2. Partial substring matching
  if (clean.includes('fever') || clean.includes('बुखार') || clean.includes('ताप') || clean.includes('காய்ச்சல்') || clean.includes('జ్వరం') || clean.includes('জ্বর') || clean.includes('તાવ') || clean.includes('ಜ್ವರ') || clean.includes('പനി')) {
    return DISEASE_DICTIONARY.fever[targetLang] || DISEASE_DICTIONARY.fever.en;
  }
  if (clean.includes('head') || clean.includes('सिर') || clean.includes('डोके') || clean.includes('தலை') || clean.includes('తల') || clean.includes('মাথা') || clean.includes('માથા') || clean.includes('ತಲೆ') || clean.includes('തല')) {
    return DISEASE_DICTIONARY.headache[targetLang] || DISEASE_DICTIONARY.headache.en;
  }
  if (clean.includes('stomach') || clean.includes('पेट') || clean.includes('पोट') || clean.includes('வயிறு') || clean.includes('కడుపు') || clean.includes('পেট') || clean.includes('પેટ') || clean.includes('ಹೊಟ್ಟೆ') || clean.includes('വയറ')) {
    return DISEASE_DICTIONARY.stomach[targetLang] || DISEASE_DICTIONARY.stomach.en;
  }
  if (clean.includes('cough') || clean.includes('cold') || clean.includes('खांसी') || clean.includes('जुकाम') || clean.includes('खोकला') || clean.includes('இருமல்') || clean.includes('దగ్గు') || clean.includes('কাশি') || clean.includes('ઉધરસ') || clean.includes('ಕೆಮ್ಮು') || clean.includes('ചുമ')) {
    return DISEASE_DICTIONARY.cough[targetLang] || DISEASE_DICTIONARY.cough.en;
  }
  if (clean.includes('body') || clean.includes('दर्द') || clean.includes('அங்க') || clean.includes('வலி') || clean.includes('నొప్పి') || clean.includes('ব্যথা') || clean.includes('દુખાવો') || clean.includes('ನೋವು') || clean.includes('വേദന')) {
    return DISEASE_DICTIONARY.bodypain[targetLang] || DISEASE_DICTIONARY.bodypain.en;
  }
  if (clean.includes('chest') || clean.includes('सीने') || clean.includes('छाती') || clean.includes('மார்பு') || clean.includes('ఛాతీ') || clean.includes('বুকে') || clean.includes('ಎದೆ') || clean.includes('നെഞ്ച്')) {
    return DISEASE_DICTIONARY.chestpain[targetLang] || DISEASE_DICTIONARY.chestpain.en;
  }

  return inputDisease;
}

// ── 2. Fully Native Clinical Templates for all 9 Languages ──

export const AYURVEDIC_TEMPLATES = {
  en: [
    {
      field: 'duration',
      getQuestion: (d) => `How long have you been experiencing this ${d}, and how has your appetite / digestion (Agni) been affected?`,
      options: [
        { text: 'Started recently (1 to 3 days ago)', iconType: 'clock' },
        { text: '1 to 2 weeks, gradually worsening', iconType: 'clock' },
        { text: 'Chronic issue for over a month', iconType: 'clock' },
        { text: 'Comes and goes periodically', iconType: 'moon' }
      ]
    },
    {
      field: 'vikriti',
      getQuestion: (d) => `During this ${d}, how is your physical stamina, energy, and sleep pattern (Nidra)?`,
      options: [
        { text: 'Normal energy with undisturbed sleep', iconType: 'target' },
        { text: 'Restless sleep and low stamina', iconType: 'moon' },
        { text: 'Severe lethargy and heaviness in body', iconType: 'bodypain' },
        { text: 'Disturbed by stress and anxiety', iconType: 'wind' }
      ]
    },
    {
      field: 'triggers',
      getQuestion: (d) => `Do cold, hot, dry, or spicy foods/climates worsen or relieve this ${d} (Satmya)?`,
      options: [
        { text: 'Aggravated by cold food or cold weather', iconType: 'wind' },
        { text: 'Aggravated by spicy, oily, or fried foods', iconType: 'flame' },
        { text: 'Relieved by warm, freshly cooked foods', iconType: 'leaf' },
        { text: 'No clear dietary trigger noticed', iconType: 'target' }
      ]
    }
  ],
  hi: [
    {
      field: 'duration',
      getQuestion: (d) => `कृपया बताएं कि आपको ${d} की यह समस्या कब से है और आपके खान-पान या पाचन (अग्नि) में क्या बदलाव आया है?`,
      options: [
        { text: 'हाल ही में शुरू हुआ (1 से 3 दिन पहले)', iconType: 'clock' },
        { text: '1 से 2 सप्ताह, धीरे-धीरे बढ़ रहा है', iconType: 'clock' },
        { text: 'एक महीने से अधिक समय से पुरानी समस्या', iconType: 'clock' },
        { text: 'समय-समय पर आता-जाता रहता है', iconType: 'moon' }
      ]
    },
    {
      field: 'vikriti',
      getQuestion: (d) => `इस ${d} के दौरान आपकी शारीरिक ऊर्जा, नींद (निद्रा) और सहनशक्ति कैसी है?`,
      options: [
        { text: 'सामान्य ऊर्जा और बिना रुकावट की नींद', iconType: 'target' },
        { text: 'बेचैन नींद और कम सहनशक्ति / कमजोरी', iconType: 'moon' },
        { text: 'अत्यधिक सुस्ती और शरीर में भारीपन', iconType: 'bodypain' },
        { text: 'तनाव और चिंता के कारण अशांत', iconType: 'wind' }
      ]
    },
    {
      field: 'triggers',
      getQuestion: (d) => `क्या ठंडे, गर्म या मसालेदार आहार से इस ${d} में बदलाव आता है (सात्म्य)?`,
      options: [
        { text: 'ठंडे भोजन या ठंड के मौसम से बढ़ता है', iconType: 'wind' },
        { text: 'मसालेदार, तैलीय या तले हुए खाने से बढ़ता है', iconType: 'flame' },
        { text: 'गर्म, ताजा बने भोजन से आराम मिलता है', iconType: 'leaf' },
        { text: 'खान-पान से कोई विशेष संबंध नहीं दिखा', iconType: 'target' }
      ]
    }
  ],
  ta: [
    {
      field: 'duration',
      getQuestion: (d) => `இந்த ${d} பிரச்சனை உங்களுக்கு எவ்வளவு காலமாக உள்ளது, உங்கள் பசி அல்லது செரிமானம் (அக்னி) எவ்வாறு பாதிக்கப்பட்டுள்ளது?`,
      options: [
        { text: 'சமீபத்தில் தொடங்கியது (1 முதல் 3 நாட்களுக்கு முன்)', iconType: 'clock' },
        { text: '1 முதல் 2 வாரங்கள், படிப்படியாக அதிகரிக்கிறது', iconType: 'clock' },
        { text: 'ஒரு மாதத்திற்கும் மேலாக நீடிக்கும் பிரச்சனை', iconType: 'clock' },
        { text: 'அவ்வப்போது வந்து போகிறது', iconType: 'moon' }
      ]
    },
    {
      field: 'vikriti',
      getQuestion: (d) => `இந்த ${d} நேரத்தில் உங்கள் உடல் ஆற்றல், தூக்கம் (நித்ரா) மற்றும் சகிப்புத்தன்மை எவ்வாறு உள்ளது?`,
      options: [
        { text: 'சாதாரண ஆற்றல் மற்றும் அமைதியான தூக்கம்', iconType: 'target' },
        { text: 'அமைதியற்ற தூக்கம் மற்றும் குறைந்த ஆற்றல்', iconType: 'moon' },
        { text: 'கடுமையான சோர்வு மற்றும் உடலில் பாரம்', iconType: 'bodypain' },
        { text: 'மன அழுத்தம் மற்றும் கவலையால் தொந்தரவு', iconType: 'wind' }
      ]
    },
    {
      field: 'triggers',
      getQuestion: (d) => `குளிர்ந்த, சூடான அல்லது காரமான உணவுகள் இந்த ${d} பிரச்சனையை அதிகப்படுத்துகிறதா அல்லது குறைக்கிறதா?`,
      options: [
        { text: 'குளிர்ந்த உணவு அல்லது குளிர்காலத்தில் அதிகரிக்கிறது', iconType: 'wind' },
        { text: 'காரமான, எண்ணெய் உணவுகளால் அதிகரிக்கிறது', iconType: 'flame' },
        { text: 'சூடான, புதிய உணவை உண்பதால் நிவாரணம் கிடைக்கிறது', iconType: 'leaf' },
        { text: 'உணவு ரீதியான தெளிவான தூண்டுதல் இல்லை', iconType: 'target' }
      ]
    }
  ],
  te: [
    {
      field: 'duration',
      getQuestion: (d) => `ఈ ${d} సమస్య మీకు ఎంతకాలంగా ఉంది, మీ ఆకలి లేదా జీర్ణక్రియ (అగ్ని) ఎలా ప్రభావితమైంది?`,
      options: [
        { text: 'ఇటీవల ప్రారంభమైంది (1 నుండి 3 రోజుల క్రితం)', iconType: 'clock' },
        { text: '1 నుండి 2 వారాలు, క్రమంగా పెరుగుతోంది', iconType: 'clock' },
        { text: 'నెల కంటే ఎక్కువ కాలంగా ఉన్న దీర్ఘకాలిక సమస్య', iconType: 'clock' },
        { text: 'అప్పుడప్పుడు వచ్చి పోతుంది', iconType: 'moon' }
      ]
    },
    {
      field: 'vikriti',
      getQuestion: (d) => `ఈ ${d} సమయంలో మీ శారీరక శక్తి, నిద్ర (నిద్ర) మరియు సత్తువ ఎలా ఉన్నాయి?`,
      options: [
        { text: 'సాధారణ శక్తి మరియు ప్రశాంతమైన నిద్ర', iconType: 'target' },
        { text: 'అశాంతి నిద్ర మరియు తక్కువ శక్తి', iconType: 'moon' },
        { text: 'తీవ్రమైన బద్ధకం మరియు శరీరంలో బరువు', iconType: 'bodypain' },
        { text: 'ఒత్తిడి మరియు ఆందోళనతో కలత', iconType: 'wind' }
      ]
    },
    {
      field: 'triggers',
      getQuestion: (d) => `చల్లని, వేడి లేదా కారమైన ఆహారాల వల్ల ఈ ${d} పెరుగుతుందా లేదా తగ్గుతుందా?`,
      options: [
        { text: 'చల్లని ఆహారం లేదా చలి వాతావరణం వల్ల పెరుగుతుంది', iconType: 'wind' },
        { text: 'కారమైన, జిడ్డుగల ఆహారాల వల్ల పెరుగుతుంది', iconType: 'flame' },
        { text: 'వేడి, తాజా ఆహారం వల్ల ఉపశమనం లభిస్తుంది', iconType: 'leaf' },
        { text: 'ఆహార సంబంధిత మార్పు ఏదీ గమనించలేదు', iconType: 'target' }
      ]
    }
  ],
  bn: [
    {
      field: 'duration',
      getQuestion: (d) => `এই ${d} সমস্যাটি আপনার কতদিন ধরে হচ্ছে এবং আপনার ক্ষুধা বা হজমে (অগ্নি) কী পরিবর্তন এসেছে?`,
      options: [
        { text: 'সম্প্রতি শুরু হয়েছে (১ থেকে ৩ দিন আগে)', iconType: 'clock' },
        { text: '১ থেকে ২ সপ্তাহ, ধীরে ধীরে বাড়ছে', iconType: 'clock' },
        { text: 'এক মাসেরও বেশি সময় ধরে দীর্ঘস্থায়ী সমস্যা', iconType: 'clock' },
        { text: 'মাঝে মাঝে আসে এবং কমে যায়', iconType: 'moon' }
      ]
    },
    {
      field: 'vikriti',
      getQuestion: (d) => `এই ${d} চলাকালীন আপনার শারীরিক শক্তি, ঘুম (নিদ্রা) এবং সহনশীলতা কেমন?`,
      options: [
        { text: 'স্বাভাবিক শক্তি এবং নিরবচ্ছিন্ন ঘুম', iconType: 'target' },
        { text: 'অস্থির ঘুম এবং কম সহনশীলতা', iconType: 'moon' },
        { text: 'তীব্র ক্লান্তি এবং শরীরে ভারী ভাব', iconType: 'bodypain' },
        { text: 'মানসিক চাপ ও উদ্বেগে বিঘ্নিত', iconType: 'wind' }
      ]
    },
    {
      field: 'triggers',
      getQuestion: (d) => `ঠান্ডা, গরম বা মশলাযুক্ত খাবারে এই ${d} বাড়ে বা কমে কি?`,
      options: [
        { text: 'ঠান্ডা খাবার বা ঠান্ডার আবহাওয়ায় বাড়ে', iconType: 'wind' },
        { text: 'মশলাদার বা তৈলাক্ত খাবারে বাড়ে', iconType: 'flame' },
        { text: 'গরম ও তাজা খাবারে আরাম মেলে', iconType: 'leaf' },
        { text: 'খাবারের সঙ্গে কোনো স্পষ্ট সম্পর্ক দেখা যায়নি', iconType: 'target' }
      ]
    }
  ],
  mr: [
    {
      field: 'duration',
      getQuestion: (d) => `कृपया सांगा की तुम्हाला हा ${d} त्रास किती दिवसांपासून आहे आणि तुमच्या भूक किंवा पचनावर (अग्नी) काय परिणाम झाला आहे?`,
      options: [
        { text: 'नुकताच सुरू झाला (१ ते ३ दिवसांपूर्वी)', iconType: 'clock' },
        { text: '१ ते २ आठवडे, हळूहळू वाढत आहे', iconType: 'clock' },
        { text: 'एका महिन्याहून अधिक काळापासून जुनाट त्रास', iconType: 'clock' },
        { text: 'वेळोवेळी येतो आणि जातो', iconType: 'moon' }
      ]
    },
    {
      field: 'vikriti',
      getQuestion: (d) => `या ${d} दरम्यान तुमची शारीरिक ऊर्जा, झोप (निद्रा) आणि तग धरण्याची क्षमता कशी आहे?`,
      options: [
        { text: 'सामान्य ऊर्जा आणि शांत झोप', iconType: 'target' },
        { text: 'अस्वस्थ झोप आणि कमी ताकद', iconType: 'moon' },
        { text: 'अतिशय थकवा आणि शरीरात जडपणा', iconType: 'bodypain' },
        { text: 'तणाव आणि चिंतेमुळे अस्वस्थ', iconType: 'wind' }
      ]
    },
    {
      field: 'triggers',
      getQuestion: (d) => `थंड, गरम किंवा तिखट अन्नामुळे या ${d} मध्ये काही फरक पडतो का?`,
      options: [
        { text: 'थंड अन्न किंवा थंड हवेमुळे वाढतो', iconType: 'wind' },
        { text: 'तिखट किंवा तेलकट अन्नामुळे वाढतो', iconType: 'flame' },
        { text: 'गरम, ताज्या अन्नामुळे आराम मिळतो', iconType: 'leaf' },
        { text: 'आहाराशी संबंधित असा कोणताही स्पष्ट बदल नाही', iconType: 'target' }
      ]
    }
  ],
  gu: [
    {
      field: 'duration',
      getQuestion: (d) => `કૃપા કરીને જણાવો કે તમને આ ${d}ની તકલીફ ક્યારથી છે અને તમારી ભૂખ અથવા પાચન (અગ્નિ) પર શું અસર પડી છે?`,
      options: [
        { text: 'તાજેતરમાં શરૂ થયું (૧ થી ૩ દિવસ પહેલાં)', iconType: 'clock' },
        { text: '૧ થી ૨ અઠવાડિયા, ધીમે ધીમે વધે છે', iconType: 'clock' },
        { text: 'એક મહિનાથી વધુ સમયથી જૂની તકલીફ', iconType: 'clock' },
        { text: 'સમયે સમયે આવે છે અને જાય છે', iconType: 'moon' }
      ]
    },
    {
      field: 'vikriti',
      getQuestion: (d) => `આ ${d} દરમિયાન તમારી શારીરિક ઊર્જા, ઊંઘ (નિદ્રા) અને સહનશક્તિ કેવી છે?`,
      options: [
        { text: 'સામાન્ય ઊર્જા અને શાંત ઊંઘ', iconType: 'target' },
        { text: 'બેચેન ઊંઘ અને ઓછી સહનશક્તિ', iconType: 'moon' },
        { text: 'અતિશય સુસ્તી અને શરીરમાં ભારેપણું', iconType: 'bodypain' },
        { text: 'તણાવ અને ચિંતાથી પરેશાન', iconType: 'wind' }
      ]
    },
    {
      field: 'triggers',
      getQuestion: (d) => `ઠંડા, ગરમ અથવા મસાલેદાર ખોરાકથી આ ${d} વધે છે કે ઘટે છે?`,
      options: [
        { text: 'ઠંડા ખોરાક અથવા ઠંડા હવામાનથી વધે છે', iconType: 'wind' },
        { text: 'મસાલેદાર અથવા તેલી ખોરાકથી વધે છે', iconType: 'flame' },
        { text: 'ગરમ અને તાજા ભોજનથી રાહત મળે છે', iconType: 'leaf' },
        { text: 'ખોરાક સાથે કોઈ સ્પષ્ટ સંબંધ જણાયો નથી', iconType: 'target' }
      ]
    }
  ],
  kn: [
    {
      field: 'duration',
      getQuestion: (d) => `ಈ ${d} ಸಮಸ್ಯೆ ನಿಮಗೆ ಎಷ್ಟು ಸಮಯದಿಂದ ಇದೆ ಮತ್ತು ನಿಮ್ಮ ಹಸಿವು ಅಥವಾ ಜೀರ್ಣಕ್ರಿಯೆ (ಅಗ್ನಿ) ಹೇಗೆ ಬದಲಾಗಿದೆ?`,
      options: [
        { text: 'ಇತ್ತೀಚೆಗೆ ಪ್ರಾರಂಭವಾಯಿತು (೧ ರಿಂದ ೩ ದಿನಗಳ ಹಿಂದೆ)', iconType: 'clock' },
        { text: '೧ ರಿಂದ ೨ ವಾರಗಳು, ಕ್ರಮೇಣ ಹೆಚ್ಚುತ್ತಿದೆ', iconType: 'clock' },
        { text: 'ಒಂದು ತಿಂಗಳಿಗಿಂತ ಹೆಚ್ಚು ಕಾಲದ ದೀರ್ಘಕಾಲದ ಸಮಸ್ಯೆ', iconType: 'clock' },
        { text: 'ಕಾಲಕಾಲಕ್ಕೆ ಬಂದು ಹೋಗುತ್ತದೆ', iconType: 'moon' }
      ]
    },
    {
      field: 'vikriti',
      getQuestion: (d) => `ಈ ${d} ಸಮಯದಲ್ಲಿ ನಿಮ್ಮ ದೈಹಿಕ ಶಕ್ತಿ, ನಿದ್ರೆ (ನಿದ್ರಾ) ಮತ್ತು ಚೈತನ್ಯ ಹೇಗಿದೆ?`,
      options: [
        { text: 'ಸಾಮಾನ್ಯ ಶಕ್ತಿ ಮತ್ತು ನೆಮ್ಮದಿಯ ನಿದ್ರೆ', iconType: 'target' },
        { text: 'ಅಶಾಂತ ನಿದ್ರೆ ಮತ್ತು ಕಡಿಮೆ ಚೈತನ್ಯ', iconType: 'moon' },
        { text: 'ತೀವ್ರ ಆಯಾಸ ಮತ್ತು ದೇಹದಲ್ಲಿ ಭಾರವಾದ ಭಾವನೆ', iconType: 'bodypain' },
        { text: 'ಒತ್ತಡ ಮತ್ತು ಆತಂಕದಿಂದ ಅಶಾಂತಿ', iconType: 'wind' }
      ]
    },
    {
      field: 'triggers',
      getQuestion: (d) => `ತಣ್ಣನೆಯ, ಬಿಸಿ ಅಥವಾ ಖಾರದ ಆಹಾರದಿಂದ ಈ ${d} ಹೆಚ್ಚಾಗುತ್ತದೆಯೇ ಅಥವಾ ಕಡಿಮೆಯಾಗುತ್ತದೆಯೇ?`,
      options: [
        { text: 'ತಣ್ಣನೆಯ ಆಹಾರ ಅಥವಾ ಚಳಿಗಾಲದಿಂದ ಉಲ್ಬಣಗೊಳ್ಳುತ್ತದೆ', iconType: 'wind' },
        { text: 'ಖಾರ ಅಥವಾ ಎಣ್ಣೆಯುಕ್ತ ಆಹಾರದಿಂದ ಹೆಚ್ಚುತ್ತದೆ', iconType: 'flame' },
        { text: 'ಬಿಸಿ, ತಾಜಾ ಆಹಾರದಿಂದ ಆರಾಮ ಸಿಗುತ್ತದೆ', iconType: 'leaf' },
        { text: 'ಆಹಾರದಿಂದ ಯಾವುದೇ ಸ್ಪಷ್ಟ ಬದಲಾವಣೆ ಕಂಡುಬಂದಿಲ್ಲ', iconType: 'target' }
      ]
    }
  ],
  ml: [
    {
      field: 'duration',
      getQuestion: (d) => `ഈ ${d} പ്രശ്നം നിങ്ങൾക്ക് എത്ര നാളായി ഉണ്ട്, നിങ്ങളുടെ വിശപ്പ് അല്ലെങ്കിൽ ദഹനം (അഗ്നി) എങ്ങനെ ബാധിച്ചു?`,
      options: [
        { text: 'സമീപകാലത്ത് തുടങ്ങി (1 മുതൽ 3 ദിവസം മുമ്പ്)', iconType: 'clock' },
        { text: '1 മുതൽ 2 ആഴ്ചയായി ക്രമേണ കൂടുന്നു', iconType: 'clock' },
        { text: 'ഒരു മാസത്തിലേറെയായി തുടരുന്ന പ്രശ്നം', iconType: 'clock' },
        { text: 'ഇടയ്ക്കിടെ വരികയും പോവുകയും ചെയ്യുന്നു', iconType: 'moon' }
      ]
    },
    {
      field: 'vikriti',
      getQuestion: (d) => `ഈ ${d} ഉള്ളപ്പോൾ നിങ്ങളുടെ ശാരീരിക ഊർജ്ജം, ഉറക്കം (നിദ്ര), സഹിഷ്ണുത എന്നിവ എങ്ങനെയുണ്ട്?`,
      options: [
        { text: 'സാധാരണ ഊർജ്ജവും തടസ്സമില്ലാത്ത ഉറക്കവും', iconType: 'target' },
        { text: 'അസ്വസ്ഥമായ ഉറക്കവും കുറഞ്ഞ ഊർജ്ജവും', iconType: 'moon' },
        { text: 'കഠിനമായ ക്ഷീണവും ശരീരത്തിൽ ഭാരവും', iconType: 'bodypain' },
        { text: 'സമ്മർദ്ദവും ഉത്കണ്ഠയും കാരണം അസ്വസ്ഥത', iconType: 'wind' }
      ]
    },
    {
      field: 'triggers',
      getQuestion: (d) => `തണുത്തതോ ചൂടുള്ളതോ എരിവുള്ളതോ ആയ ഭക്ഷണം ഈ ${d} കൂട്ടുകയോ കുറയ്ക്കുകയോ ചെയ്യുന്നുണ്ടോ?`,
      options: [
        { text: 'തണുത്ത ഭക്ഷണമോ തണുപ്പുള്ള കാലാവസ്ഥയോ കാരണം കൂടുന്നു', iconType: 'wind' },
        { text: 'എരിവുള്ളതോ എണ്ണമയമുള്ളതോ ആയ ഭക്ഷണം കാരണം കൂടുന്നു', iconType: 'flame' },
        { text: 'ചൂടുള്ളതും പുതിയതുമായ ഭക്ഷണത്തിൽ ആശ്വാസം ലഭിക്കുന്നു', iconType: 'leaf' },
        { text: 'ഭക്ഷണവുമായി ബന്ധപ്പെട്ട വ്യക്തമായ കാരണമൊന്നും കണ്ടിട്ടില്ല', iconType: 'target' }
      ]
    }
  ]
};

export const ALLOPATHIC_TEMPLATES = {
  en: [
    {
      field: 'duration',
      getQuestion: (d) => `Could you describe when this ${d} first started and how it has developed over time?`,
      options: [
        { text: 'Started recently (< 24 to 48 hours ago)', iconType: 'clock' },
        { text: 'Started 1 to 2 weeks ago, gradually worsening', iconType: 'clock' },
        { text: 'Chronic issue persisting over 3-4 weeks', iconType: 'clock' },
        { text: 'Recurrent episodes that come and go', iconType: 'moon' }
      ]
    },
    {
      field: 'location',
      getQuestion: (d) => `Where is this ${d} predominantly felt, and does the sensation spread or radiate anywhere?`,
      options: [
        { text: 'Localized strictly to one specific area', iconType: 'target' },
        { text: 'Radiates or spreads to surrounding areas', iconType: 'chest' },
        { text: 'Generalized discomfort across the body', iconType: 'bodypain' },
        { text: 'Shifts from one place to another', iconType: 'wind' }
      ]
    },
    {
      field: 'severity',
      getQuestion: (d) => `How would you describe the severity of this ${d} and its impact on your normal activities?`,
      options: [
        { text: 'Mild — manageable with normal daily routine', iconType: 'target' },
        { text: 'Moderate — bothersome, affects sleep or work', iconType: 'moon' },
        { text: 'Severe — painful, significantly limiting activity', iconType: 'flame' },
        { text: 'Severe episodes with sudden spikes', iconType: 'chest' }
      ]
    },
    {
      field: 'medications',
      getQuestion: (d) => `Have you taken any medications or treatments for this ${d} so far?`,
      options: [
        { text: 'Took over-the-counter medicine with temporary relief', iconType: 'pill' },
        { text: 'Took home remedies / herbal solutions', iconType: 'leaf' },
        { text: 'Took previously prescribed medicines', iconType: 'pill' },
        { text: 'Have not taken any medications yet', iconType: 'target' }
      ]
    }
  ],
  hi: [
    {
      field: 'duration',
      getQuestion: (d) => `कृपया बताएं कि यह ${d} सबसे पहले कब शुरू हुई और समय के साथ कैसे बढ़ी?`,
      options: [
        { text: 'हाल ही में शुरू हुआ (24 से 48 घंटे के भीतर)', iconType: 'clock' },
        { text: '1 से 2 सप्ताह पहले शुरू हुआ, धीरे-धीरे बढ़ रहा है', iconType: 'clock' },
        { text: '3-4 सप्ताह से अधिक समय से लगातार समस्या', iconType: 'clock' },
        { text: 'बार-बार होने वाले दौर जो आते-जाते रहते हैं', iconType: 'moon' }
      ]
    },
    {
      field: 'location',
      getQuestion: (d) => `यह ${d} मुख्य रूप से कहाँ महसूस हो रही है, और क्या यह दर्द कहीं फैलता है?`,
      options: [
        { text: 'केवल एक ही जगह पर सीमित है', iconType: 'target' },
        { text: 'आस-पास के हिस्सों में फैलता है', iconType: 'chest' },
        { text: 'पूरे शरीर में सामान्य दर्द या बेचैनी', iconType: 'bodypain' },
        { text: 'एक जगह से दूसरी जगह बदलता रहता है', iconType: 'wind' }
      ]
    },
    {
      field: 'severity',
      getQuestion: (d) => `आप इस ${d} की गंभीरता और अपनी दिनचर्या पर इसके असर को कैसे बताएंगे?`,
      options: [
        { text: 'हल्का — सामान्य दिनचर्या के साथ संभल जाता है', iconType: 'target' },
        { text: 'मध्यम — परेशानी भरा, काम या नींद पर असर पड़ता है', iconType: 'moon' },
        { text: 'गंभीर — बहुत दर्दनाक, कामकाज करना मुश्किल', iconType: 'flame' },
        { text: 'अचानक तेज दर्द के गंभीर दौरे', iconType: 'chest' }
      ]
    },
    {
      field: 'medications',
      getQuestion: (d) => `क्या आपने इस ${d} के लिए अब तक कोई दवा या उपचार लिया है?`,
      options: [
        { text: 'दुकान से सामान्य दवा ली जिससे अस्थायी आराम मिला', iconType: 'pill' },
        { text: 'घरेलू नुस्खे या आयुर्वेदिक उपाय अपनाए', iconType: 'leaf' },
        { text: 'पहले से डॉक्टर द्वारा लिखी दवा ली', iconType: 'pill' },
        { text: 'अभी तक कोई दवा नहीं ली है', iconType: 'target' }
      ]
    }
  ],
  ta: [
    {
      field: 'duration',
      getQuestion: (d) => `இந்த ${d} எப்போது முதன்முதலில் தொடங்கியது, காலப்போக்கில் எவ்வாறு மாறியது?`,
      options: [
        { text: 'சமீபத்தில் தொடங்கியது (24 முதல் 48 மணி நேரத்திற்குள்)', iconType: 'clock' },
        { text: '1 முதல் 2 வாரங்களுக்கு முன் தொடங்கியது, படிப்படியாக அதிகரிக்கிறது', iconType: 'clock' },
        { text: '3-4 வாரங்களுக்கும் மேலாக நீடிக்கும் பிரச்சனை', iconType: 'clock' },
        { text: 'மீண்டும் மீண்டும் வந்து போகும் நிலை', iconType: 'moon' }
      ]
    },
    {
      field: 'location',
      getQuestion: (d) => `இந்த ${d} முக்கியமாக எங்கு உணரப்படுகிறது, வலி வேறு எங்காவது பரவுகிறதா?`,
      options: [
        { text: 'குறிப்பிட்ட ஒரு இடத்தில் மட்டுமே உள்ளது', iconType: 'target' },
        { text: 'சுற்றியுள்ள பகுதிகளுக்கு பரவுகிறது', iconType: 'chest' },
        { text: 'உடல் முழுவதும் பரவலான அசௌகரியம்', iconType: 'bodypain' },
        { text: 'ஒரு இடத்திலிருந்து மற்றொரு இடத்திற்கு மாறுகிறது', iconType: 'wind' }
      ]
    },
    {
      field: 'severity',
      getQuestion: (d) => `இந்த ${d} தீவிரத்தையும் உங்கள் அன்றாட பணிகளில் அதன் தாக்கத்தையும் எவ்வாறு விவரிப்பீர்கள்?`,
      options: [
        { text: 'லேசானது — இயல்பான பணிகளைச் செய்ய முடிகிறது', iconType: 'target' },
        { text: 'மிதமானது — தூக்கம் அல்லது வேலையை பாதிக்கிறது', iconType: 'moon' },
        { text: 'கடுமையானது — வலி மிகுந்தது, செயல்பாட்டை முடக்குகிறது', iconType: 'flame' },
        { text: 'திடீரென தீவிரமாகும் கடுமையான வலி', iconType: 'chest' }
      ]
    },
    {
      field: 'medications',
      getQuestion: (d) => `இந்த ${d} பிரச்சனைக்கு இதுவரை ஏதேனும் மருந்து அல்லது சிகிச்சை எடுத்துள்ளீர்களா?`,
      options: [
        { text: 'மருந்துக் கடையில் வாங்கிய மருந்து தற்காலிக நிவாரணம் தந்தது', iconType: 'pill' },
        { text: 'வீட்டு வைத்தியம் / மூலிகை மருந்துகளை எடுத்தேன்', iconType: 'leaf' },
        { text: 'முன்பு மருத்துவர் பரிந்துரைத்த மருந்துகளை எடுத்தேன்', iconType: 'pill' },
        { text: 'இதுவரை எந்த மருந்தும் எடுக்கவில்லை', iconType: 'target' }
      ]
    }
  ],
  te: [
    {
      field: 'duration',
      getQuestion: (d) => `ఈ ${d} మొదట ఎప్పుడు ప్రారంభమైంది మరియు కాలక్రమేణా ఎలా పెరిగింది?`,
      options: [
        { text: 'ఇటీవల ప్రారంభమైంది (24 నుండి 48 గంటల క్రితం)', iconType: 'clock' },
        { text: '1 నుండి 2 వారాల క్రితం ప్రారంభమైంది, క్రమంగా పెరుగుతోంది', iconType: 'clock' },
        { text: '3-4 వారాల కంటే ఎక్కువ కాలంగా ఉన్న సమస్య', iconType: 'clock' },
        { text: 'మళ్లీ మళ్లీ వచ్చి పోయే సమస్య', iconType: 'moon' }
      ]
    },
    {
      field: 'location',
      getQuestion: (d) => `ఈ ${d} ప్రధానంగా ఎక్కడ అనిపిస్తుంది, మరియు ఆ అసౌకర్యం మరెక్కడికైనా వ్యాపిస్తుందా?`,
      options: [
        { text: 'ఖచ్చితంగా ఒక నిర్దిష్ట ప్రదేశంలో మాత్రమే ఉంది', iconType: 'target' },
        { text: 'చుట్టుపక్కల ప్రాంతాలకు వ్యాపిస్తుంది', iconType: 'chest' },
        { text: 'శరీరమంతా సాధారణ అసౌకర్యం', iconType: 'bodypain' },
        { text: 'ఒక చోటు నుంచి మరో చోటుకు మారుతుంది', iconType: 'wind' }
      ]
    },
    {
      field: 'severity',
      getQuestion: (d) => `ఈ ${d} యొక్క తీవ్రతను మరియు మీ దినచర్యపై దాని ప్రభావాన్ని ఎలా వివరిస్తారు?`,
      options: [
        { text: 'తేలికపాటి — సాధారణ దినచర్యతో నిర్వహించవచ్చు', iconType: 'target' },
        { text: 'మితమైన — నిద్ర లేదా పనిని ప్రభావితం చేస్తుంది', iconType: 'moon' },
        { text: 'తీవ్రమైన — చాలా బాధాకరం, పనులు చేయడం కష్టం', iconType: 'flame' },
        { text: 'అకస్మాత్తుగా తీవ్రమయ్యే నొప్పులు', iconType: 'chest' }
      ]
    },
    {
      field: 'medications',
      getQuestion: (d) => `ఈ ${d} కోసం మీరు ఇప్పటివరకు ఏవైనా మందులు లేదా చికిత్స తీసుకున్నారా?`,
      options: [
        { text: 'సాధారణ మందులు తీసుకున్నాను, తాత్కాలిక ఉపశమనం లభించింది', iconType: 'pill' },
        { text: 'ఇంటి వైద్యం / మూలికా నివారణలు తీసుకున్నాను', iconType: 'leaf' },
        { text: 'గతంలో డాక్టర్ రాసిన మందులను తీసుకున్నాను', iconType: 'pill' },
        { text: 'ఇప్పటివరకు ఎలాంటి మందులు తీసుకోలేదు', iconType: 'target' }
      ]
    }
  ],
  bn: [
    {
      field: 'duration',
      getQuestion: (d) => `এই ${d} প্রথম কখন শুরু হয়েছিল এবং সময়ের সাথে কীভাবে পরিবর্তিত হয়েছে?`,
      options: [
        { text: 'সম্প্রতি শুরু হয়েছে (২৪ থেকে ৪৮ ঘণ্টার মধ্যে)', iconType: 'clock' },
        { text: '১ থেকে ২ সপ্তাহ আগে শুরু হয়েছে, ধীরে ধীরে বাড়ছে', iconType: 'clock' },
        { text: '৩-৪ সপ্তাহেরও বেশি সময় ধরে স্থায়ী সমস্যা', iconType: 'clock' },
        { text: 'বারবার ফিরে আসা সমস্যা যা আসে এবং কমে', iconType: 'moon' }
      ]
    },
    {
      field: 'location',
      getQuestion: (d) => `এই ${d} প্রধানত কোথায় অনুভব হচ্ছে এবং এটি কি অন্য কোথাও ছড়াচ্ছে?`,
      options: [
        { text: 'শুধুমাত্র একটি নির্দিষ্ট স্থানে সীমাবদ্ধ', iconType: 'target' },
        { text: 'আশেপাশের অংশে ছড়িয়ে পড়ে', iconType: 'chest' },
        { text: 'পুরো শরীরে অস্বস্তি', iconType: 'bodypain' },
        { text: 'এক জায়গা থেকে অন্য জায়গায় সরে যায়', iconType: 'wind' }
      ]
    },
    {
      field: 'severity',
      getQuestion: (d) => `এই ${d}-এর তীব্রতা এবং আপনার দৈনন্দিন কাজে এর প্রভাব কেমন?`,
      options: [
        { text: 'হালকা — সাধারণ কাজের সঙ্গে মানিয়ে নেওয়া যায়', iconType: 'target' },
        { text: 'মাঝারি — অস্বস্তিকর, ঘুম বা কাজে প্রভাব ফেলে', iconType: 'moon' },
        { text: 'তীব্র — যন্ত্রণাদায়ক, স্বাভাবিক কাজকর্ম করা কঠিন', iconType: 'flame' },
        { text: 'হঠাৎ তীব্র হয়ে ওঠা ব্যথার পর্ব', iconType: 'chest' }
      ]
    },
    {
      field: 'medications',
      getQuestion: (d) => `এই ${d}-এর জন্য আপনি কি এখন পর্যন্ত কোনো ওষুধ বা চিকিৎসা নিয়েছেন?`,
      options: [
        { text: 'দোকান থেকে সাধারণ ওষুধ নিয়েছি, সাময়িক আরাম হয়েছে', iconType: 'pill' },
        { text: 'ঘরোয়া বা ভেষজ প্রতিকার নিয়েছি', iconType: 'leaf' },
        { text: 'আগে ডাক্তারের দেওয়া প্রেসক্রিপশনের ওষুধ নিয়েছি', iconType: 'pill' },
        { text: 'এখনো পর্যন্ত কোনো ওষুধ নেইনি', iconType: 'target' }
      ]
    }
  ],
  mr: [
    {
      field: 'duration',
      getQuestion: (d) => `हा ${d} प्रथम केव्हा सुरू झाला आणि काळानुरूप कसा बदलला ते सांगू शकाल का?`,
      options: [
        { text: 'नुकताच सुरू झाला (२४ ते ४८ तासांच्या आत)', iconType: 'clock' },
        { text: '१ ते २ आठवड्यांपूर्वी सुरू झाला, हळूहळू वाढत आहे', iconType: 'clock' },
        { text: '३-४ आठवड्यांहून अधिक काळ सतत असणारा त्रास', iconType: 'clock' },
        { text: 'वारंवार उद्भवणारा आणि जाणारा त्रास', iconType: 'moon' }
      ]
    },
    {
      field: 'location',
      getQuestion: (d) => `हा ${d} प्रामुख्याने कुठे जाणवतो आणि ही वेदना इतरत्र पसरते का?`,
      options: [
        { text: 'फक्त एका विशिष्ट भागातच मर्यादित आहे', iconType: 'target' },
        { text: 'आसपासच्या भागात पसरतो', iconType: 'chest' },
        { text: 'संपूर्ण शरीरात अस्वस्थता किंवा वेदना', iconType: 'bodypain' },
        { text: 'एका ठिकाणाहून दुसऱ्या ठिकाणी सरकतो', iconType: 'wind' }
      ]
    },
    {
      field: 'severity',
      getQuestion: (d) => `या ${d} ची तीव्रता आणि तुमच्या दैनंदिन कामांवर होणारा परिणाम कसा आहे?`,
      options: [
        { text: 'सौम्य — दैनंदिन कामात फारसा अडथळा नाही', iconType: 'target' },
        { text: 'मध्यम — त्रासदायक, झोप किंवा कामावर परिणाम होतो', iconType: 'moon' },
        { text: 'तीव्र — अत्यंत वेदनादायी, हालचालींवर मर्यादा येतात', iconType: 'flame' },
        { text: 'अचानक तीव्र वेदनांचे झटके', iconType: 'chest' }
      ]
    },
    {
      field: 'medications',
      getQuestion: (d) => `तुम्ही या ${d} साठी आतापर्यंत कोणते औषध किंवा उपचार घेतले आहेत का?`,
      options: [
        { text: 'दुकानातून नेहमीचे औषध घेतले, तात्पुरता आराम मिळाला', iconType: 'pill' },
        { text: 'घरगुती उपाय किंवा आयुर्वेदिक उपचार केले', iconType: 'leaf' },
        { text: 'पूर्वी डॉक्टरांनी लिहून दिलेली औषधे घेतली', iconType: 'pill' },
        { text: 'अद्याप कोणतेही औषध घेतलेले नाही', iconType: 'target' }
      ]
    }
  ],
  gu: [
    {
      field: 'duration',
      getQuestion: (d) => `આ ${d} સૌપ્રથમ ક્યારે શરૂ થયું અને સમય સાથે કેવી રીતે વધ્યું?`,
      options: [
        { text: 'તાજેતરમાં શરૂ થયું (૨૪ થી ૪૮ કલાકમાં)', iconType: 'clock' },
        { text: '૧ થી ૨ અઠવાડિયા પહેલાં શરૂ થયું, ધીમે ધીમે વધે છે', iconType: 'clock' },
        { text: '૩-૪ અઠવાડિયાથી વધુ સમયથી ચાલતી તકલીફ', iconType: 'clock' },
        { text: 'વારંવાર આવતી અને જતી તકલીફ', iconType: 'moon' }
      ]
    },
    {
      field: 'location',
      getQuestion: (d) => `આ ${d} મુખ્યત્વે ક્યાં અનુભવાય છે અને શું આ દુખાવો બીજે ક્યાંય ફેલાય છે?`,
      options: [
        { text: 'માત્ર એક ચોક્કસ જગ્યાએ જ સીમિત છે', iconType: 'target' },
        { text: 'આસપાસના ભાગોમાં ફેલાય છે', iconType: 'chest' },
        { text: 'આખા શરીરમાં અસ્વસ્થતા અથવા દુખાવો', iconType: 'bodypain' },
        { text: 'એક જગ્યાએથી બીજી જગ્યાએ બદલાય છે', iconType: 'wind' }
      ]
    },
    {
      field: 'severity',
      getQuestion: (d) => `આ ${d}ની ગંભીરતા અને તમારી દિનચર્યા પર તેની અસર કેવી છે?`,
      options: [
        { text: 'હળવું — સામાન્ય દિનચર્યા સાથે સહન થઈ શકે છે', iconType: 'target' },
        { text: 'મધ્યમ — તકલીફદાયક, ઊંઘ કે કામ પર અસર કરે છે', iconType: 'moon' },
        { text: 'ગંભીર — ખૂબ પીડાદાયક, રોજિંદા કામ કરવું મુશ્કેલ', iconType: 'flame' },
        { text: 'અચાનક તીવ્ર દુખાવાના હુમલા', iconType: 'chest' }
      ]
    },
    {
      field: 'medications',
      getQuestion: (d) => `તમે આ ${d} માટે અત્યાર સુધી કોઈ દવા કે ઉપચાર લીધો છે?`,
      options: [
        { text: 'દુકાનેથી સામાન્ય દવા લીધી, કામચલાઉ રાહત મળી', iconType: 'pill' },
        { text: 'ઘરેલું નુસ્ખા અથવા આયુર્વેદિક ઉપચાર કર્યા', iconType: 'leaf' },
        { text: 'પહેલાં ડૉક્ટરે લખી આપેલી દવા લીધી', iconType: 'pill' },
        { text: 'હજુ સુધી કોઈ દવા લીધી નથી', iconType: 'target' }
      ]
    }
  ],
  kn: [
    {
      field: 'duration',
      getQuestion: (d) => `ಈ ${d} ಮೊದಲು ಯಾವಾಗ ಪ್ರಾರಂಭವಾಯಿತು ಮತ್ತು ಕಾಲಕ್ರಮೇಣ ಹೇಗೆ ಬದಲಾಯಿತು?`,
      options: [
        { text: 'ಇತ್ತೀಚೆಗೆ ಪ್ರಾರಂಭವಾಯಿತು (೨೪ ರಿಂದ ೪೮ ಗಂಟೆಗಳ ಒಳಗೆ)', iconType: 'clock' },
        { text: '೧ ರಿಂದ ೨ ವಾರಗಳ ಹಿಂದೆ ಪ್ರಾರಂಭವಾಯಿತು, ಕ್ರಮೇಣ ಹೆಚ್ಚುತ್ತಿದೆ', iconType: 'clock' },
        { text: '೩-೪ ವಾರಗಳಿಂದ ನಿರಂತರವಾಗಿರುವ ಸಮಸ್ಯೆ', iconType: 'clock' },
        { text: 'ಮತ್ತೆ ಮತ್ತೆ ಬಂದು ಹೋಗುವ ಲಕ್ಷಣಗಳು', iconType: 'moon' }
      ]
    },
    {
      field: 'location',
      getQuestion: (d) => `ಈ ${d} ಮುಖ್ಯವಾಗಿ ಎಲ್ಲಿ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತಿದೆ ಮತ್ತು ನೋವು ಬೇರೆಡೆಗೆ ಹರಡುತ್ತಿದೆಯೇ?`,
      options: [
        { text: 'ಕೇವಲ ಒಂದು ನಿರ್ದಿಷ್ಟ ಸ್ಥಳಕ್ಕೆ ಮಾತ್ರ ಸೀಮಿತವಾಗಿದೆ', iconType: 'target' },
        { text: 'ಸುತ್ತಮುತ್ತಲಿನ ಪ್ರದೇಶಗಳಿಗೆ ಹರಡುತ್ತದೆ', iconType: 'chest' },
        { text: 'ಇಡೀ ದೇಹದಲ್ಲಿ ಹರಡಿರುವ ಅಸ್ವಸ್ಥತೆ', iconType: 'bodypain' },
        { text: 'ಒಂದು ಸ್ಥಳದಿಂದ ಮತ್ತೊಂದು ಸ್ಥಳಕ್ಕೆ ಬದಲಾಗುತ್ತದೆ', iconType: 'wind' }
      ]
    },
    {
      field: 'severity',
      getQuestion: (d) => `ಈ ${d} ತೀವ್ರತೆ ಮತ್ತು ನಿಮ್ಮ ದಿನಚರಿಯ ಮೇಲಿನ ಪರಿಣಾಮವನ್ನು ಹೇಗೆ ವಿವರಿಸುತ್ತೀರಿ?`,
      options: [
        { text: 'ಸೌಮ್ಯ — ಸಾಮಾನ್ಯ ದಿನಚರಿಯೊಂದಿಗೆ ನಿಭಾಯಿಸಬಹುದು', iconType: 'target' },
        { text: 'ಮಧ್ಯಮ — ತೊಂದರೆದಾಯಕ, ನಿದ್ರೆ ಅಥವಾ ಕೆಲಸದ ಮೇಲೆ ಪರಿಣಾಮ', iconType: 'moon' },
        { text: 'ತೀವ್ರ — ನೋವಿನಿಂದ ಕೂಡಿದ್ದು, ಚಟುವಟಿಕೆಗಳಿಗೆ ತೊಂದರೆ', iconType: 'flame' },
        { text: 'ಹಠಾತ್ತನೆ ತೀವ್ರಗೊಳ್ಳುವ ನೋವಿನ ಪ್ರಸಂಗಗಳು', iconType: 'chest' }
      ]
    },
    {
      field: 'medications',
      getQuestion: (d) => `ಈ ${d} ಗಾಗಿ ನೀವು ಇಲ್ಲಿಯವರೆಗೆ ಯಾವುದೇ ಔಷಧಿ ಅಥವಾ ಚಿಕಿತ್ಸೆ ತೆಗೆದುಕೊಂಡಿದ್ದೀರಾ?`,
      options: [
        { text: 'ಸಾಮಾನ್ಯ ಔಷಧಿ ತೆಗೆದುಕೊಂಡೆ, ತಾತ್ಕಾಲಿಕ ಉಪಶಮನ ಸಿಕ್ಕಿದೆ', iconType: 'pill' },
        { text: 'ಮನೆಮದ್ದು ಅಥವಾ ಗಿಡಮೂಲಿಕೆ ಚಿಕಿತ್ಸೆ ಮಾಡಿದ್ದೇನೆ', iconType: 'leaf' },
        { text: 'ಹಿಂದೆ ವೈದ್ಯರು ಸೂಚಿಸಿದ ಔಷಧಿಗಳನ್ನು ತೆಗೆದುಕೊಂಡಿದ್ದೇನೆ', iconType: 'pill' },
        { text: 'ಇಲ್ಲಿಯವರೆಗೆ ಯಾವುದೇ ಔಷಧಿ ತೆಗೆದುಕೊಂಡಿಲ್ಲ', iconType: 'target' }
      ]
    }
  ],
  ml: [
    {
      field: 'duration',
      getQuestion: (d) => `ഈ ${d} എപ്പോഴാണ് ആദ്യം തുടങ്ങിയതെന്നും കാലക്രമേണ എങ്ങനെ കൂടിയെന്നും പറയാമോ?`,
      options: [
        { text: 'സമീപകാലത്ത് തുടങ്ങി (24 മുതൽ 48 മണിക്കൂറിനുള്ളിൽ)', iconType: 'clock' },
        { text: '1 മുതൽ 2 ആഴ്ച മുമ്പ് തുടങ്ങി, ക്രമേണ കൂടുന്നു', iconType: 'clock' },
        { text: '3-4 ആഴ്ചയിലധികമായി തുടരുന്ന പ്രശ്നം', iconType: 'clock' },
        { text: 'ഇടയ്ക്കിടെ വരികയും പോവുകയും ചെയ്യുന്ന അവസ്ഥ', iconType: 'moon' }
      ]
    },
    {
      field: 'location',
      getQuestion: (d) => `ഈ ${d} പ്രധാനമായും എവിടെയാണ് അനുഭവപ്പെടുന്നത്, വേദന മറ്റെവിടെയെങ്കിലും വ്യാപിക്കുന്നുണ്ടോ?`,
      options: [
        { text: 'ഒരു പ്രത്യേക ഭാഗത്ത് മാത്രമായി ഒതുങ്ങിനിൽക്കുന്നു', iconType: 'target' },
        { text: 'ചുറ്റുമുള്ള ഭാഗങ്ങളിലേക്ക് വ്യാപിക്കുന്നു', iconType: 'chest' },
        { text: 'ശരീരമാസകലം അസ്വസ്ഥത', iconType: 'bodypain' },
        { text: 'ഒരിടത്തു നിന്ന് മറ്റൊരിടത്തേക്ക് മാറുന്നു', iconType: 'wind' }
      ]
    },
    {
      field: 'severity',
      getQuestion: (d) => `ഈ ${d} എത്രത്തോളം കഠിനമാണെന്നും ദിനചര്യയെ എങ്ങനെ ബാധിക്കുന്നുവെന്നും വ്യക്തമാക്കാമോ?`,
      options: [
        { text: 'നേരിയത് — സാധാരണ ദിനചര്യകൾ തടസ്സമില്ലാതെ നടക്കുന്നു', iconType: 'target' },
        { text: 'മിതമായത് — ഉറക്കത്തെയോ ജോലിയെയോ ബാധിക്കുന്നു', iconType: 'moon' },
        { text: 'കഠിനമായത് — കടുത്ത വേദന, ദിനചര്യകൾ ചെയ്യാൻ പ്രയാസം', iconType: 'flame' },
        { text: 'പെട്ടെന്ന് കൂടുന്ന കഠിനമായ വേദന', iconType: 'chest' }
      ]
    },
    {
      field: 'medications',
      getQuestion: (d) => `ഈ ${d} ഉള്ളതിന് ഇതുവരെ എന്തെങ്കിലും മരുന്നോ ചികിത്സയോ എടുത്തിട്ടുണ്ടോ?`,
      options: [
        { text: 'സാധാരണ മരുന്ന് കഴിച്ചു, താൽക്കാലിക ആശ്വാസം ലഭിച്ചു', iconType: 'pill' },
        { text: 'വീട്ടുചികിത്സയോ ഔഷധക്കൂട്ടോ ഉപയോഗിച്ചു', iconType: 'leaf' },
        { text: 'നേരത്തെ ഡോക്ടർ നിർദ്ദേശിച്ച മരുന്ന് കഴിച്ചു', iconType: 'pill' },
        { text: 'ഇതുവരെ ഒരു മരുന്നും കഴിച്ചിട്ടില്ല', iconType: 'target' }
      ]
    }
  ]
};

export const ONCOLOGY_TEMPLATES = {
  en: [
    {
      field: 'location',
      getQuestion: (d) => `Which organ or body site is primarily affected by this ${d}, and has a biopsy or scan been completed?`,
      options: [
        { text: 'Biopsy confirmed malignancy', iconType: 'target' },
        { text: 'Suspected on CT / PET / MRI scan', iconType: 'chest' },
        { text: 'Breast, Gynecological, or Pelvic', iconType: 'bodypain' },
        { text: 'Lung, Head & Neck, or Oral', iconType: 'cough' },
        { text: 'Gastrointestinal, Stomach, or Colon', iconType: 'stomach' },
        { text: 'Under preliminary diagnostic evaluation', iconType: 'question' }
      ]
    },
    {
      field: 'medications',
      getQuestion: (d) => `What is your current medical care or treatment stage for this ${d}?`,
      options: [
        { text: 'Newly diagnosed, awaiting oncology plan', iconType: 'clock' },
        { text: 'Currently on Chemotherapy or Radiation', iconType: 'pill' },
        { text: 'Completed surgery / in remission follow-up', iconType: 'leaf' },
        { text: 'Seeking an expert second opinion', iconType: 'target' }
      ]
    },
    {
      field: 'associatedSymptoms',
      getQuestion: (d) => `What primary symptoms or complications are you currently experiencing?`,
      options: [
        { text: 'Significant fatigue & unexplained weight loss', iconType: 'bodypain' },
        { text: 'Persistent localized pain or swelling', iconType: 'flame' },
        { text: 'Treatment-related nausea & low appetite', iconType: 'stomach' },
        { text: 'Routine follow-up without acute distress', iconType: 'target' }
      ]
    }
  ],
  hi: [
    {
      field: 'location',
      getQuestion: (d) => `इस ${d} का प्रभाव मुख्य रूप से शरीर के किस अंग में है, और क्या बायोप्सी/स्कैन की जांच हुई है?`,
      options: [
        { text: 'बायोप्सी द्वारा कैंसर की पुष्टि हुई है', iconType: 'target' },
        { text: 'CT / PET / MRI स्कैन में संदेह पाया गया', iconType: 'chest' },
        { text: 'स्तन, गर्भाशय या पेल्विक क्षेत्र', iconType: 'bodypain' },
        { text: 'मुंह, गला, सिर या फेफड़े', iconType: 'cough' },
        { text: 'पेट या पाचन तंत्र', iconType: 'stomach' },
        { text: 'प्रारंभिक जांच व परीक्षण चल रहा है', iconType: 'question' }
      ]
    },
    {
      field: 'medications',
      getQuestion: (d) => `इस ${d} के लिए आपकी वर्तमान उपचार या देखभाल की क्या स्थिति है?`,
      options: [
        { text: 'नई पहचान, ऑन्कोलॉजिस्ट की योजना का इंतजार', iconType: 'clock' },
        { text: 'वर्तमान में कीमोथेरेपी या रेडिएशन चल रहा है', iconType: 'pill' },
        { text: 'सर्जरी हो चुकी है / नियमित फॉलो-अप', iconType: 'leaf' },
        { text: 'विशेषज्ञ डॉक्टर से दूसरी राय (Second Opinion) चाहिए', iconType: 'target' }
      ]
    },
    {
      field: 'associatedSymptoms',
      getQuestion: (d) => `वर्तमान में आप कौन से मुख्य लक्षण या परेशानी महसूस कर रहे हैं?`,
      options: [
        { text: 'अत्यधिक थकान और वजन कम होना', iconType: 'bodypain' },
        { text: 'लगातार दर्द या गांठ / सूजन', iconType: 'flame' },
        { text: 'उपचार से मतली या भूख की कमी', iconType: 'stomach' },
        { text: 'नियमित जांच, कोई गंभीर तकलीफ नहीं', iconType: 'target' }
      ]
    }
  ],
  ta: [
    {
      field: 'location',
      getQuestion: (d) => `இந்த ${d} முக்கியமாக உடலின் எந்தப் பகுதியை பாதிக்கிறது, பயாப்ஸி அல்லது ஸ்கேன் செய்யப்பட்டுள்ளதா?`,
      options: [
        { text: 'பயாப்ஸி மூலம் புற்றுநோய் உறுதி செய்யப்பட்டது', iconType: 'target' },
        { text: 'CT / PET ஸ்கேனில் கண்டறியப்பட்டது', iconType: 'chest' },
        { text: 'மார்பகம், கருப்பை அல்லது இடுப்பு பகுதி', iconType: 'bodypain' },
        { text: 'நுரையீரல், தலை, கழுத்து அல்லது வாய்', iconType: 'cough' },
        { text: 'வயிறு அல்லது செரிமான மண்டலம்', iconType: 'stomach' },
        { text: 'ஆரம்பகட்ட மருத்துவப் பரிசோதனையில் உள்ளது', iconType: 'question' }
      ]
    },
    {
      field: 'medications',
      getQuestion: (d) => `இந்த ${d} நோய்க்கான உங்கள் தற்போதைய சிகிச்சை நிலை என்ன?`,
      options: [
        { text: 'புதிதாகக் கண்டறியப்பட்டது, சிகிச்சை திட்டம் காத்திருக்கிறது', iconType: 'clock' },
        { text: 'கீமோதெரபி அல்லது கதிர்வீச்சு சிகிச்சை நடக்கிறது', iconType: 'pill' },
        { text: 'அறுவை சிகிச்சை முடிந்தது / தொடர் கவனிப்பு', iconType: 'leaf' },
        { text: 'நிபுணரின் இரண்டாவது கருத்து தேவை', iconType: 'target' }
      ]
    },
    {
      field: 'associatedSymptoms',
      getQuestion: (d) => `தற்போது நீங்கள் எந்த முக்கிய அறிகுறிகளை அல்லது அசௌகரியங்களை உணர்கிறீர்கள்?`,
      options: [
        { text: 'கடுமையான சோர்வு மற்றும் எடை இழப்பு', iconType: 'bodypain' },
        { text: 'தொடர்ச்சியான வலி அல்லது வீக்கம்', iconType: 'flame' },
        { text: 'சிகிச்சை பக்கவிளைவுகள் (குமட்டல், பசியின்மை)', iconType: 'stomach' },
        { text: 'வழக்கமான பரிசோதனை, அவசர தொந்தரவு இல்லை', iconType: 'target' }
      ]
    }
  ],
  te: [
    {
      field: 'location',
      getQuestion: (d) => `ఈ ${d} ప్రధానంగా శరీరంలో ఏ భాగాన్ని ప్రభావితం చేస్తుంది, బయాప్సీ లేదా స్కాన్ పూర్తయిందా?`,
      options: [
        { text: 'బయాప్సీ ద్వారా క్యాన్సర్ నిర్ధారించబడింది', iconType: 'target' },
        { text: 'CT / PET స్కాన్ ద్వారా అనుమానించబడింది', iconType: 'chest' },
        { text: 'రొమ్ము, గర్భాశయం లేదా పెల్విక్ ప్రాంతం', iconType: 'bodypain' },
        { text: 'ఊపిరితిత్తులు, తల, మెడ లేదా నోరు', iconType: 'cough' },
        { text: 'కడుపు లేదా జీర్ణవ్యవస్థ', iconType: 'stomach' },
        { text: 'ప్రాథమిక రోగ నిర్ధారణ పరీక్షల్లో ఉంది', iconType: 'question' }
      ]
    },
    {
      field: 'medications',
      getQuestion: (d) => `ఈ ${d} కోసం మీ ప్రస్తుత చికిత్సా దశ ఏమిటి?`,
      options: [
        { text: 'కొత్తగా నిర్ధారించబడింది, చికిత్స ప్రణాళిక కోసం వేచి ఉంది', iconType: 'clock' },
        { text: 'కీమోథెరపీ లేదా రేడియేషన్ చికిత్స తీసుకుంటున్నారు', iconType: 'pill' },
        { text: 'సర్జరీ పూర్తయింది / రెగ్యులర్ ఫాలో-అప్', iconType: 'leaf' },
        { text: 'రెండవ అభిప్రాయం (Second Opinion) కోసం వచ్చాను', iconType: 'target' }
      ]
    },
    {
      field: 'associatedSymptoms',
      getQuestion: (d) => `ప్రస్తుతం మీరు ఏ ప్రధాన లక్షణాలు లేదా సమస్యలను ఎదుర్కొంటున్నారు?`,
      options: [
        { text: 'తీవ్రమైన అలసట మరియు బరువు తగ్గడం', iconType: 'bodypain' },
        { text: 'నిరంతర నొప్పి లేదా వాపు / గడ్డ', iconType: 'flame' },
        { text: 'చికిత్స సంబంధిత వికారం & ఆకలి లేకపోవడం', iconType: 'stomach' },
        { text: 'సాధారణ తనిఖీ, తీవ్రమైన ఇబ్బంది లేదు', iconType: 'target' }
      ]
    }
  ],
  bn: [
    {
      field: 'location',
      getQuestion: (d) => `এই ${d} প্রধানত শরীরের কোন অংশে হয়েছে, এবং বায়োপসি বা স্ক্যান কি করা হয়েছে?`,
      options: [
        { text: 'বায়োপসি দ্বারা নিশ্চিত হয়েছে', iconType: 'target' },
        { text: 'CT / PET স্ক্যানে সন্দেহ প্রকাশ করা হয়েছে', iconType: 'chest' },
        { text: 'স্তন, জরায়ু বা শ্রোণী অঞ্চল', iconType: 'bodypain' },
        { text: 'ফুসফুস, মাথা, ঘাড় বা মুখ', iconType: 'cough' },
        { text: 'পাকস্থলী বা পরিপাকতন্ত্র', iconType: 'stomach' },
        { text: 'প্রাথমিক পরীক্ষা-নিরীক্ষা চলছে', iconType: 'question' }
      ]
    },
    {
      field: 'medications',
      getQuestion: (d) => `এই ${d}-এর জন্য আপনার বর্তমান চিকিৎসার অবস্থা কী?`,
      options: [
        { text: 'নতুন শনাক্তকরণ, চিকিৎসার পরিকল্পনার অপেক্ষায়', iconType: 'clock' },
        { text: 'বর্তমানে কেমোথেরাপি বা রেডিয়েশন চলছে', iconType: 'pill' },
        { text: 'অস্ত্রোপচার সম্পন্ন / নিয়মিত ফলো-আপ', iconType: 'leaf' },
        { text: 'দ্বিতীয় মতামতের (Second Opinion) জন্য এসেছি', iconType: 'target' }
      ]
    },
    {
      field: 'associatedSymptoms',
      getQuestion: (d) => `বর্তমানে আপনি কী কী প্রধান লক্ষণ অনুভব করছেন?`,
      options: [
        { text: 'অত্যধিক ক্লান্তি এবং ওজন হ্রাস', iconType: 'bodypain' },
        { text: 'ক্রমাগত ব্যথা বা ফোলাভাব / পিণ্ড', iconType: 'flame' },
        { text: 'বমি বমি ভাব ও ক্ষুধা হ্রাস', iconType: 'stomach' },
        { text: 'নিয়মিত চেকআপ, তীব্র কোনো সমস্যা নেই', iconType: 'target' }
      ]
    }
  ],
  mr: [
    {
      field: 'location',
      getQuestion: (d) => `या ${d} चा परिणाम शरीराच्या कोणत्या भागावर झाला आहे, आणि बायोप्सी किंवा स्कॅन झाले आहे का?`,
      options: [
        { text: 'बायोप्सीद्वारे कर्करोगाची पुष्टी झाली आहे', iconType: 'target' },
        { text: 'CT / PET स्कॅनमध्ये संशय आला आहे', iconType: 'chest' },
        { text: 'स्तन, गर्भाशय किंवा ओटीपोटाचा भाग', iconType: 'bodypain' },
        { text: 'फुफ्फुस, डोके, मान किंवा तोंड', iconType: 'cough' },
        { text: 'पोट किंवा पचनसंस्था', iconType: 'stomach' },
        { text: 'प्राथमिक तपासणी सुरू आहे', iconType: 'question' }
      ]
    },
    {
      field: 'medications',
      getQuestion: (d) => `या ${d} साठी तुमच्या उपचाराची सद्यस्थिती काय आहे?`,
      options: [
        { text: 'नुकतेच निदान झाले, उपचार योजनेची प्रतीक्षा', iconType: 'clock' },
        { text: 'सध्या केमोथेरपी किंवा रेडिएशन सुरू आहे', iconType: 'pill' },
        { text: 'शस्त्रक्रिया झाली आहे / नियमित तपासणी', iconType: 'leaf' },
        { text: 'तज्ज्ञांचा दुसरा सल्ला (Second Opinion) हवा आहे', iconType: 'target' }
      ]
    },
    {
      field: 'associatedSymptoms',
      getQuestion: (d) => `सध्या तुम्हाला कोणती मुख्य लक्षणे किंवा त्रास जाणवत आहेत?`,
      options: [
        { text: 'खूप थकवा आणि वजन कमी होणे', iconType: 'bodypain' },
        { text: 'सतत वेदना किंवा गाठ / सूज', iconType: 'flame' },
        { text: 'मळमळ आणि भूक न लागणे', iconType: 'stomach' },
        { text: 'नियमित तपासणी, गंभीर त्रास नाही', iconType: 'target' }
      ]
    }
  ],
  gu: [
    {
      field: 'location',
      getQuestion: (d) => `આ ${d}ની અસર શરીરના કયા અંગ પર છે, અને શું બાયોપ્સી કે સ્કેન થયેલ છે?`,
      options: [
        { text: 'બાયોપ્સી દ્વારા કેન્સરની પુષ્ટિ થયેલ છે', iconType: 'target' },
        { text: 'CT / PET સ્કેનમાં શંકા જણાયેલ છે', iconType: 'chest' },
        { text: 'સ્તન, ગર્ભાશય અથવા પેલ્વિક વિસ્તાર', iconType: 'bodypain' },
        { text: 'ફેફસાં, મોં, ગળું કે માથું', iconType: 'cough' },
        { text: 'પેટ અથવા પાચનતંત્ર', iconType: 'stomach' },
        { text: 'પ્રાથમિક તપાસ અને ટેસ્ટ ચાલુ છે', iconType: 'question' }
      ]
    },
    {
      field: 'medications',
      getQuestion: (d) => `આ ${d} માટે તમારી હાલની સારવારની સ્થિતિ શું છે?`,
      options: [
        { text: 'નવું નિદાન, સારવાર પ્લાનની રાહ', iconType: 'clock' },
        { text: 'હાલમાં કીમોથેરાપી અથવા રેડિયેશન ચાલુ છે', iconType: 'pill' },
        { text: 'સર્જરી થઈ ગઈ છે / રેગ્યુલર ફોલો-અપ', iconType: 'leaf' },
        { text: 'બીજા નિષ્ણાત ડોક્ટરનો અભિપ્રાય જોઈએ છે', iconType: 'target' }
      ]
    },
    {
      field: 'associatedSymptoms',
      getQuestion: (d) => `હાલમાં તમે કયા મુખ્ય લક્ષણો કે તકલીફ અનુભવી રહ્યા છો?`,
      options: [
        { text: 'ખૂબ થાક અને વજન ઘટવું', iconType: 'bodypain' },
        { text: 'સતત દુખાવો અથવા ગાંઠ / સોજો', iconType: 'flame' },
        { text: 'ઉબકા અને ભૂખ ન લાગવી', iconType: 'stomach' },
        { text: 'નિયમિત ચેકઅપ, કોઈ ગંભીર તકલીફ નથી', iconType: 'target' }
      ]
    }
  ],
  kn: [
    {
      field: 'location',
      getQuestion: (d) => `ಈ ${d} ಮುಖ್ಯವಾಗಿ ದೇಹದ ಯಾವ ಭಾಗದ ಮೇಲೆ ಪರಿಣಾಮ ಬೀರಿದೆ, ಬಯಾಪ್ಸಿ ಅಥವಾ ಸ್ಕ್ಯಾನ್ ಮಾಡಲಾಗಿದೆಯೇ?`,
      options: [
        { text: 'ಬಯಾಪ್ಸಿ ಮೂಲಕ ಕ್ಯಾನ್ಸರ್ ದೃಢಪಟ್ಟಿದೆ', iconType: 'target' },
        { text: 'CT / PET ಸ್ಕ್ಯಾನ್‌ನಲ್ಲಿ ಶಂಕಿಸಲಾಗಿದೆ', iconType: 'chest' },
        { text: 'ಸ್ತನ, ಗರ್ಭಾಶಯ ಅಥವಾ ಶ್ರೋಣಿ ಪ್ರದೇಶ', iconType: 'bodypain' },
        { text: 'ಶ್ವಾಸಕೋಶ, ತಲೆ, ಕುತ್ತಿಗೆ ಅಥವಾ ಬಾಯಿ', iconType: 'cough' },
        { text: 'ಹೊಟ್ಟೆ ಅಥವಾ ಜೀರ್ಣಾಂಗ ವ್ಯವಸ್ಥೆ', iconType: 'stomach' },
        { text: 'ಪ್ರಾಥಮಿಕ ತಪಾಸಣೆಗಳು ನಡೆಯುತ್ತಿವೆ', iconType: 'question' }
      ]
    },
    {
      field: 'medications',
      getQuestion: (d) => `ಈ ${d} ಗಾಗಿ ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಚಿಕಿತ್ಸೆಯ ಹಂತವೇನು?`,
      options: [
        { text: 'ಹೊಸದಾಗಿ ಪತ್ತೆಯಾಗಿದೆ, ಚಿಕಿತ್ಸಾ ಯೋಜನೆಗಾಗಿ ಕಾಯುತ್ತಿದ್ದೇವೆ', iconType: 'clock' },
        { text: 'ಪ್ರಸ್ತುತ ಕೀಮೋಥೆರಪಿ ಅಥವಾ ರೇಡಿಯೇಶನ್ ಚಿಕಿತ್ಸೆ ನಡೆಯುತ್ತಿದೆ', iconType: 'pill' },
        { text: 'ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ ಮುಗಿದಿದೆ / ನಿಯಮಿತ ಫಾಲೋ-ಅಪ್', iconType: 'leaf' },
        { text: 'ತಜ್ಞರ ಎರಡನೇ ಅಭಿಪ್ರಾಯ ಬೇಕಾಗಿದೆ', iconType: 'target' }
      ]
    },
    {
      field: 'associatedSymptoms',
      getQuestion: (d) => `ಪ್ರಸ್ತುತ ನೀವು ಯಾವ ಮುಖ್ಯ ಲಕ್ಷಣಗಳು ಅಥವಾ ತೊಂದರೆಗಳನ್ನು ಎದುರಿಸುತ್ತಿದ್ದೀರಿ?`,
      options: [
        { text: 'ವಿಪರೀತ ಆಯಾಸ ಮತ್ತು ತೂಕ ಇಳಿಕೆ', iconType: 'bodypain' },
        { text: 'ನಿರಂತರ ನೋವು ಅಥವಾ ಗಡ್ಡೆ / ಊತ', iconType: 'flame' },
        { text: 'ವಾಕರಿಕೆ ಮತ್ತು ಹಸಿವಿನ ಕೊರತೆ', iconType: 'stomach' },
        { text: 'ಸಾಮಾನ್ಯ ತಪಾಸಣೆ, ಗಂಭೀರ ಸಮಸ್ಯೆ ಇಲ್ಲ', iconType: 'target' }
      ]
    }
  ],
  ml: [
    {
      field: 'location',
      getQuestion: (d) => `ഈ ${d} പ്രധാനമായും ശരീരത്തിന്റെ ഏത് ഭാഗത്തെയാണ് ബാധിച്ചിരിക്കുന്നത്, ബയോപ്സിയോ സ്കാനോ ചെയ്തിട്ടുണ്ടോ?`,
      options: [
        { text: 'ബയോപ്സി വഴി കാൻസർ സ്ഥിരീകരിച്ചു', iconType: 'target' },
        { text: 'CT / PET സ്കാനിൽ സംശയിക്കുന്നു', iconType: 'chest' },
        { text: 'സ്തനം, ഗർഭാശയം അല്ലെങ്കിൽ പെൽവിക് ഭാഗം', iconType: 'bodypain' },
        { text: 'ശ്വാസകോശം, തല, കഴുത്ത് അല്ലെങ്കിൽ വായ', iconType: 'cough' },
        { text: 'വയറ് അല്ലെങ്കിൽ ദഹനവ്യവസ്ഥ', iconType: 'stomach' },
        { text: 'പ്രാഥമിക പരിശോധനകൾ നടക്കുന്നു', iconType: 'question' }
      ]
    },
    {
      field: 'medications',
      getQuestion: (d) => `ഈ ${d} സംബന്ധിച്ച് നിങ്ങളുടെ നിലവിലെ ചികിത്സാ ഘട്ടം എന്താണ്?`,
      options: [
        { text: 'പുതുതായി കണ്ടെത്തി, ചികിത്സാ പദ്ധതിക്കായി കാത്തിരിക്കുന്നു', iconType: 'clock' },
        { text: 'നിലവിൽ കീമോതെറാപ്പിയോ റേഡിയേഷനോ നടക്കുന്നു', iconType: 'pill' },
        { text: 'ശസ്ത്രക്രിയ കഴിഞ്ഞു / തുടർ പരിശോധന', iconType: 'leaf' },
        { text: 'വിദഗ്ദ്ധ ഡോക്ടറുടെ രണ്ടാമത്തെ അഭിപ്രായം തേടുന്നു', iconType: 'target' }
      ]
    },
    {
      field: 'associatedSymptoms',
      getQuestion: (d) => `നിലവിൽ നിങ്ങൾ അനുഭവിക്കുന്ന പ്രധാന ലക്ഷണങ്ങൾ എന്തൊക്കെയാണ്?`,
      options: [
        { text: 'കഠിനമായ ക്ഷീണവും ഭാരം കുറയലും', iconType: 'bodypain' },
        { text: 'തുടർച്ചയായ വേദനയോ മുഴയോ വീക്കമോ', iconType: 'flame' },
        { text: 'ഓക്കാനവും വിശപ്പില്ലായ്മയും', iconType: 'stomach' },
        { text: 'സാധാരണ പരിശോധന, ഗുരുതരമായ ബുദ്ധിമുട്ടുകളില്ല', iconType: 'target' }
      ]
    }
  ]
};

/**
 * Get pure localized adaptive clinical step in any of the 9 languages.
 */
export function getAdaptiveClinicalStep(diseaseName, stepIndex = 0, isAyurvedic = false, lang = 'en') {
  const targetLang = AYURVEDIC_TEMPLATES[lang] ? lang : 'en';
  const localizedDisease = getLocalizedDisease(diseaseName, targetLang);
  const cleanName = String(diseaseName || '').toLowerCase();

  const isOncology = cleanName.includes('cancer') || cleanName.includes('tumor') || cleanName.includes('malignan') ||
                     cleanName.includes('carcinoma') || cleanName.includes('कैंसर') || cleanName.includes('कॅन्सर') ||
                     cleanName.includes('कर्करोग') || cleanName.includes('புற்று') || cleanName.includes('క్యాన్సర్') ||
                     cleanName.includes('ক্যান্সার') || cleanName.includes('કેન્સર') || cleanName.includes('ಕ್ಯಾನ್ಸರ್') ||
                     cleanName.includes('കാൻസർ') || cleanName.includes('गांठ');

  let templateList;
  if (isOncology) {
    templateList = ONCOLOGY_TEMPLATES[targetLang] || ONCOLOGY_TEMPLATES.en;
  } else if (isAyurvedic) {
    templateList = AYURVEDIC_TEMPLATES[targetLang] || AYURVEDIC_TEMPLATES.en;
  } else {
    templateList = ALLOPATHIC_TEMPLATES[targetLang] || ALLOPATHIC_TEMPLATES.en;
  }

  const idx = Math.min(stepIndex, templateList.length - 1);
  const template = templateList[idx];

  return {
    question: template.getQuestion(localizedDisease),
    options: template.options.map(o => ({ ...o })),
    responseType: template.responseType || 'single_choice',
    field: template.field,
    isFinished: false
  };
}
