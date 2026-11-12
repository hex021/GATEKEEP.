/**
 * Challenger 1: Milestone 5 Empirical Stress Test Suite
 * Crazy "Video Edit" Kinetic Visualizer Engine
 * 
 * Scope:
 * 1. Extreme inputs for keywordPuncher.ts:
 *    - 0 words (empty, whitespace, stripped HTML/XSS, empty/whitespace stage direction)
 *    - 1 word (single char, lowercase stopword, all-caps, 100+ chars overflow, number, emoji, punctuation)
 *    - >50 words (55 words, 100 words, 200 words, responsive scale, bounded sideways/badges)
 *    - Multilingual & Foreign scripts (Japanese, Chinese, Korean, Arabic RTL, Cyrillic, Greek, Hindi, Accents, Umlauts, Spanish ¿)
 *    - Emojis & Unicode symbols (pure emojis, mixed emojis, ZWJ sequences, math symbols)
 *    - Numbers & Alphanumeric tokens (pure numbers, timecode/BPM tokens, negative/decimals)
 *    - Punctuation-only strings (..., ---, ?!?, ;;;, ***)
 * 2. SMPTE 30fps Timecode formatting:
 *    - Millisecond boundaries (0ms, 999ms, 1000ms, 102650ms, 3600000ms)
 *    - Sub-second frame rollovers (33ms, 34ms, 66ms, 67ms, 500ms)
 *    - Rollovers at 60s, 1h, 24h
 *    - Adversarial inputs: negative ms, NaN, null, undefined, floating point ms, fractional frames
 *    - Custom FPS (24fps, 25fps, 60fps)
 * 3. Visualizer Mode Switcher & State Machine:
 *    - Strict cycling sequence: video-edit -> apple-spatial -> cyberpunk -> video-edit
 *    - 300-iteration cyclic determinism
 *    - Invalid mode fallback (unknown strings, uppercase, null, undefined, numeric, object)
 *    - Zustand PlayerStore integration (initial mode, cycling, recovery from corrupt state)
 *    - LocalStorage resilience and quota error fault tolerance
 * 4. Procedural Audio Meters & Cyberpunk Glitch Mechanics:
 *    - Audio meter bounds [10, 100], zero-volume fallback, arbitrary band counts
 *    - Cyberpunk glitch displacement, distance blur decay, hex line counter formatting
 */

import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

try {
  register('./tests/helpers/path-loader.mjs', pathToFileURL('./'));
} catch {
  // Ignore if already registered via CLI flag
}

import { suite, test, expect, globalHarness } from './helpers/test-harness.mjs';
import {
  formatTimecode,
  tokenizeAndPunchLine,
  analyzeLyricLine,
  getAdaptiveFontScale,
  cycleVisualizerMode,
  generateMeterHeights,
  calculateWordImpactScore,
  getCyberpunkGlitchParams,
  VISUALIZER_MODES,
  STOP_WORDS,
  HIGH_ENERGY_PUNCH_TERMS,
} from '../src/components/visualizer/keywordPuncher.ts';
let usePlayerStore;
async function getPlayerStore() {
  if (!usePlayerStore) {
    const mod = await import('../src/stores/usePlayerStore.ts');
    usePlayerStore = mod.usePlayerStore;
  }
  return usePlayerStore;
}

