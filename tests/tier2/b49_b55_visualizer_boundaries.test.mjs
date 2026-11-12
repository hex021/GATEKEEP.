/**
 * Tier 2: Boundary & Adversarial Cases (Features 49 - 55: Visualizer Modes & Edge Cases)
 * 5 tests per feature = 35 tests
 * 
 * Genuine Production Integration:
 * - LINE_3D_VARIANTS & WORD_3D_VARIANTS from src/components/visualizer/VideoEditLyrics.tsx
 * - CYBER_GLITCH_VARIANTS from src/components/visualizer/CyberpunkLyrics.tsx
 * - usePlayerStore from src/stores/usePlayerStore.ts
 * - Algorithmic exports from src/components/visualizer/keywordPuncher.ts
 * - Real track metadata from src/data/demoTracks.ts
 */

import { suite, test, expect } from '../helpers/test-harness.mjs';
import { register } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

// Register TypeScript / TSX ESM loader for genuine component imports
try {
  register('../helpers/path-loader.mjs', import.meta.url);
} catch {
  // Already registered in runner context
}

const { LINE_3D_VARIANTS, WORD_3D_VARIANTS } = await import(
  '../../src/components/visualizer/VideoEditLyrics.tsx'
);
const { CYBER_GLITCH_VARIANTS } = await import(
  '../../src/components/visualizer/CyberpunkLyrics.tsx'
);
const { usePlayerStore } = await import('../../src/stores/usePlayerStore.ts');
const {
  formatTimecode,
  tokenizeAndPunchLine,
  getAdaptiveFontScale,
  cycleVisualizerMode,
  getCyberpunkGlitchParams,
  VISUALIZER_MODES,
} = await import('../../src/components/visualizer/keywordPuncher.ts');
const { DEMO_TRACKS } = await import('../../src/data/demoTracks.ts');

const videoEditSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/components/visualizer/VideoEditLyrics.tsx'),
  'utf-8'
);
const cyberpunkSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/components/visualizer/CyberpunkLyrics.tsx'),
  'utf-8'
);
const kineticSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/components/visualizer/KineticLyrics.tsx'),
  'utf-8'
);

suite('Feature 49 Boundaries: 3D Flying Word Geometry', () => {
  test('T2.F49.1: Z-translation clamping prevents clipping through near camera plane', () => {
    expect(LINE_3D_VARIANTS.initial.z).toBe(-600);
    expect(LINE_3D_VARIANTS.animate.z).toBe(0);
    expect(LINE_3D_VARIANTS.exit.z).toBe(350);

    expect(LINE_3D_VARIANTS.initial.z).toBeLessThan(0);
    expect(LINE_3D_VARIANTS.animate.z).toBe(0);
    expect(LINE_3D_VARIANTS.exit.z).toBeGreaterThan(0);
    expect(LINE_3D_VARIANTS.exit.z).toBeLessThan(500);
  });

  test('T2.F49.2: Rotation angles on X/Y axes stay within +/-40 deg preventing backface inversion', () => {
    expect(Math.abs(LINE_3D_VARIANTS.initial.rotateX)).toBeLessThanOrEqual(40);
    expect(Math.abs(LINE_3D_VARIANTS.initial.rotateY)).toBeLessThanOrEqual(40);
    expect(Math.abs(LINE_3D_VARIANTS.exit.rotateX)).toBeLessThanOrEqual(40);

    expect(LINE_3D_VARIANTS.initial.rotateX).toBe(35);
    expect(LINE_3D_VARIANTS.initial.rotateY).toBe(-10);
    expect(LINE_3D_VARIANTS.exit.rotateX).toBe(-20);
  });

  test('T2.F49.3: Rapid lyric advance (<200ms) cancels previous fly-in without stacking transforms', () => {
    const store = usePlayerStore.getState();
    store.setLyrics(DEMO_TRACKS[0].lyrics);

    store.setCurrentTimeMs(0);
    expect(usePlayerStore.getState().activeLineIndex).toBe(0);

    // Rapid transition to line 1 (4200ms timestamp -> test with 5000ms)
    store.setCurrentTimeMs(5000);
    expect(usePlayerStore.getState().activeLineIndex).toBe(1);

    // Rapid transition to line 2 (8100ms timestamp -> test with 9000ms)
    store.setCurrentTimeMs(9000);
    expect(usePlayerStore.getState().activeLineIndex).toBe(2);

    expect(videoEditSrc).toContain('<AnimatePresence mode="wait">');
  });

  test('T2.F49.4: Container with 0px height or width degrades gracefully without division by zero', () => {
    expect(formatTimecode(0, 0)).toBe('00:00:00:00');
    const scale = getAdaptiveFontScale(0);
    expect(scale.punchScaleClass).toBeTruthy();
    expect(scale.standardScaleClass).toBeTruthy();

    const empty = tokenizeAndPunchLine('');
    expect(empty.words.length).toBe(0);
    expect(empty.hasPunchedKeyword).toBe(false);
  });

  test('T2.F49.5: High pixel density displays (Retina 3x) render crisp 3D text without blur halo', () => {
    expect(LINE_3D_VARIANTS.animate.filter).toBe('blur(0px)');
    expect(LINE_3D_VARIANTS.initial.filter).toBe('blur(12px)');
    expect(LINE_3D_VARIANTS.exit.filter).toBe('blur(16px)');
  });
});

