/**
 * Tier 2: Boundary & Corner Cases (Features 56 - 60: NextAuth Spotify Boundaries & Hybrid Resilience)
 * Comprehensive boundary tests for silent token refresh, network failures, store polling expiry guards,
 * and rapid state transitions.
 */

import { register } from 'node:module';
try {
  register('../helpers/path-loader.mjs', import.meta.url);
} catch {
  // Already registered in runner context
}

import { suite, test, expect } from '../helpers/test-harness.mjs';
import { authOptions, refreshAccessToken } from '../../src/lib/authOptions.ts';
import { useSpotifyStore } from '../../src/stores/useSpotifyStore.ts';
import { usePlayerStore } from '../../src/stores/usePlayerStore.ts';

suite('Boundary 56: NextAuth Token Expiry & Silent Refresh Flow', () => {
  test('T2.B56.1: Valid token before expiration returns unchanged without network request', async () => {
    const futureTime = Date.now() + 1800 * 1000;
    const token = {
      accessToken: 'still_valid_token_xyz',
      refreshToken: 'refresh_token_abc',
      accessTokenExpires: futureTime,
    };

    const result = await authOptions.callbacks.jwt({ token });
    expect(result.accessToken).toBe('still_valid_token_xyz');
    expect(result.refreshToken).toBe('refresh_token_abc');
    expect(result.accessTokenExpires).toBe(futureTime);
    expect(result.error).toBe(undefined);
  });

  test('T2.B56.2: Expired token calls refresh and updates accessToken and expiry', async () => {
    const originalFetch = globalThis.fetch;
    const now = Date.now();
    try {
      globalThis.fetch = async (url, options) => {
        expect(url).toContain('accounts.spotify.com/api/token');
        expect(options.method).toBe('POST');
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: 'new_refreshed_access_token_999',
            token_type: 'Bearer',
            expires_in: 3600,
            refresh_token: 'new_rotated_refresh_token_888',
          }),
        };
      };

      const expiredToken = {
        accessToken: 'expired_old_token',
        refreshToken: 'existing_refresh_token',
        accessTokenExpires: now - 10000,
      };

      const result = await authOptions.callbacks.jwt({ token: expiredToken });
      expect(result.accessToken).toBe('new_refreshed_access_token_999');
      expect(result.refreshToken).toBe('new_rotated_refresh_token_888');
      expect(result.accessTokenExpires).toBeGreaterThan(now);
      expect(result.error).toBe(undefined);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('T2.B56.3: Network failure during token refresh returns RefreshAccessTokenError', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => {
        throw new Error('Connection refused / DNS lookup failed');
      };

      const expiredToken = {
        accessToken: 'expired_token_unreachable',
        refreshToken: 'valid_refresh_unreachable',
        accessTokenExpires: Date.now() - 5000,
      };

      const result = await refreshAccessToken(expiredToken);
      expect(result.error).toBe('RefreshAccessTokenError');
      expect(result.accessToken).toBe('expired_token_unreachable');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('T2.B56.4: HTTP 400 response from Spotify returns RefreshAccessTokenError', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => ({
        ok: false,
        status: 400,
        json: async () => ({ error: 'invalid_grant', error_description: 'Refresh token revoked' }),
      });

      const token = {
        accessToken: 'old_token_revoked',
        refreshToken: 'revoked_refresh_token',
        accessTokenExpires: Date.now() - 1000,
      };

      const result = await refreshAccessToken(token);
      expect(result.error).toBe('RefreshAccessTokenError');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('T2.B56.5: Refresh token rotation preserves previous refresh token when omitted by Spotify', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          access_token: 'new_token_no_rotation',
          expires_in: 3600,
          // refresh_token omitted
        }),
      });

      const token = {
        accessToken: 'old_access',
        refreshToken: 'preserve_me_refresh',
      };

      const result = await refreshAccessToken(token);
      expect(result.accessToken).toBe('new_token_no_rotation');
      expect(result.refreshToken).toBe('preserve_me_refresh');
      expect(result.error).toBe(undefined);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('T2.B56.6: Missing refresh token in JWT returns RefreshAccessTokenError gracefully', async () => {
    const token = {
      accessToken: 'token_without_refresh',
    };

    const result = await refreshAccessToken(token);
    expect(result.error).toBe('RefreshAccessTokenError');
  });
});

