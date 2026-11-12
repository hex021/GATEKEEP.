/**
 * Word Timing Engine for Constellation Theme
 * Distinguishes genuine word-level sync from procedural estimation,
 * supports multilingual tokenization via Intl.Segmenter,
 * and bounds instrumental interludes to prevent dragging word display.
 */

import { LyricLine } from '@/lib/lrclib';

export interface LyricWord {
  id: string;
  text: string;
  startMs: number;
  endMs: number;
  charCount: number;
  isPunctuation?: boolean;
  isEstimated: boolean; // TRUE when estimated procedurally, FALSE when sourced from true word sync
}

/**
 * Segment phrase text into words or semantic units.
 * Supports CJK (Chinese, Japanese, Korean) scripts via Intl.Segmenter where available.
 */
export function segmentWords(text: string): string[] {
  if (!text) return [];

  // Check if text contains CJK characters
  const hasCJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(text);

  if (hasCJK && typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new (Intl as any).Segmenter(['ja', 'zh'], { granularity: 'word' });
      const segments = Array.from(segmenter.segment(text));
      return segments
        .map((s: any) => s.segment.trim())
        .filter(Boolean);
    } catch {
      // Fallback to whitespace split
    }
  }

  // Standard whitespace tokenization for space-separated languages
  return text.trim().split(/\s+/).filter(Boolean);
}

/**
 * Estimate word timings for a lyric line using character-length weighting and punctuation pauses.
 * If genuine word-level timestamps exist on `line.words`, they are preserved verbatim.
 */
export function estimateWordTimings(
  line: LyricLine | undefined | null,
  nextLineTimeMs?: number,
  trackDurationMs?: number
): LyricWord[] {
  // Pre-vocal intro / negative index guard: gracefully return empty array when line is not active
  if (!line || !line.text) return [];

  // If genuine word timestamps are already present on the line, use them directly:
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

  // Instrumental Interlude Duration Capping:
  // In songs with long guitar solos or breaks, gap can span 30-60+ seconds.
  // Capping speech duration prevents stretching words into extreme slow-motion.
  const rawDuration =
    nextLineTimeMs !== undefined && nextLineTimeMs > lineStart
      ? nextLineTimeMs - lineStart
      : 3500;
  const maxSpeechDuration = Math.max(2500, rawWords.length * 600);
  const lineDuration = Math.max(800, Math.min(rawDuration, maxSpeechDuration));

  // Weight words by character count + trailing punctuation pause (Unicode-Compliant)
  const weights = rawWords.map((word) => {
    const cleanWord = word.replace(/[^\p{L}\p{N}]/gu, '');
    const cleanLength = Math.max(1, cleanWord.length);
    // Punctuation cadence: commas +1.8, sentence terminators +2.5
    const isSentenceEnd = /[.!?]["'\)\]}]*$/.test(word);
    const isComma = /[,;:]["'\)\]}]*$/.test(word);
    const punctuationBonus = isSentenceEnd ? 2.5 : isComma ? 1.8 : 0;
    return cleanLength + punctuationBonus;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  let currentStart = lineStart;
  return rawWords.map((word, idx) => {
    const duration = (weights[idx] / totalWeight) * lineDuration;
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
 * Binary search to find the active word index for a given playback timestamp.
 * Returns -1 if before the first word, or clamped to words.length - 1 if past the line.
 */
export function findActiveWordIndex(words: LyricWord[], currentTimeMs: number): number {
  if (!words || words.length === 0) return -1;
  if (currentTimeMs < words[0].startMs) return -1;
  if (currentTimeMs >= words[words.length - 1].endMs) {
    // If still within 800ms of phrase completion, keep final word active
    if (currentTimeMs <= words[words.length - 1].endMs + 800) {
      return words.length - 1;
    }
    return -1; // Detached into ambient holding state
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
