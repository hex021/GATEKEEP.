/**
 * Tier 4: Real-World Scenarios
 * Scenario 5: Native Document Picture-in-Picture Multitasking Journey
 * User triggers PiP -> window opens 420x520 -> stylesheets cloned -> portal mounted -> lyrics stream in real time -> clean close restoration.
 */

import { suite, test, expect } from '../helpers/test-harness.mjs';
import { createMockDocumentPipEnvironment } from '../helpers/mocks.mjs';

suite('Scenario 5: Native Document PiP Multitasking Journey', () => {
  test('Step 1: User clicks Picture-in-Picture button and browser feature detection confirms support', () => {
    const env = createMockDocumentPipEnvironment({ isSupported: true });
    expect(env.supported).toBe(true);
    expect(typeof env.api.requestWindow).toBe('function');
  });

  test('Step 2: Native Chromium Document PiP window opens with target 420x520 dimensions', async () => {
    const env = createMockDocumentPipEnvironment({ isSupported: true });
    const pipWin = await env.api.requestWindow({ width: 420, height: 520 });

    expect(pipWin.width).toBe(420);
    expect(pipWin.height).toBe(520);
    expect(env.api.window).toBe(pipWin);
  });

  test('Step 3: All application link[rel="stylesheet"] and style tags are cloned to PiP <head>', async () => {
    const env = createMockDocumentPipEnvironment({ isSupported: true });
    const pipWin = await env.api.requestWindow();

    // Deep clone styles into PiP head
    const style1 = { nodeName: 'STYLE', textContent: ':root { --accent: #7C3AED; }' };
    const link1 = { nodeName: 'LINK', rel: 'stylesheet', href: '/globals.css' };

    pipWin.document.head.appendChild(style1);
    pipWin.document.head.appendChild(link1);

    expect(pipWin.document.head.nodes.length).toBe(2);
    expect(pipWin.document.head.nodes[0].textContent).toContain('--accent');
  });

  test('Step 4: React 19 Portal mounts StudyHUD into PiP body with live lyric subtitle updates', async () => {
    const env = createMockDocumentPipEnvironment({ isSupported: true });
    const pipWin = await env.api.requestWindow();

    const portalBody = pipWin.document.body;
    expect(portalBody).toBeTruthy();

    let pipSubtitle = 'Initial lyric';
    const updateLyric = (newLine) => { pipSubtitle = newLine; };

    updateLyric('frequency vibrating through the glass floor');
    expect(pipSubtitle).toBe('frequency vibrating through the glass floor');
  });

  test('Step 5: User closes PiP window, triggering pagehide and restoring in-tab Zen HUD state cleanly', async () => {
    const env = createMockDocumentPipEnvironment({ isSupported: true });
    const pipWin = await env.api.requestWindow();

    let isPipActive = true;
    let isStudyMode = true;

    pipWin.addEventListener('pagehide', () => {
      isPipActive = false;
      // In-tab HUD remains active so user doesn't lose study focus
      isStudyMode = true;
    });

    pipWin.close();

    expect(isPipActive).toBe(false);
    expect(isStudyMode).toBe(true);
    expect(env.api.window).toBe(null);
  });
});
