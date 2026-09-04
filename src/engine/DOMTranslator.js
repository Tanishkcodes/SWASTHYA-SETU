import { UI_STRINGS } from '../voicenav/LanguagePack';
import voiceAIService from '../voicenav/VoiceAIService';
import { MULTI_DICT } from './AiTranslationService';

const OFFLINE_UI_TRANSLATIONS = {
  hi: {
    'Patient': 'मरीज़', 'patient': 'मरीज़', 'Patients': 'मरीज़', 'Avg Time Saved per patient': 'प्रति मरीज़ औसत समय की बचत', 'Regional Languages Supported': 'समर्थित क्षेत्रीय भाषाएँ', 'Patients Triaged Successfully': 'मरीज़ों की सफल जाँच', 'Intelligent Triage': 'बुद्धिमान प्राथमिक जाँच', 'Enter Portal': 'पोर्टल खोलें',
    'Self-service kiosk for patients to provide their history in their native language before seeing the doctor.': 'डॉक्टर से मिलने से पहले मरीज अपनी भाषा में स्वास्थ्य इतिहास दर्ज कर सकते हैं।', 'Secure dashboard to review AI-generated clinical summaries and manage patient records efficiently.': 'एआई क्लिनिकल सारांश देखने और मरीज रिकॉर्ड संभालने के लिए सुरक्षित डैशबोर्ड।', 'Centralized hub for managing patient registrations, system settings, and hospital staff accounts.': 'मरीज पंजीकरण, सिस्टम सेटिंग और अस्पताल कर्मचारियों के खातों के लिए केंद्रीकृत केंद्र।', 'Terms of Service': 'सेवा की शर्तें', 'Privacy Policy': 'गोपनीयता नीति', 'All rights reserved.': 'सर्वाधिकार सुरक्षित।'
  },
  ta: {
    'Avg Time Saved per patient': 'ஒரு நோயாளிக்கு சேமிக்கப்படும் சராசரி நேரம்', 'Regional Languages Supported': 'ஆதரிக்கப்படும் பிராந்திய மொழிகள்', 'Patients Triaged Successfully': 'வெற்றிகரமாக பரிசோதிக்கப்பட்ட நோயாளிகள்', 'Intelligent Triage': 'நுண்ணறிவு முதல்நிலை பரிசோதனை', 'Enter Portal': 'தளத்தைத் திறக்கவும்', 'Self-service kiosk for patients to provide their history in their native language before seeing the doctor.': 'மருத்துவரைச் சந்திக்கும் முன் நோயாளிகள் தங்கள் மொழியில் மருத்துவ வரலாற்றைப் பதிவு செய்யலாம்.', 'Secure dashboard to review AI-generated clinical summaries and manage patient records efficiently.': 'AI மருத்துவச் சுருக்கங்களையும் நோயாளர் பதிவுகளையும் நிர்வகிக்கும் பாதுகாப்பான தளம்.', 'Centralized hub for managing patient registrations, system settings, and hospital staff accounts.': 'நோயாளர் பதிவு, அமைப்புகள் மற்றும் மருத்துவமனை பணியாளர் கணக்குகளுக்கான மையம்.', 'Terms of Service': 'சேவை விதிமுறைகள்', 'Privacy Policy': 'தனியுரிமைக் கொள்கை', 'All rights reserved.': 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.'
  },
  te: {
    'Avg Time Saved per patient': 'ఒక్కో రోగికి ఆదా అయ్యే సగటు సమయం', 'Regional Languages Supported': 'మద్దతు ఉన్న ప్రాంతీయ భాషలు', 'Patients Triaged Successfully': 'విజయవంతంగా పరీక్షించిన రోగులు', 'Intelligent Triage': 'తెలివైన ప్రాథమిక పరీక్ష', 'Enter Portal': 'పోర్టల్ తెరవండి', 'Self-service kiosk for patients to provide their history in their native language before seeing the doctor.': 'డాక్టర్‌ను కలిసే ముందు రోగులు తమ భాషలో ఆరోగ్య చరిత్రను నమోదు చేయవచ్చు.', 'Secure dashboard to review AI-generated clinical summaries and manage patient records efficiently.': 'AI క్లినికల్ సారాంశాలు మరియు రోగి రికార్డుల కోసం సురక్షిత డాష్‌బోర్డ్.', 'Centralized hub for managing patient registrations, system settings, and hospital staff accounts.': 'రోగి నమోదులు, సిస్టమ్ సెట్టింగులు మరియు సిబ్బంది ఖాతాల కేంద్రం.', 'Terms of Service': 'సేవా నిబంధనలు', 'Privacy Policy': 'గోప్యతా విధానం', 'All rights reserved.': 'అన్ని హక్కులు పరిరక్షించబడ్డాయి.'
  },
  bn: {
    'Avg Time Saved per patient': 'প্রতি রোগীর গড় সময় সাশ্রয়', 'Regional Languages Supported': 'সমর্থিত আঞ্চলিক ভাষা', 'Patients Triaged Successfully': 'সফলভাবে যাচাই করা রোগী', 'Intelligent Triage': 'বুদ্ধিমান প্রাথমিক যাচাই', 'Enter Portal': 'পোর্টাল খুলুন', 'Self-service kiosk for patients to provide their history in their native language before seeing the doctor.': 'ডাক্তারের সঙ্গে দেখা করার আগে রোগীরা নিজের ভাষায় স্বাস্থ্য ইতিহাস লিখতে পারেন।', 'Secure dashboard to review AI-generated clinical summaries and manage patient records efficiently.': 'AI ক্লিনিক্যাল সারাংশ ও রোগীর রেকর্ড পরিচালনার নিরাপদ ড্যাশবোর্ড।', 'Centralized hub for managing patient registrations, system settings, and hospital staff accounts.': 'রোগী নিবন্ধন, সিস্টেম সেটিংস ও হাসপাতাল কর্মীদের অ্যাকাউন্টের কেন্দ্রীয় কেন্দ্র।', 'Terms of Service': 'পরিষেবার শর্তাবলি', 'Privacy Policy': 'গোপনীয়তা নীতি', 'All rights reserved.': 'সর্বস্বত্ব সংরক্ষিত।'
  },
  mr: {
    'Avg Time Saved per patient': 'प्रति रुग्ण सरासरी वेळेची बचत', 'Regional Languages Supported': 'समर्थित प्रादेशिक भाषा', 'Patients Triaged Successfully': 'यशस्वी तपासणी झालेले रुग्ण', 'Intelligent Triage': 'बुद्धिमान प्राथमिक तपासणी', 'Enter Portal': 'पोर्टल उघडा', 'Self-service kiosk for patients to provide their history in their native language before seeing the doctor.': 'डॉक्टरांना भेटण्यापूर्वी रुग्ण त्यांच्या भाषेत आरोग्य इतिहास नोंदवू शकतात.', 'Secure dashboard to review AI-generated clinical summaries and manage patient records efficiently.': 'AI क्लिनिकल सारांश आणि रुग्ण नोंदींसाठी सुरक्षित डॅशबोर्ड.', 'Centralized hub for managing patient registrations, system settings, and hospital staff accounts.': 'रुग्ण नोंदणी, सिस्टम सेटिंग्ज आणि कर्मचारी खात्यांचे केंद्रीय केंद्र.', 'Terms of Service': 'सेवा अटी', 'Privacy Policy': 'गोपनीयता धोरण', 'All rights reserved.': 'सर्व हक्क राखीव.'
  },
  gu: {
    'Avg Time Saved per patient': 'દર દર્દી દીઠ બચેલો સરેરાશ સમય', 'Regional Languages Supported': 'સમર્થિત પ્રાદેશિક ભાષાઓ', 'Patients Triaged Successfully': 'સફળતાપૂર્વક તપાસાયેલા દર્દીઓ', 'Intelligent Triage': 'બુદ્ધિશાળી પ્રાથમિક તપાસ', 'Enter Portal': 'પોર્ટલ ખોલો', 'Self-service kiosk for patients to provide their history in their native language before seeing the doctor.': 'ડૉક્ટરને મળતા પહેલાં દર્દીઓ પોતાની ભાષામાં આરોગ્ય ઇતિહાસ નોંધાવી શકે છે.', 'Secure dashboard to review AI-generated clinical summaries and manage patient records efficiently.': 'AI ક્લિનિકલ સારાંશ અને દર્દીના રેકોર્ડ માટે સુરક્ષિત ડેશબોર્ડ.', 'Centralized hub for managing patient registrations, system settings, and hospital staff accounts.': 'દર્દી નોંધણી, સિસ્ટમ સેટિંગ અને સ્ટાફ ખાતાઓનું કેન્દ્ર.', 'Terms of Service': 'સેવાની શરતો', 'Privacy Policy': 'ગોપનીયતા નીતિ', 'All rights reserved.': 'બધા હકો સુરક્ષિત.'
  },
  kn: {
    'Avg Time Saved per patient': 'ಪ್ರತಿ ರೋಗಿಗೆ ಉಳಿಯುವ ಸರಾಸರಿ ಸಮಯ', 'Regional Languages Supported': 'ಬೆಂಬಲಿತ ಪ್ರಾದೇಶಿಕ ಭಾಷೆಗಳು', 'Patients Triaged Successfully': 'ಯಶಸ್ವಿಯಾಗಿ ತಪಾಸಣೆಗೊಂಡ ರೋಗಿಗಳು', 'Intelligent Triage': 'ಬುದ್ಧಿವಂತ ಪ್ರಾಥಮಿಕ ತಪಾಸಣೆ', 'Enter Portal': 'ಪೋರ್ಟಲ್ ತೆರೆಯಿರಿ', 'Self-service kiosk for patients to provide their history in their native language before seeing the doctor.': 'ವೈದ್ಯರನ್ನು ಭೇಟಿಯಾಗುವ ಮೊದಲು ರೋಗಿಗಳು ತಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಆರೋಗ್ಯ ಇತಿಹಾಸ ದಾಖಲಿಸಬಹುದು.', 'Secure dashboard to review AI-generated clinical summaries and manage patient records efficiently.': 'AI ಕ್ಲಿನಿಕಲ್ ಸಾರಾಂಶ ಮತ್ತು ರೋಗಿ ದಾಖಲೆಗಳ ಸುರಕ್ಷಿತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್.', 'Centralized hub for managing patient registrations, system settings, and hospital staff accounts.': 'ರೋಗಿ ನೋಂದಣಿ, ಸಿಸ್ಟಂ ಸೆಟ್ಟಿಂಗ್ ಮತ್ತು ಸಿಬ್ಬಂದಿ ಖಾತೆಗಳ ಕೇಂದ್ರ.', 'Terms of Service': 'ಸೇವಾ ನಿಯಮಗಳು', 'Privacy Policy': 'ಗೌಪ್ಯತಾ ನೀತಿ', 'All rights reserved.': 'ಎಲ್ಲ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.'
  },
  ml: {
    'Avg Time Saved per patient': 'ഓരോ രോഗിക്കും ലാഭിക്കുന്ന ശരാശരി സമയം', 'Regional Languages Supported': 'പിന്തുണയ്ക്കുന്ന പ്രാദേശിക ഭാഷകൾ', 'Patients Triaged Successfully': 'വിജയകരമായി പരിശോധിച്ച രോഗികൾ', 'Intelligent Triage': 'ബുദ്ധിപരമായ പ്രാഥമിക പരിശോധന', 'Enter Portal': 'പോർട്ടൽ തുറക്കുക', 'Self-service kiosk for patients to provide their history in their native language before seeing the doctor.': 'ഡോക്ടറെ കാണുന്നതിന് മുമ്പ് രോഗികൾക്ക് സ്വന്തം ഭാഷയിൽ ആരോഗ്യ ചരിത്രം രേഖപ്പെടുത്താം.', 'Secure dashboard to review AI-generated clinical summaries and manage patient records efficiently.': 'AI ക്ലിനിക്കൽ സംഗ്രഹങ്ങളും രോഗി രേഖകളും കൈകാര്യം ചെയ്യാനുള്ള സുരക്ഷിത ഡാഷ്ബോർഡ്.', 'Centralized hub for managing patient registrations, system settings, and hospital staff accounts.': 'രോഗി രജിസ്ട്രേഷൻ, സിസ്റ്റം ക്രമീകരണം, ജീവനക്കാരുടെ അക്കൗണ്ടുകൾ എന്നിവയുടെ കേന്ദ്രം.', 'Terms of Service': 'സേവന നിബന്ധനകൾ', 'Privacy Policy': 'സ്വകാര്യതാ നയം', 'All rights reserved.': 'എല്ലാ അവകാശങ്ങളും സംരക്ഷിതം.'
  }
};

