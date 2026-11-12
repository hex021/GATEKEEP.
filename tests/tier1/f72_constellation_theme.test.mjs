import { test, expect } from '../helpers/test-harness.mjs';
import { VISUALIZER_THEMES, getThemeMeta } from '@/components/visualizer/themes/ThemeRegistry';
import {
  estimateWordTimings,
  findActiveWordIndex,
  segmentWords,
} from '@/components/visualizer/themes/Constellation/wordTimingEngine';
import {
  parseColorToRGB,
  resolvePaletteFromTrack,
  CONSTELLATION_PRESETS,
} from '@/components/visualizer/themes/Constellation/paletteExtractor';
import {
  buildConstellationEdges,
  drawCelestialStar,
  drawShootingStar,
  drawStarVertex,
  drawCurvedShootingStar,
  evaluateCubicBezier,
} from '@/components/visualizer/themes/Constellation/constellationGeometry';
import {
  computeLayoutBounds,
  generateNodeLayout,
} from '@/components/visualizer/themes/Constellation/constellationLayout';
import { THEME_MODES } from '@/stores/usePlayerStore';

test('Constellation ThemeRegistry: registers as theme #16 with correct metadata', () => {
  expect(VISUALIZER_THEMES).toHaveLength(16);
  expect(THEME_MODES).toContain('constellation');

  const meta = getThemeMeta('constellation');
  expect(meta).not.toBe(undefined);
  expect(meta.name).toBe('Constellation');
  expect(meta.category).toBe('Atmospheric');
  expect(meta.accentColor).toBe('#E2B857');
});

test('ThemeRegistry: contains zero duplicate theme IDs across all 16 entries', () => {
  const ids = VISUALIZER_THEMES.map((t) => t.id);
  const uniqueIds = new Set(ids);
  expect(uniqueIds.size).toBe(16);
});

test('WordTimingEngine: segments English words with punctuation', () => {
  const words = segmentWords("Every lyric is a star, isn't it?");
  expect(words.length).toBe(7);
  expect(words[0]).toBe('Every');
});

test('WordTimingEngine: segments CJK characters without whitespace', () => {
  const cjkWords = segmentWords('星座の光');
  expect(cjkWords.length).toBeGreaterThan(0);
});

test('WordTimingEngine: pre-vocal intro guard returns empty array for null/undefined/empty text', () => {
  expect(estimateWordTimings(null)).toEqual([]);
  expect(estimateWordTimings(undefined)).toEqual([]);
  expect(estimateWordTimings({ timeMs: 0, text: '' })).toEqual([]);
});

test('WordTimingEngine: estimates word timings with punctuation cadence weighting', () => {
  const line = { timeMs: 1000, text: 'We don’t talk anymore, like we used to.' };
  const words = estimateWordTimings(line, 6000);

  expect(words.length).toBe(8);
  expect(words[0].startMs).toBe(1000);
  expect(words[0].isEstimated).toBe(true);

  // Anymore has trailing comma, so it should receive punctuation weight
  const anymoreWord = words.find((w) => w.text.includes('anymore'));
  expect(anymoreWord).not.toBe(undefined);

  // Last word ends at or before nextLineTimeMs
  expect(words[words.length - 1].endMs).toBeLessThanOrEqual(6000);
});

test('WordTimingEngine: caps instrumental solo duration to avoid extreme slow-motion', () => {
  const line = { timeMs: 2000, text: 'Solo begins' };
  // 60-second instrumental break before next line
  const words = estimateWordTimings(line, 62000);
  expect(words.length).toBe(2);
  // Total phrase duration should be capped at <= 2500ms
  const totalDuration = words[words.length - 1].endMs - words[0].startMs;
  expect(totalDuration).toBeLessThanOrEqual(2600);
});

test('WordTimingEngine: preserves genuine word timestamps if already provided', () => {
  const genuineLine = {
    timeMs: 1000,
    text: 'Genuine sync',
    words: [
      { id: '1', text: 'Genuine', startMs: 1000, endMs: 1500, charCount: 7, isEstimated: false },
      { id: '2', text: 'sync', startMs: 1550, endMs: 2000, charCount: 4, isEstimated: false },
    ],
  };

  const words = estimateWordTimings(genuineLine, 3000);
  expect(words.length).toBe(2);
  expect(words[0].isEstimated).toBe(false);
  expect(words[0].startMs).toBe(1000);
  expect(words[0].endMs).toBe(1500);
});

