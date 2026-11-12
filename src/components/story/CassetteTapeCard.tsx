'use client';

import React from 'react';
import { StoryCardProps, formatCardDuration, compactQuote } from './cardUtils';
import { Radio, Sparkles } from 'lucide-react';

export function CassetteTapeCard({
  track,
  lyricQuote,
  currentTimeMs = 0,
  vibeTag,
  className = '',
}: StoryCardProps) {
  const title = track?.title || 'Analog Dream';
  const artist = track?.artist || 'Unknown Tape';
  const album = track?.album || 'Cassette Master';
  const displayQuote = compactQuote(lyricQuote || track?.storyQuote || track?.title || '');
  const durationMs = track?.durationMs || 142000;
  const currentVibe = vibeTag || track?.vibeTag || 'Lo-Fi Tape Archive';

  const primaryColor = track?.palette?.[2] || '#7C3AED';
  const accentColor = track?.palette?.[3] || '#06B6D4';

  return (
    <div
      data-testid="story-card-cassette"
      className={`relative w-[360px] h-[640px] max-w-[360px] max-h-[640px] bg-[#121216] text-white font-mono shadow-2xl select-none flex flex-col justify-between p-5 overflow-hidden rounded-2xl border border-white/10 ${className}`}
      style={{
        background: 'radial-gradient(circle at 50% 35%, #1e1e26 0%, #0d0d11 100%)',
      }}
    >
      {/* 1. Header Stamp */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 text-[10px] tracking-widest text-neutral-400 uppercase">
        <div className="flex items-center space-x-1.5">
          <Radio size={13} className="text-cyan-400 animate-pulse" />
          <span className="font-bold text-white">VibeSync Analog</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>SIDE A</span>
          <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold text-[9px]">
            C-90
          </span>
        </div>
      </div>

      {/* 2. THE RETRO CASSETTE BODY */}
      <div className="relative w-full h-[360px] rounded-2xl bg-[#18181f] border-2 border-white/15 p-3.5 shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Metallic Corner Screws */}
        <div className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-neutral-400 border border-neutral-600 flex items-center justify-center">
          <div className="w-1.5 h-0.5 bg-neutral-800 rotate-45" />
        </div>
        <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-neutral-400 border border-neutral-600 flex items-center justify-center">
          <div className="w-1.5 h-0.5 bg-neutral-800 -rotate-45" />
        </div>
        <div className="absolute bottom-2 left-2 w-2.5 h-2.5 rounded-full bg-neutral-400 border border-neutral-600 flex items-center justify-center">
          <div className="w-1.5 h-0.5 bg-neutral-800 -rotate-12" />
        </div>
        <div className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full bg-neutral-400 border border-neutral-600 flex items-center justify-center">
          <div className="w-1.5 h-0.5 bg-neutral-800 rotate-30" />
        </div>

        {/* Cassette Paper Label (J-Card Sticker) */}
        <div className="relative w-full h-full rounded-xl bg-gradient-to-b from-[#FAF8F5] via-[#F3EFEA] to-[#E9E4DC] text-neutral-900 p-3 shadow-inner flex flex-col justify-between border border-neutral-300">
          {/* Label Top Bar */}
          <div className="flex items-center justify-between border-b border-neutral-400/50 pb-1 text-[9px] font-bold tracking-wider text-neutral-700 uppercase">
            <span style={{ color: primaryColor }}>CHROME TYPE II &bull; 70µs</span>
            <span className="bg-neutral-800 text-white px-1.5 py-0.2 rounded text-[8px]">
              DOLBY B-C NR
            </span>
          </div>

          {/* Handwritten Style Track Info */}
          <div className="text-center my-1">
            <h3 className="font-extrabold text-sm tracking-tight text-neutral-950 uppercase line-clamp-1">
              {title}
            </h3>
            <p className="text-[10px] text-neutral-600 font-medium tracking-wide line-clamp-1">
              {artist} &bull; {album}
            </p>
          </div>

          {/* Central Transparent Tape Spool Window */}
          <div className="relative w-full h-20 rounded-lg bg-[#0e0e12] border-2 border-neutral-400/70 p-2 flex items-center justify-between shadow-inner overflow-hidden">
            {/* Left Spool */}
            <div className="relative w-12 h-12 rounded-full bg-white/90 border border-neutral-300 flex items-center justify-center shadow-md">
              <div className="w-8 h-8 rounded-full bg-[#18181f] border-2 border-white/60 flex items-center justify-center">
                {/* Spool teeth */}
                <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-neutral-900" />
                </div>
              </div>
            </div>

            {/* Tape Window Gauge Lines */}
            <div className="flex flex-col items-center justify-center space-y-1 font-mono text-[8px] text-neutral-500 select-none">
              <span className="text-cyan-400 font-bold">100</span>
              <div className="w-10 h-0.5 bg-neutral-700" />
              <span>50</span>
              <div className="w-10 h-0.5 bg-neutral-700" />
              <span>0</span>
            </div>

            {/* Right Spool */}
            <div className="relative w-12 h-12 rounded-full bg-white/90 border border-neutral-300 flex items-center justify-center shadow-md">
              <div className="w-8 h-8 rounded-full bg-[#18181f] border-2 border-white/60 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-neutral-900" />
                </div>
              </div>
            </div>
          </div>

          {/* Label Bottom Line: Duration & Tape Counter */}
          <div className="flex items-center justify-between pt-1 border-t border-neutral-400/50 text-[9px] text-neutral-600">
            <span>INDEX: [ 042 ]</span>
            <span className="font-bold text-neutral-900">
              {formatCardDuration(currentTimeMs)} / {formatCardDuration(durationMs)}
            </span>
          </div>
        </div>

        {/* Bottom Trapezoidal Tape Head Cutout */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-3 bg-[#0d0d11] rounded-t-lg border-t border-white/10 flex items-center justify-center space-x-3">
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
          <div className="w-2.5 h-1.5 rounded-sm bg-neutral-600" />
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
        </div>
      </div>

      {/* 3. FEATURED LYRIC QUOTE CARD */}
      <div className="w-full rounded-xl bg-white/5 border border-white/10 p-3.5 backdrop-blur-md shadow-lg my-auto">
        <div className="flex items-center space-x-1.5 text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">
          <Sparkles size={12} />
          <span>Listening Note</span>
        </div>
        <p className="text-xs sm:text-sm font-medium italic text-neutral-200 leading-relaxed">
          &ldquo;{displayQuote}&rdquo;
        </p>
      </div>

      {/* 4. FOOTER: Vibe Tag & Branding */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-neutral-400">
        <span className="text-white font-semibold truncate max-w-[200px]">
          {currentVibe}
        </span>
        <span className="font-mono text-[9px] tracking-widest text-cyan-400">
          VIBESYNC.APP
        </span>
      </div>
    </div>
  );
}
