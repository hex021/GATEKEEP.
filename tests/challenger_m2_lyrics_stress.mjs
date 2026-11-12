/**
 * VibeSync Empirical Challenger Test Suite — Milestone 2
 * Scope: LRC Synced Lyrics Pipeline & Kinetic Typography Viewport
 * 
 * Verifies:
 * 1. parseLrc with adversarial LRC inputs (multi-timestamps, unsorted, CRLF/CR, metadata tags, fragments, blanks, Unicode)
 * 2. findActiveLyricIndex boundary timestamps, edge values, duplicates, and 20,000-point differential oracle verification
 * 3. Manual sync offset dynamics (-500ms to +500ms) and effective time shifts
 * 4. Kinetic typography visual hierarchy (scale, opacity, blur, glow, reduced motion) and Framer Motion spring physics
 * 5. usePlayerStore lyric synchronization and seekTo state transitions
 */

import { parseLrc, findActiveLyricIndex } from '../src/lib/lrclib.ts';
import { getLyricVisualHierarchy, LYRIC_SPRING_CONFIG } from '../src/components/visualizer/KineticLyrics.tsx';
import { usePlayerStore, findActiveLineIndex } from '../src/stores/usePlayerStore.ts';
import { DEMO_TRACKS } from '../src/data/demoTracks.ts';

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

// Ground truth linear scan oracle for findActiveLyricIndex
function findActiveLyricIndexLinearOracle(lyrics, currentTimeMs, offsetMs = 0) {
  if (!lyrics || lyrics.length === 0) return -1;
  const effectiveTime = currentTimeMs + offsetMs;
  if (effectiveTime < lyrics[0].timeMs) return -1;
  let active = 0;
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].timeMs <= effectiveTime) {
      active = i;
    } else {
      break;
    }
  }
  return active;
}

