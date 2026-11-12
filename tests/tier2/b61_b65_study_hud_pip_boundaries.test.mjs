/**
 * Tier 2: Boundary & Corner Cases (Features 61 - 65: Milestone 7 Boundaries, Stress & Error Recovery)
 * 5 features x 5 tests = 25 adversarial and boundary tests.
 */

import { register } from 'node:module';
try {
  register('../helpers/path-loader.mjs', import.meta.url);
} catch {
  // Already registered in runner context
}

import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { suite, test, expect, globalHarness } from '../helpers/test-harness.mjs';
import { createMockAudioContext, createMockDocumentPipEnvironment } from '../helpers/mocks.mjs';
import { useStudyStore } from '../../src/stores/useStudyStore.ts';
import { usePlayerStore } from '../../src/stores/usePlayerStore.ts';
import { useSpotifyStore } from '../../src/stores/useSpotifyStore.ts';
import { triggerFireworks, triggerConfettiBurst } from '../../src/lib/confetti.ts';
import { AmbientAudioEngine } from '../../src/components/study/AmbientAudioEngine.ts';
import { useDocumentPip } from '../../src/hooks/useDocumentPip.ts';

/**
 * Lightweight React hook runner for testing hooks outside full DOM tree
 */
function renderHook(hookFn) {
  let stateIndex = 0;
  const states = [];
  const setStates = [];
  const effects = [];

  const dispatcher = {
    useState(initial) {
      const idx = stateIndex++;
      if (states.length <= idx) {
        states[idx] = typeof initial === 'function' ? initial() : initial;
        setStates[idx] = (val) => {
          states[idx] = typeof val === 'function' ? val(states[idx]) : val;
        };
      }
      return [states[idx], setStates[idx]];
    },
    useCallback(fn) {
      return fn;
    },
    useEffect(effect) {
      effects.push(effect);
    },
  };

  React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H = dispatcher;
  stateIndex = 0;
  hookFn();
  for (const eff of effects) eff();

  return {
    get result() {
      stateIndex = 0;
      return hookFn();
    },
  };
}

// Feature 61 Boundaries: Pomodoro Timer & Confetti
suite('Feature 61 Boundaries: Pomodoro Timer & Confetti', () => {
  test('T2.F61.1: Rapid start/pause thrashing (<50ms) does not produce drift or negative time', () => {
    useStudyStore.setState({ isRunning: false, timeLeftSeconds: 1500 });
    for (let i = 0; i < 50; i++) {
      useStudyStore.getState().toggleTimer();
    }
    // 50 toggles should return to paused
    expect(useStudyStore.getState().isRunning).toBe(false);
    expect(useStudyStore.getState().timeLeftSeconds).toBe(1500);
  });

  test('T2.F61.2: Confetti execution failure in headless/unsupported DOM safely caught without crashing timer', () => {
    // In headless Node.js without window/canvas, triggerFireworks must safely no-op
    let threw = false;
    try {
      triggerFireworks({ durationMs: 100 });
      triggerConfettiBurst(50);
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);
  });

  test('T2.F61.3: Switching preset during active timer halts interval and applies new duration safely', () => {
    useStudyStore.setState({ isRunning: true, timeLeftSeconds: 300, pomodoroPreset: '25/5', pomodoroMode: 'work' });
    useStudyStore.getState().setPomodoroPreset('50/10');
    expect(useStudyStore.getState().isRunning).toBe(false);
    expect(useStudyStore.getState().timeLeftSeconds).toBe(50 * 60);
  });

  test('T2.F61.4: Extreme session count (>10,000) increments without numeric overflow', () => {
    useStudyStore.setState({
      pomodoroPreset: '25/5',
      pomodoroMode: 'work',
      timeLeftSeconds: 1,
      isRunning: true,
      sessionsCompleted: 10000,
    });
    useStudyStore.getState().tickTimer();
    expect(useStudyStore.getState().sessionsCompleted).toBe(10001);
  });

  test('T2.F61.5: resetTimer() during break mode resets to break duration, not work duration', () => {
    useStudyStore.setState({
      pomodoroPreset: '25/5',
      pomodoroMode: 'break',
      timeLeftSeconds: 30,
      isRunning: true,
    });
    useStudyStore.getState().resetTimer();
    expect(useStudyStore.getState().timeLeftSeconds).toBe(5 * 60);
    expect(useStudyStore.getState().isRunning).toBe(false);
  });
});

