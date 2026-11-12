'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LyricWord } from './wordTimingEngine';
import { StarNode } from './constellationGeometry';
import { ConstellationPalette } from './paletteExtractor';

interface ConstellationWordProps {
  word: LyricWord;
  node: StarNode;
  isActive: boolean;
  isPast: boolean;
  palette: ConstellationPalette;
  isMobile: boolean;
  prefersReducedMotion?: boolean;
  onClick?: (timeMs: number) => void;
}

export const ConstellationWord: React.FC<ConstellationWordProps> = ({
  word,
  node,
  isActive,
  isPast,
  palette,
  isMobile,
  prefersReducedMotion = false,
  onClick,
}) => {
  // Editorial casing: lowercase except pronouns and initial sentence
  const formattedText =
    word.text.length === 1 && word.text.toLowerCase() === 'i'
      ? 'I'
      : word.text.startsWith("I'") || word.text.startsWith("I’")
      ? 'I' + word.text.slice(1).toLowerCase()
      : word.text.toLowerCase();

  return (
    <motion.div
      className="absolute pointer-events-auto cursor-pointer select-none origin-top -translate-x-1/2"
      style={{
        left: node.baseX,
        top: node.baseY + 16, // Placed directly beneath the star node
      }}
      initial={false}
      animate={{
        scale: isActive ? (isMobile ? 1.35 : 1.7) : isPast ? 0.95 : 0.9,
        opacity: isActive ? 1.0 : isPast ? 0.45 : 0.35,
        y: isActive ? 4 : 0,
      }}
      transition={
        prefersReducedMotion
          ? { duration: 0.1 }
          : { type: 'spring', stiffness: 280, damping: 24, mass: 0.8 }
      }
      onClick={() => onClick?.(word.startMs)}
    >
      <span
        className={`font-sans tracking-wide transition-colors duration-200 block text-center whitespace-nowrap ${
          isActive
            ? isMobile
              ? 'text-lg font-bold'
              : 'text-xl md:text-2xl font-bold'
            : isMobile
            ? 'text-xs font-medium'
            : 'text-sm font-medium'
        }`}
        style={{
          color: isActive ? palette.textActive : palette.textInactive,
          textShadow: isActive
            ? `0 0 16px ${palette.textActive}80, 0 0 32px ${palette.textActive}40`
            : 'none',
        }}
      >
        {formattedText}
      </span>
    </motion.div>
  );
};
