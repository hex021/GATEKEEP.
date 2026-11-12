/**
 * Keyword Punching & Typographic Composition Engine
 * Pure utility for AMV / Video Edit kinetic typography, keyword tokenization,
 * impact scoring, multi-angle role tagging, and SMPTE timecode generation.
 */

export type WordRole = 'punch' | 'sideways' | 'badge' | 'standard' | 'stage_direction';
export type VisualizerMode = 'video-edit' | 'apple-spatial' | 'cyberpunk';

export const VISUALIZER_MODES: VisualizerMode[] = ['video-edit', 'apple-spatial', 'cyberpunk'];

export interface TokenizedWord {
  id: string;
  raw: string;
  cleaned: string;
  role: WordRole;
  scaleClass: string;
  rotationDeg: number;
  writingMode?: 'vertical-rl' | 'horizontal-tb';
  isPunch: boolean;
  isBadge: boolean;
  staggerDelay: number;
}

export interface AnalyzedLine {
  originalText: string;
  isStageDirection: boolean;
  stageCueText?: string;
  words: TokenizedWord[];
  punchWord?: TokenizedWord;
  hasPunchedKeyword: boolean;
}

export interface FontScaleConfig {
  punchScaleClass: string;
  standardScaleClass: string;
  containerGapClass: string;
}

export const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'for', 'nor', 'on', 'at', 'to', 'from',
  'by', 'with', 'in', 'out', 'over', 'of', 'into', 'that', 'this', 'these',
  'those', 'it', 'its', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'i', 'you', 'he', 'she', 'we',
  'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'our', 'their',
  'all', 'any', 'both', 'each', 'few', 'more', 'most', 'some', 'such', 'no',
  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't',
  'can', 'will', 'just', 'don', 'should', 'now'
]);

export const HIGH_ENERGY_PUNCH_TERMS = new Set([
  'burned', 'burning', 'burn', 'skyline', 'ghost', 'city', 'heat', 'forever',
  'voice', 'station', 'neon', 'reflections', 'rear-view', 'exits', 'dawn',
  'honey', 'tape', 'deck', 'summers', 'youth', 'fire', 'sunlight', 'magnetic',
  'amber', 'wine', 'gravity', 'universe', 'collapsed', 'blink', 'loop',
  'frequency', 'photons', 'void', 'hyper-speed', 'drop', 'silence', 'sub-bass',
  'flame', 'spark', 'electric', 'stars', 'infinity', 'shatter', 'drift', 'light',
  'headlights', 'midnight', 'alive', 'holding', 'falling', 'haze'
]);

/**
 * Format timestamp in milliseconds to SMPTE timecode (HH:MM:SS:FF)
 * E.g., 102650ms at 30fps -> 00:01:42:19
 */
export function formatTimecode(ms: number, fps = 30): string {
  const safeMs = Math.max(0, isNaN(ms) ? 0 : ms);
  const totalSec = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSec / 3600).toString().padStart(2, '0');
  const mins = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
  const secs = (totalSec % 60).toString().padStart(2, '0');
  const remainderMs = safeMs % 1000;
  const frames = Math.floor((remainderMs * fps) / 1000).toString().padStart(2, '0');
  return `${hours}:${mins}:${secs}:${frames}`;
}

/**
 * Cycle through visualizer modes in strict sequence:
 * video-edit -> apple-spatial -> cyberpunk -> video-edit
 */
export function cycleVisualizerMode(current: VisualizerMode | string): VisualizerMode {
  const currentIndex = VISUALIZER_MODES.indexOf(current as VisualizerMode);
  if (currentIndex === -1) return 'video-edit';
  return VISUALIZER_MODES[(currentIndex + 1) % VISUALIZER_MODES.length];
}

/**
 * Calculate adaptive font size scaling classes based on line word count
 */
export function getAdaptiveFontScale(wordCount: number): FontScaleConfig {
  if (wordCount <= 2) {
    return {
      punchScaleClass: 'text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter',
      standardScaleClass: 'text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-white/90 drop-shadow-md',
      containerGapClass: 'gap-4 sm:gap-6',
    };
  }

  if (wordCount <= 5) {
    return {
      punchScaleClass: 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter',
      standardScaleClass: 'text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-white/90 drop-shadow-md',
      containerGapClass: 'gap-3 sm:gap-5',
    };
  }

  if (wordCount <= 10) {
    return {
      punchScaleClass: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight',
      standardScaleClass: 'text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-white/90 drop-shadow-md',
      containerGapClass: 'gap-2.5 sm:gap-4',
    };
  }

  if (wordCount <= 16) {
    return {
      punchScaleClass: 'text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight',
      standardScaleClass: 'text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-tight text-white/85 drop-shadow-sm',
      containerGapClass: 'gap-2 sm:gap-3',
    };
  }

  return {
    punchScaleClass: 'text-xl sm:text-2xl md:text-3xl font-extrabold uppercase tracking-normal',
    standardScaleClass: 'text-base sm:text-lg md:text-xl font-medium tracking-normal text-white/80',
    containerGapClass: 'gap-1.5 sm:gap-2',
  };
}