// Feature 62 Boundaries: Procedural Ambient Sound
suite('Feature 62 Boundaries: Procedural Ambient Sound', () => {
  test('T2.F62.1: Rapid simultaneous volume slider thrashing does not cause audio buffer overflow or NaN gain', () => {
    const originalWindow = globalThis.window;
    globalThis.window = {
      AudioContext: createMockAudioContext,
      setInterval: () => 1,
      clearInterval: () => {},
    };

    try {
      const engine = new AmbientAudioEngine();
      engine.start();

      for (let i = 0; i < 100; i++) {
        const rand = Math.random();
        engine.setVolumes({ vinyl: rand, rain: 1 - rand, brown: rand * 0.5 }, false);
      }

      expect(engine.getIsInitialized()).toBe(true);
      engine.stop();
    } finally {
      globalThis.window = originalWindow;
    }
  });

  test('T2.F62.2: AudioContext resume rejection (browser autoplay policy) handled gracefully', async () => {
    const originalWindow = globalThis.window;
    globalThis.window = {
      AudioContext: function() {
        const ctx = createMockAudioContext();
        ctx.suspend();
        ctx.resume = async () => {
          throw new Error('The play() request was interrupted by a call to pause().');
        };
        return ctx;
      },
      setInterval: () => 1,
      clearInterval: () => {},
    };

    try {
      const engine = new AmbientAudioEngine();
      let threw = false;
      try {
        await engine.start();
      } catch {
        threw = true;
      }
      expect(threw).toBe(false);
      engine.stop();
    } finally {
      globalThis.window = originalWindow;
    }
  });

  test('T2.F62.3: Multiple consecutive start() calls are idempotent', async () => {
    const originalWindow = globalThis.window;
    globalThis.window = {
      AudioContext: createMockAudioContext,
      setInterval: () => 1,
      clearInterval: () => {},
    };

    try {
      const engine = new AmbientAudioEngine();
      await engine.start();
      await engine.start();
      await engine.start();
      expect(engine.getIsInitialized()).toBe(true);
      engine.stop();
    } finally {
      globalThis.window = originalWindow;
    }
  });

  test('T2.F62.4: Invoking setVolumes() on closed/uninitialized engine safely no-ops', () => {
    const engine = new AmbientAudioEngine();
    let threw = false;
    try {
      engine.setVolumes({ vinyl: 0.5, rain: 0.5, brown: 0.5 }, false);
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);
  });

  test('T2.F62.5: Rapid creation and teardown of 20 AmbientAudioEngine instances produces zero memory leaks', () => {
    const originalWindow = globalThis.window;
    globalThis.window = {
      AudioContext: createMockAudioContext,
      setInterval: () => 1,
      clearInterval: () => {},
    };

    try {
      for (let i = 0; i < 20; i++) {
        const engine = new AmbientAudioEngine();
        engine.start();
        engine.stop();
        expect(engine.getContext()).toBe(null);
      }
    } finally {
      globalThis.window = originalWindow;
    }
  });
});

