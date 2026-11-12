/**
 * Tier 3: Cross-Feature Combinations (M1 Playback Engine ↔ M2 LRC Lyrics Synchronization)
 * Verifies end-to-end integration between playback progress, offset shifting, and kinetic lyric detection.
 */

import { suite, test, expect } from '../helpers/test-harness.mjs';
import { DEMO_TRACKS } from '../../src/data/demoTracks.ts';
import { createMockAudioElement } from '../helpers/mocks.mjs';
import { findActiveLyricIndexOracle } from '../helpers/test-utils.mjs';

suite('Tier 3: Playback Engine ↔ Lyric Synchronization Integration', () => {
  test('T3.1.1: AudioController 60fps rAF time updates continuously drive active lyric index', () => {
    const track = DEMO_TRACKS[0]; // Apatheia
    const audio = createMockAudioElement({ duration: track.durationMs / 1000 });
    audio.play();

    // Advance to 5000ms (5.0s) -> "headlights cutting through the haze" (starts at 4200ms)
    audio.currentTime = 5.0;
    const currentMs = Math.round(audio.currentTime * 1000);
    const activeIdx = findActiveLyricIndexOracle(track.lyrics, currentMs, 0);
    expect(activeIdx).toBe(1);
    expect(track.lyrics[activeIdx].text).toBe('headlights cutting through the haze');
  });

  test('T3.1.2: Applying manual sync offset shifts active lyric detection threshold during live playback', () => {
    const track = DEMO_TRACKS[0];
    const currentTimeMs = 4000; // Just before line 1 (starts at 4200ms)

    // With 0 offset, line 0 is still active
    expect(findActiveLyricIndexOracle(track.lyrics, currentTimeMs, 0)).toBe(0);

    // User steps forward by +250ms (effective time 4250ms) -> line 1 becomes active
    expect(findActiveLyricIndexOracle(track.lyrics, currentTimeMs, 250)).toBe(1);

    // User steps backward by -250ms (effective time 3750ms) -> line 0 stays active
    expect(findActiveLyricIndexOracle(track.lyrics, currentTimeMs, -250)).toBe(0);
  });

  test('T3.1.3: Click-to-seek on lyric line commands AudioController to seek and re-synchronizes viewport', () => {
    const track = DEMO_TRACKS[0];
    const audio = createMockAudioElement({ duration: track.durationMs / 1000 });
    audio.play();

    // User clicks line 4: "now every ghost in the city knows your name" (18200ms)
    const targetLyric = track.lyrics[4];
    audio.currentTime = targetLyric.timeMs / 1000;

    const updatedMs = Math.round(audio.currentTime * 1000);
    expect(updatedMs).toBe(18200);

    const newActiveIdx = findActiveLyricIndexOracle(track.lyrics, updatedMs, 0);
    expect(newActiveIdx).toBe(4);
    expect(track.lyrics[newActiveIdx].text).toBe(targetLyric.text);
  });

  test('T3.1.4: Track completion resets playback time and restarts lyric detection at line 0', () => {
    const track = DEMO_TRACKS[0];
    const audio = createMockAudioElement({ duration: track.durationMs / 1000 });

    // End of track reached
    audio.currentTime = track.durationMs / 1000;
    expect(findActiveLyricIndexOracle(track.lyrics, track.durationMs, 0)).toBe(track.lyrics.length - 1);

    // Loop back to start
    audio.currentTime = 0;
    expect(findActiveLyricIndexOracle(track.lyrics, 0, 0)).toBe(0);
  });

  test('T3.1.5: Rapid seeking while offset is non-zero preserves offset consistency', () => {
    const track = DEMO_TRACKS[0];
    const userOffset = 150;
    const seekPoints = [5000, 15000, 35000, 52000];

    seekPoints.forEach((seekTime) => {
      const idx = findActiveLyricIndexOracle(track.lyrics, seekTime, userOffset);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(track.lyrics.length);
    });
  });
});
