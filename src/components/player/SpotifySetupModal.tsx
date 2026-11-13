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
  RefreshCw,
  Laptop,
  Music,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { usePlayerStore } from '@/stores/usePlayerStore';
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
  const userProfile = useSpotifyStore((s) => s.userProfile);
  const availableDevices = useSpotifyStore((s) => s.availableDevices);
  const currentDevice = useSpotifyStore((s) => s.currentDevice);
  const hasActiveDevice = useSpotifyStore((s) => s.hasActiveDevice);
  const syncDiagnostic = useSpotifyStore((s) => s.syncDiagnostic);
  const forceSync = useSpotifyStore((s) => s.forceSync);
  const wakeDevice = useSpotifyStore((s) => s.wakeDevice);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const [inputVal, setInputVal] = useState(clientId);
  const [copiedCallback, setCopiedCallback] = useState(false);
  const [copiedAuth, setCopiedAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectUri, setRedirectUri] = useState('');
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      forceSync();
    }
  }, [isOpen, isAuthenticated, forceSync]);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    await forceSync();
    setTimeout(() => setIsSyncing(false), 500);
  };

  const handleWakeDevice = async (id?: string) => {
    setIsSyncing(true);
    await wakeDevice(id);
    setTimeout(() => setIsSyncing(false), 500);
  };

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

  const handleCopyCallback = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 2000);
  };

  const handleCopyAuthUri = () => {
    navigator.clipboard.writeText(nextAuthUri);
    setCopiedAuth(true);
    setTimeout(() => setCopiedAuth(false), 2000);
  };

  const handleUnifiedConnect = async () => {
    const trimmed = inputVal.trim();
    if (trimmed) {
      if (trimmed.length !== 32 || !/^[a-fA-F0-9]{32}$/.test(trimmed)) {
        setError(
          trimmed.length > 32
            ? `Client ID has ${trimmed.length} characters (must be exactly 32). It appears to be double-pasted or concatenated.`
            : `Client ID must be exactly 32 hexadecimal characters (currently ${trimmed.length}).`
        );
        setShowAdvanced(true);
        return;
      }
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
            {/* Account Info Card */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                {userProfile?.image ? (
                  <img
                    src={userProfile.image}
                    alt={userProfile.displayName}
                    className="w-10 h-10 rounded-full object-cover border border-emerald-400/40"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                    {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'S'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-semibold text-white truncate">
                      {userProfile?.displayName || 'Spotify Active'}
                    </p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {userProfile?.product || 'Connected'}
                    </span>
                  </div>
                  {userProfile?.email && (
                    <p className="text-xs text-neutral-400 truncate">{userProfile.email}</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition cursor-pointer active:scale-95 disabled:opacity-50"
                title="Force refresh Spotify sync"
              >
                <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>

            {/* Current Playback or Diagnostic Status */}
            {hasActiveDevice && currentTrack.id && !currentTrack.id.startsWith('demo-') ? (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-3">
                <img
                  src={currentTrack.albumArt}
                  alt={currentTrack.title}
                  className="w-11 h-11 rounded-lg object-cover border border-white/10 flex-shrink-0"
                  crossOrigin="anonymous"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-xs font-mono uppercase tracking-wider text-emerald-300">Live Playing</p>
                  </div>
                  <p className="text-sm font-semibold text-white truncate">{currentTrack.title}</p>
                  <p className="text-xs text-neutral-400 truncate">{currentTrack.artist}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <div className="flex items-center space-x-2 text-amber-300 font-semibold text-xs">
                  <AlertTriangle size={15} />
                  <span>Desktop Waiting for Spotify Connect</span>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Spotify is connected to your account, but desktop playback is not yet broadcasting to Spotify Connect.
                </p>
                <div className="text-[11px] text-neutral-300 space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                  <p className="font-semibold text-white">How to connect in 5 seconds:</p>
                  <p>1. Open your <strong>Spotify Desktop</strong> app and play your song.</p>
                  <p>2. Click the <strong>Speaker / Device icon</strong> in Spotify (bottom right beside volume) and select this PC.</p>
                  <p>3. Or click <strong>&quot;Wake &amp; Connect&quot;</strong> on your PC device below!</p>
                </div>
              </div>
            )}

            {/* Detected Devices List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                <span className="font-semibold text-neutral-300">Detected Spotify Devices:</span>
                <span className="font-mono text-[10px]">{availableDevices.length} available</span>
              </div>

              {availableDevices.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {availableDevices.map((dev) => (
                    <div
                      key={dev.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition text-xs ${
                        dev.isActive
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                          : 'bg-white/5 border-white/10 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <Laptop size={15} className={dev.isActive ? 'text-emerald-400' : 'text-neutral-400'} />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{dev.name}</p>
                          <p className="text-[10px] text-neutral-400">
                            {dev.type} {dev.isActive ? '• Active' : '• Idle'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleWakeDevice(dev.id)}
                        disabled={isSyncing}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          dev.isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {dev.isActive ? 'Active' : 'Wake & Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-neutral-400">
                  <span>No devices detected yet</span>
                  <button
                    type="button"
                    onClick={handleSyncNow}
                    className="text-emerald-400 hover:underline cursor-pointer"
                  >
                    Scan Devices
                  </button>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleDisconnect}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-medium border border-red-500/20 transition-colors cursor-pointer"
              >
                <LogOut size={13} />
                <span>Disconnect / Switch Account</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
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
                <div className="p-4 pt-1 border-t border-white/10 space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-neutral-300 flex items-center justify-between">
                      <span>Custom Spotify Client ID (Optional)</span>
                      {inputVal.trim().length > 0 && (
                        <span
                          className={`font-mono text-[10px] ${
                            inputVal.trim().length === 32 && /^[a-fA-F0-9]{32}$/.test(inputVal.trim())
                              ? 'text-emerald-400 font-semibold'
                              : inputVal.trim().length > 32
                              ? 'text-amber-400 font-bold animate-pulse'
                              : 'text-neutral-400'
                          }`}
                        >
                          {inputVal.trim().length === 32 && /^[a-fA-F0-9]{32}$/.test(inputVal.trim())
                            ? '✓ Valid 32-char Hex ID'
                            : inputVal.trim().length > 32
                            ? `⚠️ ${inputVal.trim().length}/32 chars (Too long - double-pasted?)`
                            : `${inputVal.trim().length}/32 chars`}
                        </span>
                      )}
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
                        placeholder="Paste exactly 32-character Client ID"
                        className={`w-full pl-9 pr-8 py-2 bg-black/40 border rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none font-mono ${
                          inputVal.trim().length > 32
                            ? 'border-amber-500/80 focus:border-amber-400'
                            : inputVal.trim().length === 32 && /^[a-fA-F0-9]{32}$/.test(inputVal.trim())
                            ? 'border-emerald-500/80 focus:border-emerald-400'
                            : 'border-white/15 focus:border-emerald-500'
                        }`}
                      />
                      {inputVal.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setInputVal('');
                            setError(null);
                          }}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-neutral-500 hover:text-white cursor-pointer"
                          title="Clear input"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                    {inputVal.trim().length > 32 && (
                      <p className="text-[10px] text-amber-300 leading-tight">
                        Spotify Client IDs are strictly 32 hexadecimal characters. Click &quot;X&quot; above and re-copy only the Client ID from your Spotify Dashboard.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 text-neutral-400">
                    <p className="text-[11px] font-semibold text-neutral-300">
                      Spotify Dashboard Redirect URIs (Spotify requires <code>127.0.0.1</code>):
                    </p>
                    <div className="space-y-1.5">
                      {/* PKCE Callback (used with Custom Client ID) */}
                      <div>
                        <span className="text-[10px] text-neutral-400 block mb-0.5">Primary Redirect URI (for Client ID login):</span>
                        <div className="flex items-center justify-between bg-black/60 rounded-xl px-3 py-1.5 border border-white/10 font-mono text-[11px] text-neutral-200">
                          <span className="truncate mr-2">{redirectUri || 'http://127.0.0.1:3000/callback'}</span>
                          <button
                            type="button"
                            onClick={handleCopyCallback}
                            className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-sans text-xs transition-colors flex-shrink-0 cursor-pointer"
                          >
                            {copiedCallback ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            <span>{copiedCallback ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      {/* NextAuth Callback (used with Server NextAuth) */}
                      <div>
                        <span className="text-[10px] text-neutral-400 block mb-0.5">NextAuth Redirect URI:</span>
                        <div className="flex items-center justify-between bg-black/60 rounded-xl px-3 py-1.5 border border-white/10 font-mono text-[11px] text-neutral-200">
                          <span className="truncate mr-2">{nextAuthUri || 'http://127.0.0.1:3000/api/auth/callback/spotify'}</span>
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
                    <p className="text-[10px] text-neutral-400 leading-tight">
                      Ensure both URIs above are added under <strong>Settings → Redirect URIs</strong> in your Spotify Developer App.
                    </p>
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
