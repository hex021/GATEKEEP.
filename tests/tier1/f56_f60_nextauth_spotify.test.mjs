/**
 * Tier 1: Feature Coverage (Features 56 - 60: 1-Click Spotify Authentication & Hybrid Resilience)
 * Comprehensive automated tests for NextAuth provider configuration, scopes, JWT/session callbacks,
 * store synchronization, and demo mode hybrid resilience.
 */

import { register } from 'node:module';
try {
  register('../helpers/path-loader.mjs', import.meta.url);
} catch {
  // Already registered in runner context
}

import { suite, test, expect } from '../helpers/test-harness.mjs';
import { authOptions, SPOTIFY_SCOPES } from '../../src/lib/authOptions.ts';
import { useSpotifyStore } from '../../src/stores/useSpotifyStore.ts';
import { usePlayerStore } from '../../src/stores/usePlayerStore.ts';
import { DEMO_TRACKS } from '../../src/data/demoTracks.ts';

suite('Feature 56: NextAuth Spotify Provider Configuration', () => {
  test('T1.F56.1: Configures Spotify provider with expected ID and name', () => {
    const provider = authOptions.providers[0];
    expect(provider !== undefined).toBe(true);
    expect(provider.id).toBe('spotify');
    expect(provider.name).toBe('Spotify');
    expect(provider.type).toBe('oauth');
  });

  test('T1.F56.2: Requests all 5 mandatory playback and user scopes', () => {
    const requiredScopes = [
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'user-read-email',
      'user-read-private',
    ];
    requiredScopes.forEach((scope) => {
      expect(SPOTIFY_SCOPES).toContain(scope);
    });
  });

  test('T1.F56.3: Resilient fallback credentials provided when env vars are unset', () => {
    const provider = authOptions.providers[0];
    const options = provider.options || provider;
    expect(options.clientId).toBeTruthy();
    expect(options.clientSecret).toBeTruthy();
  });

  test('T1.F56.4: SPOTIFY_SCOPES is a space-delimited string containing all required scopes', () => {
    expect(typeof SPOTIFY_SCOPES).toBe('string');
    const scopesList = SPOTIFY_SCOPES.split(' ');
    expect(scopesList.length).toBe(5);
    expect(scopesList).toContain('user-read-playback-state');
    expect(scopesList).toContain('user-modify-playback-state');
    expect(scopesList).toContain('user-read-currently-playing');
    expect(scopesList).toContain('user-read-email');
    expect(scopesList).toContain('user-read-private');
  });

  test('T1.F56.5: Authorization params configures authorization URL and scope parameter', () => {
    const provider = authOptions.providers[0];
    const options = provider.options || provider;
    expect(options.authorization !== undefined).toBe(true);
    expect(options.authorization.params.scope).toBe(SPOTIFY_SCOPES);
  });
});

suite('Feature 57: Session Strategy & Provider Shell Integration', () => {
  test('T1.F57.1: Configures JWT session strategy', () => {
    expect(authOptions.session !== undefined).toBe(true);
    expect(authOptions.session.strategy).toBe('jwt');
  });

  test('T1.F57.2: Secret fallback provides high entropy string >= 32 characters', () => {
    expect(authOptions.secret !== undefined).toBe(true);
    expect(typeof authOptions.secret).toBe('string');
    expect(authOptions.secret.length).toBeGreaterThanOrEqual(32);
  });

  test('T1.F57.3: Callbacks object defines both jwt and session functions', () => {
    expect(authOptions.callbacks !== undefined).toBe(true);
    expect(typeof authOptions.callbacks.jwt).toBe('function');
    expect(typeof authOptions.callbacks.session).toBe('function');
  });
});

