'use client';

import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { LyricWord, findActiveWordIndex } from './wordTimingEngine';
import {
  StarNode,
  drawCelestialStar,
  drawCurvedShootingStar,
} from './constellationGeometry';
import { ConstellationPalette } from './paletteExtractor';

interface BackgroundStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseOpacity: number;
  twinkleSpeed: number;
  phase: number;
}

interface BackgroundMeteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  life: number;
  maxLife: number;
  opacity: number;
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

    // Part 11.A1 & A2: Ambient Background Starfield with slow organic drift & random twinkling
    const starCount = typeof window !== 'undefined' && window.innerWidth < 768 ? 36 : 68;
    const stars: BackgroundStar[] = Array.from({ length: starCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.000045, // Gentle independent drift
      vy: (Math.random() - 0.5) * 0.000045,
      size: 0.7 + Math.random() * 1.8,
      baseOpacity: 0.15 + Math.random() * 0.45,
      twinkleSpeed: 0.8 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
    }));

    // Part 11.A3: Occasional background shooting stars (independent, delicate, atmospheric)
    let activeMeteor: BackgroundMeteor | null = null;
    let nextMeteorTime = performance.now() + 3500 + Math.random() * 4500;
    let lastTime = performance.now();

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      lastTime = performance.now();
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

      const dt = Math.min(0.1, (now - lastTime) * 0.001);
      lastTime = now;

      // Read authoritative playback clock directly from store
      const { currentTimeMs, syncOffsetMs } = usePlayerStore.getState();
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

      // 1. Draw Ambient Background Celestial Stars with gentle drift & twinkling (Part 11.A1 & A2)
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        if (!isReduced) {
          s.x = (s.x + s.vx * dt * 1000 + 1) % 1;
          s.y = (s.y + s.vy * dt * 1000 + 1) % 1;
        }
        const px = s.x * width;
        const py = s.y * height;
        const twinkle = isReduced ? 1.0 : 0.6 + 0.4 * Math.sin(now * 0.0012 * s.twinkleSpeed + s.phase);
        ctx.fillStyle = currentPalette.starInactive;
        ctx.globalAlpha = s.baseOpacity * twinkle;
        ctx.beginPath();
        ctx.arc(px, py, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Occasional Background Falling Stars / Meteors (Part 11.A3)
      if (!isReduced) {
        if (!activeMeteor && now > nextMeteorTime) {
          // Spawn subtle background shooting star
          const angle = Math.PI * 0.25 + (Math.random() - 0.5) * (Math.PI * 0.35);
          const speed = 350 + Math.random() * 250;
          activeMeteor = {
            x: Math.random() * width * 0.8,
            y: Math.random() * height * 0.35,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            length: 45 + Math.random() * 55,
            life: 0,
            maxLife: 0.65 + Math.random() * 0.45,
            opacity: 0.32,
          };
          nextMeteorTime = now + 4500 + Math.random() * 6500;
        }

        if (activeMeteor) {
          activeMeteor.life += dt;
          const p = activeMeteor.life / activeMeteor.maxLife;
          if (p >= 1.0) {
            activeMeteor = null;
          } else {
            activeMeteor.x += activeMeteor.vx * dt;
            activeMeteor.y += activeMeteor.vy * dt;

            const speed = Math.hypot(activeMeteor.vx, activeMeteor.vy) || 1;
            const dirX = activeMeteor.vx / speed;
            const dirY = activeMeteor.vy / speed;
            const tailX = activeMeteor.x - dirX * activeMeteor.length;
            const tailY = activeMeteor.y - dirY * activeMeteor.length;

            const alpha = Math.sin(Math.PI * p) * activeMeteor.opacity;
            const meteorGrad = ctx.createLinearGradient(activeMeteor.x, activeMeteor.y, tailX, tailY);
            meteorGrad.addColorStop(0, '#FFFFFF');
            meteorGrad.addColorStop(0.3, `${currentPalette.starActive}88`);
            meteorGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = meteorGrad;
            ctx.lineWidth = 1.3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(activeMeteor.x, activeMeteor.y);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();

            // Tiny head glow
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(activeMeteor.x, activeMeteor.y, 1.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      }

      // If pre-vocal intro or no words, render ambient celestial holding scene
      if (!currentNodes || currentNodes.length === 0 || !currentWords || currentWords.length === 0) {
        const pulse = 18 + Math.sin(now * 0.002) * 4;
        drawCelestialStar(ctx, width * 0.5, height * 0.48, pulse, currentPalette.starActive, true, 1.0, now * 0.0003);
        ctx.restore();
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Compute gentle celestial micro-drift for each node
      const tSec = now * 0.001;
      const animatedNodes: Array<StarNode> = [];

      for (let i = 0; i < currentNodes.length; i++) {
        const n = currentNodes[i];
        if (isReduced) {
          animatedNodes.push({ ...n, x: n.baseX, y: n.baseY });
        } else {
          const dx = Math.sin(tSec * n.driftFreqX + n.driftPhaseX) * 3.5;
          const dy = Math.cos(tSec * n.driftFreqY + n.driftPhaseY) * 3.0;
          animatedNodes.push({ ...n, x: n.baseX + dx, y: n.baseY + dy });
        }
      }

      // Authoritative Active Word Index directly from audio clock
      const activeIdx = findActiveWordIndex(currentWords, effectiveTimeMs);

      // 3. V3 PRIMARY SHOOTING STAR & REVEAL (Complete elimination of static mesh & future nodes)
      // Rule: Never render future nodes or complete paths.
      // Render only the active star and the shooting star in flight along its curved Bezier trajectory!
      if (activeIdx >= 0 && activeIdx < animatedNodes.length) {
        const currentTargetNode = animatedNodes[activeIdx];
        const targetWord = currentWords[activeIdx];

        if (activeIdx === 0 || !targetWord) {
          // Stage 1: Resting at first word with brilliant 8-pointed celestial starburst
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
          const prevNode = animatedNodes[activeIdx - 1];
          // Calculate flight interval: shooting star travels between (prevNode) and (currentTargetNode)
          const wordDuration = targetWord.endMs - targetWord.startMs;
          const transitSpan = Math.min(480, Math.max(180, wordDuration * 0.45));
          const transitStart = targetWord.startMs - transitSpan * 0.65;
          const transitEnd = targetWord.startMs + transitSpan * 0.35;

          if (effectiveTimeMs < transitStart) {
            // Pre-flight: Still resting at previous node. Destination is 100% invisible!
            const rayLen = 22 + Math.sin(now * 0.003) * 3;
            drawCelestialStar(ctx, prevNode.x, prevNode.y, rayLen, currentPalette.starActive, true, 1.25, now * 0.0004);
          } else if (effectiveTimeMs >= transitEnd) {
            // Arrival: Has arrived and is resting at current target node with brilliant starburst!
            const rayLen = 25 + Math.sin(now * 0.003) * 4;
            drawCelestialStar(
              ctx,
              currentTargetNode.x,
              currentTargetNode.y,
              rayLen,
              currentPalette.starActive,
              true,
              1.38,
              now * 0.0004
            );
          } else {
            // IN FLIGHT: Curved shooting star traveling along organic cubic Bezier curve (Section 4 & 5)
            const u = Math.max(0.0, Math.min(1.0, (effectiveTimeMs - transitStart) / transitSpan));
            // Smooth cubic ease-in-out
            const ease = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;

            // Previous node residual fade
            const prevFade = Math.max(0, 1 - u * 2.2);
            if (prevFade > 0.05) {
              drawCelestialStar(ctx, prevNode.x, prevNode.y, 18, currentPalette.starActive, false, prevFade * 0.8, now * 0.0004);
            }

            // Curved trajectory control points
            const cp1X = currentTargetNode.cp1X ?? (prevNode.x * 0.67 + currentTargetNode.x * 0.33);
            const cp1Y = currentTargetNode.cp1Y ?? (prevNode.y * 0.67 + currentTargetNode.y * 0.33);
            const cp2X = currentTargetNode.cp2X ?? (prevNode.x * 0.33 + currentTargetNode.x * 0.67);
            const cp2Y = currentTargetNode.cp2Y ?? (prevNode.y * 0.33 + currentTargetNode.y * 0.67);

            // Draw curved shooting star: luminous trail develops behind the head along the traversed curve!
            drawCurvedShootingStar(
              ctx,
              prevNode.x,
              prevNode.y,
              cp1X,
              cp1Y,
              cp2X,
              cp2Y,
              currentTargetNode.x,
              currentTargetNode.y,
              ease,
              currentPalette.starActive,
              1.0
            );
            // NOTE: Ahead of star: 100% invisible. Destination node: 100% invisible until arrival.
          }
        }
      }

      // 4. Subtle Perimeter Screen Bezel Glow
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
