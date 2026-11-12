/**
 * Universal Spotify URL & URI parser.
 * Handles:
 * - https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=...
 * - https://open.spotify.com/intl-de/track/4cOdK2wGLETKBW3PvgPWqT
 * - https://open.spotify.com/intl-fr/playlist/37i9dQZF1DXcBWIGoYBM5M?si=...
 * - https://open.spotify.com/album/4SZko61aMnmgvEGfhgY7ig
 * - spotify:track:4cOdK2wGLETKBW3PvgPWqT
 * - spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
 * - spotify:album:4SZko61aMnmgvEGfhgY7ig
 * - Raw 22-character Spotify alphanumeric IDs
 */

export type SpotifyItemType = 'track' | 'playlist' | 'album' | 'artist';

export interface ParsedSpotifyEntity {
  type: SpotifyItemType;
  id: string;
  uri: string;
}

export function parseSpotifyUrl(input: string): ParsedSpotifyEntity | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Regex handles both standard and localized open.spotify.com/intl-xx/(track|playlist|album|artist)
  // as well as spotify:(track|playlist|album|artist):id
  const match = trimmed.match(
    /(?:spotify\.com(?:\/intl-[a-zA-Z-]+)?\/(playlist|track|album|artist)|spotify:(playlist|track|album|artist))[:\/]([a-zA-Z0-9]+)/i
  );

  if (match) {
    const type = (match[1] || match[2]).toLowerCase() as SpotifyItemType;
    const id = match[3];
    return {
      type,
      id,
      uri: `spotify:${type}:${id}`,
    };
  }

  // Fallback for raw 22-character Spotify IDs (assumed track)
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
    return {
      type: 'track',
      id: trimmed,
      uri: `spotify:track:${trimmed}`,
    };
  }

  return null;
}
