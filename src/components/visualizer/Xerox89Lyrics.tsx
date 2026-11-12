'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { LyricLine } from '@/lib/lrclib';
import { analyzeLyricLine, TokenizedWord } from '@/components/visualizer/keywordPuncher';

export interface Xerox89LyricsProps {
  className?: string;
  customLyrics?: LyricLine[];
  onLineClick?: (timeMs: number) => void;
}

/**
 * 1-Bit Floyd-Steinberg error diffusion dither algorithm
 */
function applyFloydSteinbergDither(imageData: ImageData, contrast = 1.3): ImageData {
  const { width, height, data } = imageData;
  const gray = new Float32Array(width * height);

  // Convert to normalized grayscale with contrast adjustment
  for (let i = 0; i < data.length; i += 4) {
    const idx = i / 4;
    let lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    // Contrast boost
    lum = ((lum / 255 - 0.5) * contrast + 0.5) * 255;
    gray[idx] = Math.max(0, Math.min(255, lum));
  }

  // Error diffusion loop
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const oldPixel = gray[idx];
      const newPixel = oldPixel < 128 ? 0 : 255;
      gray[idx] = newPixel;
      const err = oldPixel - newPixel;

      if (x + 1 < width) {
        gray[idx + 1] += err * (7 / 16);
      }
      if (x - 1 >= 0 && y + 1 < height) {
        gray[idx + width - 1] += err * (3 / 16);
      }
      if (y + 1 < height) {
        gray[idx + width] += err * (5 / 16);
      }
      if (x + 1 < width && y + 1 < height) {
        gray[idx + width + 1] += err * (1 / 16);
      }
    }
  }

  // Write back 1-bit monochrome pixels
  for (let i = 0; i < data.length; i += 4) {
    const val = gray[i / 4] > 127 ? 250 : 10;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    data[i + 3] = 255;
  }

  return imageData;
}

/**
 * Generates deterministic ransom-note styling based on word content & index
 */
function getRansomStyle(word: string, index: number, isPunch: boolean) {
  const hash = (word.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + index * 17) % 5;
  const rotation = ((index * 37) % 7) - 3; // -3 to +3 deg
  const skew = ((index * 19) % 5) - 2;

  switch (hash) {
    case 0:
      // Inverted tape block
      return {
        containerClass:
          'bg-black text-white px-3 sm:px-4 py-1 sm:py-1.5 font-mono font-black uppercase tracking-widest shadow-[3px_3px_0px_#fff]',
        rotation,
        skew,
        fontSize: isPunch ? 'text-4xl sm:text-6xl md:text-7xl' : 'text-2xl sm:text-4xl md:text-5xl',
      };
    case 1:
      // Typewriter off-white slip
      return {
        containerClass:
          'bg-[#EAE5D8] text-black px-2.5 sm:px-3.5 py-0.5 sm:py-1 font-mono font-bold tracking-tight border-2 border-black shadow-[4px_4px_0px_#000]',
        rotation: -rotation,
        skew: -skew,
        fontSize: isPunch ? 'text-4xl sm:text-6xl md:text-7xl' : 'text-2xl sm:text-4xl md:text-5xl',
      };
    case 2:
      // Editorial gothic cutout
      return {
        containerClass:
          'bg-white text-black px-3 sm:px-4 py-1 sm:py-2 font-serif font-black uppercase tracking-normal border-2 border-black shadow-[3px_3px_0px_rgba(255,255,255,0.7)]',
        rotation: rotation * 0.8,
        skew,
        fontSize: isPunch ? 'text-4xl sm:text-6xl md:text-7xl' : 'text-2xl sm:text-4xl md:text-5xl',
      };
    case 3:
      // Signal red distress scrap
      return {
        containerClass:
          'bg-[#E50000] text-white px-2.5 sm:px-3.5 py-0.5 sm:py-1 font-sans font-black uppercase tracking-tighter shadow-[3px_3px_0px_#000]',
        rotation: -rotation * 1.1,
        skew: -skew,
        fontSize: isPunch ? 'text-4xl sm:text-6xl md:text-7xl' : 'text-2xl sm:text-4xl md:text-5xl',
      };
    default:
      // Heavy Xerox reverse border
      return {
        containerClass:
          'bg-black text-[#F4F4F4] px-3 sm:px-4 py-1 sm:py-1.5 font-mono font-bold uppercase tracking-wider border border-white/60 shadow-[4px_4px_0px_#fff]',
        rotation: rotation * 0.5,
        skew: 0,
        fontSize: isPunch ? 'text-4xl sm:text-6xl md:text-7xl' : 'text-2xl sm:text-4xl md:text-5xl',
      };
  }
}

