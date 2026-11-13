import { create } from 'zustand';
import {
  getStoredClientId,
  setStoredClientId,
  getStoredTokens,
  clearStoredTokens,
  refreshSpotifyToken,
} from '@/lib/spotifyAuth';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { fetchLyricsFromLrclib, cleanTrackTitle } from '@/lib/lrclib';
import { SpotifyItemType } from '@/lib/spotifyUrl';

export interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  volumePercent: number;
}

export interface SpotifyUserProfile {
  id: string;
  displayName: string;
  email: string;
  image: string | null;
  product: string;
}

export interface SpotifySyncDiagnostic {
  status: 'idle' | 'synced' | 'no-device' | 'forbidden' | 'error';
  message: string;
  lastUpdated: number;
}

interface SpotifyState {
  clientId: string;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null;
  isAuthenticated: boolean;
  isPolling: boolean;
  hasActiveDevice: boolean;
  currentDevice: SpotifyDevice | null;
  availableDevices: SpotifyDevice[];
  userProfile: SpotifyUserProfile | null;
  syncDiagnostic: SpotifySyncDiagnostic | null;
  isPremium: boolean;
  observerMode: boolean;
  lastPollTimestamp: number;
  spotifyProgressMs: number;
  isSetupModalOpen: boolean;

  // Actions
  initAuth: () => void;
  saveClientId: (id: string) => void;
  setTokens: (accessToken: string, refreshToken: string, expiresIn: number) => void;
  setToken: (token: string, expiresIn?: number) => void;
  setAuthenticated: (val: boolean) => void;
  logout: () => void;
  startPolling: () => void;
  stopPolling: () => void;
  openSetupModal: () => void;
  closeSetupModal: () => void;
  fetchUserProfile: () => Promise<SpotifyUserProfile | null>;
  fetchDevices: () => Promise<SpotifyDevice[]>;
  wakeDevice: (deviceId?: string) => Promise<boolean>;
  forceSync: () => Promise<void>;
  executePlaybackCommand: (action: 'play' | 'pause' | 'next' | 'previous' | 'seek', param?: any) => Promise<boolean>;
  playTrackUri: (spotifyUri: string) => Promise<boolean>;
  fetchAndPlayItem: (type: SpotifyItemType, id: string) => Promise<boolean>;
  pollCurrentlyPlaying: () => Promise<void>;
}

let pollingIntervalId: NodeJS.Timeout | null = null;
let listenersAttached = false;

