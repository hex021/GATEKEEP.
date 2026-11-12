/**
 * VibeSync Unified Test Runner
 * Executes all tests across Tiers 1-4, tracks per-tier metrics, and outputs comprehensive test reports.
 * Usage:
 *   node tests/run-all.mjs
 *   node tests/run-all.mjs --tier=1
 *   node tests/run-all.mjs --tier=2
 *   node tests/run-all.mjs --filter=lyrics
 */

import { globalHarness } from './helpers/test-harness.mjs';
import { register } from 'node:module';

try {
  register('./helpers/path-loader.mjs', import.meta.url);
} catch {
  // Already registered in runner context
}

// Parse command line arguments
const args = process.argv.slice(2);
let tierFilter = null;
let nameFilter = null;

for (const arg of args) {
  if (arg.startsWith('--tier=')) {
    tierFilter = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--filter=')) {
    nameFilter = arg.split('=')[1];
  }
}

console.log('================================================================');
console.log('           VIBESYNC COMPREHENSIVE 4-TIER TEST HARNESS           ');
console.log('================================================================');
console.log(`Execution Mode: ${tierFilter ? `Tier ${tierFilter} Only` : 'All Tiers (1-4)'}`);
if (nameFilter) console.log(`Filter: "${nameFilter}"`);
console.log('----------------------------------------------------------------\n');

// Load Test Suites dynamically
async function loadSuites() {
  const suitesToLoad = [];

  // Tier 1: Feature Coverage (Features 1 - 65)
  if (!tierFilter || tierFilter === 1) {
    suitesToLoad.push(
      import('./tier1/f01_f10_playback_engine.test.mjs'),
      import('./tier1/f11_f18_lyrics_sync.test.mjs'),
      import('./tier1/f19_f24_webgl_shader.test.mjs'),
      import('./tier1/f25_f32_story_flex.test.mjs'),
      import('./tier1/f33_f42_study_hud_audio.test.mjs'),
      import('./tier1/f43_f48_pip_e2e_hardening.test.mjs'),
      import('./tier1/f49_f56_video_edit_and_nextauth.test.mjs'),
      import('./tier1/f49_f55_video_edit_visualizer.test.mjs'),
      import('./tier1/f56_f60_nextauth_spotify.test.mjs'),
      import('./tier1/f61_f65_study_hud_pip_verification.test.mjs'),
      import('./tier1/f66_f70_new_themes.test.mjs'),
      import('./tier1/f71_spotify_sync_and_header.test.mjs')
    );
  }

  // Tier 2: Boundary & Corner Cases (Features 1 - 65)
  if (!tierFilter || tierFilter === 2) {
    suitesToLoad.push(
      import('./tier2/b01_b10_playback_boundaries.test.mjs'),
      import('./tier2/b11_b18_lyrics_boundaries.test.mjs'),
      import('./tier2/b19_b24_shader_boundaries.test.mjs'),
      import('./tier2/b25_b32_story_boundaries.test.mjs'),
      import('./tier2/b33_b42_study_boundaries.test.mjs'),
      import('./tier2/b43_b48_pip_adversarial.test.mjs'),
      import('./tier2/b49_b55_visualizer_boundaries.test.mjs'),
      import('./tier2/b56_b60_nextauth_boundaries.test.mjs'),
      import('./tier2/b56_b60_adversarial_stress.test.mjs'),
      import('./tier2/b61_b65_study_hud_pip_boundaries.test.mjs')
    );
  }

  // Tier 3: Cross-Feature Interactions
  if (!tierFilter || tierFilter === 3) {
    suitesToLoad.push(
      import('./tier3/cross_playback_lyrics_sync.test.mjs'),
      import('./tier3/cross_palette_shader_story.test.mjs'),
      import('./tier3/cross_study_pomodoro_audio.test.mjs'),
      import('./tier3/cross_pip_portal_lifecycle.test.mjs')
    );
  }

  // Tier 4: Real-World Scenarios
  if (!tierFilter || tierFilter === 4) {
    suitesToLoad.push(
      import('./tier4/scenario_demo_flow.test.mjs'),
      import('./tier4/scenario_spotify_pkce_flow.test.mjs'),
      import('./tier4/scenario_lyric_custom_offset_export.test.mjs'),
      import('./tier4/scenario_study_pomodoro_session.test.mjs'),
      import('./tier4/scenario_pip_second_screen_drift.test.mjs')
    );
  }

  await Promise.all(suitesToLoad);
}

async function main() {
  try {
    await loadSuites();
    const report = await globalHarness.run(nameFilter);

    console.log('\n================================================================');
    console.log('                      TEST EXECUTION REPORT                     ');
    console.log('================================================================');

    const { total, passed, failed, skipped, durationMs } = report.stats;

    console.log(`Total Tests Run:      ${total}`);
    console.log(`Passed:               ${passed} ✔`);
    console.log(`Failed:               ${failed} ✖`);
    console.log(`Skipped:              ${skipped} ⚠`);
    console.log(`Total Duration:       ${durationMs.toFixed(2)} ms`);
    console.log('----------------------------------------------------------------');

    if (failed > 0) {
      console.log('\nFAILURES ENCOUNTERED:');
      report.failures.forEach((f, idx) => {
        console.log(`\n${idx + 1}) [${f.suite}] ${f.test}`);
        console.log(`   Error: ${f.error.message}`);
        if (f.error.stack) {
          const stackLine = f.error.stack.split('\n')[1] || '';
          console.log(`   ${stackLine.trim()}`);
        }
      });
      console.log('\nSTATUS: GATE FAILED ❌');
      process.exit(1);
    } else {
      console.log('\nSTATUS: ALL VERIFICATION GATES PASSED ✅');
      console.log('Comprehensive 4-Tier Test Suite is 100% Green.');
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal Test Runner Exception:', err);
    process.exit(1);
  }
}

main();
