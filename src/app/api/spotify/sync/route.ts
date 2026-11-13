import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In-memory rate-limit cooldown tracker (capped strictly to max 5s, never hours)
let rateLimitedUntil = 0;
let cachedUserProfile: any = null;
let lastUserFetch = 0;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const isForce = req.nextUrl.searchParams.get('force') === 'true';

  if (isForce) {
    rateLimitedUntil = 0;
  }

  const now = Date.now();
  if (rateLimitedUntil > now) {
    const remainingSec = Math.ceil((rateLimitedUntil - now) / 1000);
    return NextResponse.json({
      ok: false,
      rateLimited: true,
      retryAfterSeconds: remainingSec,
      user: cachedUserProfile,
      devices: [],
      playback: null,
    });
  }

  try {
    // 1. Fetch user profile once every 5 minutes (cached)
    if (!cachedUserProfile || now - lastUserFetch > 300000 || isForce) {
      try {
        const uRes = await fetch('https://api.spotify.com/v1/me', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (uRes.status === 429) {
          const retry = Math.min(parseInt(uRes.headers.get('retry-after') || '3', 10), 5);
          rateLimitedUntil = Date.now() + retry * 1000;
          return NextResponse.json({ ok: false, rateLimited: true, retryAfterSeconds: retry });
        }
        if (uRes.ok) {
          const uData = await uRes.json();
          cachedUserProfile = {
            id: uData.id,
            displayName: uData.display_name || uData.id,
            email: uData.email || '',
            image: uData.images?.[0]?.url || null,
            product: uData.product || 'free',
          };
          lastUserFetch = now;
        }
      } catch (uErr) {
        console.warn('[SpotifySyncServer] User fetch error:', uErr);
      }
    }

    // 2. Query currently-playing (lightweight request)
    let playbackData: any = null;
    let devices: any[] = [];

    const cpRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (cpRes.status === 429) {
      const retry = Math.min(parseInt(cpRes.headers.get('retry-after') || '3', 10), 5);
      rateLimitedUntil = Date.now() + retry * 1000;
      console.warn(`[SpotifySyncServer] Rate limited (429). Cooldown: ${retry}s`);
      return NextResponse.json({
        ok: false,
        rateLimited: true,
        retryAfterSeconds: retry,
        user: cachedUserProfile,
        devices: [],
        playback: null,
      });
    }

    if (cpRes.ok && cpRes.status !== 204 && cpRes.status !== 202) {
      try {
        playbackData = await cpRes.json();
      } catch {}
    }

    // 3. Fallback: If currently-playing returned 204 or empty, try full player endpoint
    if (!playbackData?.item) {
      try {
        const pRes = await fetch('https://api.spotify.com/v1/me/player', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (pRes.ok && pRes.status !== 204 && pRes.status !== 202) {
          const pData = await pRes.json();
          if (pData?.item) {
            playbackData = pData;
          }
          if (pData?.device) {
            devices = [
              {
                id: pData.device.id,
                name: pData.device.name,
                type: pData.device.type,
                isActive: Boolean(pData.device.is_active),
                volumePercent: pData.device.volume_percent ?? 100,
              },
            ];
          }
        }
      } catch (pErr) {
        console.warn('[SpotifySyncServer] Full player fetch error:', pErr);
      }
    }

    // 4. Always fetch or update devices so user can see and wake them
    if (devices.length === 0 || isForce || !playbackData?.item) {
      try {
        const dRes = await fetch('https://api.spotify.com/v1/me/player/devices', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (dRes.ok) {
          const dData = await dRes.json();
          devices = (dData.devices || []).map((d: any) => ({
            id: d.id,
            name: d.name,
            type: d.type,
            isActive: Boolean(d.is_active),
            volumePercent: d.volume_percent ?? 100,
          }));
        }
      } catch (dErr) {
        console.warn('[SpotifySyncServer] Devices fetch error:', dErr);
      }
    }

    if (playbackData?.item) {
      console.log('[SpotifySyncServer] Synced:', playbackData.item.name);
    }

    return NextResponse.json({
      ok: true,
      rateLimited: false,
      user: cachedUserProfile,
      devices: devices,
      playback: playbackData,
    });
  } catch (err: any) {
    console.error('[SpotifySyncServer Error]', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const body = await req.json();
  const { action, param, deviceId, spotifyUri } = body;

  // Waking or controlling clears any temporary cooldown
  rateLimitedUntil = 0;

  try {
    let url = 'https://api.spotify.com/v1/me/player';
    let method = 'PUT';
    let reqBody: any = null;

    if (action === 'wake') {
      reqBody = { device_ids: [deviceId], play: true };
    } else if (action === 'play') {
      url = `${url}/play${deviceId ? `?device_id=${deviceId}` : ''}`;
      if (spotifyUri) {
        const isContext =
          spotifyUri.startsWith('spotify:playlist:') ||
          spotifyUri.startsWith('spotify:album:') ||
          spotifyUri.startsWith('spotify:artist:');
        reqBody = isContext ? { context_uri: spotifyUri } : { uris: [spotifyUri] };
      }
    } else if (action === 'pause') {
      url = `${url}/pause${deviceId ? `?device_id=${deviceId}` : ''}`;
    } else if (action === 'next') {
      url = `${url}/next${deviceId ? `?device_id=${deviceId}` : ''}`;
      method = 'POST';
    } else if (action === 'previous') {
      url = `${url}/previous${deviceId ? `?device_id=${deviceId}` : ''}`;
      method = 'POST';
    } else if (action === 'seek') {
      url = `${url}/seek?position_ms=${Math.round(param || 0)}`;
    }

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: reqBody ? JSON.stringify(reqBody) : undefined,
    });

    if (res.status === 429) {
      const retry = Math.min(parseInt(res.headers.get('retry-after') || '3', 10), 5);
      rateLimitedUntil = Date.now() + retry * 1000;
    }

    return NextResponse.json({ ok: res.ok || res.status === 204, status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
