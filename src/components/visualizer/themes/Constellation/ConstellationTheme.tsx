'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { VisualizerThemeProps } from '../ThemeRegistry';
import { estimateWordTimings, LyricWord } from './wordTimingEngine';
import { generateNodeLayout } from './constellationLayout';
import { resolvePaletteFromTrack, ConstellationPalette } from './paletteExtractor';
import { ConstellationCanvas } from './ConstellationCanvas';
import { ConstellationLyrics } from './ConstellationLyrics';

export const ConstellationTheme: React.FC<VisualizerThemeProps> = ({
  lyrics = [],
  onLineClick,
  className = '',
  isStoryMode = false,
}) => {
  const activeLineIndex = usePlayerStore((s) => s.activeLineIndex);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const prefersReducedMotion = useReducedMotion() ?? false;

  // Viewport dimensions with dynamic listener
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = dimensions.height < 700 || dimensions.width < 600;

  // Track-adaptive palette resolution
  const palette: ConstellationPalette = useMemo(() => {
    return resolvePaletteFromTrack(currentTrack.palette);
  }, [currentTrack.palette]);

  // Current active lyric line and next line
  const currentLine = activeLineIndex >= 0 && activeLineIndex < lyrics.length ? lyrics[activeLineIndex] : null;
  const nextLine = activeLineIndex + 1 < lyrics.length ? lyrics[activeLineIndex + 1] : null;

  // Word timing breakdown
  const words: LyricWord[] = useMemo(() => {
    if (!currentLine) return [];
    return estimateWordTimings(currentLine, nextLine ? nextLine.timeMs : undefined, currentTrack.durationMs);
  }, [currentLine, nextLine, currentTrack.durationMs]);

  // Spatial node coordinates distributed across usable visual stage
  const nodes = useMemo(() => {
    if (words.length === 0) return [];
    return generateNodeLayout(words, dimensions.width, dimensions.height, currentLine ? currentLine.timeMs : 0);
  }, [words, dimensions.width, dimensions.height, currentLine]);

  return (
    <div
      className={`fixed inset-0 w-screen h-screen overflow-hidden select-none pointer-events-none ${className}`}
      style={{
        backgroundColor: palette.bgBase,
      }}
    >
      {/* 1. Track-Adaptive Ambient Starlight Atmosphere Glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-1000 -z-10"
        style={{
          background: `radial-gradient(ellipse at 50% 48%, ${palette.bgAtmosphere} 0%, transparent 75%)`,
        }}
      />

      {/* 2. Decoupled 60fps HTML5 Canvas (Stars, Shooting Star, Hairlines, Bezel) */}
      <ConstellationCanvas
        nodes={nodes}
        words={words}
        palette={palette}
        prefersReducedMotion={prefersReducedMotion}
      />

      {/* 3. High-Contrast Accessible DOM Typography Layer (NT Lamore) */}
      <ConstellationLyrics
        words={words}
        nodes={nodes}
        activeLineIndex={activeLineIndex}
        palette={palette}
        isMobile={isMobile}
        prefersReducedMotion={prefersReducedMotion}
        onLineClick={onLineClick}
      />
    </div>
  );
};
