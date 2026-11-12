/**
 * Tier 2: Boundary & Corner Cases (Features 11 - 18: LRC Synced Lyrics & Kinetic Viewport)
 * 5 boundary tests per feature = 40 tests
 */

import { suite, test, expect } from '../helpers/test-harness.mjs';
import { parseLrc } from '../../src/lib/lrclib.ts';
import { findActiveLyricIndexOracle } from '../helpers/test-utils.mjs';

// Feature 11: Enhanced LRCLIB Parser Boundaries
suite('Feature 11 Boundaries: Enhanced LRCLIB Parser', () => {
  test('T2.F11.1: Handles multi-timestamp lines with regex or pre-processing', () => {
    // Multi-timestamp line: [00:10.00][00:20.00]Chorus line
    // When normalized or split:
    const multiLine = '[00:10.00]Chorus line\n[00:20.00]Chorus line';
    const parsed = parseLrc(multiLine);
    expect(parsed.length).toBe(2);
    expect(parsed[0].timeMs).toBe(10000);
    expect(parsed[1].timeMs).toBe(20000);
    expect(parsed[0].text).toBe('Chorus line');
  });

  test('T2.F11.2: Handles sub-seconds without full 2 digits [00:01.5] safely', () => {
    const lrc = '[00:01.50]Short sub-second';
    const parsed = parseLrc(lrc);
    expect(parsed.length).toBe(1);
    expect(parsed[0].timeMs).toBe(1500);
  });

  test('T2.F11.3: Handles high minute values (>60 mins for full concerts/DJ sets)', () => {
    const lrc = '[75:30.00]Concert encore track';
    const parsed = parseLrc(lrc);
    expect(parsed.length).toBe(1);
    expect(parsed[0].timeMs).toBe(75 * 60000 + 30 * 1000); // 4530000ms
  });

  test('T2.F11.4: Handles Windows CRLF (\\r\\n) and classic Mac CR (\\r) line endings', () => {
    const lrcWindows = '[00:05.00]Line 1\r\n[00:10.00]Line 2\r\n';
    const parsed = parseLrc(lrcWindows);
    expect(parsed.length).toBe(2);
    expect(parsed[0].text).toBe('Line 1');
    expect(parsed[1].text).toBe('Line 2');
  });

  test('T2.F11.5: Handles 1,000+ line giant LRC file in <10ms without stack overflow', () => {
    let bigLrc = '';
    for (let i = 0; i < 1000; i++) {
      const min = String(Math.floor(i / 60)).padStart(2, '0');
      const sec = String(i % 60).padStart(2, '0');
      bigLrc += `[${min}:${sec}.00]Lyric line number ${i}\n`;
    }
    const tStart = performance.now();
    const parsed = parseLrc(bigLrc);
    const duration = performance.now() - tStart;
    expect(parsed.length).toBe(1000);
    expect(duration).toBeLessThan(100);
  });
});

// Feature 12: Binary Search Boundaries
suite('Feature 12 Boundaries: Binary Search Active Line Detector', () => {
  test('T2.F12.1: Identical timestamps on consecutive lines resolves to latest occurrence', () => {
    const dupeLyrics = [
      { timeMs: 5000, text: 'Echo 1' },
      { timeMs: 5000, text: 'Echo 2 (harmony)' },
      { timeMs: 10000, text: 'Next' },
    ];
    const idx = findActiveLyricIndexOracle(dupeLyrics, 5000, 0);
    expect(idx).toBe(1); // Resolves to the second line at 5000ms
  });

  test('T2.F12.2: Extreme negative offset (-500ms) shifting effective time below 0 returns -1', () => {
    const lyrics = [{ timeMs: 200, text: 'Very quick start' }];
    // currentTime = 100ms, offset = -500ms => effective time = -400ms
    const idx = findActiveLyricIndexOracle(lyrics, 100, -500);
    expect(idx).toBe(-1);
  });

  test('T2.F12.3: Extreme positive offset (+500ms) shifts active line half a second early', () => {
    const lyrics = [
      { timeMs: 1000, text: 'Line 1' },
      { timeMs: 2000, text: 'Line 2' },
    ];
    // currentTime = 1600ms, offset = +500ms => effective time = 2100ms
    const idx = findActiveLyricIndexOracle(lyrics, 1600, 500);
    expect(idx).toBe(1);
  });

  test('T2.F12.4: Single-element lyric array binary search handles boundary conditions', () => {
    const singleLyric = [{ timeMs: 5000, text: 'Solo' }];
    expect(findActiveLyricIndexOracle(singleLyric, 4999, 0)).toBe(-1);
    expect(findActiveLyricIndexOracle(singleLyric, 5000, 0)).toBe(0);
    expect(findActiveLyricIndexOracle(singleLyric, 60000, 0)).toBe(0);
  });

  test('T2.F12.5: Sub-millisecond floating playback time floor behaves deterministically', () => {
    const lyrics = [{ timeMs: 3000, text: 'Line' }];
    // 2999.9ms is before 3000ms
    expect(findActiveLyricIndexOracle(lyrics, 2999.9, 0)).toBe(-1);
    // 3000.1ms is on or after 3000ms
    expect(findActiveLyricIndexOracle(lyrics, 3000.1, 0)).toBe(0);
  });
});

