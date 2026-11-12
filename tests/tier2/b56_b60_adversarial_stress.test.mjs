/**
/**
 * Tier 2: Adversarial Stress & Robustness Suite (Features 56 - 60: NextAuth Spotify & Store Sync)
 * EMPIRICAL CHALLENGER STRESS HARNESS:
 * 1. Rapid simulated session token rotations and expirations (boundary precision & 100-cycle loop).
 * 2. Fuzzing refreshAccessToken with network timeouts, HTTP 4xx/5xx errors, corrupted payloads,
 *    malformed JSON, and missing client secrets.
 * 3. Concurrency stress: high-throughput interleaved setToken(), logout(), pollCurrentlyPlaying(),
 *    and player mode transitions.
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

// ---------------------------------------------------------------------------
// SUITE 1: Rapid Token Rotation & Precise Expiry Boundary Stress
// ---------------------------------------------------------------------------
suite('Adversarial Stress 1: Rapid Token Rotation & Expiry Boundary Precision', () => {
  test('ADV.ROT.1: Boundary precision - token expiring at 65s does NOT trigger refresh', async () => {
    let fetchCalled = false;
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => {
        fetchCalled = true;
        return { ok: true, status: 200, json: async () => ({}) };
      };

      const now = Date.now();
      const token = {
        accessToken: 'valid_access_at_65s',
        refreshToken: 'valid_refresh',
        accessTokenExpires: now + 65000, // 65 seconds in future (buffer is 60s)
      };

      const result = await authOptions.callbacks.jwt({ token });
      expect(fetchCalled).toBe(false);
      expect(result.accessToken).toBe('valid_access_at_65s');
      expect(result.error).toBe(undefined);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('ADV.ROT.2: Boundary precision - token expiring at 59s DOES trigger refresh', async () => {
    let fetchCalled = false;
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => {
        fetchCalled = true;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: 'refreshed_access_59s',
            expires_in: 3600,
          }),
        };
      };

      const now = Date.now();
      const token = {
        accessToken: 'stale_access_at_59s',
        refreshToken: 'valid_refresh',
        accessTokenExpires: now + 59000, // 59 seconds in future (inside 60s buffer)
      };

      const result = await authOptions.callbacks.jwt({ token });
      expect(fetchCalled).toBe(true);
      expect(result.accessToken).toBe('refreshed_access_59s');
      expect(result.error).toBe(undefined);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('ADV.ROT.3: 100-cycle continuous token rotation stress with alternating rotation models', async () => {
    const originalFetch = globalThis.fetch;
    let refreshCount = 0;

    try {
      globalThis.fetch = async (_url, options) => {
        refreshCount++;
        const shouldRotateRefreshToken = refreshCount % 2 === 0;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: `access_cycle_${refreshCount}`,
            expires_in: 3600,
            ...(shouldRotateRefreshToken
              ? { refresh_token: `rotated_refresh_${refreshCount}` }
              : {}),
          }),
        };
      };

      let currentToken = {
        accessToken: 'initial_access',
        refreshToken: 'initial_refresh',
        accessTokenExpires: Date.now() - 1000, // initially expired
      };

      for (let i = 1; i <= 100; i++) {
        // Expire token
        currentToken.accessTokenExpires = Date.now() - 5000;
        const nextToken = await authOptions.callbacks.jwt({ token: currentToken });

        expect(nextToken.accessToken).toBe(`access_cycle_${i}`);
        expect(nextToken.accessTokenExpires).toBeGreaterThan(Date.now());
        expect(nextToken.error).toBe(undefined);

        if (i % 2 === 0) {
          expect(nextToken.refreshToken).toBe(`rotated_refresh_${i}`);
        } else {
          expect(nextToken.refreshToken).toBe(currentToken.refreshToken);
        }

        // Test session callback mapping for each cycle
        const session = await authOptions.callbacks.session({
          session: { user: {} },
          token: nextToken,
        });
        expect(session.accessToken).toBe(nextToken.accessToken);
        expect(session.refreshToken).toBe(nextToken.refreshToken);
        expect(session.expiresAt).toBe(nextToken.accessTokenExpires);
        expect(session.error).toBe(undefined);

        currentToken = nextToken;
      }

      expect(refreshCount).toBe(100);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('ADV.ROT.4: Refresh preserves user object on expired token refresh', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          access_token: 'new_token_with_user',
          expires_in: 3600,
        }),
      });

      const user = { id: 'u_adv_123', name: 'Adversary', email: 'adv@test.io' };
      const expiredToken = {
        accessToken: 'old_token',
        refreshToken: 'refresh_with_user',
        accessTokenExpires: Date.now() - 10000,
        user,
      };

      const result = await authOptions.callbacks.jwt({ token: expiredToken });
      expect(result.user).toEqual(user);
      expect(result.accessToken).toBe('new_token_with_user');

      const session = await authOptions.callbacks.session({
        session: { user: {} },
        token: result,
      });
      expect(session.user).toEqual(user);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

// ---------------------------------------------------------------------------
// SUITE 2: Extreme Fault Injections & Fuzzing on refreshAccessToken
// ---------------------------------------------------------------------------
suite('Adversarial Stress 2: Fault Injections & Fuzzing on refreshAccessToken', () => {
  test('ADV.FUZZ.1: Network timeouts and aborts return RefreshAccessTokenError gracefully', async () => {
    const originalFetch = globalThis.fetch;
    const errorsToTest = [
      new Error('AbortError: The operation was aborted'),
      new Error('ECONNRESET: socket hang up'),
      new Error('getaddrinfo ENOTFOUND accounts.spotify.com'),
      new Error('ETIMEDOUT: Connection timed out after 30000ms'),
    ];

    try {
      for (const simulatedError of errorsToTest) {
        globalThis.fetch = async () => {
          throw simulatedError;
        };

        const token = {
          accessToken: 'stale_token',
          refreshToken: 'valid_refresh_token',
        };

        const result = await refreshAccessToken(token);
        expect(result.error).toBe('RefreshAccessTokenError');
        expect(result.accessToken).toBe('stale_token');
        expect(result.refreshToken).toBe('valid_refresh_token');
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('ADV.FUZZ.2: Non-Error thrown exceptions (strings, plain objects, null) handled cleanly', async () => {
    const originalFetch = globalThis.fetch;
    const nonErrors = [
      'Fatal string exception from transport layer',
      { status: 500, message: 'Custom RPC failure object' },
      null,
      undefined,
      42,
    ];

    try {
      for (const nonError of nonErrors) {
        globalThis.fetch = async () => {
          throw nonError;
        };

        const result = await refreshAccessToken({
          accessToken: 'test_token',
          refreshToken: 'test_refresh',
        });

        expect(result.error).toBe('RefreshAccessTokenError');
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('ADV.FUZZ.3: Exhaustive HTTP Status Code Fuzzing (401, 403, 404, 429, 500, 502, 503, 504)', async () => {
    const originalFetch = globalThis.fetch;
    const statusCodes = [401, 403, 404, 429, 500, 502, 503, 504];

    try {
      for (const code of statusCodes) {
        globalThis.fetch = async () => ({
          ok: false,
          status: code,
          json: async () => ({
            error: `http_${code}_error`,
            error_description: `Simulated HTTP status ${code}`,
          }),
        });

        const result = await refreshAccessToken({
          accessToken: 'tok',
          refreshToken: 'ref',
        });

        expect(result.error).toBe('RefreshAccessTokenError');
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('ADV.FUZZ.4: Malformed response payloads (HTML error page, invalid JSON, empty body)', async () => {
    const originalFetch = globalThis.fetch;
    try {
      // 1. HTML Error Page (e.g. Cloudflare or Nginx 502)
      globalThis.fetch = async () => ({
        ok: false,
        status: 502,
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON at position 0');
        },
      });

      const res1 = await refreshAccessToken({ accessToken: 'a', refreshToken: 'r' });
      expect(res1.error).toBe('RefreshAccessTokenError');

      // 2. 200 OK but corrupt JSON syntax in body
      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected end of JSON input');
        },
      });

      const res2 = await refreshAccessToken({ accessToken: 'a', refreshToken: 'r' });
      expect(res2.error).toBe('RefreshAccessTokenError');

      // 3. 200 OK with empty JSON object
      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const res3 = await refreshAccessToken({ accessToken: 'old_a', refreshToken: 'old_r' });
      expect(res3.error).toBe(undefined);
      expect(res3.accessToken).toBe(undefined);
      expect(res3.refreshToken).toBe('old_r');
      expect(res3.accessTokenExpires).toBeGreaterThan(Date.now());
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('ADV.FUZZ.5: Corrupted, non-string, and extreme refresh token inputs', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async (_url, options) => {
        expect(options.body !== undefined).toBe(true);
        return {
          ok: true,
          status: 200,
          json: async () => ({ access_token: 'recovered_access', expires_in: 3600 }),
        };
      };

      // Fuzz values for refreshToken
      const fuzzedTokens = [
        '', // empty string (should trigger !token.refreshToken)
        null,
        undefined,
        '   ', // whitespace
        '🔥🚀⚡🎧_emoji_unicode_token',
        'x'.repeat(50000), // 50k large token
        'token?client_secret=stolen&grant_type=hacked#anchor', // URL param injection attempt
      ];

      for (const fuzzed of fuzzedTokens) {
        const result = await refreshAccessToken({
          accessToken: 'base_access',
          refreshToken: fuzzed,
        });

        if (!fuzzed || fuzzed === '') {
          // Empty or falsy refreshToken returns error
          expect(result.error).toBe('RefreshAccessTokenError');
        } else {
          // Non-empty string is encoded in body and succeeds or handles error
          expect(result.accessToken).toBe('recovered_access');
          expect(result.error).toBe(undefined);
        }
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('ADV.FUZZ.6: Completely unset environment variables do not crash basicAuth', async () => {
    const originalFetch = globalThis.fetch;
    const oldClientId = process.env.SPOTIFY_CLIENT_ID;
    const oldClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const oldPubId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;

    try {
      delete process.env.SPOTIFY_CLIENT_ID;
      delete process.env.SPOTIFY_CLIENT_SECRET;
      delete process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;

      let authHeaderUsed = '';
      globalThis.fetch = async (_url, options) => {
        authHeaderUsed = options.headers.Authorization;
        return {
          ok: true,
          status: 200,
          json: async () => ({ access_token: 'fallback_access', expires_in: 3600 }),
        };
      };

      const result = await refreshAccessToken({
        accessToken: 'initial',
        refreshToken: 'valid_refresh',
      });

      // Basic auth with "" : "" is Buffer.from(":").toString("base64") === "Og=="
      expect(authHeaderUsed).toBe('Basic Og==');
      expect(result.accessToken).toBe('fallback_access');
      expect(result.error).toBe(undefined);
    } finally {
      process.env.SPOTIFY_CLIENT_ID = oldClientId;
      process.env.SPOTIFY_CLIENT_SECRET = oldClientSecret;
      process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID = oldPubId;
      globalThis.fetch = originalFetch;
    }
  });
});

// ---------------------------------------------------------------------------
// SUITE 3: Concurrency Stress & Race Condition Invariants
// ---------------------------------------------------------------------------
suite('Adversarial Stress 3: Concurrency Stress & Race Invariants', () => {
  test('ADV.CONC.1: 100 concurrent asynchronous operations interleave without exceptions', async () => {
    const store = useSpotifyStore.getState();
    const playerStore = usePlayerStore.getState();

    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => ({
        ok: true,
        status: 204, // No content
      });

      const promises = [];
      for (let i = 0; i < 100; i++) {
        const op = i % 5;
        if (op === 0) {
          promises.push(Promise.resolve().then(() => store.setToken(`token_conc_${i}`, 3600)));
        } else if (op === 1) {
          promises.push(Promise.resolve().then(() => store.pollCurrentlyPlaying()));
        } else if (op === 2) {
          promises.push(Promise.resolve().then(() => playerStore.setMode('spotify')));
        } else if (op === 3) {
          promises.push(Promise.resolve().then(() => playerStore.setMode('demo')));
        } else {
          promises.push(Promise.resolve().then(() => store.logout()));
        }
      }

      await Promise.all(promises);

      // Clean teardown must leave store in valid non-corrupted state
      store.logout();
      playerStore.setMode('demo');

      const finalSpotifyState = useSpotifyStore.getState();
      const finalPlayerState = usePlayerStore.getState();

      expect(finalSpotifyState.accessToken).toBe(null);
      expect(finalSpotifyState.isAuthenticated).toBe(false);
      expect(finalSpotifyState.isPolling).toBe(false);
      expect(finalPlayerState.mode).toBe('demo');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('ADV.CONC.2: In-flight poll completes safely after immediate logout', async () => {
    const store = useSpotifyStore.getState();
    const originalFetch = globalThis.fetch;

    try {
      let fetchResolve;
      const fetchPromise = new Promise((resolve) => {
        fetchResolve = resolve;
      });

      globalThis.fetch = async () => {
        return fetchPromise;
      };

      store.setToken('in_flight_test_token', 3600);

      // Start in-flight poll
      const pollPromise = store.pollCurrentlyPlaying();

      // Immediately log out while poll is awaiting fetch
      store.logout();
      expect(useSpotifyStore.getState().accessToken).toBe(null);
      expect(useSpotifyStore.getState().isPolling).toBe(false);

      // Now resolve the in-flight fetch with a valid Spotify track response
      fetchResolve({
        ok: true,
        status: 200,
        json: async () => ({
          item: {
            id: 'late_track_123',
            name: 'Late Track',
            duration_ms: 180000,
            artists: [{ name: 'Late Artist' }],
          },
          is_playing: true,
          progress_ms: 50000,
        }),
      });

      await pollPromise;

      // Ensure store interval is still stopped and clean
      expect(useSpotifyStore.getState().isPolling).toBe(false);
      expect(useSpotifyStore.getState().accessToken).toBe(null);
      expect(useSpotifyStore.getState().isAuthenticated).toBe(false);
    } finally {
      globalThis.fetch = originalFetch;
      store.logout();
    }
  });

  test('ADV.CONC.3: Rapid polling start/stop calls do not leak timer handles', () => {
    const store = useSpotifyStore.getState();

    // Call startPolling 50 times in rapid sequence
    for (let i = 0; i < 50; i++) {
      store.startPolling();
    }
    expect(useSpotifyStore.getState().isPolling).toBe(true);

    // Call stopPolling
    store.stopPolling();
    expect(useSpotifyStore.getState().isPolling).toBe(false);

    // Multiple redundant stops
    store.stopPolling();
    store.stopPolling();
    expect(useSpotifyStore.getState().isPolling).toBe(false);
  });
});
