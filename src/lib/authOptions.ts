import type { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import SpotifyProvider from 'next-auth/providers/spotify';

const SPOTIFY_REFRESH_TOKEN_URL = 'https://accounts.spotify.com/api/token';

export const SPOTIFY_SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-read-email',
  'user-read-private',
].join(' ');

export async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID || process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '';
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';

    if (!token.refreshToken) {
      throw new Error('No refresh token available');
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(SPOTIFY_REFRESH_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken as string,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + (refreshedTokens.expires_in ?? 3600) * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch (error) {
    console.error('NextAuth: Failed to refresh Spotify access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

const spotifyProviderFn = (typeof SpotifyProvider === 'function' ? SpotifyProvider : (SpotifyProvider as any).default) as typeof SpotifyProvider;

export const authOptions: NextAuthOptions = {
  providers: [
    spotifyProviderFn({
      clientId: process.env.SPOTIFY_CLIENT_ID || process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || 'vibesync-mock-client-id',
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET || 'vibesync-mock-client-secret',
      authorization: {
        params: {
          scope: SPOTIFY_SCOPES,
          show_dialog: 'true',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign-in
      if (account && user) {
        return {
          accessToken: account.access_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000,
          refreshToken: account.refresh_token,
          user,
        };
      }

      // Return previous token if the access token has not expired (60s buffer)
      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number) - 60000) {
        return token;
      }

      // Access token has expired; refresh it
      return refreshAccessToken(token);
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.expiresAt = token.accessTokenExpires as number;
      session.error = token.error as string | undefined;
      if (token.user) {
        session.user = token.user as any;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'vibesync-secure-dev-session-secret-key-32chars',
};
