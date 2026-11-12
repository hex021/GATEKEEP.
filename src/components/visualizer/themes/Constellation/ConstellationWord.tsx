'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LyricWord } from './wordTimingEngine';
import { StarNode } from './constellationGeometry';
import { ConstellationPalette } from './paletteExtractor';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { getAudioEnergy } from '@/lib/audioAnalysis';

interface ConstellationWordProps {
  word: LyricWord;
  node: StarNode;
  isActive: boolean;
  isPast?: boolean;
  opacity?: number;
  palette: ConstellationPalette;
  isMobile: boolean;
  prefersReducedMotion?: boolean;
  onClick?: (timeMs: number) => void;
}

export const ConstellationWord: React.FC<ConstellationWordProps> = ({
  word,
  node,
  isActive,
  isPast = false,
  opacity,
  palette,
  isMobile,
  prefersReducedMotion = false,
  onClick,
}) => {
  // Editorial casing: capitalize initial pronoun "I" and sentence starts
  const formattedText =
    word.text.length === 1 && word.text.toLowerCase() === 'i'
      ? 'I'
      : word.text.startsWith("I'") || word.text.startsWith("I’")
      ? 'I' + word.text.slice(1).toLowerCase()
      : word.text.toLowerCase();

  // Part 11.B: Audio-Reactive Typography with Smooth Moving Average
  const [audioScale, setAudioScale] = useState(1.0);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  useEffect(() => {
    if (!isActive || prefersReducedMotion) {
      setAudioScale(1.0);
      return;
    }

    let animId: number;
    let smoothed = 1.0;

    const trackAudioEnergy = () => {
      const energy = getAudioEnergy(isPlaying);
      // Intensity signal weighted towards bass and overall amplitude
      const intensity = energy.overall * 0.6 + energy.bass * 0.4;
      // Controlled dynamic multiplier: soft ~0.90x, normal 1.0x, peak ~1.18x (Part 11.B2)
      const target = 0.90 + intensity * 0.28;
      smoothed += (target - smoothed) * 0.14; // smooth fluid easing
      setAudioScale(smoothed);
      animId = requestAnimationFrame(trackAudioEnergy);
    };

    animId = requestAnimationFrame(trackAudioEnergy);
    return () => cancelAnimationFrame(animId);
  }, [isActive, isPlaying, prefersReducedMotion]);

  // Combine baseline scale, audio-reactive intensity, and word-level artistic nuance (Part 11.B3)
  const wordNuance = node.scaleFactor || 1.0;
  const baseScale = isMobile ? 1.25 : 1.45;
  const activeScale = baseScale * audioScale * wordNuance;
  const finalScale = isActive ? activeScale : isPast ? 0.95 : 0.92;

  // Resolved opacity: explicit prop takes precedence, else 1.0 for active, 0.0 for past/future
  const targetOpacity = opacity !== undefined ? opacity : isActive ? 1.0 : 0.0;

  return (
    <motion.div
      className="absolute pointer-events-auto cursor-pointer select-none origin-top -translate-x-1/2"
      style={{
        left: node.baseX,
        top: node.baseY + 18,
      }}
      initial={false}
      animate={{
        scale: finalScale,
        opacity: targetOpacity,
        y: isActive ? 4 : 0,
      }}
      transition={
        prefersReducedMotion
          ? { duration: 0.1 }
          : { type: 'spring', stiffness: 240, damping: 24, mass: 0.8 }
      }
      onClick={() => onClick?.(word.startMs)}
    >
      <span
        className={`font-sans tracking-wide transition-colors duration-200 block text-center max-w-[85vw] truncate ${
          isActive
            ? isMobile
              ? 'text-3xl font-bold tracking-tight'
              : 'text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight'
            : isMobile
            ? 'text-sm font-medium'
            : 'text-base md:text-lg lg:text-xl font-medium'
        }`}
        style={{
          color: isActive ? palette.textActive : palette.textInactive,
          textShadow: isActive
            ? `0 0 24px ${palette.textActive}aa, 0 0 48px ${palette.textActive}55, 0 2px 10px rgba(0,0,0,0.8)`
            : '0 1px 4px rgba(0,0,0,0.6)',
        }}
      >
        {formattedText}
      </span>
    </motion.div>
  );
};
