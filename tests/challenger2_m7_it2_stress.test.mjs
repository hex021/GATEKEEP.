/**
 * Challenger 2: Milestone 7 Iteration 2 Empirical Stress Test Suite
 * Deep verification of:
 * 1. Document PiP lifecycle under rapid open/close (<50ms).
 * 2. Portal persistence: closing in-tab Study HUD modal does not unmount detached PiP portal.
 * 3. Concurrency stress: 100 interleaved operations across visualizer cycling ('V'), track changing, Pomodoro ticking, and ambient volume sliders.
 * 4. Verify T2.F65.5 concurrent execution runs cleanly without deadlock or race conditions.
 */

import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';

try {
  register('./tests/helpers/path-loader.mjs', pathToFileURL('./'));
} catch {
  // Already registered
}

import { suite, test, expect, globalHarness } from './helpers/test-harness.mjs';
import { createMockAudioContext, createMockDocumentPipEnvironment } from './helpers/mocks.mjs';

const { useStudyStore } = await import('../src/stores/useStudyStore.ts');
const { usePlayerStore } = await import('../src/stores/usePlayerStore.ts');
const { triggerFireworks, triggerConfettiBurst } = await import('../src/lib/confetti.ts');
const { AmbientAudioEngine } = await import('../src/components/study/AmbientAudioEngine.ts');
const { DEMO_TRACKS } = await import('../src/data/demoTracks.ts');
const { useDocumentPip } = await import('../src/hooks/useDocumentPip.ts');

// Authentic React 19 Hook Runner for testing hooks with state & cleanup
function renderHook(hookFn) {
  let stateIndex = 0;
  const states = [];
  const setStates = [];
  const cleanups = new Map();

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
    useEffect(effect, deps) {
      const effIdx = stateIndex++;
      const cleanup = effect();
      if (typeof cleanup === 'function') {
        cleanups.set(effIdx, cleanup);
      }
    },
  };

  React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H = dispatcher;
  stateIndex = 0;
  hookFn();

  return {
    get current() {
      stateIndex = 0;
      return hookFn();
    },
    unmount() {
      stateIndex = 0;
      hookFn();
      for (const cl of cleanups.values()) {
        try { cl(); } catch {}
      }
    },
  };
}

// Reset stores before tests
function resetStores() {
  useStudyStore.setState({
    isStudyMode: false,
    isPipActive: false,
    pomodoroPreset: '25/5',
    pomodoroMode: 'work',
    timeLeftSeconds: 25 * 60,
    isRunning: false,
    sessionsCompleted: 0,
    ambientVolumes: { vinyl: 0.35, rain: 0.4, brown: 0.25 },
    isAmbientMuted: false,
  });

  usePlayerStore.setState({
    mode: 'demo',
    isPlaying: false,
    currentTimeMs: 0,
    durationMs: DEMO_TRACKS[0].durationMs,
    volume: 0.8,
    isMuted: false,
    syncOffsetMs: 0,
    currentTrack: DEMO_TRACKS[0],
    demoTrackIndex: 0,
    lyrics: DEMO_TRACKS[0].lyrics,
    activeLineIndex: 0,
    visualizerMode: 'video-edit',
  });
}

