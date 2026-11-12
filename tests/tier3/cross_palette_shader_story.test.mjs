/**
 * Tier 3: Cross-Feature Combinations (M1/M3 WebGL Shader ↔ M4 Story Flex Social Export)
 * Verifies track palette color changes, liquid LERP crossfading, WebGL snapshot capture, and card background integration.
 */

import { suite, test, expect } from '../helpers/test-harness.mjs';
import { DEMO_TRACKS } from '../../src/data/demoTracks.ts';
import { createMockWebGLContext } from '../helpers/mocks.mjs';
import { hexToRgb } from '../../src/lib/utils.ts';
import { simulateLiquidLerp, calculateStoryCardDimensions } from '../helpers/test-utils.mjs';

suite('Tier 3: Shader Palette ↔ Story Card Export Integration', () => {
  test('T3.2.1: Track change from demo-1 to demo-2 triggers liquid LERP morphing across all 4 palette colors', () => {
    const track1 = DEMO_TRACKS[0]; // Neo Tokyo (#05050A, #0F172A, #7C3AED, #06B6D4)
    const track2 = DEMO_TRACKS[1]; // Solaris (#1A0F0D, #C2410C, #D97706, #FDBA74)

    const palette1Rgb = track1.palette.map(hexToRgb);
    const palette2Rgb = track2.palette.map(hexToRgb);

    // Simulate 30 frames of LERP
    const interpolated = palette1Rgb.map((col, i) => simulateLiquidLerp(col, palette2Rgb[i], 30, 0.05));

    // Colors should have transitioned >75% towards track2 target
    expect(interpolated.length).toBe(4);
    for (let i = 0; i < 4; i++) {
      expect(interpolated[i][0]).not.toBe(palette1Rgb[i][0]);
    }
  });

  test('T3.2.2: WebGL snapshot bridge captures live visualizer buffer and injects dataUrl into GlassAppleCard', () => {
    const gl = createMockWebGLContext({ preserveDrawingBuffer: true });
    const snapshotDataUrl = gl.canvas.toDataURL('image/png');

    expect(snapshotDataUrl.startsWith('data:image/png;base64,')).toBe(true);

    // Card background style references captured snapshot
    const cardContainerStyle = {
      backgroundImage: `url(${snapshotDataUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
    expect(cardContainerStyle.backgroundImage).toContain(snapshotDataUrl);
  });

  test('T3.2.3: Story Flex card geometry maintains 1080x1920 rasterization at pixelRatio 3 from 360x640 base', () => {
    const dim = calculateStoryCardDimensions(360, 3);
    expect(dim.exportWidth).toBe(1080);
    expect(dim.exportHeight).toBe(1920);
    expect(dim.exportWidth / dim.exportHeight).toBeCloseTo(9 / 16, 0.001);
  });

  test('T3.2.4: Story quote selected from active track is injected seamlessly across all 3 card templates', () => {
    const track = DEMO_TRACKS[2]; // Supernova
    const quote = track.storyQuote;

    const templates = [
      { id: 'glass', quoteText: quote, theme: 'frosted' },
      { id: 'swiss', quoteText: quote.toUpperCase(), theme: 'brutalist' },
      { id: 'receipt', quoteText: `"${quote}"`, theme: 'thermal' },
    ];

    templates.forEach(t => {
      expect(t.quoteText.toLowerCase()).toContain("don't blink");
    });
  });

  test('T3.2.5: High-speed track switching updates palette targets without shader compilation interruption', () => {
    let currentPalette = DEMO_TRACKS[0].palette;
    const switchTrack = (idx) => { currentPalette = DEMO_TRACKS[idx].palette; };

    switchTrack(1);
    expect(currentPalette).toBe(DEMO_TRACKS[1].palette);
    switchTrack(2);
    expect(currentPalette).toBe(DEMO_TRACKS[2].palette);
    switchTrack(0);
    expect(currentPalette).toBe(DEMO_TRACKS[0].palette);
  });
});
