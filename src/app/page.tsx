'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useSpotifyStore } from '@/stores/useSpotifyStore';
import { useStudyStore } from '@/stores/useStudyStore';
import { AudioController } from '@/components/player/AudioController';
import { FloatingPlayerBar } from '@/components/player/FloatingPlayerBar';
import { CommandBar } from '@/components/player/CommandBar';
import { SpotifySetupModal } from '@/components/player/SpotifySetupModal';
import { SpotifyLoginButton } from '@/components/auth/SpotifyLoginButton';
import { KineticLyrics } from '@/components/visualizer/KineticLyrics';
import { AmbientShader } from '@/components/visualizer/AmbientShader';
import { ParticleDust } from '@/components/visualizer/ParticleDust';
import { StoryFlexModal } from '@/components/story/StoryFlexModal';
import { StudyHUD } from '@/components/study/StudyHUD';
import { ShortcutsModal } from '@/components/player/ShortcutsModal';
import { CustomAudioDropzone } from '@/components/player/CustomAudioDropzone';
import { VisualizerThemeSelector } from '@/components/visualizer/VisualizerThemeSelector';
import { VISUALIZER_THEMES, getThemeMeta } from '@/components/visualizer/themes/ThemeRegistry';
import {
  Sparkles,
  Command,
  Radio,
  Timer,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { playMechanicalClick, playModeWhoosh } from '@/lib/soundFx';

export default function HomePage() {
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isCustomAudioOpen, setIsCustomAudioOpen] = useState(false);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const isSetupModalOpen = useSpotifyStore((s) => s.isSetupModalOpen);
  const openSetupModal = useSpotifyStore((s) => s.openSetupModal);
  const closeSetupModal = useSpotifyStore((s) => s.closeSetupModal);
  const initAuth = useSpotifyStore((s) => s.initAuth);
  const isAuthenticated = useSpotifyStore((s) => s.isAuthenticated);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const mode = usePlayerStore((s) => s.mode);
  const syncOffsetMs = usePlayerStore((s) => s.syncOffsetMs);
  const setSyncOffsetMs = usePlayerStore((s) => s.setSyncOffsetMs);
  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const currentTimeMs = usePlayerStore((s) => s.currentTimeMs);
  const durationMs = usePlayerStore((s) => s.durationMs);

  const [offsetToast, setOffsetToast] = useState<string | null>(null);
  const offsetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cycleVisualizerMode = usePlayerStore((s) => s.cycleVisualizerMode);
  const visualizerMode = usePlayerStore((s) => s.visualizerMode);
  const setVisualizerMode = usePlayerStore((s) => s.setVisualizerMode);
  const activeLineIndex = usePlayerStore((s) => s.activeLineIndex);

  const toggleStudyMode = useStudyStore((s) => s.toggleStudyMode);
  const isStudyMode = useStudyStore((s) => s.isStudyMode);

  // Auto-hiding Top Header HUD (fades after 2200ms idle)
  const [isTopHudVisible, setIsTopHudVisible] = useState(true);
  const topHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTopHideTimer = useCallback(() => {
    setIsTopHudVisible(true);
    if (topHideTimerRef.current) clearTimeout(topHideTimerRef.current);
    topHideTimerRef.current = setTimeout(() => {
      setIsTopHudVisible(false);
    }, 2200);
  }, []);

  useEffect(() => {
    resetTopHideTimer();
    const handleActivity = () => resetTopHideTimer();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      if (topHideTimerRef.current) clearTimeout(topHideTimerRef.current);
    };
  }, [resetTopHideTimer]);

  // Reactive Album Art backdrop scale pulse (1.25 -> 1.35) on active lyric transition
  const [isLinePulsing, setIsLinePulsing] = useState(false);
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevLineIndexRef = useRef(-1);

  useEffect(() => {
    if (prevLineIndexRef.current !== activeLineIndex && activeLineIndex >= 0) {
      prevLineIndexRef.current = activeLineIndex;
      setIsLinePulsing(true);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => {
        setIsLinePulsing(false);
      }, 140);
    }
  }, [activeLineIndex]);

  // Initialize Spotify Auth state on client mount
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Global keyboard shortcuts (Space for play/pause, Cmd+K for command bar, S for Study HUD, V for Visualizer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable ||
        target?.closest?.('input, textarea, select, [contenteditable="true"]')
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandBarOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 's' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.repeat) {
        e.preventDefault();
        playModeWhoosh();
        toggleStudyMode();
      } else if (e.key.toLowerCase() === 'v' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.repeat) {
        e.preventDefault();
        playModeWhoosh();
        cycleVisualizerMode();
      } else if (e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.repeat) {
        e.preventDefault();
        playMechanicalClick();
        if (typeof document !== 'undefined') {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.().catch(() => {});
          } else {
            document.exitFullscreen?.().catch(() => {});
          }
        }
      } else if (e.key === '[') {
        e.preventDefault();
        playMechanicalClick();
        const next = Math.max(-500, syncOffsetMs - 100);
        setSyncOffsetMs(next);
        setOffsetToast(`Lyric Sync: ${next > 0 ? `+${next}` : next}ms`);
        if (offsetTimerRef.current) clearTimeout(offsetTimerRef.current);
        offsetTimerRef.current = setTimeout(() => setOffsetToast(null), 1500);
      } else if (e.key === ']') {
        e.preventDefault();
        playMechanicalClick();
        const next = Math.min(500, syncOffsetMs + 100);
        setSyncOffsetMs(next);
        setOffsetToast(`Lyric Sync: ${next > 0 ? `+${next}` : next}ms`);
        if (offsetTimerRef.current) clearTimeout(offsetTimerRef.current);
        offsetTimerRef.current = setTimeout(() => setOffsetToast(null), 1500);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        playMechanicalClick();
        const s = usePlayerStore.getState();
        s.seekTo(Math.max(0, s.currentTimeMs - 5000));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        playMechanicalClick();
        const s = usePlayerStore.getState();
        s.seekTo(Math.min(s.durationMs, s.currentTimeMs + 5000));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        playMechanicalClick();
        const s = usePlayerStore.getState();
        s.setVolume(Math.min(1, s.volume + 0.1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        playMechanicalClick();
        const s = usePlayerStore.getState();
        s.setVolume(Math.max(0, s.volume - 0.1));
      } else if (e.key.toLowerCase() === 'm' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.repeat) {
        e.preventDefault();
        playMechanicalClick();
        usePlayerStore.getState().toggleMute();
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleStudyMode, cycleVisualizerMode, syncOffsetMs, setSyncOffsetMs]);

  return (
    <main className="relative w-screen h-screen min-h-screen overflow-hidden bg-[#05050A] text-white flex flex-col justify-between select-none">
      {/* 1. Reactive Album Art Backdrop (scale 1.25 -> 1.35 pulse on new lyric line hit) */}
      <div className="fixed inset-0 w-screen h-screen overflow-hidden -z-20 pointer-events-none select-none bg-black">
        <motion.div
          key={currentTrack.albumArt}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            scale: isLinePulsing ? 1.35 : 1.25,
          }}
          transition={{
            scale: {
              duration: isLinePulsing ? 0.08 : 0.45,
              ease: [0.22, 1, 0.36, 1],
            },
            opacity: { duration: 0.6 },
          }}
          className="w-full h-full"
        >
          <img
            src={currentTrack.albumArt}
            alt=""
            crossOrigin="anonymous"
            className={`w-full h-full object-cover transform scale-125 ${
              visualizerMode === 'cyberpunk'
                ? 'grayscale contrast-[250%] brightness-[0.18] saturate-0 blur-lg'
                : 'brightness-[0.22] contrast-150 saturate-150 blur-xl'
            }`}
          />
        </motion.div>
      </div>

      {/* M3 WebGL Ambient Fluid Shader Background & Dust */}
      <div className={visualizerMode === 'cyberpunk' || visualizerMode === 'constellation' ? 'opacity-20 transition-opacity duration-700' : 'opacity-100 transition-opacity duration-700'}>
        <AmbientShader />
      </div>
      {visualizerMode !== 'cyberpunk' && visualizerMode !== 'constellation' && <ParticleDust />}

      {/* Auto-Hiding Top Header HUD (fades out after 2200ms idle) */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between w-full select-none ${
          isTopHudVisible
            ? 'opacity-100 transition-opacity duration-200'
            : 'opacity-0 pointer-events-none transition-opacity duration-500'
        }`}
      >
        {/* Minimalist Editorial Wordmark & Live Indicator */}
        <div className="flex items-center space-x-3">
          <span className="text-xs sm:text-sm font-mono font-bold tracking-[0.25em] uppercase text-white/90">
            gatekeep.
          </span>
          <div className="h-3 w-[1px] bg-white/20 hidden xs:block" />
          {isAuthenticated ? (
            <div className="hidden xs:flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[9px] font-mono text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>SPOTIFY LIVE</span>
            </div>
          ) : (
            <span className="hidden xs:block text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
              STUDIO HUD
            </span>
          )}
        </div>

        {/* Refined Action Controls & Sleek Theme Selector */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Quick Paste Link / Search */}
          <button
            onClick={() => setIsCommandBarOpen(true)}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-black/60 hover:bg-white hover:text-black border border-white/15 text-[10px] font-mono uppercase tracking-wider text-neutral-300 transition-all cursor-pointer shadow-sm group"
            title="Paste Spotify link or search (⌘K)"
          >
            <Command size={12} className="text-neutral-400 group-hover:text-black transition-colors" />
            <span>Paste Link</span>
            <span className="font-mono text-[9px] bg-white/10 group-hover:bg-black/10 px-1 py-0.2 rounded text-neutral-400 group-hover:text-black hidden sm:inline">
              ⌘K
            </span>
          </button>

          {/* Refined Finished-Product Theme Selector Pill */}
          <button
            onClick={() => {
              playMechanicalClick();
              setIsThemeSelectorOpen(true);
            }}
            className="flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-black/60 hover:bg-white hover:text-black border border-white/15 text-[10px] font-mono uppercase tracking-wider text-neutral-300 transition-all cursor-pointer shadow-sm group"
            title="Open Visualizer Theme Gallery (16 Themes, Shortcut: 'V')"
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: getThemeMeta(visualizerMode)?.accentColor || '#00F0FF' }}
            />
            <span className="font-semibold tracking-wider">
              {getThemeMeta(visualizerMode)?.name || 'Theme'}
            </span>
            <span className="text-[9px] text-neutral-500 group-hover:text-black/60 font-mono">
              ({VISUALIZER_THEMES.length})
            </span>
            <ChevronDown size={11} className="text-neutral-500 group-hover:text-black/60 transition-transform" />
          </button>

          {/* Zen Study HUD */}
          <button
            onClick={() => {
              playModeWhoosh();
              toggleStudyMode();
            }}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
              isStudyMode
                ? 'bg-cyan-500 text-black font-bold border-cyan-400 shadow-md shadow-cyan-500/20'
                : 'bg-black/60 hover:bg-white hover:text-black border-white/15 text-neutral-400'
            }`}
            title="Toggle Zen Study HUD (Shortcut: 'S')"
          >
            <Timer size={12} />
            <span className="hidden sm:inline">HUD</span>
          </button>

          {/* 9:16 Story Flex Export */}
          <button
            onClick={() => {
              playMechanicalClick();
              setIsStoryModalOpen(true);
            }}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-white hover:text-black border border-white/15 text-[10px] font-mono uppercase tracking-wider text-neutral-400 transition-all cursor-pointer"
            title="Export 9:16 Story Card"
          >
            <Sparkles size={12} />
            <span className="hidden sm:inline">Flex</span>
          </button>

          {/* Unified Spotify Connection Component */}
          <SpotifyLoginButton />

          {/* Shortcuts Info */}
          <button
            onClick={() => {
              playMechanicalClick();
              setIsShortcutsOpen(true);
            }}
            className="p-1.5 rounded-lg bg-black/60 hover:bg-white hover:text-black border border-white/15 text-neutral-400 transition-all cursor-pointer"
            title="Keyboard Shortcuts ('?')"
          >
            <HelpCircle size={13} />
          </button>
        </div>
      </header>

      {/* 100VW x 100VH Full-Bleed Kinetic Typography Viewport (Zero Box, Zero Pill Buttons) */}
      <section
        id="lyrics-viewport"
        className="fixed inset-0 w-screen h-screen overflow-hidden flex items-center justify-center p-0 m-0 z-10 pointer-events-none"
      >
        {/* Floating Sync Offset Toast */}
        {offsetToast && (
          <div className="absolute top-4 z-40 px-3.5 py-1.5 rounded-none bg-black/90 border border-cyan-400/50 backdrop-blur-xl text-cyan-200 text-xs font-mono font-bold shadow-2xl">
            {offsetToast}
          </div>
        )}

        {/* Synced Kinetic Lyrics Viewport */}
        <KineticLyrics showModeSwitcher={false} />
      </section>

      {/* Floating Bottom Brutalist Tape Deck HUD */}
      <FloatingPlayerBar
        onOpenCommandBar={() => setIsCommandBarOpen(true)}
        onOpenPlaylist={() => setIsCommandBarOpen(true)}
        onOpenCustomAudio={() => setIsCustomAudioOpen(true)}
        onOpenStudyHud={toggleStudyMode}
        onOpenStoryFlex={() => setIsStoryModalOpen(true)}
        onOpenThemeSelector={() => setIsThemeSelectorOpen(true)}
      />

      {/* Hidden Audio Controller Engine */}
      <AudioController />

      {/* Visualizer Theme Selector Modal */}
      <VisualizerThemeSelector
        isOpen={isThemeSelectorOpen}
        onClose={() => setIsThemeSelectorOpen(false)}
      />

      {/* Zen Study HUD Modal */}
      <StudyHUD />

      {/* Command Bar (Cmd+K) Modal */}
      <CommandBar
        isOpen={isCommandBarOpen}
        onClose={() => setIsCommandBarOpen(false)}
        onOpenSpotifySetup={() => {
          setIsCommandBarOpen(false);
          openSetupModal();
        }}
        onOpenCustomAudio={() => {
          setIsCommandBarOpen(false);
          setIsCustomAudioOpen(true);
        }}
      />

      {/* Spotify Setup Modal */}
      <SpotifySetupModal
        isOpen={isSetupModalOpen}
        onClose={closeSetupModal}
      />

      {/* Story Flex (9:16 Social Export Card) Modal */}
      <StoryFlexModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
      />

      {/* Custom Audio & LRC Dropzone Modal */}
      <CustomAudioDropzone
        isOpen={isCustomAudioOpen}
        onClose={() => setIsCustomAudioOpen(false)}
      />

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </main>
  );
}
