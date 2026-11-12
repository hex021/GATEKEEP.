'use client';

import React, { useMemo, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { VisualizerThemeProps } from './ThemeRegistry';
import { analyzeLyricLine, TokenizedWord } from '@/components/visualizer/keywordPuncher';

export function LiquidType({ lyrics: propLyrics, onLineClick, className = '', isStoryMode = false }: VisualizerThemeProps) {
  const storeLyrics = usePlayerStore((s) => s.lyrics);
  const activeLineIndex = usePlayerStore((s) => s.activeLineIndex);
  const lyrics = propLyrics || storeLyrics;

  const [isViscousStretch, setIsViscousStretch] = useState(false);
  const prevLineIndexRef = useRef(-1);

  // Viscous fluid stretch impulse on line transition
  useEffect(() => {
    if (activeLineIndex >= 0 && activeLineIndex !== prevLineIndexRef.current) {
      prevLineIndexRef.current = activeLineIndex;
      setIsViscousStretch(true);
      const timer = setTimeout(() => {
        setIsViscousStretch(false);
      }, 400);
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
      className={`fixed inset-0 w-screen h-screen overflow-hidden bg-[#06020D] text-white flex items-center justify-center select-none font-sans ${className} ${
        isStoryMode ? 'p-8' : 'p-6 sm:p-12'
      }`}
    >
      {/* 1. Global Inline SVG Caustic Ripple Filter */}
      <svg className="hidden">
        <defs>
          <filter id="liquid-displacement-filter" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={isViscousStretch ? '0.035 0.04' : '0.015 0.02'}
              numOctaves="3"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={isViscousStretch ? 22 : 6}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* 2. Fluid Dark Caustic Backdrop */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(168,85,247,0.2) 0%, transparent 70%)',
        }}
      />

      {/* 3. Liquid Typographic Stage */}
      <div className="relative z-20 max-w-5xl px-6 flex flex-col items-center justify-center text-center">
        {/* Previous Line (Dissolving Viscous Echo) */}
        {prevLine && (
          <div className="mb-6 opacity-30 select-none pointer-events-none">
            <span className="font-sans text-xs sm:text-sm uppercase tracking-widest text-purple-300">
              {prevLine}
            </span>
          </div>
        )}

        {/* Current Line: Organic Stretching Typography */}
        <AnimatePresence mode="wait">
          {currentLine && currentLine.words.length > 0 ? (
            <motion.div
              key={`liquid-${activeLineIndex}`}
              initial={{ opacity: 0, scale: 0.85, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.15, y: -25 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ filter: 'url(#liquid-displacement-filter)' }}
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 md:gap-6 max-w-4xl"
            >
              {currentLine.words.map((w: TokenizedWord, idx: number) => {
                const isPunch = w.isPunch;

                return (
                  <motion.div
                    key={w.id}
                    initial={{ opacity: 0, scaleY: 0.6 }}
                    animate={{
                      opacity: 1,
                      scaleY: isViscousStretch ? 1.25 : 1.0,
                      skewX: isViscousStretch ? (idx % 2 === 0 ? -4 : 4) : 0,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 260,
                      damping: 18,
                      delay: idx * 0.03,
                    }}
                    onClick={() => {
                      if (onLineClick && activeLineIndex >= 0) {
                        onLineClick(lyrics[activeLineIndex].timeMs);
                      }
                    }}
                    className={`cursor-pointer pointer-events-auto transition-all ${
                      isPunch
                        ? 'text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-tight text-white drop-shadow-[0_0_35px_rgba(168,85,247,0.7)]'
                        : 'text-4xl sm:text-6xl md:text-7xl font-extrabold uppercase tracking-normal text-[#E9D5FF] drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                    }`}
                  >
                    <span>{w.raw}</span>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-purple-400 bg-black/60 px-4 py-2 border border-purple-500/40">
              [ LIQUID TYPE // ACTIVE FLUID ]
            </div>
          )}
        </AnimatePresence>

        {/* Bottom Fluid Status */}
        <div className="mt-8 flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.25em] text-purple-400/60">
          <span>VISCOSITY: DYNAMIC</span>
          <span>•</span>
          <span>DISPLACEMENT: SVG CAUSTIC</span>
          <span>•</span>
          <span>ELASTICITY: HIGH</span>
        </div>
      </div>
    </div>
  );
}

export default LiquidType;
