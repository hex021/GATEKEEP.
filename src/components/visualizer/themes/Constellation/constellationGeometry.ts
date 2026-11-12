/**
 * Constellation Theme — Geometry & Celestial Mathematics
 * Pure Canvas 2D vector drawing routines for diamond astroid stars,
 * cardinal crosshair reticles, graduated axis hairlines, and triangulated polygon meshes.
 */

export interface StarNode {
  id: string;
  word: string;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  driftPhaseX: number;
  driftPhaseY: number;
  driftFreqX: number;
  driftFreqY: number;
  size: number;
  opacity: number;
  isActive: boolean;
  isPast: boolean;
  activationProgress: number; // 0 to 1
}

export interface ConstellationEdge {
  fromIndex: number;
  toIndex: number;
  progress: number; // 0 to 1
  hasTicks?: boolean;
}

/**
 * Draw a 4-pointed diamond star flare (astroid / hypocycloid geometry).
 * ratio inner/outer is typically ~0.22 as observed in reference reels.
 */
export function drawStarNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  outerRadius: number,
  color: string,
  isActive: boolean,
  bloom = true
): void {
  const innerRadius = outerRadius * 0.22;
  const points = 4;
  const step = Math.PI / points;

  ctx.save();
  ctx.translate(x, y);

  if (isActive && bloom) {
    ctx.shadowColor = color;
    ctx.shadowBlur = Math.min(18, outerRadius * 0.9);
  } else {
    ctx.shadowBlur = 0;
  }

  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * step - Math.PI / 2;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();

  // Draw tiny central bright core for active star
  if (isActive) {
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1.5, outerRadius * 0.18), 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draw the animated focal targeting reticle around the active singing word.
 * Concentric hairline ring + 4 cardinal crosshairs at 12, 3, 6, and 9 o'clock.
 */
export function drawFocalReticle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  rotation = 0,
  opacity = 1.0
): void {
  if (radius <= 0 || opacity <= 0) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

  // Outer subtle halo ring
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // Cardinal crosshair ticks extending outward at 0, 90, 180, 270 deg
  const tickInner = radius - 2;
  const tickOuter = radius + 6;

  ctx.lineWidth = 1.2;
  ctx.beginPath();
  // 12 o'clock
  ctx.moveTo(0, -tickInner);
  ctx.lineTo(0, -tickOuter);
  // 3 o'clock
  ctx.moveTo(tickInner, 0);
  ctx.lineTo(tickOuter, 0);
  // 6 o'clock
  ctx.moveTo(0, tickInner);
  ctx.lineTo(0, tickOuter);
  // 9 o'clock
  ctx.moveTo(-tickInner, 0);
  ctx.lineTo(-tickOuter, 0);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw fine connecting hairline between two star nodes, optionally with astronomical graduated ticks.
 */
export function drawGraduatedLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  opacity: number,
  progress = 1.0,
  hasTicks = false
): void {
  if (progress <= 0 || opacity <= 0) return;

  const currentX = x1 + (x2 - x1) * Math.min(1.0, Math.max(0.0, progress));
  const currentY = y1 + (y2 - y1) * Math.min(1.0, Math.max(0.0, progress));

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.0;
  ctx.lineCap = 'round';

  // Hairline vector
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(currentX, currentY);
  ctx.stroke();

  // Graduated astronomical ticks along segment if enabled and line is mostly drawn
  if (hasTicks && progress >= 0.75) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    if (dist > 80) {
      const normalX = -dy / dist;
      const normalY = dx / dist;
      const tickHalfLen = 2.5;
      const tickCount = Math.min(5, Math.floor(dist / 40));

      ctx.lineWidth = 1.0;
      ctx.beginPath();
      for (let i = 1; i <= tickCount; i++) {
        const t = i / (tickCount + 1);
        if (t <= progress) {
          const tx = x1 + dx * t;
          const ty = y1 + dy * t;
          ctx.moveTo(tx - normalX * tickHalfLen, ty - normalY * tickHalfLen);
          ctx.lineTo(tx + normalX * tickHalfLen, ty + normalY * tickHalfLen);
        }
      }
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Build triangulated polygon edges between sequential words with cross-bracing.
 * Produces an astronomical constellation chart rather than a naive zig-zag line.
 */
export function buildConstellationEdges(nodeCount: number): ConstellationEdge[] {
  if (nodeCount <= 1) return [];

  const edges: ConstellationEdge[] = [];
  const edgeSet = new Set<string>();

  const addEdge = (from: number, to: number, hasTicks = false) => {
    if (from === to || from < 0 || to < 0 || from >= nodeCount || to >= nodeCount) return;
    const key = from < to ? `${from}-${to}` : `${to}-${from}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push({ fromIndex: from, toIndex: to, progress: 1.0, hasTicks });
    }
  };

  // 1. Primary narrative sequential backbone
  for (let i = 0; i < nodeCount - 1; i++) {
    addEdge(i, i + 1, i % 2 === 1);
  }

  // 2. Cross-braces forming triangles / planar polyhedra (every 2nd or 3rd node)
  for (let i = 0; i < nodeCount - 2; i++) {
    if (i % 2 === 0) {
      addEdge(i, i + 2, false);
    }
  }

  // 3. Polygon chord closure for longer phrases
  if (nodeCount >= 5) {
    addEdge(0, Math.min(3, nodeCount - 1), true);
  }
  if (nodeCount >= 7) {
    addEdge(2, Math.min(5, nodeCount - 1), false);
  }

  return edges;
}
