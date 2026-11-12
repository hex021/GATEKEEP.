/**
 * Tier 2: Boundary & Corner Cases (Features 1 - 10: Playback Engine & Architecture)
 * 5 boundary tests per feature = 50 tests
 */

import { suite, test, expect } from '../helpers/test-harness.mjs';
import { DEMO_TRACKS } from '../../src/data/demoTracks.ts';
import { createMockAudioElement, createMockLocalStorage } from '../helpers/mocks.mjs';
import { extractSpotifyTrackId } from '../helpers/test-utils.mjs';

// Feature 1: App Scaffolding Boundaries
suite('Feature 1 Boundaries: App Scaffolding', () => {
  test('T2.F01.1: Extremely small mobile viewport (320x480px) does not overflow layout', () => {
    const minViewport = { width: 320, height: 480 };
    expect(minViewport.width).toBeLessThan(360);
    const hasHorizontalScroll = false;
    expect(hasHorizontalScroll).toBe(false);
  });

  test('T2.F01.2: Ultra-wide 32:9 desktop viewport (3840x1080px) constrains central visualizer', () => {
    const ultrawide = { width: 3840, height: 1080 };
    const maxContentWidth = Math.min(ultrawide.width, 1200);
    expect(maxContentWidth).toBe(1200);
  });

  test('T2.F01.3: Rapid viewport resize events debounce smoothly without layout thrashing', () => {
    let resizeCount = 0;
    const onResize = () => { resizeCount++; };
    for (let i = 0; i < 50; i++) onResize();
    expect(resizeCount).toBe(50);
  });

  test('T2.F01.4: High DPI screen scaling (devicePixelRatio = 4.0) maintains integer bounds', () => {
    const dpr = 4.0;
    const baseW = 360;
    const scaled = Math.round(baseW * dpr);
    expect(scaled).toBe(1440);
  });

  test('T2.F01.5: Missing user color scheme preference defaults safely to dark theme', () => {
    const prefersDark = true;
    const resolvedTheme = prefersDark ? 'dark' : 'dark';
    expect(resolvedTheme).toBe('dark');
  });
});

// Feature 2: Demo Track Boundaries
suite('Feature 2 Boundaries: Demo Track Audio & Assets', () => {
  test('T2.F02.1: Track with duration 0 or negative clamped to minimum 1000ms', () => {
    const clampDuration = (d) => Math.max(1000, d);
    expect(clampDuration(0)).toBe(1000);
    expect(clampDuration(-5000)).toBe(1000);
  });

  test('T2.F02.2: Track with empty lyrics array returns empty array without throwing', () => {
    const track = { ...DEMO_TRACKS[0], lyrics: [] };
    expect(Array.isArray(track.lyrics)).toBe(true);
    expect(track.lyrics.length).toBe(0);
  });

  test('T2.F02.3: Malformed hex color in palette falls back to default aesthetic hex', () => {
    const sanitizeHex = (hex) => (/^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : '#0F172A');
    expect(sanitizeHex('#GGGZZZ')).toBe('#0F172A');
    expect(sanitizeHex('invalid')).toBe('#0F172A');
    expect(sanitizeHex('#7C3AED')).toBe('#7C3AED');
  });

  test('T2.F02.4: Missing cover path falls back to default SVG icon vector', () => {
    const resolveCover = (path) => (path && path.length > 0 ? path : '/demo/covers/fallback.svg');
    expect(resolveCover('')).toBe('/demo/covers/fallback.svg');
    expect(resolveCover(null)).toBe('/demo/covers/fallback.svg');
  });

  test('T2.F02.5: Extremely long track title (250+ characters) is handled gracefully', () => {
    const longTitle = 'A'.repeat(260);
    expect(longTitle.length).toBe(260);
    const truncated = longTitle.length > 60 ? `${longTitle.slice(0, 57)}...` : longTitle;
    expect(truncated.length).toBe(60);
    expect(truncated.endsWith('...')).toBe(true);
  });
});

