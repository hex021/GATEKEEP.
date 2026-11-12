'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { VisualizerThemeProps } from './ThemeRegistry';
import { analyzeLyricLine, TokenizedWord } from '@/components/visualizer/keywordPuncher';

const GLITCH_GLYPHS = ['Ø', '§', '0x', 'Δ', '¥', '▓', '▒', '░', '≠', '∞', '⚡'];

export function Glitchcore({ lyrics: propLyrics, onLineClick, className = '', isStoryMode = false }: VisualizerThemeProps) {
  const storeLyrics = usePlayerStore((s) => s.lyrics);
  const activeLineIndex = usePlayerStore((s) => s.activeLineIndex);
  const currentTimeMs = usePlayerStore((s) => s.currentTimeMs);
  const lyrics = propLyrics || storeLyrics;

  const [isGlitching, setIsGlitching] = useState(false);
  const [sliceOffset, setSliceOffset] = useState(0);
  const prevLineIndexRef = useRef(-1);

  // Controlled glitch burst on line advance
  useEffect(() => {
    if (activeLineIndex >= 0 && activeLineIndex !== prevLineIndexRef.current) {
      prevLineIndexRef.current = activeLineIndex;
      setIsGlitching(true);
      setSliceOffset((Math.random() - 0.5) * 24);
      const timer = setTimeout(() => {
        setIsGlitching(false);
        setSliceOffset(0);
      }, 160);
      return () => clearTimeout(timer);
    }
  }, [activeLineIndex]);

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
      className={`fixed inset-0 w-screen h-screen overflow-hidden bg-[#030305] text-white flex items-center justify-center select-none font-mono ${className} ${
        isStoryMode ? 'p-8' : 'p-6 sm:p-12'
      }`}
    >
      {/* 1. Subtle CRT Scanline & RGB Digital Noise Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 4px)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* 2. Horizontal Digital Tearing Slice on Glitch Burst */}
      {isGlitching && (
        <div
          className="absolute inset-x-0 h-16 bg-cyan-400/10 mix-blend-screen pointer-events-none z-30"
          style={{
            top: `${35 + Math.sin(currentTimeMs * 0.01) * 30}%`,
            transform: `translateX(${sliceOffset * 1.5}px) skewX(${sliceOffset}deg)`,
            filter: 'contrast(250%)',
          }}
        />
      )}

      {/* 3. Header Telemetry & Signal Status */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between text-[10px] tracking-widest text-neutral-500 uppercase pointer-events-none z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-none bg-red-500 animate-ping" />
          <span className="text-red-400 font-bold">SIGNAL CORRUPT // 0x7F</span>
        </div>
        <span className="font-mono text-cyan-400">FPS: 60 • JITTER: {isGlitching ? 'CRITICAL' : 'NOMINAL'}</span>
      </div>

      {/* 4. Glitchcore Typography Canvas */}
      <div className="relative z-20 max-w-5xl px-6 flex flex-col items-center justify-center text-center">
        {/* Previous Line (Desynced Ghost) */}
        {prevLine && (
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0.2 }}
            transition={{ duration: 0.3 }}
            className="mb-6 pointer-events-none select-none"
          >
            <span
              className="font-mono text-xs sm:text-sm uppercase tracking-widest text-neutral-400"
              style={{ textShadow: '-2px 0 rgba(255,0,60,0.5), 2px 0 rgba(0,240,255,0.5)' }}
            >
              {prevLine}
            </span>
          </motion.div>
        )}

        {/* Current Active Line with RGB Split & Fragmentation */}
        <AnimatePresence mode="wait">
          {currentLine && currentLine.words.length > 0 ? (
            <motion.div
              key={`glitch-${activeLineIndex}`}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: -15 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 md:gap-6 max-w-4xl"
            >
              {currentLine.words.map((w: TokenizedWord, idx: number) => {
                const isPunch = w.isPunch;
                const showGlitchGlyph = isGlitching && (idx % 2 === 0 || isPunch);
                const displayWord = showGlitchGlyph
                  ? GLITCH_GLYPHS[idx % GLITCH_GLYPHS.length] + w.cleaned.slice(1)
                  : w.raw;

                return (
                  <motion.div
                    key={w.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.15 }}
                    onClick={() => {
                      if (onLineClick && activeLineIndex >= 0) {
                        onLineClick(lyrics[activeLineIndex].timeMs);
                      }
                    }}
                    className={`cursor-pointer pointer-events-auto transition-transform hover:scale-105 active:scale-95 ${
                      isPunch
                        ? 'text-4xl sm:text-6xl md:text-8xl font-black uppercase tracking-tighter'
                        : 'text-3xl sm:text-5xl md:text-6xl font-extrabold uppercase tracking-tight'
                    }`}
                    style={{
                      textShadow: isGlitching
                        ? '-5px 0 #FF003C, 5px 0 #00F0FF, 0 0 15px rgba(255,255,255,0.8)'
                        : isPunch
                        ? '-3px 0 #FF003C, 3px 0 #00F0FF'
                        : '-1.5px 0 rgba(255,0,60,0.4), 1.5px 0 rgba(0,240,255,0.4)',
                      transform: isGlitching && isPunch ? `translateX(${sliceOffset}px)` : undefined,
                    }}
                  >
                    <span>{displayWord}</span>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-400 bg-black/90 px-4 py-2 border border-cyan-500/40">
              [ GLITCHCORE // READY ]
            </div>
          )}
        </AnimatePresence>

        {/* Bottom System Glitch Stamp */}
        <div className="mt-8 flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.25em] text-neutral-500">
          <span>PARITY: CORRUPTED</span>
          <span>•</span>
          <span>RGB DISPLACEMENT: {isGlitching ? '±5PX' : '±1.5PX'}</span>
          <span>•</span>
          <span>BUFFER: FLUSHED</span>
        </div>
      </div>
    </div>
  );
}

export default Glitchcore;
