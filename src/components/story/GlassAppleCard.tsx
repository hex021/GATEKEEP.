'use client';

import React from 'react';
import { Sparkles, Music2, Disc3 } from 'lucide-react';
import { StoryCardProps, formatCardDuration, compactQuote } from './cardUtils';

export function GlassAppleCard({
  track,
  lyricQuote,
  snapshotUrl,
  currentTimeMs = 0,
  vibeTag,
  className = '',
}: StoryCardProps) {
  const palette = track?.palette || ['#05050A', '#0F172A', '#7C3AED', '#06B6D4'];
  const displayVibe = vibeTag || track?.vibeTag || 'Late Night Rainy Highway';
  const displayQuote = compactQuote(lyricQuote || track?.storyQuote || track?.title || '');
  const durationMs = track?.durationMs || 180000;
  const progressRatio = durationMs > 0 ? Math.min(1, Math.max(0, currentTimeMs / durationMs)) : 0.35;

  // Background style: WebGL snapshot or vibrant liquid palette fallback
  const backgroundStyle: React.CSSProperties = snapshotUrl
    ? {
        backgroundImage: `url(${snapshotUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: `radial-gradient(circle at 20% 20%, ${palette[2]}cc 0%, transparent 50%),
                     radial-gradient(circle at 80% 80%, ${palette[3]}aa 0%, transparent 50%),
                     linear-gradient(135deg, ${palette[1]} 0%, ${palette[0]} 100%)`,
      };

  return (
    <div
      data-testid="story-card-glass"
      className={`relative w-[360px] h-[640px] max-w-[360px] max-h-[640px] overflow-hidden rounded-3xl select-none flex flex-col justify-between p-6 shadow-2xl text-white font-sans ${className}`}
      style={backgroundStyle}
    >
      {/* Frosted glass backdrop layer */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xl -z-0 pointer-events-none" />

      {/* Decorative ambient gradient glow */}
      <div
        className="absolute -top-20 -left-20 w-56 h-56 rounded-full blur-3xl opacity-60 pointer-events-none -z-0"
        style={{ backgroundColor: palette[2] }}
      />
      <div
        className="absolute -bottom-20 -right-20 w-56 h-56 rounded-full blur-3xl opacity-50 pointer-events-none -z-0"
        style={{ backgroundColor: palette[3] }}
      />

      {/* Glass card outline border */}
      <div className="absolute inset-0 rounded-3xl border border-white/20 pointer-events-none z-10" />

      {/* TOP HEADER: Branding Pill & VibeTag Badge */}
      <header className="relative z-10 flex items-center justify-between w-full pt-1">
        {/* VibeSync Branding Pill */}
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-sm">
          <Sparkles size={16} className="text-cyan-300 animate-pulse" />
          <span className="text-xs font-semibold tracking-wide text-white">VibeSync</span>
        </div>

        {/* Aesthetic VibeTag Badge */}
        <div className="flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-mono font-medium text-cyan-200 tracking-wider truncate max-w-[170px]">
          <span className="truncate">{displayVibe}</span>
        </div>
      </header>

      {/* CENTER: Album Artwork & Kinetic Lyric Quote */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto w-full space-y-5">
        {/* Album Artwork Container */}
        <div className="relative w-48 h-48 rounded-2xl shadow-2xl overflow-hidden flex-shrink-0 border border-white/20">
          {track?.albumArt ? (
            <img
              src={track.albumArt}
              alt={track.title}
              crossOrigin="anonymous"
              className="w-48 h-48 rounded-2xl shadow-2xl object-cover"
            />
          ) : (
            <div className="w-48 h-48 rounded-2xl shadow-2xl bg-gradient-to-tr from-purple-900 to-indigo-600 flex items-center justify-center">
              <Disc3 size={48} className="text-white/60 animate-spin" />
            </div>
          )}
          {/* Subtle glossy glass sheen */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
        </div>

        {/* Lyric Quote */}
        <div className="w-full px-2 text-center">
          <blockquote className="text-lg font-semibold text-white/90 italic tracking-wide text-balance line-clamp-3 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            &ldquo;{displayQuote}&rdquo;
          </blockquote>
        </div>
      </div>

      {/* BOTTOM: Track Info & Playback Progress Bar */}
      <footer className="relative z-10 w-full rounded-2xl p-4 bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl space-y-2.5">
        {/* Track Title and Artist */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-2xl font-bold line-clamp-2 text-balance text-white drop-shadow-md leading-tight">
              {track?.title || 'Unknown Track'}
            </h3>
            <p className="text-sm font-medium text-white/80 truncate drop-shadow">
              {track?.artist || 'Unknown Artist'}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
            <Music2 size={20} className="text-white/90" />
          </div>
        </div>

        {/* Progress Bar & Timestamps */}
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 rounded-full"
              style={{ width: `${Math.round(progressRatio * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-white/70">
            <span>{formatCardDuration(currentTimeMs)}</span>
            <span>{formatCardDuration(durationMs)}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default GlassAppleCard;
