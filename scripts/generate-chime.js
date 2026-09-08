import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateFinlyChimeWav() {
  const sampleRate = 44100;
  const totalDuration = 0.60; // 600ms
  const numSamples = Math.floor(sampleRate * totalDuration);

  // Raw signal buffer (floats)
  const signal = new Float64Array(numSamples);

  const f1 = 1046.5; // C6
  const dur1 = 0.35;
  const g1Start = 0.12;
  const g1End = 0.0001;

  const f2 = 1318.5; // E6
  const start2 = 0.08;
  const dur2 = 0.45;
  const g2Start = 0.14;
  const g2End = 0.0001;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let s = 0;

    // Note 1 (C6)
    if (t >= 0 && t < dur1) {
      const g1 = g1Start * Math.pow(g1End / g1Start, t / dur1);
      s += Math.sin(2 * Math.PI * f1 * t) * g1;
    }

    // Note 2 (E6)
    if (t >= start2 && t < start2 + dur2) {
      const dt2 = t - start2;
      const g2 = g2Start * Math.pow(g2End / g2Start, dt2 / dur2);
      s += Math.sin(2 * Math.PI * f2 * dt2) * g2;
    }

    signal[i] = s;
  }

  // Find peak for normalization
  let maxAmp = 0;
  for (let i = 0; i < numSamples; i++) {
    const abs = Math.abs(signal[i]);
    if (abs > maxAmp) maxAmp = abs;
  }

  // Target peak around 85% of full scale (-1.4 dB) for pristine clarity without distortion
  const targetPeak = 0.85;
  const scaleFactor = maxAmp > 0 ? targetPeak / maxAmp : 1.0;

  // Build 16-bit PCM WAV
  const bytesPerSample = 2; // 16-bit
  const numChannels = 1; // mono
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const subChunk2Size = numSamples * blockAlign;
  const chunkSize = 36 + subChunk2Size;

  const buffer = Buffer.alloc(44 + subChunk2Size);

  // RIFF Chunk
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(chunkSize, 4);
  buffer.write('WAVE', 8);

  // "fmt " Subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size for PCM
  buffer.writeUInt16LE(1, 20); // AudioFormat = 1 (PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample = 16

  // "data" Subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(subChunk2Size, 40);

  // Write samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    let sample = signal[i] * scaleFactor;
    // Clamp to [-1, 1]
    if (sample > 1.0) sample = 1.0;
    if (sample < -1.0) sample = -1.0;
    const intSample = Math.round(sample * 32767);
    buffer.writeInt16LE(intSample, offset);
    offset += 2;
  }

  return buffer;
}

const wavBuffer = generateFinlyChimeWav();

// 1. Target: Android res/raw
const androidRawDir = path.resolve(__dirname, '../android/app/src/main/res/raw');
if (!fs.existsSync(androidRawDir)) {
  fs.mkdirSync(androidRawDir, { recursive: true });
}
const androidWavPath = path.join(androidRawDir, 'finly_chime.wav');
fs.writeFileSync(androidWavPath, wavBuffer);
console.log(`Wrote Android sound to: ${androidWavPath} (${wavBuffer.length} bytes)`);

// 2. Target: public/sounds
const publicSoundsDir = path.resolve(__dirname, '../public/sounds');
if (!fs.existsSync(publicSoundsDir)) {
  fs.mkdirSync(publicSoundsDir, { recursive: true });
}
const publicWavPath = path.join(publicSoundsDir, 'finly_chime.wav');
fs.writeFileSync(publicWavPath, wavBuffer);
console.log(`Wrote Web/PWA sound to: ${publicWavPath} (${wavBuffer.length} bytes)`);