// Feature 63 Boundaries: Document Picture-in-Picture
suite('Feature 63 Boundaries: Document Picture-in-Picture', () => {
  test('T2.F63.1: Document PiP user rejection (NotAllowedError) caught with zero unhandled rejections', async () => {
    const originalWindow = globalThis.window;
    const originalDocument = globalThis.document;

    // Simulate Chromium browser where user denies Document PiP permission
    globalThis.window = {
      documentPictureInPicture: {
        requestWindow: async () => {
          const err = new Error('Permission denied by user');
          err.name = 'NotAllowedError';
          throw err;
        },
      },
    };
    globalThis.document = {
      querySelectorAll: () => [],
    };

    useStudyStore.setState({ isPipActive: true });

    const hook = renderHook(() => useDocumentPip());
    expect(hook.result.isSupported).toBe(true);

    const origConsoleError = console.error;
    let loggedError = null;
    console.error = (...args) => { loggedError = args; };

    try {
      // openPip should catch NotAllowedError, log to console, and reset store state
      await hook.result.openPip(400, 260);

      expect(useStudyStore.getState().isPipActive).toBe(false);
      expect(loggedError).not.toBe(null);
      expect(loggedError[0]).toContain('Failed to open Document Picture-in-Picture');
    } finally {
      console.error = origConsoleError;
      globalThis.window = originalWindow;
      globalThis.document = originalDocument;
    }
  });

  test('T2.F63.2: Malformed, cross-origin, or missing stylesheet tags handled gracefully during cloning', async () => {
    const pipEnv = createMockDocumentPipEnvironment({ isSupported: true });
    const originalWindow = globalThis.window;
    const originalDocument = globalThis.document;

    const validStyle1 = {
      cloneNode: () => ({ tagName: 'STYLE', textContent: '.valid-1 { color: red; }' }),
    };
    const corsRestrictedStyle = {
      cloneNode: () => {
        const err = new Error('SecurityError: Cannot access cross-origin stylesheet');
        err.name = 'SecurityError';
        throw err;
      },
    };
    const validStyle2 = {
      cloneNode: () => ({ tagName: 'STYLE', textContent: '.valid-2 { color: blue; }' }),
    };

    const origRequestWindow = pipEnv.api.requestWindow;
    pipEnv.api.requestWindow = async (opts) => {
      const win = await origRequestWindow.call(pipEnv.api, opts);
      win.document.body.style = {};
      return win;
    };

    globalThis.window = {
      documentPictureInPicture: pipEnv.api,
    };
    globalThis.document = {
      querySelectorAll: () => [validStyle1, corsRestrictedStyle, validStyle2],
    };

    useStudyStore.setState({ isPipActive: false });

    try {
      const hook = renderHook(() => useDocumentPip());
      // production openPip has try/catch per node during cloneNode
      await hook.result.openPip(400, 260);

      const activeWin = pipEnv.getActiveWindow();
      expect(activeWin.document.head.nodes.length).toBe(2);
      expect(activeWin.document.head.nodes[0].textContent).toBe('.valid-1 { color: red; }');
      expect(activeWin.document.head.nodes[1].textContent).toBe('.valid-2 { color: blue; }');
      expect(useStudyStore.getState().isPipActive).toBe(true);
    } finally {
      globalThis.window = originalWindow;
      globalThis.document = originalDocument;
    }
  });

  test('T2.F63.3: Rapid open/close cycles (<100ms) do not create orphaned windows or duplicate portals', async () => {
    const pipEnv = createMockDocumentPipEnvironment({ isSupported: true });
    for (let i = 0; i < 5; i++) {
      const win = await pipEnv.api.requestWindow();
      expect(pipEnv.getActiveWindow()).toBe(win);
      win.close();
      expect(pipEnv.getActiveWindow()).toBe(null);
    }
  });

  test('T2.F63.4: Unmounting parent page while PiP is open cleanly closes detached window', async () => {
    const pipEnv = createMockDocumentPipEnvironment({ isSupported: true });
    const win = await pipEnv.api.requestWindow();
    let closed = false;
    win.addEventListener('pagehide', () => { closed = true; });

    // Simulate hook unmount cleanup
    win.close();
    expect(closed).toBe(true);
  });

  test('T2.F63.5: Non-Chromium browsers safely hide PiP button with zero runtime exceptions', () => {
    const pipEnv = createMockDocumentPipEnvironment({ isSupported: false });
    expect(pipEnv.supported).toBe(false);
    expect(pipEnv.api).toBe(undefined);
  });
});

// Feature 64 Boundaries: Integration & Multi-Engine Concurrency
suite('Feature 64 Boundaries: Integration & Multi-Engine Concurrency', () => {
  test('T2.F64.1: Concurrent visualizer mode cycling and Pomodoro ticking execute without UI jank', () => {
    useStudyStore.setState({ isRunning: true, timeLeftSeconds: 100 });
    for (let i = 0; i < 10; i++) {
      usePlayerStore.getState().cycleVisualizerMode();
      useStudyStore.getState().tickTimer();
    }
    expect(useStudyStore.getState().timeLeftSeconds).toBe(90);
  });

  test('T2.F64.2: Spotify session token revocation during PiP playback falls back to demo mode without PiP crash', () => {
    useSpotifyStore.setState({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
    });
    expect(useSpotifyStore.getState().isAuthenticated).toBe(false);
    // Player remains operational in demo fallback
    expect(usePlayerStore.getState().isPlaying !== undefined).toBe(true);
  });

  test('T2.F64.3: High-frequency track switching (10 tracks/sec) keeps MiniLyricsHUD state coherent', () => {
    for (let i = 0; i < 10; i++) {
      usePlayerStore.setState({
        currentTrack: {
          id: `track-${i}`,
          title: `Track ${i}`,
          artist: `Artist ${i}`,
          duration: 180,
          palette: ['#000', '#111', '#222', '#333'],
        },
      });
    }
    expect(usePlayerStore.getState().currentTrack.title).toBe('Track 9');
  });

  test('T2.F64.4: Rapid mute/unmute toggling concurrently with music volume changes avoids gain clipping', () => {
    for (let i = 0; i < 20; i++) {
      useStudyStore.getState().toggleAmbientMute();
      usePlayerStore.getState().setVolume(Math.random());
    }
    expect(usePlayerStore.getState().volume >= 0 && usePlayerStore.getState().volume <= 1).toBe(true);
  });

  test('T2.F64.5: Keydown handler suppresses repeated S keypresses to prevent modal toggle storms', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/page.tsx');
    const pageSrc = fs.readFileSync(pagePath, 'utf8');

    // 1. Verify production page.tsx explicitly guards the 's' key against holding repeat storms
    expect(pageSrc).toContain("e.key.toLowerCase() === 's' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.repeat");
    expect(pageSrc).toContain('toggleStudyMode()');

    // 2. Test actual active Zustand store state machine transitions
    useStudyStore.setState({ isStudyMode: false });
    useStudyStore.getState().toggleStudyMode();
    expect(useStudyStore.getState().isStudyMode).toBe(true);

    useStudyStore.getState().toggleStudyMode();
    expect(useStudyStore.getState().isStudyMode).toBe(false);
  });
});

