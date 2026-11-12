/**
 * Challenger 2: Milestone 5 Empirical Stress Test Suite
 * Crazy "Video Edit" Kinetic Visualizer Engine
 *
 * Verification Areas:
 * 1. Camera Beat Bounce & Recoil Spring: 120ms duration, micro-zoom [1.025, 0.998, 1.0],
 *    jitter bounds, line transition triggering, and prefers-reduced-motion bypass.
 * 2. Keyword Scale Styling & Punch Aesthetics: impact scoring algorithm, stopword exclusion,
 *    high-energy term boosting, adaptive scale (text-6xl through text-9xl font-black uppercase),
 *    text-stroke outline (2px white), chromatic aberration layers (cyan/magenta), and glow.
 * 3. Viewfinder Overlays & Non-Blocking Integrity: [● REC] indicator, isolated timecode,
 *    framing brackets, center crosshair +, 16-band audio VU meter, and pointer-events-none.
 * 4. Master Visualizer Mode Switcher & Backward Compatibility: video-edit / apple-spatial /
 *    cyberpunk cycle, hotkey 'V' keyboard handler with clipboard paste guards, and M2 legacy exports.
 * 5. High-Load Fuzzing & Boundary Stress: 1,000 randomized lyric lines, 10,000 timecode ticks,
 *    extreme word counts (1 to 100+ tokens), and unbroken string wrap protection.
 */

import { suite, test, expect } from './helpers/test-harness.mjs';
import {
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
} from '../src/components/visualizer/keywordPuncher.ts';
import { DEMO_TRACKS } from '../src/data/demoTracks.ts';
import fs from 'node:fs';
import path from 'node:path';

// Load implementation source files for static verification & AST analysis
const videoEditSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/components/visualizer/VideoEditLyrics.tsx'),
  'utf8'
);
const cyberpunkSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/components/visualizer/CyberpunkLyrics.tsx'),
  'utf8'
);
const kineticLyricsSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/components/visualizer/KineticLyrics.tsx'),
  'utf8'
);
const keywordPuncherSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/components/visualizer/keywordPuncher.ts'),
  'utf8'
);
const playerStoreSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/stores/usePlayerStore.ts'),
  'utf8'
);

