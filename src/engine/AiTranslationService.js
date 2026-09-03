/* =========================================================================
   SWASTHYA SETU — Universal Bidirectional AI & Indic Translation Engine
   Provides instantaneous, smart, and accurate translations across all 9
   supported Indian languages + English (hi, mr, gu, ta, te, kn, bn, ml, en).
   ========================================================================= */

import voiceAIService from '../voicenav/VoiceAIService';

// High-speed Indic to English reverse dictionary for medical and hospital entities
const REVERSE_INDIC_MAP = {
  // Hospitals
  'एम्स नई दिल्ली': 'AIIMS New Delhi',
  'अखिल भारतीय आयुर्विज्ञान संस्थान': 'AIIMS New Delhi',
  'सवाई मान सिंह अस्पताल': 'Sawai Man Singh Hospital',
  'सवाई मान सिंग रुग्णालय': 'Sawai Man Singh Hospital',
  'સવાઈ માન સિંહ હોસ્પિટલ': 'Sawai Man Singh Hospital',
  'சவாய் மான் சிங் மருத்துவமனை': 'Sawai Man Singh Hospital',
  'సవాయ్ మాన్ సింగ్ ఆసుపత్రి': 'Sawai Man Singh Hospital',
  'ಸವಾಯ್ ಮಾನ್ ಸಿಂಗ್ ಆಸ್ಪತ್ರೆ': 'Sawai Man Singh Hospital',
  'সওয়াই মান সিং হাসপাতাল': 'Sawai Man Singh Hospital',
  'ഇന്ദ്രപ്രസ്ഥ അപ്പോളോ ആശുപത്രി': 'Indraprastha Apollo Hospitals',
  'इंद्रप्रस्थ अपोलो अस्पताल': 'Indraprastha Apollo Hospitals',
  'शालबी अस्पताल जयपुर': 'Shalby Hospital Jaipur',
  'अखिल भारतीय आयुर्वेद संस्थान': 'All India Institute of Ayurveda (AIIA)',
  'राष्ट्रीय आयुर्वेद संस्थान जयपुर': 'National Institute of Ayurveda (NIA)',
  'नारायणा हेल्थ सिटी': 'Narayana Health City',

  // Specialties
  'सामान्य चिकित्सा': 'General Medicine',
  'हृदय रोग विभाग (कार्डियोलॉजी)': 'Cardiology',
  'हृदय रोग': 'Cardiology',
  'कार्डियोलॉजी': 'Cardiology',
  'श्वसन एवं फेफड़ा रोग': 'Pulmonology',
  'पल्मोनोलॉजी': 'Pulmonology',
  'आयुर्वेद एवं पंचकर्म': 'Ayurveda & Panchakarma',
  'आयुर्वेद': 'Ayurveda',
  'बाल रोग विशेषज्ञ': 'Pediatrics',
  'बाल रोग': 'Pediatrics',
  'न्यूरोलॉजी': 'Neurology',
  'अस्थि एवं जोड़ रोग': 'Orthopedics',
  'ऑर्थोपेडिक्स': 'Orthopedics',
  'प्रसूति एवं स्त्री रोग': 'Obstetrics & Gynecology',
  'नेत्र रोग': 'Ophthalmology',
  'दंत चिकित्सा': 'Dentistry',
  'त्वचा रोग': 'Dermatology',
  'मानसिक स्वास्थ्य': 'Psychiatry',

  // Common Medical Terms & Badges
  'पुष्टि की गई': 'Confirmed',
  'पुष्टि': 'Confirmed',
  'कन्फर्म': 'Confirmed',
  'प्रतीक्षारत': 'Pending',
  'पूर्ण': 'Completed',
  'रद्द': 'Cancelled',
  'सरकारी': 'Government',
  'निजी': 'Private',
  'आयुष': 'AYUSH',
  'पास में': 'Near Me',
  'आज उपलब्ध': 'Today',
  'कल उपलब्ध': 'Tomorrow',
  'वर्ष': 'years',
  'साल': 'years',
  'अनुभव': 'Experience',
  'टोकन': 'Token',
  'कमरा': 'Room',
};

