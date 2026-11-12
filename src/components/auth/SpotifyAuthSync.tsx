'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useSpotifyStore } from '@/stores/useSpotifyStore';
import { usePlayerStore } from '@/stores/usePlayerStore';

export function SpotifyAuthSync() {
  const { data: session, status } = useSession();
  const setToken = useSpotifyStore((s) => s.setToken);
  const logout = useSpotifyStore((s) => s.logout);
  const setMode = usePlayerStore((s) => s.setMode);

  // Track whether current session was initiated / active via NextAuth
  const nextAuthActive = useRef(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      nextAuthActive.current = true;
      const remainingSeconds = session.expiresAt
        ? Math.max(60, Math.floor((session.expiresAt - Date.now()) / 1000))
        : 3600;

      setToken(session.accessToken, remainingSeconds);
      setMode('spotify');
    } else if (status === 'unauthenticated' && nextAuthActive.current) {
      nextAuthActive.current = false;
      logout();
      setMode('demo');
    }
  }, [session, status, setToken, logout, setMode]);

  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      console.warn('NextAuth: Spotify refresh token expired or revoked. Please re-authenticate.');
    }
  }, [session?.error]);

  return null;
}
