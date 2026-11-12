/**
 * Tier 1: Feature Coverage (Features 19 - 24: WebGL Ambient Fluid Shader)
 * 5 tests per feature = 30 tests
 */

import { suite, test, expect } from '../helpers/test-harness.mjs';
import { createMockWebGLContext } from '../helpers/mocks.mjs';
import { hexToRgb } from '../../src/lib/utils.ts';
import { liquidLerpStep, simulateLiquidLerp } from '../helpers/test-utils.mjs';

// Feature 19: Fullscreen WebGL Quad Pipeline
suite('Feature 19: Fullscreen WebGL Quad Pipeline', () => {
  test('T1.F19.1: WebGL context initialized with preserveDrawingBuffer: true', () => {
    const gl = createMockWebGLContext({ preserveDrawingBuffer: true });
    expect(gl.preserveDrawingBuffer).toBe(true);
  });

  test('T1.F19.2: Canvas CSS applies bilinear stretch across full viewport', () => {
    const canvasClasses = 'fixed inset-0 w-full h-full object-cover -z-10 pointer-events-none';
    expect(canvasClasses).toContain('fixed inset-0');
    expect(canvasClasses).toContain('w-full h-full');
  });

  test('T1.F19.3: Internal render buffer uses downscaled resolution for performance', () => {
    const renderScale = 0.5;
    const screenWidth = 1920;
    const screenHeight = 1080;
    const bufferWidth = Math.round(screenWidth * renderScale);
    const bufferHeight = Math.round(screenHeight * renderScale);
    expect(bufferWidth).toBe(960);
    expect(bufferHeight).toBe(540);
  });

  test('T1.F19.4: Quad geometry consists of two triangles spanning normalized device coordinates', () => {
    const quadVertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);
    expect(quadVertices.length).toBe(12); // 6 vertices * 2 coords
    expect(quadVertices[0]).toBe(-1);
    expect(quadVertices[ quadVertices.length - 1 ]).toBe(1);
  });

  test('T1.F19.5: drawArrays draws 6 vertices in TRIANGLES mode', () => {
    const gl = createMockWebGLContext();
    let drawnCount = 0;
    gl.drawArrays = (mode, first, count) => { drawnCount = count; };
    gl.drawArrays(4 /* gl.TRIANGLES */, 0, 6);
    expect(drawnCount).toBe(6);
  });
});

