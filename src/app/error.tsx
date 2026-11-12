'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Router segment error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#05050A] text-white flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full bg-white/[0.03] border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4 text-violet-400">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-bold tracking-tight text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-neutral-400 mb-6">
          {error.message || 'An unexpected application error occurred.'}
        </p>

        {error.digest && (
          <p className="text-xs font-mono text-neutral-500 mb-6 bg-black/40 px-3 py-1.5 rounded-md border border-white/5">
            Digest: {error.digest}
          </p>
        )}

        <div className="flex items-center gap-3 w-full">
          <button
            onClick={() => reset()}
            className="flex-1 px-4 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-semibold text-xs tracking-wider uppercase transition shadow-lg shadow-violet-600/20"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="flex-1 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/15 text-white font-semibold text-xs tracking-wider uppercase transition text-center"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
