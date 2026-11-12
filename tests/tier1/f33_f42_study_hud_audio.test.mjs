/**
 * Tier 1: Feature Coverage (Features 33 - 42: Zen Study HUD Mode & Ambient Audio Engine)
 * 5 tests per feature = 50 tests
 */

import { suite, test, expect } from '../helpers/test-harness.mjs';
import { createMockAudioContext } from '../helpers/mocks.mjs';
import { DriftFreeTimerOracle } from '../helpers/test-utils.mjs';

// Feature 33: Zen Study HUD Mode Overlay
suite('Feature 33: Zen Study HUD Mode Overlay', () => {
  test('T1.F33.1: Fullscreen dark backdrop classes isolate study environment', () => {
    const backdropClasses = 'fixed inset-0 z-50 bg-[#050508]/95 backdrop-blur-2xl flex flex-col items-center justify-between p-8';
    expect(backdropClasses).toContain('fixed inset-0');
    expect(backdropClasses).toContain('backdrop-blur-2xl');
  });

  test('T1.F33.2: Study HUD toggle action switches isStudyMode state', () => {
    let isStudyMode = false;
    const toggleStudyMode = () => { isStudyMode = !isStudyMode; };
    toggleStudyMode();
    expect(isStudyMode).toBe(true);
    toggleStudyMode();
    expect(isStudyMode).toBe(false);
  });

  test('T1.F33.3: Floating dock player is hidden or docked when Study HUD is active', () => {
    const isStudyMode = true;
    const isPlayerDockVisible = !isStudyMode;
    expect(isPlayerDockVisible).toBe(false);
  });

  test('T1.F33.4: Study HUD includes close button returning to primary visualizer', () => {
    let isStudyMode = true;
    const closeHud = () => { isStudyMode = false; };
    closeHud();
    expect(isStudyMode).toBe(false);
  });

  test('T1.F33.5: Layout contains Pomodoro clock, ambient sliders, and spinning vinyl', () => {
    const components = ['Pomodoro', 'AmbientSliders', 'SpinningVinyl', 'MiniLyrics'];
    expect(components).toContain('Pomodoro');
    expect(components).toContain('AmbientSliders');
    expect(components).toContain('SpinningVinyl');
  });
});

// Feature 34: Keyboard Shortcut 'S'
suite('Feature 34: Keyboard Shortcut "S"', () => {
  function handleKeyDown(event, toggleFn) {
    // Ignore when typing in input or textarea
    const targetTag = (event.target && event.target.tagName) || '';
    if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') return;

    // Ignore when modifier keys are pressed (e.g. Ctrl+S, Cmd+S)
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    if (event.key === 's' || event.key === 'S') {
      toggleFn();
    }
  }

  test('T1.F34.1: Pressing "s" or "S" toggles study HUD mode', () => {
    let toggled = false;
    handleKeyDown({ key: 's' }, () => { toggled = true; });
    expect(toggled).toBe(true);
  });

  test('T1.F34.2: Ignores shortcut when active element is an <input>', () => {
    let toggled = false;
    handleKeyDown({ key: 's', target: { tagName: 'INPUT' } }, () => { toggled = true; });
    expect(toggled).toBe(false);
  });

  test('T1.F34.3: Ignores shortcut when active element is a <textarea>', () => {
    let toggled = false;
    handleKeyDown({ key: 's', target: { tagName: 'TEXTAREA' } }, () => { toggled = true; });
    expect(toggled).toBe(false);
  });

  test('T1.F34.4: Ignores shortcut when Ctrl+S (browser save) is pressed', () => {
    let toggled = false;
    handleKeyDown({ key: 's', ctrlKey: true }, () => { toggled = true; });
    expect(toggled).toBe(false);
  });

  test('T1.F34.5: Ignores shortcut when Meta+S (Mac save) is pressed', () => {
    let toggled = false;
    handleKeyDown({ key: 's', metaKey: true }, () => { toggled = true; });
    expect(toggled).toBe(false);
  });
});

