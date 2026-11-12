'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStudyStore, PomodoroPreset } from '@/stores/useStudyStore';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useDocumentPip } from '@/hooks/useDocumentPip';
import { getAmbientEngine } from '@/components/study/AmbientAudioEngine';
import { MiniLyricsHUD } from '@/components/study/MiniLyricsHUD';
import { playMechanicalClick } from '@/lib/soundFx';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  Volume2,
  VolumeX,
  Disc,
  CloudRain,
  Radio,
  Timer,
  CheckCircle2,
} from 'lucide-react';

export function StudyHUD() {
  const isStudyMode = useStudyStore((s) => s.isStudyMode);
  const closeStudyMode = useStudyStore((s) => s.closeStudyMode);

  // Pomodoro state
  const pomodoroPreset = useStudyStore((s) => s.pomodoroPreset);
  const pomodoroMode = useStudyStore((s) => s.pomodoroMode);
  const timeLeftSeconds = useStudyStore((s) => s.timeLeftSeconds);
  const isTimerRunning = useStudyStore((s) => s.isRunning);
  const sessionsCompleted = useStudyStore((s) => s.sessionsCompleted);
  const setPomodoroPreset = useStudyStore((s) => s.setPomodoroPreset);
  const togglePomodoroMode = useStudyStore((s) => s.togglePomodoroMode);
  const toggleTimer = useStudyStore((s) => s.toggleTimer);
  const resetTimer = useStudyStore((s) => s.resetTimer);
  const tickTimer = useStudyStore((s) => s.tickTimer);

  // Ambient sound state
  const ambientVolumes = useStudyStore((s) => s.ambientVolumes);
  const isAmbientMuted = useStudyStore((s) => s.isAmbientMuted);
  const setAmbientVolume = useStudyStore((s) => s.setAmbientVolume);
  const toggleAmbientMute = useStudyStore((s) => s.toggleAmbientMute);

  // Player state
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  // Document PiP hook
  const { isSupported: isPipSupported, pipWindow, openPip, closePip } = useDocumentPip();

  // Run Pomodoro interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        tickTimer();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, tickTimer]);

  // Sync Ambient Audio Engine volumes and start/resume on volume changes
  useEffect(() => {
    const engine = getAmbientEngine();
    if (isStudyMode || isTimerRunning) {
      engine.start();
    }
    engine.setVolumes(ambientVolumes, isAmbientMuted);
  }, [isStudyMode, isTimerRunning, ambientVolumes, isAmbientMuted]);

  // Dismiss in-tab Study HUD on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isStudyMode) {
        playMechanicalClick();
        closeStudyMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStudyMode, closeStudyMode]);

  // Calculate Pomodoro formatted time and progress
  const timerMin = Math.floor(timeLeftSeconds / 60);
  const timerSec = timeLeftSeconds % 60;
  const formattedTimer = `${timerMin.toString().padStart(2, '0')}:${timerSec.toString().padStart(2, '0')}`;

  const totalPresetSeconds =
    pomodoroMode === 'work'
      ? pomodoroPreset === '25/5'
        ? 25 * 60
        : 50 * 60
      : pomodoroPreset === '25/5'
      ? 5 * 60
      : 10 * 60;
  const progressPercent = Math.max(0, Math.min(100, ((totalPresetSeconds - timeLeftSeconds) / totalPresetSeconds) * 100));

  if (!isStudyMode && !pipWindow) return null;

  return (
    <>
      {isStudyMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-300 select-none">
          <div className="relative w-full max-w-2xl bg-neutral-950/90 border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 text-white overflow-hidden">
            {/* Subtle Ambient Glow */}
            <div
              className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20"
              style={{ backgroundColor: currentTrack.palette[2] || '#7C3AED' }}
            />
            <div
              className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20"
              style={{ backgroundColor: currentTrack.palette[3] || '#06B6D4' }}
            />

            {/* Top Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
                  <Timer size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-white">Zen Study HUD</h2>
                  <p className="text-xs text-neutral-400">Pomodoro focus companion & ambient noise deck</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Native Document PiP Trigger Button */}
                {isPipSupported && (
                  <button
                    onClick={() => {
                      playMechanicalClick();
                      if (pipWindow) {
                        closePip();
                      } else {
                        openPip(380, 240);
                      }
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-medium text-neutral-200 hover:text-white transition-all shadow-sm cursor-pointer"
                    title="Pop out floating always-on-top PiP window"
                  >
                    <ExternalLink size={13} />
                    <span>{pipWindow ? 'Close PiP' : 'Float on Top (PiP)'}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    playMechanicalClick();
                    closeStudyMode();
                  }}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="Close Study HUD"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

        {/* Center Grid: Spinning Vinyl & Pomodoro Timer */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Left Column: Spinning Vinyl Player */}
          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="relative w-44 h-44 mb-4 flex items-center justify-center">
              {/* Outer Grooved Vinyl */}
              <div
                className={`w-full h-full rounded-full bg-[#111116] border-4 border-neutral-800 shadow-2xl flex items-center justify-center transition-transform ${
                  isPlaying ? 'animate-spin-slow' : ''
                }`}
                style={{
                  backgroundImage:
                    'repeating-radial-gradient(circle, #1a1a20 0px, #1a1a20 2px, #0f0f14 3px, #0f0f14 4px)',
                }}
              >
                {/* Center Record Label */}
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 shadow-inner">
                  <img
                    src={currentTrack.albumArt}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-[#05050A] border border-white/30" />
                </div>
              </div>
            </div>

            <p className="text-sm font-bold text-white truncate max-w-[220px]">{currentTrack.title}</p>
            <p className="text-xs text-neutral-400 truncate max-w-[220px]">{currentTrack.artist}</p>

            <button
              onClick={togglePlay}
              className="mt-3 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-white flex items-center space-x-1.5 border border-white/10 transition-all"
            >
              {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
              <span>{isPlaying ? 'Pause Music' : 'Resume Music'}</span>
            </button>
          </div>

          {/* Right Column: Pomodoro HUD */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/5 border border-white/10">
            {/* Preset Selector */}
            <div className="flex space-x-2 mb-4">
              {(['25/5', '50/10'] as PomodoroPreset[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    playMechanicalClick();
                    setPomodoroPreset(preset);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                    pomodoroPreset === preset
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                      : 'bg-white/5 text-neutral-400 hover:text-white border border-white/10'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Timer Display */}
            <div className="relative flex flex-col items-center justify-center my-1">
              <span className="text-5xl font-mono font-extrabold tracking-tighter text-white drop-shadow-lg">
                {formattedTimer}
              </span>
              <button
                onClick={() => {
                  playMechanicalClick();
                  togglePomodoroMode();
                }}
                className={`mt-1 text-[11px] uppercase tracking-widest font-semibold px-2.5 py-0.5 rounded-full transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                  pomodoroMode === 'work'
                    ? 'text-violet-300 bg-violet-950/60 border border-violet-800/50 hover:bg-violet-900/60'
                    : 'text-emerald-300 bg-emerald-950/60 border border-emerald-800/50 hover:bg-emerald-900/60'
                }`}
                title={`Currently in ${pomodoroMode} mode. Click to switch to ${pomodoroMode === 'work' ? 'break' : 'work'}`}
              >
                {pomodoroMode === 'work' ? 'Deep Work Focus' : 'Mindful Break'}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  pomodoroMode === 'work' ? 'bg-violet-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Timer Actions */}
            <div className="flex items-center space-x-3 mt-4">
              <button
                onClick={() => {
                  playMechanicalClick();
                  toggleTimer();
                }}
                className={`px-5 py-2 rounded-full font-semibold text-xs flex items-center space-x-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
                  isTimerRunning
                    ? 'bg-amber-500 hover:bg-amber-400 text-black'
                    : 'bg-white hover:bg-neutral-200 text-black'
                }`}
              >
                {isTimerRunning ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                <span>{isTimerRunning ? 'Pause' : 'Start Focus'}</span>
              </button>

              <button
                onClick={() => {
                  playMechanicalClick();
                  resetTimer();
                }}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Reset Session"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* Sessions Counter */}
            <div className="mt-3 flex items-center space-x-1.5 text-xs text-neutral-400 font-mono">
              <CheckCircle2 size={13} className="text-violet-400" />
              <span>{sessionsCompleted} sessions completed</span>
            </div>
          </div>
        </div>

        {/* Bottom Panel: Procedural Ambient Sound Sliders */}
        <div className="relative z-10 p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Procedural Sound Generators (Layered Under Spotify)
            </span>
            <button
              onClick={() => {
                playMechanicalClick();
                toggleAmbientMute();
              }}
              className="text-xs text-neutral-400 hover:text-white flex items-center space-x-1 transition-colors cursor-pointer"
            >
              {isAmbientMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span>{isAmbientMuted ? 'Muted' : 'Live'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Vinyl Crackle */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center space-x-1">
                  <Disc size={12} className="text-amber-400" />
                  <span>Vinyl Crackle</span>
                </span>
                <span className="font-mono text-[10px]">{Math.round(ambientVolumes.vinyl * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={ambientVolumes.vinyl}
                onChange={(e) => setAmbientVolume('vinyl', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Rain on Window */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center space-x-1">
                  <CloudRain size={12} className="text-cyan-400" />
                  <span>Rain on Glass</span>
                </span>
                <span className="font-mono text-[10px]">{Math.round(ambientVolumes.rain * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={ambientVolumes.rain}
                onChange={(e) => setAmbientVolume('rain', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Brown Noise */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center space-x-1">
                  <Radio size={12} className="text-violet-400" />
                  <span>Brown Noise</span>
                </span>
                <span className="font-mono text-[10px]">{Math.round(ambientVolumes.brown * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={ambientVolumes.brown}
                onChange={(e) => setAmbientVolume('brown', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-violet-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Floating Document PiP Portal */}
  {pipWindow &&
    createPortal(
      <div className="w-full h-full bg-[#05050A] text-white p-3 flex flex-col justify-between overflow-hidden select-none">
        <MiniLyricsHUD />
      </div>,
      pipWindow.document.body
    )}
</>
  );
}
