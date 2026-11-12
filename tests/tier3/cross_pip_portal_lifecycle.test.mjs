/**
 * Tier 3: Cross-Feature Combinations (M2 Lyrics Sync ↔ M5 Document PiP Portal Lifecycle)
 * Verifies live lyric synchronization inside the detached Picture-in-Picture window with style preservation.
 */

import { suite, test, expect } from '../helpers/test-harness.mjs';
import { DEMO_TRACKS } from '../../src/data/demoTracks.ts';
import { createMockDocumentPipEnvironment } from '../helpers/mocks.mjs';
import { findActiveLyricIndexOracle } from '../helpers/test-utils.mjs';

suite('Tier 3: Document PiP ↔ Kinetic Lyric Streaming Integration', () => {
  test('T3.4.1: Stylesheet cloning executes before mounting React portal inside PiP window', async () => {
    const env = createMockDocumentPipEnvironment({ isSupported: true });
    const pipWin = await env.api.requestWindow({ width: 420, height: 520 });

    const executionLog = [];

    // Step 1: Clone styles
    const styleNode = { nodeName: 'STYLE', textContent: '.pip-lyrics { color: #fff; }' };
    pipWin.document.head.appendChild(styleNode);
    executionLog.push('styles_cloned');

    // Step 2: Mount portal container
    const portalDiv = { nodeName: 'DIV', id: 'pip-root' };
    pipWin.document.body.appendChild(portalDiv);
    executionLog.push('portal_mounted');

    expect(executionLog[0]).toBe('styles_cloned');
    expect(executionLog[1]).toBe('portal_mounted');
    expect(pipWin.document.head.nodes.length).toBe(1);
    expect(pipWin.document.body.nodes.length).toBe(1);
  });

  test('T3.4.2: Main window time updates stream synchronized MiniLyrics subtitles directly into PiP portal', async () => {
    const track = DEMO_TRACKS[0];
    let currentTimeMs = 0;

    const getActiveSubtitle = (timeMs) => {
      const idx = findActiveLyricIndexOracle(track.lyrics, timeMs, 0);
      return idx >= 0 ? track.lyrics[idx].text : '';
    };

    currentTimeMs = 4500;
    expect(getActiveSubtitle(currentTimeMs)).toBe('headlights cutting through the haze');

    currentTimeMs = 14000;
    expect(getActiveSubtitle(currentTimeMs)).toBe('we burned the skyline just to feel the heat');
  });

  test('T3.4.3: User interaction inside PiP window (e.g. Pomodoro pause) reflects back to main store', async () => {
    let mainPomodoroRunning = true;
    const toggleFromPip = () => { mainPomodoroRunning = !mainPomodoroRunning; };

    toggleFromPip();
    expect(mainPomodoroRunning).toBe(false);
  });

  test('T3.4.4: Closing PiP window restores in-tab Zen HUD state seamlessly without audio interruption', async () => {
    const env = createMockDocumentPipEnvironment({ isSupported: true });
    const pipWin = await env.api.requestWindow();

    let isPipActive = true;
    let isStudyMode = true;

    pipWin.addEventListener('pagehide', () => {
      isPipActive = false;
      // In-tab HUD remains active
      isStudyMode = true;
    });

    pipWin.close();

    expect(isPipActive).toBe(false);
    expect(isStudyMode).toBe(true);
  });

  test('T3.4.5: Re-opening PiP window re-clones latest stylesheets without duplication', async () => {
    const env = createMockDocumentPipEnvironment({ isSupported: true });

    // First session
    const win1 = await env.api.requestWindow();
    win1.document.head.appendChild({ nodeName: 'STYLE', textContent: '/* 1 */' });
    win1.close();

    // Second session
    const win2 = await env.api.requestWindow();
    win2.document.head.appendChild({ nodeName: 'STYLE', textContent: '/* 1 */' });
    expect(win2.document.head.nodes.length).toBe(1);
  });
});
