'use client';

import React from 'react';
import { LyricLine } from '@/lib/lrclib';

export interface VisualizerThemeProps {
  lyrics?: LyricLine[];
  onLineClick?: (timeMs: number) => void;
  className?: string;
  isStoryMode?: boolean;
}

export type ThemeId =
  | 'video-edit'
  | 'cyberpunk'
  | 'xerox-89'
  | 'thermal-flir'
  | 'apple-spatial'
  | 'glitchcore'
  | 'swiss-editorial'
  | 'vhs-memory'
  | 'liquid-type'
  | 'void'
  | 'riot-zone'
  | 'heartbreak'
  | 'bouncing-ball'
  | 'mirror-world'
  | 'emotional-damage'
  | 'newspaper'
  | 'constellation';

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  category: 'Experimental' | 'Editorial' | 'Retro' | 'Minimal' | 'Atmospheric';
  tagline: string;
  accentColor: string;
  bgPreviewClass: string;
}

export const VISUALIZER_THEMES: ThemeMeta[] = [
  // Core Legacy Themes
  {
    id: 'video-edit',
    name: 'Velocity 3D',
    category: 'Experimental',
    tagline: 'After Effects Camera Rig & Brutalist Kinetic Typography',
    accentColor: '#FF003C',
    bgPreviewClass: 'bg-gradient-to-br from-purple-900 to-black',
  },
  {
    id: 'cyberpunk',
    name: 'CRT Cathode',
    category: 'Retro',
    tagline: 'Analog VHS Tear, Trinitron Cyan Phosphor & Halation',
    accentColor: '#00FFAA',
    bgPreviewClass: 'bg-gradient-to-br from-emerald-950 to-black',
  },
  {
    id: 'xerox-89',
    name: 'Xerox 89',
    category: 'Retro',
    tagline: '1-Bit Floyd-Steinberg Dither & Ransom Note Cutouts',
    accentColor: '#F4F4F4',
    bgPreviewClass: 'bg-neutral-900',
  },
  {
    id: 'thermal-flir',
    name: 'Thermal FLIR',
    category: 'Atmospheric',
    tagline: 'Ironbow Luma WebGL Shader & Dissipation Shockwaves',
    accentColor: '#FF7800',
    bgPreviewClass: 'bg-gradient-to-br from-red-950 via-purple-950 to-black',
  },

  // The 11 New Distinct Themes
  {
    id: 'glitchcore',
    name: 'Glitchcore',
    category: 'Experimental',
    tagline: 'RGB Channel Separation, Data Corruption & Signal Tearing',
    accentColor: '#00F0FF',
    bgPreviewClass: 'bg-black border border-cyan-500/30',
  },
  {
    id: 'swiss-editorial',
    name: 'Swiss Editorial',
    category: 'Editorial',
    tagline: 'Asymmetric Modernist Grid, Vermillion Accent & Grotesk Type',
    accentColor: '#FF3B30',
    bgPreviewClass: 'bg-neutral-950 border border-neutral-700',
  },
  {
    id: 'vhs-memory',
    name: 'VHS Memory',
    category: 'Retro',
    tagline: 'Camcorder OSD, Tracking Artifacts & Faded Tape Subtitles',
    accentColor: '#FFF8B0',
    bgPreviewClass: 'bg-[#0A0D14] border border-yellow-500/20',
  },
  {
    id: 'liquid-type',
    name: 'Liquid Type',
    category: 'Experimental',
    tagline: 'Viscous SVG Displacement, Caustic Ripples & Elastic Letterforms',
    accentColor: '#A855F7',
    bgPreviewClass: 'bg-[#080312] border border-purple-500/30',
  },
  {
    id: 'void',
    name: 'Void',
    category: 'Minimal',
    tagline: 'Abyssal Black, Negative Space, Celestial Dust & Weightless Drift',
    accentColor: '#E2E8F0',
    bgPreviewClass: 'bg-black border border-white/10',
  },
  {
    id: 'riot-zone',
    name: 'Riot Zone',
    category: 'Experimental',
    tagline: 'Punk DIY Fanzine, Torn Paper Cutouts, Tape & Rebel Collage',
    accentColor: '#E60000',
    bgPreviewClass: 'bg-[#181818] border border-red-600/40',
  },
  {
    id: 'heartbreak',
    name: 'Heartbreak',
    category: 'Atmospheric',
    tagline: 'Parchment Texture, Handwritten Ink Confessions & Fading Serif',
    accentColor: '#C49B74',
    bgPreviewClass: 'bg-[#14100D] border border-amber-800/30',
  },
  {
    id: 'bouncing-ball',
    name: 'Bouncing Ball',
    category: 'Retro',
    tagline: 'Classic Sing-Along Highlighting & Physics Bouncing Orb',
    accentColor: '#FFD700',
    bgPreviewClass: 'bg-[#060A18] border border-yellow-400/40',
  },
  {
    id: 'mirror-world',
    name: 'Mirror World',
    category: 'Experimental',
    tagline: 'Bilateral Symmetry, Chromatic Ripple & Water Reflection Plane',
    accentColor: '#38BDF8',
    bgPreviewClass: 'bg-[#040810] border border-sky-400/30',
  },
  {
    id: 'emotional-damage',
    name: 'Emotional Damage',
    category: 'Atmospheric',
    tagline: 'Psychological Dissociation, Fractured Polygons & Memory Echos',
    accentColor: '#881337',
    bgPreviewClass: 'bg-[#0A0407] border border-rose-900/40',
  },
  {
    id: 'newspaper',
    name: 'Newspaper',
    category: 'Editorial',
    tagline: 'Vintage Broadsheet Front Page, Column Rules & Bodoni Headlines',
    accentColor: '#D8D2C2',
    bgPreviewClass: 'bg-[#141210] border border-stone-600',
  },
  {
    id: 'constellation',
    name: 'Constellation',
    category: 'Atmospheric',
    tagline: 'Kinetic Star Mapping, Geometric Word Links & Celestial Drift',
    accentColor: '#E2B857',
    bgPreviewClass: 'bg-[#030308] border border-amber-400/30',
  },
];

export function getThemeMeta(id: string): ThemeMeta | undefined {
  return VISUALIZER_THEMES.find((t) => t.id === id);
}

