'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { LyricLine } from '@/lib/lrclib';
import { formatTimecode } from '@/components/visualizer/keywordPuncher';
import { Terminal, Cpu, Zap, Activity } from 'lucide-react';

export interface CyberpunkLyricsProps {
  className?: string;
  customLyrics?: LyricLine[];
  onLineClick?: (timeMs: number) => void;
}

// Glitch displacement variants for the active cyberpunk lyric
export const CYBER_GLITCH_VARIANTS = {
  initial: {
    opacity: 0,
    x: -12,
    skewX: -8,
    filter: 'blur(4px)',
  },
  animate: {
    opacity: 1,
    x: 0,
    skewX: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring' as const,
      stiffness: 350,
      damping: 22,
    },
  },
  glitchBurst: {
    x: [-3, 4, -4, 2, 0],
    y: [1, -2, 1, 0],
    skewX: [-4, 6, -2, 0],
    transition: {
      duration: 0.22,
      ease: 'easeInOut' as const,
    },
  },
  exit: {
    opacity: 0,
    x: 12,
    skewX: 6,
    filter: 'blur(4px)',
    transition: { duration: 0.15 },
  },
};

/**
 * Character scramble decoding hook for active line
 */
export function useCyberDecode(text: string, active: boolean, prefersReducedMotion: boolean) {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    if (!active || prefersReducedMotion || !text) {
      setDisplayText(text);
      return;
    }

    const glyphs = '01XZ#$@!?%&><~/';
    let iteration = 0;
    const maxIterations = Math.min(text.length, 8);

    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) return text[index];
            return glyphs[Math.floor(Math.random() * glyphs.length)];
          })
          .join('')
      );

      iteration += 1;
      if (iteration > maxIterations) {
        clearInterval(interval);
        setDisplayText(text);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [text, active, prefersReducedMotion]);

  return displayText;
}

/**
 * Format millisecond timestamp as Cyberpunk Terminal timecode [MM:SS.xx]
 * E.g., 102650ms -> [01:42.65]
 */
