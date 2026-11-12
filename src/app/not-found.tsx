'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#05050A] text-white flex flex-col items-center justify-center p-6 text-center select-none">
      <h1 className="text-4xl font-extrabold tracking-tight mb-2">404</h1>
      <p className="text-sm text-neutral-400 mb-8">
        This page could not be found.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-full bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-white/90 transition shadow-lg"
      >
        Return Home
      </Link>
    </div>
  );
}