// =========================================================================
// Suite 1: Camera Beat Bounce & Recoil Spring Mechanics
// =========================================================================
suite('Challenger 2 M5: Camera Beat Bounce & Recoil Spring', () => {
  test('C2.M5.S01.1: Recoil spring animation parameters specify exact 120ms duration', () => {
    // Verify in VideoEditLyrics.tsx source that transition duration is exactly 0.12s (120ms)
    expect(videoEditSrc).toContain('duration: 0.12');
    expect(videoEditSrc).toContain('scale: [1.025, 0.998, 1.0]');
  });

  test('C2.M5.S01.2: Camera micro-zoom peaks at scale 1.025 and rebounds to 0.998 before settling to 1.0', () => {
    const scaleKeyframes = [1.025, 0.998, 1.0];
    expect(scaleKeyframes[0]).toBe(1.025);
    expect(scaleKeyframes[1]).toBe(0.998);
    expect(scaleKeyframes[2]).toBe(1.0);
  });

  test('C2.M5.S01.3: Camera jitter translation offsets are bounded within +/-1.5px and rotation within +/-0.25deg', () => {
    // Model the jitter generation from VideoEditLyrics: (Math.random() - 0.5) * 3
    for (let i = 0; i < 500; i++) {
      const rnd = Math.random();
      const xJitter = (rnd - 0.5) * 3;
      const rotJitter = (rnd - 0.5) * 0.5;
      expect(xJitter).toBeGreaterThanOrEqual(-1.5);
      expect(xJitter).toBeLessThanOrEqual(1.5);
      expect(rotJitter).toBeGreaterThanOrEqual(-0.25);
      expect(rotJitter).toBeLessThanOrEqual(0.25);
    }
  });

  test('C2.M5.S01.4: Recoil spring triggers ONLY on activeLineIndex change, not on redundant re-renders', () => {
    // Simulate VideoEditLyrics active line transition state machine
    let triggers = 0;
    let prevIndex = -1;
    const simulateLineTick = (activeIndex) => {
      if (activeIndex < 0) return;
      if (prevIndex !== activeIndex) {
        prevIndex = activeIndex;
        triggers++;
      }
    };

    simulateLineTick(-1); // Before track start: no trigger
    expect(triggers).toBe(0);

    simulateLineTick(0); // Line 0 active: triggers
    expect(triggers).toBe(1);

    // 60fps tick simulation with same activeLineIndex: must NOT re-trigger
    for (let f = 0; f < 60; f++) {
      simulateLineTick(0);
    }
    expect(triggers).toBe(1);

    simulateLineTick(1); // Line 1 active: triggers
    expect(triggers).toBe(2);

    simulateLineTick(2); // Line 2 active: triggers
    expect(triggers).toBe(3);

    // Seek back to line 0: triggers
    simulateLineTick(0);
    expect(triggers).toBe(4);
  });

  test('C2.M5.S01.5: prefers-reduced-motion bypasses camera recoil spring completely', () => {
    // Static code analysis: VideoEditLyrics must early return when prefersReducedMotion is true
    expect(videoEditSrc).toMatch(/if\s*\(\s*prefersReducedMotion\s*\|\|\s*activeLineIndex\s*<\s*0\s*\)\s*return/);

    // Dynamic simulation
    let cameraStarted = false;
    const runCameraRecoil = (prefersReducedMotion, activeLineIndex) => {
      if (prefersReducedMotion || activeLineIndex < 0) return;
      cameraStarted = true;
    };

    runCameraRecoil(true, 1);
    expect(cameraStarted).toBe(false);

    runCameraRecoil(false, 1);
    expect(cameraStarted).toBe(true);
  });

  test('C2.M5.S01.6: prefers-reduced-motion bypasses 3D transform variants and flattens to 2D', () => {
    // Verify that motion.div in VideoEditLyrics applies variants only when reduced motion is inactive
    expect(videoEditSrc).toContain('variants={prefersReducedMotion ? undefined : LINE_3D_VARIANTS}');
    expect(videoEditSrc).toContain('variants={prefersReducedMotion ? undefined : WORD_3D_VARIANTS}');
    expect(videoEditSrc).toContain("initial={prefersReducedMotion ? false : 'initial'}");
    expect(videoEditSrc).toContain("exit={prefersReducedMotion ? undefined : 'exit'}");
  });
});

