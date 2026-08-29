import voiceAIService from '../voicenav/VoiceAIService';

class AICommandEngine {
  constructor() {
    this._cache = new Map(); // Cache recent parses for speed
  }

  get isAvailable() {
    return voiceAIService.available;
  }

  /** Convert commonly spoken digits in all nine supported languages. */
  _convertSpokenNumberWords(text = '') {
    const digits = {
      zero: '0', oh: '0', shunya: '0', sunya: '0', poojyam: '0', பூஜ்ஜியம்: '0', సున్నా: '0', শূন্য: '0', शून्य: '0', શૂન્ય: '0', ಸೊನ್ನೆ: '0', പൂജ്യം: '0',
      one: '1', ek: '1', onnu: '1', ondru: '1', okati: '1', এক: '1', एक: '1', એક: '1', ಒಂದು: '1', ഒന്ന്: '1',
      two: '2', do: '2', rendu: '2', irandu: '2', দুই: '2', दोन: '2', બે: '2', రెండు: '2', ಎರಡು: '2', രണ്ട്: '2',
      three: '3', teen: '3', moonu: '3', moondru: '3', mudu: '3', তিন: '3', तीन: '3', ત્રણ: '3', మూడు: '3', ಮೂರು: '3', മൂന്ന്: '3',
      four: '4', char: '4', chaar: '4', naalu: '4', naangu: '4', nalugu: '4', চার: '4', चार: '4', ચાર: '4', నాలుగు: '4', ನಾಲ್ಕು: '4', നാല്: '4',
      five: '5', paanch: '5', anju: '5', ainthu: '5', aidu: '5', পাঁচ: '5', पाच: '5', પાંચ: '5', ఐదు: '5', ಐದು: '5', അഞ്ച്: '5',
      six: '6', chhe: '6', che: '6', aaru: '6', aru: '6', ఆరు: '6', ছয়: '6', सहा: '6', છ: '6', ಆರು: '6', ആറ്: '6',
      seven: '7', saat: '7', ezhu: '7', elu: '7', edu: '7', সাত: '7', सात: '7', સાત: '7', ఏడు: '7', ಏಳು: '7', ഏഴ്: '7',
      eight: '8', aath: '8', ettu: '8', enimidi: '8', আট: '8', आठ: '8', આઠ: '8', ఎనిమిది: '8', ಎಂಟು: '8', എട്ട്: '8',
      nine: '9', nau: '9', ombathu: '9', tommidi: '9', নয়: '9', नऊ: '9', નવ: '9', తొమ్మిది: '9', ಒಂಬತ್ತು: '9', ഒമ്പത്: '9',
    };
    return String(text).split(/([\s,.-]+)/).map(token => digits[token.toLowerCase()] ?? token).join('');
  }