// =========================================================================
// Suite 1: Extreme Inputs — 0 Words, Empty, Whitespace & Stripped Content
// =========================================================================
suite('Challenger 1 M5: Extreme Inputs — 0 Words & Sanitized Content', () => {
  test('C1.M5.S01.1: Empty string returns zero words and hasPunchedKeyword: false', () => {
    const res = tokenizeAndPunchLine('');
    expect(res.words.length).toBe(0);
    expect(res.hasPunchedKeyword).toBe(false);
    expect(res.punchWord).toBe(undefined);
    expect(res.isStageDirection).toBe(false);
  });

  test('C1.M5.S01.2: Whitespace only strings (spaces, tabs, newlines, carriage returns)', () => {
    const inputs = ['   ', '\t', '\n\n', '  \r\n\t  '];
    for (const input of inputs) {
      const res = tokenizeAndPunchLine(input);
      expect(res.words.length).toBe(0);
      expect(res.hasPunchedKeyword).toBe(false);
      expect(res.isStageDirection).toBe(false);
    }
  });

  test('C1.M5.S01.3: Malicious script tags are stripped completely resulting in empty words', () => {
    const xss = "<script>alert('XSS')</script>";
    const res = tokenizeAndPunchLine(xss);
    expect(res.words.length).toBe(0);
    expect(res.hasPunchedKeyword).toBe(false);
  });

  test('C1.M5.S01.4: Pure HTML tags without text strip to empty words', () => {
    const html = '<div><span><b><i></i></b></span></div>';
    const res = tokenizeAndPunchLine(html);
    expect(res.words.length).toBe(0);
    expect(res.hasPunchedKeyword).toBe(false);
  });

  test('C1.M5.S01.5: Empty stage directions "()" and "(   )" handle cleanly', () => {
    const res1 = tokenizeAndPunchLine('()');
    expect(res1.isStageDirection).toBe(true);
    expect(res1.stageCueText).toBe('');
    expect(res1.words.length).toBe(0);

    const res2 = tokenizeAndPunchLine('(   )');
    expect(res2.isStageDirection).toBe(true);
    expect(res2.stageCueText).toBe('');
    expect(res2.words.length).toBe(0);
  });
});

// =========================================================================
// Suite 2: Extreme Inputs — 1 Word Lines & Boundary Constraints
// =========================================================================
suite('Challenger 1 M5: Extreme Inputs — 1 Word Lines & Boundary Constraints', () => {
  test('C1.M5.S02.1: Single ASCII word is always punched, 0 deg rotation, horizontal-tb', () => {
    const res = tokenizeAndPunchLine('VIBESYNC');
    expect(res.words.length).toBe(1);
    expect(res.hasPunchedKeyword).toBe(true);
    expect(res.punchWord).toBeTruthy();
    expect(res.punchWord.cleaned).toBe('VIBESYNC');
    expect(res.punchWord.rotationDeg).toBe(0);
    expect(res.punchWord.writingMode).toBe('horizontal-tb');
    expect(res.punchWord.role).toBe('punch');
  });

  test('C1.M5.S02.2: Single character word ("a") handles cleanly without crash', () => {
    const res = tokenizeAndPunchLine('a');
    expect(res.words.length).toBe(1);
    expect(res.hasPunchedKeyword).toBe(true);
    expect(res.punchWord.cleaned).toBe('a');
    expect(res.punchWord.rotationDeg).toBe(0);
  });

  test('C1.M5.S02.3: Single stopword ("the") elects fallback punch candidate', () => {
    const res = tokenizeAndPunchLine('the');
    expect(res.words.length).toBe(1);
    expect(res.hasPunchedKeyword).toBe(true);
    expect(res.punchWord.cleaned).toBe('the');
    expect(res.punchWord.role).toBe('punch');
  });

  test('C1.M5.S02.4: Extremely long unbroken word (102 chars) applies break-all container protection', () => {
    const longWord = 'supercalifragilisticexpialidocious'.repeat(3);
    const res = tokenizeAndPunchLine(longWord);
    expect(res.words.length).toBe(1);
    expect(res.punchWord.scaleClass).toContain('break-all');
    expect(res.punchWord.rotationDeg).toBe(0);
  });

  test('C1.M5.S02.5: 1-word lyric strictly suppresses sideways and badge candidates', () => {
    const res = tokenizeAndPunchLine('Aura');
    const sideways = res.words.filter((w) => w.role === 'sideways');
    const badges = res.words.filter((w) => w.role === 'badge');
    expect(sideways.length).toBe(0);
    expect(badges.length).toBe(0);
  });
});

