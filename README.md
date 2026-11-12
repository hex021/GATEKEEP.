# VibeSync 🎵 — Ultra-Aesthetic Synced Lyrics & Zen Study HUD

[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg?style=for-the-badge)](LICENSE)

> **Ultra-aesthetic, Apple Music-inspired synced lyrics visualizer, study companion HUD, and 9:16 social media "Story Flex" card generator powered by Next.js 15, WebGL, Spotify, and LRCLIB.**

---

## ✨ Features at a Glance

### 1. Dual-Mode Playback Engine
- **Zero-Config Demo Mode (Default)**: Pre-loaded with iconic aesthetic tracks (`apatheia`, `solaris`, `supernova`) with millisecond-accurate `.lrc` synced lyrics, 16-bit PCM audio, dynamic SVG album art, and an automatic 60fps `requestAnimationFrame` sync loop. Works instantly without configuration.
- **Built-in "Bathroom Vibes" Spotify Playlist**: 8 pre-loaded viral tracks (*The 1975, Joji, Tame Impala, The Weeknd, The Neighbourhood, Childish Gambino, Melanie Martinez*) with real audio previews, synced lyrics, and album art ready in 1 click from the Command Bar (`Cmd+K`).
- **1-Click Spotify NextAuth & PKCE**: Connect your Spotify Premium account using NextAuth OAuth 2.0 or direct client-side PKCE. Polls `/v1/me/player/currently-playing` every 2500ms and interpolates timestamps at 60fps for drift-free lyric synchronization.
- **Custom Audio & Lyrics Drag-and-Drop**: Drop any local `.mp3`/`.wav` and `.lrc` file directly onto the app to visualize your favorite tracks.

### 2. 3 Kinetic Visualizer Modes (Hotkey `V`)
- 🎬 **Reel FX (Crazy 3D Video Edit)**: Hardware-accelerated 3D typography (`perspective: 1200px`), dynamic keyword punching with cyan/fuchsia chromatic aberration split backdrops, 120ms spring camera jitter on each lyric change, dynamic sideways & vertical tags (`rotate-90`), and a 60fps retro viewfinder overlay (`[● REC]`, running micro-timecode, 16-band VU audio meters).
- 🪐 **Apple Spatial**: Progressive Gaussian blur hierarchy (`blur(0px)` active to `blur(6px)` future/past lines) with dynamic bloom text glow matching the album color palette.
- 👾 **Cyberpunk Terminal**: CRT scanline grid, chromatic RGB split glitch animations, and monospace targeting brackets (`[0x00] >> ACTIVE_VOX << [00:00.00]`).

### 3. Ambient WebGL Fluid Shader
- Fullscreen GPU quad rendered to an offscreen buffer using Ashima Simplex Fractal Brownian Motion (FBM), domain warping, and anti-banding film grain dither.
- Smooth 4-color liquid LERP crossfading when switching tracks.
- Direct WebGL drawing buffer snapshot bridge (`preserveDrawingBuffer: true`) exporting background textures into story cards.

### 4. "Story Flex" 9:16 Social Exporter
- Interactive 9:16 (1080×1920) story card generator formatted for Instagram Stories, TikTok, and Snapchat.
- 3 distinct aesthetic layouts:
  - **Glassmorphic Apple**: Multi-layered frosted glass with album art vignette and listening vibe badge.
  - **Brutalist Swiss Poster**: High-contrast monochrome typography, architectural grid borders, archival coordinates, and vector barcode.
  - **Thermal Vinyl Receipt**: Serrated receipt edges, monospace itemized track metadata, and financial receipt breakdown (`$0.00 // ZERO REGRETS`).
- **Download High-Res PNG** (`pixelRatio: 3`) and **Direct "Copy to Clipboard"** (`navigator.clipboard.write`).

