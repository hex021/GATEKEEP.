'use client';

import React from 'react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useStudyStore } from '@/stores/useStudyStore';
import { Play, Pause, SkipForward, Volume2, VolumeX, Timer } from 'lucide-react';
import { formatTime } from '@/lib/utils';

export function MiniLyricsHUD() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const lyrics = usePlayerStore((s) => s.lyrics);
  const activeLineIndex = usePlayerStore((s) => s.activeLineIndex);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const nextTrack = usePlayerStore((s) => s.nextTrack);

  const timeLeftSeconds = useStudyStore((s) => s.timeLeftSeconds);
  const pomodoroMode = useStudyStore((s) => s.pomodoroMode);
  const isTimerRunning = useStudyStore((s) => s.isRunning);
  const toggleTimer = useStudyStore((s) => s.toggleTimer);
  const isAmbientMuted = useStudyStore((s) => s.isAmbientMuted);
  const toggleAmbientMute = useStudyStore((s) => s.toggleAmbientMute);

  const activeLine = lyrics[activeLineIndex]?.text || currentTrack.title;
  const nextLine = lyrics[activeLineIndex + 1]?.text || currentTrack.artist;

  const timerMin = Math.floor(timeLeftSeconds / 60);
  const timerSec = timeLeftSeconds % 60;
  const formattedTimer = `${timerMin}:${timerSec.toString().padStart(2, '0')}`;

  return (
    <div className="w-full h-full bg-[#05050A] text-white p-4 flex flex-col justify-between overflow-hidden select-none border border-white/10 rounded-2xl">
      {/* Top Header: Pomodoro & Ambient controls */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              pomodoroMode === 'work' ? 'bg-violet-400 animate-pulse' : 'bg-emerald-400'
            }`}
          />
          <button
            onClick={toggleTimer}
            className="flex items-center space-x-1.5 text-xs font-mono font-bold text-neutral-200 hover:text-white transition-colors"
            title="Toggle Pomodoro Timer"
          >
            <Timer size={13} className="text-violet-400" />
            <span>{formattedTimer}</span>
            <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-white/10 text-neutral-400">
              {pomodoroMode}
            </span>
          </button>
        </div>

        <button
          onClick={toggleAmbientMute}
          className={`p-1 rounded-lg text-xs transition-colors ${
            isAmbientMuted
              ? 'text-neutral-500 hover:text-neutral-300'
              : 'text-cyan-400 hover:text-cyan-300 bg-cyan-500/10'
          }`}
          title={isAmbientMuted ? 'Unmute Ambient Noise' : 'Mute Ambient Noise'}
        >
          {isAmbientMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>

      {/* Middle: 2-Line Kinetic Lyrics Display */}
      <div className="my-auto py-2 flex flex-col justify-center">
        <p className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug drop-shadow-sm line-clamp-2">
          {activeLine}
        </p>
        <p className="text-xs text-neutral-400 mt-1 line-clamp-1 italic">
          {nextLine}
        </p>
      </div>

      {/* Bottom Track Controls & Metadata */}
      <div className="flex items-center justify-between border-t border-white/10 pt-2.5">
        <div className="flex items-center space-x-2.5 min-w-0">
          <img
            src={currentTrack.albumArt}
            alt={currentTrack.title}
            className="w-7 h-7 rounded-lg object-cover border border-white/10 flex-shrink-0"
            crossOrigin="anonymous"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate max-w-[150px]">
              {currentTrack.title}
            </p>
            <p className="text-[10px] text-neutral-400 truncate max-w-[150px]">
              {currentTrack.artist}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <button
            onClick={togglePlay}
            className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
          </button>
          <button
            onClick={nextTrack}
            className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors"
            title="Next Track"
          >
            <SkipForward size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
