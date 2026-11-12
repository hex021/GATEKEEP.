'use client';

import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { LyricWord } from './wordTimingEngine';
import {
  StarNode,
  ConstellationEdge,
  drawStarNode,
  drawFocalReticle,
  drawGraduatedLine,
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
  activeWordIndex: number;
  words: LyricWord[];
  palette: ConstellationPalette;
  prefersReducedMotion?: boolean;
}

export const ConstellationCanvas: React.FC<ConstellationCanvasProps> = ({
  nodes,
  activeWordIndex,
  words,
  palette,
  prefersReducedMotion = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keep mutable references for 60fps RAF loop without React re-renders
  const nodesRef = useRef<StarNode[]>(nodes);
  const wordsRef = useRef<LyricWord[]>(words);
  const activeWordIdxRef = useRef<number>(activeWordIndex);
  const paletteRef = useRef<ConstellationPalette>(palette);
  const reducedMotionRef = useRef<boolean>(prefersReducedMotion);

  nodesRef.current = nodes;
  wordsRef.current = words;
  activeWordIdxRef.current = activeWordIndex;
  paletteRef.current = palette;
  reducedMotionRef.current = prefersReducedMotion;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let isTabVisible = !document.hidden;

    // Reticle tracking coordinates
    let reticleX = canvas.width / 2;
    let reticleY = canvas.height / 2;
    let reticleRadius = 24;
    let reticleRotation = 0;
    let reticleOpacity = 0;

    // Fixed pool of stardust motes
    const motes: StardustMote[] = Array.from({ length: 45 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 0.8 + Math.random() * 1.6,
      baseOpacity: 0.15 + Math.random() * 0.45,
      twinkleSpeed: 0.8 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2,
    }));

    // Handle Tab Visibility to save CPU/GPU when minimized
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        lastTime = performance.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Resize handler with DPR clamp
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

    // Main 60fps Decoupled Render Loop
    const render = (now: number) => {
      if (!isTabVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const dtMs = Math.min(100, Math.max(1, now - lastTime));
      lastTime = now;
      const dtSec = dtMs / 1000;

      // Pull current playback state directly from store (ZERO React re-renders)
      const { currentTimeMs, isPlaying } = usePlayerStore.getState();

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const currentPalette = paletteRef.current;
      const currentNodes = nodesRef.current;
      const currentWords = wordsRef.current;
      const activeIdx = activeWordIdxRef.current;
      const isReduced = reducedMotionRef.current;

      // 1. Draw Ambient Stardust Motes
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        const px = m.x * width;
        const py = m.y * height;
        const twinkle = isReduced ? 1.0 : 0.6 + 0.4 * Math.sin(now * 0.001 * m.twinkleSpeed + m.phase);
        ctx.fillStyle = currentPalette.starInactive;
        ctx.globalAlpha = m.baseOpacity * twinkle;
        ctx.beginPath();
        ctx.arc(px, py, m.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Pre-Vocal Intro / Ambient Holding Mode
      if (!currentNodes || currentNodes.length === 0 || activeIdx === -1) {
        // Draw gentle breathing center reticle
        const breathe = isReduced ? 24 : 24 + Math.sin(now * 0.0015) * 2;
        drawFocalReticle(ctx, width / 2, height / 2, breathe, currentPalette.reticle, now * 0.0003, 0.4);
        ctx.restore();
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Compute dynamic micro-drift for each node
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

      // 3. Draw Connecting Constellation Edges
      const edges: ConstellationEdge[] = buildConstellationEdges(currentNodes.length);

      for (const edge of edges) {
        const p1 = animatedNodes[edge.fromIndex];
        const p2 = animatedNodes[edge.toIndex];
        if (!p1 || !p2) continue;

        const isEdgeActive =
          activeIdx !== -1 && (edge.fromIndex === activeIdx || edge.toIndex === activeIdx);
        const isPastEdge = edge.toIndex < activeIdx;

        // Progressive line infill based on playback time
        const targetWord = currentWords[edge.toIndex];
        let progress = 1.0;
        if (targetWord && edge.toIndex === activeIdx) {
          progress = Math.max(0.0, Math.min(1.0, (currentTimeMs - targetWord.startMs) / 180));
        } else if (edge.toIndex > activeIdx) {
          progress = 0.35; // Faint structural preview of future constellation
        }

        const edgeColor = isEdgeActive ? currentPalette.lineActive : currentPalette.lineInactive;
        const edgeOpacity = isEdgeActive ? 0.9 : isPastEdge ? 0.45 : 0.25;

        drawGraduatedLine(
          ctx,
          p1.x,
          p1.y,
          p2.x,
          p2.y,
          edgeColor,
          edgeOpacity,
          progress,
          edge.hasTicks
        );
      }

      // 4. Draw Star Vertices (Diamond Astroids)
      for (let i = 0; i < currentNodes.length; i++) {
        const p = animatedNodes[i];
        const isActive = i === activeIdx;
        const isPast = i < activeIdx;

        const outerRadius = isActive ? 13 : isPast ? 7 : 5;
        const starColor = isActive ? currentPalette.starActive : currentPalette.starInactive;

        drawStarNode(ctx, p.x, p.y, outerRadius, starColor, isActive, true);
      }

      // 5. Focal Reticle Tracking Physics
      if (activeIdx >= 0 && activeIdx < animatedNodes.length) {
        const target = animatedNodes[activeIdx];
        if (isReduced) {
          reticleX = target.x;
          reticleY = target.y;
          reticleOpacity = 1.0;
        } else {
          // Smooth critically damped exponential lerp with dtSec
          const lambda = 1.0 - Math.exp(-dtSec * 14.0);
          reticleX += (target.x - reticleX) * lambda;
          reticleY += (target.y - reticleY) * lambda;
          reticleOpacity += (1.0 - reticleOpacity) * lambda;
          reticleRotation += dtSec * 0.4;
        }

        drawFocalReticle(
          ctx,
          reticleX,
          reticleY,
          reticleRadius,
          currentPalette.reticle,
          reticleRotation,
          reticleOpacity
        );
      } else {
        reticleOpacity = Math.max(0, reticleOpacity - dtSec * 2);
      }

      // 6. Perimeter Subtle Screen Bezel Glow
      ctx.strokeStyle = currentPalette.bezelGlow;
      ctx.lineWidth = 1.0;
      ctx.globalAlpha = 0.35;
      ctx.strokeRect(12, 12, width - 24, height - 24);

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