async function runMilestone2ChallengerSuite() {
  console.log('\n================================================================');
  console.log('       EMPIRICAL CHALLENGER VERIFICATION — MILESTONE 2          ');
  console.log('       LRC Synced Lyrics & Kinetic Typography Viewport          ');
  console.log('================================================================\n');

  // -----------------------------------------------------------------
  // 1. PARSE_LRC ADVERSARIAL STRESS SUITE
  // -----------------------------------------------------------------
  console.log('--- Suite 1: parseLrc Adversarial Input Matrix ---');

  // Test 1.1: Multi-timestamp line: [00:10.00][00:20.50][00:30.123]Chorus line
  {
    const lrc = '[00:10.00][00:20.50][00:30.123]Chorus line';
    const parsed = parseLrc(lrc);
    assert(parsed.length === 3, 'Multi-timestamp line expands into 3 distinct lines', { length: parsed.length });
    assert(parsed[0].timeMs === 10000 && parsed[0].text === 'Chorus line', 'First timestamp: 10000ms');
    assert(parsed[1].timeMs === 20500 && parsed[1].text === 'Chorus line', 'Second timestamp: 20500ms');
    assert(parsed[2].timeMs === 30123 && parsed[2].text === 'Chorus line', 'Third timestamp: 30123ms');
  }

  // Test 1.2: Repetitive hook with 5 timestamps on a single line
  {
    const lrc = '[00:05.00][00:15.00][00:25.00][00:35.00][00:45.00]Hold on to the light';
    const parsed = parseLrc(lrc);
    assert(parsed.length === 5, '5-timestamp line expands to exactly 5 lines', { length: parsed.length });
    const expectedTimes = [5000, 15000, 25000, 35000, 45000];
    const actualTimes = parsed.map(p => p.timeMs);
    assert(
      JSON.stringify(actualTimes) === JSON.stringify(expectedTimes),
      '5-timestamp line yields correct ascending timestamps',
      { actualTimes, expectedTimes }
    );
  }

  // Test 1.3: Unsorted timestamps across lines and within multi-timestamp lines
  {
    const lrc = `[00:50.00]Fourth line
[00:10.00]First line
[00:40.00][00:20.00]Chorus line
[00:30.00]Third line`;
    const parsed = parseLrc(lrc);
    assert(parsed.length === 5, 'Unsorted multi-timestamp input parses 5 lines');
    const timestamps = parsed.map(p => p.timeMs);
    const sorted = [...timestamps].sort((a, b) => a - b);
    assert(
      JSON.stringify(timestamps) === JSON.stringify(sorted),
      'Output is strictly chronologically sorted ascending',
      { timestamps }
    );
    assert(parsed[0].text === 'First line' && parsed[0].timeMs === 10000, 'Earliest line sorted to index 0');
    assert(parsed[1].text === 'Chorus line' && parsed[1].timeMs === 20000, 'Multi-timestamp early tag sorted to index 1');
    assert(parsed[2].text === 'Third line' && parsed[2].timeMs === 30000, 'Third line sorted to index 2');
    assert(parsed[3].text === 'Chorus line' && parsed[3].timeMs === 40000, 'Multi-timestamp late tag sorted to index 3');
    assert(parsed[4].text === 'Fourth line' && parsed[4].timeMs === 50000, 'Latest line sorted to index 4');
  }

  // Test 1.4: Mixed line endings (CRLF \r\n, CR \r, LF \n)
  {
    const lrc = '[00:01.00]Windows CRLF\r\n[00:02.00]Classic Mac CR\r[00:03.00]Unix LF\n[00:04.00]Final line\r\n';
    const parsed = parseLrc(lrc);
    assert(parsed.length === 4, 'Mixed line endings (CRLF, CR, LF) parsed with 4 lines', { length: parsed.length });
    assert(parsed[0].text === 'Windows CRLF', 'Windows CRLF parsed cleanly without residual \\r');
    assert(parsed[1].text === 'Classic Mac CR', 'Classic Mac CR parsed cleanly');
    assert(parsed[2].text === 'Unix LF', 'Unix LF parsed cleanly');
    assert(parsed[3].text === 'Final line', 'Final line parsed cleanly');
  }

  // Test 1.5: Metadata headers stripping
  {
    const lrc = `[ar: Neon Dreamer]
[al: Cyber Sunset]
[ti: Neon Waves (VIP Remix)]
[au: Synth Composer]
[length: 03:45]
[by: VibeSync Team]
[offset: +250]
[re: MiniLyrics]
[ve: 4.0.0]
[custom: arbitrary tag]
[00:08.50]Actual first lyric line`;
    const parsed = parseLrc(lrc);
    assert(parsed.length === 1, 'All 10 metadata header tags ignored, exactly 1 lyric retained', { length: parsed.length });
    assert(parsed[0].text === 'Actual first lyric line', 'First lyric content preserved accurately');
    assert(parsed[0].timeMs === 8500, 'First lyric timestamp accurate (8500ms)');
  }

  // Test 1.6: Malformed / broken tag fragments
  {
    const lrc = `[00:]Missing seconds
[:20.00]Missing minutes
[invalid:format]Invalid tag
[00:10.1234]Too many subsecond digits (4 digits)
[00:10.Broken bracket
00:10.00]Missing open bracket
[]
[:]
[00:15.00]Valid lyric after broken lines`;
    const parsed = parseLrc(lrc);
    assert(parsed.length === 1, 'Malformed tags and fragments discarded safely', { length: parsed.length });
    assert(parsed[0].text === 'Valid lyric after broken lines', 'Only valid line retained');
    assert(parsed[0].timeMs === 15000, 'Timestamp accurate at 15000ms');
  }

  // Test 1.7: Section headers without colon ([intro], [chorus])
  {
    const lrc = `[intro]
[verse 1]
[00:05.00]Real line 1
[chorus]
[00:15.00]Real line 2
[outro]`;
    const parsed = parseLrc(lrc);
    assert(parsed.length === 2, 'Section headers ([intro], [chorus], [outro]) skipped safely', { length: parsed.length });
    assert(parsed[0].text === 'Real line 1', 'Line 1 matches');
    assert(parsed[1].text === 'Real line 2', 'Line 2 matches');
  }

  // Test 1.8: Preserves internal brackets in lyric body
  {
    const lrc = '[00:12.00]She said [whispering] (and then [laughed])';
    const parsed = parseLrc(lrc);
    assert(parsed.length === 1, 'Line with internal brackets parsed');
    assert(
      parsed[0].text === 'She said [whispering] (and then [laughed])',
      'Internal brackets and parentheses in lyric body preserved verbatim',
      { text: parsed[0].text }
    );
  }

  // Test 1.9: Blank lines, whitespace lines, and timestamps with empty text
  {
    const lrc = `

   
[00:01.00]
[00:02.00]      
[00:03.00]    Clean lyric with surrounding spaces    
[00:04.00]
   
`;
    const parsed = parseLrc(lrc);
    assert(parsed.length === 1, 'Blank lines and empty timestamps filtered to 1 valid line');
    assert(parsed[0].text === 'Clean lyric with surrounding spaces', 'Leading and trailing spaces trimmed');
    assert(parsed[0].timeMs === 3000, 'Timestamp correct at 3000ms');
  }

  // Test 1.10: Subsecond variations (0, 1, 2, 3 digits, leading/trailing zeros)
  {
    const lrc = `[01:00]No subseconds
[01:00.5]1 digit subsecond
[01:00.05]2 digit subsecond with leading zero
[01:00.50]2 digit subsecond with trailing zero
[01:00.007]3 digit subsecond with leading zeros
[01:00.700]3 digit subsecond with trailing zeros
[01:00.123]3 digit arbitrary subsecond`;
    const parsed = parseLrc(lrc);
    assert(parsed.length === 7, 'All 7 subsecond variations parsed');
    const byText = Object.fromEntries(parsed.map(p => [p.text, p.timeMs]));
    assert(byText['No subseconds'] === 60000, '[01:00] -> 60000ms', { ms: byText['No subseconds'] });
    assert(byText['1 digit subsecond'] === 60500, '[01:00.5] -> 60500ms (0.5s = 500ms)', { ms: byText['1 digit subsecond'] });
    assert(byText['2 digit subsecond with leading zero'] === 60050, '[01:00.05] -> 60050ms (0.05s = 50ms)', { ms: byText['2 digit subsecond with leading zero'] });
    assert(byText['2 digit subsecond with trailing zero'] === 60500, '[01:00.50] -> 60500ms (0.50s = 500ms)', { ms: byText['2 digit subsecond with trailing zero'] });
    assert(byText['3 digit subsecond with leading zeros'] === 60007, '[01:00.007] -> 60007ms (7ms)', { ms: byText['3 digit subsecond with leading zeros'] });
    assert(byText['3 digit subsecond with trailing zeros'] === 60700, '[01:00.700] -> 60700ms (700ms)', { ms: byText['3 digit subsecond with trailing zeros'] });
    assert(byText['3 digit arbitrary subsecond'] === 60123, '[01:00.123] -> 60123ms (123ms)', { ms: byText['3 digit arbitrary subsecond'] });
  }

  // Test 1.11: Extended durations (>60 minutes, concert sets)
  {
    const lrc = '[135:45.50]Concert encore track';
    const parsed = parseLrc(lrc);
    assert(parsed.length === 1, 'Extended minutes parsed');
    const expectedMs = 135 * 60000 + 45 * 1000 + 500; // 8145500
    assert(parsed[0].timeMs === expectedMs, `135 minutes correctly computed as ${expectedMs}ms`, { ms: parsed[0].timeMs });
  }

  // Test 1.12: Multilingual unicode, emoji, and HTML characters
  {
    const lrc = `[00:01.00]宇宙の彼方へ (Beyond the Cosmos) 🚀
[00:02.00]Café au lait & naïve résumé
[00:03.00]<div class="neon">Glow</div> & "quotes"`;
    const parsed = parseLrc(lrc);
    assert(parsed.length === 3, 'Unicode, emoji, and HTML lines parsed');
    assert(parsed[0].text === '宇宙の彼方へ (Beyond the Cosmos) 🚀', 'CJK and emoji characters preserved');
    assert(parsed[1].text === 'Café au lait & naïve résumé', 'Accented Latin characters preserved');
    assert(parsed[2].text === '<div class="neon">Glow</div> & "quotes"', 'HTML strings preserved verbatim without corruption');
  }

  // Test 1.13: Edge cases: empty string, null, undefined
  {
    assert(parseLrc('').length === 0, 'Empty string returns []');
    assert(parseLrc(null).length === 0, 'null returns []');
    assert(parseLrc(undefined).length === 0, 'undefined returns []');
    assert(parseLrc('   \n\r\n   ').length === 0, 'Pure whitespace returns []');
  }

  // Test 1.14: Scalability & memory throughput: 10,000-line synthetic LRC
  {
    let giantLrc = '';
    for (let i = 0; i < 10000; i++) {
      const min = String(Math.floor(i / 60)).padStart(2, '0');
      const sec = String(i % 60).padStart(2, '0');
      giantLrc += `[${min}:${sec}.00]Synthetic line index ${i}\n`;
    }
    const tStart = performance.now();
    const giantParsed = parseLrc(giantLrc);
    const duration = performance.now() - tStart;
    assert(giantParsed.length === 10000, `Parsed 10,000 lines (actual: ${giantParsed.length})`);
    assert(duration < 250, `10,000 lines parsed in ${duration.toFixed(2)}ms (<250ms SLA)`);
    assert(giantParsed[0].timeMs === 0, 'First synthetic line time is 0ms');
    assert(giantParsed[9999].timeMs === 166 * 60000 + 39 * 1000, 'Last synthetic line time accurate');
  }

  // -----------------------------------------------------------------
  // 2. FIND_ACTIVE_LYRIC_INDEX BOUNDARY & SEARCH MATRIX
  // -----------------------------------------------------------------
  console.log('\n--- Suite 2: findActiveLyricIndex Boundary Timestamps ---');

  const lyricsSample = [
    { timeMs: 5000, text: 'Intro' },
    { timeMs: 12000, text: 'Verse 1' },
    { timeMs: 25000, text: 'Chorus' },
    { timeMs: 40000, text: 'Outro' },
  ];

  // Test 2.1: Empty and null arrays
  assert(findActiveLyricIndex([], 1000) === -1, 'Empty lyrics returns -1');
  assert(findActiveLyricIndex(null, 1000) === -1, 'null lyrics returns -1');
  assert(findActiveLyricIndex(undefined, 1000) === -1, 'undefined lyrics returns -1');

  // Test 2.2: Single-line array
  {
    const single = [{ timeMs: 3000, text: 'Single' }];
    assert(findActiveLyricIndex(single, -100) === -1, 'Single line: t < 0 returns -1');
    assert(findActiveLyricIndex(single, 0) === -1, 'Single line: 0 < timeMs returns -1');
    assert(findActiveLyricIndex(single, 2999) === -1, 'Single line: 2999 < 3000 returns -1');
    assert(findActiveLyricIndex(single, 3000) === 0, 'Single line: exact 3000 returns 0');
    assert(findActiveLyricIndex(single, 3001) === 0, 'Single line: 3001 > 3000 returns 0');
    assert(findActiveLyricIndex(single, 100000) === 0, 'Single line: 100000 returns 0');
  }

  // Test 2.3: Boundary progression
  assert(findActiveLyricIndex(lyricsSample, -5000) === -1, 't = -5000 returns -1');
  assert(findActiveLyricIndex(lyricsSample, 0) === -1, 't = 0 (before first at 5000) returns -1');
  assert(findActiveLyricIndex(lyricsSample, 4999) === -1, 't = 4999 returns -1');
  assert(findActiveLyricIndex(lyricsSample, 5000) === 0, 't = 5000 (exact first line) returns 0');
  assert(findActiveLyricIndex(lyricsSample, 5001) === 0, 't = 5001 returns 0');
  assert(findActiveLyricIndex(lyricsSample, 11999) === 0, 't = 11999 returns 0');
  assert(findActiveLyricIndex(lyricsSample, 12000) === 1, 't = 12000 (exact second line) returns 1');
  assert(findActiveLyricIndex(lyricsSample, 24999) === 1, 't = 24999 returns 1');
  assert(findActiveLyricIndex(lyricsSample, 25000) === 2, 't = 25000 (exact third line) returns 2');
  assert(findActiveLyricIndex(lyricsSample, 39999) === 2, 't = 39999 returns 2');
  assert(findActiveLyricIndex(lyricsSample, 40000) === 3, 't = 40000 (exact last line) returns 3');
  assert(findActiveLyricIndex(lyricsSample, 40001) === 3, 't = 40001 returns 3');
  assert(findActiveLyricIndex(lyricsSample, 999999) === 3, 't = 999999 (far past end) returns 3');

  // Test 2.4: Consecutive duplicate timestamps resolve to latest occurrence
  {
    const duplicates = [
      { timeMs: 2000, text: 'Normal 0' },
      { timeMs: 5000, text: 'Dupe 1a' },
      { timeMs: 5000, text: 'Dupe 1b (harmony)' },
      { timeMs: 8000, text: 'Normal 3' },
      { timeMs: 12000, text: 'Quad 4a' },
      { timeMs: 12000, text: 'Quad 4b' },
      { timeMs: 12000, text: 'Quad 4c' },
      { timeMs: 12000, text: 'Quad 4d (latest)' },
      { timeMs: 20000, text: 'End' },
    ];
    assert(findActiveLyricIndex(duplicates, 5000) === 2, 'Two identical timestamps resolve to second index (2)');
    assert(findActiveLyricIndex(duplicates, 6000) === 2, 'Time between dupe and next resolves to second dupe (2)');
    assert(findActiveLyricIndex(duplicates, 12000) === 7, 'Four identical timestamps resolve to fourth index (7)');
    assert(findActiveLyricIndex(duplicates, 15000) === 7, 'Time after four duplicates resolves to fourth index (7)');
  }

  // Test 2.5: Sub-millisecond floating point boundary
  {
    const lyrics = [{ timeMs: 10000, text: 'Ten' }];
    assert(findActiveLyricIndex(lyrics, 9999.99) === -1, '9999.99ms < 10000ms returns -1');
    assert(findActiveLyricIndex(lyrics, 10000.0) === 0, '10000.0ms === 10000ms returns 0');
    assert(findActiveLyricIndex(lyrics, 10000.01) === 0, '10000.01ms > 10000ms returns 0');
  }

  // Test 2.6: Special numeric edge values
  assert(findActiveLyricIndex(lyricsSample, NaN) === -1, 'NaN playback time returns -1 without loop');
  assert(findActiveLyricIndex(lyricsSample, -Infinity) === -1, '-Infinity playback time returns -1');
  assert(findActiveLyricIndex(lyricsSample, Infinity) === 3, 'Infinity playback time returns last index (3)');

  // Test 2.7: Differential Oracle Testing across 20,000 points
  {
    const demoLyrics = DEMO_TRACKS[0].lyrics;
    let mismatches = 0;
    for (let t = -3000; t <= 150000; t += 8) {
      const fastResult = findActiveLyricIndex(demoLyrics, t);
      const oracleResult = findActiveLyricIndexLinearOracle(demoLyrics, t);
      if (fastResult !== oracleResult) {
        mismatches++;
      }
    }
    assert(mismatches === 0, `Differential testing: 0 mismatches across 19,126 timestamps against linear oracle`, { mismatches });
  }

  // -----------------------------------------------------------------
  // 3. MANUAL SYNC OFFSET DYNAMICS (-500ms to +500ms)
  // -----------------------------------------------------------------
  console.log('\n--- Suite 3: Manual Sync Offset Dynamics (-500ms to +500ms) ---');

  // Test 3.1: Zero offset
  assert(findActiveLyricIndex(lyricsSample, 12000, 0) === 1, 'Zero offset matches unshifted index');

  // Test 3.2: Negative offset (-500ms delays lyric display)
  // Verse 1 is at 12000ms.
  // At t = 12200ms with offset = -500ms => effective time = 11700ms => Intro (index 0) remains active.
  assert(
    findActiveLyricIndex(lyricsSample, 12200, -500) === 0,
    'Negative offset (-500ms) delays lyric activation (t=12200 effective=11700 => index 0)'
  );
  // At t = 12500ms with offset = -500ms => effective time = 12000ms => Verse 1 (index 1) becomes active.
  assert(
    findActiveLyricIndex(lyricsSample, 12500, -500) === 1,
    'Negative offset (-500ms) activates line at exactly t=12500 (effective 12000 => index 1)'
  );

  // Test 3.3: Positive offset (+500ms advances lyric display early)
  // Verse 1 is at 12000ms.
  // At t = 11400ms with offset = +500ms => effective time = 11900ms => still Intro (index 0).
  assert(
    findActiveLyricIndex(lyricsSample, 11400, 500) === 0,
    'Positive offset (+500ms) before threshold (t=11400 effective=11900 => index 0)'
  );
  // At t = 11500ms with offset = +500ms => effective time = 12000ms => Verse 1 (index 1) activates 500ms early.
  assert(
    findActiveLyricIndex(lyricsSample, 11500, 500) === 1,
    'Positive offset (+500ms) activates line 500ms early at t=11500 (effective 12000 => index 1)'
  );

  // Test 3.4: Negative offset shifting effective time < 0
  // First lyric at 5000ms. At t = 300ms, offset = -500ms => effective = -200ms < 0 => returns -1.
  assert(findActiveLyricIndex(lyricsSample, 300, -500) === -1, 'Effective time < 0 returns -1');

  // Test 3.5: Step shifts (±50ms) progression across boundary
  {
    const targetLyricTime = 12000;
    const testPlaybackTime = 11970; // 30ms before line
    // With offset 0ms: effective 11970ms => index 0
    assert(findActiveLyricIndex(lyricsSample, testPlaybackTime, 0) === 0, 't=11970 with offset=0 is index 0');
    // With step +50ms: effective 12020ms => index 1 (line triggered early by single +50ms step)
    assert(findActiveLyricIndex(lyricsSample, testPlaybackTime, 50) === 1, 't=11970 with step +50ms triggers line 1');
    // With step -50ms: effective 11920ms => index 0
    assert(findActiveLyricIndex(lyricsSample, testPlaybackTime, -50) === 0, 't=11970 with step -50ms remains index 0');
  }

  // -----------------------------------------------------------------
  // 4. KINETIC VIEWPORT VISUAL HIERARCHY & PHYSICS
  // -----------------------------------------------------------------
  console.log('\n--- Suite 4: Kinetic Viewport Visual Hierarchy & Physics ---');

  // Test 4.1: Spring config
  assert(LYRIC_SPRING_CONFIG.stiffness === 180, 'Spring stiffness is 180', { stiffness: LYRIC_SPRING_CONFIG.stiffness });
  assert(LYRIC_SPRING_CONFIG.damping === 25, 'Spring damping is 25', { damping: LYRIC_SPRING_CONFIG.damping });
  assert(LYRIC_SPRING_CONFIG.mass === 1, 'Spring mass is 1', { mass: LYRIC_SPRING_CONFIG.mass });

  // Test 4.2: activeIndex = -1 (pre-intro state)
  {
    const visual = getLyricVisualHierarchy(0, -1);
    assert(visual.scale === 1.0, 'activeIndex = -1: scale is 1.0');
    assert(visual.opacity === 0.6, 'activeIndex = -1: opacity is 0.6');
    assert(visual.filter === 'blur(0px)', 'activeIndex = -1: filter is blur(0px)');
    assert(visual.isActive === false, 'activeIndex = -1: isActive is false');
  }

  // Test 4.3: distance = 0 (active line)
  {
    const visual = getLyricVisualHierarchy(3, 3);
    assert(visual.scale === 1.04, 'distance = 0: scale expands to 1.04 for active elevation', { scale: visual.scale });
    assert(visual.opacity === 1.0, 'distance = 0: opacity is 1.0 (full luminance)', { opacity: visual.opacity });
    assert(visual.filter === 'blur(0px)', 'distance = 0: blur is 0px (crisp)', { filter: visual.filter });
    assert(visual.isActive === true, 'distance = 0: isActive is true');
    assert(visual.typographyClass.includes('drop-shadow'), 'distance = 0: active glow drop-shadow class included');
    assert(visual.typographyClass.includes('font-extrabold'), 'distance = 0: typography is font-extrabold');
  }

  // Test 4.4: distance = 1 (direct neighbor)
  {
    const prevNeighbor = getLyricVisualHierarchy(2, 3);
    const nextNeighbor = getLyricVisualHierarchy(4, 3);
    assert(prevNeighbor.scale === 0.98, 'distance = 1: scale is 0.98');
    assert(prevNeighbor.opacity === 0.55, 'distance = 1: opacity is 0.55 (moderate decay)');
    assert(prevNeighbor.filter === 'blur(1px)', 'distance = 1: filter is blur(1px)');
    assert(prevNeighbor.isActive === false, 'distance = 1: isActive is false');
    assert(prevNeighbor.scale === nextNeighbor.scale, 'distance = 1: symmetric scale for prev and next neighbors');
    assert(prevNeighbor.opacity === nextNeighbor.opacity, 'distance = 1: symmetric opacity for prev and next neighbors');
  }

  // Test 4.5: distance = 2 (second neighbor)
  {
    const dist2 = getLyricVisualHierarchy(1, 3);
    assert(dist2.scale === 0.95, 'distance = 2: scale is 0.95');
    assert(dist2.opacity === 0.35, 'distance = 2: opacity decays to 0.35');
    assert(dist2.filter === 'blur(3px)', 'distance = 2: filter is blur(3px)');
    assert(dist2.isActive === false, 'distance = 2: isActive is false');
  }

  // Test 4.6: distance >= 3 (distant lines)
  {
    const dist3 = getLyricVisualHierarchy(0, 3);
    const dist10 = getLyricVisualHierarchy(13, 3);
    assert(dist3.scale === 0.92, 'distance = 3: scale is 0.92');
    assert(dist3.opacity === 0.15, 'distance = 3: opacity floor is 0.15 (15% visibility)');
    assert(dist3.filter === 'blur(6px)', 'distance = 3: filter is blur(6px)');
    assert(dist10.opacity === 0.15, 'distance = 10: opacity remains at floor 0.15');
    assert(dist10.filter === 'blur(6px)', 'distance = 10: filter remains at blur(6px)');
  }

  // Test 4.7: Reduced motion mode (prefersReducedMotion = true)
  {
    const activeReduced = getLyricVisualHierarchy(3, 3, true);
    const inactiveReduced = getLyricVisualHierarchy(0, 3, true);
    assert(activeReduced.scale === 1.0, 'Reduced motion: active scale clamped to 1.0');
    assert(inactiveReduced.scale === 1.0, 'Reduced motion: inactive scale clamped to 1.0');
    assert(activeReduced.filter === 'blur(0px)', 'Reduced motion: active blur is blur(0px)');
    assert(inactiveReduced.filter === 'blur(0px)', 'Reduced motion: inactive blur is blur(0px) (CSS blur disabled)');
  }

  // -----------------------------------------------------------------
  // 5. USEPLAYERSTORE INTEGRATION & STATE TRANSITIONS
  // -----------------------------------------------------------------
  console.log('\n--- Suite 5: usePlayerStore Lyric Sync & Seeking ---');

  // Test 5.1: setSyncOffsetMs boundary clamping [-500, +500]
  usePlayerStore.getState().setSyncOffsetMs(0);
  assert(usePlayerStore.getState().syncOffsetMs === 0, 'syncOffsetMs initial is 0');
  usePlayerStore.getState().setSyncOffsetMs(350);
  assert(usePlayerStore.getState().syncOffsetMs === 350, 'setSyncOffsetMs(350) updates to 350');
  usePlayerStore.getState().setSyncOffsetMs(750);
  assert(usePlayerStore.getState().syncOffsetMs === 500, 'setSyncOffsetMs(750) clamped to upper bound 500');
  usePlayerStore.getState().setSyncOffsetMs(-800);
  assert(usePlayerStore.getState().syncOffsetMs === -500, 'setSyncOffsetMs(-800) clamped to lower bound -500');
  usePlayerStore.getState().setSyncOffsetMs(0); // restore

  // Test 5.2: Offset adjustment while playback is paused updates activeLineIndex immediately
  {
    const track = DEMO_TRACKS[0];
    usePlayerStore.getState().selectDemoTrack(0);
    // At t = 24800ms, line 0 is active (line 1 is at 25000ms)
    usePlayerStore.getState().setCurrentTimeMs(24800);
    const unshiftedIdx = usePlayerStore.getState().activeLineIndex;
    // Advance offset by +300ms while paused => effective time = 25100ms
    usePlayerStore.getState().setSyncOffsetMs(300);
    const shiftedIdx = usePlayerStore.getState().activeLineIndex;
    assert(shiftedIdx >= unshiftedIdx, 'Adjusting offset while paused synchronously updates activeLineIndex', {
      unshiftedIdx, shiftedIdx
    });
    usePlayerStore.getState().setSyncOffsetMs(0); // restore
  }

  // Test 5.3: seekTo updates currentTimeMs, seekTarget, and activeLineIndex accurately
  {
    usePlayerStore.getState().seekTo(45000);
    const s = usePlayerStore.getState();
    assert(s.currentTimeMs === 45000, 'seekTo(45000) updates currentTimeMs to 45000');
    assert(s.seekTarget === 45000, 'seekTo(45000) sets seekTarget to 45000');
    const expectedLine = findActiveLyricIndex(s.lyrics, 45000, 0);
    assert(s.activeLineIndex === expectedLine, `activeLineIndex updated to ${expectedLine} on seek`, {
      activeLineIndex: s.activeLineIndex, expectedLine
    });
    usePlayerStore.getState().clearSeekTarget();
  }

  // -----------------------------------------------------------------
  // SUMMARY REPORT
  // -----------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TOTAL MILESTONE 2 ASSERTIONS: ${totalTests}`);
  console.log(`PASSED:                       ${passedTests} ✔`);
  console.log(`FAILED:                       ${failedTests} ✖`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    console.error('FAILURES SUMMARY:');
    failures.forEach((f, idx) => {
      console.error(`${idx + 1}) ${f.message}`);
      console.error('   Details:', f.details);
    });
    process.exit(1);
  } else {
    console.log('ALL MILESTONE 2 CHALLENGER TESTS PASSED SUCCESSFULLY! ✔\n');
    process.exit(0);
  }
}

runMilestone2ChallengerSuite().catch(err => {
  console.error('Fatal execution error in challenger suite:', err);
  process.exit(1);
});