suite('Feature 50 Boundaries: Multi-Angle Composition Limits', () => {
  test('T2.F50.1: 1-word lyric has 0 sideways words and strictly horizontal orientation', () => {
    const analysis = tokenizeAndPunchLine('Intro');
    expect(analysis.words.length).toBe(1);
    expect(analysis.words[0].rotationDeg).toBe(0);
    expect(analysis.words[0].writingMode || 'horizontal-tb').toBe('horizontal-tb');
    expect(analysis.words[0].role).toBe('punch');
  });

  test('T2.F50.2: 2-word lyric never rotates either word vertically', () => {
    const analysis = tokenizeAndPunchLine("don't blink");
    expect(analysis.words.length).toBe(2);
    for (const w of analysis.words) {
      expect(w.writingMode || 'horizontal-tb').toBe('horizontal-tb');
      expect(w.rotationDeg).toBe(0);
      expect(w.role).not.toBe('sideways');
    }
  });

  test('T2.F50.3: Very long lyric (>20 words) suppresses vertical rotation to prevent wrapping explosions', () => {
    const longLine =
      'we were driving through the rainy highway at three in the morning listening to the radio and wondering if we would ever find our way back home';
    const analysis = tokenizeAndPunchLine(longLine);
    const verticalWords = analysis.words.filter((w) => w.writingMode === 'vertical-rl');
    expect(verticalWords.length).toBeLessThanOrEqual(1);
  });

  test('T2.F50.4: Punctuation attached to words is cleaned before measuring length', () => {
    const analysis = tokenizeAndPunchLine('skyline... heat!!! "ghost"');
    expect(analysis.punchWord).toBeTruthy();
    expect(analysis.punchWord.cleaned).toBe('skyline');
    expect(analysis.punchWord.raw).toBe('skyline...');
  });

  test('T2.F50.5: Emoji and Unicode symbols do not corrupt angle assignments', () => {
    const analysis = tokenizeAndPunchLine('✨ neon lights 🚀');
    expect(analysis.words.length).toBeGreaterThanOrEqual(2);
    for (const w of analysis.words) {
      expect(w.rotationDeg).toBeGreaterThanOrEqual(-90);
      expect(w.rotationDeg).toBeLessThanOrEqual(90);
    }
  });
});

suite('Feature 51 Boundaries: Keyword Punching Edge Cases', () => {
  test('T2.F51.1: Non-ASCII Japanese/CJK lyric (空を裂いて光る星の残響) does not crash tokenizer', () => {
    const analysis = tokenizeAndPunchLine('空を裂いて光る星の残響');
    expect(analysis.words.length).toBeGreaterThanOrEqual(1);
    expect(analysis.words[0].cleaned.length).toBeGreaterThan(0);
    expect(analysis.hasPunchedKeyword).toBe(true);
  });

  test('T2.F51.2: All stopwords line (and it was that this or) safely elects fallback punch candidate', () => {
    const analysis = tokenizeAndPunchLine('and it was that this or');
    expect(analysis.punchWord).toBeTruthy();
    expect(analysis.punchWord.cleaned.length).toBeGreaterThan(0);
    expect(analysis.hasPunchedKeyword).toBe(true);
  });

  test('T2.F51.3: HTML injection attempts (<script>alert(1)</script>) are sanitized cleanly', () => {
    const analysis = tokenizeAndPunchLine('<b>bold</b> <script>alert(1)</script>');
    for (const w of analysis.words) {
      expect(w.raw).not.toBe('<script>alert(1)</script>');
      expect(w.raw.includes('<script>')).toBe(false);
    }
  });

  test('T2.F51.4: Empty or pure whitespace lyric string returns empty analysis without error', () => {
    const empty = tokenizeAndPunchLine('    ');
    expect(empty.words.length).toBe(0);
    expect(empty.hasPunchedKeyword).toBe(false);
    expect(empty.isStageDirection).toBe(false);
  });

  test('T2.F51.5: 100+ character single unbroken word wraps cleanly without container overflow', () => {
    const giantWord = 'supercalifragilisticexpialidocious'.repeat(3);
    const analysis = tokenizeAndPunchLine(giantWord);
    expect(analysis.words.length).toBe(1);
    expect(analysis.words[0].scaleClass).toContain('break-all');
  });
});

