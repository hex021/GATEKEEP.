'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { LyricLine } from '@/lib/lrclib';
import { analyzeLyricLine, TokenizedWord } from '@/components/visualizer/keywordPuncher';

export interface ThermalFlirLyricsProps {
  className?: string;
  customLyrics?: LyricLine[];
  onLineClick?: (timeMs: number) => void;
}

const VERTEX_SHADER_SRC = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision mediump float;
varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_shockwave; // x, y, progress (0..1)
uniform float u_heat_intensity;

// Ironbow thermal gradient mapping: deep navy -> crimson -> orange -> hot white
vec3 ironbow(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 c0 = vec3(0.01, 0.01, 0.12); // deep navy
  vec3 c1 = vec3(0.24, 0.0, 0.38);  // bruised violet
  vec3 c2 = vec3(0.82, 0.05, 0.12); // crimson
  vec3 c3 = vec3(1.0, 0.52, 0.0);   // electric orange
  vec3 c4 = vec3(1.0, 1.0, 1.0);    // hot white

  if (t < 0.25) return mix(c0, c1, t / 0.25);
  if (t < 0.50) return mix(c1, c2, (t - 0.25) / 0.25);
  if (t < 0.75) return mix(c2, c3, (t - 0.50) / 0.25);
  return mix(c3, c4, (t - 0.75) / 0.25);
}

