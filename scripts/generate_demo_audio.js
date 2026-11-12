const fs = require('fs');
const path = require('path');

function createWavBuffer(sampleRate, numChannels, durationSec, sampleGenerator) {
  const numSamples = Math.floor(sampleRate * durationSec);
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // SubChunk1Size
  buffer.writeUInt16LE(1, 20);  // AudioFormat (PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const [left, right] = sampleGenerator(t, i, numSamples);

    // Clamp to 16-bit
    const clampedL = Math.max(-1, Math.min(1, left));
    const sampleL = Math.floor(clampedL < 0 ? clampedL * 32768 : clampedL * 32767);
    buffer.writeInt16LE(sampleL, offset);
    offset += 2;

    if (numChannels === 2) {
      const clampedR = Math.max(-1, Math.min(1, right !== undefined ? right : left));
      const sampleR = Math.floor(clampedR < 0 ? clampedR * 32768 : clampedR * 32767);
      buffer.writeInt16LE(sampleR, offset);
      offset += 2;
    }
  }

  return buffer;
}

// Ensure demo directory exists
const demoDir = path.join(__dirname, '..', 'public', 'demo');
const coversDir = path.join(demoDir, 'covers');
fs.mkdirSync(demoDir, { recursive: true });
fs.mkdirSync(coversDir, { recursive: true });

const SAMPLE_RATE = 22050;

console.log('Generating Track 1: Apatheia (3 AM Drift)...');
// Track 1: Apatheia (3 AM Drift) - 142s, Ambient / Cyberpunk Neo-Tokyo
const apatheiaBuffer = createWavBuffer(SAMPLE_RATE, 2, 142, (t, i) => {
  // Rain texture: subtle white noise with slow low-pass modulation
  const rainNoise = (Math.random() * 2 - 1) * 0.04 * (1 + 0.3 * Math.sin(t * 0.5));
  
  // Chords: F minor pad progression (F3: 174.61, Ab3: 207.65, C4: 261.63, Eb4: 311.13, G4: 392.00)
  // 4 chord cycle every 16 seconds
  const chordProg = Math.floor((t % 16) / 4);
  let freqs = [174.61, 261.63, 311.13]; // Fm7
  if (chordProg === 1) freqs = [138.59, 207.65, 261.63]; // Dbmaj7
  if (chordProg === 2) freqs = [116.54, 174.61, 207.65]; // Bbm7
  if (chordProg === 3) freqs = [155.56, 233.08, 311.13]; // Eb7

  let padL = 0;
  let padR = 0;
  for (let f of freqs) {
    // Soft detuned saw/sine hybrid
    const osc1 = Math.sin(2 * Math.PI * f * t);
    const osc2 = Math.sin(2 * Math.PI * (f * 1.004) * t);
    padL += (osc1 * 0.6 + osc2 * 0.4) * 0.08;
    padR += (osc2 * 0.6 + osc1 * 0.4) * 0.08;
  }

  // Deep Sub-bass (F1: 43.65 Hz) pulsing every 2 seconds
  const bassFreq = chordProg === 0 ? 43.65 : chordProg === 1 ? 34.65 : chordProg === 2 ? 58.27 : 38.89;
  const bassEnv = Math.exp(-((t % 2) * 2.2));
  const bass = Math.sin(2 * Math.PI * bassFreq * t) * 0.22 * bassEnv;

  // Occasional neon melodic bell
  const bellNote = (Math.floor(t * 0.75) % 8) * 110 + 440;
  const bellEnv = Math.exp(-((t % 1.33) * 6));
  const bell = Math.sin(2 * Math.PI * bellNote * t) * 0.05 * bellEnv;

  // Master fade in / out
  const fadeIn = Math.min(1, t / 3.0);
  const fadeOut = Math.min(1, (142 - t) / 3.0);
  const masterFade = fadeIn * fadeOut;

  const left = (padL + bass + bell * 0.8 + rainNoise) * masterFade;
  const right = (padR + bass + bell * 0.2 + rainNoise) * masterFade;
  return [left, right];
});

fs.writeFileSync(path.join(demoDir, 'apatheia.wav'), apatheiaBuffer);
fs.writeFileSync(path.join(demoDir, 'apatheia.mp3'), apatheiaBuffer);

