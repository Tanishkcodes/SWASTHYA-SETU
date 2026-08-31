import "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (request: Request) => Promise<Response> | Response): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
const parseModelJson = (body: any) => {
  const raw = String(body?.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
  return JSON.parse(raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim());
};

async function generate(key: string, model: string, prompt: string, schema?: unknown, temperature = 0.05) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: schema
        ? { responseMimeType: 'application/json', responseJsonSchema: schema, temperature }
        : { temperature },
    }),
  });
  if (!response.ok) {
    console.error('Gemini error', response.status, await response.text());
    throw new Error(`AI request failed (${response.status})`);
  }
  return response.json();
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const payload = await request.json();
    const action = String(payload.action || '');

    if (action === 'tts') {
      const key = Deno.env.get('ELEVENLABS_API_KEY');
      if (!key) return json({ error: 'ElevenLabs is not configured on the server' }, 503);
      const text = String(payload.text || '').trim().slice(0, 5000);
      if (!text) return json({ error: 'Text is required' }, 400);
      const voiceId = payload.voiceId || Deno.env.get('ELEVENLABS_VOICE_ID') || 'EXAVITQu4vr4xnSDxMaL';
      const requestedSpeed = Number(payload.speed);
      const speed = Number.isFinite(requestedSpeed) ? Math.min(1.1, Math.max(0.85, requestedSpeed)) : 0.98;
      const result = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'xi-api-key': key },
        body: JSON.stringify({ text, model_id: 'eleven_turbo_v2_5', voice_settings: {
          stability: 0.50, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true, speed,
        }}),
      });
      if (!result.ok) {
        console.error('ElevenLabs error', result.status, await result.text());
        return json({ error: result.status === 401 ? 'ElevenLabs credentials were rejected' : 'Speech quota or synthesis failed' }, result.status);
      }
      return new Response(result.body, { status: 200, headers: {
        ...corsHeaders, 'Content-Type': result.headers.get('content-type') || 'audio/mpeg', 'Cache-Control': 'private, max-age=3600',
      }});
    }

    if (!['intent','extract_registration','translate','anamnesis'].includes(action)) return json({ error: 'Unknown action' }, 400);
    const key = Deno.env.get('GEMINI_API_KEY');
    if (!key) return json({ error: 'Gemini AI is not configured on the server' }, 503);
    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash-lite';

    if (action === 'translate') {
      const text = String(payload.text || '').trim().slice(0, 1500);
      if (!text) return json({ text: '' });
      const prompt = payload.contextType === 'name' || payload.contextType === 'doctor'
        ? `Transliterate this name phonetically into ${payload.targetLanguage}. Return only the name: ${JSON.stringify(text)}`
        : `Translate this healthcare interface text naturally into ${payload.targetLanguage}. Preserve medical meaning, numbers and names. Return only the translation: ${JSON.stringify(text)}`;
      const body = await generate(key, model, prompt, undefined, 0.1);
      return json({ text: String(body?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim().replace(/^["'`]|["'`]$/g, '') });
    }

    if (action === 'extract_registration') {
      const schema = { type: 'object', properties: {
        name: { type: 'string' }, age: { type: 'string' }, phone: { type: 'string' },
        gender: { type: 'string', enum: ['', 'Male', 'Female', 'Other'] },
      }, required: ['name','age','phone','gender'], additionalProperties: false };
      const prompt = `Extract Indian patient registration data from speech in English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam or any code-mixed form. Fields may be in any order with filler words and self-corrections; the last correction wins.
- name: clean patient name in Title Case, without honorifics or framing phrases; empty if absent.
- age: digits only; empty if absent.
- phone: exactly the spoken 10 mobile digits, converting number words; empty if absent.
- gender: exactly Male, Female, Other, or empty.
Transcript: ${JSON.stringify(String(payload.transcript || '').slice(0, 2000))}`;
      return json(parseModelJson(await generate(key, model, prompt, schema, 0)));
    }

    if (action === 'anamnesis') {
      const schema = { type: 'object', properties: {
        question: { type: 'string' },
        options: { type: 'array', minItems: 5, maxItems: 5, items: { type: 'object', properties: {
          text: { type: 'string' }, iconType: { type: 'string', enum: ['target','chest','back','shoulder','question','clock','flame','pill','moon','wind','thermometer','stomach','headache','cough','bodypain','leaf'] },
        }, required: ['text','iconType'], additionalProperties: false }},
        isFinished: { type: 'boolean' }, completionMessage: { type: 'string' },
        caseSummaryUpdate: { type: 'object', properties: {
          location: { type: 'string' }, nature: { type: 'string' }, severity: { type: 'string' },
          duration: { type: 'string' }, triggers: { type: 'string' }, medications: { type: 'string' },
          associatedSymptoms: { type: 'string' }, redFlags: { type: 'string' },
          prakriti: { type: 'string' }, vikriti: { type: 'string' }, sara: { type: 'string' },
          samhanana: { type: 'string' }, pramana: { type: 'string' }, satmya: { type: 'string' },
          satva: { type: 'string' }, aharaShakti: { type: 'string' }, vyayamaShakti: { type: 'string' },
          vaya: { type: 'string' },
        }, additionalProperties: false },
      }, required: ['question','options','isFinished','completionMessage','caseSummaryUpdate'], additionalProperties: false };
      const prompt = `You are a world-renowned AI Clinical Diagnostic & Anamnesis Specialist for Swasthya Setu Indian healthcare kiosks.
Your mission is to conduct a deeply intelligent, adaptive, empathetic clinical intake tailored specifically to the patient, their disease, and the doctor's exact medical specialty.

Context:
- Output language code: ${payload.language || 'en'} (Write the question and all 5 options naturally in this language; if Indic, preserve correct medical terms).
- Attending Doctor: ${payload.doctorName || 'Doctor'}; Specialty: ${payload.doctorSpecialty || 'General Medicine'}.
- Care System: ${payload.isAyurvedic ? 'AYURVEDA / AYUSH (Complete Classical Dashavidha Pariksha / दशविध परीक्षा)' : 'ALLOPATHY / MODERN MEDICINE (Advanced SOCRATES & Differential Diagnostics)'}.
- Patient's Chief Complaint: ${JSON.stringify(payload.disease || 'General discomfort')}.
- Question Number: ${Number(payload.questionNumber || 1)}.
- Prior History: ${JSON.stringify((payload.history || []).slice(-14))}.
- Patient's Latest Response: ${JSON.stringify(String(payload.latestInput || '').slice(0, 1500))}.

========================================================================
[1. AYURVEDIC CLINICAL PROTOCOL: COMPLETE DASHAVIDHA PARIKSHA (दशविध परीक्षा)]
========================================================================
For Ayurvedic consultations, dynamically examine the exact 10 classical parameters from Charaka Samhita in the context of the patient's illness:
1. Prakriti (प्रकृति): Natural Doshic constitution (Vataja, Pittaja, Kaphaja, or Dwandwaja).
2. Vikriti (विकृति): Current pathological Doshic vitiation and disease severity in this illness.
3. Sara (सार): Quality and health of Dhatus/tissues (Rasa, Rakta, Mamsa, Meda, Asthi, Majja, Shukra, Sattva).
4. Samhanana (संहनन): Physical compactness and structural firmness of the body frame.
5. Pramana (प्रमाण): Body measurements, height/weight balance, and structural proportions.
6. Satmya (सात्म्य): Habituation — what foods, habits, and climates the body tolerates or reacts to.
7. Satva (सत्त्व): Mental strength, emotional fortitude, stress threshold, and sleep (Nidra).
8. Ahara Shakti (आहार शक्ति): Intake capacity (Abhyavaharana) and digestive fire (Jarana / Agni: Sama, Manda, Tikshna, Vishama).
9. Vyayama Shakti (व्यायाम शक्ति): Physical capacity, work endurance, and fatigue limit.
10. Vaya (वय): Age stage (Bala, Madhyama, Vriddha) and chronological impact.

*Dynamic Disease Rule for Ayurveda*: Adapt the Dashavidha questions directly to the illness. For example:
- If joint/back pain: Evaluate Vata-Kaphaja Vikriti, Asthi-Majja Sara, Krura Kostha, and Vyayama Shakti limitation.
- If acidity/stomach: Evaluate Pitta-Vataja Vikriti, Tikshna/Amlapitta Agni, and Amla-Lavana Satmya.
- If skin disease: Evaluate Rakta-Twak Sara, Pitta-Kapha Vikriti, and Katu-Ushna Ahara triggers.

========================================================================
[2. ALLOPATHIC CLINICAL PROTOCOL: ADVANCED SOCRATES & DIFFERENTIAL DIAGNOSIS]
========================================================================
For Modern Medicine, conduct deep diagnostic questioning matching the attending specialist:
- S (Site & Depth): Pinpoint anatomical origin (e.g., epigastric vs right hypochondrium vs retrosternal).
- O (Onset & Evolution): Sudden vs insidious, acute exacerbation vs progressive chronic.
- C (Character): Exact sensory quality (crushing, pulsating, stabbing, colicky, burning, stiffness).
- R (Radiation): Neurological dermatomal or visceral referral paths (e.g. left arm/jaw, flank to groin, scapular).
- A (Associated Symptoms & Red Flags): Diaphoresis, dyspnea, nausea, weight loss, fever with rigors, localized signs.
- T (Temporal Pattern): Diurnal variation, nocturnal waking, continuous vs episodic.
- E (Exacerbating & Relieving Factors): Posture, meals, exertion, rest, OTC medication response.
- S (Severity & Functional Disability): Quantified impact on walking, sleeping, breathing, or daily living.

========================================================================
[MANDATORY GENERATION RULES]
========================================================================
1. NEVER ask a generic or repetitive question. Deeply analyze the patient's previous response to formulate the next single high-yield question.
2. Provide exactly ONE concise, empathetic, medically precise question.
3. Provide exactly FIVE distinct, clinically meaningful option cards that real patients can tap. Assign the most accurate iconType ('target','chest','back','shoulder','question','clock','flame','pill','moon','wind','thermometer','stomach','headache','cough','bodypain','leaf').
4. Set isFinished: true after 3 to 5 comprehensive questions when the clinical picture is complete.
5. If acute emergency danger signs are identified (e.g. acute coronary syndrome, severe respiratory distress, acute abdomen), completionMessage must urgently advise immediate emergency department care.`;
      return json(parseModelJson(await generate(key, model, prompt, schema, 0.15)));
    }

    const actions = Array.isArray(payload.actions) ? payload.actions.slice(0, 100) : [];
    const routes = Array.isArray(payload.routes) ? payload.routes.slice(0, 50) : [];
    const actionIntents = actions.map((item: any) => typeof item === 'string' ? item : item?.intent || item?.id || '').filter(Boolean);
    const allowed: string[] = Array.from(new Set([...actionIntents, 'navigate', 'free_text', 'out_of_context']));
    const schema = { type: 'object', properties: {
      intent: { type: 'string', enum: allowed }, confidence: { type: 'number', minimum: 0, maximum: 1 },
      target: { type: 'string' }, value: { type: 'string' }, message: { type: 'string' },
    }, required: ['intent','confidence','target','value','message'], additionalProperties: false };
    const prompt = `Interpret a voice command for a healthcare website safely. Understand accents, indirect requests, arbitrary word order, and code-mixing across English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada and Malayalam.
Language hint: ${payload.language || 'unknown'}; page: ${payload.pageId || 'unknown'}; page accepts a free answer: ${Boolean(payload.expectsFreeText)}.
Available actions: ${JSON.stringify(actions)}
Available destinations: ${JSON.stringify(routes)}
User speech: ${JSON.stringify(String(payload.transcript || '').slice(0, 2000))}
Choose only an available action. For an answer to the current form/question, choose free_text. For navigation choose navigate and an available route id. Choose out_of_context only if no action reasonably matches. Any clarification message must be in the selected/user language.`;
    const parsed = parseModelJson(await generate(key, model, prompt, schema, 0.05));
    if (!allowed.includes(parsed?.intent)) return json({ intent: 'out_of_context', confidence: 0, target: '', value: '', message: '' });
    return json(parsed);
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Voice service request failed' }, 500);
  }
});
