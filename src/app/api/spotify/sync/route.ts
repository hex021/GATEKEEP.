import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    // 1. Fetch user profile
    const uRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const uStatus = uRes.status;
    let uData: any = null;
    if (uRes.ok) {
      try {
        uData = await uRes.json();
      } catch {}
    }

    // 2. Fetch currently-playing
    const cpRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const cpStatus = cpRes.status;
    let cpData: any = null;
    if (cpRes.ok && cpStatus !== 204 && cpStatus !== 202) {
      try {
        cpData = await cpRes.json();
      } catch {}
    }

    // 3. Fetch full player (includes device context)
    const pRes = await fetch('https://api.spotify.com/v1/me/player', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const pStatus = pRes.status;
    let pData: any = null;
    if (pRes.ok && pStatus !== 204 && pStatus !== 202) {
      try {
        pData = await pRes.json();
      } catch {}
    }

    // 4. Fetch available devices
    const dRes = await fetch('https://api.spotify.com/v1/me/player/devices', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const dStatus = dRes.status;
    let dData: any = null;
    if (dRes.ok) {
      try {
        dData = await dRes.json();
      } catch {}
    }

    console.log('[SpotifySyncServer]', {
      user: uData?.display_name || uData?.email || `status ${uStatus}`,
      currentlyPlayingStatus: cpStatus,
      hasItemInCP: Boolean(cpData?.item),
      playerStatus: pStatus,
      hasItemInPlayer: Boolean(pData?.item),
      devicesCount: dData?.devices?.length ?? 0,
      devices: dData?.devices?.map((d: any) => `${d.name} (${d.type}, active=${d.is_active})`),
      nowPlaying: cpData?.item?.name || pData?.item?.name || 'none',
    });

    const activePlayback = cpData?.item ? cpData : pData?.item ? pData : null;

    return NextResponse.json({
      ok: true,
      currentlyPlayingStatus: cpStatus,
      playerStatus: pStatus,
      devicesStatus: dStatus,
      userStatus: uStatus,
      user: uData
        ? {
            id: uData.id,
            displayName: uData.display_name || uData.id,
            email: uData.email || '',
            image: uData.images?.[0]?.url || null,
            product: uData.product || 'free',
          }
        : null,
      devices: (dData?.devices || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        isActive: Boolean(d.is_active),
        volumePercent: d.volume_percent ?? 100,
      })),
      playback: activePlayback,
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

  try {
    let url = 'https://api.spotify.com/v1/me/player';
    let method = 'PUT';
    let reqBody: any = null;

    if (action === 'wake') {
      reqBody = { device_ids: [deviceId], play: false };
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

    console.log('[SpotifySyncServer Action]', { action, url, status: res.status });
    return NextResponse.json({ ok: res.ok || res.status === 204, status: res.status });
  } catch (err: any) {
    console.error('[SpotifySyncServer Action Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
