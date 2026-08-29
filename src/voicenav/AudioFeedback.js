import voiceAIService from './VoiceAIService';

/* ============================================
   SWASTHYA SETU — Audio Feedback System
   TTS synthesis + sound effects via Web Audio API
   ============================================ */

class AudioFeedbackEngine {
  constructor() {
    this.synth = window.speechSynthesis;
    this.audioCtx = null;
    this.elevenLabsAudio = new Audio();
    this.activeBlobUrl = null;
    this.isSpeaking = false;
    this.speechQueue = [];
    this.currentUtterance = null;
    this.currentResolve = null;
    this.activePlaybackId = 0; // Incremented on every stop/navigation to instantly invalidate in-flight audio
    this.rate = 0.94; // Natural premium cadence: clear without sounding slow
    this.volume = 1.0; // Clear audible volume
    this.pitch = 1.03; // Warm and feminine without artificial high pitch
    this.onSpeakingChange = null;
    this._voicesLoaded = false;
    this._voicesPromise = null;
    this._audioCache = new Map();
    
    // Preload voices immediately
    this._preloadVoices();
  }

  // Ensure voices are loaded before speaking
  _preloadVoices() {
    if (this.synth.getVoices().length > 0) {
      this._voicesLoaded = true;
      return;
    }
    
    this._voicesPromise = new Promise((resolve) => {
      const onVoicesChanged = () => {
        this._voicesLoaded = true;
        this.synth.removeEventListener('voiceschanged', onVoicesChanged);
        resolve();
      };
      this.synth.addEventListener('voiceschanged', onVoicesChanged);
      
      // Fallback: resolve after 2s even if voices don't fire
      setTimeout(() => {
        this._voicesLoaded = true;
        resolve();
      }, 2000);
    });
  }

  async _ensureVoicesLoaded() {
    if (this._voicesLoaded) return;
    if (this._voicesPromise) await this._voicesPromise;
  }

  _getAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Find the best voice for a language (preferring an engaging, velvety, sweet female voice)
  _getBestVoice(langCode) {
    const voices = this.synth.getVoices();
    if (!voices.length) return null;
    
    const langPrefix = langCode.split('-')[0].toLowerCase();
    
    // Language-specific preferred captivating female voice names
    const languageVoicePreferences = {
      hi: ['swara', 'google हिन्दी', 'google hindi', 'kalpana', 'heera', 'aditi', 'lekha', 'veena'],
      ta: ['pallavi', 'google தமிழ்'],
      te: ['aarohi', 'google తెలుగు'],
      bn: ['tanishaa', 'google বাংলা'],
      mr: ['ananya', 'google मराठी', 'marathi', 'aarohi'],
      gu: ['shruti', 'google ગુજરાતી', 'dhwani'],
      kn: ['sapna', 'google ಕನ್ನಡ'],
      ml: ['sobhana', 'google മലയാളം'],
      en: [
        'microsoft neerja online (natural) - english (india)',
        'microsoft heera - english (india)',
        'google uk english female',
        'google us english',
        'microsoft zira',
        'samantha',
        'neerja',
        'heera',
        'kavya',
        'priya',
        'victoria'
      ]
    };

    const preferredList = languageVoicePreferences[langPrefix] || [];

    // Filter voices matching the language code or prefix
    const exactVoices = voices.filter(v => {
      const vLang = v.lang.replace('_', '-').toLowerCase();
      return vLang === langCode.toLowerCase() || vLang.startsWith(langPrefix);
    });

    // 1. First priority: Target language + specific top female voice
    for (const prefName of preferredList) {
      const match = exactVoices.find(v => v.name.toLowerCase().includes(prefName));
      if (match) return match;
    }

    // 2. Second priority: Target language + generic female keywords
    const knownFemaleNames = ['female', 'woman', 'girl', 'swara', 'kalpana', 'heera', 'aditi', 'lekha', 'veena', 'pallavi', 'aarohi', 'tanishaa', 'ananya', 'shruti', 'dhwani', 'sapna', 'sobhana', 'neerja', 'zira', 'samantha', 'kavya', 'priya', 'victoria'];
    const isFemaleVoice = (v) => {
      const name = v.name.toLowerCase();
      return knownFemaleNames.some(keyword => name.includes(keyword))
        || preferredList.some(p => name.includes(p));
    };

    const femaleMatch = exactVoices.find(isFemaleVoice);
    if (femaleMatch) return femaleMatch;

    // 3. Fallback: Indian English or general female voice. Callers verify the
    // returned language before using it for a regional-language utterance.
    const indianVoices = voices.filter(v => v.lang.replace('_', '-').toLowerCase() === 'en-in');
    const indianFemale = indianVoices.find(isFemaleVoice);
    if (indianFemale) return indianFemale;

    const anyEnglish = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
    return anyEnglish.find(isFemaleVoice) || null;
  }