void main() {
  vec2 uv = v_uv;
  
  // Ambient thermal convective currents
  float wave1 = sin(uv.x * 6.0 + u_time * 1.5) * cos(uv.y * 5.0 - u_time * 1.2);
  float wave2 = sin(uv.y * 10.0 + u_time * 2.0 + wave1) * 0.5 + 0.5;
  
  // Radial thermal dissipation shockwave from bass hits
  float dist = distance(uv, u_shockwave.xy);
  float waveRadius = u_shockwave.z * 1.4;
  float shockEffect = 0.0;
  if (u_shockwave.z > 0.0 && u_shockwave.z < 1.0) {
    float diff = abs(dist - waveRadius);
    if (diff < 0.15) {
      shockEffect = (1.0 - diff / 0.15) * (1.0 - u_shockwave.z) * 0.7;
    }
  }

  // Base heat field
  float baseHeat = (uv.y * 0.2 + wave2 * 0.35 + shockEffect) * u_heat_intensity;
  baseHeat += sin(dist * 12.0 - u_time * 3.0) * 0.08;

  vec3 color = ironbow(baseHeat);
  gl_FragColor = vec4(color, 1.0);
}
`;

export function ThermalFlirLyrics({
  className = '',
  customLyrics,
  onLineClick,
}: ThermalFlirLyricsProps) {
  const storeLyrics = usePlayerStore((s) => s.lyrics);
  const activeLineIndex = usePlayerStore((s) => s.activeLineIndex);
  const lyrics = customLyrics || storeLyrics;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [shockwave, setShockwave] = useState({ x: 0.5, y: 0.5, progress: 0 });
  const shockwaveRef = useRef({ x: 0.5, y: 0.5, progress: 0 });
  const heatIntensityRef = useRef(0.8);
  const prevLineIndexRef = useRef(-1);

  // Trigger shockwave & heat spike on lyric transition / bass hit
  useEffect(() => {
    if (activeLineIndex >= 0 && activeLineIndex !== prevLineIndexRef.current) {
      prevLineIndexRef.current = activeLineIndex;
      heatIntensityRef.current = 1.35;

      const startTime = performance.now();
      const duration = 650; // ms

      const updateShockwave = (now: number) => {
        const elapsed = now - startTime;
        const p = Math.min(1.0, elapsed / duration);
        shockwaveRef.current = { x: 0.5, y: 0.5, progress: p };
        setShockwave({ x: 0.5, y: 0.5, progress: p });
        heatIntensityRef.current = Math.max(0.75, 1.35 - p * 0.6);

        if (p < 1.0) {
          requestAnimationFrame(updateShockwave);
        } else {
          shockwaveRef.current = { x: 0.5, y: 0.5, progress: 0 };
          setShockwave({ x: 0.5, y: 0.5, progress: 0 });
        }
      };
      requestAnimationFrame(updateShockwave);
    }
  }, [activeLineIndex]);

  // Initialize WebGL Ironbow shader with robust fallback
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, antialias: false });
    } catch {
      gl = null;
    }
    if (!gl) return;
    glRef.current = gl;

    // Compile shaders
    const vs = gl.createShader(gl.VERTEX_SHADER);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    gl.shaderSource(vs, VERTEX_SHADER_SRC);
    gl.compileShader(vs);
    gl.shaderSource(fs, FRAGMENT_SHADER_SRC);
    gl.compileShader(fs);

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('Thermal FLIR shader link failed');
      return;
    }
    programRef.current = prog;

    // Full-screen quad geometry
    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uShock = gl.getUniformLocation(prog, 'u_shockwave');
    const uHeat = gl.getUniformLocation(prog, 'u_heat_intensity');

    let startTime = performance.now();

    const renderLoop = (time: number) => {
      if (!gl || !prog) return;
      const elapsed = (time - startTime) * 0.001;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(prog);

      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform3f(
        uShock,
        shockwaveRef.current.x,
        shockwaveRef.current.y,
        shockwaveRef.current.progress
      );
      gl.uniform1f(uHeat, heatIntensityRef.current);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (gl && prog) {
        gl.deleteProgram(prog);
      }
    };
  }, []);

  const currentLine = useMemo(() => {
    if (activeLineIndex < 0 || activeLineIndex >= lyrics.length) return null;
    return analyzeLyricLine(lyrics[activeLineIndex].text);
  }, [lyrics, activeLineIndex]);

  const prevLine = useMemo(() => {
    if (activeLineIndex <= 0 || activeLineIndex - 1 >= lyrics.length) return null;
    return lyrics[activeLineIndex - 1].text;
  }, [lyrics, activeLineIndex]);

  return (
    <div
      className={`fixed inset-0 w-screen h-screen overflow-hidden bg-[#02021A] flex items-center justify-center select-none ${className}`}
    >
      {/* 1. WebGL Thermal Ironbow Shader Canvas */}
      <canvas
        ref={canvasRef}
        width={480}
        height={320}
        className="absolute inset-0 w-full h-full object-cover opacity-60 filter saturate-150 pointer-events-none"
      />

      {/* 2. Expanding Thermal Dissipation Shockwave Ring */}
      {shockwave.progress > 0 && (
        <div
          className="absolute rounded-full border-2 border-orange-500/80 pointer-events-none shadow-[0_0_30px_#ff7800]"
          style={{
            top: '50%',
            left: '50%',
            width: `${shockwave.progress * 140}vmax`,
            height: `${shockwave.progress * 140}vmax`,
            transform: 'translate(-50%, -50%)',
            opacity: (1 - shockwave.progress) * 0.85,
            filter: 'blur(2px)',
          }}
        />
      )}

      {/* 3. FLIR Crosshair & Range Scale Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
        {/* Top FLIR Telemetry */}
        <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-[#FF7800] uppercase opacity-85">
          <div className="flex items-center space-x-3">
            <span className="bg-[#1F0038] px-2 py-0.5 border border-purple-500/40">FLIR INFRARED CAM 08</span>
            <span>EMISSIVITY: 0.96</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-white bg-red-600 px-2 py-0.5 font-bold animate-pulse">REC IR</span>
            <span>+142.8°C MAX</span>
          </div>
        </div>

        {/* Center Crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40">
          <div className="w-12 h-12 border border-[#FF7800]/50 relative">
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#FF7800]/70" />
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-[#FF7800]/70" />
          </div>
          <span className="block mt-1 font-mono text-[9px] text-[#FF7800] text-center tracking-wider">
            ⌖ +118.4°C
          </span>
        </div>

        {/* Right Edge Temperature Ladder */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 font-mono text-[9px] text-neutral-300 pointer-events-none opacity-80">
          <span className="text-white font-bold">150°C</span>
          <div className="w-2.5 h-36 rounded-sm bg-gradient-to-t from-[#02021E] via-[#C80032] via-[#FF7800] to-white border border-white/20 shadow-md" />
          <span className="text-blue-300">18°C</span>
        </div>
      </div>

      {/* 4. Thermal Kinetic Typography Stage */}
      <div className="relative z-20 max-w-5xl px-6 py-12 flex flex-col items-center justify-center text-center">
        {/* Inactive Previous Line (Cooling into Bruised Crimson/Violet) */}
        {prevLine && (
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0.25 }}
            transition={{ duration: 0.4 }}
            className="mb-6 pointer-events-none select-none"
          >
            <span className="font-mono text-sm sm:text-lg uppercase tracking-wider text-[#A020F0] drop-shadow-[0_0_10px_#4B0082]">
              {prevLine}
            </span>
          </motion.div>
        )}

        {/* Active Line (Blazing Hot White / Electric Orange Core) */}
        <AnimatePresence mode="wait">
          {currentLine && currentLine.words.length > 0 ? (
            <motion.div
              key={`thermal-${activeLineIndex}`}
              initial={{ opacity: 0, scale: 0.94, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.08, filter: 'blur(12px)' }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-5 max-w-4xl"
            >
              {currentLine.words.map((w: TokenizedWord, idx: number) => {
                const isPunch = w.isPunch;

                return (
                  <motion.div
                    key={w.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: idx * 0.035,
                      type: 'spring',
                      stiffness: 350,
                      damping: 22,
                    }}
                    onClick={() => {
                      if (onLineClick && activeLineIndex >= 0) {
                        onLineClick(lyrics[activeLineIndex].timeMs);
                      }
                    }}
                    className={`cursor-pointer pointer-events-auto transition-transform hover:scale-105 active:scale-95 ${
                      isPunch
                        ? 'text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-white drop-shadow-[0_0_20px_#FFFFFF] shadow-[0_0_45px_#FF7800]'
                        : 'text-3xl sm:text-5xl md:text-6xl font-extrabold uppercase tracking-tight text-[#FFF4E0] drop-shadow-[0_0_15px_#FF7800]'
                    }`}
                    style={{
                      textShadow: isPunch
                        ? '0 0 10px #FFFFFF, 0 0 25px #FF7800, 0 0 50px #C80032'
                        : '0 0 10px #FFEA00, 0 0 20px #FF7800, 0 0 35px #C80032',
                    }}
                  >
                    <span>{w.raw}</span>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-[#FF7800] bg-black/80 px-4 py-2 border border-[#FF7800]/30 shadow-[0_0_20px_#FF7800]">
              [ THERMAL FLIR // ACTIVE SENSING ]
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ThermalFlirLyrics;
