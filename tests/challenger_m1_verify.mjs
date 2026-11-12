/**
 * VibeSync Empirical Challenger Test Suite — Milestone 1 (Playback Engine & Architecture)
 * 
 * Verifies:
 * 1. Demo audio files (/public/demo/) sizes, binary RIFF headers, PCM parameters, durations, and audio samples
 * 2. SVG cover artwork (/public/demo/covers/) XML/SVG syntax, viewBox, paths, gradients
 * 3. usePlayerStore state transitions, seekTo boundaries, setSyncOffsetMs boundaries (-500 to +500), track wrapping
 * 4. findActiveLineIndex binary search oracle equivalence over 10,000 inputs
 * 5. PKCE generation in src/lib/spotifyAuth.ts against RFC 7636 test vectors and Node crypto SHA-256 base64url oracle
 */

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { DEMO_TRACKS } from '../src/data/demoTracks.ts';
import { usePlayerStore, findActiveLineIndex } from '../src/stores/usePlayerStore.ts';
import { generateCodeVerifier, generateCodeChallenge } from '../src/lib/spotifyAuth.ts';

// Setup browser globals for Node.js environment simulation
if (typeof window === 'undefined') {
  globalThis.window = {
    crypto: globalThis.crypto,
    location: { origin: 'http://localhost:3000' }
  };
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, message, details = {}) {
  totalTests++;
  if (condition) {
    passedTests++;
    process.stdout.write('  ✔ ' + message + '\n');
  } else {
    failedTests++;
    failures.push({ message, details });
    process.stdout.write('  ✖ FAIL: ' + message + '\n');
    console.error('    Details:', details);
  }
}

