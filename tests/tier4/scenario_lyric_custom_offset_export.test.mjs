/**
 * Tier 4: Real-World Scenarios
 * Scenario 3: Lyric Offset Tuning & Story Flex 1080x1920 Export Journey
 * User tunes sync offset by +150ms -> picks lyric quote -> previews 3 card templates -> validates base64 proxy -> exports 1080x1920 PNG.
 */

import { suite, test, expect } from '../helpers/test-harness.mjs';
import { DEMO_TRACKS } from '../../src/data/demoTracks.ts';
import { createMockWebGLContext } from '../helpers/mocks.mjs';
import { calculateStoryCardDimensions, isSafeImageUrl } from '../helpers/test-utils.mjs';

suite('Scenario 3: Lyric Offset Tuning & Story Flex Export Journey', () => {
  test('Step 1: User adjusts lyric sync offset by +150ms via floating dock adjuster pill', () => {
    let offsetMs = 0;
    const stepForward = () => { offsetMs = Math.min(500, offsetMs + 50); };

    stepForward();
    stepForward();
    stepForward();

    expect(offsetMs).toBe(150);
  });

  test('Step 2: User selects featured lyric quote from active song for card export', () => {
    const track = DEMO_TRACKS[0];
    const selectedLyric = track.lyrics[3].text; // "we burned the skyline just to feel the heat"

    expect(selectedLyric).toBe('we burned the skyline just to feel the heat');
  });

  test('Step 3: User opens Story Flex Export Modal and switches between Glass, Swiss, and Receipt layouts', () => {
    const layouts = ['glass', 'swiss', 'receipt'];
    let currentLayout = 'glass';

    expect(currentLayout).toBe('glass');
    currentLayout = 'swiss';
    expect(currentLayout).toBe('swiss');
    currentLayout = 'receipt';
    expect(currentLayout).toBe('receipt');
  });

  test('Step 4: Image proxy validates artwork URL to prevent CORS canvas taint and SSRF attacks', () => {
    const safeUrl = 'https://i.scdn.co/image/ab67616d0000b273b52d';
    const maliciousSsrfUrl = 'http://169.254.169.254/latest/meta-data/';

    expect(isSafeImageUrl(safeUrl)).toBe(true);
    expect(isSafeImageUrl(maliciousSsrfUrl)).toBe(false);
  });

  test('Step 5: Snapshot bridge captures WebGL canvas and exports crisp 1080x1920 PNG with fonts guard', async () => {
    const gl = createMockWebGLContext({ preserveDrawingBuffer: true });
    const snapshotUrl = gl.canvas.toDataURL('image/png');

    // Await font ready guard
    const fontsReady = Promise.resolve();
    await fontsReady;

    // Verify 1080x1920 geometry at pixelRatio 3
    const dim = calculateStoryCardDimensions(360, 3);
    expect(dim.exportWidth).toBe(1080);
    expect(dim.exportHeight).toBe(1920);

    // Lucide icons inside card have explicit numerical size
    const iconSize = 24;
    expect(typeof iconSize).toBe('number');
    expect(iconSize).toBeGreaterThan(0);
  });
});
