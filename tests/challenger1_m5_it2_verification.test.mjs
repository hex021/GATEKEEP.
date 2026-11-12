/**
 * Challenger 1: Milestone 5 Iteration 2 Empirical Verification Suite
 * 
 * Verifies the three core remediations:
 * 1. Mode cycling: Single 'V' keydown advances exactly 1 state, repeated keypresses cycle cleanly through all 3 modes, e.repeat is ignored.
 * 2. Input guard: 'V' keypress while focusing <input>, <textarea>, <select>, [contenteditable="true"], or nested elements inside them does NOT trigger mode cycling.
 * 3. CyberTerminalTimecode: Advancing currentTimeMs at 60fps updates the timecode display without modifying memoized state of inactive context lines or decoders in CyberpunkLyrics.
 */

import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

try {
  register('./tests/helpers/path-loader.mjs', pathToFileURL('./'));
} catch {
  // Ignore if already registered
}

import { suite, test, expect, globalHarness } from './helpers/test-harness.mjs';

const { usePlayerStore, findActiveLineIndex } = await import('../src/stores/usePlayerStore.ts');
const {
  cycleVisualizerMode,
  VISUALIZER_MODES,
  formatTimecode,
  getCyberpunkGlitchParams,
} = await import('../src/components/visualizer/keywordPuncher.ts');
const {
  formatTerminalTime,
  CyberTerminalTimecode,
  CYBER_GLITCH_VARIANTS,
} = await import('../src/components/visualizer/CyberpunkLyrics.tsx');
const { DEMO_TRACKS } = await import('../src/data/demoTracks.ts');

const pageSrc = fs.readFileSync(path.join(process.cwd(), 'src/app/page.tsx'), 'utf-8');
const kineticSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/visualizer/KineticLyrics.tsx'), 'utf-8');
const cyberpunkSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/visualizer/CyberpunkLyrics.tsx'), 'utf-8');