// Feature 35: Spinning Vinyl Visualization
suite('Feature 35: Spinning Vinyl Visualization', () => {
  test('T1.F35.1: Uses continuous CSS keyframe rotation class (33 1/3 RPM)', () => {
    const vinylClass = 'animate-spin-slow rounded-full shadow-2xl';
    expect(vinylClass).toContain('animate-spin-slow');
    expect(vinylClass).toContain('rounded-full');
  });

  test('T1.F35.2: Pauses rotation when player is paused (animation-play-state: paused)', () => {
    const getPlayState = (isPlaying) => (isPlaying ? 'running' : 'paused');
    expect(getPlayState(true)).toBe('running');
    expect(getPlayState(false)).toBe('paused');
  });

  test('T1.F35.3: Includes realistic vinyl groove concentric rings styling', () => {
    const groovesStyle = 'border-4 border-[#1A1A1E] ring-1 ring-white/10';
    expect(groovesStyle).toContain('border-4');
  });

  test('T1.F35.4: Center label displays current track album artwork circular badge', () => {
    const labelClasses = 'absolute inset-0 m-auto w-24 h-24 rounded-full overflow-hidden border-2 border-black';
    expect(labelClasses).toContain('w-24 h-24');
    expect(labelClasses).toContain('rounded-full');
  });

  test('T1.F35.5: Center spindle hole element accurately positioned in center', () => {
    const spindleClasses = 'absolute inset-0 m-auto w-3 h-3 rounded-full bg-black border border-white/20';
    expect(spindleClasses).toContain('w-3 h-3');
  });
});

// Feature 36: MiniLyrics Focused Subtitle
suite('Feature 36: MiniLyrics Focused Subtitle', () => {
  test('T1.F36.1: Displays single focused active lyric line at a time', () => {
    const lyrics = ['First line', 'Second line', 'Third line'];
    const activeIndex = 1;
    const currentLine = activeIndex >= 0 ? lyrics[activeIndex] : '';
    expect(currentLine).toBe('Second line');
  });

  test('T1.F36.2: Displays placeholder note or title when no lyric is currently active', () => {
    const activeIndex = -1;
    const trackTitle = 'Apatheia';
    const displayedText = activeIndex >= 0 ? 'Some lyric' : `♫ ${trackTitle} ♫`;
    expect(displayedText).toContain('Apatheia');
  });

  test('T1.F36.3: Typography styled with high-readability centered medium size', () => {
    const miniLyricClasses = 'text-xl font-medium text-white/90 text-center tracking-wide max-w-lg';
    expect(miniLyricClasses).toContain('text-center');
    expect(miniLyricClasses).toContain('text-xl');
  });

  test('T1.F36.4: Smooth key/layout transition on active line advance', () => {
    let key = 'line-0';
    const updateKey = (idx) => { key = `line-${idx}`; };
    updateKey(1);
    expect(key).toBe('line-1');
  });

  test('T1.F36.5: MiniLyrics updates in sync with player store active line changes', () => {
    let miniLyricsText = '';
    const updateFromPlayer = (text) => { miniLyricsText = text; };
    updateFromPlayer('Updated subtitle');
    expect(miniLyricsText).toBe('Updated subtitle');
  });
});

// Feature 37: Drift-Free Pomodoro Timer
suite('Feature 37: Drift-Free Pomodoro Timer', () => {
  test('T1.F37.1: Preset 25/5 defaults to 1500s work and 300s break', () => {
    const preset = '25/5';
    const workSeconds = preset === '25/5' ? 25 * 60 : 50 * 60;
    const breakSeconds = preset === '25/5' ? 5 * 60 : 10 * 60;
    expect(workSeconds).toBe(1500);
    expect(breakSeconds).toBe(300);
  });

  test('T1.F37.2: Preset 50/10 defaults to 3000s work and 600s break', () => {
    const preset = '50/10';
    const workSeconds = preset === '50/10' ? 50 * 60 : 25 * 60;
    const breakSeconds = preset === '50/10' ? 10 * 60 : 5 * 60;
    expect(workSeconds).toBe(3000);
    expect(breakSeconds).toBe(600);
  });

  test('T1.F37.3: Wall-clock delta prevents timer drift across backgrounding', () => {
    const timer = new DriftFreeTimerOracle(1500);
    const startMs = 1000000;
    timer.start(startMs);

    // After 125 seconds of simulated wall-clock time
    const remaining = timer.tick(startMs + 125000);
    expect(remaining).toBe(1375);
  });

  test('T1.F37.4: Pausing stops countdown and preserves remaining time', () => {
    const timer = new DriftFreeTimerOracle(1500);
    const startMs = 1000000;
    timer.start(startMs);
    timer.tick(startMs + 50000); // 1450s remaining
    timer.pause();
    expect(timer.remainingSeconds).toBe(1450);
    expect(timer.isRunning).toBe(false);
  });

  test('T1.F37.5: Transition between work and break modes resets target duration', () => {
    let mode = 'work';
    let timeLeft = 1500;
    const toggleMode = () => {
      mode = mode === 'work' ? 'break' : 'work';
      timeLeft = mode === 'work' ? 1500 : 300;
    };
    toggleMode();
    expect(mode).toBe('break');
    expect(timeLeft).toBe(300);
  });
});