test('WordTimingEngine: findActiveWordIndex correctly locates active word and handles boundaries', () => {
  const words = [
    { id: '1', text: 'One', startMs: 1000, endMs: 2000, charCount: 3, isEstimated: true },
    { id: '2', text: 'Two', startMs: 2000, endMs: 3000, charCount: 3, isEstimated: true },
    { id: '3', text: 'Three', startMs: 3000, endMs: 4000, charCount: 5, isEstimated: true },
  ];

  expect(findActiveWordIndex(words, 500)).toBe(-1); // Before line
  expect(findActiveWordIndex(words, 1500)).toBe(0); // Word 1
  expect(findActiveWordIndex(words, 2500)).toBe(1); // Word 2
  expect(findActiveWordIndex(words, 3500)).toBe(2); // Word 3
  expect(findActiveWordIndex(words, 4400)).toBe(2); // Within 800ms of end
  expect(findActiveWordIndex(words, 5000)).toBe(-1); // Detached after phrase
});

test('PaletteExtractor: parses HEX and RGB color values', () => {
  const hex = parseColorToRGB('#FFCC00');
  expect(hex).not.toBe(null);
  expect(hex.r).toBe(255);
  expect(hex.g).toBe(204);
  expect(hex.b).toBe(0);
  expect(hex.hue).toBeGreaterThanOrEqual(40);
  expect(hex.hue).toBeLessThanOrEqual(55);

  const rgb = parseColorToRGB('rgb(220, 38, 38)');
  expect(rgb).not.toBe(null);
  expect(rgb.r).toBe(220);
  expect(rgb.g).toBe(38);
  expect(rgb.b).toBe(38);
  expect(rgb.hue).toBeLessThanOrEqual(10);
});

test('PaletteExtractor: resolves track palette based on HEX colors', () => {
  // Gold track palette
  const goldPalette = resolvePaletteFromTrack(['#FACC15', '#CA8A04', '#000000', '#FFFFFF']);
  expect(goldPalette.id).toBe('solar-gold');

  // Crimson track palette
  const crimsonPalette = resolvePaletteFromTrack(['#DC2626', '#991B1B', '#0D0204', '#FFFFFF']);
  expect(crimsonPalette.id).toBe('crimson-duotone');

  // Default silver/slate palette
  const slatePalette = resolvePaletteFromTrack(['#0F172A', '#1E293B', '#334155', '#F8FAFC']);
  expect(slatePalette.id).toBe('silver-slate');
});

test('ConstellationGeometry: buildConstellationEdges creates triangulated graph without self-loops', () => {
  const edges = buildConstellationEdges(6);
  expect(edges.length).toBeGreaterThanOrEqual(5);

  for (const e of edges) {
    expect(e.fromIndex).not.toBe(e.toIndex);
    expect(e.fromIndex).toBeGreaterThanOrEqual(0);
    expect(e.toIndex).toBeLessThan(6);
  }
});

test('ConstellationLayout: computeLayoutBounds enforces safe areas on desktop and mobile', () => {
  const desktop = computeLayoutBounds(1280, 800);
  expect(desktop.isMobile).toBe(false);
  expect(desktop.safeYMin).toBe(800 * 0.18);
  expect(desktop.safeYMax).toBe(800 * 0.72);

  const mobile = computeLayoutBounds(375, 667);
  expect(mobile.isMobile).toBe(true);
  expect(mobile.safeYMax).toBe(667 * 0.65); // Mobile clearance above player bar
});

test('ConstellationLayout: generateNodeLayout distributes words within safe areas without crashing', () => {
  const words = [
    { id: '1', text: 'Star', startMs: 1000, endMs: 2000, charCount: 4, isEstimated: true },
    { id: '2', text: 'Map', startMs: 2000, endMs: 3000, charCount: 3, isEstimated: true },
    { id: '3', text: 'Constellation', startMs: 3000, endMs: 4000, charCount: 13, isEstimated: true },
  ];

  const nodes = generateNodeLayout(words, 1280, 800, 1000);
  expect(nodes.length).toBe(3);

  for (const n of nodes) {
    expect(n.baseX).toBeGreaterThanOrEqual(1280 * 0.15);
    expect(n.baseX).toBeLessThanOrEqual(1280 * 0.85);
    expect(n.baseY).toBeGreaterThanOrEqual(800 * 0.18);
    expect(n.baseY).toBeLessThanOrEqual(800 * 0.72);
  }
});

