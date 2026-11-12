/**
 * Word Timing Engine for Constellation Theme V2
 * Perfect audio-lyric synchronization, seamless word transitions,
 * CJK multilingual support, and authoritative clock derivation.
 */

import { LyricLine } from '@/lib/lrclib';

export interface LyricWord {
  id: string;
  text: string;
  startMs: number;
  endMs: number;
  charCount: number;
  isPunctuation?: boolean;
  isEstimated: boolean; // TRUE when estimated procedurally, FALSE when from genuine word sync
}

/**
 * Segment phrase text into words or semantic units.
 * Supports CJK (Chinese, Japanese, Korean) scripts via Intl.Segmenter where available.
 */
export function segmentWords(text: string): string[] {
  if (!text) return [];

  const hasCJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(text);

  if (hasCJK && typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new (Intl as any).Segmenter(['ja', 'zh'], { granularity: 'word' });
      const segments = Array.from(segmenter.segment(text));
      return segments
        .map((s: any) => s.segment.trim())
        .filter(Boolean);
    } catch {
      // Fallback below
    }
  }

  // Standard whitespace tokenization for space-separated languages
  return text.trim().split(/\s+/).filter(Boolean);
}

/**
 * Estimate word timings for a lyric line using character-length weighting and punctuation pauses.
 * Ensures the phrase spans the natural singing duration without cutting out prematurely.
 */
export function estimateWordTimings(
  line: LyricLine | undefined | null,
  nextLineTimeMs?: number,
  trackDurationMs?: number
): LyricWord[] {
  if (!line || !line.text) return [];

  // If genuine word timestamps exist, preserve them
  const lineAny = line as any;
  if (lineAny.words && Array.isArray(lineAny.words) && lineAny.words.length > 0) {
    return lineAny.words.map((w: any, idx: number) => ({
      id: w.id || `${line.timeMs}-${idx}-${w.text}`,
      text: w.text,
      startMs: w.startMs ?? w.timeMs ?? line.timeMs,
      endMs: w.endMs ?? (w.startMs ? w.startMs + 400 : line.timeMs + 500),
      charCount: w.charCount ?? w.text.length,
      isEstimated: w.isEstimated ?? false,
    }));
  }

  const rawWords = segmentWords(line.text);
  if (rawWords.length === 0) return [];

  const lineStart = line.timeMs;

  // Determine line duration:
  // If nextLineTimeMs is known, use it; otherwise estimate from track duration or default to 4.5s
  let lineGap = 4500;
  if (nextLineTimeMs !== undefined && nextLineTimeMs > lineStart) {
    lineGap = nextLineTimeMs - lineStart;
  } else if (trackDurationMs !== undefined && trackDurationMs > lineStart) {
    lineGap = Math.min(6000, trackDurationMs - lineStart);
  }

  // Vocal span calculation:
  // For standard gaps (< 8s), singing covers the majority of the span (e.g. lineGap - 350ms).
  // For long instrumental gaps (> 8s), cap vocal duration to a natural singing pace (<= 2600ms)
  // to avoid extreme slow-motion during instrumental solos.
  let vocalSpan: number;
  if (lineGap <= 8000) {
    vocalSpan = Math.max(1000, lineGap - 350);
  } else {
    vocalSpan = Math.min(lineGap - 800, Math.min(2600, Math.max(1200, rawWords.length * 600)));
  }

  // Weight words by clean character length + trailing punctuation cadence
  const weights = rawWords.map((word) => {
    const cleanWord = word.replace(/[^\p{L}\p{N}]/gu, '');
    const cleanLength = Math.max(1, cleanWord.length);
    const isSentenceEnd = /[.!?]["'\)\]}]*$/.test(word);
    const isComma = /[,;:]["'\)\]}]*$/.test(word);
    const punctuationBonus = isSentenceEnd ? 2.5 : isComma ? 1.8 : 0;
    return cleanLength + punctuationBonus;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  let currentStart = lineStart;
  return rawWords.map((word, idx) => {
    const duration = (weights[idx] / totalWeight) * vocalSpan;
    const end = currentStart + duration;
    const result: LyricWord = {
      id: `${line.timeMs}-${idx}-${word}`,
      text: word,
      startMs: Math.round(currentStart),
      endMs: Math.round(end),
      charCount: word.length,
      isEstimated: true,
    };
    currentStart = end;
    return result;
  });
}

/**
 * Find the active word index at currentTimeMs.
 * Returns -1 if before line or detached after phrase.
 * Holds the final word active for up to 800ms post-vocal end.
 */
export function findActiveWordIndex(words: LyricWord[], currentTimeMs: number): number {
  if (!words || words.length === 0) return -1;
  const firstWord = words[0];
  const lastWord = words[words.length - 1];

  if (currentTimeMs < firstWord.startMs) return -1;
  if (currentTimeMs >= lastWord.endMs) {
    // Keep final word active within 800ms trailing grace period
    if (currentTimeMs <= lastWord.endMs + 800) {
      return words.length - 1;
    }
    return -1;
  }

  let low = 0;
  let high = words.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const w = words[mid];
    if (currentTimeMs >= w.startMs && currentTimeMs < w.endMs) {
      return mid;
    }
    if (currentTimeMs < w.startMs) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return Math.max(0, Math.min(words.length - 1, low));
}
