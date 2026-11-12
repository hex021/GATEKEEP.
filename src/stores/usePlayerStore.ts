import { create } from 'zustand';
import { DEMO_TRACKS, DemoTrack } from '@/data/demoTracks';
import { LyricLine } from '@/lib/lrclib';

export type PlaybackMode = 'demo' | 'spotify';
export type VisualizerMode =
  | 'video-edit'
  | 'apple-spatial'
  | 'cyberpunk'
  | 'xerox-89'
  | 'thermal-flir'
  | 'glitchcore'
  | 'swiss-editorial'
  | 'vhs-memory'
  | 'liquid-type'
  | 'void'
  | 'riot-zone'
  | 'heartbreak'
  | 'bouncing-ball'
  | 'mirror-world'
  | 'emotional-damage'
  | 'newspaper'
  | 'constellation';

export const THEME_MODES: VisualizerMode[] = [
  'video-edit',
  'cyberpunk',
  'xerox-89',
  'thermal-flir',
  'glitchcore',
  'swiss-editorial',
  'vhs-memory',
  'liquid-type',
  'void',
  'riot-zone',
  'heartbreak',
  'bouncing-ball',
  'mirror-world',
  'emotional-damage',
  'newspaper',
  'constellation',
];

export interface CurrentTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  audioSrc?: string;
  durationMs: number;
  palette: [string, string, string, string];
  vibeTag?: string;
  storyQuote?: string;
  spotifyUri?: string;
}

export function findActiveLineIndex(lyrics: LyricLine[], effectiveTimeMs: number): number {
  if (!lyrics || lyrics.length === 0) return -1;
  if (effectiveTimeMs < lyrics[0].timeMs) return -1;

  let low = 0;
  let high = lyrics.length - 1;
  let best = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lyrics[mid].timeMs <= effectiveTimeMs) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return best;
}

function demoTrackToCurrentTrack(demo: DemoTrack): CurrentTrack {
  return {
    id: demo.id,
    title: demo.title,
    artist: demo.artist,
    album: demo.album,
    albumArt: demo.albumArt,
    audioSrc: demo.audioSrc,
    durationMs: demo.durationMs,
    palette: demo.palette,
    vibeTag: demo.vibeTag,
    storyQuote: demo.storyQuote,
  };
}

export interface PlayerState {
  mode: PlaybackMode;
  isPlaying: boolean;
  currentTimeMs: number;
  durationMs: number;
  volume: number; // 0 to 1
  isMuted: boolean;
  syncOffsetMs: number; // -500 to +500
  isAutoplayBlocked: boolean;
  seekTarget: number | null; // Trigger for audio controller

  // Track & Lyrics
  currentTrack: CurrentTrack;
  demoTrackIndex: number;
  lyrics: LyricLine[];
  activeLineIndex: number;

  // Visualizer Mode
  visualizerMode: VisualizerMode;

  // Actions
  setMode: (mode: PlaybackMode) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setCurrentTimeMs: (ms: number) => void;
  setDurationMs: (ms: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setSyncOffsetMs: (offset: number) => void;
  setIsAutoplayBlocked: (blocked: boolean) => void;
  setTrack: (track: CurrentTrack) => void;
  setLyrics: (lyrics: LyricLine[]) => void;
  selectDemoTrack: (index: number) => void;
  loadCustomTrack: (track: DemoTrack) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (timeMs: number) => void;
  clearSeekTarget: () => void;
  setVisualizerMode: (mode: VisualizerMode) => void;
  cycleVisualizerMode: () => void;
  cycleTheme: () => void;
}

const initialDemo = DEMO_TRACKS[0];

export const usePlayerStore = create<PlayerState>((set, get) => ({
  mode: 'demo',
  isPlaying: false,
  currentTimeMs: 0,
  durationMs: initialDemo.durationMs,
  volume: 0.8,
  isMuted: false,
  syncOffsetMs: 0,
  isAutoplayBlocked: false,
  seekTarget: null,

  currentTrack: demoTrackToCurrentTrack(initialDemo),
  demoTrackIndex: 0,
  lyrics: initialDemo.lyrics,
  activeLineIndex: 0,
  visualizerMode: 'video-edit',

  setMode: (mode) => set({ mode }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setCurrentTimeMs: (currentTimeMs) => {
    const { lyrics, syncOffsetMs, activeLineIndex } = get();
    const newActiveIndex = findActiveLineIndex(lyrics, currentTimeMs + syncOffsetMs);
    if (newActiveIndex !== activeLineIndex) {
      set({ currentTimeMs, activeLineIndex: newActiveIndex });
    } else {
      set({ currentTimeMs });
    }
  },

  setDurationMs: (durationMs) => set({ durationMs }),

  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)), isMuted: false }),

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  setSyncOffsetMs: (syncOffsetMs) => {
    const clampedOffset = Math.max(-500, Math.min(500, syncOffsetMs));
    const { lyrics, currentTimeMs } = get();
    const newActiveIndex = findActiveLineIndex(lyrics, currentTimeMs + clampedOffset);
    set({ syncOffsetMs: clampedOffset, activeLineIndex: newActiveIndex });
  },

