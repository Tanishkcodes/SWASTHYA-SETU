import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const source = await fs.readFile('src/voicenav/VoiceNavProvider.jsx', 'utf8');
const handler = source.slice(source.indexOf('recognition.onresult ='), source.indexOf('recognition.onerror ='));
function capture(dictation = false) {
  const timers = new Map();
  const received = [];
  let id = 0;
  const sandbox = {
    recognition: {}, accumulatedTranscriptRef: {current:''}, recognitionAlternativesRef: {current:['','','']},
    silenceTimerRef: {current:null}, isDictationModeRef: {current:dictation}, isListeningRef: {current:true},
    setInterimTranscript() {}, setMicState() {}, stopListening() {},
    handleVoiceInput: text => received.push(text),
    setTimeout: (callback, delay) => { timers.set(++id, {callback, delay}); return id; },
    clearTimeout: key => timers.delete(key),
  };
  vm.runInNewContext(handler, sandbox);
  return { timers, received, emit(text, isFinal) {
    const result = [{transcript:text}]; result.isFinal = isFinal;
    sandbox.recognition.onresult({resultIndex:0, results:[result]});
  }};
}

test('interim speech cannot strand a committed navigation command in any supported script', () => {
  for (const command of ['Open appointments','अपॉइंटमेंट खोलो','சந்திப்புகளைத் திற','అపాయింట్‌మెంట్లు తెరువు','অ্যাপয়েন্টমেন্ট খুলুন','भेटी उघडा','મુલાકાતો ખોલો','ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ತೆರೆಯಿರಿ','അപ്പോയിന്റ്മെന്റുകൾ തുറക്കൂ']) {
    const c = capture(); c.emit(command, true); c.emit('unfinished', false);
    assert.equal(c.timers.size, 1);
    const timer = [...c.timers.values()][0];
    assert.equal(timer.delay, 450); timer.callback();
    assert.deepEqual(c.received, [command]);
  }
});

test('field dictation retains the longer pause and combines finalized name segments', () => {
  const c = capture(true); c.emit('Tanishk', true); c.emit('Kumar', true);
  assert.equal(c.timers.size, 1);
  const timer = [...c.timers.values()][0];
  assert.equal(timer.delay, 1400); timer.callback();
  assert.deepEqual(c.received, ['Tanishk Kumar']);
});
