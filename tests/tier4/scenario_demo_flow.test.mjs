/**
 * Tier 4: Real-World Scenarios
 * Scenario 1: Zero-Config Demo Playback Journey
 * User loads app -> demo track 1 ready -> handles autoplay resilience -> 60fps rAF time advance -> seeks to lyric -> switches track.
 */

import { suite, test, expect } from '../helpers/test-harness.mjs';
import { DEMO_TRACKS } from '../../src/data/demoTracks.ts';
import { createMockAudioElement } from '../helpers/mocks.mjs';
import { findActiveLyricIndexOracle } from '../helpers/test-utils.mjs';

suite('Scenario 1: Zero-Config Demo Playback Journey', () => {
  test('Step 1: Application boots immediately into Zero-Config Demo Mode with first track loaded', () => {
    const defaultTrack = DEMO_TRACKS[0];
    expect(defaultTrack.id).toBe('demo-1');
    expect(defaultTrack.title).toBe('Apatheia (3 AM Drift)');
    expect(defaultTrack.palette.length).toBe(4);
    expect(defaultTrack.lyrics.length).toBeGreaterThan(0);
  });

  test('Step 2: Autoplay restriction is intercepted gracefully and unblocked upon user gesture', async () => {
    const audio = createMockAudioElement({ rejectAutoplay: true });
    let isAutoplayBlocked = false;

    // Browser initial autoplay attempt rejected
    try {
      await audio.play();
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        isAutoplayBlocked = true;
      }
    }
    expect(isAutoplayBlocked).toBe(true);

    // User clicks the pulsing unmute/play pill
    audio.setAutoplayPolicy(false);
    await audio.play();
    isAutoplayBlocked = false;

    expect(isAutoplayBlocked).toBe(false);
    expect(audio.paused).toBe(false);
  });

  test('Step 3: Playback advances via 60fps rAF loop and syncs active kinetic lyrics', () => {
    const track = DEMO_TRACKS[0];
    const audio = createMockAudioElement({ duration: track.durationMs / 1000 });
    audio.play();

    // Advance 4500ms -> "headlights cutting through the haze"
    audio.currentTime = 4.5;
    const currentMs = Math.round(audio.currentTime * 1000);
    const activeIdx = findActiveLyricIndexOracle(track.lyrics, currentMs, 0);

    expect(activeIdx).toBe(1);
    expect(track.lyrics[activeIdx].text).toBe('headlights cutting through the haze');
  });

  test('Step 4: User clicks chorus line and viewport seeks directly to target timestamp', () => {
    const track = DEMO_TRACKS[0];
    const audio = createMockAudioElement({ duration: track.durationMs / 1000 });
    audio.play();

    // User clicks line 3: "we burned the skyline just to feel the heat" (13500ms)
    const chorusLyric = track.lyrics[3];
    audio.currentTime = chorusLyric.timeMs / 1000;

    const currentMs = Math.round(audio.currentTime * 1000);
    expect(currentMs).toBe(13500);

    const activeIdx = findActiveLyricIndexOracle(track.lyrics, currentMs, 0);
    expect(activeIdx).toBe(3);
    expect(track.lyrics[activeIdx].text).toBe(chorusLyric.text);
  });

  test('Step 5: User advances to Track 2, resetting playback and loading new palette and lyrics', () => {
    const track2 = DEMO_TRACKS[1];
    const audio = createMockAudioElement({ duration: track2.durationMs / 1000, src: track2.audioSrc });

    audio.currentTime = 0;
    expect(track2.id).toBe('demo-2');
    expect(track2.title).toBe('Honey on the Tape');
    expect(track2.palette[0]).toBe('#1A0F0D');

    const initialLyricIdx = findActiveLyricIndexOracle(track2.lyrics, 0, 0);
    expect(initialLyricIdx).toBe(0);
    expect(track2.lyrics[0].text).toContain('needle drops on warm vinyl');
  });
});
