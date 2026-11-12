'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { VisualizerThemeProps } from './ThemeRegistry';
import { analyzeLyricLine, TokenizedWord } from '@/components/visualizer/keywordPuncher';

export function RiotZone({ lyrics: propLyrics, onLineClick, className = '', isStoryMode = false }: VisualizerThemeProps) {
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
      className={`fixed inset-0 w-screen h-screen overflow-hidden bg-[#141414] text-white flex items-center justify-center select-none font-mono ${className} ${
        isStoryMode ? 'p-8' : 'p-6 sm:p-12'
      }`}
    >
      {/* 1. Photocopier Grit, Halftone Noise & Torn Paper Scraps */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '5px 5px',
        }}
      />
      <div className="absolute inset-0 pointer-events-none border-[14px] border-[#0A0A0A] shadow-[inset_0_0_80px_rgba(0,0,0,0.9)]" />

      {/* 2. Top Punk Banner Stamp */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between text-xs font-mono tracking-widest text-[#E60000] uppercase pointer-events-none z-10">
        <span className="bg-black px-2 py-0.5 border border-red-600/50 font-black">RIOT ZONE // ZINE VOL. 04</span>
        <span className="text-white bg-[#E60000] px-2 py-0.5 font-bold">UNDERGROUND DIY</span>
      </div>

      {/* 3. Collage Typography Stage */}
      <div className="relative z-20 max-w-5xl px-6 flex flex-col items-center justify-center text-center">
        {/* Previous Line (Torn Tape Scrap) */}
        {prevLine && (
          <div className="mb-6 opacity-35 select-none pointer-events-none transform -rotate-1">
            <span className="bg-black/90 text-neutral-300 px-3 py-1 text-xs sm:text-sm uppercase tracking-wider border-b-2 border-red-600">
              {prevLine}
            </span>
          </div>
        )}

        {/* Current Line: Physical Slapped Paper Cutout Badges */}
        <AnimatePresence mode="wait">
          {currentLine && currentLine.words.length > 0 ? (
            <motion.div
              key={`riot-${activeLineIndex}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-5 max-w-4xl"
            >
              {currentLine.words.map((w: TokenizedWord, idx: number) => {
                const isPunch = w.isPunch;
                const rotation = ((idx * 29) % 9) - 4; // -4 to +4 deg
                const isRedBadge = idx % 3 === 0 || isPunch;

                return (
                  <motion.div
                    key={w.id}
                    initial={{ opacity: 0, y: 15, rotate: rotation * 2 }}
                    animate={{ opacity: 1, y: 0, rotate: rotation }}
                    transition={{
                      delay: idx * 0.03,
                      type: 'spring',
                      stiffness: 350,
                      damping: 18,
                    }}
                    style={{ transform: `rotate(${rotation}deg)` }}
                    onClick={() => {
                      if (onLineClick && activeLineIndex >= 0) {
                        onLineClick(lyrics[activeLineIndex].timeMs);
                      }
                    }}
                    className={`relative cursor-pointer pointer-events-auto transition-transform hover:scale-105 active:scale-95 ${
                      isRedBadge
                        ? 'bg-[#E60000] text-white px-3 sm:px-4 py-1 sm:py-1.5 shadow-[4px_4px_0px_#000]'
                        : 'bg-[#F4EFE6] text-black px-3 sm:px-4 py-1 sm:py-1.5 shadow-[4px_4px_0px_#000]'
                    } ${
                      isPunch
                        ? 'text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter'
                        : 'text-3xl sm:text-5xl md:text-6xl font-extrabold uppercase tracking-tight'
                    }`}
                  >
                    {/* Simulated Masking Tape Piece */}
                    <div className="absolute -top-2 left-2 w-5 h-2 bg-yellow-200/50 -rotate-6 pointer-events-none" />
                    <span>{w.raw}</span>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-[#E60000] bg-black px-4 py-2 border-2 border-red-600">
              [ RIOT ZONE // NO RESTRAINT ]
            </div>
          )}
        </AnimatePresence>

        {/* Bottom Rebel Stamp */}
        <div className="mt-8 flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.25em] text-neutral-400">
          <span>OFFSET: PUNK PRESS</span>
          <span>•</span>
          <span>GRAIN: 100% TONER</span>
          <span>•</span>
          <span>CUT: PHYSICAL</span>
        </div>
      </div>
    </div>
  );
}

export default RiotZone;