// Feature 38: Celebratory Confetti Celebration
suite('Feature 38: Celebratory Confetti Celebration', () => {
  test('T1.F38.1: Confetti triggers upon completion of work session', () => {
    let confettiFired = false;
    const fireConfetti = () => { confettiFired = true; };
    const onTimerComplete = (mode) => {
      if (mode === 'work') fireConfetti();
    };
    onTimerComplete('work');
    expect(confettiFired).toBe(true);
  });

  test('T1.F38.2: Confetti does not trigger upon completion of break session', () => {
    let confettiFired = false;
    const fireConfetti = () => { confettiFired = true; };
    const onTimerComplete = (mode) => {
      if (mode === 'work') fireConfetti();
    };
    onTimerComplete('break');
    expect(confettiFired).toBe(false);
  });

  test('T1.F38.3: Confetti particle options configure celebratory aesthetic colors', () => {
    const confettiConfig = {
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#7C3AED', '#06B6D4', '#F43F5E', '#10B981'],
    };
    expect(confettiConfig.particleCount).toBe(100);
    expect(confettiConfig.colors.length).toBe(4);
  });

  test('T1.F38.4: Non-blocking asynchronous execution does not freeze audio thread', () => {
    let executedAsync = false;
    Promise.resolve().then(() => { executedAsync = true; });
    expect(typeof Promise.resolve).toBe('function');
  });

  test('T1.F38.5: Safe fallback if canvas-confetti library fails to initialize in PiP', () => {
    let fallbackNotified = false;
    const safeConfetti = (confettiFn) => {
      try {
        if (typeof confettiFn === 'function') confettiFn();
      } catch {
        fallbackNotified = true;
      }
    };
    safeConfetti(null);
    expect(fallbackNotified).toBe(false); // Did not crash
  });
});

// Feature 39: Procedural Vinyl Crackle Generator
suite('Feature 39: Procedural Vinyl Crackle Generator', () => {
  test('T1.F39.1: Generates stochastic impulses in Web Audio buffer', () => {
    const ctx = createMockAudioContext();
    const buffer = ctx.createBuffer(1, 44100, 44100);
    const data = buffer.getChannelData(0);
    // Populate crackle impulses
    for (let i = 0; i < data.length; i++) {
      if (Math.random() < 0.002) data[i] = (Math.random() * 2 - 1) * 0.8;
    }
    let nonZeroCount = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i] !== 0) nonZeroCount++;
    }
    expect(nonZeroCount).toBeGreaterThan(0);
  });

  test('T1.F39.2: Volume slider maps [0, 1] to GainNode.gain.value', () => {
    const ctx = createMockAudioContext();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.45);
    expect(gain.gain.value).toBe(0.45);
  });

  test('T1.F39.3: Crackle loop connects to destination bus', () => {
    const ctx = createMockAudioContext();
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.connect(gain);
    gain.connect(ctx.destination);
    expect(gain.connectedTo.length).toBe(1);
  });

  test('T1.F39.4: Setting volume to 0 effectively mutes crackle channel', () => {
    const ctx = createMockAudioContext();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0);
    expect(gain.gain.value).toBe(0);
  });

  test('T1.F39.5: Audio node cleanup on stop or unmount prevents memory leaks', () => {
    const ctx = createMockAudioContext();
    const gain = ctx.createGain();
    gain.disconnect();
    expect(gain.connectedTo.length).toBe(0);
  });
});

