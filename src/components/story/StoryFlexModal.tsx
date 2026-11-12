'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toPng } from 'html-to-image';
import {
  X,
  Download,
  Loader2,
  Sparkles,
  Layers,
  Quote,
  Tag,
  Check,
  Copy,
  Share2,
} from 'lucide-react';
import { usePlayerStore, CurrentTrack } from '@/stores/usePlayerStore';
import { captureVisualizerSnapshot } from '@/components/visualizer/AmbientShader';
import { GlassAppleCard } from './GlassAppleCard';
import { BrutalistSwissCard } from './BrutalistSwissCard';
import { VinylReceiptCard } from './VinylReceiptCard';
import { CassetteTapeCard } from './CassetteTapeCard';
import { calculateStoryCardDimensions, compactQuote } from './cardUtils';
import { playSuccessChime, playMechanicalClick } from '@/lib/soundFx';

export type StoryCardLayout = 'glass' | 'swiss' | 'receipt' | 'cassette';

export interface StoryFlexModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StoryFlexModal({ isOpen, onClose }: StoryFlexModalProps) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const currentTimeMs = usePlayerStore((s) => s.currentTimeMs);
  const lyrics = usePlayerStore((s) => s.lyrics) || [];
  const activeLineIndex = usePlayerStore((s) => s.activeLineIndex);

  // Layout Tab Switcher (Feature 28: glass, swiss, receipt)
  const [selectedLayout, setSelectedLayout] = useState<StoryCardLayout>('glass');

  // Lyric Quote Selection: active line, storyQuote, or custom input
  const [selectedQuote, setSelectedQuote] = useState<string>('');
  const [isCustomQuote, setIsCustomQuote] = useState<boolean>(false);
  const [customQuoteText, setCustomQuoteText] = useState<string>('');

  // Vibe Tag Customization
  const [customVibeTag, setCustomVibeTag] = useState<string>('');

  // Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [canShareNative, setCanShareNative] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [liveSnapshotUrl, setLiveSnapshotUrl] = useState<string | null>(null);
  const [proxiedAlbumArt, setProxiedAlbumArt] = useState<string | null>(null);

  // References
  const exportCardRef = useRef<HTMLDivElement | null>(null);
  const isExportingRef = useRef<boolean>(false);

  // Initialize defaults whenever modal opens or track changes
  useEffect(() => {
    if (isOpen && currentTrack) {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        setCanShareNative(true);
      }
      const defaultQuote =
        currentTrack.storyQuote ||
        (lyrics[activeLineIndex]?.text || lyrics[0]?.text || currentTrack.title);
      setSelectedQuote(defaultQuote);
      setCustomVibeTag(currentTrack.vibeTag || 'Late Night Rainy Highway');
      setIsCustomQuote(false);
      setCustomQuoteText('');
      setExportError(null);

      // Capture WebGL snapshot from shader bridge
      const snap = captureVisualizerSnapshot();
      setLiveSnapshotUrl(snap);

      // Preload proxied album art if remote URL to prevent canvas taint
      if (
        currentTrack.albumArt &&
        (currentTrack.albumArt.startsWith('http://') ||
          currentTrack.albumArt.startsWith('https://'))
      ) {
        fetch(`/api/proxy-image?url=${encodeURIComponent(currentTrack.albumArt)}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.dataUrl) {
              setProxiedAlbumArt(data.dataUrl);
            }
          })
          .catch(() => {
            setProxiedAlbumArt(null);
          });
      } else {
        setProxiedAlbumArt(null);
      }
    }
  }, [isOpen, currentTrack, lyrics, activeLineIndex]);

  // Handle ESC key to cancel export & close modal cleanly (Feature 28 boundary T2.F28.1)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        isExportingRef.current = false;
        setIsExporting(false);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Safe track handling if track is null/undefined (Feature 28 boundary T2.F28.4)
  if (!isOpen || !currentTrack) {
    return null;
  }

  // Active lyric quote string
  const activeQuote = isCustomQuote
    ? compactQuote(customQuoteText || 'Late night frequencies')
    : compactQuote(selectedQuote || currentTrack.storyQuote || currentTrack.title);

  // Active track with proxied album art override if available
  const effectiveTrack: CurrentTrack = {
    ...currentTrack,
    albumArt: proxiedAlbumArt || currentTrack.albumArt,
  };

  /**
   * Font Loading Guard (Feature 31)
   * Awaits document.fonts.ready with 1500ms timeout guard preventing export hangs.
   */
  const awaitFontsReady = async () => {
    try {
      if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
        await Promise.race([
          document.fonts.ready,
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]);
      }
    } catch (err) {
      console.warn('Font loading guard caught fallback:', err);
    }
  };

  /**
   * High-Res 1080x1920 PNG Exporter (Feature 29)
   * Captures the unscaled 360x640px export container using html-to-image with pixelRatio: 3.
   */
  const handleExport = async () => {
    if (isExportingRef.current || isExporting) return;

    isExportingRef.current = true;
    setIsExporting(true);
    setExportError(null);

    let generatedDataUrl: string | null = null;

    try {
      // 1. Font ready guard
      await awaitFontsReady();

      // 2. Refresh live WebGL snapshot
      const snap = captureVisualizerSnapshot();
      if (snap) {
        setLiveSnapshotUrl(snap);
      }

      // Small tick for DOM updates
      await new Promise((r) => setTimeout(r, 60));

      const targetElement = exportCardRef.current;
      if (!targetElement) {
        throw new Error('Export container not mounted');
      }

      // 3. Export with html-to-image (pixelRatio: 3, cacheBust: true, quality: 1.0)
      generatedDataUrl = await toPng(targetElement, {
        pixelRatio: 3, // 360x640 * 3 = 1080x1920 (T1.F29.1)
        cacheBust: true, // Prevent cached assets (T1.F29.2)
        quality: 1.0,
      });

      // 4. Trigger download
      const safeTitle = (currentTrack.title || 'track')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const filename = `vibesync-${safeTitle}-story.png`;

      try {
        const link = document.createElement('a');
        link.download = filename;
        link.href = generatedDataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        playSuccessChime();
      } catch (dlErr) {
        // Fallback for sandboxed environments (T2.F29.4)
        console.warn('Virtual anchor blocked, falling back to window.open', dlErr);
        window.open(generatedDataUrl, '_blank');
      }
    } catch (err) {
      console.error('Story Flex Export Failed:', err);
      setExportError(
        err instanceof Error ? err.message : 'Export failed. Please try again.'
      );
    } finally {
      // 5. Clean memory management (T1.F29.5, T2.F29.5)
      generatedDataUrl = null;
      isExportingRef.current = false;
      setIsExporting(false);
    }
  };

  /**
   * Copy 1080x1920 Story Card directly to Clipboard as PNG
   */
  const handleCopyImage = async () => {
    if (isExportingRef.current || isExporting) return;

    isExportingRef.current = true;
    setIsExporting(true);
    setExportError(null);

    try {
      await awaitFontsReady();
      const targetElement = exportCardRef.current;
      if (!targetElement) throw new Error('Export container not mounted');

      const dataUrl = await toPng(targetElement, {
        pixelRatio: 3,
        cacheBust: true,
        quality: 1.0,
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setIsCopied(true);
      playSuccessChime();
      setTimeout(() => setIsCopied(false), 2200);
    } catch (err) {
      console.warn('Clipboard copy failed, triggering direct download fallback:', err);
      await handleExport();
    } finally {
      isExportingRef.current = false;
      setIsExporting(false);
    }
  };

  /**
   * Native OS Web Share API (Mobile / Desktop Story Share)
   */
  const handleShare = async () => {
    if (isExportingRef.current || isExporting) return;

    isExportingRef.current = true;
    setIsExporting(true);
    setExportError(null);

    try {
      await awaitFontsReady();
      const targetElement = exportCardRef.current;
      if (!targetElement) throw new Error('Export container not mounted');

      const dataUrl = await toPng(targetElement, {
        pixelRatio: 3,
        cacheBust: true,
        quality: 0.98,
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const safeTitle = (effectiveTrack.title || 'story').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const filename = `vibesync-${safeTitle}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `VibeSync — ${effectiveTrack.title}`,
          text: `"${activeQuote}"`,
        });
        playSuccessChime();
      } else {
        await handleCopyImage();
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        console.warn('Native share failed or was cancelled:', err);
      }
    } finally {
      isExportingRef.current = false;
      setIsExporting(false);
    }
  };

  // Render card layout based on selection
  const renderCard = (isExportTarget = false) => {
    const props = {
      track: effectiveTrack,
      lyricQuote: activeQuote,
      snapshotUrl: liveSnapshotUrl,
      currentTimeMs,
      vibeTag: customVibeTag,
    };

    switch (selectedLayout) {
      case 'swiss':
        return <BrutalistSwissCard {...props} />;
      case 'receipt':
        return <VinylReceiptCard {...props} />;
      case 'cassette':
        return <CassetteTapeCard {...props} />;
      case 'glass':
      default:
        return <GlassAppleCard {...props} />;
    }
  };

  const dimensions = calculateStoryCardDimensions(360, 3);

  return (
    <div
      data-testid="story-flex-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        // Dismiss only when clicking directly on the backdrop (Feature 28 boundary T2.F28.5)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-4 sm:p-6 text-white overflow-hidden flex flex-col md:flex-row gap-6 max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-all"
          title="Close Modal (Esc)"
        >
          <X size={18} />
        </button>

        {/* LEFT COLUMN: Live 9:16 Card Preview Container (T1.F28.4 scale factor: 0.75) */}
        <div className="flex flex-col items-center justify-center flex-1 min-w-0 py-2">
          <div className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2 flex items-center space-x-1.5">
            <Sparkles size={14} className="text-cyan-400" />
            <span>9:16 Live Preview (Export: 1080x1920)</span>
          </div>

          {/* Scaled Preview Wrapper */}
          <div className="w-[270px] h-[480px] rounded-2xl overflow-hidden shadow-2xl border border-white/15 relative bg-black">
            <div
              className="absolute top-0 left-0 origin-top-left transition-transform duration-200"
              style={{
                transform: 'scale(0.75)',
                width: '360px',
                height: '640px',
              }}
            >
              {renderCard(false)}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Controls & Export Customizer */}
        <div className="w-full md:w-80 flex flex-col justify-between space-y-4 overflow-y-auto pr-1">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight flex items-center space-x-2">
                <Sparkles size={20} className="text-violet-400" />
                <span>Story Flex Generator</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Export high-res 9:16 card for Instagram & TikTok stories.
              </p>
            </div>

            {/* TAB SWITCHER: 3 Distinct Layouts (Feature 28: glass, swiss, receipt) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 flex items-center space-x-1.5">
                <Layers size={14} />
                <span>Select Card Layout</span>
              </label>
              <div className="grid grid-cols-4 gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    playMechanicalClick();
                    setSelectedLayout('glass');
                  }}
                  className={`py-1.5 px-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    selectedLayout === 'glass'
                      ? 'bg-violet-600 text-white shadow-md'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Glass
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playMechanicalClick();
                    setSelectedLayout('swiss');
                  }}
                  className={`py-1.5 px-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    selectedLayout === 'swiss'
                      ? 'bg-neutral-100 text-black shadow-md font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Swiss
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playMechanicalClick();
                    setSelectedLayout('receipt');
                  }}
                  className={`py-1.5 px-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    selectedLayout === 'receipt'
                      ? 'bg-[#F8F6F0] text-black shadow-md font-mono'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Receipt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playMechanicalClick();
                    setSelectedLayout('cassette');
                  }}
                  className={`py-1.5 px-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    selectedLayout === 'cassette'
                      ? 'bg-amber-600 text-white shadow-md font-mono'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Tape
                </button>
              </div>
            </div>

            {/* LYRIC QUOTE SELECTOR: Pick from lyrics or write custom (Feature 28) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 flex items-center space-x-1.5">
                <Quote size={14} />
                <span>Featured Lyric Quote</span>
              </label>

              {!isCustomQuote ? (
                <div className="space-y-1.5">
                  <select
                    value={selectedQuote}
                    onChange={(e) => setSelectedQuote(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    {currentTrack.storyQuote && (
                      <option value={currentTrack.storyQuote}>
                        ⭐ Featured: {currentTrack.storyQuote.slice(0, 40)}...
                      </option>
                    )}
                    {lyrics.map((l, i) => (
                      <option key={i} value={l.text}>
                        Line {i + 1}: {l.text.slice(0, 42)}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomQuote(true);
                      setCustomQuoteText(selectedQuote);
                    }}
                    className="text-[11px] text-cyan-400 hover:underline block"
                  >
                    + Enter custom quote instead
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <textarea
                    rows={2}
                    value={customQuoteText}
                    onChange={(e) => setCustomQuoteText(e.target.value)}
                    placeholder="Write a custom lyric or quote..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500 resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomQuote(false)}
                    className="text-[11px] text-neutral-400 hover:text-white block"
                  >
                    &larr; Back to track lyrics
                  </button>
                </div>
              )}
            </div>

            {/* VIBE TAG FIELD */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 flex items-center space-x-1.5">
                <Tag size={14} />
                <span>Aesthetic Vibe Tag</span>
              </label>
              <input
                type="text"
                value={customVibeTag}
                onChange={(e) => setCustomVibeTag(e.target.value)}
                placeholder="e.g. ⚡ 3 AM Rainy Vibe 🌧️ #aesthetic"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* BOTTOM EXPORT ACTIONS */}
          <div className="pt-2 space-y-2">
            {exportError && (
              <div className="text-[11px] text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg p-2">
                {exportError}
              </div>
            )}

            {canShareNative && (
              <button
                type="button"
                onClick={handleShare}
                disabled={isExporting}
                className="w-full py-2.5 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-200 hover:text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <Share2 size={14} className="text-cyan-300" />
                <span>Share Story to Instagram / Apps</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyImage}
                disabled={isExporting}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white font-semibold text-xs tracking-wide border border-white/15 flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-emerald-300">Copied PNG!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 hover:opacity-95 active:scale-[0.98] text-white font-semibold text-xs tracking-wide shadow-lg shadow-violet-900/40 flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Rendering...</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Download PNG</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-[10px] text-center text-neutral-500 font-mono">
              Pixel Ratio: 3 &bull; Base: {dimensions.baseWidth}x{dimensions.baseHeight} &bull; Target: {dimensions.exportWidth}x{dimensions.exportHeight}
            </div>
          </div>
        </div>
      </div>

      {/* OFF-SCREEN EXPORT TARGET (left: -9999px) for pixel-perfect 1080x1920 rasterization (Feature 29 boundary T2.F29.1) */}
      <div
        style={{
          position: 'fixed',
          left: -9999,
          top: 0,
          width: 360,
          height: 640,
          overflow: 'hidden',
          zIndex: -9999,
          pointerEvents: 'none',
        }}
      >
        <div ref={exportCardRef} className="w-[360px] h-[640px]">
          {renderCard(true)}
        </div>
      </div>
    </div>
  );
}

export default StoryFlexModal;