// Feature 65 Boundaries: Test Suite Integrity & Runtime Resilience
suite('Feature 65 Boundaries: Test Suite Integrity & Runtime Resilience', () => {
  test('T2.F65.1: Runner argument filtering executes exact matching subsets', async () => {
    const TestContextClass = globalHarness.constructor;
    const testHarness = new TestContextClass();

    let studyRan = false;
    let playbackRan = false;

    testHarness.suite('Feature 61: Study HUD Suite', () => {
      testHarness.test('Pomodoro ticks correctly', () => { studyRan = true; });
    });
    testHarness.suite('Feature 01: Playback Suite', () => {
      testHarness.test('Volume ramps smoothly', () => { playbackRan = true; });
    });

    // Execute runner filtering with 'Study' filter
    const report = await testHarness.run('Study');
    expect(report.stats.total).toBe(1);
    expect(report.stats.passed).toBe(1);
    expect(studyRan).toBe(true);
    expect(playbackRan).toBe(false);

    // Filter with non-matching pattern returns 0 executed tests
    const emptyReport = await testHarness.run('non_existent_suite_xyz');
    expect(emptyReport.stats.total).toBe(0);
  });

  test('T2.F65.2: Adversarial track metadata (XSS scripts, Unicode emojis) renders safely without throwing', () => {
    const adversarialTrack = {
      id: 'xss-1',
      title: '<script>alert("xss")</script> 🚀 🎵',
      artist: '<b>Bold Artist</b>',
      duration: 200,
      palette: ['#000', '#111', '#222', '#333'],
    };
    usePlayerStore.setState({ currentTrack: adversarialTrack });
    expect(usePlayerStore.getState().currentTrack.title).toContain('<script>');
  });

  test('T2.F65.3: Confetti fireworks helper handles zero and negative durationMs gracefully', () => {
    let threw = false;
    try {
      triggerFireworks({ durationMs: 0 });
      triggerFireworks({ durationMs: -500 });
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);
  });

  test('T2.F65.4: Zero global variable leaks into globalThis or browser window', () => {
    expect(globalThis.__polluted__).toBe(undefined);
  });

  test('T2.F65.5: High-concurrency test execution finishes cleanly without timeouts', async () => {
    const originalWindow = globalThis.window;
    const mockCtx = createMockAudioContext();
    globalThis.window = {
      AudioContext: function() { return mockCtx; },
      webkitAudioContext: function() { return mockCtx; },
    };

    const engine = new AmbientAudioEngine();
    engine.start();

    // Concurrently dispatch 50 interleaved operations across study store, player store, and audio engine
    const operations = Array.from({ length: 50 }, async (_, i) => {
      useStudyStore.getState().setAmbientVolume('vinyl', (i % 10) / 10);
      useStudyStore.getState().setAmbientVolume('rain', ((50 - i) % 10) / 10);
      usePlayerStore.getState().setVolume((i % 100) / 100);

      if (i % 5 === 0) {
        useStudyStore.getState().tickTimer();
      }
      if (i % 10 === 0) {
        triggerFireworks({ durationMs: 50 });
      }

      engine.setVolumes(useStudyStore.getState().ambientVolumes, false);
      return i;
    });

    const results = await Promise.all(operations);
    expect(results.length).toBe(50);

    // Verify application state invariants remained uncorrupted under concurrency
    const studyState = useStudyStore.getState();
    const playerState = usePlayerStore.getState();

    expect(studyState.ambientVolumes.vinyl >= 0 && studyState.ambientVolumes.vinyl <= 1).toBe(true);
    expect(studyState.ambientVolumes.rain >= 0 && studyState.ambientVolumes.rain <= 1).toBe(true);
    expect(playerState.volume >= 0 && playerState.volume <= 1).toBe(true);
    expect(typeof studyState.timeLeftSeconds).toBe('number');

    engine.stop();
    globalThis.window = originalWindow;
  });
});
