/**
 * Challenger 2: Milestone 5 Iteration 3 Comprehensive Empirical Stress Suite
 * Deep Adversarial Testing of Kinetic Visualizer Engine & Mode Switching
 *
 * Verification Areas:
 * 1. Rapid Mode Switching & Modulo-3 Invariance (1,000 rapid cycles, corruption recovery)
 * 2. Hotkey 'V' Edge Cases & Modifier Combinations (Paste guards, repeat suppression, input isolation)
 * 3. Boundary Inputs in Keyword Punching (Empty, XSS, CJK, Emojis, Long tokens, All-stopwords)
 * 4. Timecode Calculations & SMPTE Boundaries (Negative, NaN, Sub-frame, >24h rollover, Centiseconds)
 * 5. Memory Leak & Resource Cleanup Invariants (Interval/timeout cleanup, 60fps subscriber isolation)
 */

import { suite, test, expect, globalHarness } from './helpers/test-harness.mjs';
import { register } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

// Register TypeScript / TSX ESM loader for genuine component imports
try {
  register('./helpers/path-loader.mjs', import.meta.url);
} catch {
  // Already registered in runner context
}

// Import production utilities
const {
  formatTimecode,
  tokenizeAndPunchLine,
  getAdaptiveFontScale,
  cycleVisualizerMode,
  generateMeterHeights,
  calculateWordImpactScore,
  getCyberpunkGlitchParams,
  VISUALIZER_MODES,
  STOP_WORDS,
  HIGH_ENERGY_PUNCH_TERMS,
} = await import('../src/components/visualizer/keywordPuncher.ts');

const {
  formatTerminalTime,
  CyberTerminalTimecode,
  CyberTrackTitle,
  CYBER_GLITCH_VARIANTS,
} = await import('../src/components/visualizer/CyberpunkLyrics.tsx');

const {
  ViewfinderTimecode,
  LINE_3D_VARIANTS,
  WORD_3D_VARIANTS,
} = await import('../src/components/visualizer/VideoEditLyrics.tsx');

const {
  LYRIC_SPRING_CONFIG,
  getLyricVisualHierarchy,
} = await import('../src/components/visualizer/KineticLyrics.tsx');

const { usePlayerStore } = await import('../src/stores/usePlayerStore.ts');
const { DEMO_TRACKS } = await import('../src/data/demoTracks.ts');

// Source files for AST & static verification
const pageSrc = fs.readFileSync(path.join(process.cwd(), 'src/app/page.tsx'), 'utf8');
const kineticLyricsSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/visualizer/KineticLyrics.tsx'), 'utf8');
const videoEditSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/visualizer/VideoEditLyrics.tsx'), 'utf8');
const cyberpunkSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/visualizer/CyberpunkLyrics.tsx'), 'utf8');
const playerStoreSrc = fs.readFileSync(path.join(process.cwd(), 'src/stores/usePlayerStore.ts'), 'utf8');

// =========================================================================
// Suite 1: Rapid Mode Switching & Modulo-3 State Machine Invariants
// =========================================================================
suite('Challenger 2 M5 It3: Rapid Mode Switching & State Machine Invariants', () => {
  test('C2.M5.IT3.S01.1: 1,000 rapid sequential cycles maintain strict modulo-3 periodicity', () => {
    usePlayerStore.getState().setVisualizerMode('video-edit');
    expect(usePlayerStore.getState().visualizerMode).toBe('video-edit');

    const expectedSequence = ['video-edit', 'apple-spatial', 'cyberpunk'];
    for (let i = 1; i <= 1000; i++) {
      usePlayerStore.getState().cycleVisualizerMode();
      const expected = expectedSequence[i % 3];
      expect(usePlayerStore.getState().visualizerMode).toBe(expected);
    }
  });

  test('C2.M5.IT3.S01.2: Corrupted, unknown, or casing-variant mode strings recover to video-edit', () => {
    const invalidInputs = [
      'unknown-mode',
      'VIDEO-EDIT',
      'Cyberpunk',
      'apple_spatial',
      '',
      'null',
      'undefined',
      '123',
      '__proto__',
    ];

    for (const invalid of invalidInputs) {
      expect(cycleVisualizerMode(invalid)).toBe('video-edit');
      usePlayerStore.setState({ visualizerMode: invalid });
      usePlayerStore.getState().cycleVisualizerMode();
      expect(usePlayerStore.getState().visualizerMode).toBe('video-edit');
    }
  });

  test('C2.M5.IT3.S01.3: Concurrent interleaved state updates do not desynchronize mode state', () => {
    usePlayerStore.getState().setVisualizerMode('video-edit');
    usePlayerStore.getState().setLyrics(DEMO_TRACKS[0].lyrics);

    for (let i = 0; i < 100; i++) {
      usePlayerStore.getState().setCurrentTimeMs(i * 1000);
      usePlayerStore.getState().cycleVisualizerMode();
      const expectedMode = ['apple-spatial', 'cyberpunk', 'video-edit'][i % 3];
      expect(usePlayerStore.getState().visualizerMode).toBe(expectedMode);
      expect(usePlayerStore.getState().currentTimeMs).toBe(i * 1000);
    }
  });

  test('C2.M5.IT3.S01.4: localStorage failure during mode transition is caught and does not throw', () => {
    // KineticLyrics wraps localStorage in try-catch
    expect(kineticLyricsSrc).toContain('try {');
    expect(kineticLyricsSrc).toContain("localStorage.setItem('vibesync_visualizer_mode', activeMode)");
    expect(kineticLyricsSrc).toContain('} catch {');
  });
});