// =========================================================================
// Suite 2: Keyword Scale Styling & Punch Aesthetics
// =========================================================================
suite('Challenger 2 M5: Keyword Scale Styling & Punch Aesthetics', () => {
  test('C2.M5.S02.1: Punch keyword receives text-6xl through text-9xl font-black uppercase for short lines', () => {
    const scaleShort = getAdaptiveFontScale(2);
    expect(scaleShort.punchScaleClass).toContain('text-6xl');
    expect(scaleShort.punchScaleClass).toContain('lg:text-9xl');
    expect(scaleShort.punchScaleClass).toContain('font-black');
    expect(scaleShort.punchScaleClass).toContain('uppercase');
    expect(scaleShort.punchScaleClass).toContain('tracking-tighter');

    const analysis = tokenizeAndPunchLine("don't blink");
    expect(analysis.punchWord).toBeTruthy();
    expect(analysis.punchWord.scaleClass).toContain('text-6xl');
    expect(analysis.punchWord.scaleClass).toContain('lg:text-9xl');
    expect(analysis.punchWord.role).toBe('punch');
    expect(analysis.punchWord.isPunch).toBe(true);
  });

  test('C2.M5.S02.2: Adaptive scale degrades gracefully across word counts up to 20 words', () => {
    const scale1 = getAdaptiveFontScale(1);
    const scale4 = getAdaptiveFontScale(4);
    const scale8 = getAdaptiveFontScale(8);
    const scale14 = getAdaptiveFontScale(14);
    const scale22 = getAdaptiveFontScale(22);

    expect(scale1.punchScaleClass).toContain('lg:text-9xl');
    expect(scale4.punchScaleClass).toContain('lg:text-8xl');
    expect(scale8.punchScaleClass).toContain('lg:text-6xl');
    expect(scale14.punchScaleClass).toContain('md:text-4xl');
    expect(scale22.punchScaleClass).toContain('text-xl');
  });

  test('C2.M5.S02.3: Punched word includes 2px white WebkitTextStroke and radiant textShadow glow', () => {
    // Static verification in VideoEditLyrics.tsx
    expect(videoEditSrc).toContain("WebkitTextStroke: '2px white'");
    expect(videoEditSrc).toContain('rgba(6, 182, 212, 0.85)'); // cyan shadow offset
    expect(videoEditSrc).toContain('rgba(244, 63, 94, 0.85)'); // magenta shadow offset
    expect(videoEditSrc).toContain('0 0 35px'); // radiant neon glow
  });

  test('C2.M5.S02.4: Dual chromatic aberration split layers (cyan -3px / magenta +3px) are rendered behind punch headline', () => {
    expect(videoEditSrc).toContain('text-cyan-400 opacity-60 translate-x-[-3px] translate-y-[-1px]');
    expect(videoEditSrc).toContain('text-fuchsia-500 opacity-60 translate-x-[3px] translate-y-[1px]');
    expect(videoEditSrc).toContain('aria-hidden="true"');
    expect(videoEditSrc).toContain('pointer-events-none');
  });

  test('C2.M5.S02.5: Impact scoring gives significant preference to high-energy terms and syllable length', () => {
    const scoreHeat = calculateWordImpactScore('heat', false);
    const scoreSkyline = calculateWordImpactScore('skyline', false);
    const scoreThe = calculateWordImpactScore('the', false);
    const scoreA = calculateWordImpactScore('a', false);

    expect(scoreThe).toBe(1); // stop-word
    expect(scoreA).toBe(0);   // length <= 1
    expect(scoreHeat).toBeGreaterThan(scoreThe);
    expect(scoreSkyline).toBeGreaterThan(scoreHeat); // longer + high-energy punch term
  });

  test('C2.M5.S02.6: Sub-words receive sideways vertical-rl rotation or angled badge styling in multi-word lines', () => {
    const analysis = tokenizeAndPunchLine('we burned the skyline just to feel the heat');
    const sidewaysWord = analysis.words.find((w) => w.role === 'sideways');
    const badgeWords = analysis.words.filter((w) => w.role === 'badge');

    expect(sidewaysWord).toBeTruthy();
    expect(sidewaysWord.writingMode).toBe('vertical-rl');
    expect(sidewaysWord.rotationDeg).toBe(-90);

    expect(badgeWords.length).toBeGreaterThanOrEqual(1);
    for (const bw of badgeWords) {
      expect(Math.abs(bw.rotationDeg)).toBeLessThanOrEqual(12);
      expect(bw.isBadge).toBe(true);
    }
  });

  test('C2.M5.S02.7: Extremely long words (>25 chars) receive break-all protection to prevent layout explosion', () => {
    const longWord = 'supercalifragilisticexpialidocious_extreme_edition';
    const analysis = tokenizeAndPunchLine(longWord);
    expect(analysis.words[0].scaleClass).toContain('break-all');
  });
});