console.log('Generating Track 2: Honey on the Tape (158s)...');
// Track 2: Honey on the Tape - 158s, Warm Lo-Fi Rhodes & Tape Saturator
const solarisBuffer = createWavBuffer(SAMPLE_RATE, 2, 158, (t, i) => {
  // Vinyl crackle / tape hiss
  const crackle = Math.random() < 0.003 ? (Math.random() * 2 - 1) * 0.15 : 0;
  const tapeHiss = (Math.random() * 2 - 1) * 0.02;

  // Tape wow/flutter pitch modulation (0.4 Hz)
  const flutter = 1.0 + 0.0025 * Math.sin(2 * Math.PI * 0.4 * t);

  // Rhodes chord progression: Dmaj9 -> Bm9 -> Em9 -> A13 (2-second chord hits)
  const chordIdx = Math.floor((t % 16) / 4);
  let chordNotes = [146.83, 220.0, 277.18, 329.63]; // Dmaj9
  if (chordIdx === 1) chordNotes = [123.47, 185.0, 220.0, 293.66]; // Bm9
  if (chordIdx === 2) chordNotes = [164.81, 196.0, 246.94, 329.63]; // Em9
  if (chordIdx === 3) chordNotes = [110.0, 164.81, 220.0, 277.18]; // A13

  // Rhodes hit envelope
  const hitT = (t % 4);
  const rhodesEnv = Math.exp(-hitT * 1.5) + 0.15 * Math.exp(-hitT * 0.3);

  let rhodesL = 0;
  let rhodesR = 0;
  chordNotes.forEach((f, idx) => {
    const freq = f * flutter;
    // Rhodes harmonic overtone series
    const fundamental = Math.sin(2 * Math.PI * freq * t);
    const h2 = Math.sin(2 * Math.PI * freq * 2 * t) * 0.35;
    const h3 = Math.sin(2 * Math.PI * freq * 3 * t) * 0.15;
    const voice = (fundamental + h2 + h3) * rhodesEnv * 0.09;
    if (idx % 2 === 0) rhodesL += voice;
    else rhodesR += voice;
  });

  // Warm walking bassline
  const bassNotes = [73.42, 61.74, 82.41, 55.0];
  const currentBassFreq = bassNotes[chordIdx];
  const bassEnv = Math.exp(-(hitT % 1.0) * 3);
  const bass = Math.sin(2 * Math.PI * currentBassFreq * t) * 0.2 * bassEnv;

  // Soft kick / snare pulse
  const beat = t % 1.0;
  const kick = beat < 0.2 ? Math.sin(2 * Math.PI * 55 * (1 - beat * 4) * t) * 0.25 * Math.exp(-beat * 15) : 0;
  const snare = (t % 2.0 > 1.0 && t % 2.0 < 1.3) ? (Math.random() * 2 - 1) * 0.08 * Math.exp(-(t % 1.0) * 12) : 0;

  const fadeIn = Math.min(1, t / 3.0);
  const fadeOut = Math.min(1, (158 - t) / 3.0);
  const masterFade = fadeIn * fadeOut;

  const left = (rhodesL + bass + kick + snare + crackle + tapeHiss) * masterFade;
  const right = (rhodesR + bass + kick + snare + crackle + tapeHiss) * masterFade;
  return [left, right];
});

fs.writeFileSync(path.join(demoDir, 'solaris.wav'), solarisBuffer);
fs.writeFileSync(path.join(demoDir, 'solaris.mp3'), solarisBuffer);

console.log('Generating Track 3: Collapsed Universe (135s)...');
// Track 3: Collapsed Universe - 135s, Cosmic Progressive Trance / Synthwave
const supernovaBuffer = createWavBuffer(SAMPLE_RATE, 2, 135, (t, i) => {
  // Arpeggiator: 16th notes at 124 BPM -> 1 beat = 0.4838s, 16th note = 0.1209s
  const stepDur = 0.120967;
  const step = Math.floor(t / stepDur);
  const stepT = (t % stepDur) / stepDur;

  // 16-step arpeggio pattern in A minor
  const arpNotes = [
    220.0, 261.63, 329.63, 440.0,
    523.25, 440.0, 329.63, 261.63,
    174.61, 261.63, 349.23, 440.0,
    523.25, 440.0, 349.23, 261.63
  ];
  const arpFreq = arpNotes[step % arpNotes.length];
  const arpEnv = Math.exp(-stepT * 5.0);
  // Saw-wave simulation
  const sawPhase = (arpFreq * t) % 1.0;
  const sawWave = (sawPhase * 2 - 1) * 0.12 * arpEnv;

  // Ping-pong delay simulation
  const pan = (step % 2 === 0) ? 0.7 : 0.3;

  // Rolling 8th-note bassline
  const bassStep = Math.floor(t / (stepDur * 2));
  const bassNotes = [55.0, 55.0, 55.0, 55.0, 43.65, 43.65, 65.41, 48.99];
  const bassFreq = bassNotes[bassStep % bassNotes.length];
  const bassEnv = Math.exp(-((t % (stepDur * 2)) / (stepDur * 2)) * 4.0);
  const bass = Math.sin(2 * Math.PI * bassFreq * t) * 0.22 * bassEnv;

  // Euphoric Drop kick entering after 28.5s (matching lyric "(massive euphoric drop)")
  let kick = 0;
  let hihat = 0;
  if (t >= 28.5 && t < 120.0) {
    const beatT = (t % (stepDur * 4)) / (stepDur * 4);
    const kickPitch = 120 * Math.exp(-beatT * 18) + 45;
    kick = Math.sin(2 * Math.PI * kickPitch * t) * 0.32 * Math.exp(-beatT * 8);

    // Offbeat Hi-hat
    const hatStep = (step % 4);
    if (hatStep === 2) {
      hihat = (Math.random() * 2 - 1) * 0.08 * Math.exp(-stepT * 12);
    }
  }

  // Shimmering white noise / riser
  const riser = (t > 24 && t < 28.5) ? (Math.random() * 2 - 1) * 0.08 * ((t - 24) / 4.5) : 0;

  const fadeIn = Math.min(1, t / 2.5);
  const fadeOut = Math.min(1, (135 - t) / 3.0);
  const masterFade = fadeIn * fadeOut;

  const left = (sawWave * pan + bass + kick + hihat * 0.8 + riser) * masterFade;
  const right = (sawWave * (1 - pan) + bass + kick + hihat * 0.8 + riser) * masterFade;
  return [left, right];
});

fs.writeFileSync(path.join(demoDir, 'supernova.wav'), supernovaBuffer);
fs.writeFileSync(path.join(demoDir, 'supernova.mp3'), supernovaBuffer);

console.log('Demo audio files successfully generated in public/demo/');
