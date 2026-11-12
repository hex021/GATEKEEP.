/**
 * Challenger M1 Iteration 2 Empirical Stress Test:
 * Deep verification of selectDemoTrack negative & out-of-bounds indices,
 * state consistency, sequential random transitions, and boundary invariants.
 */

import { DEMO_TRACKS } from '../src/data/demoTracks.ts';
import { usePlayerStore } from '../src/stores/usePlayerStore.ts';

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const failures = [];

function check(condition, message, details = {}) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    process.stdout.write(`  ✔ ${message}\n`);
  } else {
    failedAssertions++;
    failures.push({ message, details });
    process.stdout.write(`  ✖ FAIL: ${message}\n`);
    console.error('    Details:', details);
  }
}

async function runSelectDemoTrackStress() {
  console.log('\n================================================================');
  console.log('   CHALLENGER M1 IT2: EMPIRICAL SELECT_DEMO_TRACK STRESS TEST   ');
  console.log('================================================================\n');

  const store = usePlayerStore.getState();
  const trackCount = DEMO_TRACKS.length; // 3

  // Helper to compute mathematical Euclidean modulo
  const euclideanModulo = (n, m) => ((n % m) + m) % m;

  // -------------------------------------------------------------
  // Test Suite 1: Direct In-Bounds Indices (0, 1, 2)
  // -------------------------------------------------------------
  console.log('--- Test Suite 1: In-Bounds Indices ---');
  for (let i = 0; i < trackCount; i++) {
    usePlayerStore.getState().selectDemoTrack(i);
    const state = usePlayerStore.getState();
    check(state.demoTrackIndex === i, `selectDemoTrack(${i}) sets index to ${i}`);
    check(state.currentTrack.id === DEMO_TRACKS[i].id, `Track ID matches ${DEMO_TRACKS[i].id}`);
    check(state.currentTimeMs === 0, `currentTimeMs reset to 0`);
    check(state.durationMs === DEMO_TRACKS[i].durationMs, `durationMs matches track ${i}`);
    check(state.lyrics === DEMO_TRACKS[i].lyrics, `lyrics array matches track ${i}`);
  }

  // -------------------------------------------------------------
  // Test Suite 2: Negative Indices (-1 down to -30)
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 2: Systematic Negative Indices (-1 to -30) ---');
  for (let idx = -1; idx >= -30; idx--) {
    const expected = euclideanModulo(idx, trackCount);
    let threw = false;
    let errMsg = null;
    try {
      usePlayerStore.getState().selectDemoTrack(idx);
    } catch (e) {
      threw = true;
      errMsg = e.message;
    }
    const actual = usePlayerStore.getState().demoTrackIndex;
    check(!threw, `selectDemoTrack(${idx}) does not throw (threw: ${errMsg})`);
    check(actual === expected, `selectDemoTrack(${idx}) wraps to ${expected} (got: ${actual})`, { idx, expected, actual });
  }

  // -------------------------------------------------------------
  // Test Suite 3: Positive Out-of-Bounds Indices (3 to 30)
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 3: Systematic Positive Out-of-Bounds (3 to 30) ---');
  for (let idx = 3; idx <= 30; idx++) {
    const expected = euclideanModulo(idx, trackCount);
    let threw = false;
    let errMsg = null;
    try {
      usePlayerStore.getState().selectDemoTrack(idx);
    } catch (e) {
      threw = true;
      errMsg = e.message;
    }
    const actual = usePlayerStore.getState().demoTrackIndex;
    check(!threw, `selectDemoTrack(${idx}) does not throw (threw: ${errMsg})`);
    check(actual === expected, `selectDemoTrack(${idx}) wraps to ${expected} (got: ${actual})`, { idx, expected, actual });
  }

  // -------------------------------------------------------------
  // Test Suite 4: Extreme Magnitude Numbers
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 4: Extreme Magnitude Numbers ---');
  const extremes = [
    -1000,
    -999999,
    -100000000,
    1000,
    999999,
    100000000,
    Number.MAX_SAFE_INTEGER,
    Number.MIN_SAFE_INTEGER,
  ];

  for (const val of extremes) {
    const expected = euclideanModulo(val, trackCount);
    let threw = false;
    let errMsg = null;
    try {
      usePlayerStore.getState().selectDemoTrack(val);
    } catch (e) {
      threw = true;
      errMsg = e.message;
    }
    const actual = usePlayerStore.getState().demoTrackIndex;
    check(!threw, `selectDemoTrack(${val}) does not throw`);
    check(actual === expected, `selectDemoTrack(${val}) wraps to ${expected} (got: ${actual})`);
  }

  // -------------------------------------------------------------
  // Test Suite 5: Monte Carlo Random Stress (1,000 iterations)
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 5: Monte Carlo Stress (1,000 random calls) ---');
  let monteCarloPass = true;
  for (let i = 0; i < 1000; i++) {
    const randIdx = Math.floor(Math.random() * 2000000) - 1000000; // [-1M, +1M]
    const expected = euclideanModulo(randIdx, trackCount);
    try {
      usePlayerStore.getState().selectDemoTrack(randIdx);
      const state = usePlayerStore.getState();
      if (state.demoTrackIndex !== expected || state.currentTrack.id !== DEMO_TRACKS[expected].id) {
        monteCarloPass = false;
        check(false, `Monte Carlo failed on index ${randIdx}`);
        break;
      }
    } catch (e) {
      monteCarloPass = false;
      check(false, `Monte Carlo threw on index ${randIdx}: ${e.message}`);
      break;
    }
  }
  if (monteCarloPass) {
    check(true, 'Monte Carlo: 1,000 random calls in range [-1,000,000, +1,000,000] passed with 0 errors');
  }

  // -------------------------------------------------------------
  // Test Suite 6: State Invariant Verification on Each Track
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 6: State Invariants ---');
  for (let i = 0; i < trackCount; i++) {
    usePlayerStore.getState().selectDemoTrack(i);
    const s = usePlayerStore.getState();
    check(s.demoTrackIndex >= 0 && s.demoTrackIndex < trackCount, `Index ${i} within [0, ${trackCount - 1}]`);
    check(typeof s.currentTrack.title === 'string' && s.currentTrack.title.length > 0, `Track title present`);
    check(Array.isArray(s.currentTrack.palette) && s.currentTrack.palette.length === 4, `Palette has 4 colors`);
    check(s.currentTimeMs === 0, `currentTimeMs is 0`);
    check(s.activeLineIndex === 0, `activeLineIndex is 0`);
    check(s.seekTarget === 0, `seekTarget is 0`);
  }

  // Final summary
  console.log('\n================================================================');
  console.log(`TOTAL ASSERTIONS: ${totalAssertions}`);
  console.log(`PASSED:           ${passedAssertions} ✔`);
  console.log(`FAILED:           ${failedAssertions} ✖`);
  console.log('================================================================\n');

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runSelectDemoTrackStress().catch(err => {
  console.error('Fatal stress error:', err);
  process.exit(1);
});