export const useSpotifyStore = create<SpotifyState>((set, get) => ({
  clientId: '',
  accessToken: null,
  refreshToken: null,
  tokenExpiry: null,
  isAuthenticated: false,
  isPolling: false,
  hasActiveDevice: false,
  currentDevice: null,
  availableDevices: [],
  userProfile: null,
  syncDiagnostic: null,
  isPremium: true,
  observerMode: false,
  lastPollTimestamp: 0,
  spotifyProgressMs: 0,
  isSetupModalOpen: false,

  openSetupModal: () => set({ isSetupModalOpen: true }),
  closeSetupModal: () => set({ isSetupModalOpen: false }),

  initAuth: () => {
    const clientId = getStoredClientId();
    const { accessToken, refreshToken, expiry } = getStoredTokens();
    const isValid = Boolean(accessToken && expiry && expiry > Date.now());

    set({
      clientId,
      accessToken,
      refreshToken,
      tokenExpiry: expiry,
      isAuthenticated: isValid,
    });

    // When valid credentials exist, automatically switch to Spotify mode and start live sync
    if (isValid) {
      usePlayerStore.getState().setMode('spotify');
      get().fetchUserProfile();
      get().fetchDevices();
      if (!get().isPolling) {
        get().startPolling();
      }
    }
  },

  saveClientId: (id: string) => {
    setStoredClientId(id);
    set({ clientId: id.trim() });
  },

  setTokens: (accessToken: string, refreshToken: string, expiresIn: number) => {
    const expiry = Date.now() + expiresIn * 1000;
    set({
      accessToken,
      refreshToken,
      tokenExpiry: expiry,
      isAuthenticated: true,
    });
    usePlayerStore.getState().setMode('spotify');
    get().fetchUserProfile();
    get().fetchDevices();
    get().startPolling();
  },

  setToken: (token: string, expiresIn = 3600) => {
    const expiry = Date.now() + expiresIn * 1000;
    set({
      accessToken: token,
      tokenExpiry: expiry,
      isAuthenticated: true,
    });
    // Automatically switch player mode to spotify and start polling
    usePlayerStore.getState().setMode('spotify');
    get().fetchUserProfile();
    get().fetchDevices();
    get().startPolling();
  },

  setAuthenticated: (val: boolean) => set({ isAuthenticated: val }),

  logout: () => {
    get().stopPolling();
    clearStoredTokens();
    set({
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
      isAuthenticated: false,
      hasActiveDevice: false,
      currentDevice: null,
      availableDevices: [],
      userProfile: null,
      syncDiagnostic: null,
    });
  },

  fetchUserProfile: async () => {
    const { accessToken } = get();
    if (!accessToken) return null;
    try {
      const res = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok && typeof res.json === 'function') {
        const data = await res.json();
        const profile: SpotifyUserProfile = {
          id: data.id,
          displayName: data.display_name || data.id,
          email: data.email || '',
          image: data.images?.[0]?.url || null,
          product: data.product || 'free',
        };
        set({ userProfile: profile, isPremium: profile.product === 'premium' });
        return profile;
      }
    } catch (err) {
      console.warn('Spotify profile fetch error:', err);
    }
    return null;
  },

  fetchDevices: async () => {
    const { accessToken } = get();
    if (!accessToken) return [];
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok && typeof res.json === 'function') {
        const data = await res.json();
        const devices: SpotifyDevice[] = (data.devices || []).map((d: any) => ({
          id: d.id,
          name: d.name,
          type: d.type,
          isActive: Boolean(d.is_active),
          volumePercent: d.volume_percent ?? 100,
        }));
        const activeDev = devices.find((d) => d.isActive) || devices[0] || null;
        const hasActive = Boolean(devices.some((d) => d.isActive));
        set({
          availableDevices: devices,
          currentDevice: activeDev,
          hasActiveDevice: hasActive,
        });
        return devices;
      }
    } catch (err) {
      console.warn('Spotify devices fetch error:', err);
    }
    return [];
  },

  wakeDevice: async (deviceId?: string) => {
    const { accessToken, availableDevices } = get();
    if (!accessToken) return false;
    let targetId = deviceId;
    if (!targetId) {
      let devs = availableDevices;
      if (devs.length === 0) {
        devs = await get().fetchDevices();
      }
      targetId = devs.find((d) => d.isActive)?.id || devs[0]?.id;
    }
    if (!targetId) return false;

    try {
      // Transfer playback to activate the device in Spotify Connect
      const res = await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_ids: [targetId],
          play: false,
        }),
      });
      if (res.ok || res.status === 204) {
        setTimeout(() => get().pollCurrentlyPlaying(), 300);
        return true;
      }
    } catch (err) {
      console.error('Failed to wake Spotify device:', err);
    }
    return false;
  },

  forceSync: async () => {
    await get().fetchUserProfile();
    await get().fetchDevices();
    await get().pollCurrentlyPlaying();
  },

  startPolling: () => {
    if (pollingIntervalId) return;
    set({ isPolling: true });

    // Immediate poll
    get().pollCurrentlyPlaying();

    // High-frequency 1200ms polling for instant song-change detection
    pollingIntervalId = setInterval(() => {
      get().pollCurrentlyPlaying();
    }, 1200);

    // Attach visibility/focus listener to poll immediately when tab gains focus
    if (!listenersAttached && typeof window !== 'undefined') {
      listenersAttached = true;
      const onWake = () => {
        if (get().isAuthenticated) {
          get().pollCurrentlyPlaying();
        }
      };
      window.addEventListener('focus', onWake);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          onWake();
        }
      });
    }
  },

  stopPolling: () => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      pollingIntervalId = null;
    }
    set({ isPolling: false });
  },

  pollCurrentlyPlaying: async () => {
    const { accessToken, tokenExpiry, logout } = get();
    if (!accessToken) return;

    // Check expiry
    let validToken = accessToken;
    if (tokenExpiry && Date.now() >= tokenExpiry - 60000) {
      const storedTokens = getStoredTokens();
      if (storedTokens.refreshToken) {
        const refreshed = await refreshSpotifyToken();
        if (!refreshed) {
          logout();
          return;
        }
        validToken = refreshed;
        set({ accessToken: refreshed });
      }
    }

    try {
      let playbackData: any = null;

      const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      });

      if (res.status === 401) {
        const storedTokens = getStoredTokens();
        if (storedTokens.refreshToken) {
          const refreshed = await refreshSpotifyToken();
          if (!refreshed) {
            logout();
          } else {
            set({ accessToken: refreshed });
          }
        }
        return;
      }

      if (res.status === 403) {
        set({
          syncDiagnostic: {
            status: 'forbidden',
            message: 'Spotify API returned 403 Forbidden. Ensure your Spotify account is registered in User Management on Spotify Developer Dashboard.',
            lastUpdated: Date.now(),
          },
        });
        return;
      }

      if (res.ok && typeof res.json === 'function') {
        playbackData = await res.json();
      } else if (res.status === 204 || res.status === 202) {
        // Fallback: Query /v1/me/player to check full player state & device context
        try {
          const fullRes = await fetch('https://api.spotify.com/v1/me/player', {
            headers: { Authorization: `Bearer ${validToken}` },
          });
          if (fullRes.ok && typeof fullRes.json === 'function') {
            playbackData = await fullRes.json();
          } else if (fullRes.status === 204 || fullRes.status === 202) {
            // Both endpoints return 204: Query devices
            const devices = await get().fetchDevices();
            set({ hasActiveDevice: false });
            if (devices.length > 0) {
              set({
                syncDiagnostic: {
                  status: 'idle',
                  message: `Device "${devices[0].name}" is connected, but playback is idle in Spotify Connect.`,
                  lastUpdated: Date.now(),
                },
              });
            } else {
              set({
                syncDiagnostic: {
                  status: 'no-device',
                  message: 'No active Spotify device found. Ensure Spotify is running on your PC or phone.',
                  lastUpdated: Date.now(),
                },
              });
            }
            return;
          }
        } catch {
          set({ hasActiveDevice: false });
          return;
        }
      }

      if (playbackData && playbackData.item) {
        const item = playbackData.item;
        const now = performance.now();
        const dev = playbackData.device;
        set({
          hasActiveDevice: true,
          lastPollTimestamp: now,
          spotifyProgressMs: playbackData.progress_ms || 0,
          currentDevice: dev
            ? {
                id: dev.id,
                name: dev.name,
                type: dev.type,
                isActive: Boolean(dev.is_active),
                volumePercent: dev.volume_percent ?? 100,
              }
            : get().currentDevice,
          syncDiagnostic: {
            status: 'synced',
            message: `Live: "${item.name}" by ${item.artists?.map((a: any) => a.name).join(', ') || 'Unknown'}`,
            lastUpdated: Date.now(),
          },
        });

        const playerStore = usePlayerStore.getState();
        const currentId = playerStore.currentTrack.id;

        // If new track detected on Spotify (user changed track in Spotify app)
        if (item.id && item.id !== currentId) {
          const artistNames = item.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist';
          const albumArt = item.album?.images?.[0]?.url || '/demo/covers/neo-tokyo.svg';

          playerStore.setTrack({
            id: item.id,
            title: item.name,
            artist: artistNames,
            album: item.album?.name || '',
            albumArt: albumArt,
            durationMs: item.duration_ms,
            palette: ['#05050A', '#1E1B4B', '#7C3AED', '#38BDF8'],
            vibeTag: 'Spotify Live Stream',
            storyQuote: `${item.name} — ${artistNames}`,
            spotifyUri: item.uri,
          });

          // 1. Immediately display new track placeholder lyrics
          playerStore.setLyrics([
            { timeMs: 0, text: `♪ ${item.name} ♪` },
            { timeMs: 2000, text: `— ${artistNames} —` },
          ]);

          // 2. Query intelligent LRCLIB studio-sync engine directly for Spotify tracks
          fetchLyricsFromLrclib(item.name, artistNames, item.duration_ms / 1000).then((lyricsResult) => {
            if (usePlayerStore.getState().currentTrack.id === item.id) {
              if (lyricsResult && lyricsResult.synced.length > 0) {
                playerStore.setLyrics(lyricsResult.synced);
              } else if (lyricsResult && lyricsResult.plain) {
                const plainLines = lyricsResult.plain
                  .split(/\r?\n/)
                  .map((l) => l.trim())
                  .filter(Boolean);
                if (plainLines.length > 0) {
                  const stepMs = item.duration_ms / plainLines.length;
                  playerStore.setLyrics(
                    plainLines.map((text, i) => ({ timeMs: Math.round(i * stepMs), text }))
                  );
                }
              } else {
                playerStore.setLyrics([
                  { timeMs: 0, text: `♪ ${item.name} — ${artistNames} ♪` },
                  { timeMs: 2500, text: 'No synced lyrics found for this version' },
                ]);
              }
            }
          });
        }

        // Sync playback state smoothly
        playerStore.setIsPlaying(Boolean(playbackData.is_playing));
        playerStore.setDurationMs(item.duration_ms);

        // Drift check: Only force set currentTimeMs if drift > 1200ms or not playing
        // (preserves ultra-smooth 60fps RAF interpolation in AudioController)
        const currentProgress = playerStore.currentTimeMs;
        const drift = Math.abs(currentProgress - (playbackData.progress_ms || 0));
        if (drift > 1200 || !playbackData.is_playing) {
          playerStore.setCurrentTimeMs(playbackData.progress_ms || 0);
        }
      } else {
        set({ hasActiveDevice: false });
      }
    } catch (err) {
      console.error('Spotify poll error:', err);
    }
  },

  executePlaybackCommand: async (action, param) => {
    const { accessToken } = get();
    if (!accessToken) return false;

    let url = 'https://api.spotify.com/v1/me/player';
    let method = 'PUT';
    let body: any = null;

    if (action === 'play') {
      url = `${url}/play`;
    } else if (action === 'pause') {
      url = `${url}/pause`;
    } else if (action === 'next') {
      url = `${url}/next`;
      method = 'POST';
    } else if (action === 'previous') {
      url = `${url}/previous`;
      method = 'POST';
    } else if (action === 'seek') {
      url = `${url}/seek?position_ms=${Math.round(param || 0)}`;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (res.status === 403) {
        set({ isPremium: false, observerMode: true });
        return false;
      }

      if (res.status === 404) {
        // Device not active / asleep. Try waking available device and retry command
        const devices = await get().fetchDevices();
        if (devices.length > 0) {
          const target = devices.find((d) => d.isActive) || devices[0];
          const sep = url.includes('?') ? '&' : '?';
          const targetUrl = `${url}${sep}device_id=${target.id}`;
          const retryRes = await fetch(targetUrl, {
            method,
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
          });
          if (retryRes.ok || retryRes.status === 204) {
            setTimeout(() => get().pollCurrentlyPlaying(), 300);
            return true;
          }
        }
      }

      if (res.ok || res.status === 204) {
        // Quick poll to sync
        setTimeout(() => get().pollCurrentlyPlaying(), 250);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Spotify command failed:', err);
      return false;
    }
  },

  playTrackUri: async (spotifyUri: string) => {
    const { accessToken } = get();
    if (!accessToken) return false;

    const isContext =
      spotifyUri.startsWith('spotify:playlist:') ||
      spotifyUri.startsWith('spotify:album:') ||
      spotifyUri.startsWith('spotify:artist:');

    const body = isContext ? { context_uri: spotifyUri } : { uris: [spotifyUri] };

    try {
      let res = await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      // If 404 (no active player / device asleep), query available devices and retry
      if (res.status === 404) {
        try {
          const devRes = await fetch('https://api.spotify.com/v1/me/player/devices', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (devRes.ok) {
            const devData = await devRes.json();
            const devices = devData.devices || [];
            if (devices.length > 0) {
              const target = devices.find((d: any) => d.is_active) || devices[0];
              res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${target.id}`, {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
              });
            }
          }
        } catch (devErr) {
          console.warn('Device wake fallback error:', devErr);
        }
      }

      if (res.status === 403) {
        set({ isPremium: false, observerMode: true });
        return false;
      }

      if (res.ok || res.status === 204) {
        setTimeout(() => get().pollCurrentlyPlaying(), 400);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to play Spotify URI:', err);
      return false;
    }
  },

  fetchAndPlayItem: async (type: SpotifyItemType, id: string): Promise<boolean> => {
    const { accessToken, playTrackUri } = get();
    const playerStore = usePlayerStore.getState();

    // 1. If authenticated with Spotify, query Spotify Web API directly
    if (accessToken) {
      try {
        if (type === 'track') {
          const res = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (res.ok) {
            const track = await res.json();
            const artists = track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist';
            const albumArt = track.album?.images?.[0]?.url || '/demo/covers/neo-tokyo.svg';

            playerStore.setMode('spotify');
            playerStore.setTrack({
              id: track.id,
              title: track.name,
              artist: artists,
              album: track.album?.name || '',
              albumArt: albumArt,
              durationMs: track.duration_ms,
              palette: ['#05050A', '#1E1B4B', '#7C3AED', '#38BDF8'],
              vibeTag: 'Spotify',
              storyQuote: `${track.name} — ${artists}`,
              spotifyUri: track.uri,
            });

            // Fetch lyrics
            fetchLyricsFromLrclib(track.name, artists, track.duration_ms / 1000).then((res) => {
              if (res?.synced?.length) {
                playerStore.setLyrics(res.synced);
              }
            });

            // Attempt playback on active Spotify device
            await playTrackUri(track.uri);
            return true;
          }
        } else if (type === 'playlist' || type === 'album') {
          const endpoint = type === 'playlist' ? `playlists/${id}` : `albums/${id}`;
          const res = await fetch(`https://api.spotify.com/v1/${endpoint}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (res.ok) {
            const collection = await res.json();
            const firstItem =
              type === 'playlist'
                ? collection.tracks?.items?.[0]?.track
                : collection.tracks?.items?.[0];

            if (firstItem) {
              const artists = firstItem.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist';
              const albumArt =
                collection.images?.[0]?.url ||
                firstItem.album?.images?.[0]?.url ||
                '/demo/covers/neo-tokyo.svg';

              playerStore.setMode('spotify');
              playerStore.setTrack({
                id: firstItem.id,
                title: firstItem.name,
                artist: artists,
                album: collection.name || '',
                albumArt: albumArt,
                durationMs: firstItem.duration_ms,
                palette: ['#05050A', '#1E1B4B', '#7C3AED', '#38BDF8'],
                vibeTag: `${type === 'playlist' ? 'Playlist' : 'Album'}: ${collection.name}`,
                storyQuote: `${firstItem.name} — ${artists}`,
                spotifyUri: firstItem.uri,
              });

              fetchLyricsFromLrclib(firstItem.name, artists, firstItem.duration_ms / 1000).then((res) => {
                if (res?.synced?.length) {
                  playerStore.setLyrics(res.synced);
                }
              });
            }

            // Play context URI on device
            const contextUri = `spotify:${type}:${id}`;
            await playTrackUri(contextUri);
            return true;
          }
        }
      } catch (err) {
        console.error('Error fetching Spotify item metadata:', err);
      }
    }

    // 2. Unauthenticated fallback via Spotify oEmbed
    try {
      const oembedUrl = `https://open.spotify.com/oembed?url=https://open.spotify.com/${type}/${id}`;
      const oembedRes = await fetch(oembedUrl);
      if (oembedRes.ok) {
        const oembed = await oembedRes.json();
        const title = oembed.title || 'Spotify Track';
        const albumArt = oembed.thumbnail_url || '/demo/covers/neo-tokyo.svg';

        playerStore.setTrack({
          id: id,
          title: title,
          artist: 'Spotify',
          album: oembed.provider_name || 'Spotify',
          albumArt: albumArt,
          durationMs: 180000,
          palette: ['#05050A', '#1E1B4B', '#7C3AED', '#38BDF8'],
          vibeTag: 'Spotify Stream',
          storyQuote: title,
          spotifyUri: `spotify:${type}:${id}`,
        });

        fetchLyricsFromLrclib(title, '', 180).then((res) => {
          if (res?.synced?.length) {
            playerStore.setLyrics(res.synced);
          }
        });
        return true;
      }
    } catch (e) {
      console.warn('oEmbed lookup failed:', e);
    }

    return false;
  },
}));