  // Map our language codes to speech synthesis language codes
  _getSpeechLang(lang) {
    const map = {
      en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN',
      bn: 'bn-IN', mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN'
    };
    return map[lang] || 'en-IN';
  }

  // Preprocess text to ensure clean & accurate natural Indian pronunciation
  _preprocessTextForTTS(text, lang) {
    if (!text) return '';
    let cleaned = text;

    // English with natural Indian phonetic tuning
    if (lang === 'en' || lang.startsWith('en')) {
      cleaned = cleaned.replace(/\bABHA\b/g, 'Aabha');
      cleaned = cleaned.replace(/\bABDM\b/g, 'A B D M');
      cleaned = cleaned.replace(/\bAadhaar\b/gi, 'Aadhar');
      cleaned = cleaned.replace(/\bOPD\b/gi, 'O P D');
      cleaned = cleaned.replace(/\bAI\b/g, 'A I');
      cleaned = cleaned.replace(/\bBP\b/g, 'B P');
      cleaned = cleaned.replace(/\bECG\b/g, 'E C G');
      cleaned = cleaned.replace(/\bCBC\b/g, 'C B C');
      cleaned = cleaned.replace(/\bRx\b/gi, 'Prescription');
      cleaned = cleaned.replace(/\bSwasthya Setu\b/gi, 'Swasthya Setu');
      cleaned = cleaned.replace(/\bDr\.\b/g, 'Doctor');
      cleaned = cleaned.replace(/\bOTP\b/g, 'O T P');
    }

    // Regional languages: replace English abbreviations with natural regional script pronunciation
    if (lang === 'hi') {
      cleaned = cleaned.replace(/\bABHA\b/g, 'आभा');
      cleaned = cleaned.replace(/\bAadhaar\b/gi, 'आधार');
      cleaned = cleaned.replace(/\bOTP\b/g, 'ओटीपी');
    } else if (lang === 'ta') {
      cleaned = cleaned.replace(/\bABHA\b/g, 'ஆபா');
      cleaned = cleaned.replace(/\bAadhaar\b/gi, 'ஆதார்');
      cleaned = cleaned.replace(/\bOTP\b/g, 'ஓடிபி');
    } else if (lang === 'te') {
      cleaned = cleaned.replace(/\bABHA\b/g, 'ఆభా');
      cleaned = cleaned.replace(/\bAadhaar\b/gi, 'ఆధార్');
      cleaned = cleaned.replace(/\bOTP\b/g, 'ఓటీపీ');
    } else if (lang === 'bn') {
      cleaned = cleaned.replace(/\bABHA\b/g, 'আভা');
      cleaned = cleaned.replace(/\bAadhaar\b/gi, 'আধার');
      cleaned = cleaned.replace(/\bOTP\b/g, 'ওটিপি');
    } else if (lang === 'mr') {
      cleaned = cleaned.replace(/\bABHA\b/g, 'आभा');
      cleaned = cleaned.replace(/\bAadhaar\b/gi, 'आधार');
      cleaned = cleaned.replace(/\bOTP\b/g, 'ओटीपी');
    } else if (lang === 'gu') {
      cleaned = cleaned.replace(/\bABHA\b/g, 'આભા');
      cleaned = cleaned.replace(/\bAadhaar\b/gi, 'આધાર');
      cleaned = cleaned.replace(/\bOTP\b/g, 'ઓટીપી');
    } else if (lang === 'kn') {
      cleaned = cleaned.replace(/\bABHA\b/g, 'ಆಭಾ');
      cleaned = cleaned.replace(/\bAadhaar\b/gi, 'ಆಧಾರ್');
      cleaned = cleaned.replace(/\bOTP\b/g, 'ಓಟಿಪಿ');
    } else if (lang === 'ml') {
      cleaned = cleaned.replace(/\bABHA\b/g, 'ആഭാ');
      cleaned = cleaned.replace(/\bAadhaar\b/gi, 'ആധാർ');
      cleaned = cleaned.replace(/\bOTP\b/g, 'ഒടിപി');
    }

    return cleaned;
  }

