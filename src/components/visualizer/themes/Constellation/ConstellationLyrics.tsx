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

interface VisibleWordEntry {
  idx: number;
  opacity: number;
  isActive: boolean;
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
  // Self-contained display state tracker derived directly from the authoritative playback clock.
  // CRITICAL V3 RULE: Only current active word (and immediately preceding word during transit) are ever rendered.
  // Future words are 100% invisible!
  const [visibleEntries, setVisibleEntries] = useState<VisibleWordEntry[]>([]);

  useEffect(() => {
    let animId: number;

    const checkWordIndex = () => {
      const { currentTimeMs, syncOffsetMs } = usePlayerStore.getState();
      const effectiveTimeMs = currentTimeMs + syncOffsetMs;
      const activeIdx = findActiveWordIndex(words, effectiveTimeMs);

      if (activeIdx === -1 || !words || words.length === 0) {
        setVisibleEntries([]);
        animId = requestAnimationFrame(checkWordIndex);
        return;
      }

      if (activeIdx === 0) {
        // Stage 1: Only the first word is visible. Zero future words rendered!
        setVisibleEntries([{ idx: 0, opacity: 1.0, isActive: true }]);
        animId = requestAnimationFrame(checkWordIndex);
        return;
      }

      // Stage 2 & 3: Active transition between activeIdx - 1 and activeIdx
      const currWord = words[activeIdx];
      const prevWord = words[activeIdx - 1];
      const deltaT = currWord.startMs - prevWord.startMs;
      const transitSpan = Math.min(480, Math.max(180, deltaT * 0.45));
      const transitStart = currWord.startMs - transitSpan * 0.65;
      const transitEnd = currWord.startMs + transitSpan * 0.35;

      const entries: VisibleWordEntry[] = [];

      if (effectiveTimeMs < transitStart) {
        // Pre-flight: Previous word is resting and active; current destination word is COMPLETELY INVISIBLE
        entries.push({ idx: activeIdx - 1, opacity: 1.0, isActive: true });
      } else if (effectiveTimeMs >= transitEnd) {
        // Arrival: Shooting star has reached destination. Current word is 100% active, previous is gone.
        entries.push({ idx: activeIdx, opacity: 1.0, isActive: true });
      } else {
        // In-flight: Shooting star is travelling.
        const u = Math.max(0, Math.min(1, (effectiveTimeMs - transitStart) / (transitEnd - transitStart)));
        // Previous word gradually fades away
        const prevOpacity = Math.max(0, 1 - u * 1.5);
        if (prevOpacity > 0.05) {
          entries.push({ idx: activeIdx - 1, opacity: prevOpacity, isActive: false });
        }
        // Destination word only reveals as the shooting star reaches destination (u > 0.82)
        if (u > 0.82) {
          const currOpacity = Math.min(1, (u - 0.82) / 0.18);
          entries.push({ idx: activeIdx, opacity: currOpacity, isActive: true });
        }
      }

      setVisibleEntries(entries);
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
          {visibleEntries.map(({ idx, opacity, isActive }) => {
            const word = words[idx];
            const node = nodes[idx];
            if (!word || !node) return null;

            return (
              <ConstellationWord
                key={word.id}
                word={word}
                node={node}
                isActive={isActive}
                opacity={opacity}
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
