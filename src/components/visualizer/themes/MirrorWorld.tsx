'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { VisualizerThemeProps } from './ThemeRegistry';
import { analyzeLyricLine, TokenizedWord } from '@/components/visualizer/keywordPuncher';

export function MirrorWorld({ lyrics: propLyrics, onLineClick, className = '', isStoryMode = false }: VisualizerThemeProps) {
  const storeLyrics = usePlayerStore((s) => s.lyrics);
  const activeLineIndex = usePlayerStore((s) => s.activeLineIndex);
  const lyrics = propLyrics || storeLyrics;

  const currentLine = useMemo(() => {
    if (activeLineIndex < 0 || activeLineIndex >= lyrics.length) return null;
    return analyzeLyricLine(lyrics[activeLineIndex].text);
  }, [lyrics, activeLineIndex]);

  return (
    <div
      className={`fixed inset-0 w-screen h-screen overflow-hidden bg-[#04060C] text-white flex flex-col justify-center select-none font-sans ${className} ${
        isStoryMode ? 'p-8' : 'p-6 sm:p-14'
      }`}
    >
      {/* 1. Symmetrical Coordinate Waterline */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-between px-8 text-[9px] font-mono tracking-widest text-cyan-400/40 pointer-events-none z-10">
        <span>X: 0.000 // REFLECTION PLANE</span>
        <div className="flex-1 mx-4 h-[1px] bg-cyan-400/20" />
        <span>Y: SYMMETRICAL</span>
      </div>

      {/* 2. Top Half: Primary Real Typography */}
      <div className="flex-1 flex items-end justify-center pb-8 relative z-20">
        <AnimatePresence mode="wait">
          {currentLine && currentLine.words.length > 0 ? (
            <motion.div
              key={`mirror-top-${activeLineIndex}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 md:gap-6 max-w-4xl"
            >
              {currentLine.words.map((w: TokenizedWord) => (
                <span
                  key={w.id}
                  onClick={() => {
                    if (onLineClick && activeLineIndex >= 0) {
                      onLineClick(lyrics[activeLineIndex].timeMs);
                    }
                  }}
                  className={`cursor-pointer pointer-events-auto uppercase transition-transform hover:scale-105 active:scale-95 ${
                    w.isPunch
                      ? 'text-4xl sm:text-6xl md:text-7xl font-black text-white drop-shadow-[0_0_25px_rgba(56,189,248,0.7)]'
                      : 'text-3xl sm:text-5xl md:text-6xl font-extrabold text-[#E0F2FE]'
                  }`}
                >
                  {w.raw}
                </span>
              ))}
            </motion.div>
          ) : (
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-400 bg-black/60 px-4 py-2 border border-cyan-400/30">
              [ REALITY // PRIMARY ]
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Bottom Half: Mirrored Inverted Twin */}
      <div className="flex-1 flex items-start justify-center pt-8 relative z-10 opacity-30 filter blur-[0.8px] pointer-events-none select-none">
        <AnimatePresence mode="wait">
          {currentLine && currentLine.words.length > 0 && (
            <motion.div
              key={`mirror-bot-${activeLineIndex}`}
              initial={{ opacity: 0, scaleY: -1, y: -15 }}
              animate={{ opacity: 1, scaleY: -1, y: 0 }}
              exit={{ opacity: 0, scaleY: -1, y: 15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 md:gap-6 max-w-4xl"
            >
              {currentLine.words.map((w: TokenizedWord) => (
                <span
                  key={`inv-${w.id}`}
                  className={`uppercase ${
                    w.isPunch
                      ? 'text-4xl sm:text-6xl md:text-7xl font-black text-cyan-300'
                      : 'text-3xl sm:text-5xl md:text-6xl font-extrabold text-cyan-400/60'
                  }`}
                  style={{
                    textShadow: '-2px 0 rgba(255,0,100,0.5), 2px 0 rgba(0,255,200,0.5)',
                  }}
                >
                  {w.raw}
                </span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default MirrorWorld;