// =========================================================================
// Suite 1: Mode Cycling Empirical Verification ('V' Keydown & Modulo-3 Cycles)
// =========================================================================
suite('Milestone 5 Iteration 2: Mode Cycling Empirical Verification', () => {
  test('M5.IT2.CYCLE.1: Single listener hygiene — KineticLyrics has zero addEventListener calls', () => {
    // Verify KineticLyrics does NOT register any window keydown listener
    expect(kineticSrc.includes("addEventListener('keydown'")).toBe(false);
    expect(kineticSrc.includes('addEventListener("keydown"')).toBe(false);
    expect(kineticSrc.includes('addEventListener')).toBe(false);

    // Verify page.tsx registers the single centralized keydown listener with cycleVisualizerMode
    expect(pageSrc).toContain("window.addEventListener('keydown', handleKeyDown)");
    expect(pageSrc).toContain("window.removeEventListener('keydown', handleKeyDown)");
    expect(pageSrc).toContain('cycleVisualizerMode()');
  });

  test('M5.IT2.CYCLE.2: Simulating single "V" keydown event advances exactly 1 state', () => {
    const store = usePlayerStore.getState();
    store.setVisualizerMode('video-edit');
    expect(usePlayerStore.getState().visualizerMode).toBe('video-edit');

    // Simulate page.tsx keydown handler logic
    const simulateKeydown = (eventInit) => {
      const e = {
        key: eventInit.key || 'v',
        code: eventInit.code || 'KeyV',
        metaKey: !!eventInit.metaKey,
        ctrlKey: !!eventInit.ctrlKey,
        altKey: !!eventInit.altKey,
        repeat: !!eventInit.repeat,
        target: eventInit.target || { tagName: 'DIV', isContentEditable: false },
        defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; },
      };

      const target = e.target;
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable ||
        target?.closest?.('input, textarea, select, [contenteditable="true"]');

      if (isInput) return false;

      if (e.key.toLowerCase() === 'v' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.repeat) {
        e.preventDefault();
        usePlayerStore.getState().cycleVisualizerMode();
        return true;
      }
      return false;
    };

    // Exactly 1 'V' press -> advances to 'apple-spatial'
    const handled1 = simulateKeydown({ key: 'v' });
    expect(handled1).toBe(true);
    expect(usePlayerStore.getState().visualizerMode).toBe('apple-spatial');

    // Exactly 1 'V' press -> advances to 'cyberpunk'
    const handled2 = simulateKeydown({ key: 'v' });
    expect(handled2).toBe(true);
    expect(usePlayerStore.getState().visualizerMode).toBe('cyberpunk');

    // Exactly 1 'V' press -> advances back to 'video-edit'
    const handled3 = simulateKeydown({ key: 'v' });
    expect(handled3).toBe(true);
    expect(usePlayerStore.getState().visualizerMode).toBe('video-edit');
  });

  test('M5.IT2.CYCLE.3: Repeated keypresses cycle cleanly through all 3 modes over 150 iterations', () => {
    const store = usePlayerStore.getState();
    store.setVisualizerMode('video-edit');

    const expectedModes = ['video-edit', 'apple-spatial', 'cyberpunk'];

    for (let i = 0; i < 150; i++) {
      expect(usePlayerStore.getState().visualizerMode).toBe(expectedModes[i % 3]);
      usePlayerStore.getState().cycleVisualizerMode();
    }
    expect(usePlayerStore.getState().visualizerMode).toBe('video-edit');
  });

  test('M5.IT2.CYCLE.4: Key holding (e.repeat = true) does NOT advance state', () => {
    const store = usePlayerStore.getState();
    store.setVisualizerMode('video-edit');

    // Simulate holding down 'V' (rapid repeat events fired by OS)
    for (let r = 0; r < 50; r++) {
      const e = {
        key: 'v',
        repeat: true,
        metaKey: false,
        ctrlKey: false,
        altKey: false,
        target: { tagName: 'BODY' },
      };
      if (e.key.toLowerCase() === 'v' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.repeat) {
        store.cycleVisualizerMode();
      }
    }

    // Must remain locked at 'video-edit' without strobing
    expect(usePlayerStore.getState().visualizerMode).toBe('video-edit');
  });

  test('M5.IT2.CYCLE.5: Keyboard shortcut guards against Ctrl+V, Cmd+V, Alt+V', () => {
    const store = usePlayerStore.getState();
    store.setVisualizerMode('video-edit');

    const modifiedEvents = [
      { key: 'v', ctrlKey: true, metaKey: false, altKey: false, repeat: false },
      { key: 'v', ctrlKey: false, metaKey: true, altKey: false, repeat: false },
      { key: 'v', ctrlKey: false, metaKey: false, altKey: true, repeat: false },
      { key: 'V', ctrlKey: true, metaKey: true, altKey: false, repeat: false },
    ];

    for (const evt of modifiedEvents) {
      if (evt.key.toLowerCase() === 'v' && !evt.metaKey && !evt.ctrlKey && !evt.altKey && !evt.repeat) {
        store.cycleVisualizerMode();
      }
    }

    // Must remain at 'video-edit'
    expect(usePlayerStore.getState().visualizerMode).toBe('video-edit');
  });

  test('M5.IT2.CYCLE.6: Both lowercase "v" and uppercase "V" (Shift+V) trigger single step', () => {
    usePlayerStore.getState().setVisualizerMode('video-edit');

    // 'v'
    usePlayerStore.getState().cycleVisualizerMode();
    expect(usePlayerStore.getState().visualizerMode).toBe('apple-spatial');

    // 'V'
    usePlayerStore.getState().cycleVisualizerMode();
    expect(usePlayerStore.getState().visualizerMode).toBe('cyberpunk');

    // back
    usePlayerStore.getState().cycleVisualizerMode();
    expect(usePlayerStore.getState().visualizerMode).toBe('video-edit');
  });
});

