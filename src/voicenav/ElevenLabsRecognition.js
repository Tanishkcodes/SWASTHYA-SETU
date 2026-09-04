import voiceAIService from './VoiceAIService';

// SpeechRecognition-compatible events, backed exclusively by ElevenLabs Scribe.
export default class ElevenLabsRecognition {
  static supported = Boolean(globalThis.navigator?.mediaDevices?.getUserMedia && globalThis.WebSocket);
  _lang = 'en';
  get lang() { return this._lang; }
  set lang(value) {
    if (value === this._lang) return;
    this._lang = value;
    if (this.active) { this.stop(); this.start(); }
  }
  generation = 0;
  active = false;

  start() {
    if (this.active) return;
    this.active = true;
    const generation = ++this.generation;
    this.connect(generation).catch(error => {
      if (generation !== this.generation) return;
      this.stop();
      this.onerror?.({ error: error.name === 'NotAllowedError' ? 'not-allowed' : 'network', message: error.message });
    });
  }

  async connect(generation) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } });
    if (generation !== this.generation) { stream.getTracks().forEach(track => track.stop()); return; }
    this.stream = stream;
    const { token } = await voiceAIService.createSpeechToken();
    if (generation !== this.generation) return;
    if (!token) throw new Error('ElevenLabs did not issue a speech token.');
    const context = new AudioContext({ sampleRate: 16000 });
    this.context = context;
    await context.resume();
    if (generation !== this.generation) return;
    const params = new URLSearchParams({ token, model_id: 'scribe_v2_realtime', audio_format: 'pcm_16000', language_code: this.lang.split('-')[0], commit_strategy: 'vad', vad_silence_threshold_secs: '0.7' });
    const socket = new WebSocket(`wss://api.elevenlabs.io/v1/speech-to-text/realtime?${params}`);
    this.socket = socket;
    const fail = message => {
      if (generation !== this.generation) return;
      this.stop();
      this.onerror?.({ error: 'network', message });
    };
    this.connectTimer = setTimeout(() => fail('ElevenLabs speech connection timed out.'), 10000);
    socket.onmessage = event => {
      if (generation !== this.generation) return;
      const data = JSON.parse(event.data);
      if (data.message_type === 'session_started') {
        clearTimeout(this.connectTimer);
        const source = context.createMediaStreamSource(stream);
        const processor = context.createScriptProcessor(4096, 1, 1);
        this.source = source;
        this.processor = processor;
        processor.onaudioprocess = event => {
          if (socket.readyState !== WebSocket.OPEN) return;
          const input = event.inputBuffer.getChannelData(0);
          const ratio = context.sampleRate / 16000;
          const bytes = new Uint8Array(Math.floor(input.length / ratio) * 2);
          const view = new DataView(bytes.buffer);
          for (let i = 0; i < bytes.length / 2; i++) {
            const value = Math.max(-1, Math.min(1, input[Math.floor(i * ratio)]));
            view.setInt16(i * 2, value * (value < 0 ? 32768 : 32767), true);
          }
          socket.send(JSON.stringify({ message_type: 'input_audio_chunk', audio_base_64: btoa(String.fromCharCode(...bytes)), sample_rate: 16000 }));
        };
        source.connect(processor);
        processor.connect(context.destination);
        this.onstart?.();
      } else if (['partial_transcript', 'committed_transcript', 'committed_transcript_with_timestamps'].includes(data.message_type) && data.text?.trim()) {
        const result = [{ transcript: data.text, confidence: 1 }];
        result.isFinal = data.message_type !== 'partial_transcript';
        this.onresult?.({ resultIndex: 0, results: [result] });
      } else if (data.message_type?.includes('error')) {
        fail(data.error || 'ElevenLabs speech recognition failed.');
      }
    };
    socket.onerror = () => fail('ElevenLabs speech connection failed.');
    socket.onclose = () => fail('ElevenLabs speech connection closed. Tap the microphone to retry.');
  }

  stop() {
    this.active = false;
    ++this.generation;
    clearTimeout(this.connectTimer);
    this.processor?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach(track => track.stop());
    this.socket?.close();
    this.context?.close().catch(() => {});
    this.processor = this.source = this.stream = this.socket = this.context = null;
  }

  abort() { this.stop(); }
}
