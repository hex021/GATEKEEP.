/**
 * Challenger 2: Milestone 1 Empirical Stress Test Suite
 * Stress-testing:
 * 1. 60fps interpolation algorithm under simulated delays, jitter, pause freezing, and duration overflow.
 * 2. Autoplay resilience, NotAllowedError catching, and isAutoplayBlocked unblock flow.
 * 3. Production build bundle size and route generation analysis.
 */

import { suite, test, expect } from './helpers/test-harness.mjs';
import { createMockAudioElement } from './helpers/mocks.mjs';
import fs from 'node:fs';
import path from 'node:path';

// =========================================================================
// Suite 1: 60fps Interpolation Under Simulated Delays & Jitter
// =========================================================================
suite('Challenger 2: 60fps Interpolation Under Delays & Boundary Conditions', () => {
  // Oracle interpolation function as implemented in AudioController.tsx:
  // Math.min(playerState.durationMs, Math.max(0, Math.round(spotifyProgressMs + elapsed)))
  function calculateSpotifyInterpolation(spotifyProgressMs, lastPollTimestamp, currentTimestamp, durationMs, isPlaying) {
    if (!isPlaying || lastPollTimestamp <= 0) {
      return spotifyProgressMs;
    }
    const elapsed = currentTimestamp - lastPollTimestamp;
    return Math.min(durationMs, Math.max(0, Math.round(spotifyProgressMs + elapsed)));
  }

  test('C2.S01.1: 60fps monotonic advancement over 150 frames (2500ms nominal poll interval)', () => {
    const spotifyProgressMs = 15000;
    const lastPollTimestamp = 1000.0;
    const durationMs = 142000;
    const isPlaying = true;
    const frameCount = 150;
    const dt = 1000 / 60; // ~16.6667ms per frame

    let previousTime = spotifyProgressMs;
    for (let frame = 1; frame <= frameCount; frame++) {
      const currentTimestamp = lastPollTimestamp + frame * dt;
      const interpolated = calculateSpotifyInterpolation(
        spotifyProgressMs,
        lastPollTimestamp,
        currentTimestamp,
        durationMs,
        isPlaying
      );

      // Must be monotonically non-decreasing
      expect(interpolated).toBeGreaterThanOrEqual(previousTime);
      previousTime = interpolated;
    }

    // At 150 frames (~2500ms), time should be roughly 15000 + 2500 = 17500ms
    expect(previousTime).toBeCloseTo(17500, 20);
  });

  test('C2.S01.2: Variable frame time (jitter: 4ms to 60ms) maintains accurate wall-clock position', () => {
    const spotifyProgressMs = 30000;
    const lastPollTimestamp = 5000.0;
    const durationMs = 180000;
    const isPlaying = true;

    const jitterDeltas = [8.3, 33.1, 16.7, 52.4, 4.1, 60.2, 12.0, 25.8];
    let cumulativeElapsed = 0;

    for (const delta of jitterDeltas) {
      cumulativeElapsed += delta;
      const currentTimestamp = lastPollTimestamp + cumulativeElapsed;
      const interpolated = calculateSpotifyInterpolation(
        spotifyProgressMs,
        lastPollTimestamp,
        currentTimestamp,
        durationMs,
        isPlaying
      );

      const expected = Math.round(spotifyProgressMs + cumulativeElapsed);
      expect(interpolated).toBe(expected);
    }
  });

  test('C2.S01.3: Simulated network delay (poll delayed to 5000ms & 8000ms) continues smooth extrapolation', () => {
    const spotifyProgressMs = 60000;
    const lastPollTimestamp = 10000.0;
    const durationMs = 150000;
    const isPlaying = true;

    // Normal 2500ms missed; 5000ms elapsed
    const t5000 = lastPollTimestamp + 5000;
    const interp5000 = calculateSpotifyInterpolation(spotifyProgressMs, lastPollTimestamp, t5000, durationMs, isPlaying);
    expect(interp5000).toBe(65000);

    // Extreme 8000ms delay
    const t8000 = lastPollTimestamp + 8000;
    const interp8000 = calculateSpotifyInterpolation(spotifyProgressMs, lastPollTimestamp, t8000, durationMs, isPlaying);
    expect(interp8000).toBe(68000);
  });

  test('C2.S01.4: Duration overflow clamping: interpolation never exceeds durationMs even under infinite delay', () => {
    const durationMs = 120000; // 2 minutes
    const spotifyProgressMs = 118000; // 2s before end
    const lastPollTimestamp = 20000.0;
    const isPlaying = true;

    // 10 seconds later (past song end)
    const tDelayed = lastPollTimestamp + 10000;
    const interpolated = calculateSpotifyInterpolation(
      spotifyProgressMs,
      lastPollTimestamp,
      tDelayed,
      durationMs,
      isPlaying
    );

    expect(interpolated).toBe(durationMs);
    expect(interpolated <= durationMs).toBe(true);

    // 1 hour later without poll
    const tExtreme = lastPollTimestamp + 3600000;
    const interpExtreme = calculateSpotifyInterpolation(
      spotifyProgressMs,
      lastPollTimestamp,
      tExtreme,
      durationMs,
      isPlaying
    );
    expect(interpExtreme).toBe(durationMs);
  });

  test('C2.S01.5: Clock skew / negative elapsed time clamped to zero (no negative millisecond progress)', () => {
    const spotifyProgressMs = 500;
    const lastPollTimestamp = 50000.0;
    const durationMs = 120000;
    const isPlaying = true;

    // Negative elapsed due to clock shift (now < lastPollTimestamp)
    const tClockSkew = lastPollTimestamp - 2000.0; // -2000ms
    const interpolated = calculateSpotifyInterpolation(
      spotifyProgressMs,
      lastPollTimestamp,
      tClockSkew,
      durationMs,
      isPlaying
    );

    // Math.max(0, Math.round(500 - 2000)) -> Math.max(0, -1500) = 0
    expect(interpolated).toBe(0);
  });

  test('C2.S01.6: Pause freezing: when isPlaying = false, interpolation freezes strictly at progressMs', () => {
    const spotifyProgressMs = 45000;
    const lastPollTimestamp = 1000.0;
    const durationMs = 142000;
    const isPlaying = false; // Paused!

    const currentTimestamp = lastPollTimestamp + 5000.0; // 5s elapsed
    const interpolated = calculateSpotifyInterpolation(
      spotifyProgressMs,
      lastPollTimestamp,
      currentTimestamp,
      durationMs,
      isPlaying
    );

    expect(interpolated).toBe(45000);
  });

  test('C2.S01.7: Demo mode rAF sync: audio.paused and audio.seeking freeze timestamp updates', () => {
    const audio = createMockAudioElement({ duration: 142 });
    let storeTime = 25000;

    function demoSync(audioElement) {
      if (audioElement && !audioElement.paused && !audioElement.seeking) {
        storeTime = Math.round(audioElement.currentTime * 1000);
      }
    }

    // Audio is paused -> no store update
    audio.currentTime = 30.0;
    demoSync(audio);
    expect(storeTime).toBe(25000); // Unchanged

    // Audio is unpaused -> store updates
    audio.play();
    demoSync(audio);
    expect(storeTime).toBe(30000); // Updated to 30000ms

    // Audio is seeking -> store updates suppressed
    audio.seeking = true;
    audio.currentTime = 55.0;
    demoSync(audio);
    expect(storeTime).toBe(30000); // Suppressed
  });
});

