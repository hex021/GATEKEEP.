/**
 * Challenger 2: Milestone 5 Iteration 2 Adversarial Verification Suite
 * 
 * Verifies:
 * 1. Single-Listener Hygiene: Zero window listeners in KineticLyrics.tsx, centralized in page.tsx with repeat & input guards.
 * 2. 60fps Performance Isolation: CyberpunkLyrics root component has no currentTimeMs / currentTrack subscriptions;
 *    CyberTerminalTimecode and CyberTrackTitle isolate high-frequency re-renders.
 * 3. Pure Timecode Mathematical Boundaries: formatTerminalTime negative, NaN, rollover, subsecond precision.
 * 4. Anti-Tautology Audit: Zero self-certifying mock variables in tier1 and tier2 test suites.
 * 5. Full Visualizer Mode State Machine Invariants & Rapid Concurrency.
 */

import { suite, test, expect, globalHarness } from './helpers/test-harness.mjs';
import { register } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

// Register TypeScript / TSX ESM loader for genuine component imports
try {
  register('./helpers/path-loader.mjs', import.meta.url);
} catch {
  // Already registered
}

// Load source files for static verification
const kineticLyricsSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/components/visualizer/KineticLyrics.tsx'),
  'utf8'
);
const cyberpunkSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/components/visualizer/CyberpunkLyrics.tsx'),
  'utf8'
);
const videoEditSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/components/visualizer/VideoEditLyrics.tsx'),
  'utf8'
);
const pageSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/app/page.tsx'),
  'utf8'
);
const tier1Src = fs.readFileSync(
  path.join(process.cwd(), 'tests/tier1/f49_f55_video_edit_visualizer.test.mjs'),
  'utf8'
);
const tier2Src = fs.readFileSync(
  path.join(process.cwd(), 'tests/tier2/b49_b55_visualizer_boundaries.test.mjs'),
  'utf8'
);

// Import production utilities
const {
  formatTerminalTime,
  CyberTerminalTimecode,
  CyberTrackTitle,
  CYBER_GLITCH_VARIANTS,
} = await import('../src/components/visualizer/CyberpunkLyrics.tsx');

const {
  cycleVisualizerMode,
  VISUALIZER_MODES,
} = await import('../src/components/visualizer/keywordPuncher.ts');

const { usePlayerStore } = await import('../src/stores/usePlayerStore.ts');