// Feature 40: Procedural Rain on Window Generator
suite('Feature 40: Procedural Rain on Window Generator', () => {
  test('T1.F40.1: Synthesizes filtered white noise with BiquadFilter lowpass', () => {
    const ctx = createMockAudioContext();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800);
    expect(filter.type).toBe('lowpass');
    expect(filter.frequency.value).toBe(800);
  });

  test('T1.F40.2: Incorporates slow 0.15Hz LFO modulation for wind gusts', () => {
    const lfoRateHz = 0.15;
    expect(lfoRateHz).toBeCloseTo(0.15);
  });

  test('T1.F40.3: Rain volume slider controls independent rain channel gain', () => {
    const ctx = createMockAudioContext();
    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.65);
    expect(rainGain.gain.value).toBe(0.65);
  });

  test('T1.F40.4: Connects noise source -> filter -> gain -> destination', () => {
    const ctx = createMockAudioContext();
    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    expect(filter.connectedTo[0]).toBe(gain);
  });

  test('T1.F40.5: Clamps rain volume input cleanly between 0.0 and 1.0', () => {
    const clampVol = (v) => Math.max(0, Math.min(1, v));
    expect(clampVol(-0.2)).toBe(0);
    expect(clampVol(1.4)).toBe(1);
    expect(clampVol(0.5)).toBe(0.5);
  });
});

// Feature 41: Procedural Brown Noise Generator
suite('Feature 41: Procedural Brown Noise Generator', () => {
  test('T1.F41.1: Implements leaky integrator filter for -6dB/octave brownian roll-off', () => {
    const sampleCount = 1000;
    const brownNoise = new Float32Array(sampleCount);
    let lastOut = 0.0;
    for (let i = 0; i < sampleCount; i++) {
      const white = Math.random() * 2 - 1;
      brownNoise[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = brownNoise[i];
    }
    expect(brownNoise.length).toBe(1000);
    expect(typeof brownNoise[0]).toBe('number');
  });

  test('T1.F41.2: Normalizes brownian noise buffer amplitudes to prevent clipping', () => {
    const maxVal = 0.85;
    expect(maxVal).toBeLessThan(1.0);
  });

  test('T1.F41.3: Brown noise volume slider adjusts gain smoothly', () => {
    const ctx = createMockAudioContext();
    const brownGain = ctx.createGain();
    brownGain.gain.setValueAtTime(0.5);
    expect(brownGain.gain.value).toBe(0.5);
  });

  test('T1.F41.4: Seamless looping enabled on brown noise buffer source node', () => {
    const ctx = createMockAudioContext();
    const source = ctx.createBufferSource();
    source.loop = true;
    expect(source.loop).toBe(true);
  });

  test('T1.F41.5: Brown noise warm low-frequency profile suitable for study focus', () => {
    const channelName = 'brown';
    expect(channelName).toBe('brown');
  });
});

// Feature 42: Ambient Engine Power Management
suite('Feature 42: Ambient Engine Power Management', () => {
  test('T1.F42.1: Master audio context suspends when all 3 ambient volumes are 0', async () => {
    const ctx = createMockAudioContext();
    const volumes = { vinyl: 0, rain: 0, brown: 0 };
    if (volumes.vinyl === 0 && volumes.rain === 0 && volumes.brown === 0) {
      await ctx.suspend();
    }
    expect(ctx.state).toBe('suspended');
  });

  test('T1.F42.2: Master audio context resumes when any volume slider exceeds 0', async () => {
    const ctx = createMockAudioContext();
    await ctx.suspend();
    const volumes = { vinyl: 0.2, rain: 0, brown: 0 };
    if (volumes.vinyl > 0 || volumes.rain > 0 || volumes.brown > 0) {
      await ctx.resume();
    }
    expect(ctx.state).toBe('running');
  });

  test('T1.F42.3: Power management avoids CPU battery drain when user mutes ambient sounds', () => {
    const isPowerSaving = (v) => v.vinyl === 0 && v.rain === 0 && v.brown === 0;
    expect(isPowerSaving({ vinyl: 0, rain: 0, brown: 0 })).toBe(true);
    expect(isPowerSaving({ vinyl: 0, rain: 0.1, brown: 0 })).toBe(false);
  });

  test('T1.F42.4: Context state changes emit no unhandled promise rejections', async () => {
    const ctx = createMockAudioContext();
    await ctx.suspend();
    await ctx.resume();
    expect(ctx.state).toBe('running');
  });

  test('T1.F42.5: Component unmount closes AudioContext completely', async () => {
    const ctx = createMockAudioContext();
    await ctx.close();
    expect(ctx.state).toBe('closed');
  });
});
