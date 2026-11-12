'use client';

import React from 'react';
import { Radio, Disc, Sparkles } from 'lucide-react';
import { StoryCardProps, formatCardDuration, generateBarcode, compactQuote } from './cardUtils';

export function BrutalistSwissCard({
  track,
  lyricQuote,
  currentTimeMs = 0,
  vibeTag,
  className = '',
}: StoryCardProps) {
  const title = (track?.title || 'UNTITLED').toUpperCase();
  const artist = (track?.artist || 'UNKNOWN ARTIST').toUpperCase();
  const album = (track?.album || 'ARCHIVE').toUpperCase();
  const displayQuote = compactQuote(lyricQuote || track?.storyQuote || track?.title || '').toUpperCase();
  const durationMs = track?.durationMs || 142000;
  const barcodePattern = generateBarcode(track?.title || 'VibeSync');
  const accentColor = track?.palette?.[2] || '#7C3AED';

  return (
    <div
      data-testid="story-card-swiss"
      className={`relative w-[360px] h-[640px] max-w-[360px] max-h-[640px] bg-black text-white border-4 border-white overflow-hidden select-none flex flex-col justify-between p-6 font-sans rounded-none ${className}`}
      style={{ backgroundColor: '#000000' }}
    >
      {/* Accent color pop badge / strip */}
      <div
        className="absolute top-0 right-0 w-16 h-16 pointer-events-none -z-0"
        style={{
          background: `linear-gradient(135deg, transparent 50%, ${accentColor} 50%)`,
        }}
      />

      {/* TOP SECTION: Swiss Typography Grid & Technical Metadata */}
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between text-[11px] font-black tracking-widest uppercase pb-1">
          <div className="flex items-center space-x-1.5">
            <Radio size={20} className="text-white" />
            <span>01 / ARCHIVE</span>
          </div>
          <span className="font-mono">
            TIME: {formatCardDuration(currentTimeMs)} / ISO 8601
          </span>
        </div>

        {/* Structured Asymmetric Grid Header */}
        <div className="grid grid-cols-12 gap-2 border-t-2 border-b-2 border-white/80 py-1.5 text-[10px] font-mono uppercase tracking-wider">
          <div className="col-span-5 border-r border-white/40 pr-1">
            SPEC: 44.1 kHz / 16-BIT
          </div>
          <div className="col-span-4 border-r border-white/40 px-1 truncate">
            {vibeTag || track?.vibeTag || 'SWISS CORE'}
          </div>
          <div className="col-span-3 text-right">
            DUR: {formatCardDuration(durationMs)}
          </div>
        </div>
      </div>

      {/* CENTER SECTION: Giant Bold Typography & High-Impact Lyric Block */}
      <div className="my-auto w-full flex flex-col justify-center space-y-4">
        {/* Track Title with break-all and font-black */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
            COMPOSITION // {album}
          </span>
          <h1 className="text-3xl font-black uppercase tracking-tighter leading-none break-all text-white">
            {title}
          </h1>
          <p className="text-sm font-bold tracking-wider text-neutral-300 uppercase pt-1">
            {artist}
          </p>
        </div>

        {/* Asymmetric Lyric Quote Block */}
        <div className="border-l-4 border-white pl-3 py-1 my-2 bg-white/5">
          <p className="text-base font-black uppercase tracking-tight leading-snug break-words">
            {displayQuote}
          </p>
        </div>

        {/* Technical Coordinate Stamp */}
        <div className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest flex items-center justify-between">
          <span>LOC: 35°41&apos;N 139°41&apos;E</span>
          <span>SYS: VIBESYNC-ENGINE</span>
        </div>
      </div>

      {/* BOTTOM SECTION: High-Density Barcode & Swiss Poster Stamp */}
      <div className="w-full space-y-2">
        {/* Decorative High-Density Barcode Pattern */}
        <div className="h-12 w-full flex items-center justify-between overflow-hidden border-t-2 border-b-2 border-white/80 py-1">
          {barcodePattern.map((width, idx) => (
            <div
              key={idx}
              className="h-full bg-white shrink-0"
              style={{
                width: `${width * 2}px`,
                marginRight: `${(idx % 4) + 1}px`,
              }}
            />
          ))}
          {/* Fill remaining space with fine bars */}
          {Array.from({ length: 16 }).map((_, idx) => (
            <div
              key={`fill-${idx}`}
              className="h-full bg-white shrink-0"
              style={{ width: `${(idx % 2) + 1}px`, marginRight: '2px' }}
            />
          ))}
        </div>

        {/* Swiss Footer Legend */}
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
          <div className="flex items-center space-x-1.5">
            <Disc size={20} className="text-white" />
            <span>INTERNATIONAL STYLE</span>
          </div>
          <div className="flex items-center space-x-1">
            <Sparkles size={20} className="text-white" />
            <span>№ 0891</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrutalistSwissCard;
