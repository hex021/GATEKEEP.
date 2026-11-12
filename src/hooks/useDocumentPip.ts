'use client';

import { useState, useCallback, useEffect } from 'react';
import { useStudyStore } from '@/stores/useStudyStore';

export function useDocumentPip() {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' && 'documentPictureInPicture' in window);
  }, []);

  // Cleanup on unmount if floating window is still open
  useEffect(() => {
    return () => {
      if (pipWindow) {
        try {
          pipWindow.close();
        } catch {}
        useStudyStore.getState().setPipActive(false);
      }
    };
  }, [pipWindow]);

  const openPip = useCallback(
    async (width = 400, height = 260) => {
      if (!isSupported || pipWindow) return;

      try {
        // Request floating OS Document PiP window
        // @ts-ignore - Document Picture-in-Picture API is Chromium standard
        const pip = await window.documentPictureInPicture.requestWindow({
          width,
          height,
        });

        // Copy all Next.js dev and production stylesheets and inline styles into PiP head
        document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
          try {
            pip.document.head.appendChild(node.cloneNode(true));
          } catch {
            // Safely ignore detached or cross-origin styles
          }
        });

        // Set dark background on document body
        pip.document.body.style.margin = '0';
        pip.document.body.style.padding = '0';
        pip.document.body.style.backgroundColor = '#05050A';
        pip.document.body.style.overflow = 'hidden';

        // Handle user closing the floating OS window
        pip.addEventListener('pagehide', () => {
          setPipWindow(null);
          useStudyStore.getState().setPipActive(false);
        });

        setPipWindow(pip);
        useStudyStore.getState().setPipActive(true);
      } catch (err) {
        console.error('Failed to open Document Picture-in-Picture:', err);
        useStudyStore.getState().setPipActive(false);
      }
    },
    [isSupported, pipWindow]
  );

  const closePip = useCallback(() => {
    if (pipWindow) {
      try {
        pipWindow.close();
      } catch {}
      setPipWindow(null);
      useStudyStore.getState().setPipActive(false);
    }
  }, [pipWindow]);

  return { isSupported, pipWindow, openPip, closePip };
}
