'use client';

import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { LyricWord, findActiveWordIndex } from './wordTimingEngine';
import {
  StarNode,
  ConstellationEdge,
  drawCelestialStar,
  drawShootingStar,
  drawStarVertex,
  drawConstellationHairline,
  buildConstellationEdges,
} from './constellationGeometry';
import { ConstellationPalette } from './paletteExtractor';

interface StardustMote {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  twinkleSpeed: number;
  phase: number;
}

interface ConstellationCanvasProps {
  nodes: StarNode[];
  words: LyricWord[];
  palette: ConstellationPalette;
  prefersReducedMotion?: boolean;
}

export const ConstellationCanvas: React.FC<ConstellationCanvasProps> = ({
  nodes,
  words,
  palette,
  prefersReducedMotion = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const nodesRef = useRef<StarNode[]>(nodes);
  const wordsRef = useRef<LyricWord[]>(words);
  const paletteRef = useRef<ConstellationPalette>(palette);
  const reducedMotionRef = useRef<boolean>(prefersReducedMotion);

  nodesRef.current = nodes;
  wordsRef.current = words;
  paletteRef.current = palette;
  reducedMotionRef.current = prefersReducedMotion;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let isTabVisible = !document.hidden;

    // Ambient background stars
    const motes: StardustMote[] = Array.from({ length: 55 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 0.8 + Math.random() * 2.2,
      baseOpacity: 0.2 + Math.random() * 0.5,
      twinkleSpeed: 0.7 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
    }));

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    // 60fps Single-Source-of-Truth Render Loop
    const render = (now: number) => {
      if (!isTabVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Read authoritative playback clock directly from store
      const { currentTimeMs, syncOffsetMs, isPlaying } = usePlayerStore.getState();
      const effectiveTimeMs = currentTimeMs + syncOffsetMs;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const currentPalette = paletteRef.current;
      const currentNodes = nodesRef.current;
      const currentWords = wordsRef.current;
      const isReduced = reducedMotionRef.current;

      // 1. Draw Ambient Background Celestial Stars
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        const px = m.x * width;
        const py = m.y * height;
        const twinkle = isReduced ? 1.0 : 0.6 + 0.4 * Math.sin(now * 0.0012 * m.twinkleSpeed + m.phase);
        ctx.fillStyle = currentPalette.starInactive;
        ctx.globalAlpha = m.baseOpacity * twinkle;
        ctx.beginPath();
        ctx.arc(px, py, m.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // If pre-vocal intro or no words, render ambient celestial holding scene
      if (!currentNodes || currentNodes.length === 0 || !currentWords || currentWords.length === 0) {
        // Draw occasional brilliant background starburst (Reference 5)
        const pulse = 18 + Math.sin(now * 0.002) * 4;
        drawCelestialStar(ctx, width * 0.5, height * 0.48, pulse, currentPalette.starActive, true, 1.0, now * 0.0003);
        ctx.restore();
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Compute gentle celestial micro-drift for each node
      const tSec = now * 0.001;
      const animatedNodes: Array<{ x: number; y: number }> = [];

      for (let i = 0; i < currentNodes.length; i++) {
        const n = currentNodes[i];
        if (isReduced) {
          animatedNodes.push({ x: n.baseX, y: n.baseY });
        } else {
          const dx = Math.sin(tSec * n.driftFreqX + n.driftPhaseX) * 3.5;
          const dy = Math.cos(tSec * n.driftFreqY + n.driftPhaseY) * 3.0;
          animatedNodes.push({ x: n.baseX + dx, y: n.baseY + dy });
        }
      }

      // Authoritative Active Word Index directly from audio clock
      const activeIdx = findActiveWordIndex(currentWords, effectiveTimeMs);

      // 2. Draw Constellation Hairlines (Reference geometry)
      const edges: ConstellationEdge[] = buildConstellationEdges(currentNodes.length);

      for (const edge of edges) {
        const p1 = animatedNodes[edge.fromIndex];
        const p2 = animatedNodes[edge.toIndex];
        if (!p1 || !p2) continue;

        const isCurrentActiveSegment =
          activeIdx > 0 &&
          ((edge.fromIndex === activeIdx - 1 && edge.toIndex === activeIdx) ||
            (edge.fromIndex === activeIdx && edge.toIndex === activeIdx - 1));

        const isPastSegment = edge.toIndex <= activeIdx;

        const edgeColor = isCurrentActiveSegment ? currentPalette.lineActive : currentPalette.lineInactive;
        const edgeOpacity = isCurrentActiveSegment ? 0.95 : isPastSegment ? 0.6 : 0.28;

        drawConstellationHairline(ctx, p1.x, p1.y, p2.x, p2.y, edgeColor, edgeOpacity, isCurrentActiveSegment);
      }

      // 3. Draw Static Star Vertices for each word node
      for (let i = 0; i < currentNodes.length; i++) {
        const p = animatedNodes[i];
        // If the shooting star is currently at or traveling toward this node, skip drawing double star
        const isCurrentlyOccupied = i === activeIdx;
        if (!isCurrentlyOccupied) {
          const isPast = i < activeIdx;
          const twinkle = isReduced ? 1.0 : 0.8 + 0.2 * Math.sin(now * 0.002 + i);
          drawStarVertex(ctx, p.x, p.y, isPast ? 7 : 6, currentPalette.starInactive, false, twinkle);
        }
      }

      // 4. Draw Shooting Star with Luminous Tapered Tail (References 4 & 5)
      if (activeIdx >= 0 && activeIdx < animatedNodes.length) {
        const currentTargetNode = animatedNodes[activeIdx];
        const targetWord = currentWords[activeIdx];

        if (activeIdx === 0 || !targetWord) {
          // Resting at word 0 with brilliant 8-pointed starburst (Reference 5)
          const rayLen = 24 + Math.sin(now * 0.003) * 4;
          drawCelestialStar(
            ctx,
            currentTargetNode.x,
            currentTargetNode.y,
            rayLen,
            currentPalette.starActive,
            true,
            1.3,
            now * 0.0004
          );
        } else {
          const prevNode = animatedNodes[activeIdx - 1];
          // Calculate flight interval: shooting star travels between (prevNode) and (currentTargetNode)
          const wordDuration = targetWord.endMs - targetWord.startMs;
          const transitSpan = Math.min(380, Math.max(160, wordDuration * 0.45));
          const transitStart = targetWord.startMs - transitSpan * 0.4;
          const transitEnd = targetWord.startMs + transitSpan * 0.6;

          if (effectiveTimeMs < transitStart) {
            // Still resting at previous node
            const rayLen = 22 + Math.sin(now * 0.003) * 3;
            drawCelestialStar(ctx, prevNode.x, prevNode.y, rayLen, currentPalette.starActive, true, 1.2, now * 0.0004);
          } else if (effectiveTimeMs >= transitEnd) {
            // Has arrived and is resting at current target node
            const rayLen = 24 + Math.sin(now * 0.003) * 4;
            drawCelestialStar(
              ctx,
              currentTargetNode.x,
              currentTargetNode.y,
              rayLen,
              currentPalette.starActive,
              true,
              1.35,
              now * 0.0004
            );
          } else {
            // IN FLIGHT: Draw Shooting Star with Luminous Tapered Tail (Reference 4)
            const u = Math.max(0.0, Math.min(1.0, (effectiveTimeMs - transitStart) / transitSpan));
            // Smooth cubic ease-in-out
            const ease = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;

            const starX = prevNode.x + (currentTargetNode.x - prevNode.x) * ease;
            const starY = prevNode.y + (currentTargetNode.y - prevNode.y) * ease;

            drawShootingStar(
              ctx,
              starX,
              starY,
              prevNode.x,
              prevNode.y,
              u,
              currentPalette.starActive,
              now * 0.001
            );
          }
        }
      }

      // 5. Subtle Perimeter Screen Bezel Glow
      ctx.strokeStyle = currentPalette.bezelGlow;
      ctx.lineWidth = 1.0;
      ctx.globalAlpha = 0.28;
      ctx.strokeRect(16, 16, width - 32, height - 32);

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-10"
      style={{ width: '100%', height: '100%' }}
    />
  );
};