### 5. Zen Study HUD & Document Picture-in-Picture (Hotkey `S`)
- **Floating Vinyl Turntable**: High-fidelity grooved vinyl record with album art center spindle, rotating smoothly during playback.
- **Pomodoro Focus Timer**: 25/5 or 50/10 intervals with deep work badges, round counter, and `canvas-confetti` celebration.
- **Procedural Ambient Web Audio Engine**: Synthesized vinyl crackle, gentle rain on glass, and brown noise with individual real-time gain sliders layered underneath music.
- **Chromium Document PiP (`window.documentPictureInPicture`)**: Pop out the complete study HUD into an independent floating always-on-top desktop window with automatic stylesheet cloning.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Space</kbd> | Play / Pause music playback |
| <kbd>S</kbd> | Toggle Zen Study HUD (Pomodoro & Ambient noise deck) |
| <kbd>V</kbd> | Cycle Visualizer Mode (Reel FX ⇄ Apple Spatial ⇄ Cyber) |
| <kbd>F</kbd> | Toggle Immersive Fullscreen Mode |
| <kbd>←</kbd> / <kbd>→</kbd> | Seek playback backward / forward by 5 seconds |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Adjust master volume up / down by 10% |
| <kbd>M</kbd> | Toggle mute / unmute audio |
| <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> | Open Command Bar (Search tracks, paste Spotify URLs, jump to lyrics) |
| <kbd>[</kbd> / <kbd>]</kbd> | Nudge lyric sync offset by `-50ms` / `+50ms` (range: `-500ms` to `+500ms`) |
| <kbd>Click on Lyric</kbd> | Seek playback directly to that timestamp |
| <kbd>?</kbd> | Open Keyboard Shortcuts cheat sheet |
| <kbd>Esc</kbd> | Dismiss active modal or exit Zen Study HUD |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.18+ or 20+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/taccoBlade/upgraded-Lyrics.git
cd upgraded-Lyrics

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎧 Spotify Configuration (Optional)

VibeSync runs completely out of the box in **Zero-Config Demo Mode**. To connect your live Spotify account:

1. Visit the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create an app.
2. In **Redirect URIs**, add the following (Spotify requires `127.0.0.1`; `localhost` is disallowed):
   - `http://127.0.0.1:3000/api/auth/callback/spotify` (For 1-Click NextAuth Login)
   - `http://127.0.0.1:3000/callback` (For Client-side PKCE)
   *(Or your production HTTPS URL e.g. `https://your-domain.vercel.app/api/auth/callback/spotify`)*
3. Copy your **Client ID** (and **Client Secret** if using NextAuth).
4. In VibeSync, click **Options** (top right) and paste your Client ID directly into the in-app setup modal (persisted securely in `localStorage`).

Or create a `.env.local` file:

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
NEXT_PUBLIC_REDIRECT_URI=http://127.0.0.1:3000/callback
```

---

## 🛠️ Tech Stack & Architecture

- **Core Framework**: [Next.js 15](https://nextjs.org/) (App Router, Turbopack, React 19)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (Normalized audio engine, timeline, study timer)
- **Styling & Physics**: [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/) (Spring physics, 3D transform matrices)
- **Visuals & Shaders**: WebGL (Simplex noise fragment shaders, liquid color morphing)
- **Audio Synthesis**: Web Audio API (Procedural pink/brown noise, bi-quad filter sweeps)
- **Lyrics Pipeline**: [LRCLIB REST API](https://lrclib.net/) + Sub-millisecond LRC parser
- **Image Generation**: `html-to-image` (High-DPI vector rendering at 3x scale)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🧪 Comprehensive Verification Suite

VibeSync includes an automated 4-tier test harness with **702 passing tests**:

```bash
# Run complete test suite (Tiers 1-4)
node tests/run-all.mjs
```

- **Tier 1**: Deterministic unit tests (LRC parsing, timing, Zustand stores, state reducers).
- **Tier 2**: Component invariants, boundary guards, adversarial stress tests.
- **Tier 3**: WebGL shader contexts, audio controllers, and integration flows.
- **Tier 4**: Production build validation and deployment safety checks.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
