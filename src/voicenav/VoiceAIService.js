/** Server-backed multilingual voice intelligence.
 * Browser bundles contain only the Supabase publishable key; provider secrets
 * remain in the Edge Function environment.
 */
class VoiceAIService {
  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pzaqzwmpynlqxsclbesj.supabase.co';
    this.baseUrl = `${supabaseUrl}/functions/v1/voice-ai`;
    this.publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      || import.meta.env.VITE_SUPABASE_ANON_KEY
      || 'sb_publishable_aQTTcFxLfGPTzEphAE6DWQ_BqHlnDVU';
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
    const langCode = targetLanguage || 'en';
    if (langCode === 'en') return { translations: texts };

    // 1. Direct Edge Function structured batch_translate
    try {
      const response = await this._request({
        action: 'batch_translate',
        texts,
        targetLanguage: langCode
      }, 'application/json', 16000);
      const data = await response.json();
      if (Array.isArray(data?.translations) && data.translations.length === texts.length) {
        return { translations: data.translations };
      }
    } catch (e) {
      console.warn('Direct batch_translate notice:', e);
    }

    // 2. Delimited fallback
    try {
      const combined = texts.join(' ||| ');
      const res = await this.translate(combined, langCode);
      if (res?.text) {
        const parts = res.text.split(/\s*\|\|\|\s*/);
        if (parts.length === texts.length) {
          return { translations: parts };
        }
      }
    } catch (e) {
      console.warn('Batch translate delimited error:', e);
    }

    // 3. Parallel individual fallback
    try {
      const translations = await Promise.all(
        texts.map(t => this.translate(t, langCode).then(r => r?.text || t).catch(() => t))
      );
      return { translations };
    } catch {
      return { translations: texts };
    }
  }

  async anamnesis({ disease, history, latestInput, language, doctorName, doctorSpecialty, isAyurvedic, patient, caseSummary, questionCount = 0, phase = 'interview', requireTouchOptions = false }) {
    const response = await this._request({
      action: 'anamnesis', disease, history, latestInput, language,
      doctorName, doctorSpecialty, isAyurvedic, patient, caseSummary,
      questionCount, phase, requireTouchOptions,
    }, 'application/json', 18000);
    return response.json();
  }

  async analyzeReport(image, fileName = '') {
    // Keep provider credentials and validation on the server. A service error
    // must reach the caller, never become fabricated clinical data.
    const response = await this._request({
      action: 'analyze_report',
      image,
      fileName,
    }, 'application/json', 45000);
    const data = await response.json();
    if (!data || data.error || typeof data.isMedicalDocument !== 'boolean') {
      throw new Error(data?.error || 'Vision analysis returned an invalid response.');
    }
    return data;
  }
  async getClinicalSummary({ patient, disease, caseSummary, reports, doctorSpecialty, language = 'en' }) {
    try {
      const response = await this._request({
        action: 'clinical_summary',
        patient,
        disease,
        caseSummary,
        reports,
        doctorSpecialty,
        language
      }, 'application/json', 15000);
      return await response.json();
    } catch (e) {
      console.warn('VoiceAIService getClinicalSummary notice:', e);
      return null;
    }
  }
}

export default new VoiceAIService();