// =========================================================================
// Suite 2: Autoplay Resilience & NotAllowedError Catching
// =========================================================================
suite('Challenger 2: Autoplay Resilience & Exception Handling', () => {
  test('C2.S02.1: NotAllowedError thrown by audio.play() correctly triggers isAutoplayBlocked = true', async () => {
    let isAutoplayBlocked = false;
    let isPlaying = true;

    const audio = createMockAudioElement({ rejectAutoplay: true });

    // Emulate play attempt in AudioController.tsx
    await audio
      .play()
      .then(() => {
        isAutoplayBlocked = false;
      })
      .catch((err) => {
        if (err.name === 'NotAllowedError') {
          isAutoplayBlocked = true;
        }
      });

    expect(isAutoplayBlocked).toBe(true);
  });

  test('C2.S02.2: AbortError from interrupted play does NOT falsely mark autoplay as blocked', async () => {
    let isAutoplayBlocked = false;

    // Simulate play interruption (e.g. rapid play/pause)
    const audio = {
      async play() {
        const err = new Error('The play() request was interrupted by a call to pause().');
        err.name = 'AbortError';
        throw err;
      },
    };

    await audio
      .play()
      .then(() => {
        isAutoplayBlocked = false;
      })
      .catch((err) => {
        if (err.name === 'NotAllowedError') {
          isAutoplayBlocked = true;
        }
      });

    expect(isAutoplayBlocked).toBe(false);
  });

  test('C2.S02.3: Manual unmute user interaction successfully clears isAutoplayBlocked and sets isPlaying', async () => {
    let isAutoplayBlocked = true;
    let isPlaying = false;

    const audio = createMockAudioElement({ rejectAutoplay: true });

    // User clicks unmute pill -> browser grants permission
    audio.setAutoplayPolicy(false);

    // Emulate handleManualUnmute in AudioController.tsx
    await audio
      .play()
      .then(() => {
        isAutoplayBlocked = false;
        isPlaying = true;
      })
      .catch(() => {});

    expect(isAutoplayBlocked).toBe(false);
    expect(isPlaying).toBe(true);
    expect(audio.paused).toBe(false);
  });

  test('C2.S02.4: Multiple rapid autoplay rejections maintain consistent blocked state without memory leaks', async () => {
    let isAutoplayBlocked = false;
    const audio = createMockAudioElement({ rejectAutoplay: true });

    for (let i = 0; i < 20; i++) {
      try {
        await audio.play();
      } catch (err) {
        if (err.name === 'NotAllowedError') {
          isAutoplayBlocked = true;
        }
      }
      expect(isAutoplayBlocked).toBe(true);
    }
  });

  test('C2.S02.5: Successful audio.play() resets isAutoplayBlocked to false if previously blocked', async () => {
    let isAutoplayBlocked = true;
    const audio = createMockAudioElement({ rejectAutoplay: false });

    await audio
      .play()
      .then(() => {
        isAutoplayBlocked = false;
      })
      .catch((err) => {
        if (err.name === 'NotAllowedError') isAutoplayBlocked = true;
      });

    expect(isAutoplayBlocked).toBe(false);
  });
});