/**
 * Deterministic word impact scoring based on syllable length,
 * energy keywords, uppercase emphasis, and cadence.
 */
export function calculateWordImpactScore(word: string, isLastWord: boolean): number {
  const cleaned = word.replace(/[^\p{L}\p{N}'-]/gu, '').toLowerCase();
  if (!cleaned || cleaned.length <= 1) return 0;
  if (STOP_WORDS.has(cleaned)) return 1;

  let score = 2; // Baseline for substantive words

  // Curated punch dictionary match
  if (HIGH_ENERGY_PUNCH_TERMS.has(cleaned)) {
    score += 6;
  }

  // Length weight
  if (cleaned.length >= 8) score += 5;
  else if (cleaned.length >= 6) score += 3;
  else if (cleaned.length >= 4) score += 1;

  // Uppercase detection (e.g., "AURA", "AMV")
  if (word.length > 1 && word === word.toUpperCase() && /[\p{L}]/u.test(word)) {
    score += 3;
  }

  // Cadence bonus for end of phrase
  if (isLastWord) score += 1;

  return score;
}

/**
 * Tokenize a lyric line and extract kinetic visual metadata
 */
export function tokenizeAndPunchLine(text: string, wordCountOverride?: number): AnalyzedLine {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      originalText: text,
      isStageDirection: false,
      words: [],
      hasPunchedKeyword: false,
    };
  }

  // Stage direction / audio cue detection: e.g. "(rain hitting the windshield)"
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    const cueContent = trimmed.slice(1, -1).trim();
    return {
      originalText: text,
      isStageDirection: true,
      stageCueText: cueContent,
      words: [],
      hasPunchedKeyword: false,
    };
  }

  // Strip script tags and HTML elements for security
  const sanitized = trimmed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .trim();

  if (!sanitized) {
    return {
      originalText: text,
      isStageDirection: false,
      words: [],
      hasPunchedKeyword: false,
    };
  }

  const rawTokens = sanitized.split(/\s+/).filter(Boolean);
  const totalWords = wordCountOverride ?? rawTokens.length;
  const adaptiveScale = getAdaptiveFontScale(totalWords);

  const scoredTokens = rawTokens.map((raw, idx) => {
    const isLast = idx === rawTokens.length - 1;
    // Strip edge punctuation using Unicode property escapes
    const cleaned = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    const effectiveCleaned = cleaned || raw;
    const score = calculateWordImpactScore(effectiveCleaned, isLast);
    return {
      raw,
      cleaned: effectiveCleaned,
      score,
      index: idx,
    };
  });

  // Find the single highest scoring word to be the primary punch keyword
  let maxScore = -1;
  let punchIdx = -1;

  scoredTokens.forEach((t) => {
    if (t.score > maxScore) {
      maxScore = t.score;
      punchIdx = t.index;
    }
  });

  // Fallback: If no word achieved a high score (e.g. all stopwords), elect the longest word
  if (maxScore < 4 && scoredTokens.length > 0) {
    let longestLen = -1;
    scoredTokens.forEach((t) => {
      if (t.cleaned.length > longestLen) {
        longestLen = t.cleaned.length;
        punchIdx = t.index;
      }
    });
  }

  // Identify sideways candidate
  // Rules:
  // - If words.length <= 2: NO sideways word, all horizontal
  // - If words.length > 20: at most 1 vertical word
  // - If 3 <= words.length <= 20: pick at most 1 short word adjacent to punchIdx
  let sidewaysIdx = -1;
  if (scoredTokens.length >= 3) {
    if (punchIdx > 0 && scoredTokens[punchIdx - 1].cleaned.length <= 6) {
      sidewaysIdx = punchIdx - 1;
    } else if (punchIdx + 1 < scoredTokens.length && scoredTokens[punchIdx + 1].cleaned.length <= 6) {
      sidewaysIdx = punchIdx + 1;
    } else if (punchIdx !== 0 && scoredTokens[0].cleaned.length <= 6) {
      sidewaysIdx = 0;
    }
  }

  // Identify badge candidates
  // Rules: pick 1 or 2 words that are neither punch nor sideways, bounded rotation [-12deg, +12deg]
  const badgeIndices = new Set<number>();
  if (scoredTokens.length >= 3) {
    scoredTokens.forEach((t) => {
      if (t.index !== punchIdx && t.index !== sidewaysIdx) {
        if (badgeIndices.size < 2 && (t.score >= 4 || scoredTokens.length <= 6)) {
          badgeIndices.add(t.index);
        }
      }
    });
  }

  // Build TokenizedWord array
  const words: TokenizedWord[] = scoredTokens.map((t) => {
    const isPunch = t.index === punchIdx;
    const isSideways = t.index === sidewaysIdx && scoredTokens.length >= 3;
    const isBadge = badgeIndices.has(t.index) && scoredTokens.length >= 3;

    let role: WordRole = 'standard';
    let rotationDeg = 0;
    let writingMode: 'vertical-rl' | 'horizontal-tb' = 'horizontal-tb';
    let scaleClass = adaptiveScale.standardScaleClass;

    if (isPunch) {
      role = 'punch';
      rotationDeg = 0;
      writingMode = 'horizontal-tb';
      scaleClass = adaptiveScale.punchScaleClass;
    } else if (isSideways) {
      role = 'sideways';
      rotationDeg = -90;
      writingMode = 'vertical-rl';
      scaleClass = 'text-[10px] sm:text-xs font-mono font-bold tracking-widest text-cyan-300 uppercase px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-400/40 shadow-sm';
    } else if (isBadge) {
      role = 'badge';
      rotationDeg = t.index % 2 === 0 ? -6 : 4; // Bounded between -12 and +12
      writingMode = 'horizontal-tb';
      scaleClass = 'text-sm sm:text-base font-black uppercase tracking-wider px-3 py-1 bg-gradient-to-r from-violet-600/40 to-fuchsia-600/40 border-2 border-fuchsia-400/60 text-fuchsia-200 rounded-lg shadow-lg';
    }

    // Long word container protection
    if (t.cleaned.length > 25 || t.raw.length > 25) {
      scaleClass += ' break-all';
    }

    return {
      id: `w-${t.index}-${t.cleaned}`,
      raw: t.raw,
      cleaned: t.cleaned,
      role,
      scaleClass,
      rotationDeg,
      writingMode,
      isPunch,
      isBadge,
      staggerDelay: t.index * 0.045,
    };
  });

  const punchWord = words.find((w) => w.role === 'punch');

  return {
    originalText: text,
    isStageDirection: false,
    words,
    punchWord,
    hasPunchedKeyword: !!punchWord,
  };
}

