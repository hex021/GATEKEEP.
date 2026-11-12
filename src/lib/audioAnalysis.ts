/**
 * Real-time Web Audio DSP Frequency Analyser.
 * Provides bass, mid, treble, and overall audio energy metrics for reactive visualizers.
 */

let activeAnalyser: AnalyserNode | null = null;
let freqDataArray: Uint8Array<ArrayBuffer> | null = null;

export function registerActiveAnalyser(analyser: AnalyserNode | null): void {
  activeAnalyser = analyser;
  if (analyser) {
    freqDataArray = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
  } else {
    freqDataArray = null;
  }
}

export interface AudioEnergy {
  bass: number;    // 0 to 1
  mid: number;     // 0 to 1
  treble: number;  // 0 to 1
  overall: number; // 0 to 1
}

/**
 * Returns instantaneous audio energy levels.
 * Gracefully falls back to procedural rhythmic pulses if Analyser is unattached or audio is muted.
 */
export function getAudioEnergy(isPlaying = false): AudioEnergy {
  if (activeAnalyser && freqDataArray && isPlaying) {
    try {
      activeAnalyser.getByteFrequencyData(freqDataArray);
      const binCount = freqDataArray.length;

      let bassSum = 0;
      const bassEnd = Math.max(1, Math.floor(binCount * 0.15));
      for (let i = 0; i < bassEnd; i++) bassSum += freqDataArray[i];

      let midSum = 0;
      const midEnd = Math.floor(binCount * 0.55);
      for (let i = bassEnd; i < midEnd; i++) midSum += freqDataArray[i];

      let trebleSum = 0;
      for (let i = midEnd; i < binCount; i++) trebleSum += freqDataArray[i];

      const bass = bassSum / (bassEnd * 255);
      const mid = midSum / ((midEnd - bassEnd) * 255);
      const treble = trebleSum / ((binCount - midEnd) * 255);
      const overall = (bass * 0.5) + (mid * 0.35) + (treble * 0.15);

      return {
        bass: Math.min(1, bass * 1.25),
        mid: Math.min(1, mid * 1.15),
        treble: Math.min(1, treble * 1.1),
        overall: Math.min(1, overall * 1.2),
      };
    } catch {}
  }

  // Graceful rhythmic procedural fallback
  if (isPlaying) {
    const t = performance.now() * 0.005;
    const beat = (Math.sin(t * 2.0) + 1) * 0.5;
    const snare = (Math.sin(t * 4.0 + 1.2) + 1) * 0.5;
    return {
      bass: 0.35 + beat * 0.45,
      mid: 0.25 + snare * 0.35,
      treble: 0.2 + beat * 0.3,
      overall: 0.3 + (beat + snare) * 0.35,
    };
  }

  return { bass: 0, mid: 0, treble: 0, overall: 0 };
}