suite('Boundary 59: Store Polling Expiry Guard Without PKCE Refresh Token', () => {
  test('T2.B59.1: pollCurrentlyPlaying suppresses premature logout when no PKCE token exists', async () => {
    const store = useSpotifyStore.getState();
    // Simulate NextAuth setting token with expiry in past
    store.setToken('simulated_nextauth_token', -10);

    const originalFetch = globalThis.fetch;
    try {
      // Mock Spotify currently-playing returning 204 No Content
      globalThis.fetch = async () => ({
        ok: true,
        status: 204,
      });

      // Polling should NOT logout since no PKCE refresh token exists in localStorage
      await store.pollCurrentlyPlaying();

      const stateAfterPoll = useSpotifyStore.getState();
      expect(stateAfterPoll.isAuthenticated).toBe(true);
      expect(stateAfterPoll.accessToken).toBe('simulated_nextauth_token');
    } finally {
      globalThis.fetch = originalFetch;
      store.logout();
    }
  });

  test('T2.B59.2: pollCurrentlyPlaying with 401 response suppresses logout when no PKCE token exists', async () => {
    const store = useSpotifyStore.getState();
    store.setToken('nextauth_token_401_test', 3600);

    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => ({
        ok: false,
        status: 401,
      });

      await store.pollCurrentlyPlaying();

      // State is preserved; NextAuth handles session lifecycle
      const state = useSpotifyStore.getState();
      expect(state.isAuthenticated).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
      store.logout();
    }
  });

  test('T2.B59.3: Polling without an active access token exits early without making network calls', async () => {
    const store = useSpotifyStore.getState();
    store.logout();

    let fetchCalled = false;
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => {
        fetchCalled = true;
        return { ok: true, status: 200, json: async () => ({}) };
      };

      await store.pollCurrentlyPlaying();
      expect(fetchCalled).toBe(false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

suite('Boundary 60: Rapid Sign-In / Sign-Out Fuzzing & Hybrid Resilience', () => {
  test('T2.B60.1: Rapid consecutive setToken and logout calls leave clean store state', () => {
    const store = useSpotifyStore.getState();
    for (let i = 0; i < 20; i++) {
      store.setToken(`token_${i}`, 3600);
      store.logout();
    }
    const finalState = useSpotifyStore.getState();
    expect(finalState.accessToken).toBe(null);
    expect(finalState.isAuthenticated).toBe(false);
    expect(finalState.isPolling).toBe(false);
  });

  test('T2.B60.2: Multiple setToken calls with varying tokens maintain latest state', () => {
    const store = useSpotifyStore.getState();
    store.setToken('initial_token', 1800);
    store.setToken('second_token', 3600);
    store.setToken('final_token', 7200);

    const state = useSpotifyStore.getState();
    expect(state.accessToken).toBe('final_token');
    expect(state.isAuthenticated).toBe(true);

    store.logout();
  });

  test('T2.B60.3: Rapid mode switching between demo and spotify preserves track and lyrics integrity', () => {
    for (let i = 0; i < 10; i++) {
      usePlayerStore.getState().setMode(i % 2 === 0 ? 'spotify' : 'demo');
    }
    usePlayerStore.getState().setMode('demo');
    expect(usePlayerStore.getState().mode).toBe('demo');
    expect(usePlayerStore.getState().currentTrack.title).toBeTruthy();
    expect(usePlayerStore.getState().lyrics.length).toBeGreaterThan(0);
  });

  test('T2.B60.4: Calling logout multiple times consecutively is idempotent', () => {
    const store = useSpotifyStore.getState();
    store.logout();
    store.logout();
    store.logout();

    const state = useSpotifyStore.getState();
    expect(state.accessToken).toBe(null);
    expect(state.isAuthenticated).toBe(false);
    expect(state.isPolling).toBe(false);
  });
});
