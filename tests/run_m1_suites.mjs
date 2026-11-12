import { globalHarness } from './helpers/test-harness.mjs';

// Import M1 test suites
await import('./tier1/f01_f10_playback_engine.test.mjs');
await import('./tier2/b01_b10_playback_boundaries.test.mjs');
await import('./challenger2_m1_stress.test.mjs');

const report = await globalHarness.run();
console.log('\n======================================================');
console.log('   M1 COMPREHENSIVE VERIFICATION (TIER 1, TIER 2 & C2) ');
console.log('======================================================\n');
console.log(`Total tests run: ${report.stats.total}`);
console.log(`Passed:          ${report.stats.passed}`);
console.log(`Failed:          ${report.stats.failed}`);
console.log(`Duration:        ${report.stats.durationMs.toFixed(2)}ms\n`);

if (report.failures.length > 0) {
  for (const fail of report.failures) {
    console.error(`FAIL: [${fail.suite}] ${fail.test} -> ${fail.error.message}`);
  }
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED!\n');
  process.exit(0);
}