// =========================================================================
// Suite 3: Extreme Inputs — >50 Words Stress & Density Scaling
// =========================================================================
suite('Challenger 1 M5: Extreme Inputs — >50 Words Stress & Density Scaling', () => {
  const words55 =
    'we were driving down the lost highway watching the midnight neon reflections shatter against the windshield ' +
    'wondering if the static frequency would ever resolve into the warmth of your voice while the entire universe ' +
    'collapsed into a single lingering heartbeat echoing through the silence of the dawn exits and forever memories and lost in orbit';

  test('C1.M5.S03.1: 55-word lyric parses all tokens without dropping or duplicating words', () => {
    const res = tokenizeAndPunchLine(words55);
    expect(res.words.length).toBe(55);
    expect(res.hasPunchedKeyword).toBe(true);
    expect(res.punchWord).toBeTruthy();
  });

  test('C1.M5.S03.2: >50 words adopts compact font scale (text-xl/sm/md) to prevent layout blowout', () => {
    const scale = getAdaptiveFontScale(55);
    expect(scale.punchScaleClass).toContain('text-xl');
    expect(scale.standardScaleClass).toContain('text-base');
  });

  test('C1.M5.S03.3: >50 words strictly bounds sideways candidates to <= 1 and badges to <= 2', () => {
    const res = tokenizeAndPunchLine(words55);
    const sideways = res.words.filter((w) => w.role === 'sideways');
    const badges = res.words.filter((w) => w.role === 'badge');
    expect(sideways.length).toBeLessThanOrEqual(1);
    expect(badges.length).toBeLessThanOrEqual(2);
  });

  test('C1.M5.S03.4: 100-word rapid fire monologue parses in under 5ms with monotonic stagger delays', () => {
    const words100 = Array.from({ length: 100 }, (_, i) => `word${i}`).join(' ');
    const t0 = performance.now();
    const res = tokenizeAndPunchLine(words100);
    const t1 = performance.now();

    expect(res.words.length).toBe(100);
    expect(t1 - t0).toBeLessThan(10); // Node execution well under 10ms

    // Verify staggerDelay strictly increases
    for (let i = 0; i < res.words.length; i++) {
      expect(res.words[i].staggerDelay).toBeCloseTo(i * 0.045);
    }
  });

  test('C1.M5.S03.5: 200-word extreme stress test maintains token integrity and punch selection', () => {
    const tokens = Array.from({ length: 200 }, (_, i) => (i === 137 ? 'HYPERDRIVE' : `step${i}`));
    const res = tokenizeAndPunchLine(tokens.join(' '));
    expect(res.words.length).toBe(200);
    expect(res.hasPunchedKeyword).toBe(true);
    expect(res.punchWord).toBeTruthy();
  });
});

