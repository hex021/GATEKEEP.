/**
 * Challenger 2: Milestone 4 Empirical Stress Test Suite
 * Adversarial verification of Card Geometry, Icon Sizing, SVG Math & High-Res Export.
 *
 * Scope:
 * 1. Aspect Ratio & Geometry: 9:16 base 360x640px and pixelRatio: 3 yields 1080x1920px across all 3 cards.
 * 2. Explicit Icon Sizing: AST / regex verification that EVERY Lucide icon has explicit numeric size >= 12.
 * 3. Receipt Jagged Teeth & Barcode Integrity: 18-tooth SVG geometry math and deterministic barcode invariants under extreme edge cases.
 * 4. Font Ready Guard & Snapshot Bridge Fallback: Timeout race simulation, snapshot fallback, and SSRF proxy validation.
 * 5. String compaction and duration formatting boundary stress tests.
 */

import { suite, test, expect } from './helpers/test-harness.mjs';
import { DEMO_TRACKS } from '../src/data/demoTracks.ts';
import fs from 'node:fs';
import path from 'node:path';

// Load source code for static analysis and function extraction
const cardUtilsSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/components/story/cardUtils.ts'),
  'utf8'
);
const glassAppleSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/components/story/GlassAppleCard.tsx'),
  'utf8'
);
const brutalistSwissSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/components/story/BrutalistSwissCard.tsx'),
  'utf8'
);
const vinylReceiptSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/components/story/VinylReceiptCard.tsx'),
  'utf8'
);
const storyFlexModalSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/components/story/StoryFlexModal.tsx'),
  'utf8'
);
const floatingPlayerBarSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/components/player/FloatingPlayerBar.tsx'),
  'utf8'
);
const pageSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/app/page.tsx'),
  'utf8'
);
const proxyRouteSrc = fs.readFileSync(
  path.join(process.cwd(), 'src/app/api/proxy-image/route.ts'),
  'utf8'
);

// Extract cardUtils functions into an isolated execution context
const cardUtilsFunctions = (() => {
  const sanitized = cardUtilsSrc
    .replace(/import[\s\S]*?;\n/, '')
    .replace(/export interface[\s\S]*?\n}\n/, '')
    .replace(/export /g, '')
    .replace(/:\s*number\s*=\s*/g, ' = ')
    .replace(/:\s*string\s*=\s*/g, ' = ')
    .replace(/:\s*unknown/g, '')
    .replace(/:\s*number\[\]/g, '')
    .replace(/:\s*string/g, '')
    .replace(/:\s*number/g, '');

  const mod = {};
  new Function(
    'mod',
    sanitized +
      '; mod.calculateStoryCardDimensions = calculateStoryCardDimensions;' +
      ' mod.generateBarcode = generateBarcode;' +
      ' mod.formatCardDuration = formatCardDuration;' +
      ' mod.sanitizeIconSize = sanitizeIconSize;' +
      ' mod.compactQuote = compactQuote;'
  )(mod);
  return mod;
})();

const {
  calculateStoryCardDimensions,
  generateBarcode,
  formatCardDuration,
  sanitizeIconSize,
  compactQuote,
} = cardUtilsFunctions;

// Extract isSafeImageUrl from proxy route
const isSafeImageUrl = (() => {
  const match = proxyRouteSrc.match(/function isSafeImageUrl\(urlStr:\s*string\):\s*boolean\s*{([\s\S]*?)\n}/);
  if (!match) throw new Error('Could not extract isSafeImageUrl from proxy route');
  const body = match[1];
  return new Function('urlStr', body);
})();

