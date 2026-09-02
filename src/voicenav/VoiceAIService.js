/** Server-backed multilingual voice intelligence.
 * Browser bundles contain only the Supabase publishable key; provider secrets
 * remain in the Edge Function environment.
 */
class VoiceAIService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_SUPABASE_URL
      ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-ai`
      : null;
    this.publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      || import.meta.env.VITE_SUPABASE_ANON_KEY;
    this.disabledUntil = 0;
    this.ttsDisabledUntil = 0;
  }

  get available() {
    return Boolean(this.baseUrl && this.publishableKey && Date.now() >= this.disabledUntil);
  }

  get ttsAvailable() {
    return this.available && Date.now() >= this.ttsDisabledUntil;
  }

  async _request(payload, accept = 'application/json', timeoutMs = 12000) {
    if (!this.available) throw new Error('Voice service is not configured');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: accept,
          apikey: this.publishableKey,
          Authorization: `Bearer ${this.publishableKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (error) {
      console.warn('Voice AI request error:', error?.message || error);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) {
      let message = `Voice service returned ${response.status}`;
      try { message = (await response.json()).error || message; } catch { /* binary/empty response */ }
      throw new Error(message);
    }
    return response;
  }

  async synthesize(text, language, voiceId = null, settings = {}) {
    if (!this.ttsAvailable) throw new Error('Studio speech is temporarily unavailable');
    try {
      const response = await this._request({
        action: 'tts', text, language, voiceId,
        speed: settings.speed,
      }, 'audio/mpeg', 10000);
      return response.blob();
    } catch (error) {
      // Do not repeatedly delay page prompts when the TTS account has no
      // credits. Semantic navigation remains available independently.
      this.ttsDisabledUntil = Date.now() + 60000;
      throw error;
    }
  }

  async understand({ transcript, language, pageId, actions, routes, expectsFreeText, recognitionAlternatives = [] }) {
    const response = await this._request({
      action: 'intent', transcript, language, pageId,
      actions, routes, expectsFreeText: Boolean(expectsFreeText), recognitionAlternatives,
    }, 'application/json', 12000);
    return response.json();
  }

  async extractRegistration(transcript, language, context = {}) {
    const response = await this._request({ action: 'extract_registration', transcript, language, context });
    return response.json();
  }

  async translate(text, targetLanguage, contextType = 'general') {
    const langMap = {
      en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu',
      bn: 'Bengali', mr: 'Marathi', gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam'
    };
    const targetLang = langMap[targetLanguage] || targetLanguage || 'English';
    const response = await this._request({ action: 'translate', text, targetLanguage: targetLang, contextType });
    return response.json();
  }

  async batchTranslate(texts, targetLanguage) {
    if (!Array.isArray(texts) || texts.length === 0) return { translations: [] };
    const response = await this._request({ action: 'batch_translate', texts, targetLanguage }, 'application/json', 12000);
    return response.json();
  }

  async anamnesis({ disease, history, latestInput, language, doctorName, doctorSpecialty, isAyurvedic, patient, caseSummary, questionCount = 0, phase = 'interview', requireTouchOptions = false }) {
    const response = await this._request({
      action: 'anamnesis', disease, history, latestInput, language,
      doctorName, doctorSpecialty, isAyurvedic, patient, caseSummary,
      questionCount, phase, requireTouchOptions,
    }, 'application/json', 18000);
    return response.json();
  }
}

export default new VoiceAIService();