// Fast Multi-lingual Dictionary for common strings
const MULTI_DICT = {
  'general medicine': { en: 'General Medicine', hi: 'सामान्य चिकित्सा', mr: 'सामान्य औषधोपचार', gu: 'જનરલ મેડિસિન', ta: 'பொது மருத்துவம்', te: 'జనరల్ మెడిసిన్', kn: 'ಸಾಮಾನ್ಯ ವೈದ್ಯಕೀಯ', bn: 'জেনারেল মেডিসিন', ml: 'ജനറൽ മെഡിസിൻ' },
  'cardiology': { en: 'Cardiology', hi: 'हृदय रोग विभाग', mr: 'हृदयरोगशास्त्र', gu: 'કાર્ડિયોલોજી', ta: 'இதயவியல்', te: 'కార్డియాలజీ', kn: 'ಹೃದ್ರೋಗ ಶಾಸ್ತ್ರ', bn: 'কার্ডিওলজি', ml: 'കാർഡിയോളജി' },
  'pulmonology': { en: 'Pulmonology', hi: 'श्वसन एवं फेफड़ा रोग', mr: 'श्वसनविकारशास्त्र', gu: 'પલ્મોનોલોજી', ta: 'சுவாசவியல்', te: 'పల్మోనాలజీ', kn: 'ಶ್ವಾಸಕೋಶ ಶಾಸ್ತ್ರ', bn: 'পালমোনোলজি', ml: 'പൾമണോളജി' },
  'pediatrics': { en: 'Pediatrics', hi: 'बाल रोग विभाग', mr: 'बालरोगशास्त्र', gu: 'બાળરોગ ચિકિત્સા', ta: 'குழந்தை மருத்துவம்', te: 'పీడియాట్రిక్స్', kn: 'ಮಕ್ಕಳ ವೈದ್ಯಶಾಸ್ತ್ರ', bn: 'শিশুচিকিৎসা', ml: 'പീഡിയാട്രിക്സ്' },
  'ayurveda': { en: 'Ayurveda', hi: 'आयुर्वेद', mr: 'आयुर्वेद', gu: 'આયુર્વેદ', ta: 'ஆயுர்வேதம்', te: 'ఆయుర్వేదం', kn: 'ಆಯುರ್ವೇದ', bn: 'আয়ুর্বেদ', ml: 'ആയുർവേദം' },
  'government': { en: 'Government', hi: 'सरकारी', mr: 'शासकीय', gu: 'સરકારી', ta: 'அரசு', te: 'ప్రభుత్వ', kn: 'ಸರ್ಕಾರಿ', bn: 'সরকারি', ml: 'സർക്കാർ' },
  'private': { en: 'Private', hi: 'निजी', mr: 'खाजगी', gu: 'ખાનગી', ta: 'தனியார்', te: 'ప్రైవేట్', kn: 'ಖಾಸಗಿ', bn: 'বেসরকারি', ml: 'സ്വകാര്യ' },
  'confirmed': { en: 'Confirmed', hi: 'पुष्टि की गई', mr: 'निश्चित', gu: 'પુષ્ટિ થયેલ', ta: 'உறுதியானது', te: 'ధృవీకరించబడింది', kn: 'ದೃಢೀಕರಿಸಲಾಗಿದೆ', bn: 'নিশ্চিত', ml: 'സ്ഥിരീകരിച്ചു' },
  'pending': { en: 'Pending', hi: 'प्रतीक्षारत', mr: 'ಪ್ರಲಂಬಿತ', gu: 'બાકી', ta: 'நிலுவையில்', te: 'వేచి ఉంది', kn: 'ಬಾಕಿ ಉಳಿದಿದೆ', bn: 'অপেক্ষমাণ', ml: 'തീർച്ചപ്പെടാത്ത' },
  'completed': { en: 'Completed', hi: 'पूर्ण', mr: 'पूर्ण', gu: 'પૂર્ણ', ta: 'முடிந்தது', te: 'పూర్తయింది', kn: 'ಪೂರ್ಣಗೊಂಡಿದೆ', bn: 'সম্পন্ন', ml: 'പൂർത്തിയായി' },
  'token': { en: 'Token', hi: 'टोकन', mr: 'टोकन', gu: 'ટોકન', ta: 'டோக்கன்', te: 'టోకెన్', kn: 'ಟೋಕನ್', bn: 'টোকেন', ml: 'ടോക്കൺ' },
  'room': { en: 'Room', hi: 'कमरा', mr: 'खोली', gu: 'રૂમ', ta: 'அறை', te: 'గది', kn: 'ಕೊಠಡಿ', bn: 'রুম', ml: 'മുറി' },
  'years': { en: 'years', hi: 'वर्ष', mr: 'वर्षे', gu: 'વર્ષ', ta: 'ஆண்டுகள்', te: 'సంవత్సరాలు', kn: 'ವರ್ಷಗಳು', bn: 'বছর', ml: 'വർഷം' },
  'exp': { en: 'Exp.', hi: 'अनुभव', mr: 'अनुभव', gu: 'અનુભવ', ta: 'அனுபவம்', te: 'అనుభవం', kn: 'ಅನುಭವ', bn: 'অভিজ্ঞতা', ml: 'പരിചയം' },
  'today': { en: 'Today', hi: 'आज', mr: 'आज', gu: 'આજે', ta: 'இன்று', te: 'ఈరోజు', kn: 'ಇಂದು', bn: 'আজ', ml: 'ഇന്ന്' },
  'tomorrow': { en: 'Tomorrow', hi: 'कल', mr: 'उद्या', gu: 'આવતીકાલે', ta: 'நாளை', te: 'రేపు', kn: 'ನಾಳೆ', bn: 'আগামীকাল', ml: 'നാളെ' },
  'sidhant': { en: 'Sidhant', hi: 'सिद्धांत', mr: 'सिद्धांत', gu: 'સિદ્ધાંત', ta: 'சித்தாந்த்', te: 'సిద్ధాంత్', kn: 'ಸಿದ್ಧಾಂತ್', bn: 'সিদ্ধান্ত', ml: 'സിദ്ധാന്ത്' },
  'ananya sharma': { en: 'Ananya Sharma', hi: 'अनन्या शर्मा', mr: 'अनन्या शर्मा', gu: 'અનન્યા શર્મા', ta: 'அனன்யா சர்மா', te: 'అనన్య శర్మ', kn: 'ಅನನ್ಯಾ ಶರ್ಮಾ', bn: 'অনন্যা শর্মা', ml: 'അനന്യ ശർമ്മ' },
  'fever': { en: 'Fever', hi: 'बुखार', mr: 'ताप', gu: 'તાવ', ta: 'காய்ச்சல்', te: 'జ్వరం', kn: 'ಜ್ವರ', bn: 'জ্বর', ml: 'പനി' },
  'headache': { en: 'Headache', hi: 'सिरदर्द', mr: 'डोकेदुखी', gu: 'માથાનો દુખાવો', ta: 'தலைவலி', te: 'తలనొప్పి', kn: 'ತಲೆನೋವು', bn: 'মাথাব্যথা', ml: 'തലവേദന' },
  'stomach pain': { en: 'Stomach pain', hi: 'पेट दर्द', mr: 'पोटदुखी', gu: 'પેટનો દુખાવો', ta: 'வயிற்று வலி', te: 'కడుపు నొప్పి', kn: 'ಹೊಟ್ಟೆ ನೋವು', bn: 'পেট ব্যথা', ml: 'വയറുവേദന' },
  'cough / cold': { en: 'Cough / cold', hi: 'खांसी / जुकाम', mr: 'खोकला / सर्दी', gu: 'ઉધરસ / શરદી', ta: 'இருமல் / சளி', te: 'దగ్గు / జలుబు', kn: 'ಕೆಮ್ಮು / ಶೀತ', bn: 'কাশি / সর্দি', ml: 'ചുമ / ജലദോഷം' },
  'body pain': { en: 'Body pain', hi: 'शरीर में दर्द', mr: 'अंगदुखी', gu: 'શરીરનો દુખાવો', ta: 'உடல் வலி', te: 'శరీర నొప్పి', kn: 'ದೇಹ ನೋವು', bn: 'শরীর ব্যথা', ml: 'ശരീരവേദന' },
  'chest pain': { en: 'Chest pain', hi: 'सीने में दर्द', mr: 'छातीत दुखणे', gu: 'છાતીમાં દુખાવો', ta: 'மார்பு வலி', te: 'ఛాతీ నొప్పి', kn: 'ಎದೆ ನೋವು', bn: 'বুকে ব্যথা', ml: 'നെഞ്ചുവേദന' },
  'back pain': { en: 'Back pain', hi: 'पीठ दर्द', mr: 'पाठदुखी', gu: 'પીઠનો દુખાવો', ta: 'முதுகு வலி', te: 'వెన్నునొప్పి', kn: 'ಬೆನ್ನು ನೋವು', bn: 'পিঠের ব্যথা', ml: 'പുറംവേദന' },
  'joint pain': { en: 'Joint pain', hi: 'जोड़ों का दर्द', mr: 'सांधेदुखी', gu: 'સાંધાનો દુખાવો', ta: 'மூட்டு வலி', te: 'కీళ్ల నొప్పులు', kn: 'ಕೀಲು ನೋವು', bn: 'গাঁটে ব্যথা', ml: 'സന്ധി വേദന' },
  'normal energy with undisturbed sleep': { en: 'Normal energy with undisturbed sleep', hi: 'सामान्य ऊर्जा और बिना रुकावट की नींद', mr: 'सामान्य ऊर्जा आणि शांत झोप', gu: 'સામાન્ય ઊર્જા અને શાંત ઊંઘ', ta: 'சாதாரண ஆற்றல் மற்றும் அமைதியான தூக்கம்', te: 'సాధారణ శక్తి మరియు ప్రశాంతమైన నిద్ర', kn: 'ಸಾಮಾನ್ಯ ಶಕ್ತಿ ಮತ್ತು ನೆಮ್ಮದಿಯ ನಿದ್ರೆ', bn: 'স্বাভাবিক শক্তি এবং নিরবচ্ছিন্ন ঘুম', ml: 'സാധാരണ ഊർജ്ജവും തടസ്സമില്ലാത്ത ഉറക്കവും' },
  'restless sleep and low stamina': { en: 'Restless sleep and low stamina', hi: 'बेचैन नींद और कम सहनशक्ति / कमजोरी', mr: 'अस्वस्थ झोप आणि कमी ताकद', gu: 'બેચેન ઊંઘ અને ઓછી સહનશક્તિ', ta: 'அமைதியற்ற தூக்கம் மற்றும் குறைந்த ஆற்றல்', te: 'అశాంతి నిద్ర మరియు తక్కువ శక్తి', kn: 'ಅಶಾಂತ ನಿದ್ರೆ ಮತ್ತು ಕಡಿಮೆ ಚೈತನ್ಯ', bn: 'অস্থির ঘুম এবং কম সহনশীলতা', ml: 'അസ്വസ്ഥമായ ഉറക്കവും കുറഞ്ഞ ഊർജ്ജവും' },
  'severe lethargy and heaviness in body': { en: 'Severe lethargy and heaviness in body', hi: 'अत्यधिक सुस्ती और शरीर में भारीपन', mr: 'अतिशय थकवा आणि शरीरात जडपणा', gu: 'અતિશય સુસ્તી અને શરીરમાં ભારેપણું', ta: 'கடுமையான சோர்வு மற்றும் உடலில் பாரம்', te: 'తీవ్రమైన బద్ధకం మరియు శరీరంలో బరువు', kn: 'ತೀವ್ರ ಆಯಾಸ ಮತ್ತು ದೇಹದಲ್ಲಿ ಭಾರವಾದ ಭಾವನೆ', bn: 'তীব্র ক্লান্তি এবং শরীরে ভারী ভাব', ml: 'കഠിനമായ ക്ഷീണവും ശരീരത്തിൽ ഭാരവും' },
  'disturbed by stress and anxiety': { en: 'Disturbed by stress and anxiety', hi: 'तनाव और चिंता के कारण अशांत', mr: 'तणाव आणि चिंतेमुळे अस्वस्थ', gu: 'તણાવ અને ચિંતાથી પરેશાન', ta: 'மன அழுத்தம் மற்றும் கவலையால் தொந்தரவு', te: 'ఒత్తిడి మరియు ఆందోళనతో కలత', kn: 'ಒತ್ತಡ ಮತ್ತು ಆತಂಕದಿಂದ ಅಶಾಂತಿ', bn: 'মানসিক চাপ ও উদ্বেগে বিঘ্নিত', ml: 'സമ്മർദ്ദവും ഉത്കണ്ഠയും കാരണം അസ്വസ്ഥത' },
};