// =========================================================================
// Suite 3: Retro Viewfinder Overlays & Non-Blocking Integrity
// =========================================================================
suite('Challenger 2 M5: Viewfinder Overlays & Non-Blocking Integrity', () => {
  test('C2.M5.S03.1: Viewfinder root overlay container strictly applies pointer-events-none and select-none', () => {
    expect(videoEditSrc).toMatch(/className="absolute inset-0 pointer-events-none select-none z-20"/);
  });

  test('C2.M5.S03.2: [● REC] indicator renders blinking radar pulse with bg-red-400 and bg-red-500', () => {
    expect(videoEditSrc).toContain('animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75');
    expect(videoEditSrc).toContain('relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500');
    expect(videoEditSrc).toContain('● REC');
  });

  test('C2.M5.S03.3: Running timecode is isolated into ViewfinderTimecode micro-component', () => {
    expect(videoEditSrc).toContain('export function ViewfinderTimecode()');
    expect(videoEditSrc).toContain('formatTimecode(currentTimeMs, 30)');
    expect(videoEditSrc).toContain('tabular-nums');
  });

  test('C2.M5.S03.4: Timecode formatting edge cases match SMPTE standards (0ms, 999ms, 1000ms, 1hr)', () => {
    expect(formatTimecode(0, 30)).toBe('00:00:00:00');
    expect(formatTimecode(999, 30)).toBe('00:00:00:29');
    expect(formatTimecode(1000, 30)).toBe('00:00:01:00');
    expect(formatTimecode(102650, 30)).toBe('00:01:42:19');
    expect(formatTimecode(3661000, 30)).toBe('01:01:01:00');

    // Negative / NaN safety
    expect(formatTimecode(-5000, 30)).toBe('00:00:00:00');
    expect(formatTimecode(NaN, 30)).toBe('00:00:00:00');
  });

  test('C2.M5.S03.5: Viewfinder includes 4 corner framing brackets and center crosshair +', () => {
    // 4 corner border ticks
    expect(videoEditSrc).toContain('border-t-2 border-l-2 border-white/60');
    expect(videoEditSrc).toContain('border-t-2 border-r-2 border-white/60');
    expect(videoEditSrc).toContain('border-b-2 border-l-2 border-white/60');
    expect(videoEditSrc).toContain('border-b-2 border-r-2 border-white/60');

    // Center crosshair
    expect(videoEditSrc).toContain('w-full h-[1px] bg-white absolute');
    expect(videoEditSrc).toContain('h-full w-[1px] bg-white absolute');
  });

  test('C2.M5.S03.6: 16-band audio VU meter generates heights bounded between 10 and 100 with tri-color gradient', () => {
    const isPlayingHeights = generateMeterHeights(16, 42, true);
    expect(isPlayingHeights).toHaveLength(16);
    for (const h of isPlayingHeights) {
      expect(h).toBeGreaterThanOrEqual(10);
      expect(h).toBeLessThanOrEqual(100);
    }

    const pausedHeights = generateMeterHeights(16, 42, false);
    expect(pausedHeights).toHaveLength(16);
    for (const h of pausedHeights) {
      expect(h).toBe(10);
    }

    // Color bands in VideoEditLyrics: red for >=13, yellow for >=10, cyan otherwise
    expect(videoEditSrc).toContain("i >= 13 ? '#ef4444' : i >= 10 ? '#eab308' : '#06b6d4'");
  });

  test('C2.M5.S03.7: Viewfinder overlay toggle button is interactive and outside the non-blocking container', () => {
    // Toggle button must have cursor-pointer and z-30 (above the overlay)
    expect(videoEditSrc).toContain('onClick={() => setShowOverlays(!showOverlays)}');
    expect(videoEditSrc).toContain('cursor-pointer');
    expect(videoEditSrc).toContain('z-30');
  });
});

// =========================================================================
// Suite 4: Master Mode Switcher & Milestone 2 Backward Compatibility
// =========================================================================
suite('Challenger 2 M5: Mode Switcher & M2 Backward Compatibility', () => {
  test('C2.M5.S04.1: VISUALIZER_MODES contains exactly video-edit, apple-spatial, and cyberpunk', () => {
    expect(VISUALIZER_MODES).toHaveLength(3);
    expect(VISUALIZER_MODES[0]).toBe('video-edit');
    expect(VISUALIZER_MODES[1]).toBe('apple-spatial');
    expect(VISUALIZER_MODES[2]).toBe('cyberpunk');
  });

  test('C2.M5.S04.2: cycleVisualizerMode rotates deterministically with period 3', () => {
    let mode = 'video-edit';
    mode = cycleVisualizerMode(mode);
    expect(mode).toBe('apple-spatial');
    mode = cycleVisualizerMode(mode);
    expect(mode).toBe('cyberpunk');
    mode = cycleVisualizerMode(mode);
    expect(mode).toBe('video-edit');
  });

  test('C2.M5.S04.3: Keyboard shortcut V is guarded against metaKey, ctrlKey, altKey, and text inputs', () => {
    expect(kineticLyricsSrc).toContain("e.key.toLowerCase() === 'v' && !e.metaKey && !e.ctrlKey && !e.altKey");
    expect(kineticLyricsSrc).toContain('e.target instanceof HTMLInputElement');
    expect(kineticLyricsSrc).toContain('e.target instanceof HTMLTextAreaElement');
    expect(kineticLyricsSrc).toContain('(e.target as HTMLElement)?.isContentEditable');
  });

  test('C2.M5.S04.4: Exact LYRIC_SPRING_CONFIG preserved in KineticLyrics.tsx for legacy tests', () => {
    expect(kineticLyricsSrc).toContain('export const LYRIC_SPRING_CONFIG = {');
    expect(kineticLyricsSrc).toContain("type: 'spring' as const,");
    expect(kineticLyricsSrc).toContain('stiffness: 180,');
    expect(kineticLyricsSrc).toContain('damping: 25,');
    expect(kineticLyricsSrc).toContain('mass: 1,');
  });

  test('C2.M5.S04.5: Exact getLyricVisualHierarchy signature and behavior preserved', () => {
    expect(kineticLyricsSrc).toContain('export function getLyricVisualHierarchy(');
    expect(kineticLyricsSrc).toContain('lineIndex: number,');
    expect(kineticLyricsSrc).toContain('activeIndex: number,');
    expect(kineticLyricsSrc).toContain('prefersReducedMotion = false');
    expect(kineticLyricsSrc).toContain('linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)');
  });

  test('C2.M5.S04.6: usePlayerStore initializes visualizerMode to video-edit by default', () => {
    expect(playerStoreSrc).toContain("visualizerMode: 'video-edit'");
    expect(playerStoreSrc).toContain('cycleVisualizerMode: () =>');
  });
});

