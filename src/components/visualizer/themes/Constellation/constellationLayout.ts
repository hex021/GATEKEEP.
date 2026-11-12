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
  const rng = seededRandom(lineSeed + words.length * 37);

  const count = words.length;
  const nodes: StarNode[] = [];
  const placedPoints: Array<{ x: number; y: number }> = [];

  // Minimum separation between nodes so text has ample room to breathe
  const minDistance = bounds.isMobile
    ? Math.max(50, width * 0.18)
    : Math.max(90, Math.min(140, width * 0.11));

  // Generous spatial span across the display stage (Reference 1 improvement)
  const spreadWidth = (bounds.stageXMax - bounds.stageXMin);
  const spreadHeight = (bounds.stageYMax - bounds.stageYMin);

  // Angular distribution: gentle sweeping celestial arc or wave
  const arcSpan = Math.min(Math.PI * 1.6, Math.max(Math.PI * 0.8, (count + 1) * 0.4));
  const baseAngle = -arcSpan * 0.5 + (rng() - 0.5) * 0.35;

  for (let i = 0; i < count; i++) {
    const word = words[i];
    const t = count === 1 ? 0.5 : i / (count - 1);

    // Natural horizontal wave progression across the screen
    // Left-to-right flow with organic vertical wave modulation
    const xProgress = bounds.stageXMin + t * spreadWidth;
    // Radial vertical modulation using alternate shells for starry depth
    const shellOffset = ((i % 2 === 0 ? 1 : -1) * 0.28 + (rng() - 0.5) * 0.15) * spreadHeight;
    const yProgress = bounds.centerY + shellOffset;

    let candidateX = Math.max(bounds.stageXMin, Math.min(bounds.stageXMax, xProgress));
    let candidateY = Math.max(bounds.stageYMin, Math.min(bounds.stageYMax, yProgress));

    // Collision avoidance
    let finalX = candidateX;
    let finalY = candidateY;
    let attempts = 0;
    const maxAttempts = 16;
    let currentMinDist = minDistance;

    while (attempts < maxAttempts) {
      let collides = false;
      for (const p of placedPoints) {
        if (Math.hypot(finalX - p.x, finalY - p.y) < currentMinDist) {
          collides = true;
          break;
        }
      }

      if (!collides) break;

      attempts++;
      const pushAngle = (attempts * 0.6) + (rng() - 0.5);
      const pushDist = attempts * 18;
      finalX = Math.max(bounds.stageXMin, Math.min(bounds.stageXMax, candidateX + Math.cos(pushAngle) * pushDist));
      finalY = Math.max(bounds.stageYMin, Math.min(bounds.stageYMax, candidateY + Math.sin(pushAngle) * pushDist));

      if (attempts === 8) {
        currentMinDist *= 0.65;
      }
    }

    placedPoints.push({ x: finalX, y: finalY });

    // Drift physics parameters (T ~ 4.5s to 7.0s)
    const driftFreqX = 0.85 + rng() * 0.5;
    const driftFreqY = 0.75 + rng() * 0.5;
    const driftPhaseX = rng() * Math.PI * 2;
    const driftPhaseY = rng() * Math.PI * 2;

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
      opacity: 0.7,
    });
  }

  return nodes;
}