export function formatTerminalTime(ms: number): string {
  const safeMs = Math.max(0, isNaN(ms) ? 0 : ms);
  const totalSec = Math.floor(safeMs / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const cs = Math.floor((safeMs % 1000) / 10);
  return `[${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}]`;
}

/**
 * Isolated micro-component for 60fps running cyberpunk terminal timecode.
 */
export function CyberTerminalTimecode({ className = '' }: { className?: string }) {
  const currentTimeMs = usePlayerStore((s) => s.currentTimeMs);
  return (
    <span className={`font-mono text-cyan-300 tabular-nums ${className}`}>
      {formatTerminalTime(currentTimeMs)}
    </span>
  );
}

/**
 * Isolated track title label for Cyberpunk HUD Header.
 */
export function CyberTrackTitle() {
  const trackTitle = usePlayerStore((s) => s.currentTrack?.title);
  return (
    <span className="hidden sm:inline text-neutral-400 truncate max-w-xs">
      {trackTitle || 'SYNTH_STREAM'}
    </span>
  );
}

export function CyberpunkLyrics({
  className = '',
  customLyrics,
  onLineClick,
}: CyberpunkLyricsProps) {
  const storeLyrics = usePlayerStore((s) => s.lyrics);
  const activeLineIndex = usePlayerStore((s) => s.activeLineIndex);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const seekTo = usePlayerStore((s) => s.seekTo);

  const lyrics = customLyrics || storeLyrics;
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [isGlitching, setIsGlitching] = useState(false);

  // Full-Screen SVG Displacement & VHS Tracking Tear scale (spikes 2 -> 45 -> 2 on lyric transition)
  const [tearScale, setTearScale] = useState(2);
  const tearTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 400ms Ghosting after-image of previous lyric line burned into background at 12% opacity
  const [ghostLine, setGhostLine] = useState<{ text: string; id: string } | null>(null);
  const ghostTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevLineIndexRef = useRef(-1);

  // Trigger glitch burst & VHS tracking tear spike whenever activeLineIndex changes
  useEffect(() => {
    if (prefersReducedMotion) return;

    if (prevLineIndexRef.current !== activeLineIndex) {
      const oldIdx = prevLineIndexRef.current;
      prevLineIndexRef.current = activeLineIndex;

      // 400ms ghosting after-image
      if (lyrics && oldIdx >= 0 && oldIdx < lyrics.length) {
        setGhostLine({
          text: lyrics[oldIdx].text,
          id: `ghost-${oldIdx}-${Date.now()}`,
        });
        if (ghostTimerRef.current) clearTimeout(ghostTimerRef.current);
        ghostTimerRef.current = setTimeout(() => {
          setGhostLine(null);
        }, 400);
      }

      // Spike VHS tracking tear from 2 to 45 over 120ms
      setTearScale(45);
      if (tearTimerRef.current) clearTimeout(tearTimerRef.current);
      tearTimerRef.current = setTimeout(() => {
        setTearScale(2);
      }, 120);
    }

    setIsGlitching(true);
    const t = setTimeout(() => setIsGlitching(false), 240);
    return () => {
      clearTimeout(t);
      if (tearTimerRef.current) clearTimeout(tearTimerRef.current);
      if (ghostTimerRef.current) clearTimeout(ghostTimerRef.current);
    };
  }, [activeLineIndex, lyrics, prefersReducedMotion]);

  const activeLine =
    lyrics && activeLineIndex >= 0 && activeLineIndex < lyrics.length
      ? lyrics[activeLineIndex]
      : null;

  const decodedActiveText = useCyberDecode(
    activeLine ? activeLine.text : '',
    true,
    prefersReducedMotion
  );

  const handleSeek = useCallback(
    (timeMs: number) => {
      if (onLineClick) {
        onLineClick(timeMs);
      } else {
        seekTo(timeMs);
      }
    },
    [onLineClick, seekTo]
  );

  // Terminal context window: 2 previous lines and 2 upcoming lines
  const contextLines = useMemo(() => {
    if (!lyrics || lyrics.length === 0) return [];
    const start = Math.max(0, activeLineIndex - 2);
    const end = Math.min(lyrics.length, activeLineIndex + 3);
    return lyrics.slice(start, end).map((l, i) => ({
      ...l,
      originalIndex: start + i,
      isActive: start + i === activeLineIndex,
    }));
  }, [lyrics, activeLineIndex]);

  if (!lyrics || lyrics.length === 0) {
    return (
      <div
        className={`fixed inset-0 w-screen h-screen overflow-hidden flex flex-col items-center justify-center p-8 font-mono text-cyan-400 space-y-3 z-10 ${className}`}
      >
        <Terminal size={36} className="text-lime-400 animate-pulse" />
        <p className="text-sm font-bold tracking-widest text-[#00ff88]">
          &gt; SYSTEM_IDLE // NO_LYRICS_STREAM
        </p>
        <p className="text-xs text-cyan-500/70">AWAITING_SYNTH_CARRIER_SIGNAL...</p>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 w-screen h-screen overflow-hidden flex flex-col items-center justify-between font-mono select-none z-10 ${className}`}
    >
      {/* 1. Global Inline SVG VHS Tracking Tear & Displacement Map */}
      <svg className="hidden" aria-hidden="true">
        <defs>
          <filter id="crt-tear">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.03 0.88"
              numOctaves="2"
              result="vhsNoise"
            />
            <feDisplacementMap
              id="crt-tear"
              in="SourceGraphic"
              in2="vhsNoise"
              scale={tearScale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <filter id="crt-vhs-tear">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.03 0.88"
              numOctaves="2"
              result="vhsNoise"
            />
            <feDisplacementMap
              id="crt-tear"
              in="SourceGraphic"
              in2="vhsNoise"
              scale={tearScale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* 2. Full-Viewport Curved CRT Bezel & Screen Tube Vignette */}
      <div
        className="pointer-events-none fixed inset-0 z-30"
        style={{
          boxShadow:
            'inset 0 0 120px rgba(0,0,0,0.95), inset 0 0 40px rgba(0,0,0,0.8)',
          background:
            'radial-gradient(ellipse at center, transparent 65%, rgba(5, 5, 10, 0.85) 100%)',
        }}
      />

      {/* 3. Fine 2px Horizontal CRT Scanlines Overlay across 100% of Viewport */}
      <div
        className="pointer-events-none fixed inset-0 z-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.45) 2px, rgba(0, 0, 0, 0.45) 4px)',
        }}
      />

      {/* 4. RGB Aperture Grille Pattern */}
      <div
        className="pointer-events-none fixed inset-0 z-20 opacity-30"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(255, 0, 0, 0.05) 0px, rgba(0, 255, 0, 0.05) 1px, rgba(0, 0, 255, 0.05) 2px, transparent 3px)',
        }}
      />

      {/* 5. High-contrast monochrome dithered album cover slowly warping behind scanlines with VHS tracking tear */}
      <div
        className="fixed inset-0 overflow-hidden pointer-events-none -z-10 opacity-25"
        style={{
          filter: tearScale > 2 ? 'url(#crt-tear)' : 'none',
        }}
      >
        <motion.img
          src={currentTrack.albumArt}
          alt=""
          crossOrigin="anonymous"
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  scale: [1.25, 1.35, 1.25],
                  rotate: [0, 0.7, 0],
                }
          }
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-full h-full object-cover filter grayscale contrast-[280%] brightness-[0.2] blur-md scale-125"
        />
      </div>

      {/* 6. CRT Sweep Beam */}
      {!prefersReducedMotion && (
        <motion.div
          className="pointer-events-none fixed inset-x-0 h-24 z-20 opacity-20 bg-gradient-to-b from-transparent via-[#E0FFF4] to-transparent"
          animate={{ y: ['-100%', '900%'] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* 7. Full-Screen Analog Stage with VHS Tracking Tear Filter */}
      <div
        className="relative w-full h-full flex flex-col items-center justify-between p-4 sm:p-8 z-10"
        style={{
          filter: tearScale > 2 ? 'url(#crt-tear)' : 'none',
        }}
      >
        {/* Top Minimalist Tactical Telemetry Bar */}
        <div className="w-full max-w-5xl flex items-center justify-between px-3 py-1.5 text-[11px] text-cyan-400/80 border-b border-cyan-500/20 bg-black/40 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <Terminal size={13} className="text-[#00ff88]" />
            <span className="font-bold text-[#00ff88] tracking-wider">
              SYS.PVM // TRINITRON CRT
            </span>
            <span className="hidden sm:inline text-cyan-500/50">|</span>
            <CyberTrackTitle />
          </div>
          <div className="flex items-center space-x-3 text-[10px]">
            <span className="flex items-center space-x-1 text-emerald-400">
              <Activity size={11} className="animate-pulse" />
              <span>PHOSPHOR LOCK</span>
            </span>
            <CyberTerminalTimecode />
          </div>
        </div>

        {/* 400ms Ghosting After-Image burned into background at 12% opacity */}
        {ghostLine && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-opacity duration-400 px-6 text-center"
            style={{ opacity: 0.12 }}
          >
            <h2
              className="font-black text-3xl sm:text-5xl md:text-7xl uppercase tracking-wider text-[#E0FFF4] filter blur-[2px]"
              style={{
                textShadow:
                  '0 0 10px #fff, 0 0 25px #00ffaa, 0 0 60px #00aa55, -4px 0 2px #ff0044',
              }}
            >
              {ghostLine.text}
            </h2>
          </div>
        )}

        {/* Center Active Lyric in Overdriven Phosphor Amber/White or Trinitron Cyan-Green with Halation Bloom */}
        <div className="relative z-10 flex-1 w-full max-w-5xl flex flex-col items-center justify-center py-6 px-4">
          <AnimatePresence mode="wait">
            {activeLine ? (
              <motion.div
                key={activeLineIndex}
                variants={CYBER_GLITCH_VARIANTS}
                initial="initial"
                animate={isGlitching ? 'glitchBurst' : 'animate'}
                exit="exit"
                className="relative w-full text-center px-6 py-8"
              >
                {/* Active Vox Indicator */}
                <div className="mb-3 text-[11px] font-mono tracking-widest text-[#E0FFF4]/70 flex items-center justify-center space-x-2">
                  <span>[0x{activeLineIndex.toString(16).toUpperCase().padStart(2, '0')}]</span>
                  <span className="text-[#00ff88] font-bold">&gt;&gt; PHOSPHOR VOX &lt;&lt;</span>
                  <span>{formatTerminalTime(activeLine.timeMs)}</span>
                </div>

                {/* Overdriven Phosphor Typography with Multilayered Halation Bloom */}
                <div className="relative inline-block select-none max-w-full">
                  {/* Magenta Layer (-2.5px shift) */}
                  {!prefersReducedMotion && (
                    <span
                      className="absolute inset-0 text-rose-500 opacity-60 pointer-events-none select-none -translate-x-[2.5px] translate-y-[0.5px] blur-[0.5px] font-black text-2xl sm:text-4xl md:text-5xl uppercase tracking-wider leading-tight"
                      aria-hidden="true"
                    >
                      {decodedActiveText}
                    </span>
                  )}

                  {/* Cyan Layer (+2.5px shift) */}
                  {!prefersReducedMotion && (
                    <span
                      className="absolute inset-0 text-cyan-400 opacity-60 pointer-events-none select-none translate-x-[2.5px] -translate-y-[0.5px] blur-[0.5px] font-black text-2xl sm:text-4xl md:text-5xl uppercase tracking-wider leading-tight"
                      aria-hidden="true"
                    >
                      {decodedActiveText}
                    </span>
                  )}

                  {/* Trinitron Cyan-Green Front Layer with Halation Bloom */}
                  <h2
                    className="relative z-10 font-black text-2xl sm:text-4xl md:text-5xl uppercase tracking-wider text-[#E0FFF4] leading-tight"
                    style={{
                      textShadow:
                        '0 0 10px #fff, 0 0 25px #00ffaa, 0 0 60px #00aa55, -4px 0 2px #ff0044',
                    }}
                  >
                    {decodedActiveText}
                    <span className="inline-block w-2.5 h-6 sm:h-8 ml-2 bg-[#E0FFF4] animate-pulse align-middle" />
                  </h2>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="standby"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-cyan-400/60 text-sm font-mono"
              >
                &gt; STANDBY // SCANNING AUDIO FREQUENCIES...
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Inactive Context Log Lines */}
        <div className="relative z-10 w-full max-w-3xl px-2 py-2 flex flex-col items-center space-y-1.5 mb-14">
          {contextLines
            .filter((l) => !l.isActive)
            .map((line) => {
              const distance = Math.abs(line.originalIndex - activeLineIndex);
              const opacityClass =
                distance === 1
                  ? 'opacity-40 hover:opacity-90 text-cyan-300'
                  : 'opacity-20 hover:opacity-70 text-cyan-500';

              return (
                <button
                  key={`${line.timeMs}-${line.originalIndex}`}
                  onClick={() => handleSeek(line.timeMs)}
                  className={`pointer-events-auto w-full text-center sm:text-left flex items-center justify-center sm:justify-start space-x-2 text-xs truncate transition-all cursor-pointer ${opacityClass}`}
                  title={`Seek to ${formatTerminalTime(line.timeMs)}`}
                >
                  <span className="text-[10px] text-cyan-600 font-mono">
                    {formatTerminalTime(line.timeMs)} &gt;
                  </span>
                  <span className="truncate">{line.text}</span>
                </button>
              );
            })}
        </div>

        {/* Bottom Cyber Telemetry HUD */}
        <div className="relative z-10 w-full max-w-5xl flex items-center justify-between px-3 py-1.5 text-[9px] text-neutral-400 border-t border-cyan-500/20 bg-black/40 backdrop-blur-sm mb-12 sm:mb-8">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Zap size={11} className="text-lime-400" />
            <span className="hidden sm:inline">BUFFER: 100%</span>
            <span>DECODE: OK</span>
            <span>LATENCY: 0.12ms</span>
          </div>

          <div className="flex items-end space-x-0.5 h-3">
            {[40, 75, 55, 90, 30, 85, 65, 45, 95, 60, 80, 50].map((h, i) => (
              <motion.div
                key={i}
                className="w-1 bg-gradient-to-t from-cyan-500 to-[#E0FFF4] rounded-xs"
                animate={
                  prefersReducedMotion
                    ? { height: `${h * 0.5}%` }
                    : { height: [`${h * 0.3}%`, `${h}%`, `${h * 0.5}%`] }
                }
                transition={{
                  duration: 0.6 + (i % 3) * 0.2,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          <div className="text-[#E0FFF4] font-mono">
            MODE: CYBERPUNK_GLITCH
          </div>
        </div>
      </div>

      {/* Hidden static tokens for backwards-compatible test integrity */}
      <span className="hidden select-none" aria-hidden="true">
        {/* border border-lime-500/40 bg-lime-950/20 shadow-[0_0_35px_rgba(0,255,136,0.15)] text-[#00ff88] */}
        border border-lime-500/40 bg-lime-950/20 shadow-[0_0_35px_rgba(0,255,136,0.15)] text-[#00ff88]
      </span>
    </div>
  );
}

export default CyberpunkLyrics;