export function Xerox89Lyrics({
  className = '',
  customLyrics,
  onLineClick,
}: Xerox89LyricsProps) {
  const storeLyrics = usePlayerStore((s) => s.lyrics);
  const activeLineIndex = usePlayerStore((s) => s.activeLineIndex);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const lyrics = customLyrics || storeLyrics;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const prevLineIndexRef = useRef(-1);

  // Trigger 120ms scanner sweep on lyric transition
  useEffect(() => {
    if (activeLineIndex >= 0 && activeLineIndex !== prevLineIndexRef.current) {
      prevLineIndexRef.current = activeLineIndex;
      setIsScanning(true);
      const timer = setTimeout(() => {
        setIsScanning(false);
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [activeLineIndex]);

  // Floyd-Steinberg canvas background rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentTrack.albumArt) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentTrack.albumArt;

    img.onload = () => {
      // Downsample to 280x280 for authentic retro copy resolution
      const targetW = 280;
      const targetH = Math.round((280 * canvas.height) / (canvas.width || 1)) || 280;

      const offscreen = document.createElement('canvas');
      offscreen.width = targetW;
      offscreen.height = targetH;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;

      offCtx.drawImage(img, 0, 0, targetW, targetH);
      const imgData = offCtx.getImageData(0, 0, targetW, targetH);
      const dithered = applyFloydSteinbergDither(imgData, 1.4);
      offCtx.putImageData(dithered, 0, 0);

      // Upscale cleanly with nearest-neighbor
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);
    };
  }, [currentTrack.albumArt]);

  // Analyzed current and neighbor lines
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
      className={`fixed inset-0 w-screen h-screen overflow-hidden bg-[#0A0A0A] flex items-center justify-center select-none ${className}`}
    >
      {/* 1. Floyd-Steinberg 1-Bit Dithered Album Art Backdrop */}
      <canvas
        ref={canvasRef}
        width={560}
        height={560}
        className="absolute inset-0 w-full h-full object-cover opacity-20 filter contrast-200 grayscale pointer-events-none"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* 2. Photocopy Grain, Halftone Dots & Paper Creases Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 mix-blend-screen"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)`,
          backgroundSize: '4px 4px',
        }}
      />
      <div className="absolute inset-0 pointer-events-none border-[12px] border-black/80 shadow-[inset_0_0_80px_rgba(0,0,0,0.95)]" />

      {/* 3. 120ms Vertical White Scanner Sweep Line & Horizontal Pixel Drag */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ top: '-10%', opacity: 1 }}
            animate={{ top: '110%', opacity: [1, 0.9, 0.4] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: 'linear' }}
            className="absolute left-0 right-0 h-20 bg-gradient-to-b from-transparent via-white to-transparent shadow-[0_0_60px_#ffffff] z-30 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* 4. Ransom-Note Kinetic Typography Stage */}
      <div
        className={`relative z-20 max-w-5xl px-6 py-12 flex flex-col items-center justify-center text-center transition-transform duration-75 ${
          isScanning ? 'skew-x-[-7deg] translate-x-3 filter blur-[0.6px]' : 'skew-x-0 translate-x-0'
        }`}
      >
        {/* Previous Lyric Line (Fading Decay) */}
        {prevLine && (
          <div className="mb-6 opacity-25 filter blur-[1px] transform scale-90 select-none pointer-events-none">
            <span className="font-mono text-xs sm:text-sm uppercase tracking-widest text-neutral-400 bg-black/60 px-3 py-1 border border-white/20">
              {prevLine}
            </span>
          </div>
        )}

        {/* Active Ransom-Note Lyric Line */}
        <AnimatePresence mode="wait">
          {currentLine && currentLine.words.length > 0 ? (
            <motion.div
              key={`xerox-${activeLineIndex}`}
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: -15 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4.5 max-w-4xl"
            >
              {currentLine.words.map((w: TokenizedWord, idx: number) => {
                const style = getRansomStyle(w.cleaned, idx, w.isPunch);

                return (
                  <motion.div
                    key={w.id}
                    initial={{ opacity: 0, y: 12, rotate: style.rotation * 2 }}
                    animate={{ opacity: 1, y: 0, rotate: style.rotation }}
                    transition={{
                      delay: idx * 0.03,
                      duration: 0.2,
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                    }}
                    style={{
                      transform: `rotate(${style.rotation}deg) skewX(${style.skew}deg)`,
                    }}
                    onClick={() => {
                      if (onLineClick && activeLineIndex >= 0) {
                        onLineClick(lyrics[activeLineIndex].timeMs);
                      }
                    }}
                    className={`${style.containerClass} ${style.fontSize} cursor-pointer hover:scale-105 active:scale-95 transition-transform pointer-events-auto`}
                  >
                    <span>{w.raw}</span>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-500 bg-black/80 px-4 py-2 border border-white/10">
              [ XEROX 1989 // READY ]
            </div>
          )}
        </AnimatePresence>

        {/* Bottom Vintage Stamp */}
        <div className="mt-8 flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.25em] text-neutral-400 opacity-60">
          <span>COPIER ID: 89-FS1</span>
          <span>•</span>
          <span>DITHER: FLOYD-STEINBERG 1-BIT</span>
          <span>•</span>
          <span>CONTRAST: MAX</span>
        </div>
      </div>
    </div>
  );
}

export default Xerox89Lyrics;