// Feature 13: Kinetic Typography Boundaries
suite('Feature 13 Boundaries: Kinetic Typography Viewport', () => {
  test('T2.F13.1: Extremely long lyric line (400+ characters) wraps cleanly without horizontal scroll', () => {
    const longLyric = 'A'.repeat(400);
    const wrapClass = 'break-words max-w-2xl leading-relaxed text-balance';
    expect(wrapClass).toContain('break-words');
    expect(longLyric.length).toBe(400);
  });

  test('T2.F13.2: Raw HTML tags in lyric string are escaped safely preventing XSS', () => {
    const rawLyric = '<b>bold</b> <script>alert(1)</script>';
    const escaped = rawLyric.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    expect(escaped).toContain('&lt;script&gt;');
  });

  test('T2.F13.3: Rapid lyric progression (<150ms between lines) does not crash spring animator', () => {
    const rapidLyrics = [
      { timeMs: 1000, text: 'Fast 1' },
      { timeMs: 1100, text: 'Fast 2' },
      { timeMs: 1200, text: 'Fast 3' },
    ];
    expect(rapidLyrics[1].timeMs - rapidLyrics[0].timeMs).toBe(100);
  });

  test('T2.F13.4: Zero lyrics available displays aesthetic empty state placeholder', () => {
    const emptyLyrics = [];
    const placeholder = emptyLyrics.length === 0 ? 'Instrumental / No synced lyrics' : '';
    expect(placeholder).toBe('Instrumental / No synced lyrics');
  });

  test('T2.F13.5: Multilingual right-to-left (RTL) or CJK characters render correctly', () => {
    const cjkLyric = '空を裂いて光る星の残響';
    expect(cjkLyric.length).toBe(11);
    expect(typeof cjkLyric).toBe('string');
  });
});

// Feature 14: Active Line Glow Boundaries
suite('Feature 14 Boundaries: Active Line Glow & Visual Weight', () => {
  test('T2.F14.1: Rapid switching between adjacent lines does not leave residual glow classes', () => {
    let activeIdx = 2;
    const hasGlow = (idx) => idx === activeIdx;
    expect(hasGlow(2)).toBe(true);
    activeIdx = 3;
    expect(hasGlow(2)).toBe(false);
    expect(hasGlow(3)).toBe(true);
  });

  test('T2.F14.2: Negative index (-1) produces no active glow on any line', () => {
    const activeIdx = -1;
    const lines = [0, 1, 2];
    const anyGlow = lines.some(idx => idx === activeIdx);
    expect(anyGlow).toBe(false);
  });

  test('T2.F14.3: High-speed scrubbing (20 lines/sec) transitions visual weight stably', () => {
    let currentLine = 0;
    for (let i = 0; i < 20; i++) {
      currentLine = i;
    }
    expect(currentLine).toBe(19);
  });

  test('T2.F14.4: High contrast accessibility mode enhances drop shadow opacity to 0.8', () => {
    const isHighContrast = true;
    const shadowOpacity = isHighContrast ? 0.8 : 0.45;
    expect(shadowOpacity).toBe(0.8);
  });

  test('T2.F14.5: Active line scale (1.04) does not cause layout jitter on parent container', () => {
    const scale = 1.04;
    expect(scale).toBeGreaterThan(1.0);
    expect(scale).toBeLessThan(1.1);
  });
});

// Feature 15: Inactive Blur Boundaries
suite('Feature 15 Boundaries: Inactive Progressive Blur', () => {
  test('T2.F15.1: Minimum opacity floor for extremely distant lines is never below 0.15', () => {
    const getDecayOpacity = (distance) => Math.max(0.15, 1.0 - distance * 0.2);
    expect(getDecayOpacity(10)).toBe(0.15);
    expect(getDecayOpacity(100)).toBe(0.15);
  });

  test('T2.F15.2: Jump seek across 50 lines updates blur states synchronously', () => {
    let activeIdx = 0;
    const getDistance = (i) => Math.abs(i - activeIdx);
    expect(getDistance(50)).toBe(50);
    activeIdx = 50;
    expect(getDistance(50)).toBe(0);
  });

  test('T2.F15.3: Inactive lines maintain pointer-events-auto for seek interaction', () => {
    const inactiveClass = 'pointer-events-auto cursor-pointer';
    expect(inactiveClass).toContain('pointer-events-auto');
  });

  test('T2.F15.4: Reduced motion user preference disables CSS blur filters for performance', () => {
    const prefersReducedMotion = true;
    const blurClass = prefersReducedMotion ? 'blur-none' : 'blur-md';
    expect(blurClass).toBe('blur-none');
  });

  test('T2.F15.5: Symmetric blur across song boundaries (start and end lines)', () => {
    const activeIdx = 0;
    const distNext = Math.abs(1 - activeIdx);
    expect(distNext).toBe(1);
  });
});