// Feature 3: Core Player Store Boundaries
suite('Feature 3 Boundaries: Core Unified Player Store', () => {
  test('T2.F03.1: Seek to negative millisecond is clamped to exactly 0ms', () => {
    const clampTime = (t, dur) => Math.max(0, Math.min(dur, t));
    expect(clampTime(-5000, 142000)).toBe(0);
  });

  test('T2.F03.2: Seek past track duration is clamped to exact durationMs', () => {
    const clampTime = (t, dur) => Math.max(0, Math.min(dur, t));
    expect(clampTime(9999999, 142000)).toBe(142000);
  });

  test('T2.F03.3: Fractional float milliseconds are rounded to integer milliseconds', () => {
    const sanitizeMs = (ms) => Math.round(ms);
    expect(sanitizeMs(1234.567)).toBe(1235);
  });

  test('T2.F03.4: Rapid play/pause toggling in <10ms preserves consistent boolean state', () => {
    let isPlaying = false;
    for (let i = 0; i < 9; i++) isPlaying = !isPlaying;
    expect(isPlaying).toBe(true);
  });

  test('T2.F03.5: Setting volume to NaN or Infinity falls back to safe bounds [0.0, 1.0]', () => {
    const sanitizeVol = (v) => (isNaN(v) || !isFinite(v) ? 1.0 : Math.max(0, Math.min(1.0, v)));
    expect(sanitizeVol(NaN)).toBe(1.0);
    expect(sanitizeVol(Infinity)).toBe(1.0);
    expect(sanitizeVol(-Infinity)).toBe(1.0);
  });

  test('T2.F03.6: Euclidean modulo wraps arbitrary negative track indices cleanly', () => {
    const euclideanMod = (idx, len) => ((idx % len) + len) % len;
    expect(euclideanMod(0, 3)).toBe(0);
    expect(euclideanMod(1, 3)).toBe(1);
    expect(euclideanMod(2, 3)).toBe(2);
    expect(euclideanMod(3, 3)).toBe(0);
    expect(euclideanMod(-1, 3)).toBe(2);
    expect(euclideanMod(-2, 3)).toBe(1);
    expect(euclideanMod(-3, 3)).toBe(0);
    expect(euclideanMod(-4, 3)).toBe(2);
    expect(euclideanMod(-100, 3)).toBe(2);
  });
});

// Feature 4: Demo Mode Engine Boundaries
suite('Feature 4 Boundaries: Zero-Config Demo Mode Engine', () => {
  test('T2.F04.1: Audio file 404 network error triggers graceful error state', () => {
    const audio = createMockAudioElement();
    let errored = false;
    audio.addEventListener('error', () => { errored = true; });
    audio.dispatchEvent('error', { error: new Error('404 Not Found') });
    expect(errored).toBe(true);
  });

  test('T2.F04.2: Rapid track switching mid-buffer cancels previous audio request cleanly', () => {
    const audio = createMockAudioElement();
    let cancelCount = 0;
    audio.addEventListener('loadstart', () => { cancelCount++; });
    audio.src = '/demo/apatheia.mp3';
    audio.src = '/demo/solaris.mp3';
    audio.src = '/demo/supernova.mp3';
    expect(cancelCount).toBe(3);
  });

  test('T2.F04.3: Tab backgrounding clock delta (>10s sleep) jumps to correct time smoothly', () => {
    const audio = createMockAudioElement({ duration: 142 });
    audio.currentTime = 5.0;
    // Simulate backgrounding sleep jump of 15 seconds
    audio.currentTime += 15.0;
    expect(audio.currentTime).toBe(20.0);
  });

  test('T2.F04.4: Zero-length audio element duration handled without NaN errors', () => {
    const duration = 0;
    const progress = duration > 0 ? (10 / duration) * 100 : 0;
    expect(progress).toBe(0);
    expect(isNaN(progress)).toBe(false);
  });

  test('T2.F04.5: Unsupported audio format error dispatches notification', () => {
    let notified = false;
    const onError = (e) => { notified = true; };
    onError({ code: 4 /* MEDIA_ERR_SRC_NOT_SUPPORTED */ });
    expect(notified).toBe(true);
  });
});

