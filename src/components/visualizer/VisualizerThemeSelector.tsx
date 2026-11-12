'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore, VisualizerMode } from '@/stores/usePlayerStore';
import { VISUALIZER_THEMES, ThemeMeta } from './themes/ThemeRegistry';
import { playModeWhoosh, playMechanicalClick } from '@/lib/soundFx';
import { X, Search, Sparkles, Check } from 'lucide-react';

interface VisualizerThemeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VisualizerThemeSelector({ isOpen, onClose }: VisualizerThemeSelectorProps) {
  const visualizerMode = usePlayerStore((s) => s.visualizerMode);
  const setVisualizerMode = usePlayerStore((s) => s.setVisualizerMode);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Experimental', 'Editorial', 'Retro', 'Atmospheric', 'Minimal'];

  const filteredThemes = VISUALIZER_THEMES.filter((t) => {
    const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tagline.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleSelectTheme = (id: VisualizerMode) => {
    playModeWhoosh();
    setVisualizerMode(id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-4xl max-h-[85vh] bg-[#0C0C0E] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Sparkles size={16} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold font-sans tracking-tight text-white">
                  Visualizer Theme Engines
                </h3>
                <p className="text-xs font-mono text-neutral-400">
                  Select from {VISUALIZER_THEMES.length} kinetic typography experiences
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                playMechanicalClick();
                onClose();
              }}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="px-4 sm:px-6 py-3 border-b border-white/10 flex flex-col sm:flex-row gap-3 items-center justify-between bg-black/40">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search themes..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar py-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-white text-black font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 no-scrollbar">
            {filteredThemes.map((th) => {
              const isActive = visualizerMode === th.id;

              return (
                <div
                  key={th.id}
                  onClick={() => handleSelectTheme(th.id as VisualizerMode)}
                  className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                    isActive
                      ? 'border-white bg-white/10 shadow-lg'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.05]'
                  }`}
                >
                  {/* Color Accent Indicator Strip */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: th.accentColor }}
                  />

                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-2 mt-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                      {th.category}
                    </span>
                    {isActive && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-300 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-400/40">
                        <Check size={10} />
                        ACTIVE
                      </span>
                    )}
                  </div>

                  {/* Title & Tagline */}
                  <div className="mb-3">
                    <h4 className="text-sm font-bold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                      {th.name}
                    </h4>
                    <p className="text-xs text-neutral-400 leading-snug mt-1 font-sans">
                      {th.tagline}
                    </p>
                  </div>

                  {/* Preview Banner */}
                  <div
                    className={`h-12 w-full rounded-lg ${th.bgPreviewClass} flex items-center justify-center p-2 relative overflow-hidden`}
                  >
                    <span
                      className="text-xs font-black tracking-widest uppercase truncate max-w-full"
                      style={{ color: th.accentColor }}
                    >
                      {th.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs font-mono text-neutral-400">
            <span>Press 'V' to cycle themes at any time</span>
            <span>ESC to close</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default VisualizerThemeSelector;
