# Constellation Visualizer Theme: Comprehensive Design Specification and Technical Implementation Proposal

**Document Version:** 1.0.0-PROPOSAL  
**Author:** Worker 1 (Technical Author & Systems Architect)  
**Collaborators:** Explorer 1 (Visual Reference Analyst), Explorer 2 (Gatekeep Architecture Investigator), Explorer 3 (Integration & Compatibility Auditor)  
**Target Repository:** Gatekeep (VibeSync) Audio-Visual Platform  
**Target File Path:** `docs/CONSTELLATION_SPEC.md`  
**Status:** Ready for Multi-Agent Review and Approval  

---

## Table of Contents
1. [Visual Reference Analysis](#1-visual-reference-analysis)
   - 1.1 [Media Ingestion & Video Analysis](#11-media-ingestion--video-analysis)
   - 1.2 [Constellation Geometry & Topological Network](#12-constellation-geometry--topological-network)
   - 1.3 [Lyric Presentation & Spatial Typography](#13-lyric-presentation--spatial-typography)
   - 1.4 [Background, Atmosphere & Lighting Treatments](#14-background-atmosphere--lighting-treatments)
   - 1.5 [Animation Dynamics & Physics Lifecycles](#15-animation-dynamics--physics-lifecycles)
   - 1.6 [Comparative Analysis Matrix](#16-comparative-analysis-matrix)
2. [Final Constellation Design Specification](#2-final-constellation-design-specification)
   - 2.1 [Atmosphere & Canvas Layer Stack](#21-atmosphere--canvas-layer-stack)
   - 2.2 [Track-Adaptive Color System](#22-track-adaptive-color-system)
   - 2.3 [Constellation Geometry & Mathematical Generators](#23-constellation-geometry--mathematical-generators)
   - 2.4 [Star Luminescence & Lighting Effects](#24-star-luminescence--lighting-effects)
   - 2.5 [Typography System & Visual Hierarchy](#25-typography-system--visual-hierarchy)
   - 2.6 [Active Word Highlighting & 2D Spatial Layout Engine](#26-active-word-highlighting--2d-spatial-layout-engine)
   - 2.7 [Animation Physics & Spring Interpolation](#27-animation-physics--spring-interpolation)
   - 2.8 [Responsive Behavior & Viewport Safe Areas](#28-responsive-behavior--viewport-safe-areas)
3. [Component Architecture and Technical Implementation Plan](#3-component-architecture-and-technical-implementation-plan)
   - 3.1 [Decoupled Two-Tier Rendering Architecture](#31-decoupled-two-tier-rendering-architecture)
   - 3.2 [Component Tree, Props Contract & Directory Structure](#32-component-tree-props-contract--directory-structure)
   - 3.3 [High-Frequency Playback State Management](#33-high-frequency-playback-state-management)
   - 3.4 [Lyric Timestamp Granularity & Word Timing Engine](#34-lyric-timestamp-granularity--word-timing-engine)
   - 3.5 [Spotify & Demo Playback Synchronization Engine](#35-spotify--demo-playback-synchronization-engine)
4. [Gatekeep Integration and Constraints Compliance](#4-gatekeep-integration-and-constraints-compliance)
   - 4.1 [ThemeRegistry & Gallery Integration](#41-themeregistry--gallery-integration)
   - 4.2 [Test Suite Compatibility & The 15-Theme Assertion](#42-test-suite-compatibility--the-15-theme-assertion)
   - 4.3 [Keyboard Shortcuts & Legacy Mode Cycling Invariant](#43-keyboard-shortcuts--legacy-mode-cycling-invariant)
   - 4.4 [Layout Clearance & Z-Index Matrix](#44-layout-clearance--z-index-matrix)
   - 4.5 [Session Persistence & Cross-Feature Compatibility](#45-session-persistence--cross-feature-compatibility)
5. [Technical Challenges and Performance Solutions](#5-technical-challenges-and-performance-solutions)
   - 5.1 [Word Timing Accuracy & Fallback Heuristics](#51-word-timing-accuracy--fallback-heuristics)
   - 5.2 [60fps Canvas Performance & Batching](#52-60fps-canvas-performance--batching)
   - 5.3 [GPU Fill-Rate, Memory Leaks & Garbage Collection](#53-gpu-fill-rate-memory-leaks--garbage-collection)
   - 5.4 [Mobile Performance & Touch Interaction](#54-mobile-performance--touch-interaction)
   - 5.5 [Zero-Dependency Track-Adaptive Palette Extraction](#55-zero-dependency-track-adaptive-palette-extraction)
   - 5.6 [Regression Prevention Strategy](#56-regression-prevention-strategy)
6. [Requirements From Me (Categorized)](#6-requirements-from-me-categorized)
   - 6.1 [Essential Requirements](#61-essential-requirements)
   - 6.2 [Optional / Atmospheric Enhancements](#62-optional--atmospheric-enhancements)
   - 6.3 [Technical / Performance Requirements](#63-technical--performance-requirements)
   - 6.4 [Package & Dependency Audit](#64-package--dependency-audit)
7. [Implementation Roadmap](#7-implementation-roadmap)
   - 7.1 [Phase 1: Core Geometry & Word-Timing Foundation](#71-phase-1-core-geometry--word-timing-foundation)
   - 7.2 [Phase 2: Decoupled Canvas & Typography Layer Implementation](#72-phase-2-decoupled-canvas--typography-layer-implementation)
   - 7.3 [Phase 3: Track-Adaptive Color & Atmosphere Engine](#73-phase-3-track-adaptive-color--atmosphere-engine)
   - 7.4 [Phase 4: Gatekeep Integration & UI Controls](#74-phase-4-gatekeep-integration--ui-controls)
   - 7.5 [Phase 5: Verification, Testing & Regression Hardening](#75-phase-5-verification-testing--regression-hardening)

---

## 1. Visual Reference Analysis

### 1.1 Media Ingestion & Video Analysis
A granular frame-by-frame visual and motion analysis was conducted on the two provided reference screen recordings captured from a high-end macOS desktop music companion application (curated by `@arkcurates` and `@needlemacb`):

1. **Video 1: `ScreenRecording_11-12-2026 21-40-06_1.MP4`**
   - **Stream Properties**: Duration: `43.16s`, Resolution: `828 x 1792`, Codec: `HEVC (Apple H.265)` at `56.98 fps`, Color space: `BT.709`, Audio: `AAC Stereo 44.1kHz`.
   - **Segment A (`00:00.00` – `00:23.50`)**: Charlie Puth — *We Don't Talk Anymore* (feat. Selena Gomez).
     - **Visual Style**: Solar Gold / Amber theme over pitch black void (`#000000`). Warm starlight nodes, amber hairlines, and radiant golden text.
     - **UI Dropdown Discovery (`t = 15.00s`)**: The user opens the application settings menu, revealing the explicit theme identifier **"Constellation"** alongside other engine options (`Fish-eye`, `Visual`, `Flow-eye Visual`, `Code-style`, `Code-style Visual`, `Branches`, `Web`). The font menu shows `SF Pro` (selected), `SF Rounded`, `New York`, `Helvetica Neue`, `Avenir Next`, `Futura`, and `Didot`. The color menu confirms `Auto Sync` color extraction alongside manual palette controls.
   - **Segment B (`00:24.00` – `00:43.16`)**: George Michael — *Careless Whisper*.
     - **Visual Style**: Dramatic Crimson Duotone wash over a full-bleed album cover portrait. Pure white constellation vectors, diamond starbursts, and high-contrast editorial typography superimposed over dark burgundy and deep scarlet shadows.

2. **Video 2: `ScreenRecording_11-12-2026 21-41-15_1.MP4`**
   - **Stream Properties**: Duration: `16.08s`, Resolution: `828 x 1792`, Codec: `HEVC` at `59.94 fps`, Color space: `BT.709`, Audio: `AAC Stereo 44.1kHz`.
   - **Track Content**: Metro Boomin, The Weeknd & 21 Savage — *Creepin'*.
   - **Visual Style**: Silver / Smoked Slate theme over deep charcoal void (`#0b0f14`). Atmospheric fluid smoke waves/ribbons, center-left masked album art (feathered vignette), silver hairline connectors, luminous pure white typography, and prominent astronomical coordinate graduated axes.

---

### 1.2 Constellation Geometry & Topological Network
The defining aesthetic of Constellation is its rigorous mathematical geometry. Rather than a randomized particle cloud or linear karaoke bounce, it constructs an evolving 2D celestial star chart.

```
       [Word Node A] ───(Hairline Connector)─── [Word Node B]
            \                                      /  │
             \                                    /   │ (Graduated Axis)
              \                                  /    │ [||||]
         (Cross-Brace)                      (Chord)   │
                \                              /      │
                 ▼                            ▼       ▼
              [Word Node C] ─────────────── [Word Node D (ACTIVE)]
                                                   ◎ (Focal Reticle: Halo + Cardinal Ticks)
```

1. **Connector Lines (Hairlines)**:
   - **Stroke Thickness**: Ultra-fine hairlines measuring **1.0px to 1.5px** with anti-aliased subpixel rendering.
   - **Line Caps & Joins**: `lineCap = 'round'` and `lineJoin = 'round'`, preventing harsh spike artifacts at acute angles.
   - **Dynamic Opacity**: Inactive connectors maintain **35% to 50% opacity**; lines directly terminating at the currently sung word brighten dynamically to **80% to 100% opacity**.
2. **Triangulation & Polygon Formations**:
   - Connector paths do not follow a simple sequential zig-zag line. Instead, vertices connect into **triangulated polygons, kites, and planar meshes**.
   - Each newly vocalized word links to **1 to 3 nearest neighbor vertices**, producing a clean Delaunay-like network with a node degree typically between 2 and 4.
   - Non-adjacent cross-braces connect upper and lower word clusters, producing the depth effect of a 3D celestial polyhedron projected onto a 2D plane.
3. **Astronomical Markings & Graduated Axes**:
   - Distinctive astronomical coordinate ticks appear along major vertical and diagonal connector lines (prominently seen in Video 2 at `t = 06.99s` and `t = 10.16s`).
   - 3 to 5 small perpendicular tick marks (measuring **2px to 4px** in length) are spaced uniformly along the segment, evoking the technical precision of astrolabes, sextants, or celestial coordinate grids.
4. **Star Vertices (Diamond Astroids)**:
   - Every lyric word anchor is marked by a **four-pointed diamond star flare** (concave hypocycloid/astroid geometry).
   - Inactive stars have a bounding diameter of **8px to 12px**.
   - The active singing star expands to **18px to 26px** with high-intensity radial bloom.
5. **The Focal Reticle (Targeting Ring & Cardinal Crosshairs)**:
   - The active singing word is enclosed in an animated targeting reticle:
     - **Concentric Circular Ring**: A thin hairline circle with radius $R \approx 18\text{px} - 26\text{px}$.
     - **Cardinal Crosshair Ticks**: Four tick marks situated at 12, 3, 6, and 9 o'clock extending **4px to 8px** outside the ring circumference.
     - **Smooth Tracking**: As singing progresses from word $A$ to word $B$, the reticle animates smoothly across the canvas using a damped spring or lerp interpolation, locking onto the new vertex.

---

### 1.3 Lyric Presentation & Spatial Typography
1. **Non-Linear 2D Planar Layout**:
   - Lyric words are not arranged in traditional left-to-right sentences or vertical scrolling blocks.
   - Words are distributed organically across the central **60% to 75%** of the viewport width and **40% to 65%** of the viewport height, leaving safe margins around display borders, system menus, and floating player bars.
   - Each word is anchored directly below its associated star vertex ($y_{\text{text}} = y_{\text{node}} + 16\text{px}$ to $22\text{px}$). When clusters are dense, text offsets slightly along the x-axis to maintain legibility.
2. **Dramatic Typographic Hierarchy**:
   - Inactive words act as subtle coordinate labels: font size **13px – 16px**, weight **400–500**, opacity **30% – 45%**, muted secondary color.
   - The active vocalized word enlarges dramatically: font size **28px – 44px** (**2.0x to 2.8x enlargement**), weight **700–800 (Bold/Black)**, opacity **100%**, luminescent highlight color with a 10px–15px gaussian text-shadow bloom.
3. **Styling & Casing**:
   - Lyrics are styled predominantly in **lowercase** (e.g., `looking`, `tight`, `wanna`, `with`, `playing`, `can't`, `anymore`).
   - Pronouns and proper nouns retain standard capitalization (e.g., `I`, `We`, `Cause`).
   - Letter-spacing: Wide tracking for inactive words (`letterSpacing: '0.08em'`) vs tighter tracking for active headline words (`letterSpacing: '-0.02em'`).
4. **Dual Typography System**:
   - **Lyrics Stage**: Clean, modern geometric sans-serif (`SF Pro` in macOS, mapped perfectly to Gatekeep's bundled **`Inter`**).
   - **Clock / Telemetry Header**: High-contrast, elegant editorial serif (`New York` / `Didot`), displaying the time (e.g., `19:13`, `23:21`) top-center with hairline brackets.

---

### 1.4 Background, Atmosphere & Lighting Treatments
Constellation avoids the clichéd purple/blue generic space nebula. The video references reveal a sophisticated, track-adaptive aesthetic engine:

1. **Solar Gold / Amber (Video 1, Charlie Puth)**:
   - Deep pitch black obsidian void (`#000000`).
   - Radiant starlight gold text (`#fef08a`), amber connector lines (`#b89230`), and golden star flares (`#facc15`).
   - Warm bottom-edge ambient rim bleed fading upwards into black over the bottom 12% of the screen.
2. **Crimson Duotone (Video 1, George Michael)**:
   - Full-bleed monochrome duotone wash mapped over the album artwork.
   - Shadow blacks are tinted deep burgundy (`#120205`), midtones are blood crimson (`#8f0e24`), and specular highlights are fiery scarlet (`#e11d48`).
   - Pure white constellation vectors (`#ffffff`) cut sharply across the red backdrop, complemented by background watermark album credits.
3. **Silver / Smoked Slate (Video 2, Metro Boomin)**:
   - Deep slate charcoal canvas (`#070a0e` to `#0b0f14`).
   - Translucent organic smoke waves / silk ribbons drifting with soft gaussian blur (`#334155` to `#64748b`).
   - Album artwork positioned center-left with an organic feathered vignette mask (`mask-image: radial-gradient(...)`).
   - Pure white active text (`#ffffff`), cool slate inactive text (`#64748b`), and crisp silver constellation geometry (`#e2e8f0`).
4. **Ambient Screen Bezel Neon Glow**:
   - A continuous 1.5px glowing hairline hugs the inner perimeter of the display, tracing around the screen's rounded corners and camera notch.
   - Casts an ambient inward and outward bloom (8px–16px blur), framing the visualizer as an illuminated aerospace cockpit or telemetry terminal.

---

### 1.5 Animation Dynamics & Physics Lifecycles

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                WORD LIFECYCLE TIMELINE                                 │
├─────────────────┬───────────────────────────┬─────────────────────────┬────────────────┤
│ 1. Spawn (150ms)│ 2. Active Focal (Duration)│ 3. Recede (300ms)       │ 4. Dissolve    │
├─────────────────┼───────────────────────────┼─────────────────────────┼────────────────┤
│ • Elastic pop   │ • Text 28-44px Bold (100%)│ • Text scales to 14px   │ • Phrase ends  │
│   (0.5 -> 1.15) │ • Reticle locks on (ring) │ • Dims to 35% opacity   │ • Opacity -> 0 │
│ • Line shoots   │ • Star brightness flare   │ • Reticle detaches      │ • Slow drift   │
│   from prev node│ • Harmonic breath (±4%)   │ • Star returns to 10px  │   (800-1200ms) │
└─────────────────┴───────────────────────────┴─────────────────────────┴────────────────┘
```

1. **4-Stage Word Lifecycle**:
   - **Spawn Phase (~150ms)**: Word vertex pops in with elastic overshoot (`scale: 0.5 -> 1.15 -> 1.0`). A line animates from the prior active vertex to the new position using linear interpolation ($t \in [0, 1]$).
   - **Active Focal Phase (Word Vocalization Duration)**: Text expands to headline scale (28px–44px, bold). The focal crosshair reticle locks onto the star node. A subtle harmonic breath ($\pm 4\%$ radius, ~1.2s cycle) pulses gently.
   - **Recede Phase (~300ms)**: As singing transitions to the next word, the previous word smoothly shrinks down to 14px (`cubic-bezier(0.25, 1, 0.5, 1)`), dims to 35% opacity, and shifts to secondary grey/amber. The reticle glides away toward the next vertex.
   - **Dissolve Phase (Phrase Transition, 800ms–1200ms)**: At phrase completion, completed constellation nodes and lines do not abruptly disappear. They persist with decaying opacity while undergoing slow linear drift ($\Delta x \approx 10\text{px}, \Delta y \approx -8\text{px}$) as the new phrase populates.
2. **Zero-Gravity Micro-Drift Physics & Frequency Scaling**:
   - All vertices undergo subtle, continuous sinusoidal drift evaluated in seconds ($t_{\text{sec}} = \text{currentTimeMs} / 1000$):
     $$x_i(t) = x_{i,0} + A_x \sin(\omega_x t_{\text{sec}} + \phi_i)$$
     $$y_i(t) = y_{i,0} + A_y \cos(\omega_y t_{\text{sec}} + \psi_i)$$
     where $A \in [2\text{px}, 5\text{px}]$, period $T \in [4\text{s}, 8\text{s}]$, and $\omega = \frac{2\pi}{T}$.
   - **Crucial Unit Scaling Guard**: Gatekeep's audio controller passes `currentTimeMs` in milliseconds (e.g., $15,000\text{ms}$ at 15s). Passing raw milliseconds into standard angular velocity formulas ($\text{rad/s}$) would accelerate oscillation by $1000\times$ ($166.7\text{ Hz}$ vibration strobe). Evaluating in seconds ($t_{\text{sec}} = \text{currentTimeMs} / 1000$) guarantees a serene, buoyant cosmic drift ($0.125\text{ Hz}$–$0.25\text{ Hz}$):
     ```typescript
     const tSec = currentTimeMs / 1000;
     const dx = Ax * Math.sin(omegaX * tSec + phiX);
     const dy = Ay * Math.cos(omegaY * tSec + psiY);
     ```
3. **Ambient Stardust Motes**:
   - 30 to 60 background micro-stars (1px to 2px) twinkle independently at random phase offsets ($0.15 \le \alpha \le 0.75$), providing cosmic depth behind the lyrics.

---

### 1.6 Comparative Analysis Matrix

| Feature / Dimension | Video 1 (Segment A: Solar Gold) | Video 1 (Segment B: Crimson Duotone) | Video 2 (Silver / Smoked Slate) | Gatekeep Specification Requirement |
| :--- | :--- | :--- | :--- | :--- |
| **Track & Artist** | Charlie Puth — *We Don't Talk Anymore* | George Michael — *Careless Whisper* | Metro Boomin / The Weeknd — *Creepin'* | Dynamic binding to Gatekeep playback track |
| **Aesthetic Mood** | Acoustic luxury, warm amber minimalism | Passionate 80s ballad, high-contrast editorial | Nocturnal trap/R&B, cold cinematic slate | Track-adaptive palette extraction + 3 presets |
| **Background Surface** | Pure pitch black void (`#000000`) | Full-bleed red duotone portrait artwork | Slate charcoal (`#0b0f14`) + fluid smoke | Configurable background shader/gradient layer |
| **Album Art Integration** | Minimal / subtle backdrop | Fullscreen duotone washed background | Inset center-left with feathered vignette mask | Feathered mask inset or full duotone wash |
| **Active Lyric Text** | Radiant gold (`#fef08a`, weight 700) | Pure brilliant white (`#ffffff`, weight 800) | Pure brilliant white (`#ffffff`, weight 800) | Highlight text: 28–44px, bold, 100% opacity |
| **Inactive Lyric Text** | Dark amber (`#785e2f`, 35% opacity) | Dusty rose / mauve (`#a87884`, 35% opacity) | Cool slate grey (`#64748b`, 35% opacity) | Secondary text: 13–16px, 35% opacity, Inter |
| **Connecting Lines** | 1.0px hairline amber (`#b89230`) | 1.0px hairline crisp white (`#ffffff`) | 1.0px hairline silver (`#e2e8f0`) | 1.0–1.5px hairlines with active brightening |
| **Star Vertices** | 4-point diamond star (`#facc15`) | 4-point diamond star (`#ffffff`) | 4-point diamond star (`#ffffff`) | Mathematical astroid diamond with radial glow |
| **Focal Reticle** | Concentric circle ring + star halo | Concentric circle + 4 cardinal crosshairs | Circle + 4 cardinal crosshairs + axes | Circle ring ($R=22\text{px}$) + 4 cardinal tick marks |
| **Astronomical Ticks** | Minimal | Observed on diagonal connector | Prominent vertical & diagonal coordinate ticks | `drawGraduatedLine` generator with 3–5 ticks |
| **Screen Bezel Glow** | Subtle bottom ambient edge bleed | Full white perimeter neon bezel outline | Full white perimeter neon bezel outline | 1.5px glowing border overlay with notch safe area |
| **Clock Header** | Standard macOS bar | Top center serif clock (`19:13` Didot) | Top center serif clock (`23:21` New York) | Optional serif clock header in Gatekeep HUD |
| **Word Lifecycle** | 4-stage (Pop, Active, Recede, Fade) | 4-stage (Pop, Active, Recede, Fade) | 4-stage (Pop, Active, Recede, Fade) | Unified 4-stage word lifecycle engine |

---

## 2. Final Constellation Design Specification

### 2.1 Atmosphere & Canvas Layer Stack
The Constellation theme is constructed as a multi-tier visual environment rendered directly inside Gatekeep's `#lyrics-viewport` container (`fixed inset-0 w-screen h-screen overflow-hidden`):

```
┌────────────────────────────────────────────────────────────────────────┐
│  Layer 4: UI Overlays & Header HUD (React DOM, z-40)                   │
│  - Optional Serif Clock Header (Didot / New York / Georgia)            │
│  - Ambient Neon Screen Bezel Glow (1.5px border with inset glow)       │
├────────────────────────────────────────────────────────────────────────┤
│  Layer 3: Kinetic Lyric Typography Layer (React DOM / Framer, z-20)   │
│  - Subpixel Inter typography positioned at canvas vertex anchors       │
│  - Active word 2x–3x enlargement (28px–44px) + text-shadow bloom       │
│  - Inactive word 14px labels with 35% opacity                          │
├────────────────────────────────────────────────────────────────────────┤
│  Layer 2: Constellation Geometry Canvas (HTML5 Canvas 2D, z-10)        │
│  - 60fps autonomous RAF loop                                           │
│  - Hairline connector lines (1.0px–1.5px) and graduated tick axes      │
│  - 4-pointed diamond star sparkle nodes (astroid curves)               │
│  - Animated focal crosshair reticle (lerp tracking active word)        │
│  - Sinusoidal micro-drift physics & 45 twinkling ambient stardust motes│
├────────────────────────────────────────────────────────────────────────┤
│  Layer 1: Ambient Atmosphere & Artwork (CSS / WebGL Canvas, z-0)       │
│  - Fluid smoke ribbons or track-adaptive duotone backdrop              │
│  - Vignetted album art integration (feathered radial gradient mask)    │
│  - Pitch black / charcoal base surface                                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2.2 Track-Adaptive Color System
Rather than forcing a generic purple space look, Constellation implements an adaptive palette system with three calibrated factory presets and an automatic extraction algorithm:

#### A. Calibrated Palette Presets

```typescript
export interface ConstellationPalette {
  id: 'solar-gold' | 'crimson-duotone' | 'silver-slate';
  name: string;
  bgBase: string;          // Deep void background
  bgAtmosphere: string;    // Secondary ambient glow or smoke tint
  lineInactive: string;    // Inactive connector hairline
  lineActive: string;      // Active connector line
  starInactive: string;    // Inactive diamond star
  starActive: string;      // Active singing star
  reticle: string;         // Focal targeting ring and crosshairs
  textActive: string;      // Active headline word
  textInactive: string;    // Inactive label word
  bezelGlow: string;       // Outer screen rim neon
}

export const CONSTELLATION_PRESETS: Record<string, ConstellationPalette> = {
  'solar-gold': {
    id: 'solar-gold',
    name: 'Solar Gold',
    bgBase: '#000000',
    bgAtmosphere: 'rgba(234, 179, 8, 0.08)',
    lineInactive: 'rgba(184, 146, 48, 0.35)',
    lineActive: 'rgba(250, 204, 21, 0.95)',
    starInactive: 'rgba(234, 179, 8, 0.65)',
    starActive: '#fef08a',
    reticle: '#facc15',
    textActive: '#fef08a',
    textInactive: 'rgba(180, 140, 60, 0.45)',
    bezelGlow: 'rgba(234, 179, 8, 0.25)',
  },
  'crimson-duotone': {
    id: 'crimson-duotone',
    name: 'Crimson Duotone',
    bgBase: '#0d0204',
    bgAtmosphere: 'rgba(185, 28, 28, 0.18)',
    lineInactive: 'rgba(255, 255, 255, 0.30)',
    lineActive: 'rgba(255, 255, 255, 0.95)',
    starInactive: 'rgba(244, 63, 94, 0.60)',
    starActive: '#ffffff',
    reticle: '#ffffff',
    textActive: '#ffffff',
    textInactive: 'rgba(220, 160, 175, 0.40)',
    bezelGlow: 'rgba(255, 255, 255, 0.45)',
  },
  'silver-slate': {
    id: 'silver-slate',
    name: 'Silver / Smoked Slate',
    bgBase: '#070a0e',
    bgAtmosphere: 'rgba(100, 116, 139, 0.12)',
    lineInactive: 'rgba(148, 163, 184, 0.35)',
    lineActive: 'rgba(248, 250, 252, 0.95)',
    starInactive: 'rgba(148, 163, 184, 0.60)',
    starActive: '#ffffff',
    reticle: '#f8fafc',
    textActive: '#ffffff',
    textInactive: 'rgba(148, 163, 184, 0.45)',
    bezelGlow: 'rgba(255, 255, 255, 0.35)',
  },
};
```

#### B. Track-Adaptive Color Extraction & Robust HEX/RGB Parser
Gatekeep's `CurrentTrack` provides `palette: [string, string, string, string]` containing actual HEX values (e.g., `['#1E3A8A', '#3B82F6', '#93C5FD', '#172554']`). Rather than relying on fragile color-name substrings (like `'gold'` or `'red'`), Constellation implements a mathematical HEX/RGB parser and contrast validator:

```typescript
export interface ParsedRGB {
  r: number;
  g: number;
  b: number;
  luminance: number; // Relative luminance: 0.2126R + 0.7152G + 0.0722B
  hue: number;       // 0-360 degrees
  saturation: number;// 0-1
}

export function parseColorToRGB(colorStr: string): ParsedRGB | null {
  if (!colorStr) return null;
  const str = colorStr.trim();

  // 1. Parse HEX (#RGB, #RRGGBB, #RRGGBBAA)
  if (str.startsWith('#')) {
    const hex = str.slice(1);
    let r = 255, g = 255, b = 255;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length >= 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
    return computeColorMetrics(r, g, b);
  }

  // 2. Parse rgb(...) or rgba(...)
  const rgbMatch = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    const r = Math.min(255, Math.max(0, parseInt(rgbMatch[1], 10)));
    const g = Math.min(255, Math.max(0, parseInt(rgbMatch[2], 10)));
    const b = Math.min(255, Math.max(0, parseInt(rgbMatch[3], 10)));
    return computeColorMetrics(r, g, b);
  }

  return null;
}

function computeColorMetrics(r: number, g: number, b: number): ParsedRGB {
  const normR = r / 255, normG = g / 255, normB = b / 255;
  const max = Math.max(normR, normG, normB);
  const min = Math.min(normR, normG, normB);
  const delta = max - min;

  // Hue calculation (0-360)
  let hue = 0;
  if (delta !== 0) {
    if (max === normR) hue = ((normG - normB) / delta) % 6;
    else if (max === normG) hue = (normB - normR) / delta + 2;
    else hue = (normR - normG) / delta + 4;
    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;
  }

  const saturation = max === 0 ? 0 : delta / max;
  const luminance = 0.2126 * normR + 0.7152 * normG + 0.0722 * normB;

  return { r, g, b, luminance, hue, saturation };
}

export function resolvePaletteFromTrack(
  fallbackPalette?: string[] | null,
  imageElement?: HTMLImageElement | null
): ConstellationPalette {
  // Priority 1: Direct parsing of Gatekeep's currentTrack.palette (HEX/RGB)
  if (fallbackPalette && fallbackPalette.length > 0) {
    for (const colorStr of fallbackPalette) {
      const parsed = parseColorToRGB(colorStr);
      if (parsed) {
        // High saturation checks against hue sectors:
        // Hue 35-65: Amber / Gold / Warm Yellow
        if (parsed.hue >= 35 && parsed.hue <= 65 && parsed.saturation > 0.25) {
          return CONSTELLATION_PRESETS['solar-gold'];
        }
        // Hue 340-360 or 0-25: Red / Crimson / Burgundy
        if ((parsed.hue >= 340 || parsed.hue <= 25) && parsed.saturation > 0.25) {
          return CONSTELLATION_PRESETS['crimson-duotone'];
        }
      }
    }
  }

  // Priority 2: Offscreen Canvas Sampler on album art (with full CORS safety guard)
  if (imageElement && imageElement.complete && imageElement.naturalWidth > 0) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 48;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(imageElement, 0, 0, 48, 48);
        const imgData = ctx.getImageData(0, 0, 48, 48).data;
        let sumR = 0, sumG = 0, sumB = 0;
        let samples = 0;
        for (let i = 0; i < imgData.length; i += 16) {
          sumR += imgData[i];
          sumG += imgData[i + 1];
          sumB += imgData[i + 2];
          samples++;
        }
        const avg = computeColorMetrics(sumR / samples, sumG / samples, sumB / samples);
        if (avg.hue >= 35 && avg.hue <= 65 && avg.saturation > 0.2) {
          return CONSTELLATION_PRESETS['solar-gold'];
        }
        if ((avg.hue >= 340 || avg.hue <= 25) && avg.saturation > 0.2) {
          return CONSTELLATION_PRESETS['crimson-duotone'];
        }
      }
    } catch {
      // Graceful fallback on CORS tainted canvas error
    }
  }

  // Default: Silver / Smoked Slate (clean editorial reference standard)
  return CONSTELLATION_PRESETS['silver-slate'];
}
```

#### C. Contrast Ratio & WCAG Accessibility Guarantee
To prevent low-contrast text against bright track art:
- The active headline lyric text is always enforced to maintain at least a **7:1 contrast ratio** against `bgBase` using high-luminance white (`#ffffff` / `#fef08a`).
- Backdrop layers feature a mandatory radial vignette and `92%` dark opacity gradient, ensuring readability regardless of the underlying album cover colors.
    console.warn('[Constellation] Cross-origin security block during album art extraction; falling back to currentTrack.palette', err);
    return resolveFallback();
  }
}
```

---

### 2.3 Constellation Geometry & Mathematical Generators
All constellation graphics are rendered imperatively via standard 2D Canvas path commands.

#### 1. Four-Pointed Diamond Star Flare (`drawStarNode`)
Constructs an astroid hypocycloid with 4 curved, flared points:

```typescript
export function drawStarNode(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerRadius: number,
  color: string,
  bloomIntensity: number = 0
) {
  const innerRadius = outerRadius * 0.22; // Produces the exact reference diamond flare
  ctx.save();
  if (bloomIntensity > 0) {
    ctx.shadowColor = color;
    ctx.shadowBlur = bloomIntensity;
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 - Math.PI / 2;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
```

#### 2. Animated Focal Reticle (`drawFocalReticle`)
Draws the concentric targeting ring and cardinal tick marks centered over the active word:

```typescript
export function drawFocalReticle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  pulseFactor: number = 1.0,
  tickLength: number = 6
) {
  // Guard against non-positive radius crashing Canvas with IndexSizeError DOMException during spring overshoot
  const safeRadius = Math.max(0.1, radius * pulseFactor);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.0;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;

  // Concentric circle ring
  ctx.beginPath();
  ctx.arc(cx, cy, safeRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Cardinal ticks at 12, 3, 6, 9 o'clock
  ctx.beginPath();
  // 12 o'clock (top)
  ctx.moveTo(cx, cy - safeRadius);
  ctx.lineTo(cx, cy - safeRadius - tickLength);
  // 6 o'clock (bottom)
  ctx.moveTo(cx, cy + safeRadius);
  ctx.lineTo(cx, cy + safeRadius + tickLength);
  // 9 o'clock (left)
  ctx.moveTo(cx - safeRadius, cy);
  ctx.lineTo(cx - safeRadius - tickLength, cy);
  // 3 o'clock (right)
  ctx.moveTo(cx + safeRadius, cy);
  ctx.lineTo(cx + safeRadius + tickLength, cy);
  ctx.stroke();

  ctx.restore();
}
```

#### 3. Graduated Axis Line with Tick Marks (`drawGraduatedLine`)
Draws technical star chart tick marks along vertical and diagonal connector lines:

```typescript
export function drawGraduatedLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lineWidth: number = 1.0,
  tickCount: number = 4,
  tickSize: number = 3.5
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  // Main hairline segment
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.hypot(dx, dy);

  // Only render graduated ticks on lines longer than 45px
  if (distance > 45 && tickCount > 0) {
    const ux = dx / distance;
    const uy = dy / distance;
    const px = -uy; // Perpendicular unit normal
    const py = ux;

    ctx.beginPath();
    for (let i = 1; i <= tickCount; i++) {
      const t = i / (tickCount + 1);
      const mx = x1 + dx * t;
      const my = y1 + dy * t;
      ctx.moveTo(mx - px * tickSize, my - py * tickSize);
      ctx.lineTo(mx + px * tickSize, my + py * tickSize);
    }
    ctx.stroke();
  }
  ctx.restore();
}
```

---

### 2.4 Star Luminescence & Lighting Effects
- **Resting Glimmer**: Inactive star nodes emit a gentle radial glow (`ctx.shadowBlur = 4` to `8px`).
- **Vocal Hit Flare**: When a word's start timestamp is reached, the star node flares with an immediate burst:
  $$\text{outerRadius}_{\text{hit}} = \text{outerRadius} \times 1.4, \quad \text{shadowBlur}_{\text{hit}} = 18\text{px}$$
  decaying back to normal over 180ms via exponential damping ($e^{-kt}$).
- **Active Reticle Breath**: While vocalized, the reticle ring breathes harmonically:
  $$\text{pulseFactor}(t) = 1.0 + 0.04 \sin\left(\frac{2\pi t}{1200\text{ms}}\right)$$

---

### 2.5 Typography System & Visual Hierarchy
To maintain ultra-crisp typography without canvas blur, all lyrics are rendered in the **React DOM Layer** using the project's bundled **`Inter`** font (`--font-sans` from `next/font/google`):

| State | Font Size | Weight | Line Height | Tracking | Color | Text Shadow Bloom |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Active Headline** | `36px` (`2.4rem`) | `700` (Bold) | `1.1` | `-0.02em` | `#ffffff` or `#fef08a` | `0 0 16px rgba(..., 0.8)` |
| **Inactive Label** | `14px` (`0.875rem`) | `500` (Medium) | `1.2` | `+0.06em` | `rgba(..., 0.40)` | None |
| **Serif Header Clock** | `18px` (`1.125rem`) | `400` (Regular) | `1.0` | `+0.15em` | `rgba(255, 255, 255, 0.8)` | `0 0 8px rgba(255, 255, 255, 0.3)` |

**Casing Policy**: Words are rendered lowercase (`text.toLowerCase()`) except for pronouns (`I`, `I'll`, `I'm`) and initial sentence capitalization, matching the intimate editorial tone observed in the video references.

---

### 2.6 Active Word Highlighting & 2D Spatial Layout Engine
To position words across the 2D plane without collisions or clustering off-screen:

1. **Bounding Box Constraints & Safe Areas**:
   - **Horizontal Bounds**:
     $$\text{safeXMin} = 0.15 \times W, \quad \text{safeXMax} = 0.85 \times W$$
   - **Vertical Bounds (Header HUD & Floating Player Bar Clearance)**:
     - On desktop / tablet ($H \ge 700\text{px}$):
       $$y_{\text{node}} \in [0.18H, 0.72H]$$
     - On mobile / compact displays ($H < 700\text{px}$):
       $$y_{\text{node}} \in [0.18H, 0.65H]$$
       *Rationale*: Active headline words enlarge downward with an anchor offset ($+22\text{px}$), font height ($36\text{px}$), and text bloom ($16\text{px}$), totaling $+74\text{px}$ downward extent. Restricting $y_{\text{node}} \le 0.65H$ on mobile guarantees that active headline text never collides with Gatekeep's Floating Player Bar ($H - 92\text{px}$).
   - **Horizontal Boundary Clamping for Long Words**:
     On narrow screens, long words (e.g., "constellation", "uncomfortable") risk overflowing the right edge if centered on $x_{\text{node}}$ near `safeXMax`. The layout engine clamps the rendered DOM text anchor:
     $$x_{\text{text, clamped}} = \max\left(16\text{px}, \min\left(W - \text{wordWidth} - 16\text{px}, x_{\text{node}} - \frac{\text{wordWidth}}{2}\right)\right)$$
     On mobile viewports ($W < 480\text{px}$), the active headline font size scales dynamically down from $36\text{px}$ to $22\text{px}$–$26\text{px}$ (inactive words to $12\text{px}$) to preserve balanced screen density.

2. **Deterministic Phrase Seeding**:
   - Rather than purely random positions that jump around on re-renders, coordinates are seeded by the line's timestamp and word index:
     $$\text{hash}(s) = \sum_{k=0}^{|s|-1} s[k] \times 31^{|s|-1-k} \pmod{10^9+7}$$
   - Words within a line form an organic constellation arc centered near the screen midpoint.

3. **Polar Collision Avoidance & Dynamic Relaxation Engine**:
   - On desktop, the base minimum separation threshold is $d_{\min} = 85\text{px}$. On compact / mobile screens ($W < 600\text{px}$), the base threshold scales proportionally to available viewport width:
     $$d_{\min} = \max(40\text{px}, 0.18 \times W)$$
   - Every candidate node position $(x_i, y_i)$ tests Euclidean distance against all existing active nodes:
     $$\sqrt{(x_i - x_j)^2 + (y_i - y_j)^2} \ge d_{\min}$$
   - **Bounded Polar Search (Anti-Lockup Guard)**: The polar angle increment search is strictly capped at `maxAttempts = 16` ($\Delta \theta = \frac{\pi}{4}$ per attempt across 2 radial shells).
   - **Dynamic Relaxation Fallback**: If all 16 directions collide, the engine dynamically relaxes $d_{\min}$ ($85\text{px} \to 65\text{px} \to 45\text{px}$) or applies outward Archimedean spiral positioning ($r \leftarrow r + 25\text{px}, \theta \leftarrow \theta + \frac{\pi}{3}$). This guarantees deterministic convergence in under $O(N)$ operations, completely eliminating the risk of infinite loops or CPU tab freezes on dense, fast-tempo lyric phrases.

---

### 2.7 Animation Physics & Spring Interpolation
- **Reticle Position Lerp & Delta-Time Unit Conversion**: As the active word moves from $(x_A, y_A)$ to $(x_B, y_B)$, the canvas animation loop updates reticle position imperatively:
  $$x_{\text{reticle}}(t) = x_{\text{reticle}} + (x_B - x_{\text{reticle}}) \times \lambda$$
  $$y_{\text{reticle}}(t) = y_{\text{reticle}} + (y_B - y_{\text{reticle}}) \times \lambda$$
  where $\Delta t$ is strictly converted from milliseconds to seconds to preserve continuous frame-rate independent tracking:
  ```typescript
  const dtSec = Math.max(0, dtMs / 1000);
  const lambda = 1.0 - Math.exp(-dtSec * 12.0);
  ```
  *Unit Safety Guard*: In `requestAnimationFrame`, frame timestamps are in milliseconds ($\Delta t_{\text{ms}} \approx 16.67\text{ms}$ at 60fps). If milliseconds were passed directly into $1 - e^{-\Delta t \times 12}$, $\lambda$ would evaluate to $1 - e^{-200} \approx 1.0$, collapsing smooth interpolation into instantaneous teleportation. Furthermore, clamping $\Delta t_{\text{sec}} \ge 0$ prevents negative divergence during backward scrub or clock jitter. Discontinuous jumps ($|\Delta t_{\text{ms}}| > 400\text{ms}$) immediately snap reticle coordinates to the active node.
- **Line Infill Progress Underflow Guard**: When a word activates, the line connecting the previous star ($P_{\text{prev}}$) to the current star ($P_{\text{curr}}$) draws forward using clamped linear interpolation:
  $$p_{\text{line}}(t) = \max\left(0.0, \min\left(1.0, \frac{t - t_{\text{start}}}{150\text{ms}}\right)\right)$$
  ```typescript
  const pLine = Math.max(0.0, Math.min(1.0, (currentTimeMs - word.startMs) / 150));
  const currentX = prevX + (targetX - prevX) * pLine;
  const currentY = prevY + (targetY - prevY) * pLine;
  ```
  *Vector Infill Integrity*: Clamping $p_{\text{line}} \ge 0.0$ guarantees that negative vector projection is mathematically impossible when $t < t_{\text{start}}$ (e.g. during backward seeking or before node activation), preventing connecting hairlines from shooting in reverse across the canvas.
- **Micro-Drift Sinusoidal Physics**: Continuous celestial vertex drift is computed using time in seconds:
  ```typescript
  const tSec = currentTimeMs / 1000;
  const dx = Ax * Math.sin(omegaX * tSec + phiX);
  const dy = Ay * Math.cos(omegaY * tSec + psiY);
  ```
  where $A_x, A_y \in [2\text{px}, 5\text{px}]$, $T \in [4\text{s}, 8\text{s}]$, and $\omega = 2\pi / T$, preventing $1000\times$ frequency amplification on millisecond inputs.
- **Phrase Crossfade & Instrumental Detach**: When transitioning to a new line, the old constellation fades out linearly over 900ms while floating upward by 10px. During instrumental interludes where $t > t_{\text{phraseEnd}} + 800\text{ms}$, the reticle smoothly detaches and enters an ambient cosmic drift state rather than freezing indefinitely on the final word.

---

### 2.8 Responsive Behavior & Viewport Safe Areas
- **Desktop / Tablet Safe Area ($H \ge 700\text{px}$)**:
  - Vertical layout window: $y_{\text{node}} \in [0.18H, 0.72H]$.
  - Wide constellation distribution with 6–12 connected nodes. Top margin clears Header HUD (60px); bottom margin provides 180px+ clearance from the Floating Player Bar (92px).
- **Mobile / Portrait Safe Area ($H < 700\text{px}$)**:
  - Vertical layout window: $y_{\text{node}} \in [0.18H, 0.65H]$.
  - Nodes stack along a sinuous vertical spine ($\Delta y > \Delta x$) to fit narrow smartphone displays.
  - **Player Bar Clearance ($+74\text{px}$ Offset Guard)**: Active headline words expand downward by $+74\text{px}$ (anchor offset $+22\text{px}$, font line-height $36\text{px}$, bloom radius $16\text{px}$). Capping $y_{\text{node}} \le 0.65H$ ensures that on compact screens like iPhone SE ($H = 568\text{px}$, Player Bar top at $476\text{px}$), the bottom edge of active headline text peaks at $369\text{px} + 74\text{px} = 443\text{px}$, leaving a comfortable $33\text{px}$ safety buffer above the Floating Player Bar.
  - **Horizontal Boundary Clamping for Long Words**:
    $$x_{\text{text, clamped}} = \max\left(16\text{px}, \min\left(W - \text{wordWidth} - 16\text{px}, x_{\text{node}} - \frac{\text{wordWidth}}{2}\right)\right)$$
    On mobile viewports ($W < 480\text{px}$), active headline font size scales dynamically to `22px–26px` (inactive words to `12px`), preventing text from clipping past viewport edges.
- **DPI Scaling**: Canvas width and height are scaled by `Math.min(window.devicePixelRatio, 2)` to deliver razor-sharp Retina hairlines while capping GPU fill-rate by 55.6% on 3x mobile displays.

---

## 3. Component Architecture and Technical Implementation Plan

### 3.1 Decoupled Two-Tier Rendering Architecture
A major discovery in Gatekeep's architecture is that `AudioController.tsx` dispatches `currentTimeMs` updates at 60fps. Subscribing React components directly to `usePlayerStore((s) => s.currentTimeMs)` causes catastrophic React re-render cascades (60 reconciliations/sec), dropping frame rates.

To achieve flawless 60fps performance, Constellation implements a **strictly decoupled two-tier architecture**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        <ConstellationTheme />                          │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌───────────────────────────────────────┐ ┌──────────────────────────────┐
│       <ConstellationCanvas />         │ │   <ConstellationLyrics />    │
│            (HTML5 2D)                 │ │     (React DOM + Framer)     │
├───────────────────────────────────────┤ ├──────────────────────────────┤
│ • Autonomous requestAnimationFrame    │ │ • Subscribes ONLY to         │
│ • Imperative state snapshot:          │ │   activeLineIndex and words  │
│   usePlayerStore.getState().currTime  │ │ • ZERO React re-renders      │
│ • Hairline vector paths & tick marks  │ │   between lyric transitions  │
│ • 4-pointed diamond star nodes        │ │ • Crisp subpixel Inter type  │
│ • Animated reticle tracking           │ │ • Hardware-accelerated CSS   │
│ • Sinusoidal micro-drift physics      │ │   transform: translate3d     │
│ • 45 twinkling ambient stardust motes │ │ • Accessible HTML text tree  │
└───────────────────────────────────────┘ └──────────────────────────────┘
```

#### Mathematical Guarantee: Line Infill Progress Underflow Guard
In `<ConstellationCanvas />`, the connector hairlines between sequential nodes animate forward as each word activates. Line interpolation is computed as:
$$p_{\text{line}}(t) = \max\left(0.0, \min\left(1.0, \frac{t - t_{\text{start}}}{150\text{ms}}\right)\right)$$
```typescript
const pLine = Math.max(0.0, Math.min(1.0, (currentTimeMs - word.startMs) / 150));
const currentX = prevX + (targetX - prevX) * pLine;
const currentY = prevY + (targetY - prevY) * pLine;
```
Enforcing the lower bound clamp `Math.max(0.0, ...)` ensures that when $t < t_{\text{start}}$ (e.g. during rapid backward seeking or before node activation), $p_{\text{line}}$ never evaluates to negative values (e.g., $-0.67$), making backward vector projection mathematically impossible.

---

### 3.2 Component Tree, Props Contract & Directory Structure
All Constellation code resides in a dedicated modular folder under `src/components/visualizer/themes/Constellation/`:

```
src/components/visualizer/themes/Constellation/
├── index.ts                      # Clean barrel exports
├── ConstellationTheme.tsx        # Top-level theme container (VisualizerThemeProps)
├── ConstellationCanvas.tsx       # 60fps HTML5 Canvas 2D geometry renderer
├── ConstellationLyrics.tsx       # Framer Motion typography overlay
├── ConstellationWord.tsx         # Individual word anchor and label
├── constellationGeometry.ts      # Math generators (astroids, reticles, ticks)
├── wordTimingEngine.ts           # Word-level timestamp estimator & parser
└── paletteExtractor.ts           # Zero-dependency album art color sampler
```

#### Shared Component Contract
Fulfills Gatekeep's standard `VisualizerThemeProps` defined in `src/components/visualizer/themes/ThemeRegistry.ts`:

```typescript
export interface VisualizerThemeProps {
  lyrics?: LyricLine[];
  onLineClick?: (timeMs: number) => void;
  className?: string;
  isStoryMode?: boolean;
}
```

#### Pre-Vocal Intro & Negative Index Guard (`activeLineIndex === -1`)
Prior to the first sung line (or during extended instrumental track intros), Gatekeep's player store sets `activeLineIndex === -1`.
- **Zero Dereference Crashes**: Neither `<ConstellationTheme />` nor `<ConstellationLyrics />` attempts to access `lyrics[-1]`. `estimateWordTimings` explicitly returns an empty array `[]` when `line` is undefined or has no text.
- **Ambient Celestial Mode**: In the pre-vocal intro state (`activeLineIndex === -1`), `<ConstellationLyrics />` renders null, while `<ConstellationCanvas />` renders an atmospheric starlight drift: 45 twinkling ambient stardust motes with harmonic micro-drift, accompanied by a gentle central breathing ring ($R=28\text{px}$, $\pm 3\%$ harmonic radius breath), creating a serene holding pattern until the first vocal phrase begins.

---

### 3.3 High-Frequency Playback State Management
1. **Canvas Render Loop (`ConstellationCanvas.tsx`)**:
   ```typescript
   useEffect(() => {
     let animationFrameId: number;

     const renderLoop = (timestamp: number) => {
       // Pull playback state directly from store without subscribing React hook:
       const { currentTimeMs, isPlaying } = usePlayerStore.getState();

       // Render geometry, stars, reticle, and particle drift
       drawConstellationScene(ctx, currentTimeMs, isPlaying, timestamp);

       animationFrameId = requestAnimationFrame(renderLoop);
     };

     animationFrameId = requestAnimationFrame(renderLoop);
     return () => cancelAnimationFrame(animationFrameId);
   }, []);
   ```
2. **Typography Layer Subscription (`ConstellationLyrics.tsx`)**:
   ```typescript
   // Subscribes ONLY to line index changes (transitions every 2-6 seconds):
   const activeLineIndex = usePlayerStore((s) => s.activeLineIndex);
   const currentLine = lyrics[activeLineIndex];
   ```
   *Result*: React reconciles only once per phrase, while the canvas animates lines and reticles smoothly at 60fps.

---

### 3.4 Lyric Timestamp Granularity & Word Timing Engine
#### Current State in Gatekeep
Gatekeep's existing lyric data in `src/lib/lrclib.ts` and `src/data/demoTracks.ts` provides timestamps exclusively at the line level:
```typescript
export interface LyricLine {
  timeMs: number;
  text: string;
}
```

#### Non-Breaking Extension & Genuine vs Estimated Timestamps
We extend `LyricLine` with an optional `words?: LyricWord[]` field. This is 100% backward-compatible with all 15 existing visualizers:

```typescript
export interface LyricWord {
  id: string;
  text: string;
  startMs: number;
  endMs: number;
  charCount: number;
  isPunctuation?: boolean;
  isEstimated: boolean; // TRUE when estimated procedurally, FALSE when sourced from true word-level sync
}

export interface LyricLine {
  timeMs: number;
  text: string;
  words?: LyricWord[]; // Optional — never breaks existing line-level consumers
}
```

#### Multilingual Word Segmentation with `Intl.Segmenter` Fallback
For Western languages, words are space-delimited. However, for Chinese (Hanzi), Japanese (Kanji/Kana), and Thai, words are written without spaces. To avoid treating entire Japanese or Chinese lyric phrases as single unbreakable mega-words, Constellation employs native `Intl.Segmenter` where available:

```typescript
export function segmentWords(text: string): string[] {
  if (!text) return [];

  // Check if text contains CJK characters
  const hasCJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(text);

  if (hasCJK && typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new Intl.Segmenter(['ja', 'zh'], { granularity: 'word' });
      const segments = Array.from(segmenter.segment(text));
      return segments
        .map((s) => s.segment.trim())
        .filter(Boolean);
    } catch {
      // Fallback below
    }
  }

  // Standard whitespace tokenization for space-separated languages
  return text.trim().split(/\s+/).filter(Boolean);
}
```

#### Weighted Word-Timing Estimation Heuristic (`estimateWordTimings`)
For songs without explicit word-level sync, Constellation uses a weighted duration allocation heuristic:

```typescript
export function estimateWordTimings(
  line: LyricLine | undefined | null,
  nextLineTimeMs: number,
  trackDurationMs?: number
): LyricWord[] {
  // Pre-vocal intro / negative index guard: gracefully return empty array when activeLineIndex === -1
  if (!line || !line.text) return [];
  // If genuine word timestamps are already present on the line, use them directly:
  if (line.words && line.words.length > 0) return line.words;

  const rawWords = segmentWords(line.text);
  if (rawWords.length === 0) return [];

  const lineStart = line.timeMs;

  // Instrumental Interlude Duration Capping:
  // In songs with long guitar solos or instrumental breaks, the raw gap between lines
  // can span 30-60+ seconds. Capping speech duration prevents stretching words into extreme slow-motion.
  const rawDuration = nextLineTimeMs > lineStart ? (nextLineTimeMs - lineStart) : 3500;
  const maxSpeechDuration = Math.max(2500, rawWords.length * 600);
  const lineDuration = Math.max(800, Math.min(rawDuration, maxSpeechDuration));

  // Weight words by character count + trailing punctuation pause (Unicode-Compliant)
  const weights = rawWords.map((word) => {
    const cleanWord = word.replace(/[^\p{L}\p{N}]/gu, '');
    const cleanLength = Math.max(1, cleanWord.length);
    // Support trailing quotes, brackets, and parentheticals after punctuation
    const hasPunctuation = /[,.!?;:]["'\)\]}]*$/.test(word);
    return cleanLength + (hasPunctuation ? 1.8 : 0);
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  let currentStart = lineStart;
  return rawWords.map((word, idx) => {
    const duration = (weights[idx] / totalWeight) * lineDuration;
    const end = currentStart + duration;
    const result: LyricWord = {
      id: `${line.timeMs}-${idx}-${word}`,
      text: word,
      startMs: Math.round(currentStart),
      endMs: Math.round(end),
      charCount: word.length,
      isEstimated: true, // Marked as procedurally estimated
    };
    currentStart = end;
    return result;
  });
}
```

#### React Re-render Boundary & Seeking Safety
- **Word Index Subscription**: React DOM `<ConstellationLyrics />` only updates when the discrete `activeWordIndex` changes (e.g. 2-5 times per phrase, not at 60fps).
- **Seeking & Scrubbing Robustness**: When the user scrubs forward or backward, `currentTimeMs` jumps discontinuously. The timing engine immediately clamps active progress:
  - If scrubbing backwards before the line starts, progress snaps cleanly to `0` without negative drawing artifacts.
  - If scrubbing past the phrase into an instrumental solo, the reticle detaches into ambient holding pattern.
  - Pause and resume events naturally freeze and restart the RAF canvas loop without desynchronization.
```

#### International Unicode Support in `estimateWordTimings`
Standard ASCII cleaning regexes (`/[^a-zA-Z0-9]/g`) strip 100% of non-Latin characters (e.g., Japanese `"こんにちは"`, Chinese `"星座"`, Cyrillic `"звезда"`), reducing all words in international songs to length 0 and assigning them identical fallback weights (`baseWeight = 1`). By employing Unicode property escapes `/[^\p{L}\p{N}]/gu` and `const cleanLength = Math.max(1, cleanWord.length);`, full character-length fidelity is preserved across:
- **East Asian Languages**: Japanese (Kanji, Hiragana, Katakana), Chinese (Simplified & Traditional Hanzi), and Korean (Hangul).
- **Cyrillic Scripts**: Russian, Ukrainian, Bulgarian, Serbian.
- **Accented Latin Alphabets**: Spanish (`canción`), French (`fenêtre`), German (`überrascht`), Portuguese (`coração`), Nordic, and Slavic languages.
- **Punctuation Pacing**: The enhanced regex `/[,.!?;:]["'\)\]}]*$/` correctly recognizes dialogue and bracketed lyrics (e.g. `"wait!"`, `(forever,)`), reliably awarding the intended $+1.8$ phrasing cadence bonus.

#### Instrumental Interlude & Ambient Detach Behavior
When a vocal phrase concludes during an extended instrumental interlude or guitar solo (`currentTimeMs > lineStart + lineDuration + 800ms`), the visualizer smoothly fades out completed phrase typography and connector lines over 800ms. Rather than remaining frozen on the final word for 30–60 seconds, the focal reticle gracefully detaches from the vertex, scaling down into an unpinned, softly breathing ambient starlight ring ($R=24\text{px}$) drifting neutrally through the stardust field until the subsequent lyric line approaches.

---

### 3.5 Spotify & Demo Playback Synchronization Engine
- **Demo Playback**: Direct synchronization with `HTMLAudioElement.currentTime * 1000` via `AudioController.tsx`.
- **Spotify Playback**:
  - Polling interval: 2000ms (`useSpotifyStore.ts`).
  - Local interpolation: `AudioController.tsx` adds `performance.now() - lastPollTimestamp` to the base progress.
  - Drift snap threshold: 1200ms. If drift exceeds 1200ms, time snaps to Spotify's server position; otherwise, smooth local interpolation continues uninterrupted.
  - Seeking re-sync: Fast-poll triggered 250ms after seeking to instantly update constellation node anchors.

---

## 4. Gatekeep Integration and Constraints Compliance

### 4.1 ThemeRegistry & Gallery Integration
In `src/components/visualizer/themes/ThemeRegistry.ts`:
- Append `'constellation'` to `ThemeId` union type.
- Define `CONSTELLATION_THEME` metadata:
  ```typescript
  export const CONSTELLATION_THEME: ThemeMeta = {
    id: 'constellation',
    name: 'Constellation',
    category: 'Atmospheric',
    tagline: 'Kinetic Star Mapping, Geometric Word Links & Celestial Drift',
    accentColor: '#E2B857', // Starlight Gold
    bgPreviewClass: 'bg-[#030308] border border-amber-400/30',
  };
  ```

---

### 4.2 Theme Registry Architecture & Test Suite Accommodation (Approved: Strategy B)
Gatekeep's existing test suite in `tests/tier1/f71_spotify_sync_and_header.test.mjs:42` contains an assertion expecting 15 themes:
```javascript
test('ThemeRegistry: total theme count is 15 and getThemeMeta correctly looks up metadata', () => {
  expect(VISUALIZER_THEMES).toHaveLength(15);
  ...
});
```

#### Approved Direction: Strategy B (Single Authoritative Theme Registry)
The user has explicitly selected **Strategy B** to keep a clean, single authoritative theme registry:
1. **Direct Addition to `VISUALIZER_THEMES`**: Add `CONSTELLATION_THEME` directly to `VISUALIZER_THEMES` in `src/components/visualizer/themes/ThemeRegistry.ts`. The total theme count officially becomes **16**.
2. **Update Test Suite Assertion**: Update `tests/tier1/f71_spotify_sync_and_header.test.mjs:42` from `expect(VISUALIZER_THEMES).toHaveLength(15);` to:
   ```javascript
   expect(VISUALIZER_THEMES).toHaveLength(16);
   ```
   Add a verification check asserting `getThemeMeta('constellation')` resolves correctly with accent `#E2B857` and category `'Atmospheric'`.
3. **Synchronize UI Counts & Labels**:
   - In `src/app/page.tsx:291`: Update `title="Open Visualizer Theme Gallery (15 Themes, Shortcut: 'V')"` to `title="Open Visualizer Theme Gallery (16 Themes, Shortcut: 'V')"`. The dynamic badge `({VISUALIZER_THEMES.length})` will automatically evaluate to `(16)`.
   - In `src/components/player/FloatingPlayerBar.tsx`: Add `'constellation'` to the button label ternary (`CONSTELLATION`) and the quick-picker popover theme list.
   - In `src/components/visualizer/KineticLyrics.tsx`: Add `'constellation'` to the toast label mapping (`'Constellation'`).
4. **Duplicate ID Check**: Verify `ThemeId` and `VISUALIZER_THEMES` contain zero duplicate IDs across all 16 entries.
5. **No Dual-Tier Workaround**: We do **not** introduce any dual-tier `VISUALIZER_THEMES` / `ALL_THEMES` split. `VISUALIZER_THEMES` remains the single source of truth for the entire application.

---

### 4.3 Keyboard Shortcuts & Legacy Mode Cycling Invariant
- **The Invariant**: Multiple test suites (`tests/challenger1_m5_stress.test.mjs`, `tests/challenger2_m5_stress.test.mjs`, `tests/tier1/f49_f55_video_edit_visualizer.test.mjs`) strictly assert that `cycleVisualizerMode()` cycles through exactly 3 modes (`['video-edit', 'apple-spatial', 'cyberpunk']`) with period 3.
- **Compliance Plan**:
  - **DO NOT MODIFY `cycleVisualizerMode()`**. Keep `VISUALIZER_MODES = ['video-edit', 'apple-spatial', 'cyberpunk']` exactly as is.
  - Add `'constellation'` to `THEME_MODES` in `src/stores/usePlayerStore.ts` (used by `cycleTheme()`).
  - When the user presses the 'V' key while in `'constellation'`, `cycleVisualizerMode()` executes. Since `'constellation'` is not in `['video-edit', 'apple-spatial', 'cyberpunk']`, it cleanly falls back to `'video-edit'`, strictly satisfying the recovery test in `tests/challenger2_m5_it2_verification.test.mjs:278`.

---

### 4.4 Layout Clearance & Z-Index Matrix

```
┌────────────────────────────────────────────────────────────────────────┐
│ Layer 5: Modals (z-50)                                                 │
│ • VisualizerThemeSelector, StudyHUD, CommandBar                        │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 4: HUD & Controls (z-40)                                         │
│ • Header HUD (top: 0, height: 60px, auto-hides after 2200ms idle)      │
│ • Floating Player Bar (bottom: 24px, height: 68px, total bottom: 92px) │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 3: Synced Lyric Viewport (z-10)                                  │
│ • Constellation Theme: fixed inset-0 pointer-events-none               │
│ • Interactive word vertices: pointer-events-auto                       │
│ • Safe vertical layout bounds:                                         │
│   - Desktop (H >= 700px): yMin = 0.18 * H, yMax = 0.72 * H             │
│   - Mobile  (H < 700px):  yMin = 0.18 * H, yMax = 0.65 * H             │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 1: Ambient Backdrop (z-0 / -z-10)                                │
│ • AmbientShader WebGL / ParticleDust / Album Cover Wash                │
└────────────────────────────────────────────────────────────────────────┘
```

The vertical layout engine guarantees that no constellation star nodes or active lyric headlines collide with interface controls:
- **Desktop / Tablet ($H \ge 700\text{px}$)**: $y_{\text{node}} \in [0.18H, 0.72H]$, providing generous clearance for the top Header HUD (60px) and bottom Floating Player Bar (92px).
- **Mobile / Compact Displays ($H < 700\text{px}$)**: $y_{\text{node}} \in [0.18H, 0.65H]$. Active headline text extends downward by $+74\text{px}$ (anchor offset $+22\text{px}$, font height $36\text{px}$, bloom radius $16\text{px}$). Clamping $y_{\text{node}} \le 0.65H$ ensures that on compact screens (e.g. iPhone SE with $H = 568\text{px}$), the active text bottom ($443\text{px}$) clears the Floating Player Bar top ($476\text{px}$) by over $33\text{px}$.
- **Horizontal Boundary Clamping**: Long words are clamped horizontally to prevent edge overflow:
  $$x_{\text{text, clamped}} = \max\left(16\text{px}, \min\left(W - \text{wordWidth} - 16\text{px}, x_{\text{node}} - \frac{\text{wordWidth}}{2}\right)\right)$$
  accompanied by dynamic font scaling down to $22\text{px}–26\text{px}$ on viewports with $W < 480\text{px}$.

---

### 4.5 Session Persistence & Cross-Feature Compatibility
- **Persistence**: Selected visualizer mode is saved to `localStorage` under the exact key `'vibesync_visualizer_mode'` (`localStorage.setItem('vibesync_visualizer_mode', 'constellation')`), satisfying `tests/tier2/b49_b55_visualizer_boundaries.test.mjs:304`.
- **Study HUD ('S')**: Fullscreen study HUD overlays at `z-50` with `backdrop-blur-2xl`. Constellation continues running smoothly in the background.
- **Document Picture-in-Picture (PiP)**: When lyrics are popped out into PiP, the main window retains Constellation rendering without crashing.

---

## 5. Technical Challenges and Performance Solutions

### 5.1 Word Timing Accuracy & Fallback Heuristics
- **Challenge**: Standard LRC only gives line start times; raw syllable timings are absent. Additionally, unbounded gaps during instrumental solos (30–60s) would stretch words into unnatural slow-motion, freezing the active focal reticle in place.
- **Solution**:
  - The weighted character-and-punctuation estimation algorithm (`estimateWordTimings`) creates a natural pacing rhythm, giving longer words and punctuated phrase endings more weight.
  - **Instrumental Interlude Capping**: Phrase speech duration is strictly bounded:
    $$\text{rawDuration} = \text{nextLineTimeMs} > \text{lineStart} \ ? \ (\text{nextLineTimeMs} - \text{lineStart}) : 3500$$
    $$\text{maxSpeechDuration} = \max(2500, \text{words.length} \times 600)$$
    $$\text{lineDuration} = \max(800, \min(\text{rawDuration}, \text{maxSpeechDuration}))$$
  - **Smooth Detachment into Ambient Drift**: When vocalization concludes ($\text{currentTimeMs} > \text{lineStart} + \text{lineDuration} + 800\text{ms}$), the focal reticle smoothly detaches from the finished word, transitions to an unpinned starlight ring, and enters an ambient cosmic drift state rather than remaining frozen for 30 seconds during a guitar solo.
  - **Full International Unicode Support**: Character-length weighting uses `/[^\p{L}\p{N}]/gu`, preserving Kanji, Hanzi, Hangul, Cyrillic, and accented Latin scripts.

### 5.2 Adaptive Rendering, Performance & Tab Visibility
- **Challenge**: Drawing dozens of lines, diamond stars, and radial glows each frame can cause frame drops on lower-spec hardware, especially if Gatekeep's other background engines (`AmbientShader` WebGL fluid and `ParticleDust` 2D canvas) run simultaneously.
- **Solution & Adaptive Optimizations**:
  - **Suppress Conflicting Background Engines**: In `src/app/page.tsx:238-241`, when `visualizerMode === 'constellation'`, `<ParticleDust />` is omitted and `<AmbientShader />` opacity is reduced to `0.20`, eliminating duplicate canvas overdraw and freeing GPU bandwidth exclusively for Constellation's celestial geometry.
  - **Page Visibility API (`document.hidden`)**: The RAF canvas loop listens to `visibilitychange`. When the browser tab is hidden or minimized, animation rendering pauses immediately, reducing background CPU/GPU utilization to 0%.
  - **Adaptive Rendering & Device Tiering**: On devices with detected low frame rates or high DPR, `shadowBlur` can be dynamically disabled and background motes reduced from 45 to 15, prioritizing smooth interactivity rather than promising an unrealistic blanket 60fps on all low-end mobile hardware.
  - **Batching Hairline Draws**: Connectors are batched into a single `beginPath()` and `stroke()` call per opacity tier.
  - **Polygon Astroids**: Astroid star nodes use closed 4-point polygon paths rather than expensive bezier curves.
  - **Canvas DPR Clamp**: Canvas dimensions are clamped to `Math.min(window.devicePixelRatio, 2)`.

### 5.3 GPU Fill-Rate, Memory Leaks & Garbage Collection
- **Challenge**: Repeated canvas path allocations and object instantiation within `requestAnimationFrame` cause garbage collection stutter.
- **Solution**:
  - Pre-allocate a fixed pool of 60 `StarNode` and 45 `StardustMote` objects.
  - Re-use mathematical coordinate buffers across animation frames.
  - Clear canvas with a single `ctx.clearRect(0, 0, width, height)` per frame.

### 5.4 Mobile Performance, Touch Interaction & Reduced Motion
- **Challenge**: Mobile phones have narrow viewports, 3x pixel ratios, and varying GPU capabilities.
- **Solution**:
  - Clamping DPR to 2.0 cuts canvas fill pixels by 55% on 3x screens while maintaining sharp subpixel hairlines.
  - Touch target hitboxes for clickable lyric stars are padded to a minimum of 36x36px.
  - **Accessibility (`prefers-reduced-motion`)**: Respects `useReducedMotion()`. If reduced motion is active:
    - Continuous drift physics and star twinkle loops are frozen into a clean static celestial frame.
    - Active reticle spring tracking is replaced with direct position snaps.
    - Word activation transitions use gentle opacity crossfades without scale inflation or elastic bounce.

### 5.5 Zero-Dependency Track-Adaptive Palette Extraction & Cross-Origin Safety
- **Challenge**: Extracting dominant palettes typically requires heavy libraries (e.g. `colorthief`, `node-vibrant`). Furthermore, external album artwork fetched from Spotify CDNs (`i.scdn.co`) can trigger DOM `SecurityError` exceptions when calling `ctx.getImageData()` on a tainted canvas.
- **Solution**:
  - Constellation uses a lightweight, zero-dependency offscreen canvas sampler (`paletteExtractor.ts`) that downscales album art to 48x48px and computes channel vibrancy in <2ms.
  - **Cross-Origin Security Wrapper**: All `ctx.getImageData()` executions are protected inside a `try...catch` block with image readiness checks (`image.complete && image.naturalWidth > 0`).
  - **Pre-computed Palette Fallback**: If canvas tainting or network errors occur, the sampler gracefully falls back to Gatekeep's pre-computed `currentTrack.palette` from `usePlayerStore`, or defaults to the calibrated `silver-slate` / `solar-gold` presets, completely preventing unhandled runtime exceptions.

### 5.6 Regression Prevention Strategy
- Maintain strict backward compatibility for all 15 existing themes.
- Preserve legacy `cycleVisualizerMode()` behavior.
- Ensure all test assertions across Tiers 1 through 4 pass without error.

---

## 6. Requirements From Me (Categorized)

### 6.1 Essential Requirements
1. **HTML5 2D Canvas Engine (`<ConstellationCanvas />`)**: Autonomous 60fps render loop rendering hairlines, triangulated polygons, 4-pointed diamond star vertices, and animated focal crosshairs.
2. **React DOM Typography Layer (`<ConstellationLyrics />`)**: High-contrast, subpixel Inter typography with 2x–3x active word enlargement and Framer Motion transitions.
3. **Decoupled Playback Subscription**: Canvas pulls `usePlayerStore.getState().currentTimeMs` imperatively; React DOM subscribes only to `activeLineIndex` and word index transitions.
4. **Weighted Word-Timing Heuristic (`estimateWordTimings`)**: Character length and punctuation weighting for line-level fallback.
5. **ThemeRegistry Integration (Strategy B)**: Register Constellation directly into `VISUALIZER_THEMES` (16 total themes), update tests and UI headers to 16, with zero duplicate IDs and a single authoritative registry.
6. **Persistence**: Store `'constellation'` in `localStorage.setItem('vibesync_visualizer_mode', 'constellation')`.

### 6.2 Optional / Atmospheric Enhancements
1. **Screen Bezel Neon Glow**: 1.5px glowing perimeter line hugging screen edges and notch.
2. **Track-Adaptive Duotone Background**: Full-bleed duotone wash mapped over album artwork.
3. **Top Serif Clock Header**: Didot / New York editorial clock (`19:13`) centered at the top.
4. **Audio-Reactive Energy Pulsing**: Canvas line glow and star flares scaling subtly with Web Audio analyser bass/treble energy.

### 6.3 Technical / Performance Requirements
1. **Frame Rate Threshold**: Maintain 60fps on modern desktop browsers and mobile devices.
2. **DPR Clamping**: Clamp device pixel ratio to 2.0 (`Math.min(window.devicePixelRatio, 2)`).
3. **Safe Area Clearance**: Constellation layout constrained to $y \in [0.18H, 0.72H]$ on desktop/tablet ($H \ge 700\text{px}$) and $y \in [0.18H, 0.65H]$ on mobile ($H < 700\text{px}$), with horizontal word clamping, guaranteeing complete clearance above the Floating Player Bar.
4. **Reduced Motion Compliance**: Fallback to simple fades when `prefers-reduced-motion` is active.

### 6.4 Package & Dependency Audit
- **Zero New Dependencies Required**:
  - React 19, Next.js 15, Framer Motion 12, Zustand 5, and Tailwind CSS 3 are already installed in Gatekeep.
  - Canvas geometry uses native browser `CanvasRenderingContext2D`.
  - Typography uses bundled `Inter` (`next/font/google`).
  - Icons use bundled `lucide-react`.
- **NPM Command**: No `npm install <package>` commands are needed for Constellation. (Standard `npm install` is only needed to hydrate workspace `node_modules`).

---

## 7. Implementation Roadmap

```
┌────────────────────────────────────────────────────────────────────────┐
│                     CONSTELLATION IMPLEMENTATION PHASES                │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 1: Core Geometry & Word-Timing Foundation                        │
│ - Implement constellationGeometry.ts (stars, reticles, ticks)          │
│ - Implement wordTimingEngine.ts (LyricWord, estimateWordTimings)       │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 2: Decoupled Canvas & Typography Layer Implementation            │
│ - Implement ConstellationCanvas.tsx (60fps decoupled RAF loop)         │
│ - Implement ConstellationLyrics.tsx & ConstellationWord.tsx            │
│ - Implement ConstellationTheme.tsx wrapper                             │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 3: Track-Adaptive Color & Atmosphere Engine                      │
│ - Implement paletteExtractor.ts (fast canvas downsampler)              │
│ - Connect Solar Gold, Crimson Duotone, and Silver/Slate presets        │
│ - Add perimeter bezel neon glow & fluid smoke/duotone backdrop         │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 4: Gatekeep Integration & UI Controls                            │
│ - Update ThemeRegistry.ts (ThemeId, CONSTELLATION_THEME in VISUALIZER) │
│ - Update usePlayerStore.ts (VisualizerMode, THEME_MODES)               │
│ - Update page.tsx tooltip (16 Themes) & suppress background engines    │
│ - Wire into KineticLyrics.tsx, VisualizerThemeSelector, & PlayerBar   │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 5: Verification, Testing & Regression Hardening                  │
│ - Update test assertion (f71_spotify_sync_and_header.test.mjs to 16)   │
│ - Verify legacy cycleVisualizerMode 3-mode period tests                │
│ - Run full 4-tier test harness and inspect visual result in browser    │
└────────────────────────────────────────────────────────────────────────┘
```

### Detailed Phase Milestones

#### Phase 1: Core Geometry & Word-Timing Foundation
- **Tasks**:
  1. Create `src/components/visualizer/themes/Constellation/constellationGeometry.ts` with pure math generators: `drawStarNode`, `drawFocalReticle`, `drawGraduatedLine`.
  2. Create `src/components/visualizer/themes/Constellation/wordTimingEngine.ts` with `LyricWord` interface, `segmentWords` (using `Intl.Segmenter` for CJK), and `estimateWordTimings` heuristic distinguishing estimated vs genuine timestamps.
  3. Write unit tests for word timing estimation, multilingual segmentation, and coordinate collision math.

#### Phase 2: Decoupled Canvas & Typography Layer Implementation
- **Tasks**:
  1. Build `<ConstellationCanvas />`: Canvas 2D element running autonomous decoupled RAF loop, reading `usePlayerStore.getState().currentTimeMs`, drawing lines, stars, reticle, and micro-drift, with `document.hidden` tab visibility pause.
  2. Build `<ConstellationLyrics />` and `<ConstellationWord />`: Framer Motion DOM typography layer subscribing only when the active word index changes.
  3. Combine into `<ConstellationTheme />` implementing `VisualizerThemeProps`.

#### Phase 3: Track-Adaptive Color & Atmosphere Engine
- **Tasks**:
  1. Create `paletteExtractor.ts`: Direct HEX/RGB color parser reading `currentTrack.palette`, hue/saturation sector mapper, and offscreen canvas downsampler with CORS error handling.
  2. Wire `CONSTELLATION_PRESETS` for Solar Gold, Crimson Duotone, and Silver Slate.
  3. Implement ambient screen bezel glow and background duotone wash.

#### Phase 4: Gatekeep Integration & UI Controls (Strategy B)
- **Tasks**:
  1. In `src/components/visualizer/themes/ThemeRegistry.ts`: Add `'constellation'` to `ThemeId`, define `CONSTELLATION_THEME`, and append directly to `VISUALIZER_THEMES` (16 total themes). Single authoritative registry; no `ALL_THEMES` dual-tier export.
  2. In `src/stores/usePlayerStore.ts`: Add `'constellation'` to `VisualizerMode` and `THEME_MODES`. Keep `cycleVisualizerMode()` 3-mode cycle strictly unchanged.
  3. In `src/components/visualizer/KineticLyrics.tsx`: Render `<ConstellationTheme />` when `activeMode === 'constellation'`, and map toast label.
  4. In `src/components/player/FloatingPlayerBar.tsx`: Add `'constellation'` to the label ternary and theme quick-picker array.
  5. In `src/app/page.tsx`:
     - Update tooltip `title="Open Visualizer Theme Gallery (16 Themes, Shortcut: 'V')"` on line 291.
     - When `visualizerMode === 'constellation'`, suppress `<ParticleDust />` and dim `<AmbientShader />` to avoid competing canvas/shader overdraw.

#### Phase 5: Verification, Testing & Regression Hardening
- **Tasks**:
  1. Update `tests/tier1/f71_spotify_sync_and_header.test.mjs:42` to `expect(VISUALIZER_THEMES).toHaveLength(16)` with metadata checks.
  2. Execute `tests/run-all.mjs` across all tiers to verify existing and updated tests pass cleanly.
  3. Verify legacy 'V' key cycling in `tests/challenger1_m5_stress.test.mjs`.
  4. Inspect the actual visual rendering in the browser (`npm run dev`) across tracks, viewports, seeking, pause/resume, and instrumental sections.

---

## 8. Conclusion
This specification establishes a complete, technically robust, and visually faithful implementation plan for the **Constellation** visualizer theme in Gatekeep. By decoupling high-frequency Canvas 2D math from React DOM typography, adopting a non-breaking word timing heuristic, preserving existing test constraints, and honoring Gatekeep's architecture, Constellation will deliver an extraordinary, production-grade celestial music companion.
