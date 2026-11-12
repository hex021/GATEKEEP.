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
}

export const ConstellationLyrics: React.FC<ConstellationLyricsProps> = ({
  words,
  nodes,
  activeLineIndex,
  palette,
  isMobile,
  prefersReducedMotion = false,
  onLineClick,
}) => {
  const [activeWordIndex, setActiveWordIndex] = useState<number>(0);

  // Self-contained discrete active-word index tracker:
  // Derived directly from the authoritative playback clock (usePlayerStore)
  // WITHOUT triggering parent component updates during render!
  useEffect(() => {
    let animId: number;

    const checkWordIndex = () => {
      const { currentTimeMs, syncOffsetMs } = usePlayerStore.getState();
      const effectiveTimeMs = currentTimeMs + syncOffsetMs;
      const nextIdx = findActiveWordIndex(words, effectiveTimeMs);

      setActiveWordIndex((prev) => (prev !== nextIdx ? nextIdx : prev));
      animId = requestAnimationFrame(checkWordIndex);
    };

    animId = requestAnimationFrame(checkWordIndex);
    return () => cancelAnimationFrame(animId);
  }, [words]);

  if (!words || words.length === 0 || nodes.length === 0 || activeLineIndex === -1) {
    return null;
  }

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={`phrase-${activeLineIndex}-${words[0]?.id || 0}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
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
                isPast={idx < activeWordIndex}
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