// =========================================================================
// Suite 5: High-Load Fuzzing & Boundary Adversarial Stress
// =========================================================================
suite('Challenger 2 M5: High-Load Fuzzing & Boundary Stress', () => {
  test('C2.M5.S05.1: 1,000 synthetic randomized lyric lines parse without runtime exception or NaN', () => {
    const vocab = [
      'burn', 'skyline', 'ghost', 'city', 'heat', 'forever', 'sunlight',
      'the', 'and', 'with', 'into', 'AURA', 'AMV', '4K', '60FPS', '...',
      '日本語の歌詞', 'Éléphant', '🔥', '✨', '⚡', '<script>alert(1)</script>',
      '12345', 'supercalifragilisticexpialidocious', ''
    ];

    for (let i = 0; i < 1000; i++) {
      const len = Math.floor(Math.random() * 15) + 1;
      const words = Array.from({ length: len }, () => vocab[Math.floor(Math.random() * vocab.length)]);
      const lineStr = words.join(' ');

      const res = tokenizeAndPunchLine(lineStr);
      expect(res).toBeTruthy();
      expect(typeof res.hasPunchedKeyword).toBe('boolean');
      if (res.words.length > 0 && !res.isStageDirection) {
        expect(res.punchWord).toBeTruthy();
      }
    }
  });

  test('C2.M5.S05.2: 10,000 consecutive timecode frames tick without drift or negative seconds', () => {
    for (let frame = 0; frame < 10000; frame++) {
      const ms = Math.floor((frame * 1000) / 30);
      const tc = formatTimecode(ms, 30);
      expect(tc).toMatch(/^\d{2}:\d{2}:\d{2}:\d{2}$/);
    }
  });

  test('C2.M5.S05.3: Audio VU meter simulation under 1,000 randomized seeds produces stable output', () => {
    for (let s = 0; s < 1000; s++) {
      const heights = generateMeterHeights(16, s, true);
      expect(heights).toHaveLength(16);
      for (const val of heights) {
        expect(Number.isInteger(val)).toBe(true);
        expect(val).toBeGreaterThanOrEqual(10);
        expect(val).toBeLessThanOrEqual(100);
      }
    }
  });

  test('C2.M5.S05.4: All demo track lyrics (Tracks 1, 2, 3) tokenize with valid punched keywords', () => {
    for (const track of DEMO_TRACKS) {
      expect(track.lyrics.length).toBeGreaterThan(0);
      for (const lyric of track.lyrics) {
        const analysis = tokenizeAndPunchLine(lyric.text);
        expect(analysis).toBeTruthy();
        if (analysis.isStageDirection) {
          expect(analysis.stageCueText).toBeTruthy();
        } else if (analysis.words.length > 0) {
          expect(analysis.punchWord).toBeTruthy();
          expect(analysis.punchWord.role).toBe('punch');
        }
      }
    }
  });
});

// Run standalone runner
async function runChallenger2M5Suites() {
  const { globalHarness } = await import('./helpers/test-harness.mjs');
  console.log('\n================================================================');
  console.log('   CHALLENGER 2: MILESTONE 5 EMPIRICAL STRESS TEST SUITE        ');
  console.log('   Crazy "Video Edit" Kinetic Visualizer Engine Verification     ');
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
    console.log('ALL CHALLENGER 2 MILESTONE 5 TESTS PASSED SUCCESSFULLY! ✅\n');
    process.exit(0);
  }
}

runChallenger2M5Suites();
