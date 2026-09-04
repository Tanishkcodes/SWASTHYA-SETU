import voiceAIService from '../voicenav/VoiceAIService';
import { normalizeDigits } from '../voicenav/numberLocale.js';

const MULTILINGUAL_ACTION_DESCRIPTIONS = {
  bookAppointment: 'Book doctor appointment, consult doctor, physician, see specialist, OPD booking, hospital visit, checkup, feeling sick, fever, illness, pain, headache, cough, cold, emergency doctor, bukhar, dard, ilaj, bimar, chikitsak, vaidya, டாக்டர், மருத்துவர், மருத்துவரை பார்க்க, వైద్యుడు, డాక్టర్, ডাক্তার, ವೈದ್ಯರು, ഡോക്ടർ, તબીબ, डॉक्टर',
  login_patient: 'Patient login, sign in, open patient portal, patient account, register patient, मरीज़ लॉगिन, நோயாளி உள்நுழைவு, రోగి లాగిన్',
  login_doctor: 'Doctor login, physician portal, doctor sign in, डॉक्टर लॉगिन, மருத்துவர் உள்நுழைவு, డాక్టర్ లాగిన్',
  login_admin: 'Hospital admin login, administrator dashboard, अस्पताल व्यवस्थापक लॉगिन, நிர்வாகி உள்நுழைவு',
  scan_document: 'Scan prescription, upload medical report, document camera scan, take photo of paper, parcha scan, दवाइयों का पर्चा, மருந்து சீட்டு ஸ்கேன், ప్రిస్క్రిప్షన్ స్కాన్, প্রেসক্রিপশন স্ক্যান',
  viewReports: 'View lab test reports, blood test results, radiology scans, diagnostic records, test summary, जांच रिपोर्ट, రక్త పరీక్ష, பரிசோதனை முடிவுகள், রক্তের رپورٹ, ರಕ್ತ ಪರೀಕ್ಷೆ ವರದಿ',
  viewHistory: 'Past medical history, previous consultations, visit history, old appointments, past treatments, पुरानी बीमारी का इतिहास, மருத்துவ வரலாறு, గత చరిత్ర, অতীত ইতিহাস, ಹಿಂದಿನ ಚಿಕಿತ್ಸೆ',
  viewAppointments: 'View upcoming appointments, scheduled visits, appointment token, queue status, आने वाले अपॉइंटमेंट, டோக்கன், రాబోయే అపాయింట్‌మెంట్‌లు, ಮುಂದಿನ ಅಪಾಯಿಂಟ್ಮೆಂಟ್',
  viewDonations: 'Blood donation, organ donation, donate blood, find blood donors, raktdan, రక్తదానం, రక్త దాతలు, இரத்த தானம், রক্তদান, ರಕ್ತದಾನ, രക്തദാനം',
  viewCommunities: 'Patient support groups, healthcare communities, talk with patients, discuss health, मरीज समुदाय, சமூக குழு, రోగుల సంఘం, ರೋಗಿಗಳ ಗುಂಪು',
  viewHelp: 'Help and support, how to use kiosk, questions, assistance, helpline, मदद और सहायता, உதவி, సహాయం, ಸಹಾಯ, സഹായം',
  viewProfile: 'Patient profile, ABHA card, digital health ID, user account, मेरी प्रोफाइल, आभा कार्ड, ఆరోగ్య కార్డు, ಆಭಾ ಕಾರ್ಡ್',
  showAbhaCard: 'Show ABHA card, digital health card, Ayushman Bharat health account card, आभा कार्ड दिखाओ, ஆதார் / ஆபா கார்டு, ಆಭಾ ಕಾರ್ಡ್ ತೋರಿಸಿ',
  toggleAyush: 'Switch to AYUSH, Ayurveda, Homeopathy, Unani, Naturopathy care system, आयुर्वेद में बदलें, ஆயுஷ், ఆయుష్, ಆಯುಷ್',
  emergency: 'Call 108 ambulance, medical emergency, critical urgent help, aapatkal, bachao, ஆம்புலன்ஸ், అత్యవసర సేవ 108, অ্যাম্বুলেন্স, ആംബുലൻസ്, ತುರ್ತು',
  home: 'Go to home page, main screen, landing page, होम पेज, मुख्य पृष्ठ, முகப்பு',
  back: 'Go back, previous step, previous, wapas, peechhe, pichhla step, मागचा टप्पा, मागे, பின்செல், பின்னே, వెనక్కి, ಹಿಂದಿನ, ಹಿಂದೆ, പുറകോട്ട്, પાછળ, পূর্ববর্তী ধাপ',
  next: 'Go to next step, next, proceed, continue, agla, agla step, aage badho, aage chalo, அடுத்தது, அடுத்து, తరువాత, ಮುಂದಿನ, അടുത്തത്, આગળ, पुढे, पुढील टप्पा, পরবর্তী ধাপ',
  confirm: 'Confirm booking, confirm appointment, submit, book now, finalize, confirm, pakka karo, book karo, पक्के करा, உறுதிப்படுத்து, పూర్తిచేయి, ಕನ್ಫರ್ಮ್ ಮಾಡಿ, ഉറപ്പാക്കൂ, ખાતરી કરો, নিশ্চিত করুন',
  step1: 'Step 1, select date, choose date, change date, tarikh, तारीख, दिनांक, தேதி, తేదీ, ದಿನಾಂಕ, ತೀಯತಿ, તારીખ',
  step2: 'Step 2, select time, time slot, choose time, appointment time, samay, समय, वेळ, நேரம், సమయం, ಸಮಯ, സമയം, સમય',
  step3: 'Step 3, case details, symptoms, disease, illness reason, lakshan, लक्षण, लक्षणे, அறிகுறிகள், లక్షణాలు, ರೋಗಲಕ್ಷಣಗಳು, ലക്ഷണങ്ങൾ, લક્ષણો',
  step4: 'Step 4, upload reports, medical records, prescription, report upload, रिपोर्ट अपलोड, அறிக்கை பதிவேற்றம், నివేదికలు, ವರದಿ ಅಪ್ಲೋಡ್, റിപ്പോർട്ട്, રિપોર્ટ અપલોડ',
  step5: 'Step 5, confirmation, review booking, summary, check details, समीक्षा, இறுதி உறுதிப்படுத்தல், సమీక్ష',
  select_language: 'Change language, choose language, भाषा बदलें, மொழி மாற்று, భాష మార్చండి',
  set_language_hi: 'Switch language to Hindi, Speak in Hindi, हिंदी में बोलो, हिन्दी, हिंदी',
  set_language_ta: 'Switch language to Tamil, Speak in Tamil, தமிழில் பேசு, தமிழ்',
  set_language_te: 'Switch language to Telugu, Speak in Telugu, తెలుగులో మాట్లాడు, తెలుగు',
  set_language_bn: 'Switch language to Bengali, Speak in Bengali, বাংলায় কথা বলুন, বাংলা',
  set_language_mr: 'Switch language to Marathi, Speak in Marathi, मराठीत बोला, मराठी',
  set_language_gu: 'Switch language to Gujarati, Speak in Gujarati, ગુજરાતીમાં બોલો, ગુજરાતી',
  set_language_kn: 'Switch language to Kannada, Speak in Kannada, ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ, ಕನ್ನಡ',
  set_language_ml: 'Switch language to Malayalam, Speak in Malayalam, മലയാളത്തിൽ സംസാരിക്കൂ, മലയാളം',
  set_language_en: 'Switch language to English, Speak in English, अंग्रेजी, ஆங்கிலம், ఇంగ్లీష్',
};