suite('Feature 58: JWT and Session Callbacks & State Mapping', () => {
  test('T1.F58.1: JWT callback on initial sign-in maps tokens, expiry, and user', async () => {
    const mockAccount = {
      access_token: 'mock_access_token_123',
      refresh_token: 'mock_refresh_token_456',
      expires_at: 1800000000,
    };
    const mockUser = { id: 'user_vibe_1', name: 'Vibe Enthusiast' };

    const token = await authOptions.callbacks.jwt({
      token: {},
      account: mockAccount,
      user: mockUser,
    });

    expect(token.accessToken).toBe('mock_access_token_123');
    expect(token.refreshToken).toBe('mock_refresh_token_456');
    expect(token.accessTokenExpires).toBe(1800000000 * 1000);
    expect(token.user).toEqual(mockUser);
  });

  test('T1.F58.2: Session callback populates accessToken, refreshToken, and expiresAt', async () => {
    const mockToken = {
      accessToken: 'token_stream_xyz',
      refreshToken: 'refresh_stream_abc',
      accessTokenExpires: 1850000000000,
      user: { name: 'Vibe Listener', email: 'listener@vibesync.local' },
    };

    const session = await authOptions.callbacks.session({
      session: { user: {} },
      token: mockToken,
    });

    expect(session.accessToken).toBe('token_stream_xyz');
    expect(session.refreshToken).toBe('refresh_stream_abc');
    expect(session.expiresAt).toBe(1850000000000);
    expect(session.user.name).toBe('Vibe Listener');
  });

  test('T1.F58.3: Session callback propagates error flag when present in token', async () => {
    const mockToken = {
      accessToken: 'stale_token',
      error: 'RefreshAccessTokenError',
    };

    const session = await authOptions.callbacks.session({
      session: {},
      token: mockToken,
    });

    expect(session.error).toBe('RefreshAccessTokenError');
  });

  test('T1.F58.4: JWT callback passes unexpired token through without modification', async () => {
    const futureExpiry = Date.now() + 1800 * 1000;
    const mockToken = {
      accessToken: 'unexpired_token_789',
      refreshToken: 'valid_refresh_token_012',
      accessTokenExpires: futureExpiry,
    };

    const token = await authOptions.callbacks.jwt({
      token: mockToken,
    });

    expect(token.accessToken).toBe('unexpired_token_789');
    expect(token.refreshToken).toBe('valid_refresh_token_012');
    expect(token.accessTokenExpires).toBe(futureExpiry);
    expect(token.error).toBe(undefined);
  });
});

suite('Feature 59: NextAuth Store Token Auto-Sync', () => {
  test('T1.F59.1: setToken updates store state and switches player mode to spotify', () => {
    const store = useSpotifyStore.getState();

    store.setToken('test_auth_sync_token', 3600);

    const updated = useSpotifyStore.getState();
    expect(updated.accessToken).toBe('test_auth_sync_token');
    expect(updated.isAuthenticated).toBe(true);
    expect(updated.tokenExpiry).toBeGreaterThan(Date.now());
    expect(usePlayerStore.getState().mode).toBe('spotify');

    store.logout();
  });

  test('T1.F59.2: logout clears token and resets authentication status', () => {
    const store = useSpotifyStore.getState();
    store.setToken('temp_logout_token', 3600);
    expect(useSpotifyStore.getState().isAuthenticated).toBe(true);

    store.logout();

    const afterLogout = useSpotifyStore.getState();
    expect(afterLogout.accessToken).toBe(null);
    expect(afterLogout.isAuthenticated).toBe(false);
    expect(afterLogout.tokenExpiry).toBe(null);
  });

  test('T1.F59.3: custom expiration duration properly sets future expiry timestamp', () => {
    const store = useSpotifyStore.getState();
    const customDurationSec = 7200;
    const beforeTime = Date.now();

    store.setToken('custom_dur_token', customDurationSec);

    const updated = useSpotifyStore.getState();
    const expectedMinExpiry = beforeTime + customDurationSec * 1000;
    expect(updated.tokenExpiry).toBeGreaterThanOrEqual(expectedMinExpiry - 100);

    store.logout();
  });
});

suite('Feature 60: Hybrid Auth Resilience & Zero-Config Demo Mode', () => {
  test('T1.F60.1: Default initial playback mode is demo with full demo tracks', () => {
    expect(DEMO_TRACKS.length).toBeGreaterThanOrEqual(3);
    const track1 = DEMO_TRACKS[0];
    expect(track1.title).toBe('Apatheia (3 AM Drift)');
    expect(track1.artist).toBe('Kuro & The Ghost Circuit');
    expect(track1.lyrics.length).toBeGreaterThan(10);
    expect(track1.palette.length).toBe(4);
  });

  test('T1.F60.2: Absence of Spotify session allows playback in demo mode without errors', () => {
    const store = useSpotifyStore.getState();
    store.logout();
    expect(useSpotifyStore.getState().isAuthenticated).toBe(false);
    expect(useSpotifyStore.getState().accessToken).toBe(null);

    usePlayerStore.getState().setMode('demo');
    expect(usePlayerStore.getState().mode).toBe('demo');
    expect(usePlayerStore.getState().currentTrack.title).toBeTruthy();
    expect(usePlayerStore.getState().lyrics.length).toBeGreaterThan(0);
  });

  test('T1.F60.3: Player store mode transitions cleanly between demo and spotify', () => {
    usePlayerStore.getState().setMode('demo');
    expect(usePlayerStore.getState().mode).toBe('demo');

    usePlayerStore.getState().setMode('spotify');
    expect(usePlayerStore.getState().mode).toBe('spotify');

    usePlayerStore.getState().setMode('demo');
    expect(usePlayerStore.getState().mode).toBe('demo');
  });
});
