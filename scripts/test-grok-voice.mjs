/**
 * Verification script for Grok Voice Agent logic
 */

function pcmToWav(pcmBuffer, sampleRate = 24000, numChannels = 1, bitDepth = 16) {
  const dataLength = pcmBuffer.length;
  const buffer = new Uint8Array(44 + dataLength);
  const view = new DataView(buffer.buffer);

  // "RIFF"
  view.setUint32(0, 0x52494646, false);
  // file length - 8
  view.setUint32(4, 36 + dataLength, true);
  // "WAVE"
  view.setUint32(8, 0x57415645, false);
  // "fmt " chunk
  view.setUint32(12, 0x666d7420, false);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  view.setUint32(36, 0x64617461, false);
  view.setUint32(40, dataLength, true);

  buffer.set(pcmBuffer, 44);
  return buffer;
}

console.log('Testing PCM to WAV conversion for Grok Realtime Audio...');
const fakePcm = new Uint8Array(4800); // 100ms of 24kHz 16-bit mono
const wav = pcmToWav(fakePcm, 24000, 1, 16);
if (wav.length === 4844) {
  console.log('✓ WAV header successfully generated. Length:', wav.length);
} else {
  console.error('✗ WAV length mismatch:', wav.length);
  process.exit(1);
}

// Verify WAV Header magic
const magic = String.fromCharCode(wav[0], wav[1], wav[2], wav[3]);
const wave = String.fromCharCode(wav[8], wav[9], wav[10], wav[11]);
if (magic === 'RIFF' && wave === 'WAVE') {
  console.log('✓ Valid RIFF WAVE header confirmed.');
} else {
  console.error('✗ Invalid header:', magic, wave);
  process.exit(1);
}

console.log('All Grok Voice Agent helpers validated successfully!');