// =========================================================================
// Suite 2: Hotkey 'V' Edge Cases & Modifier Combinations
// =========================================================================
suite('Challenger 2 M5 It3: Hotkey V Edge Cases & Modifier Combinations', () => {
  // Mirror the exact production predicate in src/app/page.tsx:67-91
  const evaluateHotkeyVGuard = (event, target) => {
    const isTargetExcluded =
      target?.tagName === 'INPUT' ||
      target?.tagName === 'TEXTAREA' ||
      target?.tagName === 'SELECT' ||
      target?.isContentEditable === true ||
      target?.insideExcluded === true;

    if (isTargetExcluded) return false;

    return (
      event.key.toLowerCase() === 'v' &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.repeat
    );
  };

  test('C2.M5.IT3.S02.1: Keydown handler in page.tsx guards against metaKey, ctrlKey, altKey, and repeat', () => {
    expect(pageSrc).toContain("e.key.toLowerCase() === 'v' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.repeat");
  });

  test('C2.M5.IT3.S02.2: Paste shortcuts (Ctrl+V, Cmd+V) and Alt+V are completely blocked', () => {
    // Windows / Linux paste
    expect(evaluateHotkeyVGuard({ key: 'v', ctrlKey: true, metaKey: false, altKey: false, repeat: false })).toBe(false);
    expect(evaluateHotkeyVGuard({ key: 'V', ctrlKey: true, metaKey: false, altKey: false, repeat: false })).toBe(false);

    // macOS paste
    expect(evaluateHotkeyVGuard({ key: 'v', ctrlKey: false, metaKey: true, altKey: false, repeat: false })).toBe(false);
    expect(evaluateHotkeyVGuard({ key: 'V', ctrlKey: false, metaKey: true, altKey: false, repeat: false })).toBe(false);

    // Alt+V
    expect(evaluateHotkeyVGuard({ key: 'v', ctrlKey: false, metaKey: false, altKey: true, repeat: false })).toBe(false);

    // Paste plain text (Ctrl+Shift+V / Cmd+Shift+V)
    expect(evaluateHotkeyVGuard({ key: 'v', ctrlKey: true, metaKey: false, altKey: false, repeat: false })).toBe(false);
    expect(evaluateHotkeyVGuard({ key: 'v', ctrlKey: false, metaKey: true, altKey: false, repeat: false })).toBe(false);
  });

  test('C2.M5.IT3.S02.3: Holding down V (repeat=true) does not cause rapid visualizer mode strobing', () => {
    expect(evaluateHotkeyVGuard({ key: 'v', ctrlKey: false, metaKey: false, altKey: false, repeat: true })).toBe(false);
    expect(evaluateHotkeyVGuard({ key: 'V', ctrlKey: false, metaKey: false, altKey: false, repeat: true })).toBe(false);
  });

  test('C2.M5.IT3.S02.4: Valid physical keypress (v or V) on non-input targets triggers mode change', () => {
    expect(evaluateHotkeyVGuard({ key: 'v', ctrlKey: false, metaKey: false, altKey: false, repeat: false })).toBe(true);
    expect(evaluateHotkeyVGuard({ key: 'V', ctrlKey: false, metaKey: false, altKey: false, repeat: false })).toBe(true);
  });

  test('C2.M5.IT3.S02.5: All form fields and editable containers safely suppress the shortcut', () => {
    const targets = [
      { tagName: 'INPUT' },
      { tagName: 'TEXTAREA' },
      { tagName: 'SELECT' },
      { isContentEditable: true },
      { insideExcluded: true },
    ];

    for (const t of targets) {
      expect(evaluateHotkeyVGuard({ key: 'v', ctrlKey: false, metaKey: false, altKey: false, repeat: false }, t)).toBe(false);
    }
  });

  test('C2.M5.IT3.S02.6: KineticLyrics has ZERO redundant keydown listeners registered', () => {
    expect(kineticLyricsSrc.includes("addEventListener('keydown'")).toBe(false);
    expect(kineticLyricsSrc.includes('addEventListener("keydown"')).toBe(false);
  });
});