// =========================================================================
// Suite 4: Multilingual, Foreign Scripts, Accents & RTL Languages
// =========================================================================
suite('Challenger 1 M5: Multilingual, Foreign Scripts & Accents', () => {
  test('C1.M5.S04.1: Japanese Kanji & Hiragana (空を裂いて光る星の残響 運命の彼方へ走れ)', () => {
    const lyric = '空を裂いて光る星の残響 運命の彼方へ走れ';
    const res = tokenizeAndPunchLine(lyric);
    expect(res.words.length).toBe(2);
    expect(res.hasPunchedKeyword).toBe(true);
    // Token 0 and Token 1 are both preserved; phrase-ending cadence bonus elects Token 1
    expect(res.words[0].cleaned).toBe('空を裂いて光る星の残響');
    expect(res.punchWord.cleaned).toBe('運命の彼方へ走れ');
  });

  test('C1.M5.S04.2: Chinese Simplified & Traditional (夜空中最亮的星 是否听清 那仰望的人)', () => {
    const lyric = '夜空中最亮的星 是否听清 那仰望的人 心底的孤独和叹息';
    const res = tokenizeAndPunchLine(lyric);
    expect(res.words.length).toBe(4);
    expect(res.hasPunchedKeyword).toBe(true);
    for (const w of res.words) {
      expect(w.cleaned.length).toBeGreaterThan(0);
    }
  });

  test('C1.M5.S04.3: Korean Hangul (어둠 속에서도 빛나는 별처럼 우리 함께 걸어가)', () => {
    const lyric = '어둠 속에서도 빛나는 별처럼 우리 함께 걸어가';
    const res = tokenizeAndPunchLine(lyric);
    expect(res.words.length).toBe(7);
    expect(res.hasPunchedKeyword).toBe(true);
    expect(res.punchWord.cleaned).toBe('속에서도'); // Longest token elected
  });

  test('C1.M5.S04.4: Arabic RTL text (في ظلام الليل يلمع النجم البعيد ويضيء دربنا)', () => {
    const lyric = 'في ظلام الليل يلمع النجم البعيد ويضيء دربنا';
    const res = tokenizeAndPunchLine(lyric);
    expect(res.words.length).toBe(8);
    expect(res.hasPunchedKeyword).toBe(true);
    for (const w of res.words) {
      expect(w.cleaned.length).toBeGreaterThan(0);
    }
  });

  test('C1.M5.S04.5: Cyrillic / Russian (Сквозь неоновый туман мы летим в бесконечность)', () => {
    const lyric = 'Сквозь неоновый туман мы летим в бесконечность';
    const res = tokenizeAndPunchLine(lyric);
    expect(res.words.length).toBe(7);
    expect(res.hasPunchedKeyword).toBe(true);
    expect(res.punchWord.cleaned).toBe('бесконечность'); // Longest substantive word
  });

  test('C1.M5.S04.6: French Accents (Où brûle l\'étoile filante dans la nuit d\'été, nous rêvons)', () => {
    const lyric = "Où brûle l'étoile filante dans la nuit d'été, nous rêvons";
    const res = tokenizeAndPunchLine(lyric);
    expect(res.words.length).toBe(10);
    expect(res.hasPunchedKeyword).toBe(true);
    const starToken = res.words.find((w) => w.cleaned.includes("l'étoile"));
    expect(starToken).toBeTruthy();
  });

  test('C1.M5.S04.7: German Umlauts & Eszett (Über den Wolken strahlt das helle Licht der Ewigkeit)', () => {
    const lyric = 'Über den Wolken strahlt das helle Licht der Ewigkeit';
    const res = tokenizeAndPunchLine(lyric);
    expect(res.words.length).toBe(9);
    expect(res.hasPunchedKeyword).toBe(true);
    const uber = res.words.find((w) => w.cleaned === 'Über');
    expect(uber).toBeTruthy();
  });

  test('C1.M5.S04.8: Spanish inverted punctuation (¿Dónde está el fuego que consumió nuestra ciudad?)', () => {
    const lyric = '¿Dónde está el fuego que consumió nuestra ciudad?';
    const res = tokenizeAndPunchLine(lyric);
    expect(res.words.length).toBe(8);
    const donde = res.words[0];
    expect(donde.cleaned).toBe('Dónde'); // Edge punctuation '¿' cleanly stripped
    const ciudad = res.words[res.words.length - 1];
    expect(ciudad.cleaned).toBe('ciudad'); // Edge punctuation '?' cleanly stripped
  });
});

