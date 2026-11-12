'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { LyricWord, findActiveWordIndex } from './wordTimingEngine';
import { StarNode } from './constellationGeometry';
import { ConstellationWord } from './ConstellationWord';
import { ConstellationPalette } from './paletteExtractor';

interface ConstellationLyricsProps {
  words: LyricWord[];
  nodes: StarNode[];
  activeLineIndex: number;
  palette: ConstellationPalette;
  isMobile: boolean;
  prefersReducedMotion?: boolean;
  onLineClick?: (timeMs: number) => void;
  onActiveWordChange?: (wordIndex: number) => void;
}

export const ConstellationLyrics: React.FC<ConstellationLyricsProps> = ({
  words,
  nodes,
  activeLineIndex,
  palette,
  isMobile,
  prefersReducedMotion = false,
  onLineClick,
  onActiveWordChange,
}) => {
  const [activeWordIndex, setActiveWordIndex] = useState<number>(-1);

  // Discrete Word-Index Tracker: Polls store state without causing React 60fps cascades.
  // Re-renders React ONLY when the active singing word index changes!
  useEffect(() => {
    let animId: number;

    const checkWordIndex = () => {
      const { currentTimeMs } = usePlayerStore.getState();
      const currentIdx = findActiveWordIndex(words, currentTimeMs);

      setActiveWordIndex((prev) => {
        if (prev !== currentIdx) {
          onActiveWordChange?.(currentIdx);
          return currentIdx;
        }
        return prev;
      });

      animId = requestAnimationFrame(checkWordIndex);
    };

    animId = requestAnimationFrame(checkWordIndex);
    return () => cancelAnimationFrame(animId);
  }, [words, onActiveWordChange]);

  if (!words || words.length === 0 || nodes.length === 0 || activeLineIndex === -1) {
    return null;
  }

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={`phrase-${activeLineIndex}-${words[0]?.id || 0}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.15 }
              : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
          }
          className="relative w-full h-full"
        >
          {words.map((word, idx) => {
            const node = nodes[idx];
            if (!node) return null;

            return (
              <ConstellationWord
                key={word.id}
                word={word}
                node={node}
                isActive={idx === activeWordIndex}
                isPast={activeWordIndex !== -1 && idx < activeWordIndex}
                palette={palette}
                isMobile={isMobile}
                prefersReducedMotion={prefersReducedMotion}
                onClick={onLineClick}
              />
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
