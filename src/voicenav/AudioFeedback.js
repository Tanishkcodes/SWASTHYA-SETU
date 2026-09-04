import voiceAIService from './VoiceAIService';

/* ============================================
   SWASTHYA SETU — Audio Feedback System
   TTS synthesis + sound effects via Web Audio API
   ============================================ */

function isMutedPortal() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  return path.includes('/physician') || 
         path.includes('/doctor') || 
         path.includes('/admin') || 
         search.includes('role=doctor') || 
         search.includes('role=admin');
}

class AudioFeedbackEngine {
  constructor() {
    this.synth = null;
    this.audioCtx = null;
    this.elevenLabsAudio = typeof Audio !== 'undefined' ? new Audio() : null;
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
    this._audioCache = new Map();
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
      cleaned = cleaned.replace(/\bpatients?\b/gi, match => match.toLowerCase().endsWith('s') ? 'मरीज़ों' : 'मरीज़');
      cleaned = cleaned.replace(/प[ेै]?शेंट|पतिन्त/g, 'मरीज़');
      // Some neural/device Hindi voices incorrectly render "हैं" as "हो".
      // A phonetic terminal न makes the intended "hain" sound unambiguous;
      // this only changes speech input, never the visible Hindi UI text.
      cleaned = cleaned.replace(/हैं/g, 'हैन्');
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

  async playWelcomeAudio(audioUrl = '/welcome_hi.mp3', fallbackUrl = '/welcome_sarah.mp3') {
    if (isMutedPortal()) return false;
    this.stop();
    const id = this.activePlaybackId;
    this.isSpeaking = true;
    this.onSpeakingChange?.(true);
    return new Promise(resolve => {
      let loadTimer;
      let attempt = 0;
      this.currentResolve = success => { clearTimeout(loadTimer); resolve(success); };
      const finish = success => {
        if (id !== this.activePlaybackId) return;
        clearTimeout(loadTimer);
        this.currentResolve = null;
        this.stop();
        resolve(success);
      };
      const play = (url, canFallback) => {
        if (id !== this.activePlaybackId) return;
        const currentAttempt = ++attempt;
        const audio = new Audio(url);
        this.elevenLabsAudio = audio;
        const failed = () => {
          if (id !== this.activePlaybackId || currentAttempt !== attempt) return;
          clearTimeout(loadTimer);
          ++attempt;
          audio.pause();
          if (canFallback && fallbackUrl && fallbackUrl !== url) play(fallbackUrl, false);
          else finish(false);
        };
        audio.onended = () => {
          if (currentAttempt === attempt) finish(true);
        };
        audio.onplaying = () => {
          if (currentAttempt === attempt) clearTimeout(loadTimer);
        };
        audio.onerror = failed;
        loadTimer = setTimeout(failed, 8000);
        audio.play().catch(error => {
          if (id !== this.activePlaybackId || currentAttempt !== attempt) return;
          // Autoplay denial retries the original recording on the next user gesture.
          if (error.name === 'NotAllowedError') finish(false);
          else failed();
        });
      };
      play(audioUrl, true);
    });
  }

  async speak(rawText, lang = 'en', options = {}) {
    if (isMutedPortal() || !rawText?.trim()) return false;
    this.stop();
    const id = this.activePlaybackId;
    this.isSpeaking = true;
    this.onSpeakingChange?.(true);
    try {
      const text = this._preprocessTextForTTS(rawText, lang);
      const key = JSON.stringify([text, lang, options.speed]);
      let blob = this._audioCache.get(key);
      if (!blob) {
        blob = await voiceAIService.synthesize(text, lang, null, options);
        this._audioCache.set(key, blob);
        if (this._audioCache.size > 24) this._audioCache.delete(this._audioCache.keys().next().value);
      }
      if (id !== this.activePlaybackId) return false;
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      this.activeBlobUrl = url;
      this.elevenLabsAudio = audio;
      return await new Promise(resolve => {
        this.currentResolve = resolve;
        const finish = success => {
          if (id !== this.activePlaybackId) return;
          this.stop();
          resolve(success);
        };
        audio.onended = () => { this.currentResolve = null; finish(true); };
        audio.onerror = () => finish(false);
        audio.play().catch(() => finish(false));
      });
    } catch (error) {
      if (id === this.activePlaybackId) {
        this.stop();
      }
      console.warn('ElevenLabs speech unavailable:', error.message);
      return false;
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
