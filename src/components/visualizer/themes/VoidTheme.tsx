'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { VisualizerThemeProps } from './ThemeRegistry';
import { analyzeLyricLine } from '@/components/visualizer/keywordPuncher';

export function VoidTheme({ lyrics: propLyrics, onLineClick, className = '', isStoryMode = false }: VisualizerThemeProps) {
  const storeLyrics = usePlayerStore((s) => s.lyrics);
  const activeLineIndex = usePlayerStore((s) => s.activeLineIndex);
  const lyrics = propLyrics || storeLyrics;

  const currentLine = useMemo(() => {
    if (activeLineIndex < 0 || activeLineIndex >= lyrics.length) return null;
    return analyzeLyricLine(lyrics[activeLineIndex].text);
  }, [lyrics, activeLineIndex]);

  return (
    <div
      className={`fixed inset-0 w-screen h-screen overflow-hidden bg-[#000000] text-white flex items-center justify-center select-none font-sans ${className} ${
        isStoryMode ? 'p-8' : 'p-6 sm:p-16'
      }`}
    >
      {/* 1. Deep Celestial Dust (Subtle Sparse Particles) */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/3 w-1 h-1 rounded-full bg-white/40 shadow-[0_0_6px_#fff]" />
        <div className="absolute top-2/3 left-1/5 w-1 h-1 rounded-full bg-white/30 shadow-[0_0_4px_#fff]" />
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-white/50 shadow-[0_0_8px_#fff]" />
        <div className="absolute bottom-1/4 right-1/3 w-1 h-1 rounded-full bg-white/30 shadow-[0_0_5px_#fff]" />
      </div>

      {/* 2. Weightless Minimal Typography Stage */}
      <div className="relative z-20 max-w-3xl px-8 flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          {currentLine && currentLine.words.length > 0 ? (
            <motion.div
              key={`void-${activeLineIndex}`}
              initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -15, filter: 'blur(12px)' }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => {
                if (onLineClick && activeLineIndex >= 0) {
                  onLineClick(lyrics[activeLineIndex].timeMs);
                }
              }}
              className="cursor-pointer pointer-events-auto"
            >
              <p className="text-xl sm:text-2xl md:text-3xl font-light uppercase tracking-[0.35em] text-neutral-200 leading-relaxed font-sans">
                {currentLine.originalText}
              </p>
            </motion.div>
          ) : (
            <div className="text-xs font-light tracking-[0.4em] text-neutral-600 uppercase">
              • SILENCE •
            </div>
          )}
        </AnimatePresence>

        {/* Minimal Focus Dot */}
        <div className="mt-12 w-1.5 h-1.5 rounded-full bg-white/30" />
      </div>
    </div>
  );
}

export default VoidTheme;