  setIsAutoplayBlocked: (isAutoplayBlocked) => set({ isAutoplayBlocked }),

  setTrack: (track) => {
    set({
      currentTrack: track,
      durationMs: track.durationMs,
      currentTimeMs: 0,
      activeLineIndex: 0,
      seekTarget: 0,
    });
  },

  setLyrics: (lyrics) => {
    const { currentTimeMs, syncOffsetMs } = get();
    const newActiveIndex = findActiveLineIndex(lyrics, currentTimeMs + syncOffsetMs);
    set({ lyrics, activeLineIndex: newActiveIndex });
  },

  selectDemoTrack: (index) => {
    const validIdx = ((index % DEMO_TRACKS.length) + DEMO_TRACKS.length) % DEMO_TRACKS.length;
    const track = DEMO_TRACKS[validIdx];
    const newActiveIndex = findActiveLineIndex(track.lyrics, 0);
    set({
      demoTrackIndex: validIdx,
      currentTrack: demoTrackToCurrentTrack(track),
      durationMs: track.durationMs,
      lyrics: track.lyrics,
      currentTimeMs: 0,
      activeLineIndex: newActiveIndex,
      seekTarget: 0,
    });
  },

  loadCustomTrack: (track) => {
    const newActiveIndex = findActiveLineIndex(track.lyrics, 0);
    set({
      mode: 'demo',
      currentTrack: demoTrackToCurrentTrack(track),
      durationMs: track.durationMs,
      lyrics: track.lyrics,
      currentTimeMs: 0,
      activeLineIndex: newActiveIndex,
      seekTarget: 0,
      isPlaying: true,
    });
  },

  nextTrack: () => {
    const { mode, demoTrackIndex, selectDemoTrack } = get();
    if (mode === 'demo') {
      selectDemoTrack(demoTrackIndex + 1);
    }
  },

  prevTrack: () => {
    const { mode, demoTrackIndex, selectDemoTrack } = get();
    if (mode === 'demo') {
      selectDemoTrack(demoTrackIndex - 1);
    }
  },

  seekTo: (timeMs) => {
    const { lyrics, syncOffsetMs, durationMs } = get();
    const clamped = Math.max(0, Math.min(durationMs, timeMs));
    const newActiveIndex = findActiveLineIndex(lyrics, clamped + syncOffsetMs);
    set({
      currentTimeMs: clamped,
      seekTarget: clamped,
      activeLineIndex: newActiveIndex,
    });
  },

  clearSeekTarget: () => set({ seekTarget: null }),

  setVisualizerMode: (visualizerMode) => set({ visualizerMode }),

  cycleVisualizerMode: () => {
    const modes: VisualizerMode[] = ['video-edit', 'apple-spatial', 'cyberpunk'];
    const current = get().visualizerMode;
    const idx = modes.indexOf(current);
    const next = idx !== -1 ? modes[(idx + 1) % modes.length] : 'video-edit';
    set({ visualizerMode: next });
  },

  cycleTheme: () => {
    const themes = THEME_MODES;
    const current = get().visualizerMode;
    const idx = themes.indexOf(current);
    const next = idx !== -1 ? themes[(idx + 1) % themes.length] : themes[0];
    set({ visualizerMode: next });
  },
}));