  // Special handler to play studio-quality ElevenLabs welcome audio smoothly
  async playWelcomeAudio(audioUrl = '/welcome_hi.mp3', fallbackText = 'नमस्ते! स्वास्थ्य सेतु में आपका स्वागत है।', lang = 'hi') {
    this.stop();
    const currentId = ++this.activePlaybackId;

    return new Promise(async (resolve) => {
      try {
        this.isSpeaking = true;
        this.currentResolve = resolve;

        this.elevenLabsAudio.src = audioUrl;
        this.elevenLabsAudio.playbackRate = 1.0; // Warm, soothing, perfectly paced cadence

        this.elevenLabsAudio.onended = () => {
          if (this.activePlaybackId !== currentId) return;
          this.isSpeaking = false;
          this.currentResolve = null;
          this.onSpeakingChange?.(false);
          resolve(true);
        };

        this.elevenLabsAudio.onerror = () => {
          if (this.activePlaybackId !== currentId) return;
          this.isSpeaking = false;
          this.currentResolve = null;
          this.onSpeakingChange?.(false);
          this.speak(fallbackText, lang, { rate: 0.94, pitch: 1.03, speed: 0.98 }).then(resolve);
        };

        this.elevenLabsAudio.onplaying = () => {
          if (this.activePlaybackId !== currentId) {
            this.elevenLabsAudio.pause();
            return;
          }
          this.onSpeakingChange?.(true);
        };

        await this.elevenLabsAudio.play();
      } catch (err) {
        if (this.activePlaybackId !== currentId) return resolve(false);
        this.isSpeaking = false;
        if (err.name === 'NotAllowedError') {
          return resolve(false);
        }
        this.speak(fallbackText, lang, { rate: 0.94, pitch: 1.03, speed: 0.98 }).then(resolve);
      }
    });
  }