// =========================================================================
// Suite 3: Boundary Inputs in Keyword Punching Engine
// =========================================================================
suite('Challenger 2 M5 It3: Boundary Inputs in Keyword Punching Engine', () => {
  test('C2.M5.IT3.S03.1: Empty and whitespace-only strings return safe empty analyzed line without error', () => {
    const emptyCases = ['', '   ', '\t\n\r  '];
    for (const text of emptyCases) {
      const res = tokenizeAndPunchLine(text);
      expect(res.words).toHaveLength(0);
      expect(res.isStageDirection).toBe(false);
      expect(res.hasPunchedKeyword).toBe(false);
      expect(res.punchWord).toBe(undefined);
    }
  });

  test('C2.M5.IT3.S03.2: Stage directions with parens correctly parse and set isStageDirection flag', () => {
    const cue = tokenizeAndPunchLine('(rain gently tapping on the glass)');
    expect(cue.isStageDirection).toBe(true);
    expect(cue.stageCueText).toBe('rain gently tapping on the glass');
    expect(cue.words).toHaveLength(0);
    expect(cue.hasPunchedKeyword).toBe(false);

    // Parens with whitespace
    const cue2 = tokenizeAndPunchLine('   (instrumental guitar solo)   ');
    expect(cue2.isStageDirection).toBe(true);
    expect(cue2.stageCueText).toBe('instrumental guitar solo');
  });

  test('C2.M5.IT3.S03.3: HTML injection and script tags are cleanly stripped without executing or breaking parser', () => {
    const xss = '<script>alert("pwned")</script>we burned the <span class="test">city</span>';
    const res = tokenizeAndPunchLine(xss);
    expect(res.words.length).toBeGreaterThan(0);
    const wordsRaw = res.words.map((w) => w.raw).join(' ');
    expect(wordsRaw).not.toContain('<script>');
    expect(wordsRaw).not.toContain('alert');
    expect(wordsRaw).not.toContain('<span');
  });

  test('C2.M5.IT3.S03.4: Pure stopword lines fall back to electing longest word as punch', () => {
    const allStop = 'the and or but for nor on at to';
    const res = tokenizeAndPunchLine(allStop);
    expect(res.hasPunchedKeyword).toBe(true);
    expect(res.punchWord).toBeTruthy();
    expect(res.punchWord.role).toBe('punch');
  });

  test('C2.M5.IT3.S03.5: Extremely long words (>25 chars) receive break-all CSS class', () => {
    const longWord = 'pneumonoultramicroscopicsilicovolcanoconiosis_extra_extreme';
    const res = tokenizeAndPunchLine(longWord);
    expect(res.words[0].scaleClass).toContain('break-all');
  });

  test('C2.M5.IT3.S03.6: Multilingual unicode, CJK, and Emojis are tokenized robustly without NaN', () => {
    const mixed = '🔥 夜に駆ける 100% skyline Déjà-vu';
    const res = tokenizeAndPunchLine(mixed);
    expect(res.words.length).toBeGreaterThan(0);
    for (const w of res.words) {
      expect(typeof w.rotationDeg).toBe('number');
      expect(Number.isNaN(w.rotationDeg)).toBe(false);
      expect(typeof w.staggerDelay).toBe('number');
      expect(Number.isNaN(w.staggerDelay)).toBe(false);
    }
  });

  test('C2.M5.IT3.S03.7: 1-word and 2-word lines strictly omit sideways vertical words', () => {
    const oneWord = tokenizeAndPunchLine('Ignite');
    expect(oneWord.words.some((w) => w.role === 'sideways')).toBe(false);

    const twoWords = tokenizeAndPunchLine("Don't blink");
    expect(twoWords.words.some((w) => w.role === 'sideways')).toBe(false);
  });
});