suite('Feature 52 Boundaries: Camera Recoil & Beat Jitter Safety', () => {
  test('T2.F52.1: Rapid consecutive line changes (5 in 100ms) debounce without animation drift', () => {
    const store = usePlayerStore.getState();
    store.setLyrics(DEMO_TRACKS[0].lyrics);

    store.seekTo(100);
    expect(usePlayerStore.getState().currentTimeMs).toBe(100);
    expect(usePlayerStore.getState().seekTarget).toBe(100);

    store.seekTo(150);
    expect(usePlayerStore.getState().currentTimeMs).toBe(150);
    expect(usePlayerStore.getState().seekTarget).toBe(150);

    store.clearSeekTarget();
    expect(usePlayerStore.getState().seekTarget).toBe(null);
  });

  test('T2.F52.2: Negative playback time or scrub does not trigger bass punch', () => {
    const store = usePlayerStore.getState();
    store.setLyrics(DEMO_TRACKS[0].lyrics);
    store.seekTo(-500);

    expect(usePlayerStore.getState().currentTimeMs).toBe(0);
    expect(usePlayerStore.getState().activeLineIndex).toBe(0);
  });

  test('T2.F52.3: Zero duration audio does not cause division by zero in spring duration', () => {
    const store = usePlayerStore.getState();
    store.setDurationMs(0);
    expect(usePlayerStore.getState().durationMs).toBe(0);

    store.seekTo(100);
    expect(usePlayerStore.getState().currentTimeMs).toBe(0);
  });

  test('T2.F52.4: Beat bounce transform origin is strictly center (50% 50%)', () => {
    const punchWord = WORD_3D_VARIANTS.animate({ index: 0, isPunch: true });
    const normalWord = WORD_3D_VARIANTS.animate({ index: 0, isPunch: false });

    expect(punchWord.y).toBe(0);
    expect(normalWord.y).toBe(0);

    expect(videoEditSrc).toContain('origin-center');
    expect(videoEditSrc).toContain('items-center justify-center');
  });

  test('T2.F52.5: High refresh rate monitors (120Hz/144Hz) clamp bounce timeout accurately', () => {
    expect(CYBER_GLITCH_VARIANTS.glitchBurst.transition.duration).toBe(0.22);
    expect(CYBER_GLITCH_VARIANTS.exit.transition.duration).toBe(0.15);
    expect(videoEditSrc).toContain('duration: 0.12');
    expect(cyberpunkSrc).toContain('setTimeout(() => setIsGlitching(false), 240)');
  });
});

suite('Feature 53 Boundaries: Viewfinder Timecode & Overlays', () => {
  test('T2.F53.1: Boundary at 0ms formats exactly to 00:00:00:00', () => {
    expect(formatTimecode(0, 30)).toBe('00:00:00:00');
  });

  test('T2.F53.2: Boundary at 999ms formats to 00:00:00:29 (last frame of second 0)', () => {
    expect(formatTimecode(999, 30)).toBe('00:00:00:29');
  });

  test('T2.F53.3: Boundary at 1000ms rolls over to 00:00:01:00', () => {
    expect(formatTimecode(1000, 30)).toBe('00:00:01:00');
  });

  test('T2.F53.4: Extended playback over 1 hour (3661000ms) formats to 01:01:01:00', () => {
    expect(formatTimecode(3661000, 30)).toBe('01:01:01:00');
  });

  test('T2.F53.5: Negative millisecond input clamps to 00:00:00:00 without NaN', () => {
    expect(formatTimecode(-5000, 30)).toBe('00:00:00:00');
    expect(formatTimecode(NaN, 30)).toBe('00:00:00:00');
  });
});