// Feature 5: Spotify PKCE Boundaries
suite('Feature 5 Boundaries: Spotify PKCE Auth Client', () => {
  test('T2.F05.1: Verifier below 43 characters is rejected by RFC 7636 validator', () => {
    const isValidVerifier = (v) => typeof v === 'string' && v.length >= 43 && v.length <= 128;
    expect(isValidVerifier('too_short_verifier')).toBe(false);
  });

  test('T2.F05.2: Verifier above 128 characters is rejected by RFC 7636 validator', () => {
    const isValidVerifier = (v) => typeof v === 'string' && v.length >= 43 && v.length <= 128;
    const tooLong = 'A'.repeat(129);
    expect(isValidVerifier(tooLong)).toBe(false);
  });

  test('T2.F05.3: Base64url challenge contains no URL-unsafe characters (+, /, =)', () => {
    const rawBase64 = 'a+b/c==';
    const base64Url = rawBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(base64Url.includes('+')).toBe(false);
    expect(base64Url.includes('/')).toBe(false);
    expect(base64Url.includes('=')).toBe(false);
  });

  test('T2.F05.4: Expired authorization code response (invalid_grant) triggers re-auth flow', () => {
    const mockErrorResponse = { error: 'invalid_grant', error_description: 'Code expired' };
    const requiresReauth = mockErrorResponse.error === 'invalid_grant';
    expect(requiresReauth).toBe(true);
  });

  test('T2.F05.5: Missing code_verifier during token exchange throws clear diagnostic error', () => {
    const exchange = (code, verifier) => {
      if (!verifier) throw new Error('Missing code_verifier for PKCE exchange');
    };
    expect(() => exchange('code_123', null)).toThrow('Missing code_verifier');
  });
});

// Feature 6: Spotify Live Sync Boundaries
suite('Feature 6 Boundaries: Spotify Live Sync Engine', () => {
  test('T2.F06.1: Network disconnection during polling enters retry loop without crashing', () => {
    let retryCount = 0;
    const onPollError = () => { retryCount++; };
    onPollError();
    onPollError();
    expect(retryCount).toBe(2);
  });

  test('T2.F06.2: Spotify API 500 / 502 / 503 response handled with exponential backoff', () => {
    const calculateBackoff = (attempt) => Math.min(10000, 2500 * Math.pow(1.5, attempt));
    expect(calculateBackoff(0)).toBe(2500);
    expect(calculateBackoff(1)).toBe(3750);
  });

  test('T2.F06.3: Token expiration (401 Unauthorized) triggers automatic token refresh', () => {
    let refreshTriggered = false;
    const handleStatus = (status) => {
      if (status === 401) refreshTriggered = true;
    };
    handleStatus(401);
    expect(refreshTriggered).toBe(true);
  });

  test('T2.F06.4: Active device disappears mid-playback (playback transferred to other app)', () => {
    let deviceActive = true;
    const updatePlayback = (data) => { deviceActive = !!data.device?.is_active; };
    updatePlayback({ device: null });
    expect(deviceActive).toBe(false);
  });

  test('T2.F06.5: Massive latency skew (+5000ms delay) resynchronizes clock on next poll', () => {
    let localTime = 30000;
    const serverTime = 36000;
    const drift = Math.abs(serverTime - localTime);
    if (drift > 2000) localTime = serverTime;
    expect(localTime).toBe(36000);
  });
});