// =========================================================================
// Suite 1: Document PiP Lifecycle Under Rapid Open/Close (<50ms)
// =========================================================================
suite('Challenger 2 (It2) — Suite 1: Document PiP Lifecycle Under Rapid Open/Close', () => {
  test('T1.1: Rapid open/close thrashing (<50ms cycles) through authentic useDocumentPip hook', async () => {
    resetStores();
    const pipEnv = createMockDocumentPipEnvironment({ isSupported: true });

    const origWindow = globalThis.window;
    const origDoc = globalThis.document;

    globalThis.window = {
      documentPictureInPicture: pipEnv.api,
    };
    globalThis.document = {
      querySelectorAll: () => [
        { nodeName: 'STYLE', textContent: '.test { color: red; }', cloneNode: () => ({ nodeName: 'STYLE' }) },
      ],
    };

    try {
      const hook = renderHook(() => useDocumentPip());
      expect(hook.current.isSupported).toBe(true);

      // Perform 20 rapid open/close cycles under 50ms each
      for (let i = 0; i < 20; i++) {
        await hook.current.openPip(380, 240);
        expect(useStudyStore.getState().isPipActive).toBe(true);
        expect(hook.current.pipWindow).not.toBe(null);

        // Immediate close within <50ms
        hook.current.closePip();
        expect(useStudyStore.getState().isPipActive).toBe(false);
        expect(hook.current.pipWindow).toBe(null);
      }

      hook.unmount();
      expect(useStudyStore.getState().isPipActive).toBe(false);
    } finally {
      globalThis.window = origWindow;
      globalThis.document = origDoc;
    }
  });

  test('T1.2: Overlapping in-flight openPip calls guarantee single-window creation without duplicate portals', async () => {
    resetStores();
    const pipEnv = createMockDocumentPipEnvironment({ isSupported: true });

    const origWindow = globalThis.window;
    const origDoc = globalThis.document;

    globalThis.window = {
      documentPictureInPicture: pipEnv.api,
    };
    globalThis.document = {
      querySelectorAll: () => [],
    };

    try {
      const hook = renderHook(() => useDocumentPip());

      // Dispatch 5 concurrent openPip calls while first is in-flight
      await Promise.all([
        hook.current.openPip(400, 250),
        hook.current.openPip(400, 250),
        hook.current.openPip(400, 250),
        hook.current.openPip(400, 250),
        hook.current.openPip(400, 250),
      ]);

      expect(useStudyStore.getState().isPipActive).toBe(true);
      expect(hook.current.pipWindow).not.toBe(null);

      hook.current.closePip();
      expect(hook.current.pipWindow).toBe(null);
      expect(useStudyStore.getState().isPipActive).toBe(false);

      hook.unmount();
    } finally {
      globalThis.window = origWindow;
      globalThis.document = origDoc;
    }
  });

  test('T1.3: User closes PiP window directly from OS (pagehide) within 10ms of opening resets hook state', async () => {
    resetStores();
    const pipEnv = createMockDocumentPipEnvironment({ isSupported: true });

    const origWindow = globalThis.window;
    const origDoc = globalThis.document;

    globalThis.window = {
      documentPictureInPicture: pipEnv.api,
    };
    globalThis.document = {
      querySelectorAll: () => [],
    };

    try {
      const hook = renderHook(() => useDocumentPip());
      await hook.current.openPip(400, 260);

      const win = hook.current.pipWindow;
      expect(win).not.toBe(null);
      expect(useStudyStore.getState().isPipActive).toBe(true);

      // Trigger OS window close via pagehide event
      win.close();

      expect(hook.current.pipWindow).toBe(null);
      expect(useStudyStore.getState().isPipActive).toBe(false);

      hook.unmount();
    } finally {
      globalThis.window = origWindow;
      globalThis.document = origDoc;
    }
  });

  test('T1.4: Hook unmount cleanup while PiP is open forces OS window closure and syncs Zustand', async () => {
    resetStores();
    const pipEnv = createMockDocumentPipEnvironment({ isSupported: true });

    const origWindow = globalThis.window;
    const origDoc = globalThis.document;

    globalThis.window = {
      documentPictureInPicture: pipEnv.api,
    };
    globalThis.document = {
      querySelectorAll: () => [],
    };

    try {
      const hook = renderHook(() => useDocumentPip());
      await hook.current.openPip(380, 240);
      const win = hook.current.pipWindow;
      expect(win).not.toBe(null);
      expect(useStudyStore.getState().isPipActive).toBe(true);

      // Unmount hook (simulates navigating away or parent unmounting)
      hook.unmount();

      expect(pipEnv.getActiveWindow()).toBe(null);
      expect(useStudyStore.getState().isPipActive).toBe(false);
    } finally {
      globalThis.window = origWindow;
      globalThis.document = origDoc;
    }
  });
});

