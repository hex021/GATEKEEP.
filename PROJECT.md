# Project: VibeSync

## Architecture
VibeSync is a production-ready aesthetic synced lyrics visualizer, study HUD, and social card exporter web application built with Next.js 15 (App Router, React 19), Tailwind CSS, Zustand, Framer Motion, and Lucide React.

```
                    ┌──────────────────────────────────────────────┐
                    │               App Root Shell                 │
                    │        (layout.tsx, globals.css, page.tsx)   │
                    └──────────────────────┬───────────────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         ▼                                 ▼                                 ▼
┌──────────────────┐             ┌──────────────────┐             ┌──────────────────┐
│  Playback Engine │             │ Kinetic Visuals  │             │ Zen Study HUD    │
│  & Auth Store    │             │ & WebGL Shader   │             │ & Document PiP   │
├──────────────────┤             ├──────────────────┤             ├──────────────────┤
│ - usePlayerStore │             │ - AmbientShader  │             │ - StudyHUD       │
│ - useSpotifyStore│             │   (WebGL Quad,   │             │ - MiniLyricsHUD  │
│ - AudioController│             │    liquid LERP,  │             │ - AmbientAudio   │
│ - FloatingBar    │             │    film grain)   │             │   (Crackle/Rain/ │
│ - CommandBar     │             │ - KineticLyrics  │             │    Brown Noise)  │
│ - SpotifyModal   │             │   (Spring 180/25,│             │ - Pomodoro Timer │
│ - PKCE Auth      │             │    active glow,  │             │   (Confetti)     │
│ - Demo Assets    │             │    blur-sm..md,  │             │ - useDocumentPip │
│                  │             │    click-to-seek)│             │   (Style clone)  │
└────────┬─────────┘             └────────┬─────────┘             └──────────────────┘
         │                                │
         └────────────────┬───────────────┘
                          ▼
            ┌───────────────────────────┐
            │   Story Flex Generator    │
            │  (9:16 1080x1920 Export)  │
            ├───────────────────────────┤
            │ - StoryFlexModal          │
            │ - GlassAppleCard          │
            │ - BrutalistSwissCard      │
            │ - VinylReceiptCard        │
            │ - html-to-image (ratio 3) │
            │ - Snapshot Bridge         │
            │ - /api/proxy-image        │
            └───────────────────────────┘
```

## Code Layout
- `src/app/`
  - `globals.css`: Tailwind directives, base fonts, typography, scrollbars
  - `layout.tsx`: Root HTML layout, font setup, metadata
  - `page.tsx`: Main page coordinating visualizer, floating dock, modals
  - `callback/page.tsx`: Spotify PKCE OAuth callback handler
  - `api/proxy-image/route.ts`: Base64 image proxy with SSRF validation
- `src/stores/`
  - `usePlayerStore.ts`: Playback state, track data, 60fps time, lyrics, sync offset
  - `useSpotifyStore.ts`: Spotify authentication, device status, polling, commands
  - `useStudyStore.ts`: Study HUD toggle, Pomodoro state, ambient sound volumes, PiP state
- `src/lib/`
  - `lrclib.ts`: Enhanced LRCLIB parser, multi-timestamp line support, binary search
  - `spotifyAuth.ts`: Web Crypto PKCE generator, token exchange, localStorage Client ID
  - `colorExtractor.ts`: WebGL palette color helpers, hexToRgb, LERP math
  - `utils.ts`: cn(), formatTime()
- `src/components/player/`
  - `AudioController.tsx`: HTML5 audio wrapper, 60fps rAF sync loop, autoplay error catch
  - `FloatingPlayerBar.tsx`: Glassmorphic bottom dock, scrub bar, controls, offset pill
  - `CommandBar.tsx`: Cmd+K modal for Spotify URL paste & track jump
  - `SpotifySetupModal.tsx`: In-app Client ID configuration with localStorage persistence
- `src/components/visualizer/`
  - `AmbientShader.tsx`: Fullscreen WebGL fluid fragment shader with liquid LERP & film grain
  - `KineticLyrics.tsx`: Framer Motion kinetic typography viewport (stiffness 180, damping 25)