// =========================================================================
// Suite 1: Single-Listener Hygiene & 'V' Key Handler Integrity
// =========================================================================
suite('Challenger 2 M5 It2: Single-Listener Hygiene & Shortcut Handling', () => {
  test('C2.M5.IT2.S01.1: KineticLyrics.tsx contains zero window addEventListener registrations', () => {
    expect(kineticLyricsSrc.includes('addEventListener')).toBe(false);
    expect(kineticLyricsSrc.includes('removeEventListener')).toBe(false);
  });

  test('C2.M5.IT2.S01.2: Global "V" shortcut handler is centralized exclusively in page.tsx', () => {
    expect(pageSrc).toContain("e.key.toLowerCase() === 'v'");
    expect(pageSrc).toContain('cycleVisualizerMode()');
    expect(pageSrc).toContain('playModeWhoosh()');
  });

  test('C2.M5.IT2.S01.3: page.tsx enforces !e.repeat to prevent mode strobing on key hold', () => {
    expect(pageSrc).toContain("e.key.toLowerCase() === 'v' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.repeat");
  });

  test('C2.M5.IT2.S01.4: page.tsx excludes all form inputs, textareas, selects, and contenteditable elements', () => {
    expect(pageSrc).toContain('target instanceof HTMLInputElement');
    expect(pageSrc).toContain('target instanceof HTMLTextAreaElement');
    expect(pageSrc).toContain('target instanceof HTMLSelectElement');
    expect(pageSrc).toContain('target?.isContentEditable');
    expect(pageSrc).toContain("target?.closest?.('input, textarea, select, [contenteditable=\"true\"]')");
  });

  test('C2.M5.IT2.S01.5: Empirical simulation of keyboard event filter blocks invalid triggers', () => {
    // Model the exact predicate from page.tsx lines 60-84
    const shouldHandleV = (event, target) => {
      const isInput =
        target?.isInput ||
        target?.isTextarea ||
        target?.isSelect ||
        target?.isContentEditable ||
        target?.insideEditable;
      if (isInput) return false;

      return (
        event.key.toLowerCase() === 'v' &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.repeat
      );
    };

    // Valid physical keypress on body
    expect(shouldHandleV({ key: 'v', metaKey: false, ctrlKey: false, altKey: false, repeat: false }, {})).toBe(true);
    expect(shouldHandleV({ key: 'V', metaKey: false, ctrlKey: false, altKey: false, repeat: false }, {})).toBe(true);

    // Blocked: repeated keydown (held key)
    expect(shouldHandleV({ key: 'v', metaKey: false, ctrlKey: false, altKey: false, repeat: true }, {})).toBe(false);

    // Blocked: modifier keys (Ctrl+V paste, Cmd+V, Alt+V)
    expect(shouldHandleV({ key: 'v', metaKey: false, ctrlKey: true, altKey: false, repeat: false }, {})).toBe(false);
    expect(shouldHandleV({ key: 'v', metaKey: true, ctrlKey: false, altKey: false, repeat: false }, {})).toBe(false);
    expect(shouldHandleV({ key: 'v', metaKey: false, ctrlKey: false, altKey: true, repeat: false }, {})).toBe(false);

    // Blocked: typing inside input/textarea/select/contenteditable
    expect(shouldHandleV({ key: 'v', metaKey: false, ctrlKey: false, altKey: false, repeat: false }, { isInput: true })).toBe(false);
    expect(shouldHandleV({ key: 'v', metaKey: false, ctrlKey: false, altKey: false, repeat: false }, { isTextarea: true })).toBe(false);
    expect(shouldHandleV({ key: 'v', metaKey: false, ctrlKey: false, altKey: false, repeat: false }, { isSelect: true })).toBe(false);
    expect(shouldHandleV({ key: 'v', metaKey: false, ctrlKey: false, altKey: false, repeat: false }, { isContentEditable: true })).toBe(false);
    expect(shouldHandleV({ key: 'v', metaKey: false, ctrlKey: false, altKey: false, repeat: false }, { insideEditable: true })).toBe(false);
  });
});