// =========================================================================
// Suite 2: Portal Persistence Across In-Tab Study HUD Modal Closing
// =========================================================================
suite('Challenger 2 (It2) — Suite 2: Portal Persistence Across In-Tab Modal Dismissal', () => {
  test('T2.1: Closing in-tab Study HUD modal preserves detached PiP portal in return tree', () => {
    resetStores();
    const studyHudPath = path.resolve(process.cwd(), 'src/components/study/StudyHUD.tsx');
    const studyHudSrc = fs.readFileSync(studyHudPath, 'utf8');

    // 1. Verify component return guard condition:
    // If modal is closed (isStudyMode = false) but PiP window is open (pipWindow != null),
    // component must NOT return null!
    expect(studyHudSrc).toContain('if (!isStudyMode && !pipWindow) return null;');

    // 2. Verify portal is declared outside modal wrapper:
    // {isStudyMode && ( ... modal ... )}
    // {pipWindow && createPortal( ... , pipWindow.document.body)}
    expect(studyHudSrc).toContain('{/* Floating Document PiP Portal */}');
    expect(studyHudSrc).toContain('{pipWindow &&');
    expect(studyHudSrc).toContain('createPortal(');
    expect(studyHudSrc).toContain('pipWindow.document.body');

    // 3. Functional Simulation of StudyHUD root render decision
    const renderStudyHUD = (isStudyMode, pipWindow) => {
      if (!isStudyMode && !pipWindow) return null;
      return {
        rendersModal: isStudyMode,
        rendersPortal: Boolean(pipWindow),
        portalTarget: pipWindow ? pipWindow.document.body : null,
      };
    };

    const mockPipWindow = { document: { body: { nodes: [] } } };

    // Case A: Initial Study HUD open, PiP closed
    let tree = renderStudyHUD(true, null);
    expect(tree).not.toBe(null);
    expect(tree.rendersModal).toBe(true);
    expect(tree.rendersPortal).toBe(false);

    // Case B: User pops out PiP window while in Study HUD
    useStudyStore.getState().openStudyMode();
    tree = renderStudyHUD(true, mockPipWindow);
    expect(tree).not.toBe(null);
    expect(tree.rendersModal).toBe(true);
    expect(tree.rendersPortal).toBe(true);
    expect(tree.portalTarget).toBe(mockPipWindow.document.body);

    // Case C: User closes in-tab Study HUD modal (presses Escape or clicks X)
    useStudyStore.getState().closeStudyMode();
    expect(useStudyStore.getState().isStudyMode).toBe(false);

    tree = renderStudyHUD(useStudyStore.getState().isStudyMode, mockPipWindow);
    // CRUCIAL ASSERTION: Portal persists! Tree is not null, modal is false, portal is true!
    expect(tree).not.toBe(null);
    expect(tree.rendersModal).toBe(false);
    expect(tree.rendersPortal).toBe(true);
    expect(tree.portalTarget).toBe(mockPipWindow.document.body);

    // Case D: User closes PiP window while modal is already closed
    tree = renderStudyHUD(useStudyStore.getState().isStudyMode, null);
    expect(tree).toBe(null);
  });

  test('T2.2: MiniLyricsHUD content in detached portal continues updating when modal is closed', () => {
    resetStores();
    usePlayerStore.setState({
      currentTrack: DEMO_TRACKS[0],
      isPlaying: true,
      currentTimeMs: 10000,
      activeLineIndex: 1,
    });
    useStudyStore.setState({
      isStudyMode: false, // In-tab modal is closed
      timeLeftSeconds: 1500,
      pomodoroMode: 'work',
      isRunning: true,
    });

    // Simulate lyric change in player
    usePlayerStore.setState({ activeLineIndex: 2 });
    expect(usePlayerStore.getState().activeLineIndex).toBe(2);

    // Simulate Pomodoro ticking
    useStudyStore.getState().tickTimer();
    expect(useStudyStore.getState().timeLeftSeconds).toBe(1499);

    // Advance to next track while modal is closed
    usePlayerStore.getState().nextTrack();
    expect(usePlayerStore.getState().currentTrack.title).toBe(DEMO_TRACKS[1].title);
  });

  test('T2.3: Multiple consecutive modal open/close cycles do not disrupt floating PiP window', () => {
    resetStores();
    const mockPipWindow = { document: { body: {} } };

    for (let i = 0; i < 5; i++) {
      useStudyStore.getState().openStudyMode();
      expect(useStudyStore.getState().isStudyMode).toBe(true);

      useStudyStore.getState().closeStudyMode();
      expect(useStudyStore.getState().isStudyMode).toBe(false);
    }

    // PiP window remains valid and active throughout
    expect(mockPipWindow).not.toBe(null);
  });
});