  /**
   * Translates natural language into a structured intent based on available page commands
   * @param {string} transcript The user's voice input (any language)
   * @param {object} availableCommands Map of intents to descriptions/triggers
   * @param {object} globalCommands Map of global intents
   */
  async parseIntent(transcript, availableCommands = {}, globalCommands = {}) {
    if (!this.isAvailable) return null;

    // Check cache first for instant repeat commands
    const cacheKey = transcript.toLowerCase().trim();
    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey);
    }

    try {
      const actions = [...Object.keys(globalCommands), ...Object.keys(availableCommands)].map(intent => ({ intent, description: intent.replace(/_/g, ' ') }));
      const result = await voiceAIService.understand({ transcript, language: 'auto', pageId: 'legacy', actions, routes: [], expectsFreeText: true });

      // Cache the result
      this._cache.set(cacheKey, result);
      
      if (this._cache.size > 100) {
        const firstKey = this._cache.keys().next().value;
        this._cache.delete(firstKey);
      }

      return result;

    } catch (e) {
      console.warn("AI Out-of-context fallback failed:", e);
      return null;
    }
  }

  /**
   * Intelligently understands and extracts patient registration details using Gemini AI.
   * Handles arbitrary sentence ordering, self-corrections, multi-lingual speech, and removes conversational noise.
   */
  async extractRegistrationDetails(transcript, language = 'en') {
    if (!transcript || transcript.trim().length === 0) return null;

    const fallback = this._genericFallback(transcript);

    if (this.isAvailable) {
      try {
        const parsed = await voiceAIService.extractRegistration(transcript, language);
        const phone = String(parsed.phone || '').replace(/\D/g, '');
        const age = String(parsed.age || '').match(/\d{1,3}/)?.[0] || '';
        const normalizedGender = ['Male', 'Female', 'Other'].includes(parsed.gender) ? parsed.gender : '';
        return {
          name: parsed.name?.trim() || fallback.name,
          age: Number(age) >= 1 && Number(age) <= 120 ? age : fallback.age,
          phone: phone.length === 10 ? phone : fallback.phone,
          gender: normalizedGender || fallback.gender,
        };
      } catch (e) {
        console.warn("Gemini entity extraction fallback:", e);
      }
    }

    // Generic lightweight offline fallback (extracts phone digits and obvious age)
    return fallback;
  }

  _genericFallback(transcript) {
    const result = { name: '', age: '', gender: '', phone: '' };
    if (!transcript) return result;

    let working = this._convertSpokenNumberWords(transcript).trim();

    // 1. Phone extraction (10-digit standard Indian mobile starting with 6-9, or any 10-digit sequence)
    const phoneMatch = working.match(/\b[6-9]\d{9}\b/) || working.match(/\b\d{10}\b/);
    if (phoneMatch) {
      result.phone = phoneMatch[0];
      working = working.replace(phoneMatch[0], ' ');
    }

    // 2. Gender extraction
    if (/\b(?:female|woman|girl|lady|mahila|stri|stree|aurat|பெண்|மహిళ|ಮಹಿಳೆ|സ്ത്രീ|মহিলা|સ્ત્રી)\b/i.test(working)) {
      result.gender = 'Female';
    } else if (/\b(?:male|man|boy|guy|gentleman|purush|aadmi|पुरुष|ஆண்|పురుషుడు|ಪುರುಷ|പുരുഷൻ|পুরুষ|પુરુષ)\b/i.test(working)) {
      result.gender = 'Male';
    } else if (/\b(?:other|transgender|trans|अन्य|மற்றவை|ఇతర)\b/i.test(working)) {
      result.gender = 'Other';
    }

    // 3. Age extraction (handles standard digits + self-corrections like "30 nahi 35")
    const corrAge = working.match(/\b\d{1,3}\s*(?:nahi|no|sorry|wait|not)\s*(\d{1,3})\b/i);
    if (corrAge) {
      result.age = corrAge[1];
    } else {
      const ageMatch = working.match(/(?:age|umar|umr|varsh|vayas|വയസ്സ്|வயது|ವಯಸ್ಸು|उम्र|साल|ವರ್ಷ|বছর)\s*(?:is|hai|:)?\s*(\d{1,3})/i)
        || working.match(/(\d{1,3})\s*(?:years old|year old|years|year|saal|sal|varsh|vayas|വയസ്സ്|வயது|साल|ವರ್ಷ|বছর)/i)
        || working.match(/\b([1-9][0-9]?|1[01][0-9])\b/);
      if (ageMatch && !result.phone.includes(ageMatch[1])) {
        result.age = ageMatch[1];
      }
    }

    // 4. Name extraction (handles "naam ...", "name is ...", "myself ...", "i am ...", "mera naam ...")
    const nameMatch = working.match(/(?:mera\s*naam|mera\s*nam|my\s*name\s*is|name\s*is|naam\s*(?:hai)?|myself|i\s*am|this\s*is|call\s*me|पेयर|పేరు|ಹೆಸರು|নাম|नाव)\s*[:\-]?\s*([a-zA-Z\u0900-\u0D7F\s]{2,40})/i);
    if (nameMatch) {
      const candidate = nameMatch[1]
        .replace(/\b(?:doctor|sahab|sir|madam|please|patient|male|female|purush|mahila|umar|age|phone|number|hai|hain|hu|hoon|bol|raha|rahi|and|or|years|saal)\b/gi, ' ')
        .replace(/[0-9!@#$%^&*()_+={}\[\]:;"'<>,.?/\\|`~]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const tokens = candidate.split(' ').filter(w => w.length >= 2);
      if (tokens.length >= 1 && tokens.length <= 4) {
        result.name = tokens.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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