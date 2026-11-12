'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { hexToRgb, type RGBColor, type Palette } from '@/lib/colorExtractor';

// Singleton reference to the active visualizer canvas for snapshot bridge export
let activeVisualizerCanvas: HTMLCanvasElement | null = null;
let activeVisualizerGl: WebGLRenderingContext | null = null;

/**
 * Returns the currently active WebGL visualizer canvas element, or null if unmounted.
 */
export function getVisualizerCanvas(): HTMLCanvasElement | null {
  return activeVisualizerCanvas;
}

/**
 * Captures a lossless PNG data URL snapshot from the WebGL drawing buffer.
 * Retains buffer because preserveDrawingBuffer: true is enabled on context creation.
 * Returns null if WebGL is unavailable, context is lost, or canvas is tainted.
 */
export function captureVisualizerSnapshot(): string | null {
  if (!activeVisualizerCanvas) return null;
  if (activeVisualizerGl && activeVisualizerGl.isContextLost()) {
    return null;
  }
  try {
    return activeVisualizerCanvas.toDataURL('image/png');
  } catch (err) {
    console.error('Failed to capture visualizer snapshot:', err);
    return null;
  }
}

/**
 * Helper to programmatically override the active visualizer canvas (useful in headless tests/mocks).
 */
export function setActiveVisualizerCanvas(
  canvas: HTMLCanvasElement | null,
  gl: WebGLRenderingContext | null = null
): void {
  activeVisualizerCanvas = canvas;
  activeVisualizerGl = gl;
}

const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision mediump float;

varying vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color0;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;

// Modulo 289 for Ashima Simplex Noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

// Ashima Arts Simplex Noise 2D
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Multi-octave Fractal Brownian Motion (FBM)
float fbm(vec2 p) {
  float f = 0.0;
  f += 0.5000 * snoise(p); p *= 2.02;
  f += 0.2500 * snoise(p); p *= 2.03;
  f += 0.1250 * snoise(p);
  return f;
}

