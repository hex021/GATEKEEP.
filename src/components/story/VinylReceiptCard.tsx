'use client';

import React from 'react';
import { Receipt, Disc, Music } from 'lucide-react';
import { StoryCardProps, formatCardDuration, compactQuote } from './cardUtils';

export function VinylReceiptCard({
  track,
  lyricQuote,
  currentTimeMs = 0,
  vibeTag,
  className = '',
}: StoryCardProps) {
  const title = track?.title || 'Unknown Track';
  const artist = track?.artist || 'Unknown Artist';
  const album = track?.album || 'Studio Master';
  const displayQuote = compactQuote(lyricQuote || track?.storyQuote || track?.title || '');
  const durationMs = track?.durationMs || 142000;
  const currentVibe = vibeTag || track?.vibeTag || 'Vinyl Archive';

  // Itemized transaction items (clamped to max 6 items as tested in T2.F27.1)
  const items = [
    { label: 'ITEM 01', val: title },
    { label: 'ARTIST', val: artist },
    { label: 'ALBUM', val: album },
    { label: 'PLAYED', val: `${formatCardDuration(currentTimeMs)} / ${formatCardDuration(durationMs)}` },
    { label: 'VIBE', val: currentVibe },
    { label: 'MEDIA', val: '12" VINYL 33 RPM' },
  ].slice(0, 6);

  // 18 teeth for 360px container width = 20px per tooth (Feature 27 boundary T2.F27.5)
  const teethCount = 18;
  const toothWidth = 20;

  return (
    <div
      data-testid="story-card-receipt"
      className={`relative w-[360px] h-[640px] max-w-[360px] max-h-[640px] bg-[#F8F6F0] text-[#1A1A1A] font-mono shadow-2xl select-none flex flex-col justify-between p-6 overflow-hidden rounded-none border-t-dashed border-b-dashed border-neutral-300 ${className}`}
      style={{
        backgroundColor: '#FDFBF7',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      }}
    >
      {/* Top Jagged Receipt Cut Teeth (SVG pattern with 18 teeth across 360px) */}
      <div className="absolute top-0 left-0 right-0 h-2.5 overflow-hidden pointer-events-none -z-0">
        <svg
          width="360"
          height="10"
          viewBox="0 0 360 10"
          className="w-full h-full fill-[#05050A]"
          preserveAspectRatio="none"
        >
          {Array.from({ length: teethCount }).map((_, i) => (
            <polygon
              key={i}
              points={`${i * toothWidth},0 ${(i + 0.5) * toothWidth},10 ${(i + 1) * toothWidth},0`}
            />
          ))}
        </svg>
      </div>

      {/* TOP: Store Header & Transaction Details */}
      <div className="w-full text-center space-y-1 pt-1">
        <div className="flex items-center justify-center space-x-2 text-xs font-bold tracking-widest uppercase">
          <Receipt size={20} className="text-[#1A1A1A]" />
          <span>VIBESYNC AUDIO STORE</span>
        </div>
        <p className="text-[10px] tracking-wider text-neutral-600">
          ORDER #VIBE-7729-0091 // TERMINAL 04
        </p>
        <p className="text-[9px] text-neutral-500">
          DATE: 2026-11-06 &bull; AUTH: APPROVED
        </p>
        <div className="w-full border-b border-dashed border-[#1A1A1A]/40 my-2" />
      </div>

      {/* CENTER: Itemized Transaction Table */}
      <div className="w-full space-y-2 my-auto">
        <div className="space-y-1.5 text-[11px]">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-baseline justify-between gap-2">
              <span className="font-bold text-neutral-600 shrink-0">{item.label}:</span>
              <span className="truncate text-right font-semibold text-[#1A1A1A]">
                {item.val}
              </span>
            </div>
          ))}
        </div>

        <div className="w-full border-b border-dashed border-[#1A1A1A]/40 my-2" />

        {/* Monospace Lyric Quote Memo */}
        <div className="space-y-1">
          <div className="text-[9px] uppercase tracking-widest text-neutral-500 text-center">
            *** MEMO / FEATURED LYRIC ***
          </div>
          <div className="border border-dashed border-[#1A1A1A]/40 p-2.5 bg-black/[0.03] text-xs font-mono leading-relaxed text-center">
            &ldquo;{displayQuote}&rdquo;
          </div>
        </div>

        <div className="w-full border-b border-dashed border-[#1A1A1A]/40 my-2" />

        {/* Price & Total Simulation */}
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between text-neutral-600">
            <span>SUBTOTAL:</span>
            <span>$0.00 (ZERO REGRETS)</span>
          </div>
          <div className="flex justify-between text-neutral-600">
            <span>TAX (AESTHETIC):</span>
            <span>$0.00</span>
          </div>
          <div className="flex justify-between font-bold text-[#1A1A1A] pt-0.5">
            <span>TOTAL:</span>
            <span>$0.00 // FREE VIBE</span>
          </div>
        </div>
      </div>

      {/* BOTTOM: Barcode Block, Order Serial & Footer */}
      <div className="w-full text-center space-y-2 pt-2">
        <div className="w-full border-b border-dashed border-[#1A1A1A]/40" />

        {/* Simulated Thermal Barcode */}
        <div className="h-10 w-full flex items-center justify-center space-x-1 overflow-hidden py-1">
          {Array.from({ length: 32 }).map((_, i) => (
            <div
              key={i}
              className="h-full bg-[#1A1A1A] shrink-0"
              style={{
                width: `${(i % 3) + 1.5}px`,
                marginRight: `${(i % 2) + 1}px`,
              }}
            />
          ))}
        </div>

        <div className="text-[10px] font-bold tracking-widest">
          SN: VIBE-7729-0091
        </div>

        <div className="text-[9px] tracking-wider text-neutral-600 uppercase flex items-center justify-center space-x-1.5">
          <Disc size={16} className="text-[#1A1A1A]" />
          <span>THANK YOU FOR LISTENING</span>
          <Music size={16} className="text-[#1A1A1A]" />
        </div>
      </div>

      {/* Bottom Jagged Receipt Cut Teeth (SVG pattern with 18 teeth across 360px) */}
      <div className="absolute bottom-0 left-0 right-0 h-2.5 overflow-hidden pointer-events-none -z-0">
        <svg
          width="360"
          height="10"
          viewBox="0 0 360 10"
          className="w-full h-full fill-[#05050A]"
          preserveAspectRatio="none"
        >
          {Array.from({ length: teethCount }).map((_, i) => (
            <polygon
              key={i}
              points={`${i * toothWidth},10 ${(i + 0.5) * toothWidth},0 ${(i + 1) * toothWidth},10`}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

export default VinylReceiptCard;