- `src/components/story/`
  - `StoryFlexModal.tsx`: Export modal with live preview, layout switch, 1080x1920 PNG export
  - `layouts/GlassAppleCard.tsx`: Frosted glass 9:16 layout
  - `layouts/BrutalistSwissCard.tsx`: International Typographic Style brutalist layout
  - `layouts/VinylReceiptCard.tsx`: Vintage thermal paper vinyl receipt layout
- `src/components/study/`
  - `StudyHUD.tsx`: Fullscreen distraction-free study HUD
  - `MiniLyricsHUD.tsx`: Focused single-line lyric streaming
  - `AmbientAudioEngine.ts`: Web Audio procedural sound synthesis (crackle, rain, brown noise)
- `src/hooks/`
  - `useDocumentPip.ts`: Native Chromium Document PiP hook with stylesheet cloning
  - `useKeyboardShortcuts.ts`: Global keyboard shortcut listeners ('S', Space, Cmd+K)
- `src/data/`
  - `demoTracks.ts`: 3 curated aesthetic tracks with palettes, lyrics, quotes
- `public/demo/`
  - `apatheia.mp3`, `solaris.mp3`, `supernova.mp3`: Standalone audio assets
  - `covers/neo-tokyo.svg`, `covers/solaris.svg`, `covers/supernova.svg`: High-res vector artwork

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | App Scaffolding & Shell | Next.js 15 root layout, dark theme globals.css, viewport setup | M1 | survey |
| 2 | Demo Track Audio & Cover Assets | Standalone royalty-free audio files and SVG cover art in /public/demo/ | M1 | survey |
| 3 | Core Unified Player Store | Zustand store managing mode, track, playback, time, volume, lyrics | M1 | survey |
| 4 | Zero-Config Demo Mode Engine | HTML5 AudioController with 60fps rAF loop advancing timestamps smoothly | M1 | survey |
| 5 | Spotify PKCE Auth Client | In-browser Web Crypto PKCE, token exchange, localStorage Client ID | M1 | survey |
| 6 | Spotify Live Sync Engine | Polling every 2500ms with local 60fps rAF interpolation, observer mode | M1 | survey |
| 7 | Floating Glassmorphic Player Bar | Scrub bar, track metadata, play/pause, volume, sync offset adjuster pill | M1 | survey |
| 8 | Command Bar (Cmd+K) | URL paste command bar for Spotify tracks, quick track jump | M1 | survey |
| 9 | Spotify Setup Modal | In-app Client ID configuration with redirect URI copy button | M1 | survey |
| 10 | Autoplay Resilience Pill | Catch NotAllowedError on audio.play() and display pulsing unmute prompt | M1 | survey |
| 11 | Enhanced LRCLIB Parser | Handle [mm:ss.xx], [mm:ss.xxx], metadata ignore, multi-timestamp lines | M2 | survey |
| 12 | Binary Search Active Line Detector | O(log N) lookup applying manual sync offset [-500ms, +500ms] | M2 | survey |
| 13 | Kinetic Typography Viewport | Framer Motion spring physics (stiffness: 180, damping: 25) | M2 | survey |
| 14 | Active Line Glow & Visual Weight | Text glow, scale: 1.04, white drop shadow for active lyric | M2 | survey |
| 15 | Inactive Progressive Blur | Distance-based blur-sm to blur-md and opacity decay (15%-55%) | M2 | survey |
| 16 | Click-to-Seek Typography | Clicking any lyric line seeks playback to that line's timestamp | M2 | survey |
| 17 | Auto-Centering Scroll Engine | Smooth scroll to active line with user scroll pause/resume (3.5s timeout) | M2 | survey |
| 18 | Manual Sync Offset Controls | Step adjustments (-50ms/+50ms) and reset pill for -500ms to +500ms | M2 | survey |
| 19 | Fullscreen WebGL Quad Pipeline | Context with preserveDrawingBuffer: true, low-res buffer with bilinear CSS stretch | M3 | survey |
| 20 | Procedural GLSL Fluid Shader | Simplex noise + FBM domain warping with 4-color palette spatial blending | M3 | survey |
| 21 | Procedural GLSL Film Grain & Dither | High-frequency dither hash eliminating 8-bit gradient banding | M3 | survey |
| 22 | Liquid LERP Color Crossfading | Dynamic color morphing: currentRGB += (targetRGB - currentRGB) * 0.05 | M3 | survey |
| 23 | WebGL Snapshot Bridge | captureVisualizerSnapshot() via .toDataURL() for R4 export | M3 | survey |
| 24 | WebGL Context Resilience & Fallback | webglcontextlost recovery and CSS radial gradient fallback | M3 | survey |
| 25 | Glassmorphic Apple Story Card | 9:16 frosted glass card with drop shadow, album art, glow, vibeTag | M4 | survey |
| 26 | Brutalist Swiss Poster Card | 9:16 International Typographic Style card, stark contrast, grid lines, barcode | M4 | survey |
| 27 | Vinyl Receipt Story Card | 9:16 thermal receipt paper card, jagged cut, monospace typography, barcode | M4 | survey |
| 28 | Story Flex Export Modal | Interactive 9:16 modal preview, layout tabs, lyric selector, export trigger | M4 | survey |
| 29 | High-Res 1080x1920 PNG Exporter | html-to-image with pixelRatio: 3 from base 360x640px DOM container | M4 | survey |
| 30 | Base64 Image Proxy API Route | /api/proxy-image?url=... with SSRF validation preventing CORS canvas taint | M4 | survey |
| 31 | Font Loading Export Guard | await document.fonts.ready; prior to rasterization | M4 | survey |
| 32 | Explicit Lucide Icon Sizing | Explicit numerical size={...} props on all icons preventing SVG collapse | M4 | survey |
| 33 | Zen Study HUD Mode Overlay | Fullscreen distraction-free HUD toggled via 'S' key or button | M5 | survey |
| 34 | Keyboard Shortcut 'S' | Guarded key listener ('S') ignoring text inputs and modifier keys | M5 | survey |
| 35 | Spinning Vinyl Visualization | CSS 33 1/3 RPM rotation synced with isPlaying state | M5 | survey |
| 36 | MiniLyrics Focused Subtitle | Clean single-line synchronized lyric subtitle block | M5 | survey |
| 37 | Drift-Free Pomodoro Timer | 25/5 and 50/10 focus presets, wall-clock delta calculation | M5 | survey |
| 38 | Celebratory Confetti Celebration | canvas-confetti burst upon work session completion | M5 | survey |
| 39 | Procedural Vinyl Crackle Generator | Web Audio stochastic impulse noise generator with volume slider | M5 | survey |
| 40 | Procedural Rain on Window Generator | Web Audio filtered noise with 0.15Hz LFO wind gusts and volume slider | M5 | survey |
| 41 | Procedural Brown Noise Generator | Web Audio leaky integrator noise generator with volume slider | M5 | survey |
| 42 | Ambient Engine Power Management | Master audio bus auto-suspension when all ambient volumes are 0 | M5 | survey |
| 43 | Native Chromium Document PiP | window.documentPictureInPicture opening 420x520 window | M5 | survey |
| 44 | PiP Stylesheet & Style Cloning | Deep cloning of link[rel="stylesheet"] and style tags to PiP head | M5 | survey |
| 45 | React 19 Portal Rendering in PiP | createPortal mounting StudyHUD inside PiP body with live state sync | M5 | survey |
| 46 | Document PiP Non-Chromium Fallback | Safe feature detection and graceful in-tab HUD fallback | M5 | survey |
| 47 | E2E Requirement-Driven Test Suite | Opaque-box test suite verifying Tiers 1-4 across all features | M6 | survey |
| 48 | Adversarial Coverage Hardening | Tier 5 white-box challenger stress tests and boundary edge cases | M6 | survey |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Playback Engine & Architecture | Features 1–10: Next.js app shell, demo assets in /public/demo/, usePlayerStore, useSpotifyStore, AudioController with 60fps rAF loop, FloatingPlayerBar, CommandBar, SpotifySetupModal, PKCE auth, autoplay resilience | none | DONE |
| M2 | LRC Synced Lyrics & Kinetic Viewport | Features 11–18: Enhanced parseLrc (multi-timestamp lines), findActiveLyricIndex (binary search with offset), KineticLyrics (Framer Motion spring stiffness 180, damping 25, active glow, progressive blur, auto-centering scroll, click-to-seek, manual offset) | M1 | DONE |
| M3 | WebGL Ambient Fluid Shader | Features 19–24: AmbientShader component, fullscreen quad, low-res buffer + bilinear CSS stretch, GLSL simplex/FBM noise, procedural film grain, liquid LERP color morphing, WebGL context loss recovery, snapshot bridge capture | M1 | DONE |
| M4 | 9:16 Story Flex Social Card Generator | Features 25–32: 3 card layouts (GlassAppleCard, BrutalistSwissCard, VinylReceiptCard) at base 360x640px, StoryFlexModal, html-to-image 1080x1920 export, /api/proxy-image API route, font ready guard, explicit icon sizes | M1, M2, M3 | DONE |
| M5 | Zen Study HUD Mode & Document PiP | Features 33–46: StudyHUD fullscreen overlay, 'S' key listener, spinning vinyl/cassette, MiniLyricsHUD, drift-free Pomodoro (25/5, 50/10) with confetti, AmbientAudioEngine (crackle, rain, brown noise), useDocumentPip with stylesheet cloning & React portal | M1, M2 | PAUSED (Awaiting user resume notice) |
| M6 | Final Verification, E2E Pass & Hardening | Features 47–48: Pass 100% of E2E test suite (Tiers 1-4) published via TEST_READY.md, then Tier 5 adversarial coverage hardening | M1–M5, E2E Track | PAUSED (Awaiting user resume notice) |

