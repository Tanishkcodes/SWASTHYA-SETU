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

  async analyzeReport(image, fileName = '') {
    try {
      const response = await this._request({
        action: 'analyze_report',
        image,
        fileName,
      }, 'application/json', 20000);
      const data = await response.json();
      if (data && !data.error && (data.isMedicalDocument !== undefined || data.summary)) return data;
    } catch (e) {
      console.warn('Edge function analyze_report notice, checking direct fallback:', e);
    }

    const clientKey = import.meta.env?.VITE_GEMINI_API_KEY;
    if (clientKey && image && image.startsWith('data:image')) {
      try {
        const match = image.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          const mimeType = match[1];
          const base64Data = match[2];
          const prompt = `You are an expert Clinical Vision OCR and Medical Intelligence system for Swasthya Setu.
Carefully examine the visual contents and text in the attached image (File name: "${fileName}").

TASK:
1. Determine if this image is a genuine medical report, diagnostic lab panel, prescription, radiology scan (X-Ray/CT/MRI), or hospital document.
2. If it IS a medical report:
   - Extract the actual printed/written test parameters, results, units, and reference ranges.
   - Assign appropriate clinical flags ('Normal', 'High', 'Low', 'Borderline', 'Abnormal', 'Clear').
   - Provide a clear, concise 2-3 line clinical summary and diagnostic impression.
3. If it is NOT a medical document (for example: a personal photo, selfie, random object, animal, nature, scenery, unrelated screenshot):
   - Set "isMedicalDocument": false.
   - Set "documentType": describe what is actually in the image (e.g. "Personal Photograph / Non-Medical Image").
   - In "summary", write an accurate, helpful notice: "This uploaded image contains [describe what it is, e.g. a photograph of people/landscape]. No medical diagnostic data or clinical test parameters were detected in this image."
   - Set "detectedParameters": [] (empty array).`;

          const schema = {
            type: 'object',
            properties: {
              isMedicalDocument: { type: 'boolean' },
              documentType: { type: 'string' },
              labOrHospitalName: { type: 'string' },
              date: { type: 'string' },
              detectedParameters: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    result: { type: 'string' },
                    unit: { type: 'string' },
                    ref: { type: 'string' },
                    flag: { type: 'string', enum: ['Normal', 'High', 'Low', 'Borderline', 'Abnormal', 'Clear'] }
                  },
                  required: ['name', 'result']
                }
              },
              summary: { type: 'string' },
              impression: { type: 'string' }
            },
            required: ['isMedicalDocument', 'documentType', 'summary']
          };

          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${clientKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { inline_data: { mime_type: mimeType, data: base64Data } },
                  { text: prompt }
                ]
              }],
              generationConfig: {
                responseMimeType: 'application/json',
                responseJsonSchema: schema,
                temperature: 0.1,
                maxOutputTokens: 1500
              }
            })
          });
          if (res.ok) {
            const body = await res.json();
            const textContent = body?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textContent) return JSON.parse(textContent);
          }
        }
      } catch (err) {
        console.warn('Direct Gemini Vision fallback failed:', err);
      }
    }

    return null;
  }
}

export default new VoiceAIService();