  // Speak text aloud with high-fidelity authentic Indian voices (ElevenLabs Multilingual V2 + Neural Stream Fallback)
  async speak(rawText, lang = 'en', options = {}) {
    const text = this._preprocessTextForTTS(rawText, lang);
    console.log(`[TTS] Speaking: "${text}" in ${lang}`);
    const currentId = ++this.activePlaybackId;
    
    return new Promise(async (resolve) => {
      const playSpeech = async () => {
        try {
          if (this.activePlaybackId !== currentId) return resolve(false);

          // 1. Studio TTS through our Edge Function. Provider keys never enter
          // the browser bundle and every page automatically shares this path.
          if (voiceAIService.ttsAvailable) {
            try {
                const blob = await voiceAIService.synthesize(text, lang, null, options);
                const blobUrl = URL.createObjectURL(blob);
                const elevenAudio = new Audio(blobUrl);
                this.elevenLabsAudio = elevenAudio;
                this.activeBlobUrl = blobUrl;

                this.isSpeaking = true;
                this.currentResolve = resolve;
                this.onSpeakingChange?.(true);

                elevenAudio.onended = () => {
                  if (this.activePlaybackId !== currentId) return;
                  URL.revokeObjectURL(blobUrl);
                  this.activeBlobUrl = null;
                  this.isSpeaking = false;
                  this.currentResolve = null;
                  this.onSpeakingChange?.(false);
                  resolve(true);
                  this._processQueue();
                };

                elevenAudio.onerror = () => {
                  URL.revokeObjectURL(blobUrl);
                  this.activeBlobUrl = null;
                  this._streamFallbackTTS(text, lang, currentId, options, resolve);
                };

                await elevenAudio.play();
                return;
            } catch (elevenErr) {
              console.warn('[Voice TTS] Server synthesis unavailable; using device voice.', elevenErr);
            }
          }

          // 2. High-Clarity Neural Multi-Lingual Stream & Web Speech Fallback
          this._streamFallbackTTS(text, lang, currentId, options, resolve);

        } catch (error) {
          if (this.activePlaybackId !== currentId) return resolve(false);
          this.isSpeaking = false;
          this.currentUtterance = null;
          this.currentResolve = null;
          this.onSpeakingChange?.(false);
          resolve(false);
          this._processQueue();
        }
      };

      if (this.isSpeaking) {
        this.speechQueue.push({ type: 'speech', playSpeech, resolve });
      } else {
        playSpeech();
      }
    });
  }

