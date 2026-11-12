/**
 * Palette Extractor & Color Engine for Constellation Theme
 * Robust HEX & RGB parser supporting Gatekeep's currentTrack.palette,
 * CORS-safe canvas downsampling, and calibrated reference presets.
 */

export interface ConstellationPalette {
  id: 'solar-gold' | 'crimson-duotone' | 'silver-slate';
  name: string;
  bgBase: string; // Deep void background
  bgAtmosphere: string; // Secondary ambient glow or smoke tint
  lineInactive: string; // Inactive connector hairline
  lineActive: string; // Active connector line
  starInactive: string; // Inactive diamond star
  starActive: string; // Active singing star
  reticle: string; // Focal targeting ring and crosshairs
  textActive: string; // Active headline word
  textInactive: string; // Inactive label word
  bezelGlow: string; // Outer screen rim neon
}

export const CONSTELLATION_PRESETS: Record<string, ConstellationPalette> = {
  'solar-gold': {
    id: 'solar-gold',
    name: 'Solar Gold',
    bgBase: '#000000',
    bgAtmosphere: 'rgba(234, 179, 8, 0.08)',
    lineInactive: 'rgba(184, 146, 48, 0.35)',
    lineActive: 'rgba(250, 204, 21, 0.95)',
    starInactive: 'rgba(234, 179, 8, 0.65)',
    starActive: '#fef08a',
    reticle: '#facc15',
    textActive: '#fef08a',
    textInactive: 'rgba(180, 140, 60, 0.45)',
    bezelGlow: 'rgba(234, 179, 8, 0.25)',
  },
  'crimson-duotone': {
    id: 'crimson-duotone',
    name: 'Crimson Duotone',
    bgBase: '#0d0204',
    bgAtmosphere: 'rgba(185, 28, 28, 0.18)',
    lineInactive: 'rgba(255, 255, 255, 0.30)',
    lineActive: 'rgba(255, 255, 255, 0.95)',
    starInactive: 'rgba(244, 63, 94, 0.60)',
    starActive: '#ffffff',
    reticle: '#ffffff',
    textActive: '#ffffff',
    textInactive: 'rgba(220, 160, 175, 0.40)',
    bezelGlow: 'rgba(255, 255, 255, 0.45)',
  },
  'silver-slate': {
    id: 'silver-slate',
    name: 'Silver / Smoked Slate',
    bgBase: '#070a0e',
    bgAtmosphere: 'rgba(100, 116, 139, 0.12)',
    lineInactive: 'rgba(148, 163, 184, 0.35)',
    lineActive: 'rgba(248, 250, 252, 0.95)',
    starInactive: 'rgba(148, 163, 184, 0.60)',
    starActive: '#ffffff',
    reticle: '#f8fafc',
    textActive: '#ffffff',
    textInactive: 'rgba(148, 163, 184, 0.45)',
    bezelGlow: 'rgba(255, 255, 255, 0.35)',
  },
};

export interface ParsedRGB {
  r: number;
  g: number;
  b: number;
  luminance: number; // Relative luminance: 0.2126R + 0.7152G + 0.0722B
  hue: number; // 0-360 degrees
  saturation: number; // 0-1
}

export function parseColorToRGB(colorStr: string): ParsedRGB | null {
  if (!colorStr) return null;
  const str = colorStr.trim();

  // 1. Parse HEX (#RGB, #RRGGBB, #RRGGBBAA)
  if (str.startsWith('#')) {
    const hex = str.slice(1);
    let r = 255,
      g = 255,
      b = 255;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length >= 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
    return computeColorMetrics(r, g, b);
  }

  // 2. Parse rgb(...) or rgba(...)
  const rgbMatch = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    const r = Math.min(255, Math.max(0, parseInt(rgbMatch[1], 10)));
    const g = Math.min(255, Math.max(0, parseInt(rgbMatch[2], 10)));
    const b = Math.min(255, Math.max(0, parseInt(rgbMatch[3], 10)));
    return computeColorMetrics(r, g, b);
  }

  return null;
}

function computeColorMetrics(r: number, g: number, b: number): ParsedRGB {
  const normR = r / 255;
  const normG = g / 255;
  const normB = b / 255;
  const max = Math.max(normR, normG, normB);
  const min = Math.min(normR, normG, normB);
  const delta = max - min;

  // Hue calculation (0-360)
  let hue = 0;
  if (delta !== 0) {
    if (max === normR) hue = ((normG - normB) / delta) % 6;
    else if (max === normG) hue = (normB - normR) / delta + 2;
    else hue = (normR - normG) / delta + 4;
    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;
  }

  const saturation = max === 0 ? 0 : delta / max;
  const luminance = 0.2126 * normR + 0.7152 * normG + 0.0722 * normB;

  return { r, g, b, luminance, hue, saturation };
}

/**
 * Resolve track palette based on currentTrack.palette or album art.
 * Selects between Solar Gold, Crimson Duotone, and Silver Slate.
 */
export function resolvePaletteFromTrack(
  fallbackPalette?: string[] | null,
  imageElement?: HTMLImageElement | null
): ConstellationPalette {
  // Priority 1: Direct parsing of Gatekeep's currentTrack.palette (HEX/RGB)
  if (fallbackPalette && fallbackPalette.length > 0) {
    for (const colorStr of fallbackPalette) {
      const parsed = parseColorToRGB(colorStr);
      if (parsed) {
        // High saturation checks against hue sectors:
        // Hue 35-65: Amber / Gold / Warm Yellow
        if (parsed.hue >= 35 && parsed.hue <= 65 && parsed.saturation > 0.25) {
          return CONSTELLATION_PRESETS['solar-gold'];
        }
        // Hue 340-360 or 0-25: Red / Crimson / Burgundy
        if ((parsed.hue >= 340 || parsed.hue <= 25) && parsed.saturation > 0.25) {
          return CONSTELLATION_PRESETS['crimson-duotone'];
        }
      }
    }
  }

  // Priority 2: Offscreen Canvas Sampler on album art (with full CORS safety guard)
  if (
    typeof document !== 'undefined' &&
    imageElement &&
    imageElement.complete &&
    imageElement.naturalWidth > 0
  ) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 48;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(imageElement, 0, 0, 48, 48);
        const imgData = ctx.getImageData(0, 0, 48, 48).data;
        let sumR = 0,
          sumG = 0,
          sumB = 0;
        let samples = 0;
        for (let i = 0; i < imgData.length; i += 16) {
          sumR += imgData[i];
          sumG += imgData[i + 1];
          sumB += imgData[i + 2];
          samples++;
        }
        if (samples > 0) {
          const avg = computeColorMetrics(sumR / samples, sumG / samples, sumB / samples);
          if (avg.hue >= 35 && avg.hue <= 65 && avg.saturation > 0.2) {
            return CONSTELLATION_PRESETS['solar-gold'];
          }
          if ((avg.hue >= 340 || avg.hue <= 25) && avg.saturation > 0.2) {
            return CONSTELLATION_PRESETS['crimson-duotone'];
          }
        }
      }
    } catch {
      // Graceful fallback on CORS tainted canvas error
    }
  }

  // Default: Silver / Smoked Slate (clean editorial reference standard)
  return CONSTELLATION_PRESETS['silver-slate'];
}