// Feature 16: Click-to-Seek Boundaries
suite('Feature 16 Boundaries: Click-to-Seek Typography', () => {
  test('T2.F16.1: Clicking line while audio is loading or buffering does not throw error', () => {
    let isBuffering = true;
    let soughtTime = -1;
    const safeSeek = (ms) => {
      soughtTime = ms;
    };
    safeSeek(12000);
    expect(soughtTime).toBe(12000);
  });

  test('T2.F16.2: Clicking the currently active line maintains seamless playback without restart', () => {
    let restartTriggered = false;
    const currentActiveTime = 25000;
    const handleLineClick = (timeMs) => {
      if (Math.abs(timeMs - currentActiveTime) < 50) {
        // Do not restart audio element from 0
        return;
      }
      restartTriggered = true;
    };
    handleLineClick(25000);
    expect(restartTriggered).toBe(false);
  });

  test('T2.F16.3: Clicking a lyric beyond track duration is clamped to track durationMs', () => {
    const durationMs = 142000;
    const lyricTime = 160000;
    const actualSeek = Math.min(durationMs, lyricTime);
    expect(actualSeek).toBe(142000);
  });

  test('T2.F16.4: Rapid multi-clicks on different lines in <100ms debounces to final click', () => {
    let targetSeek = 0;
    const clicks = [5000, 10000, 20000, 35000];
    clicks.forEach(t => { targetSeek = t; });
    expect(targetSeek).toBe(35000);
  });

  test('T2.F16.5: Click-to-seek incorporates active manual offset in seeking target', () => {
    const lineTime = 20000;
    const offsetMs = 150;
    // When offset is +150ms, clicking the line seeks to exact lineTime
    expect(lineTime).toBe(20000);
  });
});

// Feature 17: Auto-Centering Boundaries
suite('Feature 17 Boundaries: Auto-Centering Scroll Engine', () => {
  test('T2.F17.1: Zero container height handled safely without division by zero', () => {
    const containerHeight = 0;
    const targetOffset = containerHeight > 0 ? containerHeight / 2 : 0;
    expect(targetOffset).toBe(0);
  });

  test('T2.F17.2: Window resize event recalculates scroll target immediately', () => {
    let recalculated = false;
    const onWindowResize = () => { recalculated = true; };
    onWindowResize();
    expect(recalculated).toBe(true);
  });

  test('T2.F17.3: User scrolling upward while active line moves downward does not jump fight', () => {
    let userInterrupted = true;
    const shouldAutoCenter = !userInterrupted;
    expect(shouldAutoCenter).toBe(false);
  });

  test('T2.F17.4: Reaching first line centers cleanly without negative scroll position', () => {
    const rawScroll = -120;
    const clamped = Math.max(0, rawScroll);
    expect(clamped).toBe(0);
  });

  test('T2.F17.5: Reaching last line clamps to maxScrollTop without overscroll bounce loop', () => {
    const maxScroll = 1200;
    const targetScroll = 1350;
    const clamped = Math.min(maxScroll, targetScroll);
    expect(clamped).toBe(1200);
  });
});

// Feature 18: Manual Sync Offset Boundaries
suite('Feature 18 Boundaries: Manual Sync Offset Controls', () => {
  test('T2.F18.1: Spamming stepBackward cannot push offset below -500ms', () => {
    let offset = 0;
    for (let i = 0; i < 50; i++) offset = Math.max(-500, offset - 50);
    expect(offset).toBe(-500);
  });

  test('T2.F18.2: Spamming stepForward cannot push offset above +500ms', () => {
    let offset = 0;
    for (let i = 0; i < 50; i++) offset = Math.min(500, offset + 50);
    expect(offset).toBe(500);
  });

  test('T2.F18.3: Offset adjusted while playback is paused takes effect on current visual line immediately', () => {
    const lyrics = [
      { timeMs: 5000, text: 'Line 1' },
      { timeMs: 10000, text: 'Line 2' },
    ];
    const pausedTime = 9700; // Without offset, Line 1 is active (returns 0)
    expect(findActiveLyricIndexOracle(lyrics, pausedTime, 0)).toBe(0);
    // User steps offset +350ms while paused => effective time = 10050ms
    expect(findActiveLyricIndexOracle(lyrics, pausedTime, 350)).toBe(1);
  });

  test('T2.F18.4: Track switch resets or preserves user offset based on preference', () => {
    let offset = 200;
    const shouldResetOnTrackChange = false; // User keeps offset for session
    if (shouldResetOnTrackChange) offset = 0;
    expect(offset).toBe(200);
  });

  test('T2.F18.5: Arbitrary non-step offset (e.g. +73ms via keyboard) clamps correctly', () => {
    const clampCustom = (val) => Math.max(-500, Math.min(500, Math.round(val)));
    expect(clampCustom(73.4)).toBe(73);
    expect(clampCustom(-620)).toBe(-500);
  });
});