class AICommandEngine {
  constructor() {
    this._cache = new Map(); // Cache recent parses for speed
  }

  get isAvailable() {
    return voiceAIService.available;
  }

  /** Convert commonly spoken digits and number words in all nine supported languages. */
  _convertSpokenNumberWords(text = '') {
    const digits = {
      // 0 - 9 in English and Indian languages (Script + Transliteration)
      zero: '0', oh: '0', shunya: '0', sunya: '0', poojyam: '0', பூஜ்ஜியம்: '0', సున్నా: '0', শূন্য: '0', शून्य: '0', શૂન્ય: '0', ಸೊನ್ನೆ: '0', പൂജ്യം: '0',
      one: '1', ek: '1', onnu: '1', ondru: '1', okati: '1', এক: '1', એક: '1', એક: '1', ಒಂದು: '1', ഒന്ന്: '1',
      two: '2', do: '2', don: '2', rendu: '2', irandu: '2', দুই: '2', दोन: '2', બે: '2', రెండు: '2', ಎರಡು: '2', രണ്ട്: '2',
      three: '3', teen: '3', tin: '3', moonu: '3', moondru: '3', mudu: '3', তিন: '3', तीन: '3', ત્રણ: '3', మూడు: '3', ಮೂರು: '3', ಮೂಂದು: '3',
      four: '4', char: '4', chaar: '4', naalu: '4', naangu: '4', nalugu: '4', চার: '4', चार: '4', ચાર: '4', నాలుగు: '4', ನಾಲ್ಕು: '4', ನಾಲ್ಕು: '4',
      five: '5', paanch: '5', panch: '5', anju: '5', ainthu: '5', aidu: '5', ஐந்து: '5', পাঁচ: '5', पाच: '5', પાંચ: '5', ఐదు: '5', ಐದು: '5', അഞ്ച്: '5',
      six: '6', chhe: '6', che: '6', aaru: '6', aru: '6', ఆరు: '6', ஆறு: '6', ছয়: '6', सहा: '6', છ: '6', ಆರು: '6', ആറ്: '6',
      seven: '7', saat: '7', ezhu: '7', elu: '7', edu: '7', ஏழு: '7', সাত: '7', सात: '7', સાત: '7', ఏడు: '7', ಏಳು: '7', ഏഴ്: '7',
      eight: '8', aath: '8', ath: '8', ettu: '8', எட்டு: '8', enimidi: '8', আট: '8', आठ: '8', આઠ: '8', ఎనిమిది: '8', ಎಂಟು: '8', എട്ട്: '8',
      nine: '9', nau: '9', nov: '9', ombadhu: '9', ombathu: '9', ஒன்பது: '9', tommidi: '9', নয়: '9', नऊ: '9', નવ: '9', తొమ్మిది: '9', ಒಂಬತ್ತು: '9', ഒമ്പത്: '9',
      ten: '10', das: '10', pathu: '10', padhi: '10', dosh: '10', daha: '10', ಹತ್ತು: '10', പത്ത്: '10',
      
      // Common ages in words
      fifteen: '15', pandrah: '15',
      twenty: '20', bees: '20', irubadhu: '20', iravai: '20',
      twentyone: '21', ikkis: '21',
      twentytwo: '22', baais: '22',
      twentythree: '23', teis: '23',
      twentyfour: '24', chaubees: '24',
      twentyfive: '25', pachees: '25',
      twentysix: '26', chhabees: '26',
      twentyseven: '27', sattais: '27',
      twentyeight: '28', athaais: '28',
      twentynine: '29', untees: '29',
      thirty: '30', tees: '30', muppadhu: '30', muppai: '30',
      thirtyone: '31', iktis: '31',
      thirtytwo: '32', battis: '32',
      thirtythree: '33', tentis: '33',
      thirtyfour: '34', chauntis: '34',
      thirtyfive: '35', paintis: '35',
      thirtysix: '36', chattis: '36',
      thirtyseven: '37', saintis: '37',
      thirtyeight: '38', adhtis: '38',
      thirtynine: '39', untalis: '39',
      forty: '40', chalis: '40', naalpadhu: '40', nalabhai: '40',
      fortyone: '41', iktalis: '41',
      fortytwo: '42', bayalis: '42',
      fortythree: '43', taintalis: '43',
      fortyfour: '44', chauvalis: '44',
      fortyfive: '45', paintalis: '45',
      fortysix: '46', chhiyalis: '46',
      fortyseven: '47', saintalis: '47',
      fortyeight: '48', adhtalis: '48',
      fortynine: '49', unchaas: '49',
      fifty: '50', pachaas: '50', aimbadhu: '50', yaabhai: '50',
      fiftyfive: '55', pachpan: '55',
      sixty: '60', saath: '60', arubadhu: '60', aravai: '60',
      sixtyfive: '65', painsath: '65',
      seventy: '70', sattar: '70', ezhabadhu: '70', debbhai: '70',
      seventyfive: '75', pachhattar: '75',
      eighty: '80', assi: '80', enbadhu: '80', enabhai: '80',
      eightyfive: '85', pachasi: '85',
      ninety: '90', nabbe: '90', thonnooru: '90', thombhai: '90',
    };

    // Replace words
    let converted = normalizeDigits(text).split(/([\s,.-]+)/).map(token => digits[token.toLowerCase()] ?? token).join('');
    // Collapse spaces between adjacent single digits e.g. "9 8 7 6 5 4 3 2 1 0" -> "9876543210"
    converted = converted.replace(/(?<=\b\d)\s+(?=\d\b)/g, '');
    return converted;
  }