/**
 * Alias for tokenizeAndPunchLine
 */
export const analyzeLyricLine = tokenizeAndPunchLine;

/**
 * Generate simulated procedural audio meter bar heights
 */
export function generateMeterHeights(bandCount = 16, seed = 42, isPlaying = true): number[] {
  if (!isPlaying) {
    return Array.from({ length: bandCount }, () => 10);
  }
  return Array.from({ length: bandCount }, (_, i) => {
    const s = Math.sin(seed * 0.15 + i * 1.3) * 0.5 + 0.5;
    const c = Math.cos(seed * 0.08 + i * 0.7) * 0.5 + 0.5;
    const raw = Math.round(15 + s * 55 + c * 25);
    return Math.max(10, Math.min(100, raw));
  });
}

/**
 * Helper to compute glitch displacement and styles for Cyberpunk visualizer
 */
export function getCyberpunkGlitchParams(lineIndex: number, activeIndex: number, isGlitching: boolean) {
  const isActive = lineIndex === activeIndex;
  const distance = Math.abs(lineIndex - activeIndex);
  return {
    isActive,
    distance,
    hexLabel: `[0x${Math.max(0, lineIndex).toString(16).toUpperCase().padStart(2, '0')}]`,
    magentaShift: isActive && isGlitching ? -3.5 : -2.5,
    cyanShift: isActive && isGlitching ? 3.5 : 2.5,
    blurAmount: isActive ? 0 : Math.min(6, distance * 2),
    opacity: isActive ? 1.0 : Math.max(0.2, 0.6 - distance * 0.15),
  };
}