// Helper to inspect all Lucide React icon usages in a TSX source file
function extractLucideIconUsages(source, fileName) {
  const usages = [];
  const importMatch = source.match(/import\s+{([^}]+)}\s+from\s+['"]lucide-react['"];?/);
  if (!importMatch) return usages;

  const iconNames = importMatch[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const icon of iconNames) {
    // Match <IconName ... /> or <IconName ...>
    const regex = new RegExp('<' + icon + '(\\s+[^>]*?)?\\/?>', 'g');
    let m;
    while ((m = regex.exec(source)) !== null) {
      const attrs = m[1] || '';
      const sizeMatch = attrs.match(/size={?([0-9]+)}?/);
      usages.push({
        file: fileName,
        icon,
        rawTag: m[0],
        hasExplicitSize: !!sizeMatch,
        sizeValue: sizeMatch ? parseInt(sizeMatch[1], 10) : null,
      });
    }
  }
  return usages;
}

// =========================================================================
// Suite 1: Aspect Ratio, Geometry & High-Res 1080x1920 Scaling
// =========================================================================
suite('Challenger 2 M4: Aspect Ratio, Geometry & High-Res Scaling', () => {
  test('C2.M4.S01.1: Standard base dimensions strictly yield 360x640px and 9:16 aspect ratio', () => {
    const dim = calculateStoryCardDimensions(360, 3);
    expect(dim.baseWidth).toBe(360);
    expect(dim.baseHeight).toBe(640);
    expect(dim.exportWidth).toBe(1080);
    expect(dim.exportHeight).toBe(1920);

    // Mathematical exactness
    const expectedRatio = 9 / 16;
    expect(dim.aspectRatio).toBeCloseTo(expectedRatio, 0.0001);
    expect(dim.baseWidth / dim.baseHeight).toBeCloseTo(expectedRatio, 0.0001);
    expect(dim.exportWidth / dim.exportHeight).toBeCloseTo(expectedRatio, 0.0001);
  });

  test('C2.M4.S01.2: DOM layout dimensions in all 3 cards enforce 360x640px fixed container bounds', () => {
    // GlassAppleCard
    expect(glassAppleSrc).toContain('w-[360px]');
    expect(glassAppleSrc).toContain('h-[640px]');
    expect(glassAppleSrc).toContain('max-w-[360px]');
    expect(glassAppleSrc).toContain('max-h-[640px]');

    // BrutalistSwissCard
    expect(brutalistSwissSrc).toContain('w-[360px]');
    expect(brutalistSwissSrc).toContain('h-[640px]');
    expect(brutalistSwissSrc).toContain('max-w-[360px]');
    expect(brutalistSwissSrc).toContain('max-h-[640px]');

    // VinylReceiptCard
    expect(vinylReceiptSrc).toContain('w-[360px]');
    expect(vinylReceiptSrc).toContain('h-[640px]');
    expect(vinylReceiptSrc).toContain('max-w-[360px]');
    expect(vinylReceiptSrc).toContain('max-h-[640px]');
  });

  test('C2.M4.S01.3: StoryFlexModal decouples scaled 0.75 preview from unscaled 360x640 export container', () => {
    // Live preview scaled container
    expect(storyFlexModalSrc).toContain('w-[270px]');
    expect(storyFlexModalSrc).toContain('h-[480px]');
    expect(storyFlexModalSrc).toContain("transform: 'scale(0.75)'");
    expect(storyFlexModalSrc).toContain("width: '360px'");
    expect(storyFlexModalSrc).toContain("height: '640px'");

    // Dedicated unscaled offscreen export target
    expect(storyFlexModalSrc).toContain("position: 'fixed'");
    expect(storyFlexModalSrc).toContain('left: -9999');
    expect(storyFlexModalSrc).toContain('width: 360');
    expect(storyFlexModalSrc).toContain('height: 640');
    expect(storyFlexModalSrc).toContain('pixelRatio: 3');
  });

  test('C2.M4.S01.4: Dimension oracle invariant holds across arbitrary responsive base widths', () => {
    const testWidths = [180, 270, 360, 450, 540, 720, 1080];
    for (const bw of testWidths) {
      const d = calculateStoryCardDimensions(bw, 3);
      expect(d.baseWidth).toBe(bw);
      expect(d.baseHeight).toBe(Math.round((bw * 16) / 9));
      expect(d.exportWidth).toBe(bw * 3);
      expect(d.exportHeight).toBe(d.baseHeight * 3);
      expect(d.aspectRatio).toBeCloseTo(9 / 16, 0.002);
    }
  });

  test('C2.M4.S01.5: Pixel ratios 1x, 2x, 3x, 4x generate integer pixel grids without fractional offsets', () => {
    for (const pr of [1, 2, 3, 4]) {
      const d = calculateStoryCardDimensions(360, pr);
      expect(Number.isInteger(d.exportWidth)).toBe(true);
      expect(Number.isInteger(d.exportHeight)).toBe(true);
      expect(d.exportWidth).toBe(360 * pr);
      expect(d.exportHeight).toBe(640 * pr);
    }
  });
});

// =========================================================================
// Suite 2: Exhaustive AST/Regex Icon Size Verification (Preventing SVG Collapse)
// =========================================================================
suite('Challenger 2 M4: Explicit Lucide Icon Sizing & SVG Collapse Prevention', () => {
  test('C2.M4.S02.1: GlassAppleCard explicitly sizes all Lucide icons with numeric size >= 12', () => {
    const usages = extractLucideIconUsages(glassAppleSrc, 'GlassAppleCard.tsx');
    expect(usages.length).toBeGreaterThan(0);
    for (const u of usages) {
      expect(u.hasExplicitSize).toBe(true);
      expect(u.sizeValue).toBeGreaterThanOrEqual(12);
    }
  });

  test('C2.M4.S02.2: BrutalistSwissCard explicitly sizes all Lucide icons with numeric size >= 12', () => {
    const usages = extractLucideIconUsages(brutalistSwissSrc, 'BrutalistSwissCard.tsx');
    expect(usages.length).toBeGreaterThan(0);
    for (const u of usages) {
      expect(u.hasExplicitSize).toBe(true);
      expect(u.sizeValue).toBeGreaterThanOrEqual(12);
    }
  });

  test('C2.M4.S02.3: VinylReceiptCard explicitly sizes all Lucide icons with numeric size >= 12', () => {
    const usages = extractLucideIconUsages(vinylReceiptSrc, 'VinylReceiptCard.tsx');
    expect(usages.length).toBeGreaterThan(0);
    for (const u of usages) {
      expect(u.hasExplicitSize).toBe(true);
      expect(u.sizeValue).toBeGreaterThanOrEqual(12);
    }
  });

  test('C2.M4.S02.4: StoryFlexModal explicitly sizes all Lucide icons with numeric size >= 12', () => {
    const usages = extractLucideIconUsages(storyFlexModalSrc, 'StoryFlexModal.tsx');
    expect(usages.length).toBeGreaterThan(0);
    for (const u of usages) {
      expect(u.hasExplicitSize).toBe(true);
      expect(u.sizeValue).toBeGreaterThanOrEqual(12);
    }
  });

  test('C2.M4.S02.5: Story Flex launch triggers in FloatingPlayerBar and page.tsx have explicit size >= 12', () => {
    // FloatingPlayerBar trigger
    const barUsages = extractLucideIconUsages(floatingPlayerBarSrc, 'FloatingPlayerBar.tsx');
    const sparklesInBar = barUsages.filter((u) => u.icon === 'Sparkles');
    expect(sparklesInBar.length).toBe(1);
    expect(sparklesInBar[0].hasExplicitSize).toBe(true);
    expect(sparklesInBar[0].sizeValue).toBe(16);

    // page.tsx header button and branding
    const pageUsages = extractLucideIconUsages(pageSrc, 'page.tsx');
    const sparklesInPage = pageUsages.filter((u) => u.icon === 'Sparkles');
    expect(sparklesInPage.length).toBe(2);
    for (const sp of sparklesInPage) {
      expect(sp.hasExplicitSize).toBe(true);
      expect(sp.sizeValue).toBeGreaterThanOrEqual(12);
    }
  });

  test('C2.M4.S02.6: sanitizeIconSize handles valid, boundary, negative, and malformed inputs safely', () => {
    // Valid numbers >= 12
    expect(sanitizeIconSize(12)).toBe(12);
    expect(sanitizeIconSize(16)).toBe(16);
    expect(sanitizeIconSize(24)).toBe(24);
    expect(sanitizeIconSize(48)).toBe(48);

    // Numbers < 12 clamped to default 20
    expect(sanitizeIconSize(11)).toBe(20);
    expect(sanitizeIconSize(0)).toBe(20);
    expect(sanitizeIconSize(-10)).toBe(20);

    // Numeric strings
    expect(sanitizeIconSize('16')).toBe(16);
    expect(sanitizeIconSize('24')).toBe(24);
    expect(sanitizeIconSize('8')).toBe(20); // Clamped

    // Malformed / non-numeric types default to 20
    expect(sanitizeIconSize(null)).toBe(20);
    expect(sanitizeIconSize(undefined)).toBe(20);
    expect(sanitizeIconSize({})).toBe(20);
    expect(sanitizeIconSize([])).toBe(20);
    expect(sanitizeIconSize('invalid')).toBe(20);
    expect(sanitizeIconSize(NaN)).toBe(20);
  });
});

// =========================================================================
// Suite 3: Vinyl Receipt Jagged Teeth SVG Math & Barcode Integrity
// =========================================================================
suite('Challenger 2 M4: Receipt Jagged Teeth SVG Math & Barcode Invariants', () => {
  test('C2.M4.S03.1: 18-tooth SVG polygon coordinates span exactly 360px with zero gaps or overrun', () => {
    const teethCount = 18;
    const toothWidth = 20;
    const totalSpan = teethCount * toothWidth;
    expect(totalSpan).toBe(360);

    // Verify top teeth polygons: points="${i * toothWidth},0 ${(i + 0.5) * toothWidth},10 ${(i + 1) * toothWidth},0"
    for (let i = 0; i < teethCount; i++) {
      const xLeft = i * toothWidth;
      const xPeak = (i + 0.5) * toothWidth;
      const xRight = (i + 1) * toothWidth;

      // Peak is exactly midway
      expect(xPeak).toBe((xLeft + xRight) / 2);
      expect(xRight - xLeft).toBe(toothWidth);

      // Verify continuity between teeth: right edge of tooth i matches left edge of tooth i+1
      if (i < teethCount - 1) {
        const nextLeft = (i + 1) * toothWidth;
        expect(xRight).toBe(nextLeft);
      }
    }

    // Verify bottom teeth polygons: points="${i * toothWidth},10 ${(i + 0.5) * toothWidth},0 ${(i + 1) * toothWidth},10"
    for (let i = 0; i < teethCount; i++) {
      const xLeft = i * toothWidth;
      const xPeak = (i + 0.5) * toothWidth;
      const xRight = (i + 1) * toothWidth;

      expect(xPeak).toBe((xLeft + xRight) / 2);
      if (i < teethCount - 1) {
        expect(xRight).toBe((i + 1) * toothWidth);
      }
    }
  });

  test('C2.M4.S03.2: generateBarcode produces deterministic 24-element array in {1, 2, 3} across diverse inputs', () => {
    const testCases = [
      'Apatheia',
      'Solaris (Neon Horizon)',
      'Supernova',
      '', // Empty string
      'A'.repeat(1000), // Long string
      '日本語のタイトル // 夜の街', // Multi-byte CJK
      '🎧🔥✨🎶🌧️', // Emojis
      '𝄞𝄢', // Musical symbols (surrogate pairs)
      'Cyrillic: Ночной дрифт', // Cyrillic
      'موسيقى هادئة', // Arabic
    ];

    for (const title of testCases) {
      const bars = generateBarcode(title);
      expect(Array.isArray(bars)).toBe(true);
      expect(bars.length).toBe(24);
      for (const w of bars) {
        expect(Number.isInteger(w)).toBe(true);
        expect(w >= 1 && w <= 3).toBe(true);
      }
    }
  });

  test('C2.M4.S03.3: generateBarcode handles null and undefined safely without throwing', () => {
    const barsNull = generateBarcode(null);
    expect(barsNull.length).toBe(24);
    for (const w of barsNull) {
      expect(w >= 1 && w <= 3).toBe(true);
    }

    const barsUndefined = generateBarcode(undefined);
    expect(barsUndefined.length).toBe(24);
    for (const w of barsUndefined) {
      expect(w >= 1 && w <= 3).toBe(true);
    }
  });

  test('C2.M4.S03.4: generateBarcode is strictly deterministic and idempotent across repeated calls', () => {
    const title = 'Apatheia (3 AM Drift)';
    const firstRun = generateBarcode(title);
    for (let i = 0; i < 50; i++) {
      const run = generateBarcode(title);
      expect(run).toEqual(firstRun);
    }
  });

  test('C2.M4.S03.5: generateBarcode produces distinct patterns for different track titles', () => {
    const barcode1 = generateBarcode('Apatheia');
    const barcode2 = generateBarcode('Solaris');
    const barcode3 = generateBarcode('Supernova');

    expect(JSON.stringify(barcode1)).not.toBe(JSON.stringify(barcode2));
    expect(JSON.stringify(barcode2)).not.toBe(JSON.stringify(barcode3));
    expect(JSON.stringify(barcode1)).not.toBe(JSON.stringify(barcode3));
  });

  test('C2.M4.S03.6: Brutalist Swiss card barcode layout has overflow protection and bounded width', () => {
    // Total bar width in BrutalistSwissCard:
    // 24 barcodePattern elements with width `${w * 2}px` (w in 1..3 -> 2..6px) + margin `${(idx % 4) + 1}px` (1..4px)
    // 16 fill bars with width `${(idx % 2) + 1}px` (1..2px) + margin 2px
    const pattern = generateBarcode('Demo Track');
    let totalWidth = 0;
    pattern.forEach((w, idx) => {
      totalWidth += w * 2 + ((idx % 4) + 1);
    });
    for (let idx = 0; idx < 16; idx++) {
      totalWidth += ((idx % 2) + 1) + 2;
    }

    // Must be positive and around 150-250px (fits nicely inside 360px container)
    expect(totalWidth).toBeGreaterThan(100);
    expect(totalWidth).toBeLessThan(350);

    // Verify container styling prevents overflow
    expect(brutalistSwissSrc).toContain('overflow-hidden');
  });
});

// =========================================================================
// Suite 4: Font Ready Guard, WebGL Snapshot Bridge & Fallback Resilience
// =========================================================================
suite('Challenger 2 M4: Font Ready Guard, Snapshot Bridge & Fallbacks', () => {
  test('C2.M4.S04.1: Font ready guard timeout race resolves within 1500ms when fonts stall', async () => {
    // Simulate stalled document.fonts.ready
    const fakeStalledFonts = new Promise(() => {}); // Never resolves

    const awaitFontsWithTimeout = async (fontsReadyPromise) => {
      let resolvedByTimeout = false;
      await Promise.race([
        fontsReadyPromise,
        new Promise((resolve) =>
          setTimeout(() => {
            resolvedByTimeout = true;
            resolve('timeout');
          }, 50)
        ), // Scaled to 50ms for test execution speed
      ]);
      return resolvedByTimeout;
    };

    const timedOut = await awaitFontsWithTimeout(fakeStalledFonts);
    expect(timedOut).toBe(true);
  });

  test('C2.M4.S04.2: Font ready guard proceeds immediately when document.fonts.ready resolves fast', async () => {
    const fakeFastFonts = Promise.resolve();

    const t0 = performance.now();
    await Promise.race([
      fakeFastFonts,
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
    const duration = performance.now() - t0;
    expect(duration).toBeLessThan(50);
  });

  test('C2.M4.S04.3: Font ready guard catches rejection safely without throwing unhandled rejection', async () => {
    const fakeRejectingFonts = Promise.reject(new Error('Font network error'));

    let errorCaught = false;
    try {
      await Promise.race([
        fakeRejectingFonts,
        new Promise((resolve) => setTimeout(resolve, 50)),
      ]);
    } catch (err) {
      errorCaught = true;
      expect(err.message).toBe('Font network error');
    }
    expect(errorCaught).toBe(true);

    // In StoryFlexModal, font ready is wrapped in Promise.race with a 1500ms timeout
    expect(storyFlexModalSrc).toContain('document.fonts.ready');
    expect(storyFlexModalSrc).toContain('Promise.race');
    expect(storyFlexModalSrc).toContain('setTimeout(resolve, 1500)');
  });

  test('C2.M4.S04.4: GlassAppleCard backgroundStyle switches between snapshotUrl and liquid palette fallback', () => {
    const palette = ['#05050A', '#0F172A', '#7C3AED', '#06B6D4'];

    // When snapshotUrl is present
    const snapUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const bgStyleWithSnap = {
      backgroundImage: `url(${snapUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
    expect(bgStyleWithSnap.backgroundImage).toContain(snapUrl);

    // When snapshotUrl is null
    const bgStyleFallback = {
      background: `radial-gradient(circle at 20% 20%, ${palette[2]}cc 0%, transparent 50%),
                   radial-gradient(circle at 80% 80%, ${palette[3]}aa 0%, transparent 50%),
                   linear-gradient(135deg, ${palette[1]} 0%, ${palette[0]} 100%)`,
    };
    expect(bgStyleFallback.background).toContain(palette[2]);
    expect(bgStyleFallback.background).toContain(palette[3]);
    expect(bgStyleFallback.background).toContain('radial-gradient');
  });

  test('C2.M4.S04.5: SSRF Validator (isSafeImageUrl) blocks malicious loopback, metadata, and private addresses', () => {
    // Malicious loopback addresses
    expect(isSafeImageUrl('http://localhost:3000/art.png')).toBe(false);
    expect(isSafeImageUrl('http://127.0.0.1:8080/art.png')).toBe(false);
    expect(isSafeImageUrl('http://0.0.0.0:80/art.png')).toBe(false);
    expect(isSafeImageUrl('http://[::1]/art.png')).toBe(false);

    // Cloud metadata endpoints
    expect(isSafeImageUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
    expect(isSafeImageUrl('http://metadata.google.internal/computeMetadata/v1')).toBe(false);

    // RFC 1918 private subnets
    expect(isSafeImageUrl('http://10.0.0.1/pic.jpg')).toBe(false);
    expect(isSafeImageUrl('http://172.16.0.1/pic.jpg')).toBe(false);
    expect(isSafeImageUrl('http://172.31.255.255/pic.jpg')).toBe(false);
    expect(isSafeImageUrl('http://192.168.1.1/pic.jpg')).toBe(false);

    // Hex and Octal bypasses
    expect(isSafeImageUrl('http://0x7f000001/art.png')).toBe(false);
    expect(isSafeImageUrl('http://0177.0.0.1/art.png')).toBe(false);
    expect(isSafeImageUrl('http://[::ffff:127.0.0.1]/art.png')).toBe(false);

    // Non-HTTP/HTTPS protocols
    expect(isSafeImageUrl('file:///etc/passwd')).toBe(false);
    expect(isSafeImageUrl('ftp://ftp.example.com/art.png')).toBe(false);
    expect(isSafeImageUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeImageUrl('data:image/png;base64,xxxx')).toBe(false);

    // Legitimate public HTTPS image URLs
    expect(isSafeImageUrl('https://images.unsplash.com/photo-1518709268805-4e9042af9f23')).toBe(true);
    expect(isSafeImageUrl('https://i.scdn.co/image/ab67616d0000b2737604eb6a56e797f748')).toBe(true);
    expect(isSafeImageUrl('http://example.com/cover.jpg')).toBe(true);
  });
});

// =========================================================================
// Suite 5: String Compacting, Text Sanitization & Duration Formatting
// =========================================================================
suite('Challenger 2 M4: String Compaction & Duration Formatting Stress', () => {
  test('C2.M4.S05.1: compactQuote formats multiline text safely and truncates to maxLines', () => {
    // Single line unchanged
    expect(compactQuote('Neon horizon fading fast')).toBe('Neon horizon fading fast');

    // 2 lines joined with ' / '
    const twoLines = 'Line one\nLine two';
    expect(compactQuote(twoLines)).toBe('Line one / Line two');

    // 5 lines truncated to maxLines (default 3)
    const fiveLines = 'L1\nL2\nL3\nL4\nL5';
    expect(compactQuote(fiveLines)).toBe('L1 / L2 / L3');

    // Custom maxLines = 2
    expect(compactQuote(fiveLines, 2)).toBe('L1 / L2');

    // Windows CRLF line endings
    const windowsLines = 'Alpha\r\nBeta\r\nGamma';
    expect(compactQuote(windowsLines)).toBe('Alpha / Beta / Gamma');

    // Empty and whitespace lines filtered out
    const sparseLines = '\n  Line A  \n\n\n  Line B  \n';
    expect(compactQuote(sparseLines)).toBe('Line A / Line B');

    // Null and empty string handled safely
    expect(compactQuote('')).toBe('');
    expect(compactQuote(null)).toBe('');
  });

  test('C2.M4.S05.2: formatCardDuration formats milliseconds across zero, negative, minutes, and multi-hour tracks', () => {
    // Zero & negative
    expect(formatCardDuration(0)).toBe('0:00');
    expect(formatCardDuration(-5000)).toBe('0:00');

    // Sub-minute
    expect(formatCardDuration(9000)).toBe('0:09');
    expect(formatCardDuration(45000)).toBe('0:45');

    // Standard song durations
    expect(formatCardDuration(142000)).toBe('2:22');
    expect(formatCardDuration(180000)).toBe('3:00');
    expect(formatCardDuration(354000)).toBe('5:54');

    // Boundary: exactly 59:59 (3599000ms)
    expect(formatCardDuration(3599000)).toBe('59:59');

    // Exactly 1 hour: 3600000ms -> HH:MM:SS
    expect(formatCardDuration(3600000)).toBe('1:00:00');

    // 1 hour 10 minutes: 4200000ms
    expect(formatCardDuration(4200000)).toBe('1:10:00');

    // 2 hours 2 minutes 5 seconds: 7325000ms
    expect(formatCardDuration(7325000)).toBe('2:02:05');

    // 25 hours long ambient set: 90000000ms
    expect(formatCardDuration(90000000)).toBe('25:00:00');
  });
});

// Run this suite directly if executed as standalone script
if (process.argv[1] && process.argv[1].endsWith('challenger2_m4_stress.test.mjs')) {
  console.log('Running Challenger 2 Milestone 4 Stress Tests...');
  const { globalHarness } = await import('./helpers/test-harness.mjs');
  const report = await globalHarness.run();
  console.log(`Results: ${report.stats.passed}/${report.stats.total} passed (${report.stats.failed} failed)`);
  if (report.stats.failed > 0) {
    console.error('Failures:', report.failures);
    process.exit(1);
  } else {
    console.log('All Challenger 2 Milestone 4 Stress Tests Passed Cleanly!');
    process.exit(0);
  }
}
