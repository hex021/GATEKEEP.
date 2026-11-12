/**
 * Constellation Spatial Layout Engine V2
 * Perfect visual stage centering, generous screen-space utilization,
 * and responsive scaling across desktop, tablet, and mobile.
 */

import { LyricWord } from './wordTimingEngine';
import { StarNode } from './constellationGeometry';

export interface LayoutBounds {
  width: number;
  height: number;
  stageXMin: number;
  stageXMax: number;
  stageYMin: number;
  stageYMax: number;
  safeXMin: number;
  safeXMax: number;
  safeYMin: number;
  safeYMax: number;
  centerX: number;
  centerY: number;
  isMobile: boolean;
}

export function computeLayoutBounds(width: number, height: number): LayoutBounds {
  const isMobile = height < 700 || width < 600;

  // Header HUD clearance & Floating Player Bar clearance
  const safeYMin = height * 0.18;
  const safeYMax = isMobile ? height * 0.65 : height * 0.72;
  const safeXMin = isMobile ? width * 0.08 : width * 0.15;
  const safeXMax = isMobile ? width * 0.92 : width * 0.85;

  const centerX = width * 0.5;
  const centerY = (safeYMin + safeYMax) * 0.5; // Centered on usable visual stage

  return {
    width,
    height,
    stageXMin: safeXMin,
    stageXMax: safeXMax,
    stageYMin: safeYMin,
    stageYMax: safeYMax,
    safeXMin,
    safeXMax,
    safeYMin,
    safeYMax,
    centerX,
    centerY,
    isMobile,
  };
}

function seededRandom(seed: number): () => number {
  let s = Math.abs(seed) % 2147483647;
  if (s === 0) s = 1234567;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateNodeLayout(
  words: LyricWord[],
  width: number,
  height: number,
  lineSeed: number
): StarNode[] {
  if (!words || words.length === 0) return [];

  const bounds = computeLayoutBounds(width, height);
  const count = words.length;
  const nodes: StarNode[] = [];
  const placedPoints: Array<{ x: number; y: number }> = [];

  const spreadX = bounds.stageXMax - bounds.stageXMin;
  const spreadY = bounds.stageYMax - bounds.stageYMin;

  // Minimum distance between consecutively activated words so the shooting star has a meaningful journey
  const minHopDistance = bounds.isMobile
    ? Math.max(65, width * 0.22)
    : Math.max(120, width * 0.18);

  // General collision avoidance threshold to prevent overlap
  const minSeparation = bounds.isMobile
    ? Math.max(45, width * 0.14)
    : Math.max(85, width * 0.10);

  for (let i = 0; i < count; i++) {
    const word = words[i];
    // Deterministic seeded generator per word based on line seed, word index and text hash
    let wordHash = 0;
    for (let c = 0; c < word.text.length; c++) {
      wordHash = (wordHash * 31 + word.text.charCodeAt(c)) | 0;
    }
    const rng = seededRandom(Math.abs(lineSeed + i * 1999 + wordHash));

    let bestX = bounds.centerX;
    let bestY = bounds.centerY;
    let bestScore = -Infinity;

    // Sample candidate spatial positions across the entire usable visual sky (V3 Random Placement)
    const candidateTries = 32;
    for (let attempt = 0; attempt < candidateTries; attempt++) {
      // Unbiased random coordinates across the full safe area
      const candX = bounds.stageXMin + rng() * spreadX;
      const candY = bounds.stageYMin + rng() * spreadY;

      let score = 100;
      let collides = false;

      // Check distance from previous word (need a good hop distance)
      if (i > 0) {
        const prevP = placedPoints[i - 1];
        const distFromPrev = Math.hypot(candX - prevP.x, candY - prevP.y);
        if (distFromPrev < minHopDistance * 0.8) {
          score -= (minHopDistance - distFromPrev) * 2;
        } else {
          score += Math.min(200, distFromPrev);
        }
      }

      // Check distance against other recently placed words
      for (let pIdx = 0; pIdx < placedPoints.length; pIdx++) {
        const p = placedPoints[pIdx];
        const d = Math.hypot(candX - p.x, candY - p.y);
        if (d < minSeparation) {
          collides = true;
          score -= 500;
          break;
        }
      }

      if (!collides && score > bestScore) {
        bestScore = score;
        bestX = candX;
        bestY = candY;
      } else if (bestScore === -Infinity) {
        bestX = candX;
        bestY = candY;
      }
    }

    // Ensure within exact safe boundaries
    const finalX = Math.max(bounds.stageXMin, Math.min(bounds.stageXMax, bestX));
    const finalY = Math.max(bounds.stageYMin, Math.min(bounds.stageYMax, bestY));
    placedPoints.push({ x: finalX, y: finalY });

    // Curved trajectory control points from previous node (i-1) to this node (i)
    let cp1X = finalX;
    let cp1Y = finalY;
    let cp2X = finalX;
    let cp2Y = finalY;

    if (i > 0) {
      const pPrev = placedPoints[i - 1];
      const dx = finalX - pPrev.x;
      const dy = finalY - pPrev.y;
      const hopDist = Math.hypot(dx, dy) || 1;
      const ux = dx / hopDist;
      const uy = dy / hopDist;
      const nx = -uy;
      const ny = ux;

      // Organic curvature perpendicular to chord
      const curveSign = rng() > 0.5 ? 1 : -1;
      const curveMag = hopDist * (0.16 + rng() * 0.22) * curveSign;

      cp1X = pPrev.x + ux * (hopDist * 0.33) + nx * curveMag;
      cp1Y = pPrev.y + uy * (hopDist * 0.33) + ny * curveMag;
      cp2X = pPrev.x + ux * (hopDist * 0.67) + nx * (curveMag * (0.7 + rng() * 0.5));
      cp2Y = pPrev.y + uy * (hopDist * 0.67) + ny * (curveMag * (0.7 + rng() * 0.5));
    }

    // Micro-drift parameters
    const driftFreqX = 0.85 + rng() * 0.5;
    const driftFreqY = 0.75 + rng() * 0.5;
    const driftPhaseX = rng() * Math.PI * 2;
    const driftPhaseY = rng() * Math.PI * 2;

    // Deterministic word-level font size nuance (Part 11.B3)
    const scaleFactor = 0.94 + rng() * 0.12;

    nodes.push({
      id: word.id,
      word: word.text,
      x: finalX,
      y: finalY,
      baseX: finalX,
      baseY: finalY,
      driftPhaseX,
      driftPhaseY,
      driftFreqX,
      driftFreqY,
      size: 10,
      opacity: 1.0,
      cp1X,
      cp1Y,
      cp2X,
      cp2Y,
      scaleFactor,
    });
  }

  return nodes;
}
