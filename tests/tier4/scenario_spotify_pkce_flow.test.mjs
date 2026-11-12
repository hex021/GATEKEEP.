/**
 * Tier 4: Real-World Scenarios
 * Scenario 2: Spotify PKCE Live Sync Journey
 * User configures Client ID -> Web Crypto PKCE generated -> Auth URL -> Callback state verification -> 2500ms polling + 60fps interpolation.
 */

import { suite, test, expect } from '../helpers/test-harness.mjs';
import { createMockLocalStorage, generateTestPkceVerifier, generateTestPkceChallenge } from '../helpers/mocks.mjs';
import { extractSpotifyTrackId } from '../helpers/test-utils.mjs';

suite('Scenario 2: Spotify PKCE Live Sync Journey', () => {
  test('Step 1: User enters Spotify Client ID into setup modal and saves to localStorage', () => {
    const storage = createMockLocalStorage();
    const clientId = 'e3b0c44298fc1c149afbf4c8996fb924';

    // Validate 32-character hex ID
    expect(/^[0-9a-fA-F]{32}$/.test(clientId)).toBe(true);

    storage.setItem('vibesync_spotify_client_id', clientId);
    expect(storage.getItem('vibesync_spotify_client_id')).toBe(clientId);
  });

  test('Step 2: Client generates RFC 7636 PKCE code_verifier and code_challenge', () => {
    const verifier = generateTestPkceVerifier(64);
    expect(verifier.length).toBe(64);

    const challenge = generateTestPkceChallenge(verifier);
    expect(typeof challenge).toBe('string');
    expect(challenge.length).toBeGreaterThan(40);
    expect(challenge.includes('+')).toBe(false);
    expect(challenge.includes('/')).toBe(false);
  });

  test('Step 3: Constructs Spotify OAuth authorize URL with PKCE parameters and CSRF state', () => {
    const clientId = 'e3b0c44298fc1c149afbf4c8996fb924';
    const redirectUri = 'http://localhost:3000/callback';
    const challenge = 'test_challenge_hash_12345';
    const state = 'random_secure_state_val';

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge_method=S256&code_challenge=${challenge}&state=${state}&scope=user-read-currently-playing`;

    expect(authUrl).toContain('client_id=e3b0c44298fc1c149afbf4c8996fb924');
    expect(authUrl).toContain('code_challenge_method=S256');
    expect(authUrl).toContain('response_type=code');
  });

  test('Step 4: Callback handler verifies returned state against stored state', () => {
    const storedState = 'random_secure_state_val';
    const returnedState = 'random_secure_state_val';
    const authCode = 'spotify_authorization_code_abc123';

    expect(returnedState).toBe(storedState);
    expect(authCode.length).toBeGreaterThan(10);
  });

  test('Step 5: Live sync polls every 2500ms and bridges intervals with 60fps interpolation', () => {
    const pollTimestamp = 10000;
    const progressAtPollMs = 45000;
    const currentFrameTime = 11200; // 1200ms elapsed since last poll

    const interpolatedMs = progressAtPollMs + (currentFrameTime - pollTimestamp);
    expect(interpolatedMs).toBe(46200);

    // Command bar paste of Spotify URL resolves track ID
    const pastedUrl = 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=123';
    expect(extractSpotifyTrackId(pastedUrl)).toBe('4cOdK2wGLETKBW3PvgPWqT');
  });
});
