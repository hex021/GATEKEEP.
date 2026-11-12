/**
 * Constellation Theme — Geometry & Celestial Mathematics V2
 * Pure Canvas 2D vector drawing routines for:
 * 1. Celestial 8-pointed / 4-pointed radiant starbursts (Reference 5)
 * 2. Luminous tapered shooting star heads & tails (Reference 4)
 * 3. Connecting constellation hairlines with subtle astronomical ticks
 *
 * NOTE: All circular reticles, targeting rings, and cardinal tick crosshairs
 * have been completely removed per user requirements.
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
}

export interface ConstellationEdge {
  fromIndex: number;
  toIndex: number;
  hasTicks?: boolean;
}

/**
 * Draw a brilliant celestial starburst (Reference 5: fd6268babe85cb23760517b6c7ed633b.jpg).
 * Features 4 primary elongated needle rays, 4 secondary diagonal rays,
 * a pure white central core, and a soft radial luminous halo.
 */
export function drawCelestialStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rayLength: number,
  color: string,
  isEightPoint = true,
  brightness = 1.0,
  rotation = 0
): void {
  if (rayLength <= 0 || brightness <= 0) return;

  ctx.save();
  ctx.translate(x, y);
  if (rotation !== 0) ctx.rotate(rotation);

  const clampedBrightness = Math.max(0, Math.min(1.5, brightness));

  // 1. Soft radial glow halo
  const haloRadius = Math.max(8, rayLength * 0.9);
  const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, haloRadius);
  glowGrad.addColorStop(0, '#FFFFFF');
  glowGrad.addColorStop(0.2, color);
  glowGrad.addColorStop(0.55, `${color}33`);
  glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.globalAlpha = 0.65 * clampedBrightness;
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(0, 0, haloRadius, 0, Math.PI * 2);
  ctx.fill();

  // 2. Primary 4 Cardinal Elongated Rays (North, South, East, West)
  const drawNeedleRay = (len: number, baseWidth: number, angle: number) => {
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, -len);
    ctx.lineTo(baseWidth, 0);
    ctx.lineTo(0, len);
    ctx.lineTo(-baseWidth, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Outer ray color
  ctx.globalAlpha = 0.9 * clampedBrightness;
  ctx.fillStyle = color;
  const cardinalWidth = Math.max(1.8, rayLength * 0.08);
  drawNeedleRay(rayLength, cardinalWidth, 0); // Vertical
  drawNeedleRay(rayLength, cardinalWidth, Math.PI / 2); // Horizontal

  // Secondary 4 Diagonal Rays (45, 135, 225, 315 deg)
  if (isEightPoint) {
    const diagLen = rayLength * 0.52;
    const diagWidth = Math.max(1.2, cardinalWidth * 0.65);
    ctx.globalAlpha = 0.75 * clampedBrightness;
    drawNeedleRay(diagLen, diagWidth, Math.PI / 4);
    drawNeedleRay(diagLen, diagWidth, (3 * Math.PI) / 4);
  }

  // 3. Inner White Brilliant Spine
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = 0.95 * clampedBrightness;
  const coreRayLen = rayLength * 0.45;
  const coreRayWidth = Math.max(1.2, cardinalWidth * 0.45);
  drawNeedleRay(coreRayLen, coreRayWidth, 0);
  drawNeedleRay(coreRayLen, coreRayWidth, Math.PI / 2);

  // 4. Pure White Star Center Core
  const coreRadius = Math.max(2.0, rayLength * 0.12);
  ctx.beginPath();
  ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = 1.0;
  ctx.fill();

  ctx.restore();
}

/**
 * Draw a tapered shooting star with a luminous fading trail
 * (Reference 4: istockphoto-2190843828-612x612.jpg).
 *
 * @param ctx Canvas context
 * @param headX Current position of the star head
 * @param headY Current position of the star head
 * @param originX Previous node coordinate (tail points back towards here)
 * @param originY Previous node coordinate
 * @param speed Normalized flight speed (0 to 1) for trail length
 * @param accentColor Theme accent color
 * @param rotation Rotation of the head starburst
 */
