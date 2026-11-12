import { CurrentTrack } from '@/stores/usePlayerStore';

export interface StoryCardProps {
  track: CurrentTrack;
  lyricQuote: string;
  snapshotUrl?: string | null;
  currentTimeMs?: number;
  vibeTag?: string;
  className?: string;
}

/**
 * Calculates 9:16 aspect ratio dimensions for story export cards.
 * Base: 360 x 640px. At pixelRatio 3 -> 1080 x 1920px (Instagram/TikTok Stories).
 */
export function calculateStoryCardDimensions(baseWidth = 360, pixelRatio = 3) {
  const baseHeight = Math.round((baseWidth * 16) / 9);
  return {
    baseWidth,
    baseHeight, // 640
    exportWidth: baseWidth * pixelRatio, // 1080
    exportHeight: baseHeight * pixelRatio, // 1920
    aspectRatio: baseWidth / baseHeight, // 0.5625 (9:16)
  };
}

/**
 * Deterministically generates barcode line weights from a string (e.g. track title).
 * Used for Swiss brutalist and vinyl receipt barcodes.
 */
export function generateBarcode(title: string): number[] {
  let hash = 0;
  for (let i = 0; i < (title || '').length; i++) {
    hash += title.charCodeAt(i);
  }
  return Array.from({ length: 24 }, (_, i) => ((hash + i) % 3) + 1);
}

/**
 * Formats duration in milliseconds into MM:SS or HH:MM:SS for tracks longer than 1 hour.
 */
export function formatCardDuration(ms: number = 0): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return hrs > 0
    ? `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * Sanitizes Lucide icon size prop ensuring it is an explicit number >= 12.
 * Prevents SVG collapse in foreignObject / html-to-image rasterization.
 */
export function sanitizeIconSize(size: unknown): number {
  if (typeof size === 'number') {
    return size >= 12 ? size : 20;
  }
  if (typeof size === 'string') {
    const parsed = parseInt(size, 10);
    return parsed >= 12 ? parsed : 20;
  }
  return 20;
}

/**
 * Cleans multiline quotes to compact them safely without overflowing cards.
 */
export function compactQuote(rawQuote: string, maxLines = 3): string {
  if (!rawQuote) return '';
  const lines = rawQuote
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length <= 1) return rawQuote;
  return lines.slice(0, maxLines).join(' / ');
}