// High-frequency pseudo-random hash for film grain & anti-banding dither
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.x, p.y, p.x) * 0.1031);
  p3 += vec3(dot(p3, vec3(p3.y, p3.z, p3.x) + 33.33));
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 uv = v_uv;
  float t = u_time * 0.07;

  // Domain warping for smooth fluid motion
  vec2 q = vec2(fbm(uv + vec2(0.0, t * 0.3)), fbm(uv + vec2(5.2, 1.3 - t * 0.2)));
  vec2 r = vec2(fbm(uv + 3.0 * q + vec2(1.7, 9.2) + t * 0.15), fbm(uv + 3.0 * q + vec2(8.3, 2.8) - t * 0.15));
  float f = fbm(uv + 3.5 * r);

  // Liquid color mixing across 4-color palette
  vec3 color = mix(u_color0, u_color1, clamp(length(q), 0.0, 1.0));
  color = mix(color, u_color2, clamp(length(r.x) * 1.2, 0.0, 1.0));
  color = mix(color, u_color3, clamp(f * f * 2.2, 0.0, 1.0));

  // Vignette: soft radial edge darkening to prioritize kinetic text readability
  vec2 centered = v_uv - 0.5;
  float vignette = 1.0 - dot(centered, centered) * 0.45;
  color *= vignette;

  // Procedural film grain & dither hash eliminating 8-bit gradient banding
  float grain = (hash(v_uv * u_resolution + fract(u_time * 0.73)) - 0.5) * 0.032;
  color += vec3(grain);

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('WebGL shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string
): WebGLProgram | null {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('WebGL program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

const DEFAULT_PALETTE: Palette = ['#05050A', '#0F172A', '#7C3AED', '#06B6D4'];

export function AmbientShader() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const bufferRef = useRef<WebGLBuffer | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const [mounted, setMounted] = useState(false);
  const [isWebGlSupported, setIsWebGlSupported] = useState(true);
  const [isContextLost, setIsContextLost] = useState(false);

  // Read current track palette from store
  const trackPalette = usePlayerStore((s) => s.currentTrack?.palette) || DEFAULT_PALETTE;

  // LERP Color state vectors
  const currentColorsRef = useRef<[RGBColor, RGBColor, RGBColor, RGBColor]>([
    hexToRgb(trackPalette[0] || DEFAULT_PALETTE[0]),
    hexToRgb(trackPalette[1] || DEFAULT_PALETTE[1]),
    hexToRgb(trackPalette[2] || DEFAULT_PALETTE[2]),
    hexToRgb(trackPalette[3] || DEFAULT_PALETTE[3]),
  ]);

  const targetColorsRef = useRef<[RGBColor, RGBColor, RGBColor, RGBColor]>([
    hexToRgb(trackPalette[0] || DEFAULT_PALETTE[0]),
    hexToRgb(trackPalette[1] || DEFAULT_PALETTE[1]),
    hexToRgb(trackPalette[2] || DEFAULT_PALETTE[2]),
    hexToRgb(trackPalette[3] || DEFAULT_PALETTE[3]),
  ]);

  // Update target colors when track palette changes
  useEffect(() => {
    if (trackPalette && trackPalette.length === 4) {
      targetColorsRef.current = [
        hexToRgb(trackPalette[0]),
        hexToRgb(trackPalette[1]),
        hexToRgb(trackPalette[2]),
        hexToRgb(trackPalette[3]),
      ];
    }
  }, [trackPalette]);

  // Subscribe directly to store updates to avoid frame delays
  useEffect(() => {
    const unsub = usePlayerStore.subscribe((state) => {
      const p = state.currentTrack?.palette;
      if (p && p.length === 4) {
        targetColorsRef.current = [
          hexToRgb(p[0]),
          hexToRgb(p[1]),
          hexToRgb(p[2]),
          hexToRgb(p[3]),
        ];
      }
    });
    return unsub;
  }, []);

  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize WebGL context with preserveDrawingBuffer: true for snapshot capture
    const gl = canvas.getContext('webgl', {
      preserveDrawingBuffer: true,
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    });

    if (!gl) {
      console.warn('WebGL not supported on this device. Falling back to CSS radial gradient.');
      setIsWebGlSupported(false);
      return;
    }

    glRef.current = gl;
    activeVisualizerCanvas = canvas;
    activeVisualizerGl = gl;

    // Fullscreen quad geometry (6 vertices forming 2 NDC triangles)
    const quadVertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const program = createProgram(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);
    if (!program) {
      setIsWebGlSupported(false);
      return;
    }
    programRef.current = program;

    const buffer = gl.createBuffer();
    if (!buffer) return;
    bufferRef.current = buffer;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    const aPosLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uResLoc = gl.getUniformLocation(program, 'u_resolution');
    const uTimeLoc = gl.getUniformLocation(program, 'u_time');
    const uColor0Loc = gl.getUniformLocation(program, 'u_color0');
    const uColor1Loc = gl.getUniformLocation(program, 'u_color1');
    const uColor2Loc = gl.getUniformLocation(program, 'u_color2');
    const uColor3Loc = gl.getUniformLocation(program, 'u_color3');

    // Sizing: 0.25x low-res internal rendering with bilinear CSS stretch
    const updateSize = () => {
      if (!canvas || !gl) return;
      const DOWNSCALE = 0.25;
      const w = Math.max(320, Math.floor((window.innerWidth || 1280) * DOWNSCALE));
      const h = Math.max(180, Math.floor((window.innerHeight || 720) * DOWNSCALE));

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    updateSize();

    // Animation frame loop
    const LERP_RATE = 0.05;

    const renderLoop = (timeMs: number) => {
      if (!gl || gl.isContextLost()) return;

      // Smooth Liquid LERP color morphing: currentRGB += (targetRGB - currentRGB) * 0.05
      const current = currentColorsRef.current;
      const target = targetColorsRef.current;

      for (let i = 0; i < 4; i++) {
        current[i][0] += (target[i][0] - current[i][0]) * LERP_RATE;
        current[i][1] += (target[i][1] - current[i][1]) * LERP_RATE;
        current[i][2] += (target[i][2] - current[i][2]) * LERP_RATE;
      }

      gl.useProgram(program);

      // Pass resolution and wrapped time (modulo 3600 prevents float overflow after hours of play)
      const uTime = (timeMs * 0.001) % 3600;
      gl.uniform2f(uResLoc, canvas.width, canvas.height);
      gl.uniform1f(uTimeLoc, uTime);

      // Upload interpolated colors
      gl.uniform3f(uColor0Loc, current[0][0], current[0][1], current[0][2]);
      gl.uniform3f(uColor1Loc, current[1][0], current[1][1], current[1][2]);
      gl.uniform3f(uColor2Loc, current[2][0], current[2][1], current[2][2]);
      gl.uniform3f(uColor3Loc, current[3][0], current[3][1], current[3][2]);

      // Draw quad
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      rafIdRef.current = requestAnimationFrame(renderLoop);
    };

    rafIdRef.current = requestAnimationFrame(renderLoop);
  }, []);

  useEffect(() => {
    setMounted(true);
    initWebGL();

    const canvas = canvasRef.current;

    const handleResize = () => {
      if (!canvas || !glRef.current) return;
      const DOWNSCALE = 0.25;
      const w = Math.max(320, Math.floor((window.innerWidth || 1280) * DOWNSCALE));
      const h = Math.max(180, Math.floor((window.innerHeight || 720) * DOWNSCALE));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        glRef.current.viewport(0, 0, w, h);
      }
    };

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setIsContextLost(true);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };

    const handleContextRestored = () => {
      setIsContextLost(false);
      initWebGL();
    };

    window.addEventListener('resize', handleResize);
    if (canvas) {
      canvas.addEventListener('webglcontextlost', handleContextLost, false);
      canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
    }

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      window.removeEventListener('resize', handleResize);
      if (canvas) {
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      }
      if (glRef.current) {
        if (programRef.current) glRef.current.deleteProgram(programRef.current);
        if (bufferRef.current) glRef.current.deleteBuffer(bufferRef.current);
      }
      if (activeVisualizerCanvas === canvas) {
        activeVisualizerCanvas = null;
        activeVisualizerGl = null;
      }
    };
  }, [initWebGL]);

  return (
    <div
      id="visualizer-container"
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden select-none"
    >
      {/* WebGL Canvas with Bilinear CSS stretch */}
      <canvas
        ref={canvasRef}
        id="ambient-shader-canvas"
        className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
        style={{
          display: isWebGlSupported && !isContextLost ? 'block' : 'none',
          imageRendering: 'auto',
        }}
      />

      {/* Fallback CSS Animated Radial Gradient for WebGL Unavailable / Context Lost / SSR */}
      {(!isWebGlSupported || isContextLost || !mounted) && (
        <div
          id="ambient-shader-fallback"
          className="fixed inset-0 -z-10 pointer-events-none transition-colors duration-1000"
          style={{
            background: `radial-gradient(circle at 25% 25%, ${trackPalette[2] || '#7C3AED'}66 0%, transparent 60%),
                         radial-gradient(circle at 75% 75%, ${trackPalette[3] || '#06B6D4'}55 0%, transparent 60%),
                         radial-gradient(circle at 50% 50%, ${trackPalette[1] || '#0F172A'} 0%, ${trackPalette[0] || '#05050A'} 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[100px]" />
        </div>
      )}
    </div>
  );
}

export default AmbientShader;
