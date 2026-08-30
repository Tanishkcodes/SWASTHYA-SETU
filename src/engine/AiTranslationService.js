/* =========================================================================
   SWASTHYA SETU — AI Dynamic Translation & Transliteration Engine
   Powered by Google Gemini AI & Multi-Lingual Indic Neural Engine
   Dynamically translates & transliterates ANY arbitrary patient names,
   doctor names, specialties, and clinical text across all 9 Indian languages.
   ========================================================================= */

import voiceAIService from '../voicenav/VoiceAIService';

class AiTranslationService {
  constructor() {
    this.isAiAvailable = Boolean(import.meta.env.VITE_GEMINI_API_KEY);
    this._cache = new Map(); // Fast in-memory cache for instant reactive rendering
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
   * Translates or transliterates text dynamically into the target Indian language
   * @param {string} text The source text (e.g. "Tanishk Sharma", "Dr. Vikramaditya", "Cardiology")
   * @param {string} targetLang The ISO language code ('hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'en')
   * @param {string} contextType 'name' | 'doctor' | 'general'
   * @returns {string} The translated/transliterated string
   */
  translate(text, targetLang = 'en', contextType = 'general') {
    if (!text || typeof text !== 'string') return '';
    const cleanText = text.trim();
    if (!cleanText) return '';
    if (!targetLang || targetLang === 'en') return cleanText;

    const cacheKey = `${targetLang}_${contextType}_${cleanText.toLowerCase()}`;
    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey);
    }

    // Immediately trigger asynchronous background fetch
    this.fetchAiTranslation(cleanText, targetLang, contextType);

    // Names benefit from phonetic rendering. General UI/clinical text must not
    // be shown as meaningless letter-by-letter transliteration while the real
    // translation is loading, so keep the source text until the server reply.
    return contextType === 'name' || contextType === 'doctor'
      ? this._phoneticFallback(cleanText, targetLang)
      : cleanText;
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
    this._batchTimeout = setTimeout(() => this._processBatch(), 1000);
  }

  async _processBatch() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return;

    const currentBatch = new Map(this._batch);
    this._batch.clear();

