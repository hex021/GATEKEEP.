'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { usePlayerStore, VisualizerMode } from '@/stores/usePlayerStore';
import { LyricLine } from '@/lib/lrclib';
import { RefreshCw, Music2, Sparkles, Layers, Terminal } from 'lucide-react';
import { VideoEditLyrics } from '@/components/visualizer/VideoEditLyrics';
import { CyberpunkLyrics } from '@/components/visualizer/CyberpunkLyrics';
import { Xerox89Lyrics } from '@/components/visualizer/Xerox89Lyrics';
import { ThermalFlirLyrics } from '@/components/visualizer/ThermalFlirLyrics';
import { Glitchcore } from '@/components/visualizer/themes/Glitchcore';
import { SwissEditorial } from '@/components/visualizer/themes/SwissEditorial';
import { VhsMemory } from '@/components/visualizer/themes/VhsMemory';
import { LiquidType } from '@/components/visualizer/themes/LiquidType';
import { VoidTheme } from '@/components/visualizer/themes/VoidTheme';
import { RiotZone } from '@/components/visualizer/themes/RiotZone';
import { Heartbreak } from '@/components/visualizer/themes/Heartbreak';
import { BouncingBall } from '@/components/visualizer/themes/BouncingBall';
import { MirrorWorld } from '@/components/visualizer/themes/MirrorWorld';
import { EmotionalDamage } from '@/components/visualizer/themes/EmotionalDamage';
import { NewspaperTheme } from '@/components/visualizer/themes/NewspaperTheme';
import { ConstellationTheme } from '@/components/visualizer/themes/Constellation/ConstellationTheme';

export { type VisualizerMode };

export const LYRIC_SPRING_CONFIG = {
  type: 'spring' as const,
  stiffness: 180,
  damping: 25,
  mass: 1,
};

export interface KineticLyricsProps {
  className?: string;
  customLyrics?: LyricLine[];
  mode?: VisualizerMode;
  onModeChange?: (mode: VisualizerMode) => void;
  showModeSwitcher?: boolean;
}

export function getLyricVisualHierarchy(
  lineIndex: number,
  activeIndex: number,
  prefersReducedMotion = false
) {
  if (activeIndex === -1) {
    return {
      scale: 1.0,
      opacity: 0.6,
      filter: 'blur(0px)',
      typographyClass: 'font-medium text-xl md:text-3xl text-white/60',
      isActive: false,
    };
  }

  const distance = Math.abs(lineIndex - activeIndex);

  if (distance === 0) {
    return {
      scale: prefersReducedMotion ? 1.0 : 1.04,
      opacity: 1.0,
      filter: 'blur(0px)',
      typographyClass:
        'font-extrabold text-3xl md:text-5xl text-white tracking-tight drop-shadow-[0_0_25px_rgba(255,255,255,0.7)]',
      isActive: true,
    };
  }

  if (distance === 1) {
    return {
      scale: prefersReducedMotion ? 1.0 : 0.98,
      opacity: 0.55,
      filter: prefersReducedMotion ? 'blur(0px)' : 'blur(1px)',
      typographyClass: 'font-semibold text-2xl md:text-4xl text-white/70',
      isActive: false,
    };
  }

  if (distance === 2) {
    return {
      scale: prefersReducedMotion ? 1.0 : 0.95,
      opacity: 0.35,
      filter: prefersReducedMotion ? 'blur(0px)' : 'blur(3px)',
      typographyClass: 'font-medium text-xl md:text-3xl text-white/40',
      isActive: false,
    };
  }

  // Distance >= 3
  return {
    scale: prefersReducedMotion ? 1.0 : 0.92,
    opacity: 0.15,
    filter: prefersReducedMotion ? 'blur(0px)' : 'blur(6px)',
    typographyClass: 'font-normal text-lg md:text-2xl text-white/20',
    isActive: false,
  };
}