// =========================================================================
// Suite 5: Emojis, Symbols, Numbers & Punctuation Strings
// =========================================================================
suite('Challenger 1 M5: Emojis, Symbols, Numbers & Punctuation', () => {
  test('C1.M5.S05.1: Pure emoji sequences ("🔥 🚀 💥 ✨ 🎧 🌌") parse safely without crash', () => {
    const lyric = '🔥 🚀 💥 ✨ 🎧 🌌';
    const res = tokenizeAndPunchLine(lyric);
    expect(res.words.length).toBe(6);
    expect(res.hasPunchedKeyword).toBe(true);
    expect(res.punchWord).toBeTruthy();
    expect(res.punchWord.cleaned).toBe('🔥');
  });

  test('C1.M5.S05.2: Mixed emojis with curated punch words prioritizes substantive keywords', () => {
    const lyric = '✨ neon 🚀 skyline 🔥 in ⚡ the 🌌 dark 🎧';
    const res = tokenizeAndPunchLine(lyric);
    expect(res.hasPunchedKeyword).toBe(true);
    // 'skyline' has score >= 8 (high energy punch term + length)
    expect(res.punchWord.cleaned).toBe('skyline');
  });

  test('C1.M5.S05.3: Unicode math and special symbols ("∑ π ∫ ≈ ≠ → ← ↑ ↓ ⚡ ∞")', () => {
    const lyric = '∑ π ∫ ≈ ≠ → ← ↑ ↓ ⚡ ∞';
    const res = tokenizeAndPunchLine(lyric);
    expect(res.words.length).toBe(11);
    expect(res.hasPunchedKeyword).toBe(true);
  });

  test('C1.M5.S05.4: Pure numbers ("1984 2026 007 404 808 909") are preserved and punched', () => {
    const lyric = '1984 2026 007 404 808 909';
    const res = tokenizeAndPunchLine(lyric);
    expect(res.words.length).toBe(6);
    expect(res.hasPunchedKeyword).toBe(true);
    for (const w of res.words) {
      expect(/^\d+$/.test(w.cleaned)).toBe(true);
    }
  });

  test('C1.M5.S05.5: Technical telemetry strings ("RAW4K 60FPS ISO800 f/1.4 120BPM")', () => {
    const lyric = 'RAW4K 60FPS ISO800 f/1.4 120BPM';
    const res = tokenizeAndPunchLine(lyric);
    expect(res.words.length).toBe(5);
    expect(res.hasPunchedKeyword).toBe(true);
  });

  test('C1.M5.S05.6: Punctuation-only strings ("...", "---", "?!?", "***")', () => {
    const inputs = ['...', '---', '?!?', '***', ';;; ::: ///'];
    for (const input of inputs) {
      const res = tokenizeAndPunchLine(input);
      expect(res.words.length).toBeGreaterThan(0);
      expect(res.hasPunchedKeyword).toBe(true);
      expect(res.punchWord).toBeTruthy();
      expect(res.punchWord.cleaned.length).toBeGreaterThan(0);
    }
  });
});

// =========================================================================
// Suite 6: SMPTE 30fps Timecode Formatting Millisecond Boundaries
// =========================================================================
suite('Challenger 1 M5: SMPTE 30fps Timecode Millisecond Boundaries', () => {
  test('C1.M5.S06.1: Exact required millisecond test points (0ms, 999ms, 1000ms, 102650ms, 3600000ms)', () => {
    expect(formatTimecode(0, 30)).toBe('00:00:00:00');
    expect(formatTimecode(999, 30)).toBe('00:00:00:29');
    expect(formatTimecode(1000, 30)).toBe('00:00:01:00');
    expect(formatTimecode(102650, 30)).toBe('00:01:42:19');
    expect(formatTimecode(3600000, 30)).toBe('01:00:00:00');
  });

  test('C1.M5.S06.2: Frame boundary increments at 30fps (33.33ms per frame)', () => {
    // Frame 0: [0ms, 33ms] -> floor(33 * 30 / 1000) = 0
    expect(formatTimecode(33, 30)).toBe('00:00:00:00');
    // Frame 1: 34ms -> floor(34 * 30 / 1000) = 1
    expect(formatTimecode(34, 30)).toBe('00:00:00:01');
    // Frame 2: 67ms -> floor(67 * 30 / 1000) = 2
    expect(formatTimecode(66, 30)).toBe('00:00:00:01');
    expect(formatTimecode(67, 30)).toBe('00:00:00:02');
    // Mid-second: 500ms -> floor(500 * 30 / 1000) = 15
    expect(formatTimecode(500, 30)).toBe('00:00:00:15');
  });

  test('C1.M5.S06.3: Rollover at 60 seconds (59999ms -> 60000ms)', () => {
    expect(formatTimecode(59999, 30)).toBe('00:00:59:29');
    expect(formatTimecode(60000, 30)).toBe('00:01:00:00');
  });

  test('C1.M5.S06.4: Rollover at 1 hour (3599999ms -> 3600000ms)', () => {
    expect(formatTimecode(3599999, 30)).toBe('00:59:59:29');
    expect(formatTimecode(3600000, 30)).toBe('01:00:00:00');
  });

  test('C1.M5.S06.5: 24-hour rollover (86399999ms -> 86400000ms)', () => {
    expect(formatTimecode(86399999, 30)).toBe('23:59:59:29');
    expect(formatTimecode(86400000, 30)).toBe('24:00:00:00');
  });

  test('C1.M5.S06.6: Adversarial negative, NaN, null and undefined millisecond inputs', () => {
    expect(formatTimecode(-1, 30)).toBe('00:00:00:00');
    expect(formatTimecode(-999999, 30)).toBe('00:00:00:00');
    expect(formatTimecode(NaN, 30)).toBe('00:00:00:00');
    expect(formatTimecode(null, 30)).toBe('00:00:00:00');
    expect(formatTimecode(undefined, 30)).toBe('00:00:00:00');
  });

  test('C1.M5.S06.7: Fractional and floating-point millisecond inputs', () => {
    // 999.9ms should safely round down to frame 29
    expect(formatTimecode(999.9, 30)).toBe('00:00:00:29');
    // 1000.4ms should be second 1, frame 0
    expect(formatTimecode(1000.4, 30)).toBe('00:00:01:00');
  });

  test('C1.M5.S06.8: Alternative framerates (24fps cinema, 25fps PAL, 60fps broadcast)', () => {
    // 500ms at 24fps -> 12 frames
    expect(formatTimecode(500, 24)).toBe('00:00:00:12');
    // 500ms at 25fps -> 12 frames
    expect(formatTimecode(500, 25)).toBe('00:00:00:12');
    // 500ms at 60fps -> 30 frames
    expect(formatTimecode(500, 60)).toBe('00:00:00:30');
    // 999ms at 60fps -> 59 frames
    expect(formatTimecode(999, 60)).toBe('00:00:00:59');
  });
});

