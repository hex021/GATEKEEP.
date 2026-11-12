/**
 * Challenger Suite: Milestone 3 (WebGL Ambient Fluid Shader & Color Pipeline Stress Tests)
 * Verifies color extraction, WebGL quad setup, shader uniforms, LERP math, snapshot bridge, and context resilience.
 */

import { suite, test, expect, globalHarness } from './helpers/test-harness.mjs';
import { createMockWebGLContext } from './helpers/mocks.mjs';
import {
  hexToRgb,
  rgbToHex,
  sanitizeRgb,
  liquidLerpStep,
  simulateLiquidLerp,
  lerpPalette,
  generateCssRadialGradient,
} from '../src/lib/colorExtractor.ts';
import { DEMO_TRACKS } from '../src/data/demoTracks.ts';
import fs from 'node:fs';
import path from 'node:path';

// Read source code of AmbientShader.tsx
const ambientShaderSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/components/visualizer/AmbientShader.tsx'),
  'utf8'
);

suite('Challenger M3: Color Extractor & Vector Math', () => {
  test('C3.1.1: hexToRgb normalizes hex codes accurately into [0.0, 1.0] range', () => {
    const white = hexToRgb('#ffffff');
    expect(white[0]).toBeCloseTo(1.0);
    expect(white[1]).toBeCloseTo(1.0);
    expect(white[2]).toBeCloseTo(1.0);

    const black = hexToRgb('#000000');
    expect(black[0]).toBeCloseTo(0.0);
    expect(black[1]).toBeCloseTo(0.0);
    expect(black[2]).toBeCloseTo(0.0);

    const purple = hexToRgb('#7c3aed');
    expect(purple[0]).toBeCloseTo(124 / 255);
    expect(purple[1]).toBeCloseTo(58 / 255);
    expect(purple[2]).toBeCloseTo(237 / 255);
  });

  test('C3.1.2: rgbToHex rounds and formats normalized vectors back to #RRGGBB', () => {
    expect(rgbToHex([1, 1, 1])).toBe('#ffffff');
    expect(rgbToHex([0, 0, 0])).toBe('#000000');
    expect(rgbToHex([124 / 255, 58 / 255, 237 / 255])).toBe('#7c3aed');
  });

  test('C3.1.3: sanitizeRgb catches NaN and out-of-bounds float values', () => {
    const sanitized = sanitizeRgb([NaN, 1.5, -0.5], [0.1, 0.2, 0.3]);
    expect(sanitized[0]).toBe(0.1);
    expect(sanitized[1]).toBe(1.0); // clamped to 1.0
    expect(sanitized[2]).toBe(0.0); // clamped to 0.0
  });

  test('C3.1.4: liquidLerpStep satisfies currentRGB += (targetRGB - currentRGB) * 0.05', () => {
    const start = [0.2, 0.4, 0.6];
    const target = [0.8, 0.9, 1.0];
    const step1 = liquidLerpStep(start, target, 0.05);

    expect(step1[0]).toBeCloseTo(0.2 + (0.8 - 0.2) * 0.05);
    expect(step1[1]).toBeCloseTo(0.4 + (0.9 - 0.4) * 0.05);
    expect(step1[2]).toBeCloseTo(0.6 + (1.0 - 0.6) * 0.05);
  });

  test('C3.1.5: simulateLiquidLerp after 60 frames converges over 95%', () => {
    const start = [0, 0, 0];
    const target = [1, 1, 1];
    const result = simulateLiquidLerp(start, target, 60, 0.05);

    // 1 - (1 - 0.05)^60 = 0.9539
    expect(result[0]).toBeGreaterThan(0.95);
    expect(result[1]).toBeGreaterThan(0.95);
    expect(result[2]).toBeGreaterThan(0.95);
  });

  test('C3.1.6: lerpPalette interpolates all 4 colors in parallel without cross-channel bleeding', () => {
    const paletteA = DEMO_TRACKS[0].palette.map(hexToRgb);
    const paletteB = DEMO_TRACKS[1].palette.map(hexToRgb);

    const step = lerpPalette(paletteA, paletteB, 0.05);
    expect(step.length).toBe(4);

    for (let i = 0; i < 4; i++) {
      expect(step[i][0]).toBeCloseTo(paletteA[i][0] + (paletteB[i][0] - paletteA[i][0]) * 0.05);
    }
  });

  test('C3.1.7: generateCssRadialGradient constructs multi-stop radial gradient string', () => {
    const grad = generateCssRadialGradient(DEMO_TRACKS[0].palette);
    expect(grad).toContain('radial-gradient');
    expect(grad).toContain(DEMO_TRACKS[0].palette[0]);
    expect(grad).toContain(DEMO_TRACKS[0].palette[2]);
  });
});