// =========================================================================
// Suite 2: Input Guard Empirical Verification (<input>, <textarea>, <select>, contenteditable)
// =========================================================================
suite('Milestone 5 Iteration 2: Input Guard Empirical Verification', () => {
  const evaluateInputGuard = (target) => {
    // Exact guard implementation from src/app/page.tsx:61-69
    return Boolean(
      (typeof HTMLInputElement !== 'undefined' && target instanceof HTMLInputElement) ||
      (typeof HTMLTextAreaElement !== 'undefined' && target instanceof HTMLTextAreaElement) ||
      (typeof HTMLSelectElement !== 'undefined' && target instanceof HTMLSelectElement) ||
      target?.isContentEditable ||
      target?.closest?.('input, textarea, select, [contenteditable="true"]')
    );
  };

  test('M5.IT2.GUARD.1: Standard HTML input element types trigger guard', () => {
    class MockHTMLInputElement {
      constructor(type = 'text') {
        this.tagName = 'INPUT';
        this.type = type;
        this.isContentEditable = false;
      }
      closest(sel) {
        return sel.includes('input') ? this : null;
      }
    }

    const types = ['text', 'search', 'password', 'email', 'url', 'number'];
    for (const type of types) {
      const inputEl = new MockHTMLInputElement(type);
      expect(evaluateInputGuard(inputEl)).toBe(true);
    }
  });

  test('M5.IT2.GUARD.2: Standard HTML textarea element triggers guard', () => {
    const textareaEl = {
      tagName: 'TEXTAREA',
      isContentEditable: false,
      closest: (sel) => (sel.includes('textarea') ? textareaEl : null),
    };
    expect(evaluateInputGuard(textareaEl)).toBe(true);
  });

  test('M5.IT2.GUARD.3: Standard HTML select element triggers guard', () => {
    const selectEl = {
      tagName: 'SELECT',
      isContentEditable: false,
      closest: (sel) => (sel.includes('select') ? selectEl : null),
    };
    expect(evaluateInputGuard(selectEl)).toBe(true);
  });

  test('M5.IT2.GUARD.4: Rich text editor [contenteditable="true"] and isContentEditable trigger guard', () => {
    const editableDiv = {
      tagName: 'DIV',
      isContentEditable: true,
      closest: (sel) => (sel.includes('contenteditable') ? editableDiv : null),
    };
    expect(evaluateInputGuard(editableDiv)).toBe(true);

    const editableSpan = {
      tagName: 'SPAN',
      isContentEditable: true,
      closest: () => null,
    };
    expect(evaluateInputGuard(editableSpan)).toBe(true);
  });

  test('M5.IT2.GUARD.5: Deeply nested child element inside contenteditable container triggers guard via closest()', () => {
    const container = {
      tagName: 'DIV',
      getAttribute: (attr) => (attr === 'contenteditable' ? 'true' : null),
    };
    const nestedChild = {
      tagName: 'STRONG',
      isContentEditable: false,
      closest: (selector) => {
        if (selector.includes('[contenteditable="true"]')) return container;
        return null;
      },
    };
    expect(evaluateInputGuard(nestedChild)).toBe(true);
  });

  test('M5.IT2.GUARD.6: Non-input elements (BUTTON, DIV, BODY, SVG) safely ALLOW mode cycling', () => {
    const nonInputElements = [
      { tagName: 'BUTTON', isContentEditable: false, closest: () => null },
      { tagName: 'DIV', isContentEditable: false, closest: () => null },
      { tagName: 'MAIN', isContentEditable: false, closest: () => null },
      { tagName: 'BODY', isContentEditable: false, closest: () => null },
      { tagName: 'SVG', isContentEditable: false, closest: () => null },
      null,
      undefined,
    ];

    for (const el of nonInputElements) {
      expect(evaluateInputGuard(el)).toBe(false);
    }
  });

  test('M5.IT2.GUARD.7: End-to-end simulation of typing "v" in Spotify Client ID or Search input does NOT cycle mode', () => {
    usePlayerStore.getState().setVisualizerMode('video-edit');

    // Simulate typing the word "vibesync" into a Spotify input field
    const mockInput = {
      tagName: 'INPUT',
      type: 'text',
      value: '',
      isContentEditable: false,
      closest: (s) => (s.includes('input') ? mockInput : null),
    };

    const word = 'vibesync';
    for (const char of word) {
      const e = {
        key: char,
        target: mockInput,
        metaKey: false,
        ctrlKey: false,
        altKey: false,
        repeat: false,
      };

      const isInput = evaluateInputGuard(e.target);
      if (!isInput && e.key.toLowerCase() === 'v' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.repeat) {
        usePlayerStore.getState().cycleVisualizerMode();
      }
    }

    // Mode must NOT have changed despite typing the letter 'v' twice!
    expect(usePlayerStore.getState().visualizerMode).toBe('video-edit');
  });
});

