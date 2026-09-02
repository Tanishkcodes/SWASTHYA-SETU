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

const CLINICAL_LANGUAGES: Record<string, { name: string; script: string }> = {
  en: { name: 'English', script: 'Latin' },
  hi: { name: 'Hindi', script: 'Devanagari' },
  ta: { name: 'Tamil', script: 'Tamil' },
  te: { name: 'Telugu', script: 'Telugu' },
  bn: { name: 'Bengali', script: 'Bengali' },
  mr: { name: 'Marathi', script: 'Devanagari' },
  gu: { name: 'Gujarati', script: 'Gujarati' },
  kn: { name: 'Kannada', script: 'Kannada' },
  ml: { name: 'Malayalam', script: 'Malayalam' },
};

async function generate(
  key: string,
  model: string,
  prompt: string,
  schema?: unknown,
  temperature = 0.05,
  maxOutputTokens = 1200,
  thinkingLevel?: 'minimal' | 'low',
) {
  const candidates = Array.from(new Set([model, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']));
  let lastStatus = 500;
  for (const candidate of candidates) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          ...(schema ? { responseMimeType: 'application/json', responseJsonSchema: schema } : {}),
          temperature,
          maxOutputTokens,
          ...(thinkingLevel ? { thinkingConfig: { thinkingLevel } } : {}),
        },
      }),
    });
    if (response.ok) return response.json();
    lastStatus = response.status;
    const detail = await response.text();
    console.error('Gemini error', candidate, response.status, detail);
    if (![429, 500, 502, 503, 504].includes(response.status)) break;
  }
  throw new Error(`AI request failed (${lastStatus})`);
}