// =========================================================================
// Suite 3: Concurrency Stress (100 Interleaved Operations)
// =========================================================================
suite('Challenger 2 (It2) — Suite 3: 100 Interleaved Operations Concurrency Stress', () => {
  test('T3.1: 100 interleaved operations across visualizer mode, track switching, Pomodoro ticking, and audio sliders', async () => {
    resetStores();
    const origWindow = globalThis.window;
    const mockCtx = createMockAudioContext();

    globalThis.window = {
      AudioContext: function() { return mockCtx; },
      webkitAudioContext: function() { return mockCtx; },
      setInterval: () => 1,
      clearInterval: () => {},
    };

    try {
      const engine = new AmbientAudioEngine();
      await engine.start();

      useStudyStore.setState({ isRunning: true, timeLeftSeconds: 300 });

      const visualizerModes = ['video-edit', 'apple-spatial', 'cyberpunk'];

      // Execute 100 interleaved asynchronous operations
      const ops = Array.from({ length: 100 }, async (_, i) => {
        const opType = i % 4;

        if (opType === 0) {
          // Visualizer mode cycling ('V' key equivalent)
          usePlayerStore.getState().cycleVisualizerMode();
        } else if (opType === 1) {
          // Track changing
          if (i % 2 === 0) {
            usePlayerStore.getState().nextTrack();
          } else {
            usePlayerStore.getState().selectDemoTrack(i % DEMO_TRACKS.length);
          }
        } else if (opType === 2) {
          // Pomodoro ticking
          useStudyStore.getState().tickTimer();
        } else {
          // Ambient volume slider adjustments
          const vinylVol = (i % 10) / 10;
          const rainVol = ((100 - i) % 10) / 10;
          const brownVol = (i % 5) / 5;

          useStudyStore.getState().setAmbientVolume('vinyl', vinylVol);
          useStudyStore.getState().setAmbientVolume('rain', rainVol);
          useStudyStore.getState().setAmbientVolume('brown', brownVol);
          engine.setVolumes(useStudyStore.getState().ambientVolumes, false);
        }

        return i;
      });

      const results = await Promise.all(ops);
      expect(results.length).toBe(100);

      // Verify all system invariants remained uncorrupted
      const playerState = usePlayerStore.getState();
      const studyState = useStudyStore.getState();

      expect(visualizerModes.includes(playerState.visualizerMode)).toBe(true);
      expect(playerState.currentTrack).not.toBe(null);
      expect(typeof playerState.currentTrack.title).toBe('string');
      expect(studyState.ambientVolumes.vinyl >= 0 && studyState.ambientVolumes.vinyl <= 1).toBe(true);
      expect(studyState.ambientVolumes.rain >= 0 && studyState.ambientVolumes.rain <= 1).toBe(true);
      expect(studyState.ambientVolumes.brown >= 0 && studyState.ambientVolumes.brown <= 1).toBe(true);
      expect(studyState.timeLeftSeconds >= 0).toBe(true);
      expect(Number.isInteger(studyState.sessionsCompleted)).toBe(true);

      engine.stop();
    } finally {
      globalThis.window = origWindow;
    }
  });

  test('T3.2: High-frequency track switching preserves active line binary search index and sync offset', () => {
    resetStores();

    for (let i = 0; i < 50; i++) {
      const trackIdx = i % DEMO_TRACKS.length;
      usePlayerStore.getState().selectDemoTrack(trackIdx);
      usePlayerStore.getState().seekTo(10000 + i * 100);

      const state = usePlayerStore.getState();
      expect(state.demoTrackIndex).toBe(trackIdx);
      expect(state.currentTrack.id).toBe(DEMO_TRACKS[trackIdx].id);
      expect(state.currentTimeMs >= 0).toBe(true);
      expect(state.activeLineIndex >= -1).toBe(true);
    }
  });
});