class DOMTranslator {
  constructor() {
    this.isActive = false;
    this.targetLang = 'en';
    this.observer = null;
    this.batch = new Map();
    this.batchTimeout = null;
    this.appliedTexts = new WeakMap();
    this.originalTexts = new WeakMap(); // Maps TextNode -> original English string
    this.translationCache = new Map(); // Maps "lang:english_text" -> "translated_text"
    this.isTranslating = false;
    this.englishKeys = new Map(Object.entries(UI_STRINGS.en || {}).map(([key, text]) => [text, key]));
  }

  start(langCode) {
    const languageChanged = this.targetLang !== langCode;
    this.targetLang = langCode;
    if (languageChanged) {
      if (this.batchTimeout) clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
      this.batch.clear();
    }
    if (langCode === 'en') {
      this.stop();
      return;
    }

    if (!this.isActive) {
      this.isActive = true;
      this._initObserver();
    }
    this._queueFullDOM();
  }

  triggerFullScan() {
    if (this.targetLang && this.targetLang !== 'en') {
      if (!this.isActive) {
        this.isActive = true;
        this._initObserver();
      }
      this._queueFullDOM();
    }
  }

  stop() {
    this.isActive = false;
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    // Revert all known text nodes to original
    this._revertDOM();
  }

  _initObserver() {
    this.observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      for (const mut of mutations) {
        if (mut.type === 'childList') {
          mut.addedNodes.forEach(node => {
            if (this._isValidTextNode(node)) {
              this._queueNode(node);
              shouldProcess = true;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              ['placeholder', 'title', 'alt', 'aria-label'].forEach(attr => {
                if (node.hasAttribute(attr)) { this._queueAttribute(node, attr); shouldProcess = true; }
              });
              const walker = document.createTreeWalker(node, NodeFilter.SHOW_ALL, null, false);
              let childNode;
              while ((childNode = walker.nextNode())) {
                if (this._isValidTextNode(childNode)) {
                  this._queueNode(childNode);
                  shouldProcess = true;
                } else if (childNode.nodeType === Node.ELEMENT_NODE) {
                  ['placeholder', 'title', 'alt', 'aria-label'].forEach(attr => {
                    if (childNode.hasAttribute(attr)) {
                      this._queueAttribute(childNode, attr);
                      shouldProcess = true;
                    }
                  });
                }
              }
            }
          });
        } else if (mut.type === 'characterData') {
          if (this._isValidTextNode(mut.target)) {
             if (!mut.target._isTranslating) {
                this._queueNode(mut.target);
                shouldProcess = true;
             }
          }
        } else if (mut.type === 'attributes') {
          if (['placeholder', 'title', 'alt', 'aria-label'].includes(mut.attributeName) && !mut.target._isTranslatingAttr) {
            this._queueAttribute(mut.target, mut.attributeName);
            shouldProcess = true;
          }
        }
      }
      if (shouldProcess) this._scheduleBatch();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'alt', 'aria-label']
    });
  }

  _isValidTextNode(node) {
    if (node.nodeType !== Node.TEXT_NODE) return false;
    const parent = node.parentElement;
    if (!parent) return false;
    
    const tag = parent.tagName.toLowerCase();
    // Ignore script, style, noscript, etc.
    if (['script', 'style', 'noscript', 'code'].includes(tag)) return false;
    // Ignore elements marked as notranslate
    if (parent.closest('.notranslate, [translate="no"]')) return false;
    // Ignore empty or just whitespace
    if (!node.nodeValue || !node.nodeValue.trim()) return false;
    // Ignore numbers/symbols only
    if (!/[\p{L}]/u.test(node.nodeValue)) return false;
    if (this.originalTexts.has(node) && this.appliedTexts.get(node) === node.nodeValue) return true;
    // If text already contains Indic script, React or dictionary already translated it; do NOT queue or overwrite!
    if (/[\u0900-\u0D7F]/.test(node.nodeValue)) return false;

    return true;
  }

  _queueFullDOM() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ALL, null, false);
    let node;
    let found = false;
    while ((node = walker.nextNode())) {
      if (this._isValidTextNode(node)) {
        this._queueNode(node);
        found = true;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        ['placeholder', 'title', 'alt', 'aria-label'].forEach(attr => {
          if (node.hasAttribute(attr)) {
            this._queueAttribute(node, attr);
            found = true;
          }
        });
      }
    }
    if (found) this._scheduleBatch();
  }

  _queueNode(node) {
    let original = this.originalTexts.get(node);
    if (original && this.appliedTexts.get(node) !== node.nodeValue) {
      original = node.nodeValue;
      this.originalTexts.set(node, original);
    }
    if (!original) {
      original = node.nodeValue;
      this.originalTexts.set(node, original);
    }

    const cleanText = original.trim();
    if (!cleanText) return;

    const knownTranslation = this._knownTranslation(cleanText);
    if (knownTranslation) {
      this._applyTranslation(node, knownTranslation);
      return;
    }

    const cacheKey = `${this.targetLang}:${cleanText}`;
    if (this.translationCache.has(cacheKey)) {
      this._applyTranslation(node, this.translationCache.get(cacheKey));
      return;
    }

    if (!this.batch.has(cleanText)) {
      this.batch.set(cleanText, []);
    }
    this.batch.get(cleanText).push(node);
  }

  _queueAttribute(element, attrName) {
    const value = element.getAttribute(attrName);
    if (element.closest('.notranslate, [translate="no"]') || !value?.trim() || !/[\p{L}]/u.test(value)) return;

    const originalKey = `attr_${attrName}`;
    let original = this.originalTexts.get(element)?.[originalKey];
    if (!original || this.appliedTexts.get(element)?.[attrName] !== value) {
      original = value;
      const map = this.originalTexts.get(element) || {};
      map[originalKey] = original;
      this.originalTexts.set(element, map);
    }

    const cleanText = original.trim();
    if (!cleanText) return;

    const knownTranslation = this._knownTranslation(cleanText);
    if (knownTranslation) {
      this._applyAttrTranslation(element, attrName, knownTranslation);
      return;
    }

    const cacheKey = `${this.targetLang}:${cleanText}`;
    if (this.translationCache.has(cacheKey)) {
      this._applyAttrTranslation(element, attrName, this.translationCache.get(cacheKey));
      return;
    }

    if (!this.batch.has(cleanText)) {
      this.batch.set(cleanText, []);
    }
    this.batch.get(cleanText).push({ type: 'attr', element, attrName });
  }

  _scheduleBatch(delay = 40) {
    if (this.batchTimeout) return;
    this.batchTimeout = setTimeout(() => { this.batchTimeout = null; this._processBatch(); }, delay);
  }

  async _processBatch() {
    if (this.batch.size === 0) return;

    const batchLanguage = this.targetLang;
    const currentBatch = new Map(this.batch);
    this.batch.clear();

    let stringsToTranslate = Array.from(currentBatch.keys());
    if (stringsToTranslate.length === 0) return;

    // Mark nodes as translating to prevent observer loops
    currentBatch.forEach((items) => {
       items.forEach(item => {
         if (item.type === 'attr') item.element._isTranslatingAttr = true;
         else item._isTranslating = true;
       });
    });

    try {
      // Bound concurrency and send multiple labels per request instead of one call per word.
      const chunks = [];
      for (let i = 0; i < stringsToTranslate.length; i += 20) chunks.push(stringsToTranslate.slice(i, i + 20));
      const worker = async () => {
        while (chunks.length && this.targetLang === batchLanguage && this.isActive) {
          const texts = chunks.shift();
          const { translations } = await voiceAIService.batchTranslate(texts, batchLanguage, { strict: true });
          if (!Array.isArray(translations) || translations.length !== texts.length) continue;
          texts.forEach((text, index) => {
            if (translations[index] && translations[index] !== text) this._applyBatchTranslation(currentBatch, batchLanguage, text, translations[index]);
          });
        }
      };
      await Promise.allSettled([worker(), worker()]);
    } catch (e) {
      console.warn("DOMTranslator AI batch failed", e);
    } finally {
       currentBatch.forEach((items) => {
         items.forEach(item => {
           if (item.type === 'attr') item.element._isTranslatingAttr = false;
           else item._isTranslating = false;
         });
      });
    }
  }

  _applyBatchTranslation(currentBatch, language, originalStr, translatedStr) {
    if (!translatedStr) return;
    this.translationCache.set(`${language}:${originalStr}`, translatedStr);
    if (this.targetLang !== language) return;
    const items = currentBatch.get(originalStr) || [];
    items.forEach(item => {
      if (item.type === 'attr') {
        const current = item.element.getAttribute(item.attrName);
        const original = this.originalTexts.get(item.element)?.[`attr_${item.attrName}`];
        if (original?.trim() === originalStr && (current === original || current === this.appliedTexts.get(item.element)?.[item.attrName])) this._applyAttrTranslation(item.element, item.attrName, translatedStr);
      } else {
        const original = this.originalTexts.get(item);
        if (original?.trim() === originalStr && (item.nodeValue === original || item.nodeValue === this.appliedTexts.get(item))) this._applyTranslation(item, translatedStr);
      }
    });
  }

  _knownTranslation(text) {
    if (!this.targetLang || this.targetLang === 'en') return text;
    const lower = text.toLowerCase().trim();
    if (MULTI_DICT && MULTI_DICT[lower] && MULTI_DICT[lower][this.targetLang]) {
      return MULTI_DICT[lower][this.targetLang];
    }
    const english = UI_STRINGS.en || {};
    const target = UI_STRINGS[this.targetLang] || {};
    const key = this.englishKeys.get(text);
    return (key && target[key]) || OFFLINE_UI_TRANSLATIONS[this.targetLang]?.[text] || null;
  }

  _applyAttrTranslation(element, attrName, translatedStr) {
    if (!element.isConnected) return;
    const map = this.originalTexts.get(element) || {};
    const original = map[`attr_${attrName}`] || '';
    const leadingSpace = original.match(/^\s*/)?.[0] || '';
    const trailingSpace = original.match(/\s*$/)?.[0] || '';
    
    element._isTranslatingAttr = true;
    const applied = leadingSpace + translatedStr + trailingSpace;
    this.appliedTexts.set(element, { ...this.appliedTexts.get(element), [attrName]: applied });
    if (element.getAttribute(attrName) !== applied) element.setAttribute(attrName, applied);
    setTimeout(() => { element._isTranslatingAttr = false; }, 50);
  }

  _applyTranslation(node, translatedStr) {
    if (!node.isConnected) return;
    const original = this.originalTexts.get(node) || '';
    // Replace the exact trimmed substring, keeping leading/trailing spaces
    const leadingSpaceMatch = original.match(/^\s*/);
    const trailingSpaceMatch = original.match(/\s*$/);
    const leadingSpace = leadingSpaceMatch ? leadingSpaceMatch[0] : '';
    const trailingSpace = trailingSpaceMatch ? trailingSpaceMatch[0] : '';
    
    node._isTranslating = true;
    const applied = leadingSpace + translatedStr + trailingSpace;
    this.appliedTexts.set(node, applied);
    if (node.nodeValue !== applied) node.nodeValue = applied;
    setTimeout(() => { node._isTranslating = false; }, 50);
  }

  _revertDOM() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ALL, null, false);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE && this.originalTexts.has(node) && this.appliedTexts.get(node) === node.nodeValue) {
        node._isTranslating = true;
        node.nodeValue = this.originalTexts.get(node);
        setTimeout(() => { node._isTranslating = false; }, 50);
      } else if (node.nodeType === Node.ELEMENT_NODE && this.originalTexts.has(node)) {
        const map = this.originalTexts.get(node);
        ['placeholder', 'title', 'alt', 'aria-label'].forEach(attr => {
          if (map[`attr_${attr}`] && this.appliedTexts.get(node)?.[attr] === node.getAttribute(attr)) {
            node._isTranslatingAttr = true;
            node.setAttribute(attr, map[`attr_${attr}`]);
            setTimeout(() => { node._isTranslatingAttr = false; }, 50);
          }
        });
      }
    }
  }
}

const domTranslator = new DOMTranslator();
export default domTranslator;
