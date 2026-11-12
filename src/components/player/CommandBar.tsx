'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useSpotifyStore } from '@/stores/useSpotifyStore';
import { parseSpotifyUrl } from '@/lib/spotifyUrl';
import {
  Search,
  Music,
  ExternalLink,
  Settings,
  X,
  Radio,
  Sparkles,
  Check,
  Upload,
  Play,
  Loader2,
} from 'lucide-react';

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSpotifySetup?: () => void;
  onOpenCustomAudio?: () => void;
}

export function CommandBar({
  isOpen,
  onClose,
  onOpenSpotifySetup,
  onOpenCustomAudio,
}: CommandBarProps) {
  const [query, setQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mode = usePlayerStore((s) => s.mode);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const setMode = usePlayerStore((s) => s.setMode);
  const lyrics = usePlayerStore((s) => s.lyrics) || [];
  const seekTo = usePlayerStore((s) => s.seekTo);

  const isAuthenticated = useSpotifyStore((s) => s.isAuthenticated);
  const fetchAndPlayItem = useSpotifyStore((s) => s.fetchAndPlayItem);
  const playTrackUri = useSpotifyStore((s) => s.playTrackUri);

  // Keyboard shortcut listener: Cmd+K / Ctrl+K & Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle Spotify URL or URI submission
  const handleSpotifySubmit = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setStatusMessage('Analyzing link...');

    const parsed = parseSpotifyUrl(trimmed);

    if (parsed) {
      const typeLabel = parsed.type.toUpperCase();
      setStatusMessage(`Found Spotify ${typeLabel} (${parsed.id}). Syncing...`);

      const success = await fetchAndPlayItem(parsed.type, parsed.id);
      setIsLoading(false);

      if (success) {
        setStatusMessage(`Loaded Spotify ${typeLabel}! Synced with visualizer.`);
        setTimeout(() => {
          onClose();
          setQuery('');
          setStatusMessage(null);
        }, 800);
      } else {
        // Fallback: try raw URI playback if connected
        if (isAuthenticated) {
          const directOk = await playTrackUri(parsed.uri);
          if (directOk) {
            setStatusMessage(`Playback started on Spotify device!`);
            setTimeout(() => {
              onClose();
              setQuery('');
              setStatusMessage(null);
            }, 800);
            return;
          }
        }
        setStatusMessage('Could not load track. Make sure Spotify is active or connect your account.');
      }
      return;
    }

    setIsLoading(false);
    setStatusMessage('Paste a Spotify link (track, playlist, or album) or enter search keywords.');
  }, [query, fetchAndPlayItem, isAuthenticated, playTrackUri, onClose]);

  if (!isOpen) return null;

  const parsedUrl = parseSpotifyUrl(query);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-neutral-900/95 border border-white/15 shadow-2xl shadow-black/80 overflow-hidden flex flex-col">
        {/* Search / Paste Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-2">
          {isLoading ? (
            <Loader2 size={18} className="text-cyan-400 animate-spin flex-shrink-0" />
          ) : (
            <Search size={18} className="text-neutral-400 flex-shrink-0" />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setStatusMessage(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSpotifySubmit();
              }
            }}
            placeholder="Paste Spotify track or playlist link (open.spotify.com/...)..."
            autoFocus
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-neutral-500 focus:outline-none font-mono"
          />

          {parsedUrl && (
            <button
              onClick={handleSpotifySubmit}
              disabled={isLoading}
              className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer flex-shrink-0"
            >
              <Play size={12} className="fill-black" />
              <span>Load {parsedUrl.type}</span>
            </button>
          )}

          {query && (
            <button
              onClick={() => {
                setQuery('');
                setStatusMessage(null);
              }}
              className="p-1 rounded-md text-neutral-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Status message */}
        {statusMessage && (
          <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between font-mono">
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Matched Lyrics Quick Jump (when query is entered) */}
        {query.trim().length >= 2 && !parsedUrl && (
          <div className="p-3 border-b border-white/10 max-h-48 overflow-y-auto space-y-1 bg-black/20">
            <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 px-2 py-0.5">
              Jump to Lyric Line in Current Track
            </div>
            {lyrics.filter((l) => l.text.toLowerCase().includes(query.toLowerCase())).length > 0 ? (
              lyrics
                .filter((l) => l.text.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 5)
                .map((line, idx) => (
                  <button
                    key={`${line.timeMs}-${idx}`}
                    onClick={() => {
                      seekTo(line.timeMs);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left hover:bg-white/10 text-white text-xs transition-colors cursor-pointer"
                  >
                    <span className="truncate pr-2 font-medium">"{line.text}"</span>
                    <span className="font-mono text-[10px] text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded flex-shrink-0">
                      {Math.floor(line.timeMs / 1000)}s
                    </span>
                  </button>
                ))
            ) : (
              <p className="px-2 py-1 text-xs text-neutral-500 italic">No lyrics matching "{query}"</p>
            )}
          </div>
        )}

        {/* Quick Actions & Spotify Integration Panel */}
        <div className="p-3 space-y-2">
          {/* Spotify Direct Connect / Live Sync Banner */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Radio size={16} className={isAuthenticated ? 'animate-pulse' : ''} />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  {isAuthenticated ? 'Spotify Live Mirroring Active' : 'Connect Your Spotify Account'}
                </p>
                <p className="text-[11px] text-neutral-400">
                  {isAuthenticated
                    ? 'Play any track in Spotify on any device — gatekeep automatically syncs lyrics & timestamps'
                    : 'One-click sign-in to mirror what you play in Spotify with 60fps lyric visualizers'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                if (onOpenSpotifySetup) onOpenSpotifySetup();
              }}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-emerald-500 hover:text-black text-white text-xs font-mono font-medium transition-colors flex-shrink-0 cursor-pointer"
            >
              {isAuthenticated ? 'Manage' : 'Connect'}
            </button>
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="space-y-1 pt-1">
            {onOpenCustomAudio && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCustomAudio();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/5 transition-colors text-xs cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <Upload size={14} className="text-cyan-400" />
                  <span>Upload Local Audio &amp; .LRC Synced Lyrics</span>
                </div>
                <span className="font-mono text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded">
                  Dropzone
                </span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                if (onOpenSpotifySetup) onOpenSpotifySetup();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors text-xs cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <Settings size={14} />
                <span>Developer Settings &amp; PKCE Redirect Configuration</span>
              </div>
              <span className="font-mono text-[10px] bg-white/10 px-2 py-0.5 rounded">Setup</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-black/40 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
          <span>Tip: Paste any Spotify song/playlist link &amp; press Enter</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}