    for (const [targetLang, items] of currentBatch.entries()) {
      const textsToTranslate = Array.from(items.keys());
      if (textsToTranslate.length === 0) continue;

      const langNames = { hi: 'Hindi', mr: 'Marathi', gu: 'Gujarati', ta: 'Tamil', te: 'Telugu', kn: 'Kannada', bn: 'Bengali', pa: 'Punjabi', ml: 'Malayalam', or: 'Odia', en: 'English' };
      const langName = langNames[targetLang] || targetLang;

      try {
        const prompt = `Translate this JSON array of text into ${langName}. Keep formatting, variables, and punctuation intact. Only return the JSON array of translated strings.
Input: ${JSON.stringify(textsToTranslate)}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
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
        } else if (response.status === 429) {
          console.warn("AiTranslationService hit rate limit. Retrying in 5s...");
          if (!this._batch.has(targetLang)) this._batch.set(targetLang, new Map());
          const batchLangMap = this._batch.get(targetLang);
          textsToTranslate.forEach(str => batchLangMap.set(str, items.get(str)));
          if (this._batchTimeout) clearTimeout(this._batchTimeout);
          this._batchTimeout = setTimeout(() => this._processBatch(), 5000);
        }
      } catch (err) {
        console.warn('Gemini batch translation error:', err);
      } finally {
        textsToTranslate.forEach(originalStr => {
          const cacheKey = `${targetLang}_${items.get(originalStr)}_${originalStr.toLowerCase()}`;
          this._pending.delete(cacheKey);
        });
      }
    }
  }

  // Instant Indic Brahmic Phonetic Transliteration Fallback
  _phoneticFallback(text, targetLang) {
    if (!text || targetLang === 'en') return text;

    const SCRIPT_OFFSETS = {
      hi: 0x0900,
      mr: 0x0900,
      bn: 0x0980,
      pa: 0x0A00,
      gu: 0x0A80,
      or: 0x0B00,
      ta: 0x0B80,
      te: 0x0C00,
      kn: 0x0C80,
      ml: 0x0D00
    };

    const TAMIL_MAP = {
      k: 'க', kh: 'க', g: 'க', gh: 'க',
      ch: 'ச', chh: 'ச', j: 'ஜ', jh: 'ஜ', s: 'ஸ', sh: 'ஷ', ss: 'ஷ',
      t: 'த', th: 'த', d: 'த', dh: 'த',
      p: 'ப', ph: 'ப', b: 'ப', bh: 'ப', f: 'ப',
      m: 'ம', n: 'ந', ng: 'ங', ny: 'ஞ',
      y: 'ய', r: 'ர', l: 'ல', v: 'வ', w: 'வ', h: 'ஹ',
      _aa: 'ா', _i: 'ி', _ee: 'ீ', _u: 'ு', _oo: 'ூ', _e: 'ெ', _ai: 'ை', _o: 'ொ', _au: 'ௌ', _virama: '்',
      _init_a: 'அ', _init_aa: 'ஆ', _init_i: 'இ', _init_ee: 'ஈ', _init_u: 'உ', _init_oo: 'ஊ', _init_e: 'எ', _init_ai: 'ஐ', _init_o: 'ஒ', _init_au: 'ஔ'
    };

    if (targetLang === 'ta') {
      return text.split(' ').map(word => {
        const w = word.toLowerCase().replace(/[^a-z]/g, '');
        if (!w) return word;
        let res = '';
        let i = 0;
        while (i < w.length) {
          if (i === 0) {
            if (w.startsWith('aa', i)) { res += TAMIL_MAP._init_aa; i += 2; continue; }
            if (w.startsWith('ai', i)) { res += TAMIL_MAP._init_ai; i += 2; continue; }
            if (w.startsWith('au', i)) { res += TAMIL_MAP._init_au; i += 2; continue; }
            if (w.startsWith('ee', i)) { res += TAMIL_MAP._init_ee; i += 2; continue; }
            if (w.startsWith('oo', i)) { res += TAMIL_MAP._init_oo; i += 2; continue; }
            if (w[i] === 'a') { res += TAMIL_MAP._init_a; i++; continue; }
            if (w[i] === 'i') { res += TAMIL_MAP._init_i; i++; continue; }
            if (w[i] === 'u') { res += TAMIL_MAP._init_u; i++; continue; }
            if (w[i] === 'e') { res += TAMIL_MAP._init_e; i++; continue; }
            if (w[i] === 'o') { res += TAMIL_MAP._init_o; i++; continue; }
          }
          let matched = null, consLen = 0;
          for (const key of ['chh', 'kh', 'gh', 'ch', 'jh', 'th', 'dh', 'ph', 'bh', 'sh', 'ss', 'k', 'g', 'j', 't', 'd', 'n', 'p', 'f', 'b', 'm', 'y', 'r', 'l', 'v', 'w', 's', 'h']) {
            if (w.startsWith(key, i)) {
              matched = TAMIL_MAP[key];
              consLen = key.length;
              break;
            }
          }
          if (matched) {
            res += matched;
            i += consLen;
            if (w.startsWith('aa', i)) { res += TAMIL_MAP._aa; i += 2; }
            else if (w.startsWith('ai', i)) { res += TAMIL_MAP._ai; i += 2; }
            else if (w.startsWith('au', i)) { res += TAMIL_MAP._au; i += 2; }
            else if (w.startsWith('ee', i)) { res += TAMIL_MAP._ee; i += 2; }
            else if (w.startsWith('oo', i)) { res += TAMIL_MAP._oo; i += 2; }
            else if (w[i] === 'a') { i++; }
            else if (w[i] === 'i') { res += TAMIL_MAP._i; i++; }
            else if (w[i] === 'u') { res += TAMIL_MAP._u; i++; }
            else if (w[i] === 'e') { res += TAMIL_MAP._e; i++; }
            else if (w[i] === 'o') { res += TAMIL_MAP._o; i++; }
            else { res += TAMIL_MAP._virama; }
          } else {
            i++;
          }
        }
        return res || word;
      }).join(' ');
    }

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
