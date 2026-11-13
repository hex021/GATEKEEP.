export interface LyricLine {
  timeMs: number;
  text: string;
}

export interface LrcResponse {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string;
  syncedLyrics: string | null;
}

/**
 * Robust LRC timestamp parser.
 * Handles both 2-digit [mm:ss.xx] and 3-digit [mm:ss.xxx] sub-seconds,
 * multi-timestamp lines, ignores metadata tags like [ar:...],
 * and returns chronologically sorted lyrics.
 */
export function parseLrc(lrcText: string): LyricLine[] {
  if (!lrcText) return [];

  const lines: LyricLine[] = [];
  const tagRegex = /\[(\d{2,}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  for (const rawLine of lrcText.split(/\r?\n|\r/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || /^\[[a-zA-Z]+:/.test(trimmed)) continue;

    const matches = Array.from(trimmed.matchAll(tagRegex));
    if (matches.length === 0) continue;

    const text = trimmed.replace(tagRegex, '').trim();
    if (!text) continue;

    for (const match of matches) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const sub = match[3] ? match[3].padEnd(3, '0').slice(0, 3) : '000';
      const timeMs = min * 60000 + sec * 1000 + parseInt(sub, 10);
      lines.push({ timeMs, text });
    }
  }

  return lines.sort((a, b) => a.timeMs - b.timeMs);
}

/**
 * Binary search active line detector with O(log N) lookup.
 * Applies optional manual sync offset [-500ms, +500ms].
 * When duplicate timestamps exist, returns the latest occurrence.
 */
export function findActiveLyricIndex(
  lyrics: LyricLine[],
  currentTimeMs: number,
  syncOffsetMs: number = 0
): number {
  if (!lyrics || lyrics.length === 0) return -1;
  const effectiveTime = currentTimeMs + syncOffsetMs;

  if (effectiveTime < lyrics[0].timeMs) return -1;

  let low = 0;
  let high = lyrics.length - 1;
  let result = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lyrics[mid].timeMs <= effectiveTime) {
      result = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return result;
}


/**
 * Cleans track titles from Spotify/streaming noise:
 * removes "(feat. ...)", "[feat. ...]", "- Remastered...", "- Radio Edit", etc.
 */
export function cleanTrackTitle(title: string): string {
  if (!title) return '';
  return title
    .replace(/\s*(\(|\[)\s*(feat\.?|ft\.?)\s+[^)\]]+(\)|\])/gi, '')
    .replace(/\s+(feat\.?|ft\.?)\s+.+$/gi, '')
    .replace(/\s*-\s*(\d{4}\s+)?(remaster(ed)?(\s*\d+)?|bonus\s*track|radio\s*edit|acoustic|deluxe(\s*edition)?|live(\s*at\s*[^)]+)?|single\s*version|album\s*version|mono|stereo).*/gi, '')
    .replace(/\s*(\(|\[)\s*(\d{4}\s+)?(remaster(ed)?(\s*\d+)?|bonus\s*track|radio\s*edit|acoustic|deluxe(\s*edition)?|live(\s*at\s*[^)]+)?|from\s+[^)\]]+|soundtrack\s*version)(\)|\])/gi, '')
    .trim();
}

/**
 * Extracts primary artist name (e.g., "The Weeknd, Daft Punk" -> "The Weeknd")
 */
export function cleanArtistName(artist: string): string {
  if (!artist) return '';
  return artist.split(/[,;/]|(\s+feat\.?\s+)|(\s+ft\.?\s+)/i)[0].trim();
}

/**
 * Query LRCLIB for synced lyrics with intelligent title sanitization,
 * duration proximity ranking, and studio version filtering.
 */
export async function fetchLyricsFromLrclib(
  trackName: string,
  artistName: string,
  durationSeconds?: number
): Promise<{ synced: LyricLine[]; plain?: string } | null> {
  try {
    const cleanTitle = cleanTrackTitle(trackName);
    const primaryArtist = cleanArtistName(artistName);

    // 1. Try exact match with duration
    const params = new URLSearchParams({
      track_name: cleanTitle,
      artist_name: primaryArtist,
    });
    if (durationSeconds && durationSeconds > 0) {
      params.set('duration', Math.round(durationSeconds).toString());
    }

    let res = await fetch(`https://lrclib.net/api/get?${params.toString()}`, {
      headers: {
        'User-Agent': 'VibeSync/1.0 (https://github.com/vibesync)',
      },
    });

    // 2. If exact match with duration failed (due to album/single duration delta), try without duration parameter
    if (!res.ok && durationSeconds) {
      params.delete('duration');
      res = await fetch(`https://lrclib.net/api/get?${params.toString()}`, {
        headers: {
          'User-Agent': 'VibeSync/1.0 (https://github.com/vibesync)',
        },
      });
    }

    // Also try with original trackName if cleanTitle differed
    if (!res.ok && cleanTitle !== trackName) {
      const origParams = new URLSearchParams({
        track_name: trackName,
        artist_name: primaryArtist,
      });
      res = await fetch(`https://lrclib.net/api/get?${origParams.toString()}`, {
        headers: {
          'User-Agent': 'VibeSync/1.0 (https://github.com/vibesync)',
        },
      });
    }

    if (res.ok) {
      const data: LrcResponse = await res.json();
      if (data.syncedLyrics) {
        return {
          synced: parseLrc(data.syncedLyrics),
          plain: data.plainLyrics,
        };
      }
    }

    // 3. Fallback: Query search endpoint with ranked filtering
    const searchQueries = [
      `${primaryArtist} ${cleanTitle}`,
      cleanTitle,
      `${artistName} ${trackName}`,
    ];

    for (const query of searchQueries) {
      const searchRes = await fetch(
        `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            'User-Agent': 'VibeSync/1.0 (https://github.com/vibesync)',
          },
        }
      );

      if (searchRes.ok) {
        const results: LrcResponse[] = await searchRes.json();
        const syncedResults = results.filter((r) => r.syncedLyrics);

        if (syncedResults.length > 0) {
          // Rank candidates: closest duration, clean title match, penalize video/live
          syncedResults.sort((a, b) => {
            const diffA = durationSeconds ? Math.abs(a.duration - durationSeconds) : 0;
            const diffB = durationSeconds ? Math.abs(b.duration - durationSeconds) : 0;

            const badA = /video|official\s*video|live|acoustic|remix|slowed/i.test(a.trackName) ? 80 : 0;
            const badB = /video|official\s*video|live|acoustic|remix|slowed/i.test(b.trackName) ? 80 : 0;

            const titleMatchA = a.trackName.toLowerCase() === cleanTitle.toLowerCase() ? -30 : 0;
            const titleMatchB = b.trackName.toLowerCase() === cleanTitle.toLowerCase() ? -30 : 0;

            return (diffA + badA + titleMatchA) - (diffB + badB + titleMatchB);
          });

          const best = syncedResults[0];
          if (best && best.syncedLyrics) {
            return {
              synced: parseLrc(best.syncedLyrics),
              plain: best.plainLyrics,
            };
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch from LRCLIB:', error);
    return null;
  }
}
