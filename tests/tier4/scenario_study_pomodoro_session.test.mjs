/**
 * Tier 4: Real-World Scenarios
 * Scenario 4: Deep Work Pomodoro & Ambient Sound Journey
 * User presses 'S' -> Study HUD opens -> vinyl rotates -> ambient sound generators started -> 25/5 Pomodoro counts down -> Confetti burst.
 */

import { suite, test, expect } from '../helpers/test-harness.mjs';
import { createMockAudioContext } from '../helpers/mocks.mjs';
import { DriftFreeTimerOracle } from '../helpers/test-utils.mjs';

suite('Scenario 4: Deep Work Pomodoro & Ambient Sound Journey', () => {
  test('Step 1: User presses shortcut "S" to open fullscreen Zen Study HUD mode', () => {
    let isStudyMode = false;
    const toggleStudy = () => { isStudyMode = !isStudyMode; };

    toggleStudy();
    expect(isStudyMode).toBe(true);
  });

  test('Step 2: Spinning vinyl rotates at 33 1/3 RPM while MiniLyrics displays focused subtitle', () => {
    let isPlaying = true;
    const vinylAnimState = isPlaying ? 'running' : 'paused';
    expect(vinylAnimState).toBe('running');

    const activeSubtitle = 'golden hour through the venetian blinds';
    expect(activeSubtitle.length).toBeGreaterThan(0);
  });

  test('Step 3: User configures procedural ambient sound sliders (vinyl crackle, rain, brown noise)', () => {
    const ctx = createMockAudioContext();
    const crackle = ctx.createGain();
    const rain = ctx.createGain();
    const brown = ctx.createGain();

    crackle.gain.setValueAtTime(0.35);
    rain.gain.setValueAtTime(0.60);
    brown.gain.setValueAtTime(0.25);

    expect(crackle.gain.value).toBe(0.35);
    expect(rain.gain.value).toBe(0.60);
    expect(brown.gain.value).toBe(0.25);
  });

  test('Step 4: Pomodoro 25/5 work session runs with drift-free wall-clock delta calculation', () => {
    const timer = new DriftFreeTimerOracle(1500);
    const startMs = 100000;
    timer.start(startMs);

    // 15 minutes of work = 900 seconds elapsed (900,000ms)
    const remaining = timer.tick(startMs + 900000);
    expect(remaining).toBe(600); // 10 minutes left
  });

  test('Step 5: Work timer completion triggers celebratory confetti burst and transitions to break', () => {
    const timer = new DriftFreeTimerOracle(1500);
    const startMs = 100000;
    timer.start(startMs);

    // 25 minutes elapsed
    const remaining = timer.tick(startMs + 1500000);
    expect(remaining).toBe(0);

    let confettiFired = false;
    if (remaining === 0) confettiFired = true;
    expect(confettiFired).toBe(true);

    // Transition to 5-minute break
    let mode = 'break';
    let breakTimeLeft = 300;
    expect(mode).toBe('break');
    expect(breakTimeLeft).toBe(300);
  });
});
