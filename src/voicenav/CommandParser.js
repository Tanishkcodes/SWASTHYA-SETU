/* ============================================
   SWASTHYA SETU — Voice Command Parser
   Multi-language intent recognition with fuzzy matching
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
    this.confidenceThreshold = 0.6; // Minimum confidence to accept a command
    this.currentLanguage = 'en';
    this.routes = [];
  }

  setLanguage(lang) {
    this.currentLanguage = lang;
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
  }  // Direct Fast-Path Intent Matcher for all 9 Indian languages (< 2ms response)
  _fastMatchIntent(input, context = {}) {
    const raw = input.toLowerCase().trim();
    const words = raw.split(/\s+/).filter(Boolean);

    // If the page expects free text (like registration or interview), or the user spoke a long sentence (> 3 words)
    // with entities (name, age, phone, numbers, symptoms), do NOT hijack as a 1-word UI navigation command!
    const isDescriptiveSentence = words.length > 3 || /\b(?:naam|name|umar|age|phone|saal|years|number|\d{4,})\b/i.test(raw);
    if (context.expectsFreeText && isDescriptiveSentence) {
      return null;
    }

    // Exact or short command matcher (1 to 3 words)
    if (words.length > 4) {
      return null;
    }

    // 1. Start Session / Begin / Health Session
    if (/^(start|begin|start session|health session|shuru|shuroo|aarambh|kadam|chalu|thodangu|aarambikkavum|prorombho|suru|shuruvaat|thudanguka|aarambha|शुरू|प्रारंभ|आरंभ|தொடங்கு|ప్రారంభించు|শুরু|सुरू|શરૂ|ಪ್ರಾರಂಭಿಸಿ|തുടങ്ങുക)$/i.test(raw) ||
        /\b(?:start session|health session|shuru karo|aage chalo)\b/i.test(raw)) {
      return { intent: 'next', confidence: 0.98, value: null };
    }

    // 2. Next / Continue / Proceed
    if (/^(next|continue|proceed|forward|aage|aduthu|taruvatha|porer|pudhe|aagal|munde|aduthathu|agla|agle|आगे|अடுத்து|తరువాత|পরবর্তী|पुढे|આગળ|ಮುಂದೆ|അടുത്തത്)$/i.test(raw) ||
        /\b(?:aage badho|next page|next question|agla sawal)\b/i.test(raw)) {
      return { intent: 'next', confidence: 0.98, value: null };
    }

    // 3. Back / Previous / Return
    if (/^(back|previous|return|peeche|piche|pinbu|venakki|pechone|maage|paachhal|hinde|pinnottu|pichla|पीछे|பின்பு|వెనుకకు|পেছনে|मागे|પાછળ|ಹಿಂದೆ|പിന്നോട്ട്)$/i.test(raw) ||
        /\b(?:piche jao|peeche jao|go back|back jao)\b/i.test(raw)) {
      return { intent: 'back', confidence: 0.98, value: null };
    }

    // 4. Home / Main Page / Landing
    if (/^(home|homepage|landing|main page|main screen|main menu|mukhya prisht|veedu|illu|bari|ghara|mane|होम|मुखपृष्ठ|முகப்பு|హోమ్|হোম|मुख्यपृष्ठ|ઘર|ಮನೆ|ഹോം)$/i.test(raw)) {
      return { intent: 'home', confidence: 0.98, value: null };
    }

    // 5. Book Appointment / Doctor Checkup / Seeing a Doctor
    if (/^(appointment|book appointment|checkup|dikhana|doctor se milna|doctor dikhana|ilaj|milna|अपॉइंटमेंट|முன்பதிவு|అపాయింట్‌మెంట్|অ্যাপয়েন্টমেন্ট|તપાસ|ಮುಂಗಡ ನೋಂದಣಿ|അപ്പോയിന്റ്മെന്റ്)$/i.test(raw) ||
        /\b(?:book appointment|doctor appointment|doctor dikhao)\b/i.test(raw)) {
      return { intent: 'book_appointment', confidence: 0.98, value: null };
    }

    // 6. Doctor Portal / Physician Login
    if (/^(doctor portal|doctor login|doctor panel|main doctor|physician|physician login|vaidya login|maruthuvar|daakthar login|চিকিৎসক লগইন|డాక్టర్ లాగిన్|மருத்துவர் உள்நுழைவு|વૈદ્ય લૉગિન|ಡಾಕ್ಟರ್ ಲಾಗಿನ್|ഡോക്ടർ ലോഗിൻ|डॉक्टर लॉगिन|डॉक्टर पोर्टल|doctor|dr|physician)$/i.test(raw)) {
      return { intent: 'login_doctor', confidence: 0.98, value: null };
    }

    // 7. Admin Portal / Administrator Login
    if (/^(admin|administrator|sysadmin|admin portal|admin login|staff login|prabandhak|nirvagi|parichalok|nirvahaka|അഡ്മിൻ|व्यवस्थापक|प्रशासक)$/i.test(raw)) {
      return { intent: 'login_admin', confidence: 0.98, value: null };
    }

    // 8. Patient Portal / Patient Login
    if (/^(patient portal|patient login|mareez portal|noyali|rogi|darodi|രോഗി ലോഗിൻ|நோயாளி உள்நுழைவு|రోగి లాగిన్|রোগী লগইন|रुग्ण लॉगिन|દર્દી લૉગિન|ರೋಗಿ ಲಾಗಿನ್|मरीज़ लॉगिन|मरीज पोर्टल|patient|mareez|rogi)$/i.test(raw)) {
      return { intent: 'login_patient', confidence: 0.98, value: null };
    }

    // 9. ABHA Login / ABHA Number
    if (/^(abha|abha login|abha number|aabha|आभा|ஆபா|ఆభా|আভা)$/i.test(raw) ||
        /\b(?:abha login|abha se login)\b/i.test(raw)) {
      return { intent: 'login_abha', confidence: 0.98, value: null };
    }

    // 10. Aadhaar Login / Aadhaar Number
    if (/^(aadhaar|aadhar|aadhar number|aadhaar card|आधार|ஆதார்|ఆధార్|আধার)$/i.test(raw) ||
        /\b(?:aadhaar login|aadhaar se login)\b/i.test(raw)) {
      return { intent: 'login_aadhaar', confidence: 0.98, value: null };
    }

    // 11. New Patient Registration
    if (/^(new patient|naya mareez|naya patient|register new|pudhiya rogi|pudhiya noyali|kottha rogi|notun rogi|naveen rogi|hosa rogi|puthiya rogi|नया मरीज़|புதிய நோயாளி|కొత్త రోగి|নতুন রোগী|नवीन रुग्ण|નવું દર્દી|ಹೊಸ ರೋಗಿ|പുതിയ രോഗി)$/i.test(raw) ||
        /^(register|registration|naya registration)$/i.test(raw)) {
      return { intent: 'register_new', confidence: 0.98, value: null };
    }

    // 12. Read Summary / Listen
    if (/^(read|read summary|listen|padho|sunao|vasi|chaduvu|poro|vacha|vaachh|oodhu|vaayikkuka|पढ़ो|सुनाओ|வாசி|చదువు|পড়ুন|वाचा|વાંચો|ಓದಿ|വായിക്കുക)$/i.test(raw) ||
        /\b(?:summary padho|summary sunao|read summary)\b/i.test(raw)) {
      return { intent: 'read_summary', confidence: 0.98, value: null };
    }

    // 13. Confirm / Submit / Finish
    if (/^(confirm|submit|send|finish|done|jama|jama karein|samarpi|dhakkal|drudikarisiri|samarpikkuka|जमा|पुष्टि|சமர்ப்பி|సమర్పించు|জমা|सबमिट|સબમિટ|ಸಲ್ಲಿಸಿ|സമർപ്പിക്കുക)$/i.test(raw) ||
        /\b(?:submit karo|confirm karo|jama karo)\b/i.test(raw)) {
      return { intent: 'confirm', confidence: 0.98, value: null };
    }

    // 14. Skip / Leave
    if (/^(skip|leave|chodo|chhoden|vittuvidu|vadileyi|bad|soda|sodi|bidi|ozhivakkuka|छोड़ें|தவிர்|వదిలివేయి|বাদ|सोडा|છોડો|ಬಿಡಿ|ಒഴിവാക്കുക)$/i.test(raw) ||
        /\b(?:skip karo|chhod do|leave this)\b/i.test(raw)) {
      return { intent: 'skip', confidence: 0.98, value: null };
    }

    // 15. Yes / Agree / Accept
    if (/^(yes|haan|ha|sahi|agree|accept|aam|avunu|hyn|ho|howdu|athe|हाँ|சரி|అవును|হ্যাঁ|होय|હા|ಹೌದು|അതെ)$/i.test(raw) ||
        /^(haan ji|yes please|bilkul)$/i.test(raw)) {
      return { intent: 'yes', confidence: 0.98, value: null };
    }

    // 16. No / Disagree / Reject
    if (/^(no|nahi|nahin|illai|kaadhu|na|naahi|alla|illa|nah|नहीं|இல்லை|కాదు|না|नाही|ના|ಇಲ್ಲ|ഇല്ല)$/i.test(raw) ||
        /^(nahi ji|no thanks)$/i.test(raw)) {
      return { intent: 'no', confidence: 0.98, value: null };
    }

    // 17. Help / Support
    if (/^(help|support|madad|udhavi|sahayam|sahajjo|saahaay|neravu|मदद|உதவி|సహాయం|সাহায্য|मदत|મદદ|ಸಹಾಯ|സഹായം)$/i.test(raw) ||
        /\b(?:help karo|madad chahiye)\b/i.test(raw)) {
      return { intent: 'help', confidence: 0.98, value: null };
    }

    // 18. Language Selection / Change Language
    if (/^(language|change language|select language|bhasha|bhasha badlo|boli|mozhi|bhashayein|భాష|மொழி|ভাষা|ભાષા|ಭಾಷೆ|ഭാഷ|भाषा)$/i.test(raw) ||
        /\b(?:bhasha badlo|change language)\b/i.test(raw)) {
      return { intent: 'select_language', confidence: 0.98, value: null };
    }

    // 19. Document / Prescription Scan
    if (/^(scan|scanner|document|prescription|parcha|report|scan document|parcha scan|doc scan|ஆவணம்|పత్రం|দলিল|દસ્તાવેજ|ದಾಖಲೆ|രേഖ|दस्तावेज़|पर्चा)$/i.test(raw) ||
        /\b(?:parcha scan|scan parcha|upload report)\b/i.test(raw)) {
      return { intent: 'scan_document', confidence: 0.98, value: null };
    }

    // 20. Scroll Up / Down
    if (/^(scroll up|scrollup|upar|mele|paiki|upore|varth|ऊपर|மேலே)$/i.test(raw)) {
      return { intent: 'scrollUp', confidence: 0.98, value: null };
    }
    if (/^(scroll down|scrolldown|neeche|keezhe|kindiki|niche|khali|नीचे|கீழே)$/i.test(raw)) {
      return { intent: 'scrollDown', confidence: 0.98, value: null };
    }

    return null;
  }

  // Parse a transcript into an intent
  async parse(transcript, currentPage = null, context = {}) {
    const input = normalize(transcript);
    if (!input) return { intent: null, confidence: 0, raw: transcript };

    // 1. FAST-PATH: Direct multi-lingual regex match (< 2ms instant response)
    const fastResult = this._fastMatchIntent(input, context);
    if (fastResult) {
      return { ...fastResult, raw: transcript };
    }

    let bestMatch = { intent: null, confidence: 0, raw: transcript, value: null };

    // 2. Check page-specific commands (Fuzzy Matching)
    if (currentPage && this.pageCommands[currentPage]) {
      const pageResult = this._matchCommands(input, this.pageCommands[currentPage]);
      if (pageResult.confidence > bestMatch.confidence) {
        bestMatch = { ...pageResult, raw: transcript };
      }
    }

    // 3. Check global commands (Fuzzy Matching)
    const globalResult = this._matchGlobalCommands(input);
    if (globalResult.confidence > bestMatch.confidence) {
      bestMatch = { ...globalResult, raw: transcript };
    }

    // 4. Check number/option selection (Fuzzy Matching)
    const optionResult = this._matchOptionSelection(input);
    if (optionResult.confidence > bestMatch.confidence) {
      bestMatch = { ...optionResult, raw: transcript };
    }

    // 5. If match is highly confident (> 0.75), use it immediately without cloud latency
    if (bestMatch.confidence >= 0.75) {
      return bestMatch;
    }

    // 6. Server-side semantic interpretation sees the actual actions currently
    // available, including future pages and visible controls.
    if (voiceAIService.available) {
      try {
        const semantic = await voiceAIService.understand({
          transcript,
          language: this.currentLanguage,
          pageId: currentPage,
          actions: context.actions || [],
          routes: this.routes,
          expectsFreeText: context.expectsFreeText,
        });
        if (semantic?.intent) return {
          ...semantic, raw: transcript,
          value: semantic.intent === 'free_text' ? transcript : semantic.value,
        };
      } catch (error) {
        console.warn('Server voice understanding unavailable; using offline parser.', error);
      }
    }

    // 7. Legacy client AI is retained only as a temporary development fallback.
    if (aiCommandEngine.isAvailable) {
      const availablePageCommands = (currentPage && this.pageCommands[currentPage]) ? this.pageCommands[currentPage] : {};
      
      const aiResult = await aiCommandEngine.parseIntent(
        transcript,
        availablePageCommands,
        VOICE_COMMANDS.global
      );

      if (aiResult && aiResult.intent) {
        if (aiResult.intent !== 'free_text') {
          return { 
            intent: aiResult.intent, 
            confidence: aiResult.confidence, 
            raw: transcript, 
            value: aiResult.value,
            message: aiResult.message 
          };
        } else {
          return { intent: 'free_text', confidence: 1, raw: transcript, value: transcript };
        }
      }
    }

    // 8. If AI also fails or is unavailable, use the fuzzy match if it met threshold
    if (bestMatch.confidence >= this.confidenceThreshold) {
      return bestMatch;
    }

    // 9. Otherwise, it's free text
    return { intent: 'free_text', confidence: 1, raw: transcript, value: transcript };
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
    // Match "option N", "N", ordinal numbers in any language
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
