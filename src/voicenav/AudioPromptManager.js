/* ============================================
   SWASTHYA SETU — Audio Prompt Manager
   Auto-play page instructions, idle prompts,
   encouragements, and contextual audio cues
   ============================================ */

import audioFeedback from './AudioFeedback';
import { getAudioPrompt } from './LanguagePack';

class AudioPromptManager {
  constructor() {
    this.idleTimer = null;
    this.idleTimeout = 30000; // 30 seconds of no interaction
    this.currentLang = 'en';
    this.isEnabled = true;
    this.hasSpokenWelcome = {};
    this.currentPageId = null;
    this._langChangeTimer = null;
    this._landingGestureRetry = null;
  }

  // The kiosk's first greeting is intentionally always Hindi, independent of
  // the previously selected UI language. Devanagari gives TTS engines the most
  // reliable pronunciation of “Swasthya Setu”.
  async speakInitialLandingWelcome() {
    this.currentPageId = 'landing';
    if (!this.isEnabled || this.hasSpokenWelcome.landing_initial_hi) return;
    const text = 'नमस्ते! स्वास्थ्य सेतु में आपका स्वागत है।';
    // Use the bundled studio recording first so the greeting is immediate and
    // independent of ElevenLabs credits/network availability.
    const spoken = await audioFeedback.playWelcomeAudio('/welcome_hi.mp3', text, 'hi');
    if (spoken) {
      this.hasSpokenWelcome.landing_initial_hi = true;
      return;
    }

    // Some browsers block autoplay until the first user gesture. Retry once,
    // but only if the visitor is still on the landing page.
    if (typeof window !== 'undefined' && !this._landingGestureRetry) {
      this._landingGestureRetry = () => {
        const retry = this._landingGestureRetry;
        this._landingGestureRetry = null;
        if (retry) window.removeEventListener('pointerdown', retry);
        if (this.currentPageId === 'landing') this.speakInitialLandingWelcome();
      };
      window.addEventListener('pointerdown', this._landingGestureRetry, { once: true });
    }
  }

  setLanguage(lang, autoReplay = true) {
    const prevLang = this.currentLang;
    this.currentLang = lang;

    // When language changes, immediately speak the page guidance in the new language!
    if (autoReplay && prevLang !== lang && this.isEnabled) {
      if (this._langChangeTimer) clearTimeout(this._langChangeTimer);
      audioFeedback.stop();
      this._langChangeTimer = setTimeout(() => {
        const pageId = this.currentPageId || 'patientDashboard';
        const promptKey = `welcome${pageId.charAt(0).toUpperCase() + pageId.slice(1)}`;
        const text = getAudioPrompt(this.currentLang, promptKey);
        if (text) {
          audioFeedback.speak(text, this.currentLang);
        }
      }, 150);
    }
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clearIdleTimer();
      audioFeedback.stop();
    }
  }

  // Set current page for audio context
  setCurrentPage(pageId) {
    this.currentPageId = pageId;
  }

  // Speak a page welcome message
  async speakPageWelcome(pageId, force = false) {
    this.currentPageId = pageId;
    if (!this.isEnabled) return;
    const cacheKey = `${pageId}_${this.currentLang}`;
    if (!force && this.hasSpokenWelcome[cacheKey]) return;

    const promptKey = `welcome${pageId.charAt(0).toUpperCase() + pageId.slice(1)}`;
    let text = getAudioPrompt(this.currentLang, promptKey);
    if (!text && typeof document !== 'undefined') {
      const heading = document.querySelector('main h1, main h2, h1')?.textContent?.trim();
      const description = document.querySelector('main p, [role="main"] p')?.textContent?.trim();
      text = [heading, description].filter(Boolean).join('. ').slice(0, 600);
    }

    if (text) {
      this.hasSpokenWelcome[cacheKey] = true;
      await audioFeedback.speak(text, this.currentLang);
    }
  }

  // Force speak a page welcome (even if already spoken)
  async forceSpeak(promptKey) {
    if (!this.isEnabled) return;
    const text = getAudioPrompt(this.currentLang, promptKey);
    if (text) {
      await audioFeedback.speak(text, this.currentLang);
    }
  }

  // Speak custom text
  async speakText(text) {
    if (!this.isEnabled) return;
    await audioFeedback.speak(text, this.currentLang);
  }

  // Speak and interrupt any current speech
  async interruptWith(text) {
    if (!this.isEnabled) return;
    await audioFeedback.interrupt(text, this.currentLang);
  }

  // Start idle detection — speaks prompt if user is inactive
  startIdleDetection(customPrompt = null) {
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => {
      if (this.isEnabled) {
        const text = customPrompt || getAudioPrompt(this.currentLang, 'idlePrompt');
        if (text) {
          audioFeedback.speak(text, this.currentLang);
        }
      }
    }, this.idleTimeout);
  }

  // Reset idle timer (call on any user interaction)
  resetIdleTimer() {
    if (this.idleTimer) {
      this.clearIdleTimer();
      this.startIdleDetection();
    }
  }

  clearIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  // Speak encouragement after a response
  async speakEncouragement() {
    if (!this.isEnabled) return;
    const text = getAudioPrompt(this.currentLang, 'encouragement');
    if (text && Math.random() > 0.5) { // Only sometimes to avoid being annoying
      await audioFeedback.speak(text, this.currentLang);
    }
  }

  // Speak section completion
  async speakSectionDone() {
    if (!this.isEnabled) return;
    audioFeedback.playSuccess();
    const text = getAudioPrompt(this.currentLang, 'sectionDone');
    if (text) {
      await audioFeedback.speak(text, this.currentLang);
    }
  }

  // Speak error/not understood
  async speakError() {
    if (!this.isEnabled) return;
    audioFeedback.playError();
    const text = getAudioPrompt(this.currentLang, 'errorPrompt');
    if (text) {
      await audioFeedback.speak(text, this.currentLang);
    }
  }

  // Reset welcome tracking (e.g., on session reset)
  resetWelcomes() {
    this.hasSpokenWelcome = {};
  }

  // Stop everything
  stop() {
    this.clearIdleTimer();
    if (this._landingGestureRetry && typeof window !== 'undefined') {
      window.removeEventListener('pointerdown', this._landingGestureRetry);
      this._landingGestureRetry = null;
    }
    audioFeedback.stop();
  }
}

// Singleton
const audioPromptManager = new AudioPromptManager();

export default audioPromptManager;
export { AudioPromptManager };