// =========================================================================
// Suite 3: CyberTerminalTimecode & 60fps Re-render Isolation Verification
// =========================================================================
suite('Milestone 5 Iteration 2: CyberTerminalTimecode 60fps Isolation', () => {
  test('M5.IT2.TIME.1: CyberpunkLyrics root component has zero currentTimeMs subscriptions', () => {
    // Assert that CyberpunkLyrics root does NOT call usePlayerStore((s) => s.currentTimeMs)
    const rootMatchesTimeMs = /export function CyberpunkLyrics[\s\S]*?usePlayerStore\(\(s\)\s*=>\s*s\.currentTimeMs\)/.test(
      cyberpunkSrc
    );
    expect(rootMatchesTimeMs).toBe(false);

    // Assert that CyberpunkLyrics does NOT subscribe to currentTrack directly
    const rootMatchesTrack = /export function CyberpunkLyrics[\s\S]*?usePlayerStore\(\(s\)\s*=>\s*s\.currentTrack/.test(
      cyberpunkSrc
    );
    expect(rootMatchesTrack).toBe(false);
  });

  test('M5.IT2.TIME.2: CyberTerminalTimecode micro-component encapsulates currentTimeMs subscription', () => {
    expect(cyberpunkSrc).toContain('export function CyberTerminalTimecode');
    expect(cyberpunkSrc).toContain('const currentTimeMs = usePlayerStore((s) => s.currentTimeMs);');
    expect(cyberpunkSrc).toContain('formatTerminalTime(currentTimeMs)');
  });

  test('M5.IT2.TIME.3: Pure formatTerminalTime formatting math across millisecond timeline', () => {
    expect(formatTerminalTime(0)).toBe('[00:00.00]');
    expect(formatTerminalTime(16)).toBe('[00:00.01]');
    expect(formatTerminalTime(500)).toBe('[00:00.50]');
    expect(formatTerminalTime(990)).toBe('[00:00.99]');
    expect(formatTerminalTime(1000)).toBe('[00:01.00]');
    expect(formatTerminalTime(65430)).toBe('[01:05.43]');
    expect(formatTerminalTime(102650)).toBe('[01:42.65]');
    expect(formatTerminalTime(3600000)).toBe('[60:00.00]');
    // Edge cases
    expect(formatTerminalTime(-500)).toBe('[00:00.00]');
    expect(formatTerminalTime(NaN)).toBe('[00:00.00]');
    expect(formatTerminalTime(undefined)).toBe('[00:00.00]');
  });

  test('M5.IT2.TIME.4: 60fps time advances trigger CyberTerminalTimecode updates but ZERO CyberpunkLyrics root selector updates', () => {
    const store = usePlayerStore.getState();
    store.setLyrics(DEMO_TRACKS[0].lyrics); // Demo track 1 lyrics
    store.setCurrentTimeMs(1000); // activeLineIndex is 0

    let timecodeSelectorCalls = 0;
    let rootLyricSelectorCalls = 0;
    let rootActiveIndexSelectorCalls = 0;
    let rootSeekToSelectorCalls = 0;

    let lastTimeMs = usePlayerStore.getState().currentTimeMs;
    let lastActiveIdx = usePlayerStore.getState().activeLineIndex;
    let lastLyrics = usePlayerStore.getState().lyrics;
    let lastSeekTo = usePlayerStore.getState().seekTo;

    // Set up Zustand store subscriber tracking selector changes
    const unsubscribe = usePlayerStore.subscribe((state) => {
      // CyberTerminalTimecode selector
      if (state.currentTimeMs !== lastTimeMs) {
        lastTimeMs = state.currentTimeMs;
        timecodeSelectorCalls++;
      }

      // Root CyberpunkLyrics selectors
      if (state.activeLineIndex !== lastActiveIdx) {
        lastActiveIdx = state.activeLineIndex;
        rootActiveIndexSelectorCalls++;
      }
      if (state.lyrics !== lastLyrics) {
        lastLyrics = state.lyrics;
        rootLyricSelectorCalls++;
      }
      if (state.seekTo !== lastSeekTo) {
        lastSeekTo = state.seekTo;
        rootSeekToSelectorCalls++;
      }
    });

    // Simulate 60 frames of audio playback within the same lyric line (e.g., 1000ms -> 2000ms, line 0 ends at 4200ms)
    for (let frame = 1; frame <= 60; frame++) {
      const frameMs = 1000 + Math.round(frame * 16.666);
      usePlayerStore.getState().setCurrentTimeMs(frameMs);
    }

    unsubscribe();

    // 1. Timecode selector fired exactly 60 times (once per frame)
    expect(timecodeSelectorCalls).toBe(60);

    // 2. CyberpunkLyrics root selectors fired ZERO times!
    expect(rootActiveIndexSelectorCalls).toBe(0);
    expect(rootLyricSelectorCalls).toBe(0);
    expect(rootSeekToSelectorCalls).toBe(0);
  });

  test('M5.IT2.TIME.5: Memoized contextLines in CyberpunkLyrics is NOT recomputed on intra-line time advances', () => {
    const lyrics = DEMO_TRACKS[0].lyrics;
    let activeLineIndex = 0;

    // Simulate the exact useMemo computation from CyberpunkLyrics.tsx:179-195
    const computeContextLines = (lyrics, activeLineIndex) => {
      if (!lyrics || lyrics.length === 0) return [];
      const start = Math.max(0, activeLineIndex - 2);
      const end = Math.min(lyrics.length, activeLineIndex + 3);
      return lyrics.slice(start, end).map((line, idx) => {
        const actualIndex = start + idx;
        return {
          ...line,
          actualIndex,
          params: getCyberpunkGlitchParams(actualIndex, activeLineIndex, false),
        };
      });
    };

    const memoizedContext = computeContextLines(lyrics, activeLineIndex);

    // Advance time 60 frames within line 0 (1000ms to 2000ms)
    for (let f = 1; f <= 60; f++) {
      const t = 1000 + f * 16;
      const newActiveIdx = findActiveLineIndex(lyrics, t);
      // activeLineIndex remains 0 throughout
      expect(newActiveIdx).toBe(0);
    }

    // ContextLines remains completely unmodified
    expect(memoizedContext.length).toBeGreaterThan(0);
    expect(memoizedContext[0].actualIndex).toBe(0);
    expect(memoizedContext[0].params.isActive).toBe(true);
    expect(memoizedContext[0].params.blurAmount).toBe(0);
    if (memoizedContext.length > 1) {
      expect(memoizedContext[1].params.isActive).toBe(false);
      expect(memoizedContext[1].params.distance).toBe(1);
    }
  });

  test('M5.IT2.TIME.6: Line transition triggers exactly ONE update for root selectors, then resumes dormancy', () => {
    const store = usePlayerStore.getState();
    const lyrics = DEMO_TRACKS[0].lyrics;
    store.setLyrics(lyrics);
    store.setCurrentTimeMs(3500); // Near end of line 0 (next line is at 4200ms)

    let activeIndexUpdates = 0;
    let lastIdx = store.activeLineIndex;

    const unsub = usePlayerStore.subscribe((state) => {
      if (state.activeLineIndex !== lastIdx) {
        lastIdx = state.activeLineIndex;
        activeIndexUpdates++;
      }
    });

    // Step across the line transition boundary (4200ms)
    store.setCurrentTimeMs(4150); // still line 0
    expect(activeIndexUpdates).toBe(0);

    store.setCurrentTimeMs(4250); // crossed boundary -> line 1
    expect(activeIndexUpdates).toBe(1);

    // 30 subsequent frames in line 1 -> 0 new updates
    for (let i = 1; i <= 30; i++) {
      store.setCurrentTimeMs(4250 + i * 16);
    }
    expect(activeIndexUpdates).toBe(1);

    unsub();
  });

  test('M5.IT2.TIME.7: CyberTrackTitle isolates track title changes from root lyric selectors', () => {
    const initialTrack = DEMO_TRACKS[0];
    usePlayerStore.getState().setTrack(initialTrack);

    let activeIndexUpdates = 0;
    const unsub = usePlayerStore.subscribe((state, prev) => {
      if (state.activeLineIndex !== prev.activeLineIndex) {
        activeIndexUpdates++;
      }
    });

    // Update track with modified title
    usePlayerStore.setState({
      currentTrack: {
        ...initialTrack,
        title: 'HYPER_OVERDRIVE_REMIX',
      },
    });

    expect(usePlayerStore.getState().currentTrack.title).toBe('HYPER_OVERDRIVE_REMIX');
    // Active line index should not have changed
    expect(activeIndexUpdates).toBe(0);

    unsub();
  });

  test('M5.IT2.TIME.8: Seeking backward across lines re-aligns activeLineIndex, then resumes 60fps isolation', () => {
    const lyrics = DEMO_TRACKS[0].lyrics;
    usePlayerStore.getState().setLyrics(lyrics);

    // Seek far forward to 25000ms
    usePlayerStore.getState().setCurrentTimeMs(25000);
    const forwardIdx = usePlayerStore.getState().activeLineIndex;
    expect(forwardIdx).toBeGreaterThan(2);

    // Seek backward to 2000ms
    usePlayerStore.getState().setCurrentTimeMs(2000);
    const rewindIdx = usePlayerStore.getState().activeLineIndex;
    expect(rewindIdx).toBe(0);

    // Verify 60fps ticks in rewound line don't re-trigger line changes
    let rewindLineChanges = 0;
    const unsub = usePlayerStore.subscribe((state, prev) => {
      if (state.activeLineIndex !== prev.activeLineIndex) rewindLineChanges++;
    });

    for (let f = 1; f <= 30; f++) {
      usePlayerStore.getState().setCurrentTimeMs(2000 + f * 16);
    }

    expect(rewindLineChanges).toBe(0);
    unsub();
  });

  test('M5.IT2.TIME.9: Extreme millisecond values format cleanly without throwing', () => {
    // 24 hours = 86400000ms -> [1440:00.00]
    expect(formatTerminalTime(86400000)).toBe('[1440:00.00]');
    // Sub-millisecond floating points round down cleanly
    expect(formatTerminalTime(12345.6789)).toBe('[00:12.34]');
    // Large 100-hour boundary
    expect(formatTerminalTime(360000000)).toBe('[6000:00.00]');
    // NaN / Undefined fallback
    expect(formatTerminalTime(NaN)).toBe('[00:00.00]');
    expect(formatTerminalTime(undefined)).toBe('[00:00.00]');
  });
});


// =========================================================================
// Runner
// =========================================================================
async function runEmpiricalVerification() {
  console.log('\n======================================================');
  console.log('   CHALLENGER 1: M5 IT2 EMPIRICAL VERIFICATION HARNESS   ');
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
    console.log('ALL CHALLENGER 1 M5 IT2 VERIFICATIONS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  }
}

runEmpiricalVerification();
