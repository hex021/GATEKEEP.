'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { VisualizerThemeProps } from './ThemeRegistry';
import { analyzeLyricLine } from '@/components/visualizer/keywordPuncher';

export function Heartbreak({ lyrics: propLyrics, onLineClick, className = '', isStoryMode = false }: VisualizerThemeProps) {
  const storeLyrics = usePlayerStore((s) => s.lyrics);
  const activeLineIndex = usePlayerStore((s) => s.activeLineIndex);
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
      className={`fixed inset-0 w-screen h-screen overflow-hidden bg-[#100D0B] text-[#E8DCC4] flex items-center justify-center select-none font-serif ${className} ${
        isStoryMode ? 'p-8' : 'p-6 sm:p-14'
      }`}
    >
      {/* 1. Warm Parchment Paper Grain Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(196,155,116,0.15) 0%, transparent 80%)',
        }}
      />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.95)]" />

      {/* 2. Top Melancholic Date Stamp */}
      <div className="absolute top-8 left-8 right-8 flex items-center justify-between text-xs font-mono tracking-widest text-[#C49B74]/70 uppercase pointer-events-none z-10">
        <span>MEMOIR // CONFESSION</span>
        <span>ENTRY #{String(Math.max(1, activeLineIndex + 1)).padStart(2, '0')}</span>
      </div>

      {/* 3. Intimate Handwritten / Editorial Lyric Stage */}
      <div className="relative z-20 max-w-4xl px-6 flex flex-col items-center justify-center text-center">
        {/* Previous Line (Fading Memory in Burgundy) */}
        {prevLine && (
          <div className="mb-6 opacity-30 select-none pointer-events-none">
            <span className="font-serif italic text-sm sm:text-base text-[#9E2A2B] tracking-wide">
              {prevLine}
            </span>
          </div>
        )}

        {/* Current Active Confession Line */}
        <AnimatePresence mode="wait">
          {currentLine && currentLine.words.length > 0 ? (
            <motion.div
              key={`heartbreak-${activeLineIndex}`}
              initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -15, filter: 'blur(6px)' }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => {
                if (onLineClick && activeLineIndex >= 0) {
                  onLineClick(lyrics[activeLineIndex].timeMs);
                }
              }}
              className="cursor-pointer pointer-events-auto max-w-3xl"
            >
              <p className="text-3xl sm:text-5xl md:text-6xl font-serif italic tracking-tight text-[#F2E8DC] leading-snug drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)]">
                "{currentLine.originalText}"
              </p>
            </motion.div>
          ) : (
            <div className="text-sm font-serif italic text-[#C49B74]/60">
              [ unspoken memories ]
            </div>
          )}
        </AnimatePresence>

        {/* Delicate Ink Ornament */}
        <div className="mt-8 flex items-center gap-4 text-xs text-[#C49B74]/40 font-serif">
          <span>~</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#9E2A2B]/60" />
          <span>~</span>
        </div>
      </div>
    </div>
  );
}

export default Heartbreak;