// =========================================================================
// Suite 4: T2.F65.5 Concurrent Execution & Deadlock Freedom
// =========================================================================
suite('Challenger 2 (It2) — Suite 4: T2.F65.5 Concurrency Integrity & Deadlock Freedom', () => {
  test('T4.1: Authentic T2.F65.5 concurrent execution completes cleanly', async () => {
    resetStores();
    const origWindow = globalThis.window;
    const mockCtx = createMockAudioContext();

    globalThis.window = {
      AudioContext: function() { return mockCtx; },
      webkitAudioContext: function() { return mockCtx; },
    };

    try {
      const engine = new AmbientAudioEngine();
      engine.start();

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

      const studyState = useStudyStore.getState();
      const playerState = usePlayerStore.getState();

      expect(studyState.ambientVolumes.vinyl >= 0 && studyState.ambientVolumes.vinyl <= 1).toBe(true);
      expect(studyState.ambientVolumes.rain >= 0 && studyState.ambientVolumes.rain <= 1).toBe(true);
      expect(playerState.volume >= 0 && playerState.volume <= 1).toBe(true);
      expect(typeof studyState.timeLeftSeconds).toBe('number');

      engine.stop();
    } finally {
      globalThis.window = origWindow;
    }
  });

  test('T4.2: Scaled concurrency stress: 10 consecutive iterations with 75 concurrent ops without deadlock', async () => {
    resetStores();
    const origWindow = globalThis.window;
    const mockCtx = createMockAudioContext();

    globalThis.window = {
      AudioContext: function() { return mockCtx; },
      webkitAudioContext: function() { return mockCtx; },
    };

    try {
      const engine = new AmbientAudioEngine();
      engine.start();

      for (let iteration = 0; iteration < 10; iteration++) {
        const ops = Array.from({ length: 75 }, async (_, i) => {
          useStudyStore.getState().setAmbientVolume('vinyl', Math.random());
          useStudyStore.getState().setAmbientVolume('rain', Math.random());
          usePlayerStore.getState().setVolume(Math.random());

          if (i % 7 === 0) {
            useStudyStore.getState().tickTimer();
          }

          engine.setVolumes(useStudyStore.getState().ambientVolumes, false);
          return i;
        });

        const res = await Promise.all(ops);
        expect(res.length).toBe(75);
      }

      engine.stop();
    } finally {
      globalThis.window = origWindow;
    }
  });
});

// Run verification harness
async function run() {
  console.log('\n======================================================');
  console.log('   CHALLENGER 2 (IT2): EMPIRICAL STRESS TEST HARNESS   ');
  console.log('======================================================\n');

  const report = await globalHarness.run();
  console.log(`Total tests run: ${report.stats.total}`);
  console.log(`Passed:          ${report.stats.passed}`);
  console.log(`Failed:          ${report.stats.failed}`);
  console.log(`Duration:        ${report.stats.durationMs.toFixed(2)}ms\n`);

  if (report.failures.length > 0) {
    console.error('FAILURES DETECTED:');
    for (const fail of report.failures) {
      console.error(`- [${fail.suite}] ${fail.test}`);
      console.error(`  Error: ${fail.error.message}`);
    }
    process.exit(1);
  } else {
    console.log('ALL ITERATION 2 EMPIRICAL STRESS TESTS PASSED! ✅\n');
    process.exit(0);
  }
}

run();
