'use client';

import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useSpotifyStore } from '@/stores/useSpotifyStore';
import { initiateSpotifyLogin, getRedirectUri } from '@/lib/spotifyAuth';
import {
  X,
  Key,
  Copy,
  Check,
  ShieldCheck,
  Radio,
  LogOut,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { isSfxMuted, setSfxMuted, playMechanicalClick } from '@/lib/soundFx';

interface SpotifySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SpotifySetupModal({ isOpen, onClose }: SpotifySetupModalProps) {
  const clientId = useSpotifyStore((s) => s.clientId);
  const isAuthenticated = useSpotifyStore((s) => s.isAuthenticated);
  const saveClientId = useSpotifyStore((s) => s.saveClientId);
  const logout = useSpotifyStore((s) => s.logout);

  const [inputVal, setInputVal] = useState(clientId);
  const [copied, setCopied] = useState(false);
  const [copiedAuth, setCopiedAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectUri, setRedirectUri] = useState('');
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setSfxEnabled(!isSfxMuted());
  }, []);

  useEffect(() => {
    setInputVal(clientId);
  }, [clientId]);

  useEffect(() => {
    setRedirectUri(getRedirectUri());
  }, []);

  const nextAuthUri = redirectUri ? redirectUri.replace(/\/callback$/, '/api/auth/callback/spotify') : '';

  const handleCopyUri = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAuthUri = () => {
    navigator.clipboard.writeText(nextAuthUri);
    setCopiedAuth(true);
    setTimeout(() => setCopiedAuth(false), 2000);
  };

  const handleUnifiedConnect = async () => {
    const trimmed = inputVal.trim();
    if (trimmed) {
      saveClientId(trimmed);
      try {
        await initiateSpotifyLogin(trimmed);
        return;
      } catch (err: any) {
        setError(err.message || 'Failed to initiate PKCE login');
        return;
      }
    }

    try {
      await signIn('spotify', { callbackUrl: '/' });
    } catch {
      const envCid = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
      if (envCid) {
        await initiateSpotifyLogin(envCid);
      } else {
        setShowAdvanced(true);
        setError('Please enter your Spotify Client ID below in Developer Settings.');
      }
    }
  };

  const handleDisconnect = () => {
    logout();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-neutral-900 border border-white/15 shadow-2xl shadow-black/80 overflow-hidden flex flex-col p-6 sm:p-7 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Radio size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Spotify Live Sync</h2>
              <p className="text-xs text-neutral-400">Real-time synced playback &amp; lyrics visualizer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Authenticated State */}
        {isAuthenticated ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-3.5">
              <ShieldCheck size={28} className="text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-300">Connected to Spotify</p>
                <p className="text-xs text-emerald-200/80">
                  VibeSync is live-syncing timestamps &amp; lyrics with your active Spotify playback.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleDisconnect}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-medium border border-red-500/20 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                <span>Disconnect Account</span>
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Unauthenticated / Setup Form - Single Unified Flow */
          <div className="space-y-5">
            {/* Unified Single Login Action */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-cyan-500/10 border border-emerald-500/25 flex flex-col items-center text-center space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
                <Radio size={24} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">One-Click Spotify Sync</h3>
                <p className="text-xs text-neutral-400 max-w-sm mt-0.5">
                  Sign in with your Spotify account to mirror your active playback and stream millisecond-accurate synced lyrics at 60fps.
                </p>
              </div>

              {error && <p className="text-xs text-red-400 font-medium">{error}</p>}

              <button
                type="button"
                onClick={handleUnifiedConnect}
                className="w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm shadow-xl shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <Radio size={16} />
                <span>Log in with Spotify</span>
              </button>
            </div>

            {/* Developer / Custom Client ID Accordion */}
            <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02]">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between p-3.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <span>Developer Settings &amp; Redirect URIs</span>
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showAdvanced && (
                <div className="p-4 pt-1 border-t border-white/10 space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-300 flex items-center justify-between">
                      <span>Custom Spotify Client ID (Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                        <Key size={13} />
                      </div>
                      <input
                        type="text"
                        value={inputVal}
                        onChange={(e) => {
                          setInputVal(e.target.value);
                          setError(null);
                        }}
                        placeholder="Paste 32-character Client ID"
                        className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/15 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-neutral-400">
                    <p className="text-[11px] font-semibold text-neutral-300">
                      Spotify Dashboard Redirect URI (Spotify requires <code>127.0.0.1</code>):
                    </p>
                    <div className="flex items-center justify-between bg-black/60 rounded-xl px-3 py-2 border border-white/10 font-mono text-[11px] text-neutral-200">
                      <span className="truncate mr-2">{nextAuthUri || redirectUri}</span>
                      <button
                        type="button"
                        onClick={handleCopyAuthUri}
                        className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-sans text-xs transition-colors flex-shrink-0 cursor-pointer"
                      >
                        {copiedAuth ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>{copiedAuth ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sound Effects & Haptics Setting */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center space-x-2.5">
                {sfxEnabled ? (
                  <Volume2 size={16} className="text-cyan-400" />
                ) : (
                  <VolumeX size={16} className="text-neutral-500" />
                )}
                <div>
                  <p className="text-xs font-semibold text-white">Tactile UI Sound Effects</p>
                  <p className="text-[10px] text-neutral-400">Synthesized mechanical clicks and mode chimes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !sfxEnabled;
                  setSfxEnabled(next);
                  setSfxMuted(!next);
                  if (next) playMechanicalClick();
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  sfxEnabled
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                    : 'bg-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                {sfxEnabled ? 'Enabled' : 'Muted'}
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Continue in Demo Mode
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