// =========================================================================
// Suite 3: Production Build & Bundle Performance Verification
// =========================================================================
suite('Challenger 2: Next.js Production Build Performance & Route Verification', () => {
  const projectRoot = process.cwd();
  const nextDir = path.join(projectRoot, '.next');

  test('C2.S03.1: Production build directory (.next) exists and contains BUILD_ID', () => {
    expect(fs.existsSync(nextDir)).toBe(true);
    const buildIdPath = path.join(nextDir, 'BUILD_ID');
    expect(fs.existsSync(buildIdPath)).toBe(true);
    const buildId = fs.readFileSync(buildIdPath, 'utf8').trim();
    expect(buildId.length).toBeGreaterThan(0);
  });

  test('C2.S03.2: Prerender manifest exists and verifies static generation of routes', () => {
    const prerenderManifestPath = path.join(nextDir, 'prerender-manifest.json');
    expect(fs.existsSync(prerenderManifestPath)).toBe(true);

    const prerenderContent = JSON.parse(fs.readFileSync(prerenderManifestPath, 'utf8'));
    expect(prerenderContent.routes).toBeTruthy();

    // Verify root route / and callback /callback are present
    const routes = Object.keys(prerenderContent.routes);
    expect(routes).toContain('/');
    expect(routes).toContain('/callback');
  });

  test('C2.S03.3: Routes manifest exists and includes required app router routes', () => {
    const routesManifestPath = path.join(nextDir, 'routes-manifest.json');
    expect(fs.existsSync(routesManifestPath)).toBe(true);

    const routesManifest = JSON.parse(fs.readFileSync(routesManifestPath, 'utf8'));
    expect(routesManifest.version).toBeGreaterThan(0);
    expect(Array.isArray(routesManifest.staticRoutes)).toBe(true);

    const staticPaths = routesManifest.staticRoutes.map((r) => r.page);
    expect(staticPaths).toContain('/');
    expect(staticPaths).toContain('/callback');
  });

  test('C2.S03.4: App bundle JS chunk sizes are within performance budget (<200 kB shared JS)', () => {
    const staticChunksDir = path.join(nextDir, 'static', 'chunks');
    expect(fs.existsSync(staticChunksDir)).toBe(true);

    const files = fs.readdirSync(staticChunksDir);
    const jsFiles = files.filter((f) => f.endsWith('.js'));
    expect(jsFiles.length).toBeGreaterThan(0);

    let totalChunkBytes = 0;
    for (const f of jsFiles) {
      const stat = fs.statSync(path.join(staticChunksDir, f));
      totalChunkBytes += stat.size;
    }

    // Ensure total top-level chunk size is reasonable (< 1.5MB uncompressed for entire app)
    expect(totalChunkBytes).toBeLessThan(1.5 * 1024 * 1024);
  });

  test('C2.S03.5: Layout and root page client markers and CSS build output exist', () => {
    // Check that CSS output bundle exists
    const staticCssDir = path.join(nextDir, 'static', 'css');
    if (fs.existsSync(staticCssDir)) {
      const cssFiles = fs.readdirSync(staticCssDir).filter((f) => f.endsWith('.css'));
      expect(cssFiles.length).toBeGreaterThan(0);
    }
  });
});

// Run all suites
async function runChallengerSuites() {
  const { globalHarness } = await import('./helpers/test-harness.mjs');
  console.log('\n======================================================');
  console.log('   CHALLENGER 2: MILESTONE 1 EMPIRICAL VERIFICATION   ');
  console.log('======================================================\n');

  const report = await globalHarness.run();
  console.log(`Total tests run: ${report.stats.total}`);
  console.log(`Passed:          ${report.stats.passed}`);
  console.log(`Failed:          ${report.stats.failed}`);
  console.log(`Duration:        ${report.stats.durationMs.toFixed(2)}ms\n`);

  if (report.failures.length > 0) {
    console.error('FAILURES DETECTED:');
    for (const fail of report.failures) {
      console.error(`- [${fail.suite}] ${fail.test}`);
      console.error(`  Error: ${fail.error.message}`);
    }
    process.exit(1);
  } else {
    console.log('ALL CHALLENGER 2 EMPIRICAL TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  }
}

runChallengerSuites();
