const CLIENT_ID_STORAGE_KEY = 'vibesync_spotify_client_id';
const VERIFIER_STORAGE_KEY = 'spotify_code_verifier';
const STATE_STORAGE_KEY = 'spotify_auth_state';
const ACCESS_TOKEN_KEY = 'spotify_access_token';
const REFRESH_TOKEN_KEY = 'spotify_refresh_token';
const EXPIRY_KEY = 'spotify_token_expiry';

export const SPOTIFY_SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-email',
  'user-read-private',
].join(' ');

export function getStoredClientId(): string {
  if (typeof window === 'undefined') return '';
  const local = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
  if (local && local.trim().length > 0) return local.trim();
  return process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '';
}

export function setStoredClientId(clientId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId.trim());
}

export function getRedirectUri(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://127.0.0.1:3000/callback';
  }
  // Enforce Spotify's security requirement (2025): replace localhost with explicit loopback 127.0.0.1
  const origin = window.location.origin.replace('//localhost', '//127.0.0.1');
  return `${origin}/callback`;
}

export function generateCodeVerifier(length = 64): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(randomValues);
  } else {
    for (let i = 0; i < length; i++) {
      randomValues[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(randomValues)
    .map((x) => possible[x % possible.length])
    .join('');
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);

  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return base64;
}

export async function initiateSpotifyLogin(customClientId?: string): Promise<void> {
  const clientId = (customClientId || getStoredClientId()).trim();
  if (!clientId) {
    throw new Error('Spotify Client ID is required to initiate login');
  }

  const verifier = generateCodeVerifier(64);
  const challenge = await generateCodeChallenge(verifier);
  const state = generateCodeVerifier(16);

  localStorage.setItem(VERIFIER_STORAGE_KEY, verifier);
  localStorage.setItem(STATE_STORAGE_KEY, state);

  const redirectUri = getRedirectUri();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SPOTIFY_SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    redirect_uri: redirectUri,
    state: state,
    show_dialog: 'true',
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const clientId = getStoredClientId();
  const verifier = localStorage.getItem(VERIFIER_STORAGE_KEY);
  const redirectUri = getRedirectUri();

  if (!clientId || !verifier) {
    throw new Error('Missing Client ID or Code Verifier for Spotify token exchange');
  }

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Spotify token exchange failed (${response.status}): ${errorText}`);
  }

  const data: TokenResponse = await response.json();

  // Save tokens to localStorage
  const expiry = Date.now() + data.expires_in * 1000;
  localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
  if (data.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  }
  localStorage.setItem(EXPIRY_KEY, expiry.toString());

  // Clean up verifier
  localStorage.removeItem(VERIFIER_STORAGE_KEY);
  localStorage.removeItem(STATE_STORAGE_KEY);

  return data;
}

export async function refreshSpotifyToken(): Promise<string | null> {
  const clientId = getStoredClientId();
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;

  if (!clientId || !refreshToken) {
    return null;
  }

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      console.warn('Failed to refresh Spotify token');
      return null;
    }

    const data: TokenResponse = await response.json();
    const expiry = Date.now() + data.expires_in * 1000;
    localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
    if (data.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
    }
    localStorage.setItem(EXPIRY_KEY, expiry.toString());

    return data.access_token;
  } catch (err) {
    console.error('Error refreshing Spotify token:', err);
    return null;
  }
}

export function getStoredTokens() {
  if (typeof window === 'undefined') return { accessToken: null, refreshToken: null, expiry: null };
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const expiryStr = localStorage.getItem(EXPIRY_KEY);
  const expiry = expiryStr ? parseInt(expiryStr, 10) : null;
  return { accessToken, refreshToken, expiry };
}

export function clearStoredTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}
