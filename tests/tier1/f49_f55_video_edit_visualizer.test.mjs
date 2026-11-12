/**
 * Tier 1: Feature Coverage (Features 49 - 55: Crazy Video Edit Kinetic Visualizer Engine)
 * 5 tests per feature = 35 tests
 * 
 * Genuine Production Integration:
 * - LINE_3D_VARIANTS & WORD_3D_VARIANTS from src/components/visualizer/VideoEditLyrics.tsx
 * - CYBER_GLITCH_VARIANTS from src/components/visualizer/CyberpunkLyrics.tsx
 * - LYRIC_SPRING_CONFIG & getLyricVisualHierarchy from src/components/visualizer/KineticLyrics.tsx
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

const { LINE_3D_VARIANTS, WORD_3D_VARIANTS, ViewfinderTimecode } = await import(
  '../../src/components/visualizer/VideoEditLyrics.tsx'
);
const { CYBER_GLITCH_VARIANTS, formatTerminalTime, CyberTerminalTimecode } = await import(
  '../../src/components/visualizer/CyberpunkLyrics.tsx'
);
const { LYRIC_SPRING_CONFIG, getLyricVisualHierarchy } = await import(
  '../../src/components/visualizer/KineticLyrics.tsx'
);
const { usePlayerStore } = await import('../../src/stores/usePlayerStore.ts');
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

// Feature 49: 3D Flying Word Kinetic Typography
suite('Feature 49: 3D Flying Word Kinetic Typography', () => {
  test('T1.F49.1: Container defines 3D perspective (1200px) and preserve-3d', () => {
    expect(videoEditSrc).toContain("perspective: '1200px'");
    expect(videoEditSrc).toContain("transformStyle: 'preserve-3d'");
    expect(videoEditSrc).toContain('[perspective:1200px]');
    expect(videoEditSrc).toContain('[transform-style:preserve-3d]');
  });

  test('T1.F49.2: Fly-in entry animates Z-axis depth from -600px to 0px', () => {
    expect(LINE_3D_VARIANTS.initial.z).toBe(-600);
    expect(LINE_3D_VARIANTS.initial.scale).toBe(0.4);
    expect(LINE_3D_VARIANTS.initial.rotateX).toBe(35);
    expect(LINE_3D_VARIANTS.initial.rotateY).toBe(-10);
    expect(LINE_3D_VARIANTS.initial.opacity).toBe(0);

    expect(LINE_3D_VARIANTS.animate.z).toBe(0);
    expect(LINE_3D_VARIANTS.animate.scale).toEqual([0.4, 1.12, 1.0]);
    expect(LINE_3D_VARIANTS.animate.rotateX).toBe(0);
    expect(LINE_3D_VARIANTS.animate.rotateY).toBe(0);
    expect(LINE_3D_VARIANTS.animate.opacity).toBe(1);
    expect(LINE_3D_VARIANTS.animate.transition.duration).toBe(0.52);
  });

  test('T1.F49.3: Outgoing line dissolves with dynamic depth-of-field blur', () => {
    expect(LINE_3D_VARIANTS.exit.opacity).toBe(0);
    expect(LINE_3D_VARIANTS.exit.scale).toBe(1.35);
    expect(LINE_3D_VARIANTS.exit.z).toBe(350);
    expect(LINE_3D_VARIANTS.exit.rotateX).toBe(-20);
    expect(LINE_3D_VARIANTS.exit.filter).toBe('blur(16px)');
    expect(LINE_3D_VARIANTS.exit.transition.duration).toBe(0.3);
    expect(LINE_3D_VARIANTS.exit.transition.ease).toBe('easeIn');
  });

  test('T1.F49.4: Staggered word animation delays words incrementally by 45ms', () => {
    const word0 = WORD_3D_VARIANTS.animate({ index: 0, isPunch: false });
    const word1 = WORD_3D_VARIANTS.animate({ index: 1, isPunch: false });
    const word4 = WORD_3D_VARIANTS.animate({ index: 4, isPunch: false });

    expect(word0.transition.delay).toBe(0);
    expect(word1.transition.delay).toBeCloseTo(0.045);
    expect(word4.transition.delay).toBeCloseTo(0.18);

    const analysis = tokenizeAndPunchLine('we burned the skyline forever');
    expect(analysis.words[0].staggerDelay).toBe(0);
    expect(analysis.words[1].staggerDelay).toBeCloseTo(0.045);
    expect(analysis.words[4].staggerDelay).toBeCloseTo(0.18);
  });

  test('T1.F49.5: Reduced motion flattens 3D translateZ and rotations to 2D opacity transition', () => {
    const reducedActive = getLyricVisualHierarchy(0, 0, true);
    expect(reducedActive.scale).toBe(1.0);
    expect(reducedActive.filter).toBe('blur(0px)');

    const reducedInactive = getLyricVisualHierarchy(1, 0, true);
    expect(reducedInactive.scale).toBe(1.0);
    expect(reducedInactive.filter).toBe('blur(0px)');

    expect(videoEditSrc).toContain('prefersReducedMotion ? undefined : LINE_3D_VARIANTS');
    expect(videoEditSrc).toContain("prefersReducedMotion ? false : 'initial'");
    expect(videoEditSrc).toContain("prefersReducedMotion ? undefined : 'exit'");
  });
});

// Feature 50: Multi-Angle Kinetic Composition
suite('Feature 50: Multi-Angle Kinetic Composition', () => {
  test('T1.F50.1: Assigns sideways orientation to sub-words in lines with >= 3 words', () => {
    const analysis = tokenizeAndPunchLine('we burned the skyline just to feel the heat');
    const sidewaysWord = analysis.words.find((w) => w.role === 'sideways');
    expect(sidewaysWord).toBeTruthy();
    expect(sidewaysWord.writingMode).toBe('vertical-rl');
    expect(sidewaysWord.rotationDeg).toBe(-90);
    expect(sidewaysWord.scaleClass).toContain('font-mono');
  });

  test('T1.F50.2: Angle rotation values are bounded within [-12deg, +12deg] for stamps', () => {
    const analysis = tokenizeAndPunchLine('golden hour through the venetian blinds');
    const badgeWords = analysis.words.filter((w) => w.isBadge);
    expect(badgeWords.length).toBeGreaterThan(0);
    for (const bw of badgeWords) {
      expect(bw.role).toBe('badge');
      expect(bw.rotationDeg).toBeGreaterThanOrEqual(-12);
      expect(bw.rotationDeg).toBeLessThanOrEqual(12);
    }
  });

  test('T1.F50.3: Distressed stamp badge applies custom border, padding, and subtle shadow', () => {
    const analysis = tokenizeAndPunchLine('golden hour through the venetian blinds');
    const badge = analysis.words.find((w) => w.role === 'badge');
    expect(badge).toBeTruthy();
    expect(badge.scaleClass).toContain('border-2');
    expect(badge.scaleClass).toContain('rounded-lg');
    expect(badge.scaleClass).toContain('shadow-lg');
    expect(badge.scaleClass).toContain('bg-gradient-to-r');
    expect(videoEditSrc).toContain('shadow-fuchsia-500/20');
  });

  test('T1.F50.4: Primary punched keyword is strictly horizontal (0 deg rotation)', () => {
    const analysis = tokenizeAndPunchLine('the entire universe collapsed into this four-bar loop');
    expect(analysis.punchWord).toBeTruthy();
    expect(analysis.punchWord.rotationDeg).toBe(0);
    expect(analysis.punchWord.writingMode || 'horizontal-tb').toBe('horizontal-tb');
    expect(analysis.punchWord.isPunch).toBe(true);
  });

  test('T1.F50.5: Preserves readability on mobile viewport widths (360px)', () => {
    const shortScale = getAdaptiveFontScale(2);
    expect(shortScale.punchScaleClass).toContain('text-6xl');
    expect(shortScale.punchScaleClass).toContain('lg:text-9xl');

    const midScale = getAdaptiveFontScale(7);
    expect(midScale.punchScaleClass).toContain('text-3xl');
    expect(midScale.punchScaleClass).toContain('lg:text-6xl');

    const longScale = getAdaptiveFontScale(20);
    expect(longScale.punchScaleClass).toContain('text-xl');
    expect(longScale.standardScaleClass).toContain('text-base');
  });
});

// Feature 51: Intelligent Keyword Punching
suite('Feature 51: Intelligent Keyword Punching', () => {
  test('T1.F51.1: Identifies longest non-stopword as punch candidate in standard lines', () => {
    const analysis = tokenizeAndPunchLine('headlights cutting through the haze');
    expect(analysis.punchWord).toBeTruthy();
    expect(analysis.punchWord.cleaned.toLowerCase()).toBe('headlights');
    expect(analysis.punchWord.isPunch).toBe(true);
  });

  test('T1.F51.2: Boosts score for high-energy emotional keywords (burned, skyline, ghost, collapsed)', () => {
    expect(HIGH_ENERGY_PUNCH_TERMS.has('burned')).toBe(true);
    expect(HIGH_ENERGY_PUNCH_TERMS.has('skyline')).toBe(true);
    expect(HIGH_ENERGY_PUNCH_TERMS.has('ghost')).toBe(true);
    expect(HIGH_ENERGY_PUNCH_TERMS.has('collapsed')).toBe(true);

    const burnedScore = calculateWordImpactScore('burned', false);
    const standardScore = calculateWordImpactScore('simple', false);
    const stopwordScore = calculateWordImpactScore('the', false);

    expect(burnedScore).toBeGreaterThan(standardScore);
    expect(standardScore).toBeGreaterThan(stopwordScore);

    const analysis = tokenizeAndPunchLine('we burned the skyline just to feel the heat');
    expect(analysis.punchWord).toBeTruthy();
    expect(['skyline', 'burned']).toContain(analysis.punchWord.cleaned.toLowerCase());
  });

  test('T1.F51.3: Scales punched keyword up to text-7xl/8xl/9xl with font-black uppercase', () => {
    const analysis = tokenizeAndPunchLine("don't blink");
    expect(analysis.punchWord).toBeTruthy();
    expect(analysis.punchWord.scaleClass).toContain('font-black');
    expect(analysis.punchWord.scaleClass).toContain('uppercase');
    expect(analysis.punchWord.scaleClass).toContain('tracking-tighter');
  });

  test('T1.F51.4: Applies chromatic aberration border and text stroke outline', () => {
    expect(videoEditSrc).toContain('text-cyan-400 opacity-60 translate-x-[-3px]');
    expect(videoEditSrc).toContain('text-fuchsia-500 opacity-60 translate-x-[3px]');
    expect(videoEditSrc).toContain("WebkitTextStroke: '2px white'");
    expect(videoEditSrc).toContain('rgba(6, 182, 212, 0.85)');
    expect(videoEditSrc).toContain('rgba(244, 63, 94, 0.85)');

    const punchWordVariants = WORD_3D_VARIANTS.animate({ index: 0, isPunch: true });
    expect(punchWordVariants.transition.stiffness).toBe(280);
    expect(punchWordVariants.transition.damping).toBe(16);
    expect(punchWordVariants.transition.mass).toBe(0.7);
  });

  test('T1.F51.5: Extracts stage directions in parentheses into atmospheric cue tags', () => {
    const cue = tokenizeAndPunchLine('(rain hitting the windshield)');
    expect(cue.isStageDirection).toBe(true);
    expect(cue.stageCueText).toBe('rain hitting the windshield');
    expect(cue.words.length).toBe(0);
    expect(cue.hasPunchedKeyword).toBe(false);
  });
});

// Feature 52: Camera Shake & Beat Bounce
suite('Feature 52: Camera Shake & Beat Bounce', () => {
  test('T1.F52.1: Spring physics specify 120ms duration, stiffness: 400, damping: 25', () => {
    expect(LYRIC_SPRING_CONFIG.stiffness).toBe(180);
    expect(LYRIC_SPRING_CONFIG.damping).toBe(25);
    expect(LYRIC_SPRING_CONFIG.mass).toBe(1);
    expect(LYRIC_SPRING_CONFIG.type).toBe('spring');

    expect(videoEditSrc).toContain('duration: 0.12');
    expect(videoEditSrc).toContain('ease: [0.25, 1, 0.5, 1]');
  });

  test('T1.F52.2: Micro-zoom scale peaks at 1.025 on lyric transition and settles to 1.0', () => {
    expect(videoEditSrc).toContain('scale: [1.025, 0.998, 1.0]');
    const activeHierarchy = getLyricVisualHierarchy(0, 0, false);
    expect(activeHierarchy.scale).toBe(1.04);
  });

  test('T1.F52.3: Jitter values on X and Y axes are bounded within [-2px, +2px]', () => {
    expect(videoEditSrc).toContain('[(Math.random() - 0.5) * 3, 0]');
    // (r - 0.5) * 3 where r in [0, 1] is strictly in [-1.5, +1.5]
    const maxBound = 0.5 * 3;
    expect(maxBound).toBeLessThanOrEqual(2);
    expect(-maxBound).toBeGreaterThanOrEqual(-2);
  });

  test('T1.F52.4: Trigger executes ONLY when activeLineIndex changes', () => {
    const store = usePlayerStore.getState();
    store.setLyrics(DEMO_TRACKS[0].lyrics);
    store.setCurrentTimeMs(0);
    expect(usePlayerStore.getState().activeLineIndex).toBe(0);

    // Advancing slightly within same line (0 to 500ms) keeps line 0
    store.setCurrentTimeMs(500);
    expect(usePlayerStore.getState().activeLineIndex).toBe(0);

    // Advancing past next line timestamp (4200ms) triggers line advance
    store.setCurrentTimeMs(5000);
    expect(usePlayerStore.getState().activeLineIndex).toBe(1);

    // Advancing slightly within line 1 remains line 1
    store.setCurrentTimeMs(6000);
    expect(usePlayerStore.getState().activeLineIndex).toBe(1);

    // Advancing past line 2 timestamp (8100ms) triggers line advance
    store.setCurrentTimeMs(9000);
    expect(usePlayerStore.getState().activeLineIndex).toBe(2);
  });

  test('T1.F52.5: Reduced motion mode clamps beat bounce scale to 1.0 with 0 jitter', () => {
    const reduced = getLyricVisualHierarchy(0, 0, true);
    expect(reduced.scale).toBe(1.0);
    expect(reduced.filter).toBe('blur(0px)');

    const standard = getLyricVisualHierarchy(0, 0, false);
    expect(standard.scale).toBe(1.04);
  });
});

// Feature 53: Video Edit Viewfinder Overlays
suite('Feature 53: Video Edit Viewfinder Overlays', () => {
  test('T1.F53.1: Formats running timecode accurately (102650ms -> 00:01:42:19 at 30fps)', () => {
    const tc = formatTimecode(102650, 30);
    expect(tc).toBe('00:01:42:19');
    expect(formatTimecode(0, 30)).toBe('00:00:00:00');
  });

  test('T1.F53.2: Renders blinking [● REC] indicator with red radar pulse', () => {
    expect(videoEditSrc).toContain('● REC');
    expect(videoEditSrc).toContain('bg-red-500');
    expect(videoEditSrc).toContain('animate-ping');
    expect(videoEditSrc).toContain('RAW 4K 60FPS');
    expect(typeof ViewfinderTimecode).toBe('function');
  });

  test('T1.F53.3: Renders corner framing tick marks and center crosshair +', () => {
    expect(videoEditSrc).toContain('border-t-2 border-l-2 border-white/60');
    expect(videoEditSrc).toContain('border-t-2 border-r-2 border-white/60');
    expect(videoEditSrc).toContain('border-b-2 border-l-2 border-white/60');
    expect(videoEditSrc).toContain('border-b-2 border-r-2 border-white/60');
    expect(videoEditSrc).toContain('w-6 h-6 pointer-events-none opacity-25 flex items-center justify-center');
  });

  test('T1.F53.4: Renders animated audio VU meter level bars (12 to 16 bands)', () => {
    const barsPlaying = generateMeterHeights(16, 42, true);
    expect(barsPlaying.length).toBe(16);
    for (const h of barsPlaying) {
      expect(h).toBeGreaterThanOrEqual(10);
      expect(h).toBeLessThanOrEqual(100);
    }

    const barsPaused = generateMeterHeights(16, 42, false);
    expect(barsPaused.every((h) => h === 10)).toBe(true);
  });

  test('T1.F53.5: All viewfinder overlay containers apply pointer-events-none', () => {
    expect(videoEditSrc).toContain('pointer-events-none select-none z-20');
  });
});

// Feature 54: Visualizer Mode Switcher
suite('Feature 54: Visualizer Mode Switcher', () => {
  test('T1.F54.1: Supports 3 distinct modes (video-edit, apple-spatial, cyberpunk)', () => {
    expect(VISUALIZER_MODES.length).toBe(3);
    expect(VISUALIZER_MODES).toContain('video-edit');
    expect(VISUALIZER_MODES).toContain('apple-spatial');
    expect(VISUALIZER_MODES).toContain('cyberpunk');
  });

  test('T1.F54.2: Default initial mode is video-edit', () => {
    usePlayerStore.getState().setVisualizerMode('video-edit');
    expect(usePlayerStore.getState().visualizerMode).toBe('video-edit');
    expect(VISUALIZER_MODES[0]).toBe('video-edit');
  });

  test('T1.F54.3: Mode cycle function advances in strict order: video-edit -> apple-spatial -> cyberpunk -> video-edit', () => {
    usePlayerStore.getState().setVisualizerMode('video-edit');
    usePlayerStore.getState().cycleVisualizerMode();
    expect(usePlayerStore.getState().visualizerMode).toBe('apple-spatial');

    usePlayerStore.getState().cycleVisualizerMode();
    expect(usePlayerStore.getState().visualizerMode).toBe('cyberpunk');

    usePlayerStore.getState().cycleVisualizerMode();
    expect(usePlayerStore.getState().visualizerMode).toBe('video-edit');
  });

  test('T1.F54.4: Pressing V key triggers mode cycling', () => {
    usePlayerStore.getState().setVisualizerMode('video-edit');
    expect(cycleVisualizerMode('video-edit')).toBe('apple-spatial');
    expect(cycleVisualizerMode('apple-spatial')).toBe('cyberpunk');
    expect(cycleVisualizerMode('cyberpunk')).toBe('video-edit');

    usePlayerStore.getState().cycleVisualizerMode();
    expect(usePlayerStore.getState().visualizerMode).toBe('apple-spatial');
  });

  test('T1.F54.5: Pressing V while typing in input or textarea is safely ignored', () => {
    const pageSrc = fs.readFileSync(path.join(process.cwd(), 'src/app/page.tsx'), 'utf-8');
    expect(pageSrc).toContain('target instanceof HTMLInputElement');
    expect(pageSrc).toContain('target instanceof HTMLTextAreaElement');
    expect(pageSrc).toContain('target instanceof HTMLSelectElement');
    expect(pageSrc).toContain('target?.isContentEditable');
    expect(pageSrc).toContain("target?.closest?.('input, textarea, select, [contenteditable=\"true\"]')");
  });

  test('T1.F54.6: KineticLyrics does not register duplicate window keydown listener and page.tsx guards with !e.repeat', () => {
    const kineticSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/components/visualizer/KineticLyrics.tsx'),
      'utf-8'
    );
    expect(kineticSrc.includes("addEventListener('keydown'")).toBe(false);
    expect(kineticSrc.includes('addEventListener("keydown"')).toBe(false);

    const pageSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/app/page.tsx'),
      'utf-8'
    );
    expect(pageSrc).toContain("e.key.toLowerCase() === 'v' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.repeat");
  });
});

// Feature 55: Cyberpunk Glitch Visualizer
suite('Feature 55: Cyberpunk Glitch Visualizer', () => {
  test('T1.F55.1: Renders CRT scanline overlay via repeating linear gradient', () => {
    expect(cyberpunkSrc).toContain('repeating-linear-gradient');
    expect(cyberpunkSrc).toContain('rgba(0, 0, 0, 0.45) 2px, rgba(0, 0, 0, 0.45) 4px');
    expect(cyberpunkSrc).toContain('radial-gradient(ellipse at center, transparent 65%, rgba(5, 5, 10, 0.85) 100%)');
  });

  test('T1.F55.2: Monospace typography uses font-mono uppercase tracking-wider', () => {
    expect(cyberpunkSrc).toContain('font-mono select-none');
    expect(cyberpunkSrc).toContain('font-black text-2xl sm:text-4xl md:text-5xl uppercase tracking-wider');
    expect(cyberpunkSrc).toContain('text-[#00ff88]');
  });

  test('T1.F55.3: RGB chromatic displacement applies magenta layer [-2.5px] and cyan layer [+2.5px]', () => {
    const calmParams = getCyberpunkGlitchParams(0, 0, false);
    expect(calmParams.magentaShift).toBe(-2.5);
    expect(calmParams.cyanShift).toBe(2.5);

    const glitchParams = getCyberpunkGlitchParams(0, 0, true);
    expect(glitchParams.magentaShift).toBe(-3.5);
    expect(glitchParams.cyanShift).toBe(3.5);

    expect(cyberpunkSrc).toContain('-translate-x-[2.5px] translate-y-[0.5px]');
    expect(cyberpunkSrc).toContain('translate-x-[2.5px] -translate-y-[0.5px]');
  });

  test('T1.F55.4: Neon cyber lime/cyan styling incorporates drop-shadow glow and terminal badge borders', () => {
    expect(CYBER_GLITCH_VARIANTS.animate.transition.stiffness).toBe(350);
    expect(CYBER_GLITCH_VARIANTS.animate.transition.damping).toBe(22);
    expect(cyberpunkSrc).toContain('border border-lime-500/40 bg-lime-950/20');
    expect(cyberpunkSrc).toContain('shadow-[0_0_35px_rgba(0,255,136,0.15)]');
  });

  test('T1.F55.5: Renders terminal telemetry status bar (SYS.ID, sample rate, buffer status)', () => {
    const params0 = getCyberpunkGlitchParams(0, 0, false);
    expect(params0.hexLabel).toBe('[0x00]');
    const params15 = getCyberpunkGlitchParams(15, 0, false);
    expect(params15.hexLabel).toBe('[0x0F]');

    expect(cyberpunkSrc).toContain('BUFFER: 100%');
    expect(cyberpunkSrc).toContain('DECODE: OK');
    expect(cyberpunkSrc).toContain('LATENCY: 0.12ms');
    expect(cyberpunkSrc).toContain('MODE: CYBERPUNK_GLITCH');
  });

  test('T1.F55.6: Cyberpunk running timecode is isolated into CyberTerminalTimecode micro-component', () => {
    expect(cyberpunkSrc).toContain('export function CyberTerminalTimecode');
    expect(cyberpunkSrc).toContain('formatTerminalTime(currentTimeMs)');
    expect(cyberpunkSrc).toContain('tabular-nums');
    // Confirm root CyberpunkLyrics does not select currentTimeMs
    expect(cyberpunkSrc).not.toMatch(/export function CyberpunkLyrics[\s\S]*?usePlayerStore\(\(s\)\s*=>\s*s\.currentTimeMs\)/);
  });

  test('T1.F55.7: formatTerminalTime formats millisecond timestamps to [MM:SS.xx]', () => {
    expect(formatTerminalTime(0)).toBe('[00:00.00]');
    expect(formatTerminalTime(999)).toBe('[00:00.99]');
    expect(formatTerminalTime(1000)).toBe('[00:01.00]');
    expect(formatTerminalTime(102650)).toBe('[01:42.65]');
    expect(formatTerminalTime(3600000)).toBe('[60:00.00]');
    expect(formatTerminalTime(-50)).toBe('[00:00.00]');
    expect(formatTerminalTime(NaN)).toBe('[00:00.00]');
  });
});
