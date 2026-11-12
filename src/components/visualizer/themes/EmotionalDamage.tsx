'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { VisualizerThemeProps } from './ThemeRegistry';
import { analyzeLyricLine, TokenizedWord } from '@/components/visualizer/keywordPuncher';

export function EmotionalDamage({ lyrics: propLyrics, onLineClick, className = '', isStoryMode = false }: VisualizerThemeProps) {
  const storeLyrics = usePlayerStore((s) => s.lyrics);
  const activeLineIndex = usePlayerStore((s) => s.activeLineIndex);
  const lyrics = propLyrics || storeLyrics;

  const [isFractured, setIsFractured] = useState(false);
  const prevLineIndexRef = useRef(-1);

  // Emotional shock collapse on line transition
  useEffect(() => {
    if (activeLineIndex >= 0 && activeLineIndex !== prevLineIndexRef.current) {
      prevLineIndexRef.current = activeLineIndex;
      setIsFractured(true);
      const timer = setTimeout(() => {
        setIsFractured(false);
      }, 550);
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
      className={`fixed inset-0 w-screen h-screen overflow-hidden bg-[#080306] text-white flex items-center justify-center select-none font-sans ${className} ${
        isStoryMode ? 'p-8' : 'p-6 sm:p-14'
      }`}
    >
      {/* 1. Dissociative Deep Crimson Ambient Vignette */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(136,19,55,0.3) 0%, transparent 75%)',
        }}
      />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.95)]" />

      {/* 2. Top Emotional Status */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between text-xs font-mono tracking-widest text-rose-500/70 uppercase pointer-events-none z-10">
        <span>FRACTURED MEMORY // DISSOCIATION</span>
        <span>LEVEL: {isFractured ? 'COLLAPSED' : 'STABLE'}</span>
      </div>

      {/* 3. Psychological Fragmented Stage */}
      <div className="relative z-20 max-w-5xl px-6 flex flex-col items-center justify-center text-center">
        {/* Previous Line (Echoing Ghost) */}
        {prevLine && (
          <div className="mb-6 opacity-25 filter blur-[1px] select-none pointer-events-none">
            <span className="font-serif italic text-sm sm:text-base tracking-widest text-rose-300">
              "{prevLine}"
            </span>
          </div>
        )}

        {/* Current Line: Fragmenting Typography */}
        <AnimatePresence mode="wait">
          {currentLine && currentLine.words.length > 0 ? (
            <motion.div
              key={`damage-${activeLineIndex}`}
              initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(14px)' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 md:gap-7 max-w-4xl"
            >
              {currentLine.words.map((w: TokenizedWord, idx: number) => {
                const isPunch = w.isPunch;
                const offset = isFractured ? ((idx % 3) - 1) * 8 : 0;

                return (
                  <motion.div
                    key={w.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.2 }}
                    onClick={() => {
                      if (onLineClick && activeLineIndex >= 0) {
                        onLineClick(lyrics[activeLineIndex].timeMs);
                      }
                    }}
                    style={{ transform: `translateY(${offset}px)` }}
                    className={`cursor-pointer pointer-events-auto transition-transform hover:scale-105 active:scale-95 ${
                      isPunch
                        ? 'text-4xl sm:text-6xl md:text-8xl font-black uppercase tracking-tighter text-white drop-shadow-[0_0_30px_rgba(225,29,72,0.8)]'
                        : 'text-3xl sm:text-5xl md:text-6xl font-extrabold uppercase tracking-tight text-neutral-200'
                    }`}
                  >
                    <span>{w.raw}</span>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-rose-400 bg-black/60 px-4 py-2 border border-rose-500/40">
              [ PSYCHOLOGICAL COLLAPSE // DORMANT ]
            </div>
          )}
        </AnimatePresence>

        {/* Bottom Fragmentation Indicator */}
        <div className="mt-8 flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.25em] text-rose-400/50">
          <span>COGNITIVE: SCATTERED</span>
          <span>•</span>
          <span>INTENSITY: {isFractured ? 'MAX' : 'SUBTLE'}</span>
          <span>•</span>
          <span>ECHO: PERSISTENT</span>
        </div>
      </div>
    </div>
  );
}

export default EmotionalDamage;