class AiTranslationService {
  constructor() {
    this.isAiAvailable = Boolean(import.meta.env.VITE_GEMINI_API_KEY);
    this._cache = new Map();
    this._pending = new Map();
    this.listeners = new Set();
    this._batch = new Map();
    this._batchTimeout = null;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  _notify() {
    this.listeners.forEach(fn => {
      try { fn(); } catch (e) {}
    });
  }

  /**
   * Smart, fast, bidirectional translation engine
   */
  translate(text, targetLang = 'en', contextType = 'general') {
    if (!text || typeof text !== 'string') return '';
    const cleanText = text.trim();
    if (!cleanText) return '';

    const isIndic = /[\u0900-\u0DFF]/.test(cleanText);

    // If English is requested:
    if (!targetLang || targetLang === 'en') {
      if (!isIndic) return cleanText;
      // If text is in Indic script, map back to English
      for (const [indicStr, enStr] of Object.entries(REVERSE_INDIC_MAP)) {
        if (cleanText.includes(indicStr)) {
          return enStr;
        }
      }
      const cacheKey = `en_${contextType}_${cleanText}`;
      if (this._cache.has(cacheKey)) return this._cache.get(cacheKey);
      this.fetchAiTranslation(cleanText, 'en', contextType);
      return cleanText;
    }

    // Direct multi-lingual dictionary lookup
    const lowerKey = cleanText.toLowerCase();
    if (MULTI_DICT[lowerKey] && MULTI_DICT[lowerKey][targetLang]) {
      return MULTI_DICT[lowerKey][targetLang];
    }

    const cacheKey = `${targetLang}_${contextType}_${lowerKey}`;
    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey);
    }