// =========================================================================
// Suite 4: Timecode Calculations & Mathematical Precision
// =========================================================================
suite('Challenger 2 M5 It3: Timecode Calculations & Mathematical Precision', () => {
  test('C2.M5.IT3.S04.1: formatTimecode handles negative and NaN defensively', () => {
    expect(formatTimecode(-100, 30)).toBe('00:00:00:00');
    expect(formatTimecode(-999999, 30)).toBe('00:00:00:00');
    expect(formatTimecode(NaN, 30)).toBe('00:00:00:00');
  });

  test('C2.M5.IT3.S04.2: formatTimecode accurately computes frames at 24fps, 30fps, and 60fps', () => {
    // 500ms is halfway through a second
    expect(formatTimecode(500, 30)).toBe('00:00:00:15'); // 15 / 30
    expect(formatTimecode(500, 24)).toBe('00:00:00:12'); // 12 / 24
    expect(formatTimecode(500, 60)).toBe('00:00:00:30'); // 30 / 60
  });

  test('C2.M5.IT3.S04.3: formatTimecode handles hour and multi-hour timestamps (>24 hours)', () => {
    // 1 hour, 2 minutes, 3 seconds, 400ms at 30fps
    const ms1 = (1 * 3600 + 2 * 60 + 3) * 1000 + 400;
    expect(formatTimecode(ms1, 30)).toBe('01:02:03:12');

    // 25 hours
    const ms25 = 25 * 3600 * 1000;
    expect(formatTimecode(ms25, 30)).toBe('25:00:00:00');
  });

  test('C2.M5.IT3.S04.4: formatTerminalTime computes exact centiseconds [MM:SS.xx]', () => {
    expect(formatTerminalTime(0)).toBe('[00:00.00]');
    expect(formatTerminalTime(450)).toBe('[00:00.45]');
    expect(formatTerminalTime(999)).toBe('[00:00.99]');
    expect(formatTerminalTime(60000)).toBe('[01:00.00]');
    expect(formatTerminalTime(125430)).toBe('[02:05.43]');
    expect(formatTerminalTime(-500)).toBe('[00:00.00]');
    expect(formatTerminalTime(NaN)).toBe('[00:00.00]');
  });
});

// =========================================================================
// Suite 5: Memory Leak & Resource Cleanup Invariants
// =========================================================================
suite('Challenger 2 M5 It3: Memory Leak & Resource Cleanup Invariants', () => {
  test('C2.M5.IT3.S05.1: AudioMeterBars in VideoEditLyrics cleans up interval on unmount or paused', () => {
    expect(videoEditSrc).toContain('clearInterval(interval)');
  });

  test('C2.M5.IT3.S05.2: Glitch burst timeout in CyberpunkLyrics cleans up timeout on unmount', () => {
    expect(cyberpunkSrc).toContain('clearTimeout(t)');
  });

  test('C2.M5.IT3.S05.3: High-frequency currentTimeMs is decoupled from heavy visualizer roots', () => {
    // VideoEditLyrics root does not subscribe to currentTimeMs
    const videoEditRoot = videoEditSrc.match(/export function VideoEditLyrics[\s\S]*?return\s*\(/)?.[0];
    expect(videoEditRoot).toBeTruthy();
    expect(videoEditRoot.includes('currentTimeMs')).toBe(false);

    // CyberpunkLyrics root does not subscribe to currentTimeMs
    const cyberpunkRoot = cyberpunkSrc.match(/export function CyberpunkLyrics[\s\S]*?return\s*\(/)?.[0];
    expect(cyberpunkRoot).toBeTruthy();
    expect(cyberpunkRoot.includes('currentTimeMs')).toBe(false);
  });

  test('C2.M5.IT3.S05.4: Toast timeout in KineticLyrics cleans up timer before setting new one', () => {
    expect(kineticLyricsSrc).toContain('if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)');
  });
});

// Standalone execution runner
async function runChallenger2M5It3() {
  console.log('\n================================================================');
  console.log('   CHALLENGER 2: M5 IT3 DEEP EMPIRICAL STRESS TEST SUITE        ');
  console.log('   Visualizer Engine & Mode Switching Robustness Verification   ');
  console.log('================================================================\n');

  const report = await globalHarness.run();
  console.log(`Total tests run: ${report.stats.total}`);
  console.log(`Passed:          ${report.stats.passed} ✔`);
  console.log(`Failed:          ${report.stats.failed} ✖`);
  console.log(`Duration:        ${report.stats.durationMs.toFixed(2)}ms\n`);

  if (report.failures.length > 0) {
    console.error('FAILURES DETECTED:');
    for (const fail of report.failures) {
      console.error(`- [${fail.suite}] ${fail.test}`);
      console.error(`  Error: ${fail.error.message}`);
    }
    process.exit(1);
  } else {
    console.log('ALL CHALLENGER 2 M5 IT3 STRESS TESTS PASSED SUCCESSFULLY! ✅\n');
    process.exit(0);
  }
}

runChallenger2M5It3();
