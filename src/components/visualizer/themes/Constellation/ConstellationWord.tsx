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
  // Editorial casing: capitalize initial pronoun "I" and sentence starts
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
        top: node.baseY + 18,
      }}
      initial={false}
      animate={{
        scale: isActive ? (isMobile ? 1.25 : 1.45) : isPast ? 0.95 : 0.92,
        opacity: isActive ? 1.0 : isPast ? 0.72 : 0.65,
        y: isActive ? 4 : 0,
      }}
      transition={
        prefersReducedMotion
          ? { duration: 0.1 }
          : { type: 'spring', stiffness: 260, damping: 22, mass: 0.8 }
      }
      onClick={() => onClick?.(word.startMs)}
    >
      <span
        className={`font-sans tracking-wide transition-colors duration-200 block text-center whitespace-nowrap ${
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
