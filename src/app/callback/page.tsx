'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeCodeForTokens } from '@/lib/spotifyAuth';
import { useSpotifyStore } from '@/stores/useSpotifyStore';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'exchanging' | 'success' | 'error'>('exchanging');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initAuth = useSpotifyStore((s) => s.initAuth);
  const setMode = usePlayerStore((s) => s.setMode);

  useEffect(() => {
    const code = searchParams?.get('code');
    const error = searchParams?.get('error');

    if (error) {
      setStatus('error');
      setErrorMessage(`Spotify authorization was denied: ${error}`);
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMessage('No authorization code found in callback URL.');
      return;
    }

    let isMounted = true;

    async function handleExchange() {
      try {
        await exchangeCodeForTokens(code!);
        if (!isMounted) return;

        initAuth();
        setMode('spotify');
        setStatus('success');

        // Redirect back home after a brief delay
        setTimeout(() => {
          router.replace('/');
        }, 1200);
      } catch (err: any) {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(err.message || 'Failed to exchange authorization code for tokens.');
      }
    }

    handleExchange();

    return () => {
      isMounted = false;
    };
  }, [searchParams, router, initAuth, setMode]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center px-4">
      {status === 'exchanging' && (
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
          <h2 className="text-xl font-semibold text-white">Connecting to Spotify...</h2>
          <p className="text-sm text-neutral-400">Exchanging secure PKCE tokens with Spotify Accounts.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center space-y-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
          <h2 className="text-xl font-semibold text-white">Connected Successfully!</h2>
          <p className="text-sm text-neutral-400">Switching to Spotify Live Sync mode. Redirecting...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center space-y-4 p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <h2 className="text-xl font-semibold text-white">Connection Failed</h2>
          <p className="text-sm text-red-200">{errorMessage}</p>
          <button
            onClick={() => router.replace('/')}
            className="mt-4 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors"
          >
            Return to VibeSync
          </button>
        </div>
      )}
    </div>
  );
}

export default function CallbackPage() {
  return (
    <div className="min-h-screen bg-[#05050A] text-white flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
            <p className="text-sm text-neutral-400">Loading authorization...</p>
          </div>
        }
      >
        <CallbackContent />
      </Suspense>
    </div>
  );
}
