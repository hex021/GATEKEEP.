'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { parseLrc } from '@/lib/lrclib';
import { Upload, FileAudio, FileText, X, Sparkles, Music, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface CustomAudioDropzoneProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomAudioDropzone({ isOpen, onClose }: CustomAudioDropzoneProps) {
  const setTrack = usePlayerStore((s) => s.setTrack);
  const setLyrics = usePlayerStore((s) => s.setLyrics);
  const setMode = usePlayerStore((s) => s.setMode);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [detectedDurationMs, setDetectedDurationMs] = useState<number>(180000);
  const [lrcText, setLrcText] = useState<string>('');
  const [songTitle, setSongTitle] = useState<string>('Custom Track');
  const [artistName, setArtistName] = useState<string>('Local Audio');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const [isFetchingLyrics, setIsFetchingLyrics] = useState<boolean>(false);
  const [lyricsFetchStatus, setLyricsFetchStatus] = useState<string | null>(null);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const lrcInputRef = useRef<HTMLInputElement>(null);

  // Auto-fetch synced lyrics from LRCLIB if user hasn't provided a custom .lrc file
  const fetchLyricsFromOnline = useCallback(async (title: string, artist?: string) => {
    if (!title || title === 'Custom Track') return;
    setIsFetchingLyrics(true);
    setLyricsFetchStatus('Searching synced lyrics...');
    try {
      let url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}`;
      if (artist && artist !== 'Local Audio') {
        url += `&artist_name=${encodeURIComponent(artist)}`;
      }
      let res = await fetch(url, { headers: { 'User-Agent': 'VibeSync/1.0' } });
      if (res.ok) {
        const data = await res.json();
        if (data.syncedLyrics) {
          setLrcText(data.syncedLyrics);
          if (data.artistName && (!artist || artist === 'Local Audio')) {
            setArtistName(data.artistName);
          }
          if (data.trackName) {
            setSongTitle(data.trackName);
          }
          setLyricsFetchStatus(`Synced lyrics matched (${data.syncedLyrics.split('\n').filter(Boolean).length} lines)!`);
          setIsFetchingLyrics(false);
          return;
        }
      }

      // Fallback search
      const query = artist && artist !== 'Local Audio' ? `${artist} ${title}` : title;
      const sUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
      res = await fetch(sUrl, { headers: { 'User-Agent': 'VibeSync/1.0' } });
      if (res.ok) {
        const list = await res.json();
        const match = Array.isArray(list) ? list.find((x: { syncedLyrics?: string }) => x.syncedLyrics) : null;
        if (match?.syncedLyrics) {
          setLrcText(match.syncedLyrics);
          if (match.artistName) setArtistName(match.artistName);
          if (match.trackName) setSongTitle(match.trackName);
          setLyricsFetchStatus(`Synced lyrics matched (${match.syncedLyrics.split('\n').filter(Boolean).length} lines)!`);
          setIsFetchingLyrics(false);
          return;
        }
      }
      setLyricsFetchStatus('No synced lyrics found online — paste or drop .lrc below');
    } catch {
      setLyricsFetchStatus('Lyrics search unavailable');
    } finally {
      setIsFetchingLyrics(false);
    }
  }, []);

  // Measure audio duration
  const readAudioDuration = (file: File) => {
    try {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      audio.src = url;
      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
          setDetectedDurationMs(Math.round(audio.duration * 1000));
        }
        URL.revokeObjectURL(url);
      };
    } catch {
      // fallback
    }
  };

  // Helper to parse song metadata from filename
  const parseFilename = (filename: string) => {
    const raw = filename.replace(/\.[^/.]+$/, '');
    // e.g. "The Weeknd - Blinding Lights" or "01. Joji - Slow Dancing in the Dark"
    const cleaned = raw.replace(/^\d+[\s.-]+/, '');
    const parts = cleaned.split(/\s*-\s*/);
    if (parts.length >= 2) {
      return { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() };
    }
    return { artist: 'Local Audio', title: cleaned.trim() };
  };

  // Handle global drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    let loadedLrc = false;
    let pendingTitle = '';
    let pendingArtist = '';

    for (const file of files) {
      if (file.name.endsWith('.lrc') || file.type === 'text/plain') {
        const text = await file.text();
        setLrcText(text);
        loadedLrc = true;
        setLyricsFetchStatus('Loaded custom .lrc file');
      } else if (file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac)$/i.test(file.name)) {
        setAudioFile(file);
        readAudioDuration(file);
        const parsed = parseFilename(file.name);
        pendingTitle = parsed.title;
        pendingArtist = parsed.artist;
        setSongTitle(parsed.title);
        setArtistName(parsed.artist);
      }
    }

    if (!loadedLrc && pendingTitle) {
      fetchLyricsFromOnline(pendingTitle, pendingArtist);
    }
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFile(file);
      readAudioDuration(file);
      const parsed = parseFilename(file.name);
      setSongTitle(parsed.title);
      setArtistName(parsed.artist);
      if (!lrcText.trim()) {
        fetchLyricsFromOnline(parsed.title, parsed.artist);
      }
    }
  };

  const handleLrcSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const text = await file.text();
      setLrcText(text);
      setLyricsFetchStatus('Loaded custom .lrc file');
    }
  };

  const handleLoadAndPlay = () => {
    const audioUrl = audioFile ? URL.createObjectURL(audioFile) : '/demo/apatheia.mp3';
    const parsedLyrics = lrcText.trim()
      ? parseLrc(lrcText)
      : [
          { timeMs: 0, text: `Now Playing: ${songTitle}` },
          { timeMs: 4000, text: 'Custom local audio stream loaded' },
          { timeMs: 8000, text: 'Experience in 3D Video Edit Mode' },
        ];

    // Neon purple/cyan dynamic palette for custom uploads
    const customPalette: [string, string, string, string] = [
      '#05050A',
      '#1E1B4B',
      '#7C3AED',
      '#06B6D4',
    ];

    setTrack({
      id: `custom-${Date.now()}`,
      title: songTitle || 'Custom Audio',
      artist: artistName || 'Local Track',
      album: 'User Upload',
      albumArt: '/demo/covers/neo-tokyo.svg',
      audioSrc: audioUrl,
      durationMs: detectedDurationMs,
      palette: customPalette,
      vibeTag: 'Custom Local Visualizer',
      storyQuote: parsedLyrics[0]?.text || songTitle,
    });

    setLyrics(parsedLyrics);
    setMode('demo');
    setIsPlaying(true);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-full max-w-lg rounded-3xl bg-neutral-900 border ${
          isDragging ? 'border-cyan-400 bg-cyan-950/20 shadow-cyan-500/30' : 'border-white/15'
        } shadow-2xl p-6 sm:p-7 flex flex-col gap-5 text-white transition-all`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Upload size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Load Custom Audio &amp; Lyrics</h2>
              <p className="text-xs text-neutral-400">
                Drop any downloaded track (e.g. via Seal app) or .lrc file for 3D visualizer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onClick={() => audioInputRef.current?.click()}
          className="border-2 border-dashed border-white/20 hover:border-cyan-400/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-white/[0.02] hover:bg-white/[0.05]"
        >
          <input
            type="file"
            ref={audioInputRef}
            onChange={handleAudioSelect}
            accept="audio/*,.mp3,.wav,.ogg,.m4a"
            className="hidden"
          />
          <FileAudio size={32} className="text-cyan-400 mb-2 animate-bounce" />
          <p className="text-sm font-semibold text-white">
            {audioFile ? audioFile.name : 'Drag & drop your audio file here'}
          </p>
          <p className="text-xs text-neutral-400 mt-1">Supports MP3, WAV, M4A, OGG (Full songs from Seal / local)</p>
        </div>

        {/* Dynamic Lyrics Match / Search Status Pill */}
        {(isFetchingLyrics || lyricsFetchStatus) && (
          <div
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-mono transition-all border ${
              isFetchingLyrics
                ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300 animate-pulse'
                : lyricsFetchStatus?.includes('matched') || lyricsFetchStatus?.includes('Loaded')
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
            }`}
          >
            {isFetchingLyrics ? (
              <Loader2 size={14} className="animate-spin text-cyan-400 flex-shrink-0" />
            ) : lyricsFetchStatus?.includes('matched') || lyricsFetchStatus?.includes('Loaded') ? (
              <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle size={14} className="text-amber-400 flex-shrink-0" />
            )}
            <span className="truncate">{lyricsFetchStatus || 'Searching lyrics...'}</span>
          </div>
        )}

        {/* LRC Lyrics Input / Drop */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-300">Synchronized Lyrics (.lrc file or raw text):</span>
            <button
              onClick={() => lrcInputRef.current?.click()}
              className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] flex items-center space-x-1"
            >
              <FileText size={12} />
              <span>Browse .lrc file</span>
            </button>
            <input
              type="file"
              ref={lrcInputRef}
              onChange={handleLrcSelect}
              accept=".lrc,text/plain"
              className="hidden"
            />
          </div>
          <textarea
            value={lrcText}
            onChange={(e) => setLrcText(e.target.value)}
            placeholder="[00:04.20] First lyric line&#10;[00:08.50] Second lyric line..."
            rows={4}
            className="w-full rounded-xl bg-black/40 border border-white/10 p-3 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        {/* Metadata Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-mono text-neutral-400 block mb-1">Track Title</label>
            <input
              type="text"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="text-[11px] font-mono text-neutral-400 block mb-1">Artist</label>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleLoadAndPlay}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 hover:opacity-90 active:scale-[0.98] text-white font-bold text-sm shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Sparkles size={16} />
          <span>Launch Kinetic Visualizer</span>
        </button>
      </div>
    </div>
  );
}
