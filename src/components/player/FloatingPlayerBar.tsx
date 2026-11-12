'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Smartphone,
  PictureInPicture2,
  Headphones,
  Sparkles,
} from 'lucide-react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useSpotifyStore } from '@/stores/useSpotifyStore';
import { useStudyStore } from '@/stores/useStudyStore';
import { useDocumentPip } from '@/hooks/useDocumentPip';
import { BATHROOM_VIBES_TRACKS } from '@/data/demoTracks';
import { formatTime } from '@/lib/utils';
import { playMechanicalClick, playModeWhoosh } from '@/lib/soundFx';

interface FloatingPlayerBarProps {
  onOpenCommandBar?: () => void;
  onOpenStudyHud?: () => void;
  onOpenStoryFlex?: () => void;
  onOpenPlaylist?: () => void;
  onOpenCustomAudio?: () => void;
  onOpenThemeSelector?: () => void;
}

export function FloatingPlayerBar({
  onOpenCommandBar,
  onOpenStudyHud,
  onOpenStoryFlex,
  onOpenPlaylist,
  onOpenCustomAudio,
  onOpenThemeSelector,
}: FloatingPlayerBarProps) {
  const mode = usePlayerStore((s) => s.mode);
  const isStudyMode = useStudyStore((s) => s.isStudyMode);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTimeMs = usePlayerStore((s) => s.currentTimeMs);
  const durationMs = usePlayerStore((s) => s.durationMs);
  const syncOffsetMs = usePlayerStore((s) => s.syncOffsetMs);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const visualizerMode = usePlayerStore((s) => s.visualizerMode);
  const cycleVisualizerMode = usePlayerStore((s) => s.cycleVisualizerMode);
  const cycleTheme = usePlayerStore((s) => s.cycleTheme);
  const setVisualizerMode = usePlayerStore((s) => s.setVisualizerMode);

  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const nextTrack = usePlayerStore((s) => s.nextTrack);
  const prevTrack = usePlayerStore((s) => s.prevTrack);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const setSyncOffsetMs = usePlayerStore((s) => s.setSyncOffsetMs);

  const isAuthenticated = useSpotifyStore((s) => s.isAuthenticated);
  const openSetupModal = useSpotifyStore((s) => s.openSetupModal);
  const executePlaybackCommand = useSpotifyStore((s) => s.executePlaybackCommand);

  const { isSupported: isPipSupported, pipWindow, openPip, closePip } = useDocumentPip();

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);
  const [showOffsetControls, setShowOffsetControls] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // Auto-hide HUD on 2200ms idle
  const [isHudVisible, setIsHudVisible] = useState(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetHideTimer = useCallback(() => {
    setIsHudVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setIsHudVisible(false);
    }, 2200);
  }, []);

  useEffect(() => {
    resetHideTimer();

    const handleActivity = () => {
      resetHideTimer();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [resetHideTimer]);

  // Calculate scrub percentage
  const displayTime = isScrubbing ? scrubTime : currentTimeMs;
  const progressPercent = durationMs > 0 ? Math.min(100, Math.max(0, (displayTime / durationMs) * 100)) : 0;

  // Handle Play / Pause with Spotify integration
  const handlePlayPause = useCallback(async () => {
    playMechanicalClick();
    if (mode === 'spotify') {
      if (!isAuthenticated) {
        openSetupModal();
        return;
      }
      const targetAction = isPlaying ? 'pause' : 'play';
      const success = await executePlaybackCommand(targetAction);
      if (success) {
        usePlayerStore.getState().setIsPlaying(!isPlaying);
      }
    } else {
      togglePlay();
    }
  }, [mode, isPlaying, isAuthenticated, openSetupModal, executePlaybackCommand, togglePlay]);

  const loadCustomTrack = usePlayerStore((s) => s.loadCustomTrack);

  // Handle Next Track with Spotify and Bathroom Vibes playlist support
  const handleNextTrack = useCallback(async () => {
    playMechanicalClick();
    if (mode === 'spotify') {
      if (!isAuthenticated) {
        openSetupModal();
        return;
      }
      await executePlaybackCommand('next');
    } else {
      const bvIndex = BATHROOM_VIBES_TRACKS.findIndex((t) => t.id === currentTrack.id);
      if (bvIndex !== -1) {
        const nextBvTrack = BATHROOM_VIBES_TRACKS[(bvIndex + 1) % BATHROOM_VIBES_TRACKS.length];
        loadCustomTrack(nextBvTrack);
      } else {
        nextTrack();
      }
    }
  }, [mode, isAuthenticated, openSetupModal, executePlaybackCommand, currentTrack.id, loadCustomTrack, nextTrack]);

  // Handle Previous Track with Spotify and Bathroom Vibes playlist support
  const handlePrevTrack = useCallback(async () => {
    playMechanicalClick();
    if (mode === 'spotify') {
      if (!isAuthenticated) {
        openSetupModal();
        return;
      }
      await executePlaybackCommand('previous');
    } else {
      const bvIndex = BATHROOM_VIBES_TRACKS.findIndex((t) => t.id === currentTrack.id);
      if (bvIndex !== -1) {
        const prevBvTrack =
          BATHROOM_VIBES_TRACKS[(bvIndex - 1 + BATHROOM_VIBES_TRACKS.length) % BATHROOM_VIBES_TRACKS.length];
        loadCustomTrack(prevBvTrack);
      } else {
        prevTrack();
      }
    }
  }, [mode, isAuthenticated, openSetupModal, executePlaybackCommand, currentTrack.id, loadCustomTrack, prevTrack]);

  // Handle Scrub bar click / drag
  const handleSeekFromEvent = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
      if (!progressBarRef.current || durationMs <= 0) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const ratio = clickX / rect.width;
      const targetTimeMs = Math.round(ratio * durationMs);

      if (isScrubbing) {
        setScrubTime(targetTimeMs);
      } else {
        seekTo(targetTimeMs);
        if (mode === 'spotify' && isAuthenticated) {
          executePlaybackCommand('seek', targetTimeMs);
        }
      }
    },
    [durationMs, isScrubbing, seekTo, mode, isAuthenticated, executePlaybackCommand]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    handleSeekFromEvent(e);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!progressBarRef.current || durationMs <= 0) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(rect.width, moveEvent.clientX - rect.left));
      const ratio = clickX / rect.width;
      setScrubTime(Math.round(ratio * durationMs));
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      setIsScrubbing(false);
      if (progressBarRef.current && durationMs > 0) {
        const rect = progressBarRef.current.getBoundingClientRect();
        const clickX = Math.max(0, Math.min(rect.width, upEvent.clientX - rect.left));
        const ratio = clickX / rect.width;
        const finalTimeMs = Math.round(ratio * durationMs);
        seekTo(finalTimeMs);
        if (mode === 'spotify' && isAuthenticated) {
          executePlaybackCommand('seek', finalTimeMs);
        }
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const adjustOffset = (delta: number) => {
    playMechanicalClick();
    setSyncOffsetMs(syncOffsetMs + delta);
  };

  const resetOffset = () => {
    playMechanicalClick();
    setSyncOffsetMs(0);
  };

  // Handle Scrub bar touch for mobile devices
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!progressBarRef.current || durationMs <= 0) return;
      const touch = e.touches[0];
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(rect.width, touch.clientX - rect.left));
      const ratio = clickX / rect.width;
      const targetTimeMs = Math.round(ratio * durationMs);
      seekTo(targetTimeMs);
      if (mode === 'spotify' && isAuthenticated) {
        executePlaybackCommand('seek', targetTimeMs);
      }
    },
    [durationMs, seekTo, mode, isAuthenticated, executePlaybackCommand]
  );

  const hudFadeClass =
    isHudVisible || isScrubbing || showOffsetControls || showThemePicker
      ? 'opacity-100 transition-opacity duration-200'
      : 'opacity-0 pointer-events-none transition-opacity duration-500';

  return (
    <div
      onMouseEnter={resetHideTimer}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-[92vw] max-w-5xl bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl px-5 py-3 shadow-2xl flex items-center justify-between z-40 select-none ${hudFadeClass}`}
    >
      {/* 2. Integrated Scrubber Rail (Top Edge) */}
      <div
        ref={progressBarRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="absolute top-0 left-4 right-4 h-[2px] bg-white/10 group hover:h-1 transition-all cursor-pointer overflow-visible"
        title={`Timeline: ${formatTime(displayTime)} / ${formatTime(durationMs)}`}
      >
        <div
          className="h-full bg-white relative transition-none"
          style={{ width: `${progressPercent}%` }}
        >
          {/* Micro glow dot at the playhead */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
      </div>

      {/* 3. Zone Left: Track Metadata (Compact & Sharp) */}
      <div className="flex items-center gap-3 min-w-0 flex-1 max-w-[280px] sm:max-w-xs">
        <div
          onClick={onOpenPlaylist || onOpenCommandBar}
          className="w-[42px] h-[42px] rounded-lg overflow-hidden border border-white/10 flex-shrink-0 cursor-pointer hover:opacity-90 transition group shadow-md"
          title="Click to view playlist"
        >
          <img
            src={currentTrack.albumArt}
            alt={currentTrack.title}
            crossOrigin="anonymous"
            className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="flex flex-col min-w-0">
          <span
            className="text-sm font-semibold tracking-tight text-white truncate max-w-[160px] sm:max-w-[200px]"
            title={currentTrack.title}
          >
            {currentTrack.title}
          </span>
          <div className="text-xs font-mono text-neutral-400 flex items-center gap-2 truncate">
            <span className="truncate max-w-[90px] sm:max-w-[120px]" title={currentTrack.artist}>
              {currentTrack.artist}
            </span>
            <span className="text-neutral-600 font-sans">•</span>
            <span className="text-neutral-400 font-mono text-[11px] tabular-nums flex-shrink-0">
              {formatTime(displayTime)} / {formatTime(durationMs)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Zone Center: Clean Icon Transport */}
      <div className="flex items-center gap-3 sm:gap-4 justify-center flex-shrink-0">
        <button
          onClick={handlePrevTrack}
          className="text-neutral-400 hover:text-white transition p-1 cursor-pointer focus:outline-none"
          title="Previous Track"
          aria-label="Previous Track"
        >
          <SkipBack size={18} />
        </button>

        <button
          onClick={handlePlayPause}
          className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg cursor-pointer focus:outline-none"
          title={isPlaying ? 'Pause' : 'Play'}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause size={20} className="fill-black" />
          ) : (
            <Play size={20} className="fill-black ml-0.5" />
          )}
        </button>

        <button
          onClick={handleNextTrack}
          className="text-neutral-400 hover:text-white transition p-1 cursor-pointer focus:outline-none"
          title="Next Track"
          aria-label="Next Track"
        >
          <SkipForward size={18} />
        </button>
      </div>

      {/* 5. Zone Right: Minimal Tool Badges & Icon Strip */}
      <div className="flex items-center gap-1.5 sm:gap-2 justify-end flex-1">
        {/* Theme Mode Toggle Pill & Theme Switcher Popover */}
        <div className="relative">
          <button
            onClick={() => {
              playModeWhoosh();
              setShowThemePicker(!showThemePicker);
            }}
            className="border border-white/15 px-2.5 py-1 rounded-md text-[11px] font-mono tracking-wider text-neutral-300 hover:border-white/40 hover:text-white transition cursor-pointer flex items-center gap-1.5"
            title="Switch Visualizer Theme Engine (Click for Menu, Shortcut: 'V')"
          >
            <span>
              {visualizerMode === 'video-edit'
                ? 'VELOCITY'
                : visualizerMode === 'cyberpunk'
                ? 'CRT'
                : visualizerMode === 'xerox-89'
                ? 'XEROX_89'
                : visualizerMode === 'thermal-flir'
                ? 'THERMAL'
                : visualizerMode === 'glitchcore'
                ? 'GLITCHCORE'
                : visualizerMode === 'swiss-editorial'
                ? 'SWISS'
                : visualizerMode === 'vhs-memory'
                ? 'VHS'
                : visualizerMode === 'liquid-type'
                ? 'LIQUID'
                : visualizerMode === 'void'
                ? 'VOID'
                : visualizerMode === 'riot-zone'
                ? 'RIOT ZONE'
                : visualizerMode === 'heartbreak'
                ? 'HEARTBREAK'
                : visualizerMode === 'bouncing-ball'
                ? 'BOUNCE'
                : visualizerMode === 'mirror-world'
                ? 'MIRROR'
                : visualizerMode === 'emotional-damage'
                ? 'EMOTIONAL'
                : visualizerMode === 'newspaper'
                ? 'NEWSPAPER'
                : 'SPATIAL'}
            </span>
            <span className="text-[8px] text-neutral-500">▼</span>
          </button>

          {showThemePicker && (
            <div className="absolute bottom-full mb-3 right-0 w-72 sm:w-80 max-h-80 overflow-y-auto rounded-xl backdrop-blur-2xl bg-black/95 border border-white/20 p-2 shadow-2xl flex flex-col gap-1 z-50 no-scrollbar">
              <div className="px-2 py-1 flex items-center justify-between border-b border-white/10 mb-1 sticky top-0 bg-black/90 backdrop-blur-md z-10">
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                  Visualizer Themes
                </span>
                <div className="flex items-center gap-2">
                  {onOpenThemeSelector && (
                    <button
                      onClick={() => {
                        setShowThemePicker(false);
                        onOpenThemeSelector();
                      }}
                      className="text-[9px] font-mono text-cyan-400 hover:text-white underline cursor-pointer"
                    >
                      Gallery
                    </button>
                  )}
                  <button
                    onClick={() => {
                      playModeWhoosh();
                      cycleTheme();
                    }}
                    className="text-[9px] font-mono text-neutral-400 hover:text-white underline cursor-pointer"
                  >
                    Cycle (V)
                  </button>
                </div>
              </div>

              {[
                { id: 'glitchcore', name: 'GLITCHCORE', desc: 'RGB Channel Separation & Signal Tearing' },
                { id: 'swiss-editorial', name: 'SWISS EDITORIAL', desc: 'Asymmetric Grid & Grotesk Type' },
                { id: 'vhs-memory', name: 'VHS MEMORY', desc: 'Camcorder OSD & Degraded Subtitles' },
                { id: 'liquid-type', name: 'LIQUID TYPE', desc: 'Viscous Displacement & Elastic Letters' },
                { id: 'void', name: 'VOID', desc: 'Abyssal Black & Weightless Negative Space' },
                { id: 'riot-zone', name: 'RIOT ZONE', desc: 'Punk DIY Zine & Paper Collage' },
                { id: 'heartbreak', name: 'HEARTBREAK', desc: 'Handwritten Ink Confessions & Serif' },
                { id: 'bouncing-ball', name: 'BOUNCING BALL', desc: 'Sing-Along Parabolic Ball Highlighter' },
                { id: 'mirror-world', name: 'MIRROR WORLD', desc: 'Bilateral Symmetry & Water Plane' },
                { id: 'emotional-damage', name: 'EMOTIONAL DAMAGE', desc: 'Psychological Dissociation & Fragmented Type' },
                { id: 'newspaper', name: 'NEWSPAPER', desc: 'Broadsheet Headlines & Column Rules' },
                { id: 'video-edit', name: 'VELOCITY', desc: '3D Camera Rig & Mixed Kinetic Typography' },
                { id: 'cyberpunk', name: 'CRT', desc: 'Analog VHS Tear & Phosphor Halation' },
                { id: 'xerox-89', name: 'XEROX_89', desc: '1-Bit Floyd-Steinberg & Ransom Note' },
                { id: 'thermal-flir', name: 'THERMAL FLIR', desc: 'Ironbow Luma & Convective Bloom' },
              ].map((th) => {
                const isActive = visualizerMode === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => {
                      playModeWhoosh();
                      setVisualizerMode(th.id as any);
                      setShowThemePicker(false);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg flex flex-col items-start text-left transition cursor-pointer ${
                      isActive
                        ? 'bg-white text-black font-bold'
                        : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] font-mono tracking-wider font-bold">
                        {th.name}
                      </span>
                      {isActive && <span className="text-[9px] font-mono uppercase tracking-widest">ACTIVE</span>}
                    </div>
                    <span
                      className={`text-[9px] font-sans ${
                        isActive ? 'text-black/80 font-medium' : 'text-neutral-500'
                      }`}
                    >
                      {th.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sync Offset Pill & Popover */}
        <div className="relative">
          <button
            onClick={() => setShowOffsetControls(!showOffsetControls)}
            className={`border px-2.5 py-1 rounded-md text-[11px] font-mono tracking-wider transition cursor-pointer ${
              syncOffsetMs !== 0
                ? 'text-cyan-300 border-cyan-400/40 bg-cyan-950/40'
                : 'border-white/15 text-neutral-300 hover:border-white/40 hover:text-white'
            }`}
            title="Adjust Lyric Sync Offset"
          >
            {syncOffsetMs === 0 ? '0ms' : `${syncOffsetMs > 0 ? `+${syncOffsetMs}` : syncOffsetMs}ms`}
          </button>

          {showOffsetControls && (
            <div className="absolute bottom-full mb-3 right-0 rounded-xl backdrop-blur-2xl bg-black/90 border border-white/15 p-2 shadow-2xl flex items-center space-x-1.5 z-50">
              <button
                onClick={() => adjustOffset(-50)}
                disabled={syncOffsetMs <= -500}
                className="px-2 py-1 rounded-md border border-white/10 bg-white/5 hover:bg-white hover:text-black text-[10px] font-mono text-white disabled:opacity-30 transition cursor-pointer"
              >
                -50ms
              </button>
              <button
                onClick={resetOffset}
                className="px-2 py-1 rounded-md border border-white/10 bg-white/5 hover:bg-white hover:text-black text-[10px] font-mono text-neutral-300 transition cursor-pointer"
                title="Reset to 0ms"
              >
                0ms
              </button>
              <button
                onClick={() => adjustOffset(50)}
                disabled={syncOffsetMs >= 500}
                className="px-2 py-1 rounded-md border border-white/10 bg-white/5 hover:bg-white hover:text-black text-[10px] font-mono text-white disabled:opacity-30 transition cursor-pointer"
              >
                +50ms
              </button>
            </div>
          )}
        </div>

        {/* Story Export: Smartphone / Share2 */}
        {onOpenStoryFlex && (
          <button
            onClick={() => {
              playMechanicalClick();
              onOpenStoryFlex();
            }}
            className="text-neutral-400 hover:text-white transition p-2 hover:bg-white/5 rounded-lg cursor-pointer"
            title="Export 9:16 Story Card (Story Flex)"
            aria-label="Story Flex"
          >
            <Smartphone size={17} />
            <Sparkles size={16} className="hidden" />
          </button>
        )}

        {/* Picture-in-Picture: PictureInPicture2 */}
        {isPipSupported && (
          <button
            onClick={() => {
              playMechanicalClick();
              if (pipWindow) {
                closePip();
              } else {
                openPip(400, 260);
              }
            }}
            className={`transition p-2 rounded-lg cursor-pointer ${
              pipWindow
                ? 'text-cyan-300 bg-cyan-950/40 border border-cyan-400/30'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
            title="Toggle Picture-in-Picture"
            aria-label="Picture-in-Picture"
          >
            <PictureInPicture2 size={17} />
          </button>
        )}

        {/* Study Mode: Headphones */}
        <button
          onClick={() => {
            playModeWhoosh();
            if (onOpenStudyHud) onOpenStudyHud();
          }}
          className={`transition p-2 rounded-lg cursor-pointer ${
            isStudyMode
              ? 'text-cyan-300 bg-cyan-950/40 border border-cyan-400/30'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
          title="Toggle Zen Study Mode (Shortcut: 'S')"
          aria-label="Study Mode"
        >
          <Headphones size={17} />
        </button>

        {/* Search / Command: ⌘K micro badge */}
        {onOpenCommandBar && (
          <button
            onClick={() => {
              playMechanicalClick();
              onOpenCommandBar();
            }}
            className="px-1.5 py-0.5 rounded border border-white/20 text-[10px] font-mono text-neutral-400 hover:text-white hover:border-white/40 transition cursor-pointer flex items-center gap-1"
            title="Command Palette (Cmd+K)"
            aria-label="Command Palette"
          >
            ⌘K
          </button>
        )}
      </div>
    </div>
  );
}

export default FloatingPlayerBar;
