'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { VisualizerThemeProps } from './ThemeRegistry';
import { formatTime } from '@/lib/utils';
import { analyzeLyricLine } from '@/components/visualizer/keywordPuncher';

export function VhsMemory({ lyrics: propLyrics, onLineClick, className = '', isStoryMode = false }: VisualizerThemeProps) {
  const storeLyrics = usePlayerStore((s) => s.lyrics);
  const activeLineIndex = usePlayerStore((s) => s.activeLineIndex);
  const currentTimeMs = usePlayerStore((s) => s.currentTimeMs);
  const lyrics = propLyrics || storeLyrics;

  const currentLine = useMemo(() => {
    if (activeLineIndex < 0 || activeLineIndex >= lyrics.length) return null;
    return analyzeLyricLine(lyrics[activeLineIndex].text);
  }, [lyrics, activeLineIndex]);

  const prevLine = useMemo(() => {
    if (activeLineIndex <= 0 || activeLineIndex - 1 >= lyrics.length) return null;
    return lyrics[activeLineIndex - 1].text;
  }, [lyrics, activeLineIndex]);

  // Simulated VHS timecode
  const hours = Math.floor(currentTimeMs / 3600000);
  const mins = Math.floor((currentTimeMs % 3600000) / 60000);
  const secs = Math.floor((currentTimeMs % 60000) / 1000);
  const frames = Math.floor((currentTimeMs % 1000) / 33);
  const vhsTimecode = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;

  return (
    <div
      className={`fixed inset-0 w-screen h-screen overflow-hidden bg-[#0A0D14] flex flex-col justify-between select-none font-mono ${className} ${
        isStoryMode ? 'p-8' : 'p-6 sm:p-10'
      }`}
    >
      {/* 1. VHS Analog Tape Noise, Tracking Ripple & Color Bleed Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 mix-blend-screen"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.6) 0px, rgba(0,0,0,0.6) 1px, transparent 1px, transparent 3px)',
          backgroundSize: '100% 3px',
        }}
      />
      {/* Tape edge vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]" />

      {/* 2. Camcorder OSD Telemetry Bar (Top) */}
      <div className="w-full flex items-center justify-between text-xs tracking-widest text-[#E0E0E0] pointer-events-none z-10">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
          <span className="font-bold text-white tracking-widest">● REC</span>
          <span className="text-neutral-400">SP</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-yellow-300 font-bold">PLAY ▶</span>
          <span>{vhsTimecode}</span>
        </div>
      </div>

      {/* 3. Subtitle Lyric Stage (Bottom Third Center) */}
      <div className="my-auto w-full max-w-4xl mx-auto flex flex-col items-center justify-center text-center relative z-20">
        {/* Ghosted Previous Line */}
        {prevLine && (
          <div className="mb-4 opacity-30 select-none pointer-events-none">
            <span
              className="text-xs sm:text-sm tracking-wide text-neutral-300"
              style={{
                textShadow: '2px 2px 0px #000, -1px 0 2px rgba(255,0,0,0.5)',
              }}
            >
              {prevLine}
            </span>
          </div>
        )}

        {/* Current Line: Authentic Faded Yellow Closed Captioning Subtitle */}
        <AnimatePresence mode="wait">
          {currentLine && currentLine.words.length > 0 ? (
            <motion.div
              key={`vhs-${activeLineIndex}`}
              initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-2"
            >
              {currentLine.words.map((w, idx) => (
                <span
                  key={w.id}
                  onClick={() => {
                    if (onLineClick && activeLineIndex >= 0) {
                      onLineClick(lyrics[activeLineIndex].timeMs);
                    }
                  }}
                  className="cursor-pointer pointer-events-auto text-2xl sm:text-4xl md:text-5xl font-bold tracking-normal uppercase"
                  style={{
                    color: '#FFF8B0', // Faded vintage VHS yellow
                    WebkitTextStroke: '2px #000000',
                    textShadow: '3px 3px 0px #000000, -2px 0 3px rgba(0,255,200,0.4), 2px 0 3px rgba(255,0,100,0.4)',
                  }}
                >
                  {w.raw}
                </span>
              ))}
            </motion.div>
          ) : (
            <div className="text-sm font-bold tracking-widest text-neutral-400 bg-black/60 px-4 py-2 border border-neutral-700">
              [ AUTO TRACKING // CH 03 ]
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Camcorder Bottom Bar (Tape Counter & Date) */}
      <div className="w-full flex items-center justify-between text-[10px] tracking-widest text-[#E0E0E0] pointer-events-none z-10">
        <span>TAPE: VHS-C 90 MIN</span>
        <div className="flex items-center gap-4">
          <span>SEP. 14 1994</span>
          <span className="text-neutral-400">CH-1 MONO</span>
        </div>
      </div>
    </div>
  );
}

export default VhsMemory;