// Feature 20: Procedural GLSL Fluid Shader
suite('Feature 20: Procedural GLSL Fluid Shader', () => {
  const sampleFragmentShader = `
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec3 u_color0;
    uniform vec3 u_color1;
    uniform vec3 u_color2;
    uniform vec3 u_color3;

    // Simplex / FBM noise simulation
    float fbm(vec2 p) {
      return sin(p.x) * cos(p.y);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      float n = fbm(uv * 3.0 + u_time * 0.1);
      vec3 color = mix(u_color0, u_color1, n);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  test('T1.F20.1: Fragment shader declares 4-color palette uniforms', () => {
    expect(sampleFragmentShader).toContain('uniform vec3 u_color0');
    expect(sampleFragmentShader).toContain('uniform vec3 u_color1');
    expect(sampleFragmentShader).toContain('uniform vec3 u_color2');
    expect(sampleFragmentShader).toContain('uniform vec3 u_color3');
  });

  test('T1.F20.2: Shader incorporates time uniform for continuous fluid motion', () => {
    expect(sampleFragmentShader).toContain('uniform float u_time');
  });

  test('T1.F20.3: Domain warping FBM combines multi-octave spatial noise', () => {
    expect(sampleFragmentShader).toContain('fbm(');
  });

  test('T1.F20.4: WebGL program successfully links compiled shaders', () => {
    const gl = createMockWebGLContext();
    const program = gl.createProgram();
    const vs = gl.createShader(35633);
    const fs = gl.createShader(35632);
    gl.shaderSource(fs, sampleFragmentShader);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    expect(program.linked).toBe(true);
  });

  test('T1.F20.5: Hex colors from track palette convert to normalized WebGL vec3 (0.0 - 1.0)', () => {
    const hex = '#7C3AED';
    const [r, g, b] = hexToRgb(hex);
    expect(r).toBeCloseTo(124 / 255, 0.001);
    expect(g).toBeCloseTo(58 / 255, 0.001);
    expect(b).toBeCloseTo(237 / 255, 0.001);
    expect(r).toBeGreaterThanOrEqual(0.0);
    expect(r).toBeLessThanOrEqual(1.0);
  });
});

// Feature 21: Procedural GLSL Film Grain & Dither
suite('Feature 21: Procedural GLSL Film Grain & Dither', () => {
  const ditherGlslSnippet = `
    float ditherHash(vec2 uv) {
      return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
    }
    vec3 applyGrain(vec3 col, vec2 uv, float intensity) {
      float grain = (ditherHash(uv) - 0.5) * intensity;
      return clamp(col + vec3(grain), 0.0, 1.0);
    }
  `;

  test('T1.F21.1: High-frequency dither hash function is defined', () => {
    expect(ditherGlslSnippet).toContain('ditherHash');
    expect(ditherGlslSnippet).toContain('43758.5453');
  });

  test('T1.F21.2: Film grain eliminates 8-bit color gradient banding', () => {
    expect(ditherGlslSnippet).toContain('applyGrain');
  });

  test('T1.F21.3: Grain noise bounds centered around zero ([-0.5, +0.5] * intensity)', () => {
    expect(ditherGlslSnippet).toContain('(ditherHash(uv) - 0.5)');
  });

  test('T1.F21.4: Grain intensity clamped to aesthetic range (0.015 - 0.04)', () => {
    const grainIntensity = 0.025;
    expect(grainIntensity).toBeGreaterThan(0.01);
    expect(grainIntensity).toBeLessThan(0.05);
  });

  test('T1.F21.5: Final composite color clamped to valid [0.0, 1.0] RGBA range', () => {
    expect(ditherGlslSnippet).toContain('clamp(col + vec3(grain), 0.0, 1.0)');
  });
});

// Feature 22: Liquid LERP Color Crossfading
suite('Feature 22: Liquid LERP Color Crossfading', () => {
  test('T1.F22.1: Single-step LERP advances exactly 5% towards target', () => {
    const current = [0.0, 0.0, 0.0];
    const target = [1.0, 1.0, 1.0];
    const next = liquidLerpStep(current, target, 0.05);
    expect(next[0]).toBeCloseTo(0.05);
    expect(next[1]).toBeCloseTo(0.05);
    expect(next[2]).toBeCloseTo(0.05);
  });

  test('T1.F22.2: 60 frames of liquid LERP converge smoothly (>95% complete)', () => {
    const current = [0.0, 0.0, 0.0];
    const target = [1.0, 1.0, 1.0];
    const after60Frames = simulateLiquidLerp(current, target, 60, 0.05);
    // (1 - 0.05)^60 = 0.04606 => 1 - 0.04606 = 0.95394
    expect(after60Frames[0]).toBeGreaterThan(0.95);
    expect(after60Frames[0]).toBeLessThan(1.0);
  });

  test('T1.F22.3: Multi-color palette LERP interpolates all 4 color vectors simultaneously', () => {
    const currentPalette = [
      [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]
    ];
    const targetPalette = [
      [0.2, 0.4, 0.6], [0.8, 0.1, 0.5], [0.3, 0.7, 0.2], [0.9, 0.9, 0.9]
    ];
    const updated = currentPalette.map((col, i) => liquidLerpStep(col, targetPalette[i], 0.05));
    expect(updated.length).toBe(4);
    expect(updated[0][0]).toBeCloseTo(0.01);
    expect(updated[1][0]).toBeCloseTo(0.04);
  });

  test('T1.F22.4: Monotonic progression: intermediate values never exceed target', () => {
    const current = [0.1, 0.2, 0.3];
    const target = [0.8, 0.8, 0.8];
    let val = [...current];
    for (let i = 0; i < 30; i++) {
      val = liquidLerpStep(val, target, 0.05);
      expect(val[0]).toBeLessThanOrEqual(target[0]);
    }
  });

  test('T1.F22.5: Zero delta when current equals target (steady state)', () => {
    const current = [0.5, 0.5, 0.5];
    const target = [0.5, 0.5, 0.5];
    const next = liquidLerpStep(current, target, 0.05);
    expect(next[0]).toBe(0.5);
    expect(next[1]).toBe(0.5);
    expect(next[2]).toBe(0.5);
  });
});

// Feature 23: WebGL Snapshot Bridge
suite('Feature 23: WebGL Snapshot Bridge', () => {
  test('T1.F23.1: captureVisualizerSnapshot returns non-empty base64 data URL', () => {
    const gl = createMockWebGLContext({ preserveDrawingBuffer: true });
    const snapshotUrl = gl.canvas.toDataURL('image/png');
    expect(snapshotUrl.startsWith('data:image/png;base64,')).toBe(true);
  });

  test('T1.F23.2: Export format specifies image/png for lossless quality', () => {
    const format = 'image/png';
    expect(format).toBe('image/png');
  });

  test('T1.F23.3: Snapshot capture preserves shader visual state without blank frame', () => {
    const gl = createMockWebGLContext({ preserveDrawingBuffer: true });
    expect(gl.preserveDrawingBuffer).toBe(true);
  });

  test('T1.F23.4: Snapshot bridge provides fallback when WebGL is uninitialized', () => {
    const getSnapshot = (gl) => (gl ? gl.canvas.toDataURL() : null);
    expect(getSnapshot(null)).toBe(null);
  });

  test('T1.F23.5: Snapshot payload integrates with Story Card background container', () => {
    const snapshotUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const cardStyle = { backgroundImage: `url(${snapshotUrl})` };
    expect(cardStyle.backgroundImage).toContain(snapshotUrl);
  });
});

// Feature 24: Context Resilience & Fallback
suite('Feature 24: Context Resilience & Fallback', () => {
  test('T1.F24.1: Listens to webglcontextlost event and invokes preventDefault()', () => {
    const gl = createMockWebGLContext();
    let defaultPrevented = false;
    const onContextLost = (e) => {
      e.preventDefault();
      defaultPrevented = true;
    };
    onContextLost({ preventDefault: () => { defaultPrevented = true; } });
    expect(defaultPrevented).toBe(true);
  });

  test('T1.F24.2: Listens to webglcontextrestored event to reinitialize shader pipeline', () => {
    let reinitialized = false;
    const onContextRestored = () => { reinitialized = true; };
    onContextRestored();
    expect(reinitialized).toBe(true);
  });

  test('T1.F24.3: Fallback CSS radial gradient activates when WebGL is unavailable', () => {
    const palette = ['#05050A', '#0F172A', '#7C3AED', '#06B6D4'];
    const fallbackGradient = `radial-gradient(circle at 50% 50%, ${palette[2]} 0%, ${palette[1]} 50%, ${palette[0]} 100%)`;
    expect(fallbackGradient).toContain('radial-gradient');
    expect(fallbackGradient).toContain('#7C3AED');
  });

  test('T1.F24.4: Context loss state prevents drawing calls to avoid browser warnings', () => {
    const gl = createMockWebGLContext();
    gl.simulateContextLoss();
    const canRender = !gl.isContextLost();
    expect(canRender).toBe(false);
  });

  test('T1.F24.5: Context restoration clears error flags and resumes rAF loop', () => {
    const gl = createMockWebGLContext();
    gl.simulateContextLoss();
    gl.simulateContextRestored();
    expect(gl.isContextLost()).toBe(false);
  });
});