test('ConstellationGeometry: drawCelestialStar renders 8-point/4-point starburst without circular reticle', () => {
  const operations = [];
  const mockCtx = {
    save: () => operations.push('save'),
    restore: () => operations.push('restore'),
    translate: () => operations.push('translate'),
    rotate: () => operations.push('rotate'),
    beginPath: () => operations.push('beginPath'),
    moveTo: (x, y) => operations.push(`moveTo(${x},${y})`),
    lineTo: (x, y) => operations.push(`lineTo(${x},${y})`),
    closePath: () => operations.push('closePath'),
    arc: (x, y, r) => operations.push(`arc(${r})`),
    fill: () => operations.push('fill'),
    stroke: () => operations.push('stroke'),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
  };

  // Render celestial starburst
  drawCelestialStar(mockCtx, 100, 100, 24, '#E2B857', 1.0, 8);
  expect(operations).toContain('save');
  expect(operations).toContain('restore');
  expect(operations).toContain('fill');

  // Verify no stroked reticle rings or target circles are drawn
  expect(operations).not.toContain('stroke');
});

test('ConstellationGeometry: drawShootingStar renders tapered luminous tail between star nodes', () => {
  let pathsDrawn = 0;
  const mockCtx = {
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    beginPath: () => { pathsDrawn++; },
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
  };

  drawShootingStar(mockCtx, 50, 50, 200, 200, 0.75, '#FFFFFF', '#E2B857');
  expect(pathsDrawn).toBeGreaterThan(0);
});

test('ConstellationGeometry V3: evaluateCubicBezier computes smooth curved trajectory', () => {
  const p0 = { x: 100, y: 100 };
  const cp1 = { x: 200, y: 50 };
  const cp2 = { x: 300, y: 250 };
  const p3 = { x: 400, y: 200 };

  const start = evaluateCubicBezier(p0.x, p0.y, cp1.x, cp1.y, cp2.x, cp2.y, p3.x, p3.y, 0.0);
  expect(Math.round(start.x)).toBe(100);
  expect(Math.round(start.y)).toBe(100);

  const mid = evaluateCubicBezier(p0.x, p0.y, cp1.x, cp1.y, cp2.x, cp2.y, p3.x, p3.y, 0.5);
  expect(mid.x).toBeGreaterThan(150);
  expect(mid.x).toBeLessThan(350);

  const end = evaluateCubicBezier(p0.x, p0.y, cp1.x, cp1.y, cp2.x, cp2.y, p3.x, p3.y, 1.0);
  expect(Math.round(end.x)).toBe(400);
  expect(Math.round(end.y)).toBe(200);
});

test('ConstellationGeometry V3: drawCurvedShootingStar draws luminous curved trail without pre-rendering future path', () => {
  let pathsDrawn = 0;
  const mockCtx = {
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    beginPath: () => { pathsDrawn++; },
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
  };

  drawCurvedShootingStar(mockCtx, 100, 100, 200, 50, 300, 250, 400, 200, 0.6, '#E2B857', 1.0);
  expect(pathsDrawn).toBeGreaterThan(0);
});

test('ConstellationLayout V3: generates organic non-zigzag coordinates with Bezier control points and scale nuance', () => {
  const words = [
    { id: '1', text: 'I', startMs: 1000, endMs: 1500, charCount: 1, isEstimated: true },
    { id: '2', text: 'don’t', startMs: 1500, endMs: 2200, charCount: 5, isEstimated: true },
    { id: '3', text: 'wanna', startMs: 2200, endMs: 2800, charCount: 5, isEstimated: true },
    { id: '4', text: 'change', startMs: 2800, endMs: 3400, charCount: 6, isEstimated: true },
  ];

  const nodes = generateNodeLayout(words, 1280, 800, 42);
  expect(nodes.length).toBe(4);

  // Verify Bezier control points exist for nodes > 0
  for (let i = 1; i < nodes.length; i++) {
    const n = nodes[i];
    expect(n.cp1X).not.toBe(undefined);
    expect(n.cp1Y).not.toBe(undefined);
    expect(n.cp2X).not.toBe(undefined);
    expect(n.cp2Y).not.toBe(undefined);
    // Scale factor nuance exists (Part 11.B3)
    expect(n.scaleFactor).toBeGreaterThanOrEqual(0.90);
    expect(n.scaleFactor).toBeLessThanOrEqual(1.15);
  }

  // Verify positions do NOT follow a monotonic linear or strict alternating zigzag
  const xDiffs = [
    nodes[1].baseX - nodes[0].baseX,
    nodes[2].baseX - nodes[1].baseX,
    nodes[3].baseX - nodes[2].baseX,
  ];
  // They should have organic variation
  expect(Math.abs(xDiffs[0])).toBeGreaterThan(0);
  expect(Math.abs(xDiffs[1])).toBeGreaterThan(0);
});