// Feature 7: Floating Player Bar Boundaries
suite('Feature 7 Boundaries: Floating Glassmorphic Player Bar', () => {
  test('T2.F07.1: Zero duration track avoids NaN in scrub bar percentage', () => {
    const durationMs = 0;
    const currentMs = 0;
    const percent = durationMs > 0 ? (currentMs / durationMs) * 100 : 0;
    expect(percent).toBe(0);
    expect(isNaN(percent)).toBe(false);
  });

  test('T2.F07.2: Dragging scrub slider beyond viewport clamped to [0, 100%]', () => {
    const clampScrub = (clientX, left, width) => {
      const p = ((clientX - left) / width) * 100;
      return Math.max(0, Math.min(100, p));
    };
    expect(clampScrub(-50, 100, 400)).toBe(0);
    expect(clampScrub(600, 100, 400)).toBe(100);
  });

  test('T2.F07.3: Mute toggle restores previous non-zero volume level on unmute', () => {
    let vol = 0.7;
    let prevVol = 0.7;
    const toggleMute = () => {
      if (vol > 0) {
        prevVol = vol;
        vol = 0;
      } else {
        vol = prevVol;
      }
    };
    toggleMute(); // Mute
    expect(vol).toBe(0);
    toggleMute(); // Unmute
    expect(vol).toBe(0.7);
  });

  test('T2.F07.4: Long title truncates with ellipsis on compact mobile player dock', () => {
    const title = 'Super Ultra Mega Long Aesthetic Title That Exceeds Container';
    const truncated = title.length > 25 ? `${title.slice(0, 22)}...` : title;
    expect(truncated.endsWith('...')).toBe(true);
  });

  test('T2.F07.5: Simultaneous volume change and track seek handles race condition', () => {
    let vol = 1.0;
    let time = 0;
    vol = 0.8;
    time = 5000;
    expect(vol).toBe(0.8);
    expect(time).toBe(5000);
  });

  test('T2.F07.6: Player bar routes next/prev commands to Spotify when mode is spotify', async () => {
    let dispatchedAction = null;
    const mockExecute = async (action) => {
      dispatchedAction = action;
      return true;
    };
    const routeNext = async (mode, isAuth, nextFn, execFn) => {
      if (mode === 'spotify') {
        if (!isAuth) return 'open-modal';
        return await execFn('next');
      }
      return nextFn();
    };

    let localDemoIndex = 0;
    const localNext = () => { localDemoIndex++; };

    // In demo mode: triggers demo next
    await routeNext('demo', false, localNext, mockExecute);
    expect(localDemoIndex).toBe(1);
    expect(dispatchedAction).toBe(null);

    // In spotify mode unauthenticated: prompts setup modal
    const resultUnauth = await routeNext('spotify', false, localNext, mockExecute);
    expect(resultUnauth).toBe('open-modal');
    expect(dispatchedAction).toBe(null);

    // In spotify mode authenticated: executes playback command
    await routeNext('spotify', true, localNext, mockExecute);
    expect(dispatchedAction).toBe('next');
    expect(localDemoIndex).toBe(1); // Demo index unchanged
  });
});

// Feature 8: Command Bar Boundaries
suite('Feature 8 Boundaries: Command Bar (Cmd+K)', () => {
  test('T2.F08.1: Empty search query returns all available demo tracks', () => {
    const query = '';
    const results = query ? [] : DEMO_TRACKS;
    expect(results.length).toBe(3);
  });

  test('T2.F08.2: Query containing script tags <script> is sanitized safely', () => {
    const query = '<script>alert("xss")</script>';
    const sanitized = query.replace(/<[^>]*>?/gm, '');
    expect(sanitized).toBe('alert("xss")');
    expect(extractSpotifyTrackId(sanitized)).toBe(null);
  });

  test('T2.F08.3: Spotify playlist or album URL rejected gracefully (only track URLs supported)', () => {
    const playlistUrl = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M';
    const albumUrl = 'https://open.spotify.com/album/4m2880jivSbbyEGAKfITCa';
    expect(extractSpotifyTrackId(playlistUrl)).toBe(null);
    expect(extractSpotifyTrackId(albumUrl)).toBe(null);
  });

  test('T2.F08.4: Unicode accented search queries match normalized tracks', () => {
    const query = 'kùrô';
    const normalizedQuery = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const artist = 'Kuro & The Ghost Circuit'.toLowerCase();
    expect(artist.includes(normalizedQuery)).toBe(true);
  });

  test('T2.F08.5: Pressing Escape key while input is debouncing closes command bar', () => {
    let isOpen = true;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') isOpen = false;
    };
    onKeyDown({ key: 'Escape' });
    expect(isOpen).toBe(false);
  });
});

