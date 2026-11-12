import { test, expect } from '../helpers/test-harness.mjs';
import { parseSpotifyUrl } from '../../src/lib/spotifyUrl.ts';
import { VISUALIZER_THEMES, getThemeMeta } from '../../src/components/visualizer/themes/ThemeRegistry.ts';
import { useSpotifyStore } from '../../src/stores/useSpotifyStore.ts';
import { usePlayerStore } from '../../src/stores/usePlayerStore.ts';

test('parseSpotifyUrl: successfully extracts track IDs with localized intl paths', () => {
  const url1 = 'https://open.spotify.com/intl-de/track/4cOdK2wGLETKBW3PvgPWqT?si=b303490710604b9c';
  const res1 = parseSpotifyUrl(url1);
  expect(res1).not.toBe(null);
  expect(res1.type).toBe('track');
  expect(res1.id).toBe('4cOdK2wGLETKBW3PvgPWqT');
  expect(res1.uri).toBe('spotify:track:4cOdK2wGLETKBW3PvgPWqT');
});

test('parseSpotifyUrl: successfully extracts playlist IDs with localized intl paths and query params', () => {
  const url = 'https://open.spotify.com/intl-fr/playlist/37i9dQZF1DXcBWIGoYBM5M?si=e7f02ecbe7384ec1';
  const res = parseSpotifyUrl(url);
  expect(res).not.toBe(null);
  expect(res.type).toBe('playlist');
  expect(res.id).toBe('37i9dQZF1DXcBWIGoYBM5M');
  expect(res.uri).toBe('spotify:playlist:37i9dQZF1DXcBWIGoYBM5M');
});

test('parseSpotifyUrl: successfully extracts album IDs and standard web URLs', () => {
  const url = 'https://open.spotify.com/album/4SZko61aMnmgvEGfhgY7ig';
  const res = parseSpotifyUrl(url);
  expect(res).not.toBe(null);
  expect(res.type).toBe('album');
  expect(res.id).toBe('4SZko61aMnmgvEGfhgY7ig');
});

test('parseSpotifyUrl: successfully handles raw spotify: URI format', () => {
  const uri = 'spotify:track:7qiZfU4dY1lWllzX7mPBI3';
  const res = parseSpotifyUrl(uri);
  expect(res).not.toBe(null);
  expect(res.type).toBe('track');
  expect(res.id).toBe('7qiZfU4dY1lWllzX7mPBI3');
});

test('ThemeRegistry: total theme count is 16 and getThemeMeta correctly looks up metadata', () => {
  expect(VISUALIZER_THEMES).toHaveLength(16);
  const swiss = getThemeMeta('swiss-editorial');
  expect(swiss).not.toBe(undefined);
  expect(swiss.name).toBe('Swiss Editorial');
  expect(swiss.accentColor).toBe('#FF3B30');

  const glitch = getThemeMeta('glitchcore');
  expect(glitch).not.toBe(undefined);
  expect(glitch.accentColor).toBe('#00F0FF');

  const constellation = getThemeMeta('constellation');
  expect(constellation).not.toBe(undefined);
  expect(constellation.name).toBe('Constellation');
  expect(constellation.accentColor).toBe('#E2B857');
  expect(constellation.category).toBe('Atmospheric');
});

test('useSpotifyStore: initAuth automatically switches to spotify mode when credentials exist', () => {
  useSpotifyStore.getState().setToken('mock_access_token_123', 3600);
  
  const player = usePlayerStore.getState();
  const spotify = useSpotifyStore.getState();
  expect(player.mode).toBe('spotify');
  expect(spotify.isAuthenticated).toBe(true);
  expect(spotify.isPolling).toBe(true);

  spotify.stopPolling();
});
