'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('[VibeSync PWA] ServiceWorker registered with scope:', registration.scope);
            }
          })
          .catch((error) => {
            console.warn('[VibeSync PWA] ServiceWorker registration failed:', error);
          });
      });
    }
  }, []);

  return null;
}