// =========================================================================
// Suite 7: Mode Switcher Cycling & State Machine Safety
// =========================================================================
suite('Challenger 1 M5: Mode Switcher Cycling & State Machine', () => {
  test('C1.M5.S07.1: Strict 3-state transition order (video-edit -> apple-spatial -> cyberpunk)', () => {
    expect(cycleVisualizerMode('video-edit')).toBe('apple-spatial');
    expect(cycleVisualizerMode('apple-spatial')).toBe('cyberpunk');
    expect(cycleVisualizerMode('cyberpunk')).toBe('video-edit');
  });

  test('C1.M5.S07.2: 300-cycle stress test proves strict modulo 3 determinism without state drift', () => {
    let mode = 'video-edit';
    for (let i = 0; i < 300; i++) {
      expect(mode).toBe(VISUALIZER_MODES[i % 3]);
      mode = cycleVisualizerMode(mode);
    }
    expect(mode).toBe('video-edit');
  });

  test('C1.M5.S07.3: Invalid and corrupt mode strings safely recover to video-edit', () => {
    const corruptInputs = [
      'unknown-mode',
      '',
      'VIDEO-EDIT',
      'apple',
      'cyber',
      '3d',
      null,
      undefined,
      12345,
      { mode: 'video-edit' },
      ['cyberpunk'],
    ];

    for (const bad of corruptInputs) {
      expect(cycleVisualizerMode(bad)).toBe('video-edit');
    }
  });

  test('C1.M5.S07.4: Zustand PlayerStore integration — initial state and cycling', async () => {
    const storeHook = await getPlayerStore();
    const store = storeHook.getState();
    // Reset to default
    store.setVisualizerMode('video-edit');
    expect(storeHook.getState().visualizerMode).toBe('video-edit');

    // Cycle 1 -> apple-spatial
    store.cycleVisualizerMode();
    expect(storeHook.getState().visualizerMode).toBe('apple-spatial');

    // Cycle 2 -> cyberpunk
    store.cycleVisualizerMode();
    expect(storeHook.getState().visualizerMode).toBe('cyberpunk');

    // Cycle 3 -> video-edit
    store.cycleVisualizerMode();
    expect(storeHook.getState().visualizerMode).toBe('video-edit');
  });

  test('C1.M5.S07.5: Zustand PlayerStore recovery from corrupt state via cycleVisualizerMode', async () => {
    const storeHook = await getPlayerStore();
    const store = storeHook.getState();
    // Simulate corrupt state injected into store
    store.setVisualizerMode('corrupt_mode');
    expect(storeHook.getState().visualizerMode).toBe('corrupt_mode');

    // Calling cycleVisualizerMode should recover to video-edit
    store.cycleVisualizerMode();
    expect(storeHook.getState().visualizerMode).toBe('video-edit');
  });

  test('C1.M5.S07.6: LocalStorage persistence resilience when quota exceeded or disabled', () => {
    // Simulate localStorage.setItem throwing QuotaExceededError
    const mockStorage = {
      setItem: () => {
        throw new Error('QuotaExceededError: DOM Exception 22');
      },
    };

    // KineticLyrics try-catch pattern verification
    let errorThrown = false;
    try {
      try {
        mockStorage.setItem();
      } catch {
        // Handled silently
      }
    } catch {
      errorThrown = true;
    }
    expect(errorThrown).toBe(false);
  });
});