  async _streamFallbackTTS(text, lang, currentId, options, resolve) {
    try {
      await this._ensureVoicesLoaded();
      const speechLang = this._getSpeechLang(lang);
      const langPrefix = lang.split('-')[0].toLowerCase();
      const voices = this.synth?.getVoices() || [];

      // Check if browser OS has an authentic native voice for this language
      const preferredVoice = this._getBestVoice(speechLang);
      const preferredVoiceLang = preferredVoice?.lang.replace('_', '-').toLowerCase() || '';
      const hasExactFemaleVoice = Boolean(preferredVoice) &&
        (preferredVoiceLang === speechLang.toLowerCase() || preferredVoiceLang.startsWith(langPrefix));

      if (hasExactFemaleVoice && this.synth) {
        this.synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = speechLang;
        utterance.rate = options.rate || this.rate;
        utterance.volume = options.volume || this.volume;
        utterance.pitch = options.pitch || this.pitch;

        utterance.voice = preferredVoice;

        utterance.onstart = () => {
          if (this.activePlaybackId !== currentId) return;
          this.isSpeaking = true;
          this.currentUtterance = utterance;
          this.currentResolve = resolve;
          this.onSpeakingChange?.(true);
        };

        utterance.onend = () => {
          if (this.activePlaybackId !== currentId) return;
          this.isSpeaking = false;
          this.currentUtterance = null;
          this.currentResolve = null;
          this.onSpeakingChange?.(false);
          resolve(true);
          this._processQueue();
        };

        utterance.onerror = () => {
          if (this.activePlaybackId !== currentId) return;
          this.isSpeaking = false;
          this.currentUtterance = null;
          this.currentResolve = null;
          this.onSpeakingChange?.(false);
          resolve(false);
          this._processQueue();
        };

        this.synth.speak(utterance);
        return;
      }

      // Universal neural TTS stream for all 9 Indian languages
      const streamUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langPrefix}&client=tw-ob&q=${encodeURIComponent(text)}`;
      const audio = new Audio(streamUrl);
      this.isSpeaking = true;
      this.currentResolve = resolve;
      this.onSpeakingChange?.(true);

      audio.onended = () => {
        if (this.activePlaybackId !== currentId) return;
        this.isSpeaking = false;
        this.currentResolve = null;
        this.onSpeakingChange?.(false);
        resolve(true);
        this._processQueue();
      };

      audio.onerror = () => {
        if (this.activePlaybackId !== currentId) return;
        if (this.synth) {
          const fallbackUtterance = new SpeechSynthesisUtterance(text);
          fallbackUtterance.lang = speechLang;
          fallbackUtterance.rate = options.rate || this.rate;
          fallbackUtterance.pitch = options.pitch || this.pitch;
          fallbackUtterance.volume = options.volume || this.volume;
          fallbackUtterance.onend = () => {
            this.isSpeaking = false;
            this.onSpeakingChange?.(false);
            resolve(true);
            this._processQueue();
          };
          fallbackUtterance.onerror = () => {
            this.isSpeaking = false;
            this.onSpeakingChange?.(false);
            resolve(false);
            this._processQueue();
          };
          this.synth.speak(fallbackUtterance);
        } else {
          this.isSpeaking = false;
          this.onSpeakingChange?.(false);
          resolve(false);
          this._processQueue();
        }
      };

      await audio.play();
    } catch (e) {
      this.isSpeaking = false;
      this.onSpeakingChange?.(false);
      resolve(false);
      this._processQueue();
    }
  }

  _processQueue() {
    if (this.speechQueue.length > 0 && !this.isSpeaking) {
      const next = this.speechQueue.shift();
      if (next?.playSpeech) {
        next.playSpeech();
      } else if (next?.utterance && this.synth) {
        this.synth.speak(next.utterance);
      }
    }
  }

  // Stop all speech
  stop() {
    // Invalidate any in-flight network/audio callbacks before cancelling them.
    this.activePlaybackId += 1;
    if (this.synth) {
      this.synth.cancel();
    }
    if (this.elevenLabsAudio) {
      try {
        this.elevenLabsAudio.pause();
        this.elevenLabsAudio.currentTime = 0;
      } catch (e) {}
    }
    if (this.activeBlobUrl) {
      URL.revokeObjectURL(this.activeBlobUrl);
      this.activeBlobUrl = null;
    }
    
    // Resolve any currently playing promise
    if (this.currentResolve) {
      this.currentResolve(false);
      this.currentResolve = null;
    }
    
    // Resolve all queued promises
    this.speechQueue.forEach(item => {
      if (item.resolve) item.resolve(false);
    });
    this.speechQueue = [];
    
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.onSpeakingChange?.(false);
  }

  // Interrupt current speech and speak new text
  interrupt(text, lang = 'en') {
    this.stop();
    return this.speak(text, lang);
  }

  // Set speech rate
  setRate(rate) {
    this.rate = Math.max(0.5, Math.min(2, rate));
  }

  // ── Sound Effects via Web Audio API ──

  // Play a success chime (two ascending tones)
  playSuccess() {
    try {
      const ctx = this._getAudioContext();
      const now = ctx.currentTime;

      // First tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc1.connect(gain1).connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Second tone (higher)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.15); // E5
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.3, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.5);
    } catch (e) { /* Audio not available */ }
  }

  // Play an error tone (descending)
  playError() {
    try {
      const ctx = this._getAudioContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(330, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) { /* Audio not available */ }
  }

  // Play a gentle notification ping
  playNotification() {
    try {
      const ctx = this._getAudioContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) { /* Audio not available */ }
  }

  // Play listening indicator (subtle blip)
  playListeningStart() {
    try {
      const ctx = this._getAudioContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(800, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) { /* Audio not available */ }
  }

  // Play urgent alarm (for red flags)
  playAlarm() {
    try {
      const ctx = this._getAudioContext();
      const now = ctx.currentTime;

      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now + i * 0.3);
        gain.gain.setValueAtTime(0.15, now + i * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.3 + 0.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.3);
        osc.stop(now + i * 0.3 + 0.2);
      }
    } catch (e) { /* Audio not available */ }
  }

  // Play processing/thinking sound (subtle bubbles)
  playProcessing() {
    try {
      const ctx = this._getAudioContext();
      const now = ctx.currentTime;

      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const freq = 400 + Math.random() * 400;
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.06, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.1);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.1);
      }
    } catch (e) { /* Audio not available */ }
  }
}

// Singleton instance
const audioFeedback = new AudioFeedbackEngine();

export default audioFeedback;
export { AudioFeedbackEngine };
