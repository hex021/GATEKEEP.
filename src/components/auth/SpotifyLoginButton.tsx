'use client';

import React from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useSpotifyStore } from '@/stores/useSpotifyStore';
import { LogOut, Radio, User, AlertCircle } from 'lucide-react';

interface SpotifyLoginButtonProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export function SpotifyLoginButton({ className = '', variant = 'full' }: SpotifyLoginButtonProps) {
  const { data: session, status } = useSession();
  const isStoreAuth = useSpotifyStore((s) => s.isAuthenticated);
  const openSetupModal = useSpotifyStore((s) => s.openSetupModal);
  const logoutStore = useSpotifyStore((s) => s.logout);

  const isConnected = Boolean((session && session.user) || isStoreAuth);

  const handleSignOut = async () => {
    logoutStore();
    if (session) {
      await signOut({ callbackUrl: '/' });
    }
  };

  if (status === 'loading') {
    return (
      <div
        className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-400 select-none ${className}`}
      >
        <Radio size={13} className="animate-spin text-emerald-400" />
        <span>Connecting...</span>
      </div>
    );
  }

  if (isConnected) {
    const userProfile = useSpotifyStore.getState().userProfile;
    const hasError = session?.error === 'RefreshAccessTokenError';
    const userName = userProfile?.displayName || session?.user?.name || 'Spotify Active';
    const userImage = userProfile?.image || session?.user?.image;

    return (
      <div className={`flex items-center space-x-1.5 ${className}`}>
        <div
          onClick={openSetupModal}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
            hasError
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
              : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/15'
          }`}
          title="Connected to Spotify — Click for Settings"
        >
          {userImage ? (
            <img
              src={userImage}
              alt={userName}
              className="w-5 h-5 rounded-full object-cover border border-emerald-400/30"
              crossOrigin="anonymous"
            />
          ) : (
            <User size={13} className={hasError ? 'text-amber-400' : 'text-emerald-400'} />
          )}

          <span className="truncate max-w-[110px]">{userName}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        <button
          onClick={handleSignOut}
          className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/25 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
          title="Sign out / Disconnect"
          aria-label="Sign out of Spotify"
        >
          <LogOut size={13} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={openSetupModal}
      className={`group flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer ${className}`}
      title="Connect Spotify Account"
    >
      <Radio size={14} className="group-hover:scale-110 transition-transform" />
      <span>Connect Spotify</span>
    </button>
  );
}