async function generateWithVision(
  key: string,
  model: string,
  prompt: string,
  imageDataUrl?: string,
  schema?: unknown,
  temperature = 0.1,
  maxOutputTokens = 1500,
) {
  const parts: Array<Record<string, unknown>> = [];
  if (imageDataUrl && imageDataUrl.startsWith('data:')) {
    const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      parts.push({
        inline_data: {
          mime_type: match[1],
          data: match[2]
        }
      });
    }
  }
  parts.push({ text: prompt });

  const candidates = Array.from(new Set(['gemini-2.0-flash', 'gemini-1.5-flash', model, 'gemini-2.5-flash']));
  let lastStatus = 500;
  for (const candidate of candidates) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          ...(schema ? { responseMimeType: 'application/json', responseJsonSchema: schema } : {}),
          temperature,
          maxOutputTokens,
        },
      }),
    });
    if (response.ok) return response.json();
    lastStatus = response.status;
    const detail = await response.text();
    console.error('Gemini Vision error', candidate, response.status, detail);
    if (![429, 500, 502, 503, 504].includes(response.status)) break;
  }
  throw new Error(`AI Vision request failed (${lastStatus})`);
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

    if (!['intent','extract_registration','translate','batch_translate','anamnesis','analyze_report'].includes(action)) return json({ error: 'Unknown action' }, 400);
    const key = Deno.env.get('GEMINI_API_KEY');
    if (!key) return json({ error: 'Gemini AI is not configured on the server' }, 503);
    // Flash-Lite is deliberately used for this interactive intake: patients
    // need the next tap choices in seconds, while the structured prompt/schema
    // still enforce the clinical and multilingual behaviour.
    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash';

    if (action === 'analyze_report') {
      const imageData = String(payload.image || payload.dataUrl || payload.fileUrl || '').trim();
      const fileName = String(payload.fileName || payload.title || '').trim();
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
        required: ['isMedicalDocument', 'documentType', 'summary'],
        additionalProperties: false
      };

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

      const body = await generateWithVision(key, model, prompt, imageData, schema, 0.1, 1500);
      const parsed = parseModelJson(body);
      return json(parsed || { error: 'Failed to analyze report' });
    }

    if (action === 'batch_translate' || (action === 'translate' && Array.isArray(payload.texts))) {
      const texts = Array.isArray(payload.texts) ? payload.texts.map((t: unknown) => String(t || '').trim()) : [];
      if (!texts.length) return json({ translations: [] });
      const langCode = CLINICAL_LANGUAGES[payload.targetLanguage] ? payload.targetLanguage : 'en';
      const targetLang = CLINICAL_LANGUAGES[langCode] || { name: payload.targetLanguage || 'English', script: 'Latin' };
      const schema = {
        type: 'object',
        properties: {
          translations: { type: 'array', items: { type: 'string' } }
        },
        required: ['translations'],
        additionalProperties: false
      };
      const prompt = `Translate each of the following medical intake questions and clinical touch options accurately and naturally into ${targetLang.name} (${targetLang.script}).
Preserve clinical clarity, medical terms, and concise option lengths. Return translations in the exact same array order.
Array to translate:
${JSON.stringify(texts)}`;
      const body = await generate(key, model, prompt, schema, 0.05, 1024, 'minimal');
      const parsed = parseModelJson(body);
      return json({ translations: Array.isArray(parsed?.translations) ? parsed.translations : texts });
    }

    if (action === 'translate') {
      const text = String(payload.text || '').trim().slice(0, 1500);
      if (!text) return json({ text: '' });
      const langCode = CLINICAL_LANGUAGES[payload.targetLanguage] ? payload.targetLanguage : 'en';
      const targetLangName = CLINICAL_LANGUAGES[langCode]?.name || payload.targetLanguage || 'English';
      const prompt = payload.contextType === 'name' || payload.contextType === 'doctor'
        ? `Transliterate this name phonetically into ${targetLangName}. Return only the name: ${JSON.stringify(text)}`
        : `Translate this healthcare interface text naturally into ${targetLangName}. Preserve medical meaning, numbers and names. Return only the translation: ${JSON.stringify(text)}`;
      const body = await generate(key, model, prompt, undefined, 0.1, 256, 'minimal');
      return json({ text: String(body?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim().replace(/^["'`]|["'`]$/g, '') });
    }

    if (action === 'extract_registration') {
      const schema = { type: 'object', properties: {
        name: { type: 'string' }, age: { type: 'string' }, phone: { type: 'string' },
        gender: { type: 'string', enum: ['', 'Male', 'Female', 'Other'] },
        abhaId: { type: 'string' }, aadhaar: { type: 'string' }, symptoms: { type: 'string' },
        symptomList: { type: 'array', items: { type: 'string' }, maxItems: 12 },
        detectedLanguage: { type: 'string' }, confirmationMessage: { type: 'string' },
        requestedAction: { type: 'string', enum: ['fill_form','use_abha','use_aadhaar','new_patient','submit','back','home','none'] },
      }, required: ['name','age','phone','gender','abhaId','aadhaar','symptoms','symptomList','detectedLanguage','confirmationMessage','requestedAction'], additionalProperties: false };
      const languageCode = CLINICAL_LANGUAGES[String(payload.language || '')] ? String(payload.language) : 'en';
      const targetLanguage = CLINICAL_LANGUAGES[languageCode];
      const context = payload.context && typeof payload.context === 'object' ? payload.context : {};
      const prompt = `Extract Indian patient registration data from speech in English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam or any code-mixed form. Fields may be in any order with filler words and self-corrections; the last correction wins.
- name: clean patient name in Title Case, without honorifics or framing phrases; empty if absent.
- age: digits only; empty if absent.
- phone: exactly the spoken 10 mobile digits, converting number words; empty if absent.
- gender: exactly Male, Female, Other, or empty.
- abhaId: 14 digits formatted NN-NNNN-NNNN-NNNN; empty if absent.
- aadhaar: exactly 12 digits; empty if absent. Never confuse a 10-digit phone with Aadhaar or a 14-digit ABHA ID.
- symptoms and symptomList: include only when the patient actually describes a health complaint; otherwise empty.
- detectedLanguage: the language actually spoken, including code-mixed language.
- confirmationMessage: one short, respectful confirmation of only the fields found, written in ${targetLanguage.name} (${targetLanguage.script}). Do not read the full phone/Aadhaar/ABHA number aloud; mention that it was captured.
- requestedAction: understand the complete portal request. Choose use_abha, use_aadhaar, new_patient, submit, back, or home when requested in any wording/language; choose fill_form when any patient field is supplied; otherwise none. If fields and a submit/continue request occur together, choose fill_form so the UI can safely show the captured details before submission.
- The patient may provide one field at a time. Empty means absent in this utterance; do not copy or invent earlier values.
Current form context (reference only): ${JSON.stringify(context).slice(0, 1500)}
Transcript: ${JSON.stringify(String(payload.transcript || '').slice(0, 2000))}`;
      return json(parseModelJson(await generate(key, model, prompt, schema, 0, 512, 'minimal')));
    }

    if (action === 'anamnesis') {
      const schema = { type: 'object', properties: {
        question: { type: 'string' },
        responseType: { type: 'string', enum: ['single_choice','multiple_choice','free_text','scale'] },
        options: { type: 'array', minItems: 0, maxItems: 8, items: { type: 'object', properties: {
          text: { type: 'string' }, iconType: { type: 'string', enum: ['target','chest','back','shoulder','question','clock','flame','pill','moon','wind','thermometer','stomach','headache','cough','bodypain','leaf'] },
        }, required: ['text','iconType'], additionalProperties: false }},
        isFinished: { type: 'boolean' }, completionMessage: { type: 'string' },
        capturedField: { type: 'string', enum: ['notes','location','spread','nature','severity','duration','triggers','medications','associatedSymptoms','redFlags','prakriti','vikriti','sara','samhanana','pramana','satmya','satva','aharaShakti','vyayamaShakti','vaya'] },
        caseSummaryUpdate: { type: 'object', properties: {
          location: { type: 'string' }, spread: { type: 'string' }, nature: { type: 'string' }, severity: { type: 'string' },
          duration: { type: 'string' }, triggers: { type: 'string' }, medications: { type: 'string' },
          associatedSymptoms: { type: 'string' }, redFlags: { type: 'string' },
          prakriti: { type: 'string' }, vikriti: { type: 'string' }, sara: { type: 'string' },
          samhanana: { type: 'string' }, pramana: { type: 'string' }, satmya: { type: 'string' },
          satva: { type: 'string' }, aharaShakti: { type: 'string' }, vyayamaShakti: { type: 'string' },
          vaya: { type: 'string' }, notes: { type: 'string' },
        }, additionalProperties: false },
      }, required: ['question','responseType','options','isFinished','completionMessage','capturedField','caseSummaryUpdate'], additionalProperties: false };
      const patient = payload.patient && typeof payload.patient === 'object' ? payload.patient : {};
      const caseSummary = payload.caseSummary && typeof payload.caseSummary === 'object' ? payload.caseSummary : {};
      const questionCount = Math.max(0, Math.min(30, Number(payload.questionCount || 0)));
      const phase = payload.phase === 'chief_complaint' ? 'chief_complaint' : 'interview';
      const languageCode = CLINICAL_LANGUAGES[String(payload.language || '')] ? String(payload.language) : 'en';
      const targetLanguage = CLINICAL_LANGUAGES[languageCode];
      const prompt = `You are a world-renowned AI Clinical Diagnostic & Anamnesis Specialist for Swasthya Setu Indian healthcare kiosks.
Your mission is to conduct a deeply intelligent, adaptive, empathetic clinical intake tailored specifically to the patient, their disease, and the doctor's exact medical specialty.

Context:
- Interview phase: ${phase === 'chief_complaint' ? 'CHIEF COMPLAINT DISCOVERY. The patient has not described the problem yet.' : 'ADAPTIVE CLINICAL HISTORY'}.
- REQUIRED OUTPUT LANGUAGE: ${targetLanguage.name} (${languageCode}), written in the ${targetLanguage.script} script. The question, every option, and completionMessage MUST be in ${targetLanguage.name} only. Never switch to English merely because the patient's answer or doctor metadata is English. Understand English, ${targetLanguage.name}, transliterated speech, spelling mistakes and code-mixed patient input, then respond naturally in ${targetLanguage.name}. Widely understood medical terms may be transliterated where that is clearer for patients.
- Attending Doctor: ${payload.doctorName || 'Doctor'}; Specialty: ${payload.doctorSpecialty || 'General Medicine'}.
- Care System: ${payload.isAyurvedic ? 'AYURVEDA / AYUSH (Complete Classical Dashavidha Pariksha / दशविध परीक्षा)' : 'ALLOPATHY / MODERN MEDICINE (Advanced SOCRATES & Differential Diagnostics)'}.
- Patient context: age ${JSON.stringify(String(patient.age || 'not provided').slice(0, 20))}, gender ${JSON.stringify(String(patient.gender || 'not provided').slice(0, 30))}. Never infer unprovided facts.
- Patient's Chief Complaint: ${JSON.stringify(payload.disease || 'General discomfort')}.
- Structured facts already collected: ${JSON.stringify(caseSummary)}.
- Clinical questions already answered: ${questionCount}.
- Prior History: ${JSON.stringify((payload.history || []).slice(-16))}.
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
1. For chief_complaint phase, ask what brings the patient to this doctor and offer a VARIABLE number (2-8) of likely complaints appropriate to this doctor's specialty, care system, age and gender. These are suggestions, not diagnoses. Set isFinished false.
2. During the interview, FIRST perform a clinical sufficiency decision using the complaint, patient context, structured facts, and full prior history. If the doctor has enough information for a useful pre-consultation history, set isFinished true NOW. Do not ask another question merely because another SOCRATES or Dashavidha category exists.
3. Only if a material, complaint-specific uncertainty remains, ask the single highest-yield unanswered question. NEVER repeat, rephrase, or ask for information already present in the structured facts or history. Avoid exhaustive review-of-systems, low-value lifestyle questions, and diagnosis confirmation.
4. You decide how many questions are clinically necessary based on complexity—not a quota. A simple, low-risk complaint should usually finish after 3-5 focused answers. Once duration/onset, severity, the main complaint-specific characteristic, and important associated symptoms/red flags are known, normally FINISH; do not separately exhaust timing, triggers, medication, lifestyle, and every protocol category unless one is materially important for this exact complaint. A complex or high-risk complaint may need more. Continue only when the answer could materially change urgency or the doctor's immediate consultation. If ${payload.isAyurvedic ? '12' : '8'} questions have already been answered, finish unless one specific unanswered red flag could change immediate safety.
5. For Ayurveda, assess only Dashavidha dimensions relevant to the stated disease and patient; combine related dimensions and stop when the useful Ayurvedic pre-consultation picture is sufficient. Do not mechanically ask all ten dimensions.
6. Choose responseType to fit the question:
   - single_choice for mutually exclusive answers;
   - multiple_choice when several symptoms may coexist;
   - scale for severity/frequency scales;
   - free_text only for a finished response; every unfinished question must remain touch-accessible.
7. For EVERY unfinished question, generate a VARIABLE number of 2-8 concise, clinically meaningful touch options in ${targetLanguage.name}. Use 2-4 for simple questions and more only when genuinely useful. Never pad the list to a quota. Options must directly answer the current question and must not repeat earlier choices. The UI separately always permits typing or speaking a different answer.${payload.requireTouchOptions ? ' A previous draft lacked usable touch choices, so ensure this response contains them.' : ''}
8. Set capturedField to the case-sheet field chiefly answered by the question. Use caseSummaryUpdate to extract all structured facts learned from the latest response; never fabricate.
9. If isFinished is true, return an empty question and empty options, set responseType to free_text, and give a concise completionMessage. If acute emergency danger signs are identified (e.g. acute coronary syndrome, severe respiratory distress, acute abdomen), the completionMessage must urgently advise immediate emergency care.`;
      return json(parseModelJson(await generate(key, model, prompt, schema, 0.15, 1200, 'low')));
    }

    const actions = Array.isArray(payload.actions) ? payload.actions.slice(0, 100) : [];
    const routes = Array.isArray(payload.routes) ? payload.routes.slice(0, 50) : [];
    const recognitionAlternatives = Array.isArray(payload.recognitionAlternatives)
      ? payload.recognitionAlternatives.map((value: unknown) => String(value || '').slice(0, 500)).filter(Boolean).slice(0, 3)
      : [];
    const actionIntents = actions.map((item: any) => typeof item === 'string' ? item : item?.intent || item?.id || '').filter(Boolean);
    const standardIntents = [
      'navigate', 'navigate_to', 'free_text', 'out_of_context',
      'bookAppointment', 'book_appointment', 'bookHospital', 'select_doctor', 'select_hospital', 'searchHospital',
      'scan_document', 'document_scan', 'scanRecord', 'startConsultation', 'triage',
      'login_patient', 'login_doctor', 'login_admin', 'login_abha', 'login_aadhaar', 'register_new',
      'viewAppointments', 'viewHistory', 'viewReports', 'viewDonations', 'viewCommunities', 'viewHelp', 'viewProfile', 'showAbhaCard', 'toggleAyush',
      'emergency', 'home', 'back', 'next', 'confirm', 'skip', 'scrollDown', 'scrollUp',
      'set_language_hi', 'set_language_ta', 'set_language_te', 'set_language_bn', 'set_language_mr', 'set_language_gu', 'set_language_kn', 'set_language_ml', 'set_language_en',
    ];
    const allowed: string[] = Array.from(new Set([...actionIntents, ...standardIntents]));
    const schema = { type: 'object', properties: {
      intent: { type: 'string', enum: allowed }, confidence: { type: 'number', minimum: 0, maximum: 1 },
      target: { type: 'string' }, value: { type: 'string' }, message: { type: 'string' },
    }, required: ['intent','confidence','target','value','message'], additionalProperties: false };
    const prompt = `You are the primary AI Voice Navigation and Clinical Assistant for Swasthya Setu, an Indian healthcare kiosk and web portal.
The user speaks naturally in ANY of 9 Indian languages (Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, English, Hinglish, Tanglish, or any regional dialect).
The user can speak anything with arbitrary phrasing, indirect requests, symptoms, or casual expressions. You must understand their intended goal and navigate or trigger the right feature.

Context:
- Current Page: ${payload.pageId || 'landing'}
- Language Hint: ${payload.language || 'unknown'}
- Page accepts free text: ${Boolean(payload.expectsFreeText)}
- Available page/global actions: ${JSON.stringify(actions)}
- Navigable routes: ${JSON.stringify(routes)}
- User Speech: ${JSON.stringify(String(payload.transcript || '').slice(0, 2000))}
- Recognition Alternatives: ${JSON.stringify(recognitionAlternatives)}

Semantic Intent Mapping Rules:
1. DOCTOR & APPOINTMENT: If user wants to see a doctor, book an appointment, search for doctors/specialties (e.g. cardiologist, dentist, general physician), or mentions symptoms/feeling sick (e.g. "mujhe doctor dikhana hai", "maruthuvarai parka vendum", "naku doctor kavali", "daktar dekhate chai", "mala doctor kade jaycha ahe", "mane doctor pase javu che", "doctorine kaananam"):
   - Choose 'bookAppointment' (or 'bookHospital' if a hospital is named, or 'select_doctor' if a doctor is named).
2. SCAN & PRESCRIPTION: If user wants to scan, upload, or take photo of prescription, lab report, or medical document (e.g. "parcha scan karo", "prescription upload", "scan document"):
   - Choose 'scan_document'.
3. REPORTS & LAB RESULTS: If user wants to view test reports, lab results, prescriptions, medical records:
   - Choose 'viewReports'.
4. MEDICAL HISTORY & PAST VISITS: If user wants to see past consultations, previous medical history, past treatments:
   - Choose 'viewHistory'.
5. APPOINTMENTS LIST: If user asks to check their booked appointments, schedule, or timings:
   - Choose 'viewAppointments'.
6. BLOOD & ORGAN DONATION: If user mentions blood donation, finding blood donors, or organ donation:
   - Choose 'viewDonations'.
7. COMMUNITY & PATIENT GROUPS: If user asks for patient communities, support groups, or discussion:
   - Choose 'viewCommunities'.
8. HELP & FAQ: If user asks how to use the website, needs help, or asks questions:
   - Choose 'viewHelp' or 'help'.
9. PROFILE & ABHA CARD: If user asks to see their profile, account details, or ABHA digital health card:
   - Choose 'viewProfile' or 'showAbhaCard'.
10. AYUSH / AYURVEDA: If user asks for Ayurveda, Homeopathy, Unani, or Ayush mode:
    - Choose 'toggleAyush'.
11. LOGIN & REGISTRATION:
    - Patient login/register/sign up/ABHA/Aadhaar: Choose 'login_patient' or 'register_new'.
    - Doctor/Physician login: Choose 'login_doctor'.
    - Admin/Hospital login: Choose 'login_admin'.
12. LANGUAGE SWITCHING: If user asks to switch or speak in a specific language (e.g. "Hindi me baat karo", "Tamil il mathu", "Telugu petandi", "Bangla te bolo", "Marathi madhe bola", "Gujarati ma bolo", "Kannada dalli mathadi", "Malayalam thiranjedukku", "English"):
    - Choose 'set_language_<lang_code>' (e.g. 'set_language_hi', 'set_language_ta', etc.).
13. EMERGENCY: If user says urgent, emergency, ambulance, 108, bachao, aapatkaal:
    - Choose 'emergency'.
14. BASIC CONTROLS: 'home', 'back', 'next', 'confirm', 'skip', 'scrollDown', 'scrollUp'.
15. NAVIGATION: For navigating to a known route id, choose 'navigate' and put route id in value/target.
16. FREE TEXT: If the user is on a form and providing data (name, age, phone, or interview response), choose 'free_text'.
17. OUT OF CONTEXT: Choose 'out_of_context' only if the speech is completely nonsensical or unrelated noise.

Message: Always return a concise, polite confirmation in the SAME language the user spoke (e.g., "डॉक्टर अपॉइंटमेंट खोला जा रहा है।", "மருத்துவரை பார்க்க வழிநடத்துகிறது.", "Opening doctor appointment.", etc.).`;
    const parsed = parseModelJson(await generate(key, model, prompt, schema, 0.05, 256, 'minimal'));
    if (!allowed.includes(parsed?.intent)) return json({ intent: 'out_of_context', confidence: 0, target: '', value: '', message: '' });
    return json(parsed);
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Voice service request failed' }, 500);
  }
});
