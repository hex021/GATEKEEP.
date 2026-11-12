'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { SpotifyAuthSync } from './SpotifyAuthSync';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={4 * 60} refetchOnWindowFocus={true}>
      <SpotifyAuthSync />
      {children}
    </SessionProvider>
  );
}