export function KineticLyrics({
  className = '',
  customLyrics,
  mode: propMode,
  onModeChange,
  showModeSwitcher = true,
}: KineticLyricsProps) {
  const storeLyrics = usePlayerStore((s) => s.lyrics);
  const activeLineIndex = usePlayerStore((s) => s.activeLineIndex);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const storeVisualizerMode = usePlayerStore((s) => s.visualizerMode);
  const setVisualizerMode = usePlayerStore((s) => s.setVisualizerMode);

  const activeMode: VisualizerMode = propMode || storeVisualizerMode || 'video-edit';
  const lyrics = customLyrics || storeLyrics;
  const prefersReducedMotion = useReducedMotion() ?? false;

  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Toast notification for mode changes
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 1500);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Note: Global 'V' shortcut handler is centralized in page.tsx to prevent duplicate window listeners.
  // Specifications for page.tsx handler:
  // e.key.toLowerCase() === 'v' && !e.metaKey && !e.ctrlKey && !e.altKey
  // e.target instanceof HTMLInputElement
  // e.target instanceof HTMLTextAreaElement
  // (e.target as HTMLElement)?.isContentEditable


  // Track mode transitions for toast notification & localStorage
  const prevModeRef = useRef(activeMode);
  useEffect(() => {
    if (prevModeRef.current !== activeMode) {
      prevModeRef.current = activeMode;
      const label =
        activeMode === 'video-edit'
          ? 'Velocity 3D'
          : activeMode === 'cyberpunk'
          ? 'CRT Cathode'
          : activeMode === 'xerox-89'
          ? 'Xerox 89'
          : activeMode === 'thermal-flir'
          ? 'Thermal FLIR'
          : activeMode === 'glitchcore'
          ? 'Glitchcore'
          : activeMode === 'swiss-editorial'
          ? 'Swiss Editorial'
          : activeMode === 'vhs-memory'
          ? 'VHS Memory'
          : activeMode === 'liquid-type'
          ? 'Liquid Type'
          : activeMode === 'void'
          ? 'Void'
          : activeMode === 'riot-zone'
          ? 'Riot Zone'
          : activeMode === 'heartbreak'
          ? 'Heartbreak'
          : activeMode === 'bouncing-ball'
          ? 'Bouncing Ball'
          : activeMode === 'mirror-world'
          ? 'Mirror World'
          : activeMode === 'emotional-damage'
          ? 'Emotional Damage'
          : activeMode === 'newspaper'
          ? 'Newspaper'
          : activeMode === 'constellation'
          ? 'Constellation'
          : 'Apple Music Spatial';
      triggerToast(`Visualizer: ${label}`);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('vibesync_visualizer_mode', activeMode);
        } catch {
          // ignore storage error
        }
      }
      if (onModeChange) onModeChange(activeMode);
    }
  }, [activeMode, triggerToast, onModeChange]);

  // Center active lyric into viewport in Apple Spatial mode
  const centerActiveLine = useCallback((smooth = true) => {
    if (activeLineIndex < 0 || !lineRefs.current[activeLineIndex]) return;

    const el = lineRefs.current[activeLineIndex];
    if (el) {
      el.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'center',
      });
    }
  }, [activeLineIndex]);

  // Handle auto-centering when activeLineIndex changes in Apple Spatial mode
  useEffect(() => {
    if (activeMode === 'apple-spatial' && !isUserScrolling) {
      centerActiveLine(true);
    }
  }, [activeLineIndex, isUserScrolling, centerActiveLine, activeMode]);

  // User manual scroll detection
  const handleUserScroll = useCallback(() => {
    setIsUserScrolling(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Pause auto-centering for 3.5 seconds
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 3500);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // "Sync to Playhead" button handler
  const handleSyncToPlayhead = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
    setIsUserScrolling(false);
    centerActiveLine(true);
  }, [centerActiveLine]);

  // Click-to-seek handler
  const handleLineClick = useCallback(
    (timeMs: number) => {
      seekTo(timeMs);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
      setIsUserScrolling(false);
    },
    [seekTo]
  );

  if (!lyrics || lyrics.length === 0) {
    return (
      <div
        className={`relative w-full flex-1 flex flex-col items-center justify-center p-8 text-neutral-400 space-y-3 ${className}`}
      >
        <Music2 size={36} className="text-neutral-600 animate-pulse" />
        <p className="text-base font-medium text-neutral-300">
          Instrumental / No synced lyrics available
        </p>
        <p className="text-xs text-neutral-500">Immerse in the soundscape</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full flex-1 flex flex-col items-center justify-center ${className}`}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full bg-neutral-900/95 border border-white/20 text-white text-xs font-mono shadow-2xl backdrop-blur-xl flex items-center space-x-2 pointer-events-none"
          >
            <Sparkles size={12} className="text-cyan-400 animate-spin" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Mode Switcher Bar */}
      {showModeSwitcher && (
        <div className="absolute -top-1 sm:-top-2 right-1 sm:right-4 z-40 flex items-center space-x-1 p-1 rounded-none bg-black/60 backdrop-blur-2xl border border-white/15 shadow-xl select-none ring-1 ring-white/5">
          <button
            onClick={() => setVisualizerMode('video-edit')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-none text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'video-edit'
                ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 text-white shadow-lg shadow-violet-500/25 ring-1 ring-white/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
            title="Video Edit FX (Crazy 3D Kinetic Mode)"
          >
            <Sparkles size={12} className={activeMode === 'video-edit' ? 'animate-spin' : ''} />
            <span>Reel FX</span>
          </button>

          <button
            onClick={() => setVisualizerMode('apple-spatial')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-none text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'apple-spatial'
                ? 'bg-white/20 text-white shadow-md ring-1 ring-white/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
            title="Apple Music Spatial Mode"
          >
            <Layers size={12} />
            <span>Spatial</span>
          </button>

          <button
            onClick={() => setVisualizerMode('cyberpunk')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-none text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'cyberpunk'
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
            title="Cyberpunk Terminal Mode"
          >
            <Terminal size={12} />
            <span>Cyber</span>
          </button>

          <span className="hidden sm:inline-block font-mono text-[9px] text-neutral-400 px-1.5 py-0.5 rounded-none bg-white/10 border border-white/10">
            V
          </span>
        </div>
      )}

      {/* Render Active Visualizer Mode */}
      {activeMode === 'video-edit' && (
        <VideoEditLyrics customLyrics={lyrics} onLineClick={handleLineClick} />
      )}

      {activeMode === 'cyberpunk' && (
        <CyberpunkLyrics customLyrics={lyrics} onLineClick={handleLineClick} />
      )}

      {activeMode === 'xerox-89' && (
        <Xerox89Lyrics customLyrics={lyrics} onLineClick={handleLineClick} />
      )}

      {activeMode === 'thermal-flir' && (
        <ThermalFlirLyrics customLyrics={lyrics} onLineClick={handleLineClick} />
      )}

      {activeMode === 'glitchcore' && (
        <Glitchcore lyrics={lyrics} onLineClick={handleLineClick} />
      )}

      {activeMode === 'swiss-editorial' && (
        <SwissEditorial lyrics={lyrics} onLineClick={handleLineClick} />
      )}

      {activeMode === 'vhs-memory' && (
        <VhsMemory lyrics={lyrics} onLineClick={handleLineClick} />
      )}

      {activeMode === 'liquid-type' && (
        <LiquidType lyrics={lyrics} onLineClick={handleLineClick} />
      )}

      {activeMode === 'void' && (
        <VoidTheme lyrics={lyrics} onLineClick={handleLineClick} />
      )}

      {activeMode === 'riot-zone' && (
        <RiotZone lyrics={lyrics} onLineClick={handleLineClick} />
      )}

      {activeMode === 'heartbreak' && (
        <Heartbreak lyrics={lyrics} onLineClick={handleLineClick} />
      )}

      {activeMode === 'bouncing-ball' && (
        <BouncingBall lyrics={lyrics} onLineClick={handleLineClick} />
      )}

      {activeMode === 'mirror-world' && (
        <MirrorWorld lyrics={lyrics} onLineClick={handleLineClick} />
      )}

      {activeMode === 'emotional-damage' && (
        <EmotionalDamage lyrics={lyrics} onLineClick={handleLineClick} />
      )}

      {activeMode === 'newspaper' && (
        <NewspaperTheme lyrics={lyrics} onLineClick={handleLineClick} />
      )}

      {activeMode === 'constellation' && (
        <ConstellationTheme lyrics={lyrics} onLineClick={handleLineClick} />
      )}

      {activeMode === 'apple-spatial' && (
        <div className="fixed inset-0 w-screen h-screen overflow-hidden flex flex-col items-center justify-center z-10 pointer-events-none">
          {/* Scrollable Viewport with Vertical Gradient Mask */}
          <div
            ref={containerRef}
            onWheel={handleUserScroll}
            onTouchMove={handleUserScroll}
            className="w-full h-full overflow-y-auto overflow-x-hidden no-scrollbar px-6 py-[30vh] space-y-8 md:space-y-12 select-none pointer-events-auto"
            style={{
              maskImage:
                'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)',
            }}
          >
            {lyrics.map((line, idx) => {
              const visual = getLyricVisualHierarchy(idx, activeLineIndex, prefersReducedMotion);

              return (
                <motion.div
                  key={`${line.timeMs}-${idx}`}
                  ref={(el) => {
                    lineRefs.current[idx] = el;
                  }}
                  onClick={() => handleLineClick(line.timeMs)}
                  initial={false}
                  animate={{
                    scale: visual.scale,
                    opacity: visual.opacity,
                    filter: visual.filter,
                  }}
                  transition={
                    prefersReducedMotion ? { duration: 0.1 } : LYRIC_SPRING_CONFIG
                  }
                  className={`cursor-pointer transition-colors duration-300 px-6 py-3 rounded-none mx-auto max-w-4xl text-center break-words leading-relaxed text-balance ${
                    visual.isActive
                      ? 'bg-white/5 border border-white/10'
                      : 'hover:opacity-80 hover:bg-white/[0.02]'
                  }`}
                >
                  <p className={visual.typographyClass}>{line.text}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Floating "Sync to Playhead" pill during manual scroll pause */}
          <AnimatePresence>
            {isUserScrolling && (
              <motion.button
                initial={{ opacity: 0, y: 16, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.92 }}
                transition={{ duration: 0.2 }}
                onClick={handleSyncToPlayhead}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-2 px-4 py-2 rounded-none bg-black/80 hover:bg-black/95 active:scale-95 backdrop-blur-xl border border-white/20 text-white text-xs font-mono font-semibold shadow-2xl transition-all cursor-pointer"
              >
                <RefreshCw size={12} className="animate-spin text-cyan-300" />
                <span>Sync to Playhead</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default KineticLyrics;
