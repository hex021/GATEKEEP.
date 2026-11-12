'use client';

import React, { useEffect } from 'react';
import { X, Keyboard, Command, Sparkles, Timer, Play, SlidersHorizontal, MousePointerClick, Maximize2, Volume2, FastForward } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    {
      key: 'Space',
      description: 'Play / Pause music playback',
      icon: <Play size={15} className="text-white" />,
    },
    {
      key: 'S',
      description: 'Toggle Zen Study HUD (Pomodoro & Ambient sounds)',
      icon: <Timer size={15} className="text-cyan-400" />,
    },
    {
      key: 'V',
      description: 'Cycle Visualizer Mode (Reel Video Edit / Spatial / Cyber)',
      icon: <Sparkles size={15} className="text-pink-400" />,
    },
    {
      key: 'F',
      description: 'Toggle Immersive Fullscreen Mode',
      icon: <Maximize2 size={15} className="text-cyan-300" />,
    },
    {
      key: '⌘K / Ctrl+K',
      description: 'Open Command Bar to search or paste Spotify URLs',
      icon: <Command size={15} className="text-violet-400" />,
    },
    {
      key: 'Click on Lyric',
      description: 'Click any lyric line to seek directly to that timestamp',
      icon: <MousePointerClick size={15} className="text-emerald-400" />,
    },
    {
      key: 'Sync Offset / [ or ]',
      description: 'Nudge lyrics timing (-500ms to +500ms) by 100ms',
      icon: <SlidersHorizontal size={15} className="text-amber-400" />,
    },
    {
      key: '← / →',
      description: 'Seek playback backward / forward by 5s',
      icon: <FastForward size={15} className="text-cyan-400" />,
    },
    {
      key: '↑ / ↓',
      description: 'Adjust master volume up / down by 10%',
      icon: <Volume2 size={15} className="text-emerald-400" />,
    },
    {
      key: 'M',
      description: 'Toggle mute / unmute audio',
      icon: <Volume2 size={15} className="text-rose-400" />,
    },
    {
      key: 'Esc',
      description: 'Close active modal or exit Zen Study HUD',
      icon: <X size={15} className="text-rose-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md bg-neutral-950/95 border border-white/10 rounded-3xl p-6 text-white shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <Keyboard size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Keyboard Shortcuts</h3>
              <p className="text-xs text-neutral-400">Pro-tips for fluid navigation in VibeSync</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="flex flex-col gap-2.5">
          {shortcuts.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">{item.icon}</div>
                <span className="text-xs text-neutral-300">{item.description}</span>
              </div>
              <kbd className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 font-mono text-[11px] font-semibold text-neutral-200 shadow-sm flex-shrink-0">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-300">?</kbd> anytime to open</span>
          <span className="text-cyan-400">VibeSync v1.0</span>
        </div>
      </div>
    </div>
  );
}
