# Voice and clinical AI

The `voice-ai` Supabase function now uses:

- ElevenLabs Scribe v2 Realtime for microphone transcription, with a server-issued single-use token.
- ElevenLabs v3 for spoken output in English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada and Malayalam. No browser or Google speech fallback.
- Gemini for contextual navigation; doctor names and one-based list numbers are resolved against available doctors.
- NVIDIA-hosted Llama for adaptive intake and report image extraction. Ayurveda requires ten Dashavidha coverage statuses before ordinary completion; emergencies bypass the checklist.

Set server secrets from `supabase/functions/.env.example`: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `GEMINI_API_KEY`, and `NVIDIA_API_KEY`. Provider keys must never use a `VITE_` prefix. The ElevenLabs key needs speech synthesis and realtime speech token permissions. The selected voice must be accessible to that account.

Deploy the updated `supabase/functions/voice-ai` function along with the frontend. The previous deployed function does not support the new `stt_token` action. Use the project's existing Supabase deployment and authentication configuration.

Verification: `node --test scripts/test-voice-stack.mjs` and `npm run build`.

The automated suite mocks provider responses; it does not measure live accuracy or latency. After deployment, test microphone permission, partial/final transcripts, stopping during connection/playback, and changing language. For each language, try a named doctor, list number, ambiguous specialty, unrestricted symptom narrative, and spoken clinical follow-up. Confirm a landscape or unrelated screenshot produces no medical findings, while a readable report extracts only visible text. Verify a complete Ayurveda intake and an emergency interruption.

Image extraction uses an independent neutral classification/transcription pass, then filters extracted fields against that pass's evidence. This reduces unsupported output but cannot guarantee an AI model's reading of the pixels. Unreadable images and provider failures must remain unverified; review extracted values against the original image.

Provider references: [Scribe realtime](https://elevenlabs.io/docs/api-reference/speech-to-text/v-1-speech-to-text-realtime), [ElevenLabs language support](https://elevenlabs.io/docs/help-center/other/what-languages-do-you-support), [NVIDIA vision image format](https://docs.nvidia.com/nim/vision-language-models/1.1.0/getting-started.html).
