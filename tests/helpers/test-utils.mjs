/**
 * VibeSync Test Utilities & Mathematical Oracles
 * Authoritative reference implementations for algorithmic assertions across the 4-tier test suite.
 */

import { hexToRgb } from '../../src/lib/utils.ts';

/**
 * Authoritative Binary Search Active Lyric Detector.
 * O(log N) lookup applying manual sync offset [-500ms, +500ms].
 */
export function findActiveLyricIndexOracle(lyrics, currentTimeMs, offsetMs = 0) {
  if (!lyrics || lyrics.length === 0) return -1;
  const effectiveTime = currentTimeMs + offsetMs;

  if (effectiveTime < lyrics[0].timeMs) return -1;
  if (effectiveTime >= lyrics[lyrics.length - 1].timeMs) return lyrics.length - 1;

  let low = 0;
  let high = lyrics.length - 1;
  let result = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lyrics[mid].timeMs <= effectiveTime) {
      result = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return result;
}

/**
 * Liquid LERP color step oracle:
 * currentRGB += (targetRGB - currentRGB) * 0.05
 */
export function liquidLerpStep(currentRgb, targetRgb, rate = 0.05) {
  return [
    currentRgb[0] + (targetRgb[0] - currentRgb[0]) * rate,
    currentRgb[1] + (targetRgb[1] - currentRgb[1]) * rate,
    currentRgb[2] + (targetRgb[2] - currentRgb[2]) * rate,
  ];
}

/**
 * Multi-step liquid LERP simulation
 */
export function simulateLiquidLerp(initialRgb, targetRgb, frames = 60, rate = 0.05) {
  let curr = [...initialRgb];
  for (let i = 0; i < frames; i++) {
    curr = liquidLerpStep(curr, targetRgb, rate);
  }
  return curr;
}

/**
 * SSRF URL Validator Oracle
 * Enforces strict RFC 1918, link-local, loopback, and metadata blocking.
 */
export function isSafeImageUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;

    const rawHost = parsed.hostname.toLowerCase();
    const host = rawHost.replace(/^\[|\]$/g, '');

    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0') return false;
    if (host.includes('127.0.0.1') || host.startsWith('::ffff:') || host.startsWith('0x') || host.startsWith('0177')) return false;
    if (host === 'metadata.google.internal' || host === '169.254.169.254') return false;

    // IPv4 RFC 1918 regex check
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = host.match(ipv4Regex);
    if (match) {
      const octet1 = parseInt(match[1], 10);
      const octet2 = parseInt(match[2], 10);
      if (octet1 === 10) return false; // 10.0.0.0/8
      if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return false; // 172.16.0.0/12
      if (octet1 === 192 && octet2 === 168) return false; // 192.168.0.0/16
      if (octet1 === 127) return false; // Loopback
      if (octet1 === 169 && octet2 === 254) return false; // Link-local
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Spotify Track ID / URL extractor oracle
 */
export function extractSpotifyTrackId(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Pattern 1: spotify:track:4cOdK2wGLETKBW3PvgPWqT
  const uriMatch = trimmed.match(/^spotify:track:([a-zA-Z0-9]{22})$/);
  if (uriMatch) return uriMatch[1];

  // Pattern 2: https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=...
  const urlMatch = trimmed.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]{22})/);
  if (urlMatch) return urlMatch[1];

  // Pattern 3: raw 22-char alphanumeric ID
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) return trimmed;

  return null;
}

/**
 * 9:16 Social Card Aspect Ratio Calculator
 */
export function calculateStoryCardDimensions(baseWidth = 360, pixelRatio = 3) {
  const baseHeight = Math.round((baseWidth * 16) / 9);
  return {
    baseWidth,
    baseHeight, // 640
    exportWidth: baseWidth * pixelRatio, // 1080
    exportHeight: baseHeight * pixelRatio, // 1920
    aspectRatio: baseWidth / baseHeight, // 0.5625
  };
}

/**
 * Pomodoro Wall-Clock delta tracker oracle
 */
export class DriftFreeTimerOracle {
  constructor(initialSeconds = 1500) {
    this.initialSeconds = initialSeconds;
    this.remainingSeconds = initialSeconds;
    this.startTimestamp = null;
    this.isRunning = false;
  }

  start(timestamp = Date.now()) {
    this.isRunning = true;
    this.startTimestamp = timestamp;
  }

  pause() {
    this.isRunning = false;
    this.startTimestamp = null;
  }

  tick(currentTimestamp) {
    if (!this.isRunning || !this.startTimestamp) return this.remainingSeconds;
    const elapsedSeconds = Math.floor((currentTimestamp - this.startTimestamp) / 1000);
    this.remainingSeconds = Math.max(0, this.initialSeconds - elapsedSeconds);
    return this.remainingSeconds;
  }
}