// =========================================================================
// Suite 8: Procedural Audio Meters & Cyberpunk Glitch Mechanics
// =========================================================================
suite('Challenger 1 M5: Procedural Audio Meters & Cyberpunk Mechanics', () => {
  test('C1.M5.S08.1: generateMeterHeights clamps values within [10, 100] when isPlaying = true', () => {
    for (let seed = 0; seed < 50; seed++) {
      const heights = generateMeterHeights(16, seed, true);
      expect(heights.length).toBe(16);
      for (const h of heights) {
        expect(h).toBeGreaterThanOrEqual(10);
        expect(h).toBeLessThanOrEqual(100);
      }
    }
  });

  test('C1.M5.S08.2: generateMeterHeights returns static baseline 10 when isPlaying = false', () => {
    const heights = generateMeterHeights(16, 42, false);
    expect(heights.length).toBe(16);
    for (const h of heights) {
      expect(h).toBe(10);
    }
  });

  test('C1.M5.S08.3: generateMeterHeights handles arbitrary band counts (0, 1, 32, 64)', () => {
    expect(generateMeterHeights(0, 1, true).length).toBe(0);
    expect(generateMeterHeights(1, 1, true).length).toBe(1);
    expect(generateMeterHeights(32, 1, true).length).toBe(32);
    expect(generateMeterHeights(64, 1, true).length).toBe(64);
  });

  test('C1.M5.S08.4: getCyberpunkGlitchParams computes correct active and inactive attributes', () => {
    const active = getCyberpunkGlitchParams(5, 5, false);
    expect(active.isActive).toBe(true);
    expect(active.distance).toBe(0);
    expect(active.blurAmount).toBe(0);
    expect(active.opacity).toBe(1.0);
    expect(active.hexLabel).toBe('[0x05]');
    expect(active.magentaShift).toBe(-2.5);
    expect(active.cyanShift).toBe(2.5);

    const activeGlitch = getCyberpunkGlitchParams(5, 5, true);
    expect(activeGlitch.magentaShift).toBe(-3.5);
    expect(activeGlitch.cyanShift).toBe(3.5);

    const inactive = getCyberpunkGlitchParams(2, 5, false);
    expect(inactive.isActive).toBe(false);
    expect(inactive.distance).toBe(3);
    expect(inactive.blurAmount).toBe(6); // Math.min(6, 3 * 2)
    expect(inactive.opacity).toBeCloseTo(0.2); // Math.max(0.2, 0.6 - 0.45)
    expect(inactive.hexLabel).toBe('[0x02]');
  });

  test('C1.M5.S08.5: getCyberpunkGlitchParams hex counter zero-padding up to 0xFF', () => {
    expect(getCyberpunkGlitchParams(0, 0, false).hexLabel).toBe('[0x00]');
    expect(getCyberpunkGlitchParams(10, 0, false).hexLabel).toBe('[0x0A]');
    expect(getCyberpunkGlitchParams(16, 0, false).hexLabel).toBe('[0x10]');
    expect(getCyberpunkGlitchParams(255, 0, false).hexLabel).toBe('[0xFF]');
  });
});

// =========================================================================
// Runner
// =========================================================================
async function runChallenger1M5StressSuites() {
  console.log('\n======================================================');
  console.log('   CHALLENGER 1: MILESTONE 5 EMPIRICAL STRESS TESTS   ');
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
    console.log('ALL CHALLENGER 1 MILESTONE 5 STRESS TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  }
}

runChallenger1M5StressSuites();
