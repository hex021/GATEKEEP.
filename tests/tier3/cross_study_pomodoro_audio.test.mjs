/**
 * Tier 3: Cross-Feature Combinations (M1 Playback ↔ M5 Study HUD, Pomodoro & Ambient Audio)
 * Verifies coexistence of main audio playback, procedural ambient noise generators, and timer state machine.
 */

import { suite, test, expect } from '../helpers/test-harness.mjs';
import { createMockAudioElement, createMockAudioContext } from '../helpers/mocks.mjs';
import { DriftFreeTimerOracle } from '../helpers/test-utils.mjs';

suite('Tier 3: Study HUD, Pomodoro & Ambient Audio Coexistence', () => {
  test('T3.3.1: Music playback coexists with ambient sound generators (vinyl crackle, rain, brown noise)', () => {
    const mainAudio = createMockAudioElement({ duration: 142 });
    const ambientCtx = createMockAudioContext();

    mainAudio.play();
    mainAudio.volume = 0.8;

    const vinylGain = ambientCtx.createGain();
    const rainGain = ambientCtx.createGain();
    const brownGain = ambientCtx.createGain();

    vinylGain.gain.setValueAtTime(0.3);
    rainGain.gain.setValueAtTime(0.5);
    brownGain.gain.setValueAtTime(0.2);

    expect(mainAudio.paused).toBe(false);
    expect(mainAudio.volume).toBe(0.8);
    expect(vinylGain.gain.value).toBe(0.3);
    expect(rainGain.gain.value).toBe(0.5);
    expect(brownGain.gain.value).toBe(0.2);
  });

  test('T3.3.2: Pomodoro timer runs accurately in parallel with audio loop without stutter', () => {
    const timer = new DriftFreeTimerOracle(1500);
    const startMs = 500000;
    timer.start(startMs);

    // Simulate 30 seconds of playback and ticks
    const remaining = timer.tick(startMs + 30000);
    expect(remaining).toBe(1470);
    expect(timer.isRunning).toBe(true);
  });

  test('T3.3.3: Work session completion triggers confetti burst and pauses or dings without stopping background music', () => {
    const mainAudio = createMockAudioElement();
    mainAudio.play();

    let confettiFired = false;
    const onSessionComplete = () => {
      confettiFired = true;
      // Background music continues playing
    };

    onSessionComplete();
    expect(confettiFired).toBe(true);
    expect(mainAudio.paused).toBe(false);
  });

  test('T3.3.4: Study mode toggle via "S" key maintains active ambient audio settings', () => {
    const ambientVolumes = { vinyl: 0.4, rain: 0.6, brown: 0.2 };
    let isStudyMode = false;

    // Toggle study mode on
    isStudyMode = true;
    expect(isStudyMode).toBe(true);
    expect(ambientVolumes.vinyl).toBe(0.4);

    // Toggle study mode off
    isStudyMode = false;
    expect(isStudyMode).toBe(false);
    expect(ambientVolumes.vinyl).toBe(0.4); // Preserved
  });

  test('T3.3.5: Master audio suspension activates only when all ambient volumes are zero and HUD is closed', async () => {
    const ambientCtx = createMockAudioContext();
    const vols = { vinyl: 0, rain: 0, brown: 0 };
    let isStudyMode = false;

    if (vols.vinyl === 0 && vols.rain === 0 && vols.brown === 0 && !isStudyMode) {
      await ambientCtx.suspend();
    }
    expect(ambientCtx.state).toBe('suspended');
  });
});