  /**
   * Translates natural language into a structured intent based on available page commands.
   * @param {string} transcript The user's voice input (any language)
   * @param {object} availableCommands Map of intents to descriptions/triggers
   * @param {object} globalCommands Map of global intents
   * @param {object} ctx Extra context: { page, language, routes }
   */
  async parseIntent(transcript, availableCommands = {}, globalCommands = {}, ctx = {}) {
    if (!transcript || !transcript.trim()) return null;
    const { page = 'unknown', language = 'auto', routes = [], recognitionAlternatives = [], expectsFreeText = false } = ctx;
    const safeAlternatives = Array.isArray(recognitionAlternatives)
      ? recognitionAlternatives.map(value => String(value || '').trim()).filter(Boolean).slice(0, 3)
      : [];
    const cacheKey = `${JSON.stringify([language, expectsFreeText, availableCommands, globalCommands, routes])}::intent::${page}::${transcript.toLowerCase().trim()}::${safeAlternatives.join('|').toLowerCase()}`;
    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey);
    }

    // 1. Try Voice AI Service (Supabase Edge Function with Gemini)
    try {
      const allIntents = new Set([
        ...Object.keys(globalCommands),
        ...Object.keys(availableCommands)
      ]);

      const actions = Array.from(allIntents).map(intent => {
        const customDesc = (availableCommands[intent] || globalCommands[intent] || '').toString();
        const baseDesc = MULTILINGUAL_ACTION_DESCRIPTIONS[intent] || intent.replace(/_/g, ' ');
        return {
          intent,
          description: customDesc && customDesc !== intent ? `${baseDesc} | ${customDesc}` : baseDesc
        };
      });
      
      let result = null;
      if (this.isAvailable) {
        result = await voiceAIService.understand({
          transcript,
          language: language || 'auto',
          pageId: page || 'interactive',
          actions,
          routes: routes.map(r => ({ id: r.id, description: r.description })),
          expectsFreeText: Boolean(expectsFreeText),
          recognitionAlternatives: safeAlternatives,
        });
      }

      if (result && result.intent) {
        // Preserve semantic decisions, including clarification and free-form data.
        this._cache.set(cacheKey, result);
        if (this._cache.size > 150) {
          const firstKey = this._cache.keys().next().value;
          this._cache.delete(firstKey);
        }
        return result;
      }
    } catch (e) {
      console.warn("Cloud AI intent understanding unavailable, using smart multilingual engine fallback:", e);
    }

    if (expectsFreeText) return { intent: 'free_text', confidence: 1, value: transcript };

    // 2. Multilingual Semantic Fallback (Handles all 9 Indian languages offline)
    const fallbackResult = this._multilingualFallbackIntent(transcript, availableCommands, globalCommands, ctx);
    if (fallbackResult) {
      this._cache.set(cacheKey, fallbackResult);
      return fallbackResult;
    }

    return null;
  }

  /**
   * Comprehensive offline intent classification across all 9 Indian languages
   */
  _multilingualFallbackIntent(transcript, availableCommands = {}, globalCommands = {}, ctx = {}) {
    const raw = (transcript || '').toLowerCase().trim();
    if (!raw) return null;

    // 1. Language switching
    if (/\b(?:hindi|हिंदी|हिन्दी|hindi me|hindi mein)\b/i.test(raw)) return { intent: 'set_language_hi', confidence: 0.98, message: 'भाषा हिन्दी में बदल दी गई है।' };
    if (/\b(?:tamil|தமிழ்|tamil il|tamizhil)\b/i.test(raw)) return { intent: 'set_language_ta', confidence: 0.98, message: 'மொழி தமிழாக மாற்றப்பட்டது.' };
    if (/\b(?:telugu|తెలుగు|telugu lo)\b/i.test(raw)) return { intent: 'set_language_te', confidence: 0.98, message: 'భాష తెలుగులోకి మార్చబడింది.' };
    if (/\b(?:bengali|bangla|বাংলা|bangla te)\b/i.test(raw)) return { intent: 'set_language_bn', confidence: 0.98, message: 'ভাষা বাংলায় পরিবর্তিত হয়েছে।' };
    if (/\b(?:marathi|मराठी|marathi madhe)\b/i.test(raw)) return { intent: 'set_language_mr', confidence: 0.98, message: 'भाषा मराठीत बदलली आहे.' };
    if (/\b(?:gujarati|ગુજરાતી|gujarati ma)\b/i.test(raw)) return { intent: 'set_language_gu', confidence: 0.98, message: 'ભાષા ગુજરાતીમાં બદલાઈ ગઈ છે.' };
    if (/\b(?:kannada|ಕನ್ನಡ|kannada dalli)\b/i.test(raw)) return { intent: 'set_language_kn', confidence: 0.98, message: 'ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ.' };
    if (/\b(?:malayalam|മലയാളം|malayalam il)\b/i.test(raw)) return { intent: 'set_language_ml', confidence: 0.98, message: 'ഭാഷ മലയാളത്തിലേക്ക് മാറ്റി.' };
    if (/\b(?:english|angrezi|ஆங்கிலம்|ఆంగ్లం|ইংরেজি|ઇંગ્લિશ|ಆಂಗ್ಲ|ഇംഗ്ലീഷ്)\b/i.test(raw)) return { intent: 'set_language_en', confidence: 0.98, message: 'Language switched to English.' };

    // 2. Emergency / SOS
    if (/\b(?:emergency|sos|108|102|ambulance|bachao|aapatkaal|avasaram|atyavasaram|sahayam|sahayyam|urgent)\b/i.test(raw)) {
      return { intent: 'emergency', confidence: 0.99, message: 'Emergency service 108 is being connected.' };
    }

    // 3. Doctor & Appointment (all 9 languages + Hinglish)
    if (
      /\b(?:doctor|daktar|chikitsak|vaidya|vaidyudu|maruthuvar|maruthuvarai|appointment|milna|dikhana|bimar|tabiyat|ilaaj|treatment|santhikka|parkka|kalavali|chupinchu|dekhate|bhetaycha|dakhavaycha|malvu|batavvu|nodabeku|kaananam|consult|checkup|specialist|hospital|cardio|ortho|derma|neuro|fever|dard|pain|headache|bukhar)\b/i.test(raw)
    ) {
      return { intent: 'bookAppointment', confidence: 0.92, message: 'Opening doctor appointment.' };
    }

    // 4. Scan / Prescription
    if (/\b(?:scan|parcha|prescription|document|dastavej|camera|photo|upload|marundhu|mandu|patrika|kagad)\b/i.test(raw)) {
      return { intent: 'scan_document', confidence: 0.92, message: 'Opening document scan.' };
    }

    // 5. Reports & Lab Results
    if (/\b(?:report|reports|lab|test|blood test|nateeja|parikshan|arikkai|pariksha|tapasani)\b/i.test(raw)) {
      return { intent: 'viewReports', confidence: 0.92, message: 'Showing lab reports and records.' };
    }

    // 6. Medical History
    if (/\b(?:history|itihas|purana|purani|past visit|pichli|varalaru|charitra|adhichi|atiter)\b/i.test(raw)) {
      return { intent: 'viewHistory', confidence: 0.90, message: 'Showing past medical history.' };
    }

    // 7. Blood & Organ Donations
    if (/\b(?:blood|raktdan|rakt|raktham|roktodan|rakta|donation|donations|donor|organ)\b/i.test(raw)) {
      return { intent: 'viewDonations', confidence: 0.90, message: 'Opening blood and donation services.' };
    }

    // 8. Community & Support Groups
    if (/\b(?:community|group|support group|samajik|mandal|samuh|charcha|patient group)\b/i.test(raw)) {
      return { intent: 'viewCommunities', confidence: 0.90, message: 'Opening patient communities.' };
    }

    // 9. Help & FAQ
    if (/\b(?:help|support|madad|sahayata|sahayam|faq|kaise|kivabe|guidance)\b/i.test(raw)) {
      return { intent: 'viewHelp', confidence: 0.90, message: 'Opening help and support.' };
    }

    // 10. Profile & ABHA Card
    if (/\b(?:profile|abha|aadhaar|account|meri jankari|identity|card|health card)\b/i.test(raw)) {
      return { intent: 'viewProfile', confidence: 0.90, message: 'Opening your health profile.' };
    }

    // 11. Ayush / Ayurveda
    if (/\b(?:ayush|ayurveda|ayurvedic|homeopathy|unani|desi ilaaj|herbal)\b/i.test(raw)) {
      return { intent: 'toggleAyush', confidence: 0.90, message: 'Toggling AYUSH mode.' };
    }

    // 12. Controls
    if (/\b(?:home|main page|landing|mukhya|shuruat)\b/i.test(raw)) return { intent: 'home', confidence: 0.95, message: 'Going to home page.' };
    if (/\b(?:back|peeche|piche|wapas|pinnadi|venakki|hinde|pirakil)\b/i.test(raw)) return { intent: 'back', confidence: 0.95, message: 'Going back.' };
    if (/\b(?:next|aage|muthal|mundhu|porer|pudhe|aagal|munde|aduthathu|continue)\b/i.test(raw)) return { intent: 'next', confidence: 0.95, message: 'Continuing.' };

    return null;
  }

  /**
   * Intelligently understands, thinks, and extracts patient registration & medical details using Gemini AI.
   * Handles arbitrary sentence ordering, self-corrections, all 9 Indian languages, multi-sentence stories, and symptoms.
   */
  async extractRegistrationDetails(transcript, language = 'en', context = {}) {
    if (!transcript || transcript.trim().length === 0) return null;

    const cacheKey = `extract::${language}::${JSON.stringify(context)}::${transcript.toLowerCase().trim()}`;
    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey);
    }

    const fallback = this._genericFallback(transcript);

    // 1. Primary: Grok AI through VoiceAIService Edge Function
    if (this.isAvailable) {
      try {
        const parsed = await voiceAIService.extractRegistration(transcript, language, context);
        if (parsed && !parsed.error) {
          const phone = normalizeDigits(parsed.phone).replace(/\D/g, '');
          const age = normalizeDigits(parsed.age).match(/\d{1,3}/)?.[0] || '';
          const normalizedGender = ['Male', 'Female', 'Other'].includes(parsed.gender) ? parsed.gender : '';
          const res = {
            name: (parsed.name && parsed.name.trim().length >= 2) ? parsed.name.trim() : fallback.name,
            age: (Number(age) >= 1 && Number(age) <= 120) ? age : fallback.age,
            phone: phone.length === 10 ? phone : (fallback.phone.length === 10 ? fallback.phone : phone),
            gender: normalizedGender || fallback.gender,
            symptoms: parsed.symptoms || fallback.symptoms || '',
            symptomList: Array.isArray(parsed.symptomList) ? parsed.symptomList : [],
            abhaId: parsed.abhaId || fallback.abhaId || null,
            aadhaar: parsed.aadhaar || fallback.aadhaar || null,
            doctor: parsed.doctor || null,
            department: parsed.department || null,
            date: parsed.date || null,
            time: parsed.time || null,
            detectedLanguage: parsed.detectedLanguage || language,
            confirmationMessage: parsed.confirmationMessage || null,
            requestedAction: parsed.requestedAction || 'none'
          };
          if (res.name || res.age || res.phone || res.abhaId || res.aadhaar || res.symptoms || res.requestedAction !== 'none') {
            this._cache.set(cacheKey, res);
            return res;
          }
        }
      } catch (err) {
        console.warn("Grok AI extraction notice, attempting fallback:", err);
      }
    }

    // 2. Secondary Direct AI Intelligence fallback
    if (import.meta.env.VITE_GEMINI_API_KEY) {
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const prompt = `You are a medical kiosk intelligent multilingual entity and detail extraction AI for Swasthya Setu.
The patient can speak naturally in ANY of 9 Indian languages (Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada, Malayalam, English, Hinglish, or any regional dialect), in ANY order, with self-corrections, background story, or symptoms.

Analyze the user's speech, think carefully, and extract any relevant fields found.
If user self-corrects (e.g. "Suresh nahi Ramesh", "30 nahi 35", "phone 987... nahi 984..."), ALWAYS use the corrected value.

Return ONLY a JSON object (no markdown, no backticks) matching this schema:
{
  "name": string or null (clean patient full name in Title Case, e.g. "Ramesh Kumar"),
  "age": string or null (age as number string, e.g. "35"),
  "gender": "Male" | "Female" | "Other" | null,
  "phone": string or null (10-digit clean mobile number, convert any spoken number words into digits),
  "symptoms": string or null (medical symptoms or complaint described, e.g. "Fever and headache for 2 days"),
  "symptomList": array of strings (e.g. ["Fever", "Headache"]),
  "abhaId": string or null (14-digit ABHA ID formatted e.g. "12-3456-7890-1234" if spoken, else null),
  "aadhaar": string or null (12-digit Aadhaar number if spoken, else null),
  "doctor": string or null (doctor name if mentioned),
  "department": string or null (specialty like Cardiology, General Medicine, Pediatrics if mentioned),
  "date": string or null (preferred appointment date/day),
  "time": string or null (preferred appointment time),
  "detectedLanguage": string (e.g. "Hindi", "Tamil", "English"),
  "confirmationMessage": string (a polite, friendly confirmation in the patient's spoken language acknowledging the details found)
}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${prompt}\n\nPatient Spoken Speech: "${transcript}"` }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
              maxOutputTokens: 512
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          let rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          rawJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(rawJson);

          const phone = String(parsed.phone || fallback.phone || '').replace(/\D/g, '');
          const age = String(parsed.age || fallback.age || '').match(/\d{1,3}/)?.[0] || '';
          const normalizedGender = ['Male', 'Female', 'Other'].includes(parsed.gender) ? parsed.gender : fallback.gender;

          const result = {
            name: (parsed.name && parsed.name.trim().length >= 2) ? parsed.name.trim() : fallback.name,
            age: (Number(age) >= 1 && Number(age) <= 120) ? age : fallback.age,
            phone: phone.length === 10 ? phone : (fallback.phone.length === 10 ? fallback.phone : phone),
            gender: normalizedGender || fallback.gender,
            symptoms: parsed.symptoms || fallback.symptoms || '',
            symptomList: Array.isArray(parsed.symptomList) ? parsed.symptomList : [],
            abhaId: parsed.abhaId || fallback.abhaId || null,
            aadhaar: parsed.aadhaar || fallback.aadhaar || null,
            doctor: parsed.doctor || null,
            department: parsed.department || null,
            date: parsed.date || null,
            time: parsed.time || null,
            detectedLanguage: parsed.detectedLanguage || language,
            confirmationMessage: parsed.confirmationMessage || null,
            requestedAction: parsed.requestedAction || 'none'
          };

          this._cache.set(cacheKey, result);
          return result;
        }
      } catch (err) {
        console.warn("Direct extraction error, trying fallback:", err);
      }
    }

    // 3. Robust Multilingual Local Extraction Engine (Handles all 9 Indian languages offline)
    this._cache.set(cacheKey, fallback);
    return fallback;
  }

  /**
   * Advanced multi-lingual regex and NLP parser across all 9 Indian languages.
   * Tolerates arbitrary ordering, self-corrections ("30 nahi 32"), code-mixing, and symptom descriptions.
   */
  _genericFallback(transcript) {
    const result = { name: '', age: '', gender: '', phone: '', symptoms: '', abhaId: null, aadhaar: null };
    if (!transcript) return result;

    let working = this._convertSpokenNumberWords(transcript).trim();

    // 1. Phone extraction (10-digit Indian standard mobile starting with 6-9, or any 10 consecutive digits)
    // Handles self-corrections: "phone 9876543210 nahi 9876543211" -> selects last
    const allPhones = working.match(/\b[6-9]\d{9}\b/g) || working.match(/\b\d{10}\b/g);
    if (allPhones && allPhones.length > 0) {
      result.phone = allPhones[allPhones.length - 1]; // Pick latest/corrected phone
      working = working.replace(result.phone, ' ');
    }

    // 2. Gender extraction (English + 9 Indian languages)
    const femalePattern = /\b(?:female|woman|girl|lady|mahila|stri|stree|aurat|pen|pennu|aada|sthree|பெண்|மహిళ|మహిళలు|ಮಹಿಳೆ|സ്ത്രീ|মহিলা|સ્ત્રી|महिला|स्त्री|औरत)\b/i;
    const malePattern = /\b(?:male|man|boy|guy|purush|aadmi|aan|aannu|maga|purushan|purushudu|पुरुष|ஆண்|పురుషుడు|ಪುರುಷ|പുരുഷൻ|পুরুষ|પુરુષ|आदमी)\b/i;
    const otherPattern = /\b(?:other|transgender|trans|tritiya panthi|anya|अन्य|மற்றவை|ఇతర|ಇತರ|മറ്റുള്ളവ)\b/i;

    if (femalePattern.test(working)) {
      result.gender = 'Female';
    } else if (malePattern.test(working)) {
      result.gender = 'Male';
    } else if (otherPattern.test(working)) {
      result.gender = 'Other';
    }

    // 3. Age extraction (handles self-corrections: "30 nahi 35", "25 illa 28", "40 sorry 42", "20 no 22")
    const corrAge = working.match(/\b\d{1,3}\s*(?:nahi|nahin|no|sorry|wait|not|illa|kaadhu|alla|badil)\s*(\d{1,3})\b/i);
    if (corrAge) {
      result.age = corrAge[1];
    } else {
      const ageMatch = working.match(/(?:age|umar|umr|varsh|vayas|vayasu|vayassu|boyos|vaya|वयസ്സ്|வயது|ವಯಸ್ಸು|उम्र|साल|ವರ್ಷ|বছর|વર્ષ|वर्ष)\s*(?:is|hai|ahe|undi|irukku|aano)?\s*[:\-]?\s*(\d{1,3})/i)
        || working.match(/(\d{1,3})\s*(?:years old|year old|years|year|saal|sal|varsh|vayas|vayasu|vayassu|boyos|vaya|വയസ്സ്|வயது|साल|ವರ್ಷ|বছর|વર્ષ|वर्ष)/i)
        || working.match(/\b([1-9][0-9]?|1[01][0-9])\b/);
      if (ageMatch && !result.phone.includes(ageMatch[1])) {
        result.age = ageMatch[1];
      }
    }

    // 4. Symptoms / Chief Complaint extraction
    const symptomMatch = working.match(/(?:symptom|symptoms|problem|takleef|dard|problem hai|dikkat|bimari|dokh|shomossha|samassye|prasnam|prechanai|novvu|kaichal|vali|fever|cough|cold|headache|pain|bukhar|sar dard|pet dard)\s*[:\-]?\s*([a-zA-Z\u0900-\u0D7F\s,]{3,80})/i)
      || working.match(/\b(?:sar\s*dard|pet\s*dard|bukhar|khasi|jukham|ulti|chakkar|fever|cough|chest\s*pain|headache|back\s*pain|vomiting|dizziness|fever|body\s*pain|jwar|kaychal|thalavali|vayitru\s*vali)\b/i);
    if (symptomMatch) {
      result.symptoms = symptomMatch[0].trim();
    }

    // 5. ABHA extraction (14 digits)
    const abhaMatch = working.match(/\b\d{2}-\d{4}-\d{4}-\d{4}\b/) || working.match(/\b\d{14}\b/);
    if (abhaMatch) {
      const d = abhaMatch[0].replace(/\D/g, '');
      result.abhaId = `${d.slice(0,2)}-${d.slice(2,6)}-${d.slice(6,10)}-${d.slice(10,14)}`;
    }

    // 6. Aadhaar extraction (12 digits)
    const aadhaarMatch = working.match(/\b\d{4}\s*\d{4}\s*\d{4}\b/) || working.match(/\b\d{12}\b/);
    if (aadhaarMatch) {
      result.aadhaar = aadhaarMatch[0].replace(/\D/g, '');
    }

    // 7. Name extraction across all 9 Indian languages
    const namePrefixes = /(?:mera\s*naam|mera\s*nam|my\s*name\s*is|name\s*is|patient\s*name|naam\s*(?:hai|ahe)?|myself|i\s*am|this\s*is|call\s*me|en\s*peyar|en\s*peyaru|ennudaiya\s*peyar|naa\s*peru|na\s*peru|amar\s*naam|amar\s*nam|maaze\s*naav|maze\s*nav|maro\s*naam|maru\s*naam|nanna\s*hesaru|ente\s*peru|பெயர்|என்\s*பெயர்|పేరు|నా\s*పేరు|ಹೆಸರು|ನನ್ನ\s*ಹೆಸರು|নাম|আমার\s*নাম|नाव|माझे\s*नाव|નામ|મારું\s*નામ|പേര്|എന്റെ\s*പേര്)\s*[:\-]?\s*([a-zA-Z\u0900-\u0D7F\s]{2,40})/i;
    const nameMatch = working.match(namePrefixes);
    if (nameMatch) {
      let candidate = nameMatch[1]
        .replace(/\b(?:doctor|sahab|sir|madam|please|patient|male|female|purush|mahila|umar|age|phone|number|hai|hain|hu|hoon|bol|raha|rahi|and|or|years|saal|sal|varsh|vayas|vaya|boyos|aan|pen|stree|stri|aadhar|abha)\b/gi, ' ')
        .replace(/[0-9!@#$%^&*()_+={}[\]:;"'<>,.?/\\|`~]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Handle self-corrections in name: "Suresh nahi Ramesh Kumar" → "Ramesh Kumar"
      const nameCorrMatch = candidate.match(/^(.+?)\s+(?:nahi|nahin|no|not|sorry|wait|illa|kaadhu|alla|actually|correction|iska matlab)\s+(.+)$/i);
      if (nameCorrMatch) {
        candidate = nameCorrMatch[2].trim();
      }

      const tokens = candidate.split(' ').filter(w => w.length >= 2);
      if (tokens.length >= 1 && tokens.length <= 4) {
        result.name = tokens.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
    }

    return result;
  }

  // Clear cache (e.g., on page change)
  clearCache() {
    this._cache.clear();
  }
}

const aiCommandEngine = new AICommandEngine();
export default aiCommandEngine;
