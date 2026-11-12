'use client';

/**
 * Procedural Web Audio API sound generator for Study HUD.
 * Generates Vinyl Crackle, Rain on Window, and Brown Noise completely in-browser
 * with zero external MP3 dependencies, smooth click-free ramping, and auto-power management.
 */

export interface AmbientVolumeConfig {
  vinyl: number;
  rain: number;
  brown: number;
}

function safeSetValue(param: AudioParam | { value: number; setValueAtTime?: (v: number, t: number) => void } | undefined | null, val: number, time = 0): void {
  if (!param) return;
  if (typeof param.setValueAtTime === 'function') {
    param.setValueAtTime(val, time);
  } else {
    param.value = val;
  }
}

function safeRampValue(param: AudioParam | { value: number; setValueAtTime?: (v: number, t: number) => void; setTargetAtTime?: (v: number, t: number, tc: number) => void } | undefined | null, target: number, time = 0): void {
  if (!param) return;
  if (typeof param.setTargetAtTime === 'function') {
    param.setTargetAtTime(target, time, 0.05);
  } else if (typeof param.setValueAtTime === 'function') {
    param.setValueAtTime(target, time);
  } else {
    param.value = target;
  }
}

export class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private isInitialized = false;

  // Nodes for Vinyl Crackle
  private vinylGain: GainNode | null = null;
  private vinylSource: AudioBufferSourceNode | null = null;
  private crackleInterval: number | null = null;

  // Nodes for Rain on Window
  private rainGain: GainNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;
  private rainFilterLow: BiquadFilterNode | null = null;
  private rainDropletInterval: number | null = null;

  // Nodes for Brown Noise
  private brownGain: GainNode | null = null;
  private brownSource: AudioBufferSourceNode | null = null;

  // Master bus & power management
  private masterGain: GainNode | null = null;
  private masterVolume = 1.0;
  private isSuspendedForPower = false;
  private powerDebounceTimer: NodeJS.Timeout | null = null;

  private initContext(): void {
    if (this.ctx) return;
    const AudioContextClass =
      typeof window !== 'undefined'
        ? window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        : null;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    safeSetValue(this.masterGain.gain, this.masterVolume, this.ctx.currentTime || 0);
    this.masterGain.connect(this.ctx.destination);
  }

  public async start(): Promise<void> {
    if (!this.ctx) {
      this.initContext();
    }
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        // Will resume on next user gesture
      }
    }

    if (!this.isInitialized) {
      this.setupVinylCrackle();
      this.setupRain();
      this.setupBrownNoise();
      this.isInitialized = true;
    }
  }

  /**
   * Sound Generator 1: Vinyl Crackle
   * - Continuous surface groove hiss via bandpass-filtered noise (2200Hz, Q=1.2)
   * - Stochastic needle pops & dust spikes (triangle wave, 80-680Hz, 15-40ms exponential decay)
   * - Routes pop gains through vinylGain for zero audio leakage when muted
   */
  private setupVinylCrackle(): void {
    if (!this.ctx || !this.masterGain) return;

    const sampleRate = this.ctx.sampleRate || 44100;
    const bufferSize = sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Filtered surface hiss + stochastic embedded micro-ticks
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      let sample = lastOut * 0.15;
      // 0.15% probability of micro-dust click
      if (Math.random() < 0.0015) {
        sample += (Math.random() * 2 - 1) * 0.35;
      }
      data[i] = sample;
    }

    this.vinylSource = this.ctx.createBufferSource();
    this.vinylSource.buffer = buffer;
    this.vinylSource.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    safeSetValue(bandpass.frequency, 2200, this.ctx.currentTime || 0);
    safeSetValue(bandpass.Q, 1.2, this.ctx.currentTime || 0);

    this.vinylGain = this.ctx.createGain();
    safeSetValue(this.vinylGain.gain, 0, this.ctx.currentTime || 0);

    this.vinylSource.connect(bandpass);
    bandpass.connect(this.vinylGain);
    this.vinylGain.connect(this.masterGain);
    this.vinylSource.start();

    // Procedural needle pops & dust crackles
    if (typeof window !== 'undefined' && typeof window.setInterval === 'function') {
      this.crackleInterval = window.setInterval(() => {
        if (!this.ctx || !this.vinylGain || this.vinylGain.gain.value <= 0.01) return;
        if (Math.random() < 0.65) {
          const osc = this.ctx.createOscillator?.();
          if (!osc) return;
          const popGain = this.ctx.createGain();

          osc.type = 'triangle';
          safeSetValue(osc.frequency, 80 + Math.random() * 600, this.ctx.currentTime || 0);

          const popVolume = (0.05 + Math.random() * 0.18) * this.vinylGain.gain.value;
          safeSetValue(popGain.gain, popVolume, this.ctx.currentTime || 0);
          if (typeof popGain.gain.exponentialRampToValueAtTime === 'function') {
            popGain.gain.exponentialRampToValueAtTime(0.0001, (this.ctx.currentTime || 0) + 0.015 + Math.random() * 0.025);
          }

          osc.connect(popGain);
          popGain.connect(this.vinylGain); // Routes safely through vinylGain
          osc.start();
          osc.stop((this.ctx.currentTime || 0) + 0.05);
        }
      }, 70);
    }
  }

  /**
   * Sound Generator 2: Rain on Window
   * - Paul Kellet 6-pole pink noise generator (-3dB/octave slope)
   * - Cascaded acoustic window filtration: lowpass at 1400Hz and highpass at 250Hz
   * - Randomized raindrop impulse pings striking glass pane
   */
  private setupRain(): void {
    if (!this.ctx || !this.masterGain) return;

    const sampleRate = this.ctx.sampleRate || 44100;
    const bufferSize = sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
      b6 = white * 0.115926;
    }

    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = buffer;
    this.rainSource.loop = true;

    this.rainFilterLow = this.ctx.createBiquadFilter();
    this.rainFilterLow.type = 'lowpass';
    safeSetValue(this.rainFilterLow.frequency, 1400, this.ctx.currentTime || 0);

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    safeSetValue(highpass.frequency, 250, this.ctx.currentTime || 0);

    this.rainGain = this.ctx.createGain();
    safeSetValue(this.rainGain.gain, 0, this.ctx.currentTime || 0);

    this.rainSource.connect(this.rainFilterLow);
    this.rainFilterLow.connect(highpass);
    highpass.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);
    this.rainSource.start();

    // Procedural randomized raindrop drops hitting glass
    if (typeof window !== 'undefined' && typeof window.setInterval === 'function') {
      this.rainDropletInterval = window.setInterval(() => {
        if (!this.ctx || !this.rainGain || this.rainGain.gain.value <= 0.01) return;
        if (Math.random() < 0.45) {
          const dropOsc = this.ctx.createOscillator?.();
          if (!dropOsc) return;
          const dropFilter = this.ctx.createBiquadFilter();
          const dropGain = this.ctx.createGain();

          dropOsc.type = 'sine';
          safeSetValue(dropOsc.frequency, 1200 + Math.random() * 1200, this.ctx.currentTime || 0);
          if (typeof dropOsc.frequency.exponentialRampToValueAtTime === 'function') {
            dropOsc.frequency.exponentialRampToValueAtTime(300, (this.ctx.currentTime || 0) + 0.03);
          }

          dropFilter.type = 'bandpass';
          safeSetValue(dropFilter.frequency, 1600, this.ctx.currentTime || 0);
          safeSetValue(dropFilter.Q, 4.0, this.ctx.currentTime || 0);

          const dropVol = (0.02 + Math.random() * 0.05) * this.rainGain.gain.value;
          safeSetValue(dropGain.gain, dropVol, this.ctx.currentTime || 0);
          if (typeof dropGain.gain.exponentialRampToValueAtTime === 'function') {
            dropGain.gain.exponentialRampToValueAtTime(0.0001, (this.ctx.currentTime || 0) + 0.025);
          }

          dropOsc.connect(dropFilter);
          dropFilter.connect(dropGain);
          dropGain.connect(this.rainGain);
          dropOsc.start();
          dropOsc.stop((this.ctx.currentTime || 0) + 0.03);
        }
      }, 120);
    }
  }

  /**
   * Sound Generator 3: Brown Noise
   * - Discrete leaky integrator on white noise: y[n] = (y[n-1] + 0.02 * x[n]) / 1.02
   * - Stereo decorrelation (independent left/right channels)
   * - DC offset removal & seamless loop boundary crossfade
   * - 450Hz lowpass filter for deep sub-acoustic rumble
   */
  private setupBrownNoise(): void {
    if (!this.ctx || !this.masterGain) return;

    const sampleRate = this.ctx.sampleRate || 44100;
    const bufferSize = sampleRate * 5;
    const buffer = this.ctx.createBuffer(2, bufferSize, sampleRate);

    // Generate stereo decorrelated channels
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let lastOut = 0.0;
      let sum = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 1.5;
        sum += data[i];
      }

      // Remove DC offset
      const dcOffset = sum / bufferSize;
      for (let i = 0; i < bufferSize; i++) {
        data[i] -= dcOffset;
      }

      // 50-sample loop seam crossfade
      const fadeSamples = 50;
      for (let i = 0; i < fadeSamples; i++) {
        const ratio = i / fadeSamples;
        data[i] = data[i] * ratio + data[bufferSize - 1 - (fadeSamples - 1 - i)] * (1 - ratio);
      }
    }

    this.brownSource = this.ctx.createBufferSource();
    this.brownSource.buffer = buffer;
    this.brownSource.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    safeSetValue(lowpass.frequency, 450, this.ctx.currentTime || 0);

    this.brownGain = this.ctx.createGain();
    safeSetValue(this.brownGain.gain, 0, this.ctx.currentTime || 0);

    this.brownSource.connect(lowpass);
    lowpass.connect(this.brownGain);
    this.brownGain.connect(this.masterGain);
    this.brownSource.start();
  }

  /**
   * Smooth Volume Updates & Power Management
   * - setTargetAtTime with 50ms time constant (zero audible clicks or zipper pops)
   * - Automatic AudioContext suspension when all volumes are 0 or muted (Feature 42)
   */
  public setVolumes(volumes: AmbientVolumeConfig, isMuted: boolean): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime || 0;

    const vinylTarget = isMuted ? 0 : Math.max(0, Math.min(1, volumes.vinyl));
    const rainTarget = isMuted ? 0 : Math.max(0, Math.min(1, volumes.rain));
    const brownTarget = isMuted ? 0 : Math.max(0, Math.min(1, volumes.brown));

    if (this.vinylGain) {
      safeRampValue(this.vinylGain.gain, vinylTarget, now);
    }
    if (this.rainGain) {
      safeRampValue(this.rainGain.gain, rainTarget, now);
    }
    if (this.brownGain) {
      safeRampValue(this.brownGain.gain, brownTarget, now);
    }

    // Power management: suspend context if all sound channels are inactive
    const isAllSilent = isMuted || (vinylTarget === 0 && rainTarget === 0 && brownTarget === 0);
    this.managePowerState(isAllSilent);
  }

  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.masterGain) {
      safeRampValue(this.masterGain.gain, this.masterVolume, this.ctx.currentTime || 0);
    }
  }

  private managePowerState(shouldSuspend: boolean): void {
    if (!this.ctx || this.ctx.state === 'closed') return;

    if (this.powerDebounceTimer) {
      clearTimeout(this.powerDebounceTimer);
      this.powerDebounceTimer = null;
    }

    if (shouldSuspend && this.ctx.state === 'running' && !this.isSuspendedForPower) {
      // Debounce suspension slightly to avoid thrashing during rapid slider scrubbing
      this.powerDebounceTimer = setTimeout(async () => {
        if (this.ctx && this.ctx.state === 'running') {
          try {
            await this.ctx.suspend();
            this.isSuspendedForPower = true;
          } catch {}
        }
      }, 200);
    } else if (!shouldSuspend && this.ctx.state === 'suspended') {
      try {
        this.ctx.resume().catch(() => {});
        this.isSuspendedForPower = false;
      } catch {}
    }
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  public getIsInitialized(): boolean {
    return this.isInitialized;
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public stop(): void {
    const clearTimer = (id: number | NodeJS.Timeout | null) => {
      if (!id) return;
      if (typeof window !== 'undefined' && typeof window.clearInterval === 'function') {
        window.clearInterval(id as number);
      } else {
        clearInterval(id);
      }
    };

    if (this.crackleInterval) {
      clearTimer(this.crackleInterval);
      this.crackleInterval = null;
    }
    if (this.rainDropletInterval) {
      clearTimer(this.rainDropletInterval);
      this.rainDropletInterval = null;
    }
    if (this.powerDebounceTimer) {
      clearTimer(this.powerDebounceTimer);
      this.powerDebounceTimer = null;
    }

    // Stop and disconnect sources to release memory
    try {
      this.vinylSource?.stop();
      this.vinylSource?.disconnect();
      this.rainSource?.stop();
      this.rainSource?.disconnect();
      this.brownSource?.stop();
      this.brownSource?.disconnect();
    } catch {}

    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
      this.isInitialized = false;
    }
  }
}

// Singleton audio engine instance for the app
let ambientEngineInstance: AmbientAudioEngine | null = null;

export function getAmbientEngine(): AmbientAudioEngine {
  if (!ambientEngineInstance && typeof window !== 'undefined') {
    ambientEngineInstance = new AmbientAudioEngine();
  }
  return ambientEngineInstance!;
}