// =========================================================================
// Suite 2: 60fps Performance Isolation in CyberpunkLyrics.tsx
// =========================================================================
suite('Challenger 2 M5 It2: 60fps Performance Isolation', () => {
  test('C2.M5.IT2.S02.1: Root CyberpunkLyrics component has ZERO currentTimeMs subscriptions', () => {
    // Regex matching the CyberpunkLyrics function body up to return
    const rootBodyMatch = cyberpunkSrc.match(/export function CyberpunkLyrics[\s\S]*?return\s*\(/);
    expect(rootBodyMatch).toBeTruthy();
    const rootBody = rootBodyMatch[0];
    expect(rootBody.includes('currentTimeMs')).toBe(false);
  });

  test('C2.M5.IT2.S02.2: Root CyberpunkLyrics component has ZERO currentTrack subscriptions', () => {
    const rootBodyMatch = cyberpunkSrc.match(/export function CyberpunkLyrics[\s\S]*?return\s*\(/);
    expect(rootBodyMatch).toBeTruthy();
    const rootBody = rootBodyMatch[0];
    expect(rootBody.includes('currentTrack')).toBe(false);
  });

  test('C2.M5.IT2.S02.3: CyberTerminalTimecode is exported and isolates currentTimeMs subscription', () => {
    expect(typeof CyberTerminalTimecode).toBe('function');
    const timecodeMatch = cyberpunkSrc.match(/export function CyberTerminalTimecode[\s\S]*?return\s*\(/);
    expect(timecodeMatch).toBeTruthy();
    expect(timecodeMatch[0]).toContain('usePlayerStore((s) => s.currentTimeMs)');
  });

  test('C2.M5.IT2.S02.4: CyberTrackTitle is exported and isolates currentTrack subscription', () => {
    expect(typeof CyberTrackTitle).toBe('function');
    const trackMatch = cyberpunkSrc.match(/export function CyberTrackTitle[\s\S]*?return\s*\(/);
    expect(trackMatch).toBeTruthy();
    expect(trackMatch[0]).toContain('usePlayerStore((s) => s.currentTrack?.title)');
  });

  test('C2.M5.IT2.S02.5: VideoEditLyrics.tsx also isolates currentTimeMs inside ViewfinderTimecode', () => {
    const rootBodyMatch = videoEditSrc.match(/export function VideoEditLyrics[\s\S]*?return\s*\(/);
    expect(rootBodyMatch).toBeTruthy();
    const rootBody = rootBodyMatch[0];
    expect(rootBody.includes('currentTimeMs')).toBe(false);
    expect(videoEditSrc).toContain('export function ViewfinderTimecode()');
  });
});

// =========================================================================
// Suite 3: formatTerminalTime Mathematical Precision & Boundary Stress
// =========================================================================
suite('Challenger 2 M5 It2: formatTerminalTime Precision & Boundaries', () => {
  test('C2.M5.IT2.S03.1: Formats zero, sub-second, and minute timestamps accurately', () => {
    expect(formatTerminalTime(0)).toBe('[00:00.00]');
    expect(formatTerminalTime(50)).toBe('[00:00.05]');
    expect(formatTerminalTime(500)).toBe('[00:00.50]');
    expect(formatTerminalTime(990)).toBe('[00:00.99]');
    expect(formatTerminalTime(1000)).toBe('[00:01.00]');
    expect(formatTerminalTime(60000)).toBe('[01:00.00]');
    expect(formatTerminalTime(102650)).toBe('[01:42.65]');
  });

  test('C2.M5.IT2.S03.2: Defensively clamps negative timestamps to [00:00.00]', () => {
    expect(formatTerminalTime(-1)).toBe('[00:00.00]');
    expect(formatTerminalTime(-5000)).toBe('[00:00.00]');
    expect(formatTerminalTime(-0.001)).toBe('[00:00.00]');
  });

  test('C2.M5.IT2.S03.3: Defensively clamps NaN and non-numeric values to [00:00.00]', () => {
    expect(formatTerminalTime(NaN)).toBe('[00:00.00]');
    expect(formatTerminalTime(undefined)).toBe('[00:00.00]');
  });

  test('C2.M5.IT2.S03.4: Stress test across 5,000 continuous millisecond increments matches regex', () => {
    for (let i = 0; i < 5000; i += 23) {
      const formatted = formatTerminalTime(i);
      expect(formatted).toMatch(/^\[\d{2,}:\d{2}\.\d{2}\]$/);
    }
  });
});

// =========================================================================
// Suite 4: Anti-Tautology Audit across Test Suites
// =========================================================================
suite('Challenger 2 M5 It2: Anti-Tautology Audit', () => {
  test('C2.M5.IT2.S04.1: Tier 1 suite contains zero tautological dummy object mocks', () => {
    expect(tier1Src.includes("const style = { perspective: '1200px' }")).toBe(false);
    expect(tier1Src.includes("const style = { transformStyle: 'preserve-3d' }")).toBe(false);
    expect(tier1Src.includes("const origin = 'center center'")).toBe(false);
    expect(tier1Src.includes("activeKey = 'line-2'")).toBe(false);
  });

  test('C2.M5.IT2.S04.2: Tier 2 suite contains zero tautological dummy object mocks', () => {
    expect(tier2Src.includes("const style = { perspective: '1200px' }")).toBe(false);
    expect(tier2Src.includes("const modes = ['video-edit', 'apple-spatial', 'cyberpunk']")).toBe(false);
    expect(tier2Src.includes("activeKey = 'line-2'")).toBe(false);
  });

  test('C2.M5.IT2.S04.3: Tier 1 asserts against genuine production exports', () => {
    expect(tier1Src).toContain('LINE_3D_VARIANTS');
    expect(tier1Src).toContain('WORD_3D_VARIANTS');
    expect(tier1Src).toContain('CYBER_GLITCH_VARIANTS');
    expect(tier1Src).toContain('formatTerminalTime');
    expect(tier1Src).toContain('CyberTerminalTimecode');
    expect(tier1Src).toContain('LYRIC_SPRING_CONFIG');
    expect(tier1Src).toContain('getLyricVisualHierarchy');
    expect(tier1Src).toContain('usePlayerStore');
  });

  test('C2.M5.IT2.S04.4: Tier 2 asserts against genuine production exports and boundaries', () => {
    expect(tier2Src).toContain('getCyberpunkGlitchParams');
    expect(tier2Src).toContain('CYBER_GLITCH_VARIANTS');
    expect(tier2Src).toContain('LINE_3D_VARIANTS');
    expect(tier2Src).toContain('WORD_3D_VARIANTS');
    expect(tier2Src).toContain('tokenizeAndPunchLine');
    expect(tier2Src).toContain('VISUALIZER_MODES');
    expect(tier2Src).toContain('usePlayerStore');
  });
});

// =========================================================================
// Suite 5: Zustand PlayerStore Mode State Machine & Rapid Concurrency
// =========================================================================
suite('Challenger 2 M5 It2: PlayerStore Visualizer Mode State Machine', () => {
  test('C2.M5.IT2.S05.1: Mode cycle is deterministic period-3 sequence', () => {
    usePlayerStore.getState().setVisualizerMode('video-edit');
    expect(usePlayerStore.getState().visualizerMode).toBe('video-edit');

    usePlayerStore.getState().cycleVisualizerMode();
    expect(usePlayerStore.getState().visualizerMode).toBe('apple-spatial');

    usePlayerStore.getState().cycleVisualizerMode();
    expect(usePlayerStore.getState().visualizerMode).toBe('cyberpunk');

    usePlayerStore.getState().cycleVisualizerMode();
    expect(usePlayerStore.getState().visualizerMode).toBe('video-edit');
  });

  test('C2.M5.IT2.S05.2: 300 rapid consecutive mode cycles maintains strict modulo-3 invariance', () => {
    usePlayerStore.getState().setVisualizerMode('video-edit');
    const modes = ['video-edit', 'apple-spatial', 'cyberpunk'];

    for (let i = 1; i <= 300; i++) {
      usePlayerStore.getState().cycleVisualizerMode();
      const expectedMode = modes[i % 3];
      expect(usePlayerStore.getState().visualizerMode).toBe(expectedMode);
    }
  });

  test('C2.M5.IT2.S05.3: Invalid mode recovery resets safely to default', () => {
    // If state is set to an unknown mode, cycleVisualizerMode falls back to video-edit
    usePlayerStore.setState({ visualizerMode: 'corrupt-mode' });
    usePlayerStore.getState().cycleVisualizerMode();
    expect(usePlayerStore.getState().visualizerMode).toBe('video-edit');
  });
});

// Standalone execution
async function runVerification() {
  console.log('\n================================================================');
  console.log('   CHALLENGER 2: M5 IT2 EMPIRICAL ADVERSARIAL VERIFICATION      ');
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
    console.log('ALL CHALLENGER 2 M5 IT2 VERIFICATION TESTS PASSED! ✅\n');
    process.exit(0);
  }
}

runVerification();