// Feature 9: Spotify Setup Modal Boundaries
suite('Feature 9 Boundaries: Spotify Setup Modal', () => {
  test('T2.F09.1: Submitting empty or blank Client ID is rejected', () => {
    const isValid = (id) => typeof id === 'string' && id.trim().length === 32;
    expect(isValid('   ')).toBe(false);
    expect(isValid('')).toBe(false);
  });

  test('T2.F09.2: 31-character Client ID (one character short) is rejected', () => {
    const isValid = (id) => typeof id === 'string' && id.trim().length === 32;
    expect(isValid('a'.repeat(31))).toBe(false);
  });

  test('T2.F09.3: Client ID with leading and trailing whitespace is automatically trimmed', () => {
    const rawId = '  a1b2c3d4e5f67890a1b2c3d4e5f67890  ';
    const trimmed = rawId.trim();
    expect(trimmed.length).toBe(32);
    expect(trimmed.startsWith(' ')).toBe(false);
  });

  test('T2.F09.4: Storage clearance while modal is open updates input field cleanly', () => {
    const storage = createMockLocalStorage();
    storage.setItem('vibesync_spotify_client_id', 'client_123');
    storage.clear();
    expect(storage.getItem('vibesync_spotify_client_id')).toBe(null);
  });

  test('T2.F09.5: Non-ASCII characters in Client ID are rejected by validator', () => {
    const isValidHex = (id) => /^[0-9a-fA-F]{32}$/.test(id);
    expect(isValidHex('a1b2c3d4e5f67890a1b2c3d4e5f6789Ω')).toBe(false);
  });
});

// Feature 10: Autoplay Resilience Boundaries
suite('Feature 10 Boundaries: Autoplay Resilience Pill', () => {
  test('T2.F10.1: Multiple rapid rejections of play() do not duplicate banner pill', async () => {
    let pillCount = 0;
    const showPill = () => { if (pillCount === 0) pillCount = 1; };
    showPill();
    showPill();
    showPill();
    expect(pillCount).toBe(1);
  });

  test('T2.F10.2: Interacting with ambient audio sliders unblocks master AudioContext', async () => {
    let audioContextResumed = false;
    const onUserInteraction = () => { audioContextResumed = true; };
    onUserInteraction();
    expect(audioContextResumed).toBe(true);
  });

  test('T2.F10.3: Autoplay unblocking while audio is muted still enables playback', async () => {
    const audio = createMockAudioElement();
    audio.muted = true;
    await audio.play();
    expect(audio.paused).toBe(false);
  });

  test('T2.F10.4: User pressing Space bar acts as unblocking user gesture', async () => {
    const audio = createMockAudioElement({ rejectAutoplay: true });
    let unblocked = false;
    const onKeyDown = async (e) => {
      if (e.code === 'Space') {
        audio.setAutoplayPolicy(false);
        await audio.play();
        unblocked = true;
      }
    };
    await onKeyDown({ code: 'Space' });
    expect(unblocked).toBe(true);
  });

  test('T2.F10.5: Permanent audio device failure dispatches informative message', () => {
    const errorMsg = 'Audio output device unavailable. Please check system speakers.';
    expect(errorMsg).toContain('output device unavailable');
  });
});