export function drawShootingStar(
  ctx: CanvasRenderingContext2D,
  headX: number,
  headY: number,
  originX: number,
  originY: number,
  flightProgress: number, // 0 to 1
  accentColor: string,
  rotation = 0
): void {
  const dx = headX - originX;
  const dy = headY - originY;
  const dist = Math.hypot(dx, dy);

  if (dist > 1) {
    const dirX = dx / dist;
    const dirY = dy / dist;

    // Tail extends opposite to motion vector
    // Tail length expands dynamically during flight, tapering smoothly
    const maxTailLen = Math.min(160, Math.max(45, dist * 0.75));
    const tailLen = maxTailLen * Math.min(1.0, flightProgress * 1.5);

    const tailEndX = headX - dirX * tailLen;
    const tailEndY = headY - dirY * tailLen;

    const normalX = -dirY;
    const normalY = dirX;

    const headHalfWidth = 4.5;

    ctx.save();

    // 1. Outer Soft Luminous Tail Glow
    const outerGrad = ctx.createLinearGradient(headX, headY, tailEndX, tailEndY);
    outerGrad.addColorStop(0, `${accentColor}bb`);
    outerGrad.addColorStop(0.3, `${accentColor}55`);
    outerGrad.addColorStop(0.7, `${accentColor}18`);
    outerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.moveTo(headX + normalX * (headHalfWidth * 2.2), headY + normalY * (headHalfWidth * 2.2));
    ctx.lineTo(tailEndX, tailEndY);
    ctx.lineTo(headX - normalX * (headHalfWidth * 2.2), headY - normalY * (headHalfWidth * 2.2));
    ctx.closePath();
    ctx.fill();

    // 2. Inner Bright Tapered Spine (White / Intense Light)
    const innerGrad = ctx.createLinearGradient(headX, headY, tailEndX, tailEndY);
    innerGrad.addColorStop(0, '#FFFFFF');
    innerGrad.addColorStop(0.2, '#FFFFFFee');
    innerGrad.addColorStop(0.5, `${accentColor}aa`);
    innerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.moveTo(headX + normalX * headHalfWidth, headY + normalY * headHalfWidth);
    ctx.lineTo(tailEndX, tailEndY);
    ctx.lineTo(headX - normalX * headHalfWidth, headY - normalY * headHalfWidth);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // 3. Leading Celestial Starburst Head (Reference 5)
  const headRayLength = 22 + Math.sin(rotation * 2) * 3;
  drawCelestialStar(ctx, headX, headY, headRayLength, accentColor, true, 1.25, rotation);
}

/**
 * Draw a static or resting star vertex for a lyric word node.
 */
export function drawStarVertex(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  isActive: boolean,
  twinkle = 1.0
): void {
  if (isActive) {
    drawCelestialStar(ctx, x, y, radius * 1.8, color, true, 1.15 * twinkle, 0);
  } else {
    // 4-pointed diamond star for inactive nodes
    const outerR = Math.max(5, radius * 0.9 * twinkle);
    const innerR = outerR * 0.24;
    const points = 4;
    const step = Math.PI / points;

    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = i * step - Math.PI / 2;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7 * twinkle;
    ctx.fill();

    // Central bright point
    ctx.beginPath();
    ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.9;
    ctx.fill();

    ctx.restore();
  }
}

/**
 * Draw connecting constellation hairline between two star nodes.
 */
export function drawConstellationHairline(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  opacity: number,
  isHighlighted = false
): void {
  if (opacity <= 0) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
  ctx.strokeStyle = color;
  ctx.lineWidth = isHighlighted ? 1.8 : 1.0;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Build triangulated polygon edges between sequential words with cross-bracing.
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
      edges.push({ fromIndex: from, toIndex: to, hasTicks });
    }
  };

  // Narrative sequential backbone
  for (let i = 0; i < nodeCount - 1; i++) {
    addEdge(i, i + 1, i % 2 === 1);
  }

  // Cross-braces forming triangles
  for (let i = 0; i < nodeCount - 2; i++) {
    if (i % 2 === 0) {
      addEdge(i, i + 2, false);
    }
  }

  // Polygon chord closure for longer phrases
  if (nodeCount >= 5) {
    addEdge(0, Math.min(3, nodeCount - 1), true);
  }
  if (nodeCount >= 7) {
    addEdge(2, Math.min(5, nodeCount - 1), false);
  }

  return edges;
}
