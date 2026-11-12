/**
 * VibeSync Color Extractor & WebGL Palette Utilities
 * Provides normalized WebGL RGB vector conversions, liquid LERP color interpolation,
 * and canvas image palette extraction.
 */

export type RGBColor = [number, number, number];
export type Palette = [string, string, string, string];
export type RGBPalette = [RGBColor, RGBColor, RGBColor, RGBColor];

/**
 * Normalizes a hex color string (#RRGGBB or RRGGBB) to WebGL vec3 floats [0.0 - 1.0].
 */
export function hexToRgb(hex: string): RGBColor {
  if (!hex || typeof hex !== 'string') return [0, 0, 0];
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b];
}

/**
 * Converts normalized WebGL [0..1, 0..1, 0..1] floats back to #RRGGBB string.
 */
export function rgbToHex(rgb: RGBColor): string {
  const clamp255 = (val: number) =>
    Math.max(0, Math.min(255, Math.round(val * 255)))
      .toString(16)
      .padStart(2, '0');

  return `#${clamp255(rgb[0])}${clamp255(rgb[1])}${clamp255(rgb[2])}`;
}

/**
 * Sanitizes an RGB tuple, replacing any NaN or infinite values with fallback or 0.
 */
export function sanitizeRgb(c: RGBColor, fallback: RGBColor = [0, 0, 0]): RGBColor {
  return [
    isNaN(c[0]) || !isFinite(c[0]) ? fallback[0] : Math.max(0, Math.min(1, c[0])),
    isNaN(c[1]) || !isFinite(c[1]) ? fallback[1] : Math.max(0, Math.min(1, c[1])),
    isNaN(c[2]) || !isFinite(c[2]) ? fallback[2] : Math.max(0, Math.min(1, c[2])),
  ];
}

/**
 * Single-step liquid LERP color interpolation:
 * currentRGB += (targetRGB - currentRGB) * rate
 */
export function liquidLerpStep(
  currentRgb: RGBColor,
  targetRgb: RGBColor,
  rate = 0.05
): RGBColor {
  const sanitizedCurrent = sanitizeRgb(currentRgb, targetRgb);
  const sanitizedTarget = sanitizeRgb(targetRgb, sanitizedCurrent);

  return [
    sanitizedCurrent[0] + (sanitizedTarget[0] - sanitizedCurrent[0]) * rate,
    sanitizedCurrent[1] + (sanitizedTarget[1] - sanitizedCurrent[1]) * rate,
    sanitizedCurrent[2] + (sanitizedTarget[2] - sanitizedCurrent[2]) * rate,
  ];
}

/**
 * Simulates multiple frames of liquid LERP convergence.
 */
export function simulateLiquidLerp(
  initialRgb: RGBColor,
  targetRgb: RGBColor,
  frames = 60,
  rate = 0.05
): RGBColor {
  let curr = [...initialRgb] as RGBColor;
  for (let i = 0; i < frames; i++) {
    curr = liquidLerpStep(curr, targetRgb, rate);
  }
  return curr;
}

/**
 * Interpolates an entire 4-color palette towards a target palette.
 */
export function lerpPalette(
  currentPalette: RGBColor[],
  targetPalette: RGBColor[],
  rate = 0.05
): RGBColor[] {
  return currentPalette.map((col, i) => {
    const target = targetPalette[i] || col;
    return liquidLerpStep(col, target, rate);
  });
}

/**
 * Generates an aesthetic CSS radial background gradient string from a 4-color palette.
 */
export function generateCssRadialGradient(palette: Palette | string[]): string {
  const c0 = palette[0] || '#05050A';
  const c1 = palette[1] || '#0F172A';
  const c2 = palette[2] || '#7C3AED';
  const c3 = palette[3] || '#06B6D4';

  return `radial-gradient(circle at 25% 25%, ${c2}66 0%, transparent 55%),
          radial-gradient(circle at 75% 75%, ${c3}55 0%, transparent 55%),
          radial-gradient(circle at 50% 50%, ${c1} 0%, ${c0} 100%)`;
}

/**
 * Extracts 4 representative aesthetic theme colors from an image or canvas.
 * Samples pixel data, quantizes into buckets, and returns 4 distinct hex codes.
 */
export function extractPaletteFromImage(
  source: HTMLImageElement | HTMLCanvasElement,
  fallbackPalette: Palette = ['#05050A', '#0F172A', '#7C3AED', '#06B6D4']
): Palette {
  if (typeof document === 'undefined') return fallbackPalette;

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return fallbackPalette;

    const sampleSize = 64;
    canvas.width = sampleSize;
    canvas.height = sampleSize;

    ctx.drawImage(source, 0, 0, sampleSize, sampleSize);
    const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

    // Collect RGB samples, weighting by saturation and avoiding pure black/white
    const colorBuckets: { r: number; g: number; b: number; weight: number }[] = [];
    const step = 4 * 4; // Sample every 4th pixel for speed

    for (let i = 0; i < imgData.length; i += step) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      const a = imgData[i + 3];

      if (a < 128) continue; // Skip transparent

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      const lightness = (max + min) / (2 * 255);
      const saturation = max === 0 ? 0 : delta / max;

      // Filter out extreme highlights or dark dead zones for vibrant accents
      const weight = saturation * (1 - Math.abs(lightness - 0.5) * 1.5) + 0.1;
      colorBuckets.push({ r, g, b, weight });
    }

    if (colorBuckets.length === 0) return fallbackPalette;

    // Sort by weight
    colorBuckets.sort((a, b) => b.weight - a.weight);

    // Pick 4 diverse colors
    const picked: RGBColor[] = [];
    const minDistanceSq = (0.25 * 255) ** 2;

    for (const item of colorBuckets) {
      if (picked.length >= 4) break;
      const isDistinct = picked.every((p) => {
        const dr = p[0] * 255 - item.r;
        const dg = p[1] * 255 - item.g;
        const db = p[2] * 255 - item.b;
        return dr * dr + dg * dg + db * db >= minDistanceSq;
      });

      if (isDistinct || picked.length === 0) {
        picked.push([item.r / 255, item.g / 255, item.b / 255]);
      }
    }

    while (picked.length < 4) {
      const fallbackIdx = picked.length;
      picked.push(hexToRgb(fallbackPalette[fallbackIdx]));
    }

    return [
      rgbToHex(picked[0]),
      rgbToHex(picked[1]),
      rgbToHex(picked[2]),
      rgbToHex(picked[3]),
    ];
  } catch {
    return fallbackPalette;
  }
}