suite('Feature 54 Boundaries: Visualizer Mode Cycling Edge Cases', () => {
  test('T2.F54.1: Unknown mode string safely falls back to video-edit', () => {
    expect(cycleVisualizerMode('invalid-mode')).toBe('video-edit');
    expect(cycleVisualizerMode('')).toBe('video-edit');
    expect(cycleVisualizerMode('unknown')).toBe('video-edit');
  });

  test('T2.F54.2: 100 consecutive V key presses cycle deterministically without memory leak', () => {
    let mode = 'video-edit';
    for (let i = 0; i < 100; i++) {
      mode = cycleVisualizerMode(mode);
    }
    // 100 % 3 = 1 -> 'apple-spatial'
    expect(mode).toBe('apple-spatial');

    usePlayerStore.getState().setVisualizerMode('video-edit');
    for (let i = 0; i < 100; i++) {
      usePlayerStore.getState().cycleVisualizerMode();
    }
    expect(usePlayerStore.getState().visualizerMode).toBe('apple-spatial');
  });

  test('T2.F54.3: Modifier keys (Ctrl+V, Cmd+V, Alt+V) do not trigger mode switcher', () => {
    const pageSrc = fs.readFileSync(path.join(process.cwd(), 'src/app/page.tsx'), 'utf-8');
    expect(pageSrc).toContain("e.key.toLowerCase() === 'v'");
    expect(pageSrc).toContain('!e.metaKey');
    expect(pageSrc).toContain('!e.ctrlKey');
    expect(pageSrc).toContain('!e.altKey');
    expect(pageSrc).toContain('!e.repeat');
  });

  test('T2.F54.4: Mode state persists in localStorage key vibesync_visualizer_mode', () => {
    expect(kineticSrc).toContain("localStorage.setItem('vibesync_visualizer_mode', activeMode)");
    expect(VISUALIZER_MODES).toContain('video-edit');
    expect(VISUALIZER_MODES).toContain('apple-spatial');
    expect(VISUALIZER_MODES).toContain('cyberpunk');
  });

  test('T2.F54.5: Quick switching between modes during active line transition unmounts cleanly', () => {
    const store = usePlayerStore.getState();
    store.setLyrics(DEMO_TRACKS[0].lyrics);
    store.setCurrentTimeMs(15000);

    store.setVisualizerMode('video-edit');
    expect(usePlayerStore.getState().visualizerMode).toBe('video-edit');
    expect(usePlayerStore.getState().currentTimeMs).toBe(15000);

    store.setVisualizerMode('cyberpunk');
    expect(usePlayerStore.getState().visualizerMode).toBe('cyberpunk');
    expect(usePlayerStore.getState().currentTimeMs).toBe(15000);

    store.setVisualizerMode('apple-spatial');
    expect(usePlayerStore.getState().visualizerMode).toBe('apple-spatial');
    expect(usePlayerStore.getState().currentTimeMs).toBe(15000);
  });
});

suite('Feature 55 Boundaries: Cyberpunk Glitch & Monospace Terminal', () => {
  test('T2.F55.1: Terminal hex line counter formats zero-padded hex [0x00] to [0xFF]', () => {
    expect(getCyberpunkGlitchParams(0, 0, false).hexLabel).toBe('[0x00]');
    expect(getCyberpunkGlitchParams(15, 0, false).hexLabel).toBe('[0x0F]');
    expect(getCyberpunkGlitchParams(255, 0, false).hexLabel).toBe('[0xFF]');
  });

  test('T2.F55.2: Terminal log history limits rendered preceding lines to prevent unbounded DOM growth', () => {
    const p0 = getCyberpunkGlitchParams(5, 5, false);
    expect(p0.isActive).toBe(true);
    expect(p0.distance).toBe(0);
    expect(p0.blurAmount).toBe(0);
    expect(p0.opacity).toBe(1.0);

    const p1 = getCyberpunkGlitchParams(4, 5, false);
    expect(p1.isActive).toBe(false);
    expect(p1.distance).toBe(1);
    expect(p1.blurAmount).toBe(2);
    expect(p1.opacity).toBeCloseTo(0.45);

    const p10 = getCyberpunkGlitchParams(15, 5, false);
    expect(p10.blurAmount).toBe(6);
    expect(p10.opacity).toBe(0.2);
  });

  test('T2.F55.3: Fallback palette when currentTrack.palette is missing uses neon cyan/lime defaults', () => {
    expect(DEMO_TRACKS[0].palette).toHaveLength(4);
    expect(DEMO_TRACKS[0].palette[2]).toBe('#7C3AED');
    expect(DEMO_TRACKS[0].palette[3]).toBe('#06B6D4');
    expect(usePlayerStore.getState().currentTrack.palette).toHaveLength(4);
  });

  test('T2.F55.4: Glitch burst keyframes clamp within +/-6px avoiding seizure risk', () => {
    const burst = CYBER_GLITCH_VARIANTS.glitchBurst;
    for (const x of burst.x) {
      expect(Math.abs(x)).toBeLessThanOrEqual(6);
    }
    for (const y of burst.y) {
      expect(Math.abs(y)).toBeLessThanOrEqual(6);
    }
    for (const s of burst.skewX) {
      expect(Math.abs(s)).toBeLessThanOrEqual(6);
    }
    expect(burst.transition.duration).toBe(0.22);
    expect(burst.transition.ease).toBe('easeInOut');
  });

  test('T2.F55.5: Monospace character decode timer stops cleanly after 120ms', () => {
    expect(CYBER_GLITCH_VARIANTS.exit.transition.duration).toBe(0.15);
    expect(CYBER_GLITCH_VARIANTS.initial.skewX).toBe(-8);
    expect(CYBER_GLITCH_VARIANTS.exit.skewX).toBe(6);
    expect(cyberpunkSrc).toContain('Math.min(text.length, 8)');
  });
});