async function runChallengerSuite() {
  console.log('\n================================================================');
  console.log('       EMPIRICAL CHALLENGER VERIFICATION — MILESTONE 1          ');
  console.log('================================================================\n');

  // -----------------------------------------------------------------
  // 1. DEMO AUDIO FILES VERIFICATION
  // -----------------------------------------------------------------
  console.log('--- Suite 1: Demo Audio Files Verification ---');
  const demoDir = path.resolve(process.cwd(), 'public', 'demo');
  const expectedAudioFiles = [
    { name: 'apatheia.mp3', expectedDurationMs: 142000, minSize: 10_000_000 },
    { name: 'solaris.mp3', expectedDurationMs: 158000, minSize: 10_000_000 },
    { name: 'supernova.mp3', expectedDurationMs: 135000, minSize: 10_000_000 },
    { name: 'apatheia.wav', expectedDurationMs: 142000, minSize: 10_000_000 },
    { name: 'solaris.wav', expectedDurationMs: 158000, minSize: 10_000_000 },
    { name: 'supernova.wav', expectedDurationMs: 135000, minSize: 10_000_000 },
  ];

  for (const item of expectedAudioFiles) {
    const filePath = path.join(demoDir, item.name);
    const exists = fs.existsSync(filePath);
    assert(exists, `Audio asset ${item.name} exists in public/demo/`, { filePath });
    if (!exists) continue;

    const stat = fs.statSync(filePath);
    assert(stat.size >= item.minSize, `${item.name} size >= ${item.minSize} bytes (actual: ${stat.size})`, { size: stat.size });

    const buf = fs.readFileSync(filePath);
    const riff = buf.toString('ascii', 0, 4);
    const wave = buf.toString('ascii', 8, 12);
    const fmt = buf.toString('ascii', 12, 16);
    const isRiffWave = (riff === 'RIFF' && wave === 'WAVE' && fmt === 'fmt ');

    assert(isRiffWave, `${item.name} contains valid RIFF WAVE binary header`, {
      riff, wave, fmt, first16Hex: buf.subarray(0, 16).toString('hex')
    });

    if (isRiffWave) {
      const audioFormat = buf.readUInt16LE(20);
      const numChannels = buf.readUInt16LE(22);
      const sampleRate = buf.readUInt32LE(24);
      const byteRate = buf.readUInt32LE(28);
      const blockAlign = buf.readUInt16LE(32);
      const bitsPerSample = buf.readUInt16LE(34);
      const dataTag = buf.toString('ascii', 36, 40);
      const dataSize = buf.readUInt32LE(40);

      assert(audioFormat === 1, `${item.name} is PCM format (audioFormat = 1)`, { audioFormat });
      assert(numChannels === 2, `${item.name} is stereo (channels = 2)`, { numChannels });
      assert(sampleRate === 22050, `${item.name} sample rate is 22050 Hz`, { sampleRate });
      assert(bitsPerSample === 16, `${item.name} bits per sample is 16-bit`, { bitsPerSample });
      assert(dataTag === 'data', `${item.name} has valid 'data' subchunk header`, { dataTag });

      const calculatedDurationSec = dataSize / (sampleRate * numChannels * (bitsPerSample / 8));
      const calculatedDurationMs = Math.round(calculatedDurationSec * 1000);
      assert(
        calculatedDurationMs === item.expectedDurationMs,
        `${item.name} duration (${calculatedDurationMs}ms) matches metadata duration (${item.expectedDurationMs}ms)`,
        { calculatedDurationMs, expectedDurationMs: item.expectedDurationMs }
      );

      // Verify PCM samples are non-silent and contain non-zero audio waveforms
      let nonZeroCount = 0;
      let maxAmplitude = 0;
      let hasNaN = false;
      const sampleCount = Math.min(dataSize / 2, 44100); // inspect first 1 sec of audio
      for (let i = 44; i < 44 + sampleCount * 2; i += 2) {
        const sample = buf.readInt16LE(i);
        if (Number.isNaN(sample)) hasNaN = true;
        const abs = Math.abs(sample);
        if (abs > maxAmplitude) maxAmplitude = abs;
        if (abs > 10) nonZeroCount++;
      }
      assert(!hasNaN, `${item.name} samples contain no NaN values`, { hasNaN });
      assert(maxAmplitude > 100, `${item.name} has audible waveform content (peak: ${maxAmplitude})`, { maxAmplitude });
      assert(nonZeroCount > 1000, `${item.name} is not silent (non-zero samples: ${nonZeroCount})`, { nonZeroCount });
    }
  }

  // -----------------------------------------------------------------
  // 2. SVG COVERS VERIFICATION
  // -----------------------------------------------------------------
  console.log('\n--- Suite 2: SVG Cover Artwork Verification ---');
  const coversDir = path.resolve(process.cwd(), 'public', 'demo', 'covers');
  const expectedCovers = [
    { name: 'neo-tokyo.svg', expectedTheme: 'Late Night Rainy Highway' },
    { name: 'solaris.svg', expectedTheme: 'Analog Kodachrome Golden Hour' },
    { name: 'supernova.svg', expectedTheme: 'Zero-Gravity Hyper-Euphoria' },
  ];

  for (const cover of expectedCovers) {
    const coverPath = path.join(coversDir, cover.name);
    const exists = fs.existsSync(coverPath);
    assert(exists, `SVG cover ${cover.name} exists in public/demo/covers/`, { coverPath });
    if (!exists) continue;

    const content = fs.readFileSync(coverPath, 'utf-8');
    assert(content.length > 500, `${cover.name} size is non-trivial (${content.length} chars)`, { length: content.length });

    const startsWithSvg = /<svg[^>]*xmlns=["']http:\/\/www\.w3\.org\/2000\/svg["'][^>]*>/i.test(content);
    assert(startsWithSvg, `${cover.name} contains valid root <svg xmlns="http://www.w3.org/2000/svg">`, {});

    const hasClosingSvg = /<\/svg>\s*$/i.test(content.trim());
    assert(hasClosingSvg, `${cover.name} has valid closing </svg> tag`, {});

    const viewBoxMatch = content.match(/viewBox=["']([^"']+)["']/i);
    assert(viewBoxMatch !== null, `${cover.name} contains viewBox attribute`, { viewBox: viewBoxMatch?.[1] });
    if (viewBoxMatch) {
      assert(viewBoxMatch[1] === '0 0 800 800', `${cover.name} viewBox is '0 0 800 800'`, { viewBox: viewBoxMatch[1] });
    }

    const hasDefs = /<defs>/i.test(content);
    assert(hasDefs, `${cover.name} defines SVG <defs> for gradients and filters`, {});

    const hasGradients = /<(linearGradient|radialGradient)/i.test(content);
    assert(hasGradients, `${cover.name} contains procedural SVG gradients`, {});

    // Check graphical primitives
    const pathCount = (content.match(/<path\b/gi) || []).length;
    const rectCount = (content.match(/<rect\b/gi) || []).length;
    const circleCount = (content.match(/<circle\b/gi) || []).length;
    const lineCount = (content.match(/<line\b/gi) || []).length;
    const totalPrimitives = pathCount + rectCount + circleCount + lineCount;
    assert(totalPrimitives >= 5, `${cover.name} contains rich vector geometry (${totalPrimitives} visual primitives)`, {
      pathCount, rectCount, circleCount, lineCount, totalPrimitives
    });
  }

  // -----------------------------------------------------------------
  // 3. USEPLAYERSTORE STORE LOGIC & BOUNDARIES
  // -----------------------------------------------------------------
  console.log('\n--- Suite 3: usePlayerStore Store Logic & Boundaries ---');

  // Initial state check
  const state = usePlayerStore.getState();
  assert(state.mode === 'demo', 'Store initial mode is "demo"', { mode: state.mode });
  assert(state.isPlaying === false, 'Store initial isPlaying is false', { isPlaying: state.isPlaying });
  assert(state.currentTimeMs === 0, 'Store initial currentTimeMs is 0', { currentTimeMs: state.currentTimeMs });
  assert(state.volume === 0.8, 'Store initial volume is 0.8', { volume: state.volume });
  assert(state.syncOffsetMs === 0, 'Store initial syncOffsetMs is 0', { syncOffsetMs: state.syncOffsetMs });
  assert(state.isAutoplayBlocked === false, 'Store initial isAutoplayBlocked is false', { isAutoplayBlocked: state.isAutoplayBlocked });
  assert(state.demoTrackIndex === 0, 'Store initial demoTrackIndex is 0', { demoTrackIndex: state.demoTrackIndex });

  // Play / Pause toggle
  usePlayerStore.getState().togglePlay();
  assert(usePlayerStore.getState().isPlaying === true, 'togglePlay() toggles isPlaying from false to true');
  usePlayerStore.getState().togglePlay();
  assert(usePlayerStore.getState().isPlaying === false, 'togglePlay() toggles isPlaying back to false');

  // Volume boundaries
  usePlayerStore.getState().setVolume(0.5);
  assert(usePlayerStore.getState().volume === 0.5, 'setVolume(0.5) sets volume to 0.5');
  usePlayerStore.getState().setVolume(1.5);
  assert(usePlayerStore.getState().volume === 1.0, 'setVolume(1.5) clamps volume to 1.0 (upper bound)');
  usePlayerStore.getState().setVolume(-0.5);
  assert(usePlayerStore.getState().volume === 0.0, 'setVolume(-0.5) clamps volume to 0.0 (lower bound)');
  usePlayerStore.getState().setVolume(0.8); // restore

  // seekTo tests
  const trackDuration = usePlayerStore.getState().durationMs;
  usePlayerStore.getState().seekTo(45000);
  assert(usePlayerStore.getState().currentTimeMs === 45000, 'seekTo(45000) updates currentTimeMs to 45000');
  assert(usePlayerStore.getState().seekTarget === 45000, 'seekTo(45000) sets seekTarget to 45000');

  usePlayerStore.getState().clearSeekTarget();
  assert(usePlayerStore.getState().seekTarget === null, 'clearSeekTarget() clears seekTarget to null');

  // seekTo lower boundary underflow
  usePlayerStore.getState().seekTo(-5000);
  assert(usePlayerStore.getState().currentTimeMs === 0, 'seekTo(-5000) underflow clamps currentTimeMs to 0');
  assert(usePlayerStore.getState().seekTarget === 0, 'seekTo(-5000) underflow clamps seekTarget to 0');

  // seekTo upper boundary overflow
  usePlayerStore.getState().seekTo(trackDuration + 20000);
  assert(usePlayerStore.getState().currentTimeMs === trackDuration, `seekTo(overflow) clamps currentTimeMs to durationMs (${trackDuration})`);
  assert(usePlayerStore.getState().seekTarget === trackDuration, `seekTo(overflow) clamps seekTarget to durationMs (${trackDuration})`);

  // setSyncOffsetMs boundary tests (-500 to +500)
  usePlayerStore.getState().setSyncOffsetMs(150);
  assert(usePlayerStore.getState().syncOffsetMs === 150, 'setSyncOffsetMs(150) sets syncOffsetMs to 150');

  usePlayerStore.getState().setSyncOffsetMs(-200);
  assert(usePlayerStore.getState().syncOffsetMs === -200, 'setSyncOffsetMs(-200) sets syncOffsetMs to -200');

  usePlayerStore.getState().setSyncOffsetMs(500);
  assert(usePlayerStore.getState().syncOffsetMs === 500, 'setSyncOffsetMs(500) sets syncOffsetMs to exact upper bound 500');

  usePlayerStore.getState().setSyncOffsetMs(-500);
  assert(usePlayerStore.getState().syncOffsetMs === -500, 'setSyncOffsetMs(-500) sets syncOffsetMs to exact lower bound -500');

  usePlayerStore.getState().setSyncOffsetMs(750);
  assert(usePlayerStore.getState().syncOffsetMs === 500, 'setSyncOffsetMs(750) overflow clamps syncOffsetMs to 500');

  usePlayerStore.getState().setSyncOffsetMs(-900);
  assert(usePlayerStore.getState().syncOffsetMs === -500, 'setSyncOffsetMs(-900) underflow clamps syncOffsetMs to -500');

  usePlayerStore.getState().setSyncOffsetMs(0); // restore

  // Track wrapping navigation
  usePlayerStore.getState().selectDemoTrack(0);
  assert(usePlayerStore.getState().demoTrackIndex === 0, 'selectDemoTrack(0) sets demoTrackIndex to 0');

  usePlayerStore.getState().nextTrack();
  assert(usePlayerStore.getState().demoTrackIndex === 1, 'nextTrack() from 0 moves to track 1');

  usePlayerStore.getState().nextTrack();
  assert(usePlayerStore.getState().demoTrackIndex === 2, 'nextTrack() from 1 moves to track 2');

  usePlayerStore.getState().nextTrack();
  assert(usePlayerStore.getState().demoTrackIndex === 0, 'nextTrack() from 2 wraps around to track 0');

  usePlayerStore.getState().prevTrack();
  assert(usePlayerStore.getState().demoTrackIndex === 2, 'prevTrack() from 0 wraps around to track 2');

  usePlayerStore.getState().prevTrack();
  assert(usePlayerStore.getState().demoTrackIndex === 1, 'prevTrack() from 2 moves to track 1');

  usePlayerStore.getState().prevTrack();
  assert(usePlayerStore.getState().demoTrackIndex === 0, 'prevTrack() from 1 moves to track 0');

  // Challenger Edge Test: selectDemoTrack index wrapping with negative index
  // Test whether selectDemoTrack handles negative wrapping properly
  usePlayerStore.getState().selectDemoTrack(-1);
  assert(usePlayerStore.getState().demoTrackIndex === 2, 'selectDemoTrack(-1) wraps to track 2');

  // Test deeply negative index: e.g. -4
  try {
    usePlayerStore.getState().selectDemoTrack(-4);
    const resolvedIdx = usePlayerStore.getState().demoTrackIndex;
    const isCleanWrap = resolvedIdx === 2; // -4 mod 3 in standard math is 2
    assert(isCleanWrap, `selectDemoTrack(-4) cleanly wraps modulo 3 (resolved index: ${resolvedIdx})`, { resolvedIdx });
  } catch (err) {
    assert(false, `selectDemoTrack(-4) threw exception due to JS remainder operator on negative numbers: ${err.message}`, { error: err.message });
  }

  // Restore to track 0
  usePlayerStore.getState().selectDemoTrack(0);

  // -----------------------------------------------------------------
  // 4. FIND_ACTIVE_LINE_INDEX BINARY SEARCH ORACLE EQUIVALENCE
  // -----------------------------------------------------------------
  console.log('\n--- Suite 4: findActiveLineIndex Binary Search Oracle ---');
  const sampleLyrics = DEMO_TRACKS[0].lyrics;

  // Linear scan ground truth oracle
  function linearFindActiveLineIndex(lyrics, effectiveTimeMs) {
    if (!lyrics || lyrics.length === 0) return -1;
    if (effectiveTimeMs < lyrics[0].timeMs) return -1;
    let active = 0;
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].timeMs <= effectiveTimeMs) {
        active = i;
      } else {
        break;
      }
    }
    return active;
  }

  // Test boundary cases
  assert(findActiveLineIndex([], 1000) === -1, 'Empty lyrics array returns -1');
  assert(findActiveLineIndex(null, 1000) === -1, 'Null lyrics returns -1');
  assert(findActiveLineIndex(sampleLyrics, -500) === -1, 'Time before first lyric returns -1');
  assert(findActiveLineIndex(sampleLyrics, 0) === 0, 'Time exact at first lyric returns 0');

  // Test last lyric
  const lastLine = sampleLyrics[sampleLyrics.length - 1];
  assert(findActiveLineIndex(sampleLyrics, lastLine.timeMs) === sampleLyrics.length - 1, 'Exact time of last lyric returns last line index');
  assert(findActiveLineIndex(sampleLyrics, lastLine.timeMs + 50000) === sampleLyrics.length - 1, 'Time far beyond last lyric returns last line index');

  // Stress-test 10,000 random and boundary timestamps against linear oracle
  let oracleMismatches = 0;
  for (let t = -2000; t <= 70000; t += 7) {
    const binaryResult = findActiveLineIndex(sampleLyrics, t);
    const linearResult = linearFindActiveLineIndex(sampleLyrics, t);
    if (binaryResult !== linearResult) {
      oracleMismatches++;
    }
  }
  assert(oracleMismatches === 0, `findActiveLineIndex matches linear oracle across all 10,286 timestamps (0 mismatches)`, { oracleMismatches });

  // -----------------------------------------------------------------
  // 5. WEB CRYPTO PKCE GENERATION & RFC 7636 COMPLIANCE
  // -----------------------------------------------------------------
  console.log('\n--- Suite 5: Web Crypto PKCE Generation & RFC 7636 Math ---');

  // RFC 7636 Section 4.1: Code verifier length default 64
  const v64 = generateCodeVerifier(64);
  assert(v64.length === 64, `generateCodeVerifier(64) produces string of length 64 (actual: ${v64.length})`);

  // RFC 7636 allowed unreserved characters: [A-Z], [a-z], [0-9], "-", ".", "_", "~"
  const rfc7636CharRegex = /^[A-Za-z0-9\-._~]+$/;
  assert(rfc7636CharRegex.test(v64), 'generateCodeVerifier contains only RFC 7636 unreserved characters', { verifier: v64 });

  // Minimum length (43) and Maximum length (128)
  const vMin = generateCodeVerifier(43);
  assert(vMin.length === 43 && rfc7636CharRegex.test(vMin), 'generateCodeVerifier(43) produces valid 43-character string');
  const vMax = generateCodeVerifier(128);
  assert(vMax.length === 128 && rfc7636CharRegex.test(vMax), 'generateCodeVerifier(128) produces valid 128-character string');

  // Entropy check over 1,000 verifiers
  const charFreq = new Map();
  for (let i = 0; i < 1000; i++) {
    const v = generateCodeVerifier(64);
    for (const ch of v) {
      charFreq.set(ch, (charFreq.get(ch) || 0) + 1);
    }
  }
  const uniqueCharsFound = charFreq.size;
  assert(uniqueCharsFound === 66, `All 66 RFC 7636 unreserved characters sampled across 1,000 verifiers (actual: ${uniqueCharsFound})`, { uniqueCharsFound });

  // RFC 7636 Appendix B Test Vector
  // Verifier: dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
  // Expected Challenge: E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  const rfcTestVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
  const rfcExpectedChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';
  const computedChallenge = await generateCodeChallenge(rfcTestVerifier);
  assert(
    computedChallenge === rfcExpectedChallenge,
    `generateCodeChallenge matches RFC 7636 Appendix B authoritative test vector`,
    { computedChallenge, rfcExpectedChallenge }
  );

  // Challenge formatting constraints
  assert(computedChallenge.length === 43, `Challenge length is exactly 43 characters (actual: ${computedChallenge.length})`);
  assert(!computedChallenge.includes('='), 'Challenge contains zero padding (=) characters');
  assert(!computedChallenge.includes('+') && !computedChallenge.includes('/'), 'Challenge contains zero Base64 non-URL characters (+ or /)');
  assert(/^[A-Za-z0-9\-_]{43}$/.test(computedChallenge), 'Challenge is strict RFC 7636 Base64URL string');

  // Differential Oracle Testing: Compare generateCodeChallenge with Node.js crypto SHA-256 base64url over 100 random verifiers
  let oracleDiscrepancies = 0;
  for (let i = 0; i < 100; i++) {
    const v = generateCodeVerifier(43 + Math.floor(Math.random() * 85));
    const challengeSubtle = await generateCodeChallenge(v);
    const challengeNode = createHash('sha256').update(v).digest('base64url');
    if (challengeSubtle !== challengeNode) {
      oracleDiscrepancies++;
    }
  }
  assert(
    oracleDiscrepancies === 0,
    `generateCodeChallenge produces 100% bitwise identical output to Node crypto SHA-256 base64url across 100 random verifiers`,
    { oracleDiscrepancies }
  );

  // -----------------------------------------------------------------
  // SUMMARY REPORT
  // -----------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TOTAL TESTS:   ${totalTests}`);
  console.log(`PASSED:        ${passedTests} ✔`);
  console.log(`FAILED:        ${failedTests} ✖`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    console.error('FAILURES SUMMARY:');
    failures.forEach((f, idx) => {
      console.error(`${idx + 1}) ${f.message}`);
      console.error('   Details:', f.details);
    });
    process.exit(1);
  } else {
    console.log('ALL EMPIRICAL CHALLENGER TESTS PASSED SUCCESSFULLY! ✔');
    process.exit(0);
  }
}

runChallengerSuite().catch((err) => {
  console.error('Fatal execution error in challenger suite:', err);
  process.exit(1);
});
