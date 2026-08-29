// Setup type definitions for Supabase Edge Runtime / Deno
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// @ts-ignore Fallback declaration for IDEs without Deno LSP
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (request: Request) => Promise<Response> | Response): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const payload = await request.json();
    const geminiModel = Deno.env.get('GEMINI_MODEL') || 'gemini-3.5-flash-lite';

    if (payload.action === 'tts') {
      const key = Deno.env.get('ELEVENLABS_API_KEY');
      const defaultVoice = Deno.env.get('ELEVENLABS_VOICE_ID');
      if (!key) return json({ error: 'ElevenLabs is not configured on the server' }, 503);
      const text = String(payload.text || '').trim().slice(0, 5000);
      if (!text) return json({ error: 'Text is required' }, 400);
      const voiceId = payload.voiceId || defaultVoice || 'EXAVITQu4vr4xnSDxMaL';
      const requestedSpeed = Number(payload.speed);
      const speed = Number.isFinite(requestedSpeed) ? Math.min(1.1, Math.max(0.85, requestedSpeed)) : 0.98;
      const result = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'xi-api-key': key },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.55, similarity_boost: 0.80, style: 0.10, use_speaker_boost: true, speed },
        }),
      });
      if (!result.ok) {
        const detail = await result.text();
        console.error('ElevenLabs error', result.status, detail);
        return json({ error: result.status === 401 ? 'ElevenLabs credentials were rejected' : 'Speech quota or synthesis failed' }, result.status);
      }
      return new Response(result.body, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': result.headers.get('content-type') || 'audio/mpeg', 'Cache-Control': 'private, max-age=3600' },
      });
    }

    if (payload.action === 'intent' || payload.action === 'extract_registration' || payload.action === 'translate') {
      const key = Deno.env.get('GEMINI_API_KEY');
      if (!key) return json({ error: 'Intent AI is not configured on the server' }, 503);

      if (payload.action === 'translate') {
        const prompt = payload.contextType === 'name' || payload.contextType === 'doctor'
          ? `Transliterate this name phonetically into language ${payload.targetLanguage}. Return only the name: ${JSON.stringify(String(payload.text || '').slice(0, 1000))}`
          : `Translate this healthcare UI text naturally into language ${payload.targetLanguage}. Preserve medical meaning and return only the translation: ${JSON.stringify(String(payload.text || '').slice(0, 1000))}`;
        const result = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1 } }),
        });
        if (!result.ok) return json({ error: 'Translation failed' }, 502);
        const body = await result.json();
        return json({ text: String(body.candidates?.[0]?.content?.parts?.[0]?.text || '').trim().replace(/^["'`]|["'`]$/g, '') });
      }

      if (payload.action === 'extract_registration') {
        const schema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'string' },
            phone: { type: 'string' },
            gender: { type: 'string', enum: ['', 'Male', 'Female', 'Other'] },
          },
          required: ['name', 'age', 'phone', 'gender'],
          additionalProperties: false,
        };
        const prompt = `You are an intelligent clinical registration entity extraction engine for Indian healthcare kiosks.
The user may speak in ANY Indian language (Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia), English, or code-mixed dialects (Hinglish/Tanglish/etc.), in ANY arbitrary word order, with conversational padding, spoken digits, or self-corrections (e.g., "age 30 no 35", "my name is Rajesh sorry Ramesh Kumar", "phone number 9876543210").

Task: Extract patient registration fields accurately from the transcript:
- name: The patient's clean personal name in Title Case (strip honorifics and phrases like 'mera naam', 'my name is', 'likhiye', 'myself'). If absent, return empty string.
- age: Only numerical age digits (e.g., '32'). Respect self-corrections (e.g., '30 nahi 35' -> '35'). If absent, return empty string.
- phone: 10-digit mobile number digits (e.g., '9876543210'). Convert any spoken number words into digits. If absent, return empty string.
- gender: Exactly 'Male', 'Female', 'Other', or empty string if not mentioned (e.g., 'purush'/'aadmi'/'man' -> 'Male', 'mahila'/'aurat'/'woman' -> 'Female').

Transcript: ${JSON.stringify(String(payload.transcript || '').slice(0, 2000))}`;
        const result = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', responseJsonSchema: schema, temperature: 0 },
          }),
        });
        if (!result.ok) return json({ error: 'Registration extraction failed' }, 502);
        const body = await result.json();
        let extracted = {};
        try {
          const rawText = body.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          const cleanText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
          extracted = JSON.parse(cleanText);
        } catch (e) {
          console.error('Error parsing registration JSON:', e);
        }
        return json(extracted);
      }

      const actions = Array.isArray(payload.actions) ? payload.actions.slice(0, 100) : [];
      const routes = Array.isArray(payload.routes) ? payload.routes.slice(0, 50) : [];
      const actionIntents = actions.map((a: any) => (typeof a === 'string' ? a : a?.intent || a?.id || '')).filter(Boolean);
      const allowed: string[] = Array.from(new Set([...actionIntents, 'navigate', 'free_text', 'out_of_context']));

      const prompt = `You control a healthcare kiosk. Understand the user's meaning even with accent, code-mixing, politeness, indirect phrasing, or grammatical errors.
Language hint: ${payload.language || 'unknown'}; current page: ${payload.pageId || 'unknown'}; page expects an answer: ${Boolean(payload.expectsFreeText)}.
Available actions: ${JSON.stringify(actions)}
Available destinations: ${JSON.stringify(routes)}
User said: ${JSON.stringify(String(payload.transcript || '').slice(0, 2000))}
Return one safe action. Never invent an action or destination. Use free_text for an answer to a page question. Use navigate with target equal to an available route id. Use out_of_context only when no available action reasonably matches. Reply message, if needed, must use the user's language.`;

      const schema = {
        type: 'object',
        properties: {
          intent: { type: 'string', enum: allowed },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          target: { type: 'string', description: 'Available route id, or empty string' },
          value: { type: 'string', description: 'Optional extracted value, or empty string' },
          message: { type: 'string', description: 'Localized clarification, or empty string' },
        },
        required: ['intent', 'confidence', 'target', 'message'],
        additionalProperties: false,
      };

      const result = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', responseJsonSchema: schema, temperature: 0.05 },
        }),
      });
      if (!result.ok) return json({ error: 'Intent understanding failed' }, 502);
      const body = await result.json();
      let parsed: any = {};
      try {
        const rawText = body.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const cleanText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
        parsed = JSON.parse(cleanText);
      } catch (e) {
        console.error('Error parsing intent JSON:', e);
      }
      if (!allowed.includes(parsed?.intent)) return json({ intent: 'out_of_context', confidence: 0, target: null, message: null });
      return json(parsed);
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: 'Voice service request failed' }, 500);
  }
});
