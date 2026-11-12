'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { VisualizerThemeProps } from './ThemeRegistry';
import { analyzeLyricLine, TokenizedWord } from '@/components/visualizer/keywordPuncher';

export function SwissEditorial({ lyrics: propLyrics, onLineClick, className = '', isStoryMode = false }: VisualizerThemeProps) {
  const storeLyrics = usePlayerStore((s) => s.lyrics);
  const activeLineIndex = usePlayerStore((s) => s.activeLineIndex);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const lyrics = propLyrics || storeLyrics;

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
      className={`fixed inset-0 w-screen h-screen overflow-hidden bg-[#0A0A0A] text-white flex flex-col justify-between select-none font-sans ${className} ${
        isStoryMode ? 'p-8' : 'p-6 sm:p-12 md:p-16'
      }`}
    >
      {/* 1. Swiss Architectural Grid Rules & Section Indicators */}
      <div className="w-full flex items-center justify-between border-b border-white/20 pb-4 text-xs font-mono tracking-widest text-neutral-400">
        <div className="flex items-center gap-4">
          <span className="w-3 h-3 bg-[#FF3B30] inline-block" />
          <span className="font-bold text-white uppercase tracking-widest">SWISS GRAPHIC TYPOGRAPHY</span>
          <span className="hidden sm:inline text-neutral-500">// § {String(Math.max(1, activeLineIndex + 1)).padStart(2, '0')}</span>
        </div>
        <div className="flex items-center gap-6 text-[10px] uppercase font-mono">
          <span className="hidden md:inline text-neutral-400">ZÜRICH • BASEL • 1957</span>
          <span className="text-white font-bold">{currentTrack.title}</span>
        </div>
      </div>

      {/* 2. Main Asymmetric Editorial Stage */}
      <div className="my-auto w-full max-w-6xl mx-auto flex flex-col items-start text-left relative z-10">
        {/* Secondary Editorial Column: Previous Line */}
        {prevLine && (
          <div className="mb-4 pl-1 border-l-2 border-[#FF3B30] text-xs sm:text-sm font-mono uppercase tracking-widest text-neutral-400 opacity-60">
            <span className="text-[#FF3B30] font-bold mr-2">[PREV]</span>
            <span>{prevLine}</span>
          </div>
        )}

        {/* Primary Headline Typography */}
        <AnimatePresence mode="wait">
          {currentLine && currentLine.words.length > 0 ? (
            <motion.div
              key={`swiss-${activeLineIndex}`}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-baseline gap-x-4 sm:gap-x-6 gap-y-1 sm:gap-y-2"
            >
              {currentLine.words.map((w: TokenizedWord, idx: number) => {
                const isPunch = w.isPunch;

                return (
                  <motion.span
                    key={w.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.2 }}
                    onClick={() => {
                      if (onLineClick && activeLineIndex >= 0) {
                        onLineClick(lyrics[activeLineIndex].timeMs);
                      }
                    }}
                    className={`cursor-pointer pointer-events-auto leading-[0.88] uppercase transition-colors hover:text-[#FF3B30] ${
                      isPunch
                        ? 'text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white'
                        : 'text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-neutral-300'
                    }`}
                  >
                    {w.raw}
                  </motion.span>
                );
              })}
            </motion.div>
          ) : (
            <div className="text-xl sm:text-3xl font-black uppercase tracking-tighter text-neutral-500">
              SWISS EDITORIAL SYSTEM
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Bottom Grid Metadata Footer */}
      <div className="w-full flex items-center justify-between border-t border-white/20 pt-4 text-[10px] font-mono tracking-widest text-neutral-400">
        <div className="flex items-center gap-3">
          <span>GRID: ASYMMETRIC 12-COL</span>
          <span>•</span>
          <span>WEIGHT: 900 BLACK</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#FF3B30]">●</span>
          <span className="text-white font-bold">EDITION NO. 02</span>
        </div>
      </div>
    </div>
  );
}

export default SwissEditorial;
