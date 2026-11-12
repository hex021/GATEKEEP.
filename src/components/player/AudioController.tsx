'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useSpotifyStore } from '@/stores/useSpotifyStore';
import { registerActiveAnalyser } from '@/lib/audioAnalysis';
import { Volume2 } from 'lucide-react';

export function AudioController() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceConnectedRef = useRef(false);

  const mode = usePlayerStore((s) => s.mode);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const seekTarget = usePlayerStore((s) => s.seekTarget);
  const isAutoplayBlocked = usePlayerStore((s) => s.isAutoplayBlocked);

  const setCurrentTimeMs = usePlayerStore((s) => s.setCurrentTimeMs);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const setIsAutoplayBlocked = usePlayerStore((s) => s.setIsAutoplayBlocked);
  const clearSeekTarget = usePlayerStore((s) => s.clearSeekTarget);
  const nextTrack = usePlayerStore((s) => s.nextTrack);

  const lastPollTimestamp = useSpotifyStore((s) => s.lastPollTimestamp);
  const spotifyProgressMs = useSpotifyStore((s) => s.spotifyProgressMs);

  // Sync volume and mute to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Handle Seek requests
  useEffect(() => {
    if (seekTarget !== null && audioRef.current && mode === 'demo') {
      audioRef.current.currentTime = seekTarget / 1000;
      clearSeekTarget();
    }
  }, [seekTarget, mode, clearSeekTarget]);

  const ensureAudioNodes = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || sourceConnectedRef.current) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;

      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      sourceConnectedRef.current = true;
      registerActiveAnalyser(analyser);
    } catch (err) {
      console.warn('Web Audio DSP connection skipped:', err);
    }
  }, []);

  // Handle track changes in Demo mode
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || mode !== 'demo') return;

    if (currentTrack.audioSrc && audio.src !== window.location.origin + currentTrack.audioSrc) {
      audio.src = currentTrack.audioSrc;
      audio.load();

      if (isPlaying) {
        audio
          .play()
          .then(() => {
            setIsAutoplayBlocked(false);
            ensureAudioNodes();
          })
          .catch((err) => {
            if (err.name === 'NotAllowedError') {
              setIsAutoplayBlocked(true);
            } else {
              console.warn('Audio play failed:', err);
            }
          });
      }
    }
  }, [currentTrack.audioSrc, mode, isPlaying, setIsAutoplayBlocked, ensureAudioNodes]);

  // Handle Play / Pause commands in Demo mode
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || mode !== 'demo') return;

    if (isPlaying) {
      audio
        .play()
        .then(() => {
          setIsAutoplayBlocked(false);
          ensureAudioNodes();
        })
        .catch((err) => {
          if (err.name === 'NotAllowedError') {
            setIsAutoplayBlocked(true);
          } else {
            console.warn('Audio play failed:', err);
          }
        });
    } else {
      audio.pause();
    }
  }, [isPlaying, mode, setIsAutoplayBlocked, ensureAudioNodes]);

  // High-frequency 60fps requestAnimationFrame synchronization loop
  const syncLoop = useCallback(() => {
    const playerState = usePlayerStore.getState();

    if (playerState.mode === 'demo') {
      const audio = audioRef.current;
      if (audio && !audio.paused && !audio.seeking) {
        const timeMs = Math.round(audio.currentTime * 1000);
        playerState.setCurrentTimeMs(timeMs);
      }
    } else if (playerState.mode === 'spotify') {
      // 60fps interpolation for Spotify observer mode
      const spotifyState = useSpotifyStore.getState();
      const lastPoll = spotifyState.lastPollTimestamp;
      const baseProgress = spotifyState.spotifyProgressMs;

      if (playerState.isPlaying && lastPoll > 0) {
        const elapsed = performance.now() - lastPoll;
        const interpolated = Math.min(
          playerState.durationMs,
          Math.max(0, Math.round(baseProgress + elapsed))
        );
        playerState.setCurrentTimeMs(interpolated);
      }
    }

    rafIdRef.current = requestAnimationFrame(syncLoop);
  }, []);

  useEffect(() => {
    rafIdRef.current = requestAnimationFrame(syncLoop);
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [syncLoop]);

  // Audio event listeners
  const handleEnded = useCallback(() => {
    nextTrack();
  }, [nextTrack]);

  const handleManualUnmute = () => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => {
          setIsAutoplayBlocked(false);
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error('Manual play failed:', err);
        });
    }
  };

  return (
    <>
      {/* Hidden audio element for Demo playback */}
      <audio
        ref={audioRef}
        preload="auto"
        onEnded={handleEnded}
        onError={(e) => console.error('Audio playback error:', e)}
      />

      {/* Autoplay Resilience Pill */}
      {isAutoplayBlocked && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <button
            onClick={handleManualUnmute}
            className="flex items-center space-x-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-medium text-sm shadow-xl shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all border border-white/20"
          >
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>Audio blocked by browser — Click to Unmute &amp; Play</span>
          </button>
        </div>
      )}
    </>
  );
}
