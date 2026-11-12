import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024; // 10MB limit (Feature 30 boundary)

/**
 * Validates a remote image URL against SSRF attacks:
 * - Checks valid http: / https: protocol
 * - Blocks loopback (127.0.0.1, localhost, 0.0.0.0, ::1)
 * - Blocks IPv4 RFC 1918 private subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
 * - Blocks link-local (169.254.0.0/16) and cloud metadata (169.254.169.254, metadata.google.internal)
 * - Blocks octal/hexadecimal and IPv4-mapped IPv6 bypasses (0x..., 0177..., ::ffff:)
 */
function isSafeImageUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const rawHost = parsed.hostname.toLowerCase();
    const host = rawHost.replace(/^\[|\]$/g, '');

    // Block common localhost / loopback aliases
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '0.0.0.0'
    ) {
      return false;
    }

    // Block octal, hex, and IPv4-mapped IPv6 bypasses
    if (
      host.includes('127.0.0.1') ||
      host.startsWith('::ffff:') ||
      host.startsWith('0x') ||
      host.startsWith('0177')
    ) {
      return false;
    }

    // Block cloud metadata endpoints
    if (
      host === 'metadata.google.internal' ||
      host === '169.254.169.254'
    ) {
      return false;
    }

    // IPv4 RFC 1918 and link-local regex check
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = host.match(ipv4Regex);
    if (match) {
      const octet1 = parseInt(match[1], 10);
      const octet2 = parseInt(match[2], 10);
      const octet3 = parseInt(match[3], 10);
      const octet4 = parseInt(match[4], 10);

      if (
        octet1 > 255 ||
        octet2 > 255 ||
        octet3 > 255 ||
        octet4 > 255
      ) {
        return false;
      }

      if (octet1 === 10) return false; // 10.0.0.0/8
      if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return false; // 172.16.0.0/12
      if (octet1 === 192 && octet2 === 168) return false; // 192.168.0.0/16
      if (octet1 === 127) return false; // Loopback
      if (octet1 === 169 && octet2 === 254) return false; // Link-local
      if (octet1 === 0) return false; // 0.0.0.0/8
    }

    return true;
  } catch {
    return false;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl || !isSafeImageUrl(imageUrl)) {
    return NextResponse.json(
      { error: 'Invalid or unsafe image URL' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const upstreamResponse = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'VibeSync-ImageProxy/1.0',
        Accept: 'image/jpeg,image/png,image/webp,image/svg+xml,image/*;q=0.8',
      },
    });

    clearTimeout(timeoutId);

    // If upstream returns an error status (e.g. 404, 500), return 502 Bad Gateway
    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { error: `Upstream fetch failed with status ${upstreamResponse.status}` },
        { status: 502, headers: CORS_HEADERS }
      );
    }

    const rawContentType = upstreamResponse.headers.get('content-type') || '';
    const contentType = rawContentType.split(';')[0].trim().toLowerCase();

    // Verify it is actually an image content type
    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        { error: `Invalid content-type: ${rawContentType}. Expected image/*` },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Check Content-Length header against 10MB limit
    const contentLength = parseInt(upstreamResponse.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_PAYLOAD_SIZE) {
      return NextResponse.json(
        { error: 'Payload too large (>10MB)' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const arrayBuffer = await upstreamResponse.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_PAYLOAD_SIZE) {
      return NextResponse.json(
        { error: 'Payload too large (>10MB)' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${contentType};base64,${base64Data}`;

    return NextResponse.json(
      {
        dataUrl,
        contentType,
        sizeBytes: arrayBuffer.byteLength,
      },
      {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
        },
      }
    );
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      { error: isAbort ? 'Upstream request timed out' : 'Failed to proxy image' },
      { status: 502, headers: CORS_HEADERS }
    );
  }
}
