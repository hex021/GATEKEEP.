/**
 * Constellation Spatial Layout Engine
 * Generates deterministic 2D coordinates for lyric words,
 * enforcing safe areas (Header HUD and Floating Player Bar clearance)
 * and polar collision avoidance.
 */

import { LyricWord } from './wordTimingEngine';
import { StarNode } from './constellationGeometry';

export interface LayoutBounds {
  width: number;
  height: number;
  safeXMin: number;
  safeXMax: number;
  safeYMin: number;
  safeYMax: number;
  isMobile: boolean;
}

export function computeLayoutBounds(width: number, height: number): LayoutBounds {
  const isMobile = height < 700 || width < 600;
  return {
    width,
    height,
    safeXMin: isMobile ? width * 0.12 : width * 0.15,
    safeXMax: isMobile ? width * 0.88 : width * 0.85,
    // Mobile caps at 0.65H to keep headline +74px extent safely above player bar (H - 92px)
    safeYMin: height * 0.18,
    safeYMax: isMobile ? height * 0.65 : height * 0.72,
    isMobile,
  };
}

/**
 * Deterministic pseudo-random generator seeded by string/number
 */
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
  const rng = seededRandom(lineSeed + words.length * 31);

  const nodes: StarNode[] = [];
  const placedPoints: Array<{ x: number; y: number }> = [];

  const minDistance = bounds.isMobile
    ? Math.max(38, bounds.width * 0.16)
    : Math.max(75, Math.min(110, bounds.width * 0.08));

  const centerX = width * 0.5;
  const centerY = (bounds.safeYMin + bounds.safeYMax) * 0.5;

  const count = words.length;
  // Arc angle spanning 120 - 240 degrees depending on word count
  const arcSpan = Math.min(Math.PI * 1.5, (count + 1) * 0.35);
  const startAngle = -arcSpan * 0.5 + (rng() - 0.5) * 0.4;

  for (let i = 0; i < count; i++) {
    const word = words[i];
    const t = count === 1 ? 0.5 : i / (count - 1);
    const angle = startAngle + t * arcSpan;

    // Radius distribution: alternate between inner and outer shells for polygonal depth
    const shellDist = (i % 2 === 0 ? 0.35 : 0.65) + (rng() - 0.5) * 0.2;
    const baseRadiusX = (bounds.safeXMax - bounds.safeXMin) * 0.45 * shellDist;
    const baseRadiusY = (bounds.safeYMax - bounds.safeYMin) * 0.45 * shellDist;

    let candidateX = centerX + Math.cos(angle) * baseRadiusX;
    let candidateY = centerY + Math.sin(angle) * baseRadiusY;

    // Clamp candidate to safe areas
    candidateX = Math.max(bounds.safeXMin, Math.min(bounds.safeXMax, candidateX));
    candidateY = Math.max(bounds.safeYMin, Math.min(bounds.safeYMax, candidateY));

    // Collision avoidance with existing placed nodes
    let finalX = candidateX;
    let finalY = candidateY;
    let attempts = 0;
    const maxAttempts = 16;
    let currentMinDist = minDistance;

    while (attempts < maxAttempts) {
      let collides = false;
      for (const p of placedPoints) {
        const dist = Math.hypot(finalX - p.x, finalY - p.y);
        if (dist < currentMinDist) {
          collides = true;
          break;
        }
      }

      if (!collides) {
        break;
      }

      attempts++;
      // Polar displacement search
      const pushAngle = angle + (attempts % 2 === 0 ? 1 : -1) * (attempts * 0.3);
      const pushRadius = (attempts * 15);
      finalX = Math.max(bounds.safeXMin, Math.min(bounds.safeXMax, candidateX + Math.cos(pushAngle) * pushRadius));
      finalY = Math.max(bounds.safeYMin, Math.min(bounds.safeYMax, candidateY + Math.sin(pushAngle) * pushRadius));

      // After 8 attempts, relax distance threshold to guarantee placement without lockup
      if (attempts === 8) {
        currentMinDist *= 0.65;
      }
    }

    placedPoints.push({ x: finalX, y: finalY });

    // Organic drift parameters: T between 4.0s and 7.5s
    const driftFreqX = 0.8 + rng() * 0.6; // ~1.0 rad/s
    const driftFreqY = 0.7 + rng() * 0.5;
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
      size: 9,
      opacity: 0.4,
      isActive: false,
      isPast: false,
      activationProgress: 0,
    });
  }

  return nodes;
}