    // Trigger AI translation
    this.fetchAiTranslation(cleanText, targetLang, contextType);

    // Instant phonetic fallback for doctor/patient names
    if (contextType === 'name' || contextType === 'doctor') {
      return this._phoneticFallback(cleanText, targetLang);
    }

    return cleanText;
  }

  async fetchAiTranslation(text, targetLang, contextType) {
    const cacheKey = `${targetLang}_${contextType}_${text.toLowerCase()}`;
    if (this._cache.has(cacheKey) || this._pending.has(cacheKey)) {
      return;
    }

    this._pending.set(cacheKey, true);

    if (!this._batch.has(targetLang)) {
      this._batch.set(targetLang, new Map());
    }
    this._batch.get(targetLang).set(text, contextType);

    if (this._batchTimeout) clearTimeout(this._batchTimeout);
    this._batchTimeout = setTimeout(() => this._processBatch(), 600);
  }

  async _processBatch() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const currentBatch = new Map(this._batch);
    this._batch.clear();

    if (!apiKey && !voiceAIService.available) {
      currentBatch.forEach((items, targetLang) => {
        items.forEach((contextType, originalStr) => {
          const cacheKey = `${targetLang}_${contextType}_${originalStr.toLowerCase()}`;
          this._pending.delete(cacheKey);
        });
      });
      return;
    }

    for (const [targetLang, items] of currentBatch.entries()) {
      const textsToTranslate = Array.from(items.keys());
      if (textsToTranslate.length === 0) continue;

      const langNames = {
        hi: 'Hindi', mr: 'Marathi', gu: 'Gujarati', ta: 'Tamil', te: 'Telugu',
        kn: 'Kannada', bn: 'Bengali', pa: 'Punjabi', ml: 'Malayalam', or: 'Odia', en: 'English'
      };
      const langName = langNames[targetLang] || targetLang;

      try {
        if (apiKey) {
          const prompt = `Translate this JSON array of hospital and medical text into ${langName}. Keep punctuation and meaning accurate. Return ONLY a valid JSON array of translated strings.
Input: ${JSON.stringify(textsToTranslate)}`;

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" }
            })
          });

          if (response.ok) {
            const data = await response.json();
            let rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            rawJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
            const translatedArray = JSON.parse(rawJson);

            if (Array.isArray(translatedArray) && translatedArray.length === textsToTranslate.length) {
              textsToTranslate.forEach((originalStr, index) => {
                const translatedStr = translatedArray[index];
                const contextType = items.get(originalStr);
                const cacheKey = `${targetLang}_${contextType}_${originalStr.toLowerCase()}`;
                this._cache.set(cacheKey, translatedStr);
                this._pending.delete(cacheKey);
              });
              this._notify();
            }
          }
        } else if (voiceAIService.available) {
          // Secure Server-side Supabase Edge Function Translation (Zero Browser API Key exposure)
          await Promise.all(textsToTranslate.map(async (originalStr) => {
            const contextType = items.get(originalStr);
            const res = await voiceAIService.translate(originalStr, langName, contextType);
            if (res && res.text) {
              const cacheKey = `${targetLang}_${contextType}_${originalStr.toLowerCase()}`;
              this._cache.set(cacheKey, res.text);
              this._pending.delete(cacheKey);
            }
          }));
          this._notify();
        }
      } catch (err) {
        console.warn('Translation batch error:', err);
      } finally {
        textsToTranslate.forEach(originalStr => {
          const cacheKey = `${targetLang}_${items.get(originalStr)}_${originalStr.toLowerCase()}`;
          this._pending.delete(cacheKey);
        });
      }
    }
  }

  _phoneticFallback(text, targetLang) {
    if (!text || targetLang === 'en') return text;

    const SCRIPT_OFFSETS = {
      hi: 0x0900, mr: 0x0900, bn: 0x0980, pa: 0x0A00, gu: 0x0A80,
      or: 0x0B00, ta: 0x0B80, te: 0x0C00, kn: 0x0C80, ml: 0x0D00
    };

    const baseOffset = SCRIPT_OFFSETS[targetLang] || SCRIPT_OFFSETS.hi;
    const viramaCode = baseOffset + 0x4D;

    const CONSONANTS = [
      { match: 'chh', offset: 0x1B }, { match: 'kh', offset: 0x16 }, { match: 'gh', offset: 0x18 },
      { match: 'ch', offset: 0x1A }, { match: 'jh', offset: 0x1C }, { match: 'th', offset: 0x25 },
      { match: 'dh', offset: 0x27 }, { match: 'ph', offset: 0x2B }, { match: 'bh', offset: 0x2D },
      { match: 'sh', offset: 0x36 }, { match: 'ss', offset: 0x37 }, { match: 'k', offset: 0x15 },
      { match: 'g', offset: 0x17 }, { match: 'j', offset: 0x1C }, { match: 't', offset: 0x24 },
      { match: 'd', offset: 0x26 }, { match: 'n', offset: 0x28 }, { match: 'p', offset: 0x2A },
      { match: 'f', offset: 0x2B }, { match: 'b', offset: 0x2C }, { match: 'm', offset: 0x2E },
      { match: 'y', offset: 0x2F }, { match: 'r', offset: 0x30 }, { match: 'l', offset: 0x32 },
      { match: 'v', offset: 0x35 }, { match: 'w', offset: 0x35 }, { match: 's', offset: 0x38 },
      { match: 'h', offset: 0x39 }
    ];

    const VOWELS = [
      { match: 'aa', offset: 0x3E, initial: 0x06 }, { match: 'ai', offset: 0x48, initial: 0x10 },
      { match: 'au', offset: 0x4C, initial: 0x14 }, { match: 'ee', offset: 0x40, initial: 0x08 },
      { match: 'oo', offset: 0x42, initial: 0x0A }, { match: 'ou', offset: 0x4C, initial: 0x14 },
      { match: 'a', offset: null, initial: 0x05 }, { match: 'i', offset: 0x3F, initial: 0x07 },
      { match: 'u', offset: 0x41, initial: 0x09 }, { match: 'e', offset: 0x47, initial: 0x0F },
      { match: 'o', offset: 0x4B, initial: 0x13 }
    ];

    return text.split(' ').map(word => {
      const w = word.toLowerCase().replace(/[^a-z]/g, '');
      if (!w) return word;
      let res = '';
      let i = 0;
      while (i < w.length) {
        if (i === 0) {
          let matchedInit = null, initLen = 0;
          for (const v of VOWELS) {
            if (w.startsWith(v.match, i)) {
              matchedInit = v.initial;
              initLen = v.match.length;
              break;
            }
          }
          if (matchedInit !== null) {
            res += String.fromCharCode(baseOffset + matchedInit);
            i += initLen;
            continue;
          }
        }

        let matchedCons = null, consLen = 0;
        for (const c of CONSONANTS) {
          if (w.startsWith(c.match, i)) {
            matchedCons = c.offset;
            consLen = c.match.length;
            break;
          }
        }

        if (matchedCons !== null) {
          res += String.fromCharCode(baseOffset + matchedCons);
          i += consLen;
          let matchedVow = null, vowLen = 0;
          for (const v of VOWELS) {
            if (w.startsWith(v.match, i)) {
              matchedVow = v.offset;
              vowLen = v.match.length;
              break;
            }
          }
          if (vowLen > 0) {
            if (matchedVow !== null) {
              res += String.fromCharCode(baseOffset + matchedVow);
            }
            i += vowLen;
          } else {
            if (i < w.length) {
              res += String.fromCharCode(viramaCode);
            }
          }
        } else {
          i++;
        }
      }
      return res || word;
    }).join(' ');
  }
}

const aiTranslationService = new AiTranslationService();
export default aiTranslationService;
