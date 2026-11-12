'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { VisualizerThemeProps } from './ThemeRegistry';
import { analyzeLyricLine, TokenizedWord } from '@/components/visualizer/keywordPuncher';

export function NewspaperTheme({ lyrics: propLyrics, onLineClick, className = '', isStoryMode = false }: VisualizerThemeProps) {
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
      className={`fixed inset-0 w-screen h-screen overflow-hidden bg-[#161310] text-[#F4EFE6] flex flex-col justify-between select-none font-serif ${className} ${
        isStoryMode ? 'p-8' : 'p-6 sm:p-12 md:p-16'
      }`}
    >
      {/* 1. Vintage Newsprint Header & Masthead */}
      <div className="w-full flex flex-col border-b-2 border-[#D8D2C2]/40 pb-4">
        <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-[#D8D2C2]/60 uppercase border-b border-[#D8D2C2]/20 pb-1 mb-2">
          <span>VOL. CXLII ... No. 49,281</span>
          <span>THE DAILY CHRONICLE</span>
          <span>SPECIAL EDITION • $0.15</span>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-black uppercase tracking-wider">
            THE CHRONICLE DISPATCH
          </h2>
          <span className="text-xs font-mono tracking-widest text-neutral-400">
            {currentTrack.title}
          </span>
        </div>
      </div>

      {/* 2. Front-Page Broadsheet Headline Stage */}
      <div className="my-auto w-full max-w-5xl mx-auto flex flex-col items-center justify-center text-center relative z-20 py-8">
        {/* Subhead Deck (Previous Line) */}
        {prevLine && (
          <div className="mb-6 opacity-45 select-none pointer-events-none">
            <span className="font-serif italic text-sm sm:text-lg text-[#D8D2C2] tracking-normal">
              "{prevLine}"
            </span>
          </div>
        )}

        {/* Lead Headline Typography */}
        <AnimatePresence mode="wait">
          {currentLine && currentLine.words.length > 0 ? (
            <motion.div
              key={`news-${activeLineIndex}`}
              initial={{ opacity: 0, y: 15, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 1.02 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2 max-w-4xl"
            >
              {currentLine.words.map((w: TokenizedWord, idx: number) => {
                const isPunch = w.isPunch;

                return (
                  <span
                    key={w.id}
                    onClick={() => {
                      if (onLineClick && activeLineIndex >= 0) {
                        onLineClick(lyrics[activeLineIndex].timeMs);
                      }
                    }}
                    className={`cursor-pointer pointer-events-auto leading-none uppercase font-serif transition-colors hover:text-[#C49B74] ${
                      isPunch
                        ? 'text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-[#FFFFFF] underline decoration-2 underline-offset-8'
                        : 'text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-[#F4EFE6]'
                    }`}
                  >
                    {w.raw}
                  </span>
                );
              })}
            </motion.div>
          ) : (
            <div className="text-xl sm:text-3xl font-black uppercase tracking-tight text-neutral-400">
              LATEST HEADLINES
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Bottom Multi-Column Editorial Rules & Press Marks */}
      <div className="w-full flex items-center justify-between border-t-2 border-[#D8D2C2]/40 pt-4 text-[10px] font-mono tracking-widest text-[#D8D2C2]/60">
        <span>PRESS: COLD-TYPE BROADSHEET</span>
        <span>PAGE 1 // LEAD STORY</span>
        <span>CIRCULATION: VERIFIED</span>
      </div>
    </div>
  );
}

export default NewspaperTheme;