suite('Challenger M3: AmbientShader Implementation Source Integrity', () => {
  test('C3.2.1: AmbientShader source sets preserveDrawingBuffer: true', () => {
    expect(ambientShaderSrc).toContain('preserveDrawingBuffer: true');
  });

  test('C3.2.2: AmbientShader source configures 0.25x low-res rendering scale', () => {
    expect(ambientShaderSrc).toContain('0.25');
  });

  test('C3.2.3: AmbientShader declares all 4-color uniforms and time/resolution uniforms', () => {
    expect(ambientShaderSrc).toContain('uniform vec3 u_color0;');
    expect(ambientShaderSrc).toContain('uniform vec3 u_color1;');
    expect(ambientShaderSrc).toContain('uniform vec3 u_color2;');
    expect(ambientShaderSrc).toContain('uniform vec3 u_color3;');
    expect(ambientShaderSrc).toContain('uniform float u_time;');
    expect(ambientShaderSrc).toContain('uniform vec2 u_resolution;');
  });

  test('C3.2.4: AmbientShader incorporates Ashima simplex noise and FBM domain warping', () => {
    expect(ambientShaderSrc).toContain('snoise(');
    expect(ambientShaderSrc).toContain('fbm(');
    expect(ambientShaderSrc.toLowerCase()).toContain('domain warping');
  });

  test('C3.2.5: AmbientShader implements procedural film grain / dither hash', () => {
    expect(ambientShaderSrc).toContain('hash(');
    expect(ambientShaderSrc).toContain('0.032');
  });

  test('C3.2.6: AmbientShader exports captureVisualizerSnapshot function', () => {
    expect(ambientShaderSrc).toContain('export function captureVisualizerSnapshot');
    expect(ambientShaderSrc).toContain(".toDataURL('image/png')");
  });

  test('C3.2.7: AmbientShader handles webglcontextlost and webglcontextrestored events', () => {
    expect(ambientShaderSrc).toContain("'webglcontextlost'");
    expect(ambientShaderSrc).toContain("'webglcontextrestored'");
    expect(ambientShaderSrc).toContain('e.preventDefault()');
  });

  test('C3.2.8: AmbientShader provides animated CSS radial fallback gradient', () => {
    expect(ambientShaderSrc).toContain('ambient-shader-fallback');
    expect(ambientShaderSrc).toContain('radial-gradient');
  });
});

async function run() {
  const report = await globalHarness.run();
  console.log('\n======================================================');
  console.log('   CHALLENGER: MILESTONE 3 SHADER & COLOR TESTS       ');
  console.log('======================================================\n');
  console.log(`Total tests run: ${report.stats.total}`);
  console.log(`Passed:          ${report.stats.passed}`);
  console.log(`Failed:          ${report.stats.failed}`);
  console.log(`Duration:        ${report.stats.durationMs.toFixed(2)}ms\n`);

  if (report.failures.length > 0) {
    for (const fail of report.failures) {
      console.error(`FAIL: [${fail.suite}] ${fail.test} -> ${fail.error.message}`);
    }
    process.exit(1);
  } else {
    console.log('ALL CHALLENGER M3 TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  }
}

run();
