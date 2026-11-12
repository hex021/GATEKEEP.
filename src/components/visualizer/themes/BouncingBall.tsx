'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { VisualizerThemeProps } from './ThemeRegistry';
import { analyzeLyricLine, TokenizedWord } from '@/components/visualizer/keywordPuncher';

export function BouncingBall({ lyrics: propLyrics, onLineClick, className = '', isStoryMode = false }: VisualizerThemeProps) {
  const storeLyrics = usePlayerStore((s) => s.lyrics);
  const activeLineIndex = usePlayerStore((s) => s.activeLineIndex);
  const currentTimeMs = usePlayerStore((s) => s.currentTimeMs);
  const durationMs = usePlayerStore((s) => s.durationMs);
  const lyrics = propLyrics || storeLyrics;

  const currentLine = useMemo(() => {
    if (activeLineIndex < 0 || activeLineIndex >= lyrics.length) return null;
    return analyzeLyricLine(lyrics[activeLineIndex].text);
  }, [lyrics, activeLineIndex]);

  // Compute timing progress inside the current line for bouncing ball physics
  const { activeWordIndex, wordRatio } = useMemo(() => {
    if (activeLineIndex < 0 || activeLineIndex >= lyrics.length || !currentLine) {
      return { activeWordIndex: 0, wordRatio: 0 };
    }
    const currentLineStart = lyrics[activeLineIndex].timeMs;
    const nextLineStart =
      activeLineIndex + 1 < lyrics.length ? lyrics[activeLineIndex + 1].timeMs : durationMs || currentLineStart + 4000;
    const lineDuration = Math.max(1000, nextLineStart - currentLineStart);
    const progress = Math.max(0, Math.min(1, (currentTimeMs - currentLineStart) / lineDuration));

    const totalWords = Math.max(1, currentLine.words.length);
    const wordFloat = progress * totalWords;
    const idx = Math.min(totalWords - 1, Math.floor(wordFloat));
    const subRatio = wordFloat - idx;

    return { activeWordIndex: idx, wordRatio: subRatio };
  }, [activeLineIndex, lyrics, durationMs, currentTimeMs, currentLine]);

  // Parabolic bounce arc Y offset
  const bounceY = -Math.sin(wordRatio * Math.PI) * 28;

  return (
    <div
      className={`fixed inset-0 w-screen h-screen overflow-hidden bg-[#050914] text-white flex items-center justify-center select-none font-sans ${className} ${
        isStoryMode ? 'p-8' : 'p-6 sm:p-14'
      }`}
    >
      {/* 1. Subtle Musical Stage Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 32px, rgba(255,215,0,0.12) 32px, rgba(255,215,0,0.12) 33px)',
        }}
      />

      {/* 2. Top Karaoke Status */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between text-xs font-mono tracking-widest text-[#FFD700] uppercase pointer-events-none z-10">
        <span className="bg-[#FFD700]/20 px-2.5 py-1 border border-[#FFD700]/40 font-bold">
          KARAOKE SYNC // SING-ALONG
        </span>
        <span>LINE #{activeLineIndex + 1}</span>
      </div>

      {/* 3. Bouncing Ball Karaoke Stage */}
      <div className="relative z-20 max-w-5xl px-6 flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          {currentLine && currentLine.words.length > 0 ? (
            <motion.div
              key={`bounce-${activeLineIndex}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-6 max-w-4xl"
            >
              {currentLine.words.map((w: TokenizedWord, idx: number) => {
                const isCurrentWord = idx === activeWordIndex;
                const isPastWord = idx < activeWordIndex;

                return (
                  <div key={w.id} className="relative flex flex-col items-center">
                    {/* Synchronized Bouncing Orb */}
                    {isCurrentWord && (
                      <motion.div
                        className="absolute -top-6 w-5 h-5 rounded-full bg-[#FFD700] shadow-[0_0_18px_#FFD700] pointer-events-none z-30"
                        style={{
                          transform: `translateY(${bounceY}px)`,
                        }}
                      />
                    )}

                    {/* Word Element */}
                    <span
                      onClick={() => {
                        if (onLineClick && activeLineIndex >= 0) {
                          onLineClick(lyrics[activeLineIndex].timeMs);
                        }
                      }}
                      className={`cursor-pointer pointer-events-auto transition-colors duration-200 text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight ${
                        isCurrentWord
                          ? 'text-[#FFD700] scale-105 drop-shadow-[0_0_20px_#FFD700]'
                          : isPastWord
                          ? 'text-[#FFE885] opacity-90'
                          : 'text-white/40'
                      }`}
                    >
                      {w.raw}
                    </span>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-[#FFD700] bg-black/60 px-4 py-2 border border-[#FFD700]/40">
              [ BOUNCING BALL // WAITING ]
            </div>
          )}
        </AnimatePresence>

        {/* Bottom Guide Bar */}
        <div className="mt-12 w-48 h-1 rounded-full bg-gradient-to-r from-transparent via-[#FFD700]/50 to-transparent" />
      </div>
    </div>
  );
}

export default BouncingBall;