---

## Interface Contracts

### M1 ↔ M2 (Playback Engine ↔ Kinetic Lyrics)
- `usePlayerStore`:
  - `currentTimeMs: number`
  - `syncOffsetMs: number`
  - `lyrics: LyricLine[]`
  - `activeLineIndex: number`
  - `seekTo: (timeMs: number) => void`
  - `setSyncOffsetMs: (offsetMs: number) => void`
- `LyricLine`: `{ timeMs: number; text: string }`

### M1 ↔ M3 (Playback Engine ↔ WebGL Shader)
- `currentTrack.palette`: `[string, string, string, string]` (4 hex color codes)
- `usePlayerStore.subscribe(state => state.currentTrack.palette)`: Triggers liquid LERP color morphing
- `AmbientShader.captureVisualizerSnapshot()`: Returns `string | null` (base64 data URL with `image/png`)

### M3/M1 ↔ M4 (Visualizer/Playback ↔ Story Flex Export)
- Snapshot Bridge: `captureVisualizerSnapshot()` provides background image for `GlassAppleCard`
- `/api/proxy-image?url=<encodedUrl>`: Returns `{ dataUrl: string }`
- Base card props: `{ track: CurrentTrack; lyricQuote: string; snapshotUrl?: string; currentTimeMs: number }`

### M1/M2 ↔ M5 (Playback/Lyrics ↔ Study HUD & PiP)
- `useStudyStore`:
  - `isStudyMode: boolean`
  - `isPipActive: boolean`
  - `pomodoro: { mode: 'work' | 'break'; timeLeftSeconds: number; isRunning: boolean; preset: '25/5' | '50/10' }`
  - `ambientVolumes: { vinyl: number; rain: number; brown: number }`
  - `toggleStudyMode: () => void`
  - `setPipActive: (active: boolean) => void`
- `useDocumentPip`:
  - `requestPip: () => Promise<Window | null>`
  - `closePip: () => void`
  - `isSupported: boolean`

---

## Feature Inventory Cross-Check
Every feature (#1 through #48) has an assigned milestone:
- M1: Features 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
- M2: Features 11, 12, 13, 14, 15, 16, 17, 18
- M3: Features 19, 20, 21, 22, 23, 24
- M4: Features 25, 26, 27, 28, 29, 30, 31, 32
- M5: Features 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46
- M6: Features 47, 48

Cross-check result: **PASS** (Zero unassigned features).
