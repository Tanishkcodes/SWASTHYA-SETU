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

  async _request(payload, accept = 'application/json') {
    if (!this.available) throw new Error('Voice service is not configured');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
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
      this.disabledUntil = Date.now() + 60000;
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
      }, 'audio/mpeg');
      return response.blob();
    } catch (error) {
      // Do not repeatedly delay page prompts when the TTS account has no
      // credits. Semantic navigation remains available independently.
      this.ttsDisabledUntil = Date.now() + 60000;
      throw error;
    }
  }

  async understand({ transcript, language, pageId, actions, routes, expectsFreeText }) {
    const response = await this._request({
      action: 'intent', transcript, language, pageId,
      actions, routes, expectsFreeText: Boolean(expectsFreeText),
    });
    return response.json();
  }

  async extractRegistration(transcript, language) {
    const response = await this._request({ action: 'extract_registration', transcript, language });
    return response.json();
  }

  async translate(text, targetLanguage, contextType = 'general') {
    const response = await this._request({ action: 'translate', text, targetLanguage, contextType });
    return response.json();
  }
}

export default new VoiceAIService();
