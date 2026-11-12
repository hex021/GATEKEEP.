# TEST_INFRA.md — VibeSync Comprehensive Test Infrastructure Specification

## 1. Executive Summary & Test Philosophy

### 1.1 Opaque-Box, Requirement-Driven Philosophy
VibeSync testing follows an **opaque-box, contract-driven methodology**. Tests are derived strictly from user requirements (`ORIGINAL_REQUEST.md`), architectural specifications (`PROJECT.md`), and interface contracts (`vibesync_implementation_plan.md`). 

The test suite treats components, stores, APIs, and rendering engines as black boxes with well-defined inputs, outputs, states, and side effects. No test relies on private implementation quirks; every test validates observable functional contracts, mathematical invariants, state transitions, DOM geometry, or protocol compliance.

### 1.2 Authoritative Specifications & Oracles
Expected test outputs are derived from the following authoritative sources:
1. **LRC Timing & Parsing Contracts**: LRCLIB specification supporting `[mm:ss.xx]` and `[mm:ss.xxx]` timestamps, metadata tag exclusion, and chronological sorting.
2. **Kinetic Typography & Spring Physics**: Framer Motion spring physics contract (stiffness: 180, damping: 25), active glow, progressive blur gradient, and auto-centering scroll.
3. **Fluid Shader & Color Mathematics**: WebGL quad pipeline with `preserveDrawingBuffer: true`, procedural simplex/FBM noise, dither/film grain hash, and liquid LERP crossfading:
   $$\text{currentRGB} += (\text{targetRGB} - \text{currentRGB}) \times 0.05$$
4. **9:16 Story Flex Export Architecture**: Fixed 9:16 aspect ratio ($360 \times 640\text{px}$ base container scaling at `pixelRatio: 3` to $1080 \times 1920\text{px}$ PNG), SSRF-validated base64 image proxy, `document.fonts.ready` guard, and explicit Lucide icon dimensions.
5. **Zen Study HUD & Native Document PiP**: Wall-clock drift-free Pomodoro state machine (25/5 and 50/10), Web Audio procedural synthesis (vinyl crackle, rain with 0.15Hz LFO, brown noise leaky integrator), auto-suspend power management, and native Chromium `window.documentPictureInPicture` with stylesheet cloning and React portal mounting.
6. **Spotify PKCE Protocol**: RFC 7636 Web Crypto PKCE (code verifier length 43-128 chars, SHA-256 base64url challenge), 2500ms polling with 60fps interpolation.

---

## 2. 4-Tier Test Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Tier 4: Real-World Scenarios                         │
│  (End-to-End User Journeys: Demo, Spotify PKCE, Export, Pomodoro, PiP)  │
├────────────────────────────────────────────────────────────────────────┤
│                Tier 3: Cross-Feature Interactions                      │
│ (Playback ↔ Lyrics, Shader Palette ↔ Story, Study HUD ↔ Audio Engines) │
├────────────────────────────────────────────────────────────────────────┤
│             Tier 2: Boundary, Edge & Corner Cases                      │
│  (>=5 edge cases per feature: malformed LRC, network drop, CORS, SSRF) │
├────────────────────────────────────────────────────────────────────────┤
│                 Tier 1: Core Feature Coverage                          │
│  (>=5 unit/contract tests per feature for all 48 features = 240 tests)  │
└────────────────────────────────────────────────────────────────────────┘
```

### Tier 1: Feature Coverage
- **Scope**: Every single feature (#1 to #48) has at least 5 dedicated contract tests ($48 \times 5 = 240$ tests).
- **Focus**: Verifies primary happy paths, state transitions, API contracts, mathematical invariants, and DOM structural outputs.

### Tier 2: Boundary & Corner Cases
- **Scope**: Every single feature (#1 to #48) has at least 5 boundary/negative tests ($48 \times 5 = 240$ tests).
- **Focus**: Extreme input sizes, sub-millisecond precision, out-of-order timestamps, empty states, SSRF malicious IPs (RFC 1918 / AWS metadata), autoplay denial (`NotAllowedError`), WebGL context loss, non-Chromium PiP fallbacks, and audio power suspension.

### Tier 3: Cross-Feature Combinations
- **Scope**: Multi-module integration tests verifying data flow across subsystem boundaries.
- **Pairs/Triplets Verified**:
  - `M1 ↔ M2`: Playback engine advancing time triggers binary search lyric detection, auto-scroll, and manual sync offset shifting (-500ms to +500ms).
  - `M1 ↔ M3 ↔ M4`: Track switching triggers palette extraction, liquid LERP color transition in WebGL shader, snapshot bridge capture, and card background rendering.
  - `M1 ↔ M5`: Background music playback coexists with ambient sound generators (vinyl crackle, rain, brown noise) with independent master volume attenuation.
  - `M2 ↔ M5`: Study HUD MiniLyrics synchronizes with active track while user toggles Pomodoro states and PiP windows.

### Tier 4: Real-World Application Scenarios
- **Scope**: 5 complete, realistic end-to-end user workflows:
  1. **Scenario 1 — Zero-Config Demo Flow**: Boot app, load 3 demo tracks, autoplay resilience prompt handling, 60fps rAF time advance, seek to chorus.
  2. **Scenario 2 — Spotify PKCE Live Sync Flow**: Configure Client ID, generate PKCE verifier/challenge, simulate callback exchange, poll player state at 2500ms with 60fps interpolation, passive observer fallback.
  3. **Scenario 3 — Lyric Offset Tuning & Story Flex Export Flow**: Load track, adjust sync offset by +150ms, select quote, switch card template (Glass Apple -> Brutalist Swiss -> Vinyl Receipt), verify 1080x1920 geometry, font guard, and proxy image injection.
  4. **Scenario 4 — Deep Work Pomodoro & Procedural Audio Flow**: Enter Study HUD via 'S', start 25/5 Pomodoro session, adjust vinyl crackle and rain sliders, advance timer to completion, verify confetti celebration and break transition.
  5. **Scenario 5 — Document PiP Multitasking Flow**: Launch native Chromium Document PiP, clone styles and link nodes, mount portal, resize PiP window, close PiP window and verify clean state restoration without audio interruption.

---

## 3. Feature Inventory to Test Mapping Matrix

| # | Feature | Milestone | Tier 1 Tests | Tier 2 Edge Tests | Test File Location |
|---|---------|-----------|--------------|-------------------|--------------------|
| 1 | App Scaffolding & Shell | M1 | T1.F01.1 - 5 | T2.F01.1 - 5 | `tests/tier1/f01_f10_playback_engine.test.mjs` / `tests/tier2/b01_b10_playback_boundaries.test.mjs` |
| 2 | Demo Track Audio & Assets | M1 | T1.F02.1 - 5 | T2.F02.1 - 5 | `tests/tier1/f01_f10_playback_engine.test.mjs` / `tests/tier2/b01_b10_playback_boundaries.test.mjs` |
| 3 | Core Unified Player Store | M1 | T1.F03.1 - 5 | T2.F03.1 - 5 | `tests/tier1/f01_f10_playback_engine.test.mjs` / `tests/tier2/b01_b10_playback_boundaries.test.mjs` |
| 4 | Zero-Config Demo Mode Engine | M1 | T1.F04.1 - 5 | T2.F04.1 - 5 | `tests/tier1/f01_f10_playback_engine.test.mjs` / `tests/tier2/b01_b10_playback_boundaries.test.mjs` |
| 5 | Spotify PKCE Auth Client | M1 | T1.F05.1 - 5 | T2.F05.1 - 5 | `tests/tier1/f01_f10_playback_engine.test.mjs` / `tests/tier2/b01_b10_playback_boundaries.test.mjs` |
| 6 | Spotify Live Sync Engine | M1 | T1.F06.1 - 5 | T2.F06.1 - 5 | `tests/tier1/f01_f10_playback_engine.test.mjs` / `tests/tier2/b01_b10_playback_boundaries.test.mjs` |
| 7 | Floating Glassmorphic Player Bar | M1 | T1.F07.1 - 5 | T2.F07.1 - 5 | `tests/tier1/f01_f10_playback_engine.test.mjs` / `tests/tier2/b01_b10_playback_boundaries.test.mjs` |
| 8 | Command Bar (Cmd+K) | M1 | T1.F08.1 - 5 | T2.F08.1 - 5 | `tests/tier1/f01_f10_playback_engine.test.mjs` / `tests/tier2/b01_b10_playback_boundaries.test.mjs` |
| 9 | Spotify Setup Modal | M1 | T1.F09.1 - 5 | T2.F09.1 - 5 | `tests/tier1/f01_f10_playback_engine.test.mjs` / `tests/tier2/b01_b10_playback_boundaries.test.mjs` |
| 10 | Autoplay Resilience Pill | M1 | T1.F10.1 - 5 | T2.F10.1 - 5 | `tests/tier1/f01_f10_playback_engine.test.mjs` / `tests/tier2/b01_b10_playback_boundaries.test.mjs` |
| 11 | Enhanced LRCLIB Parser | M2 | T1.F11.1 - 5 | T2.F11.1 - 5 | `tests/tier1/f11_f18_lyrics_sync.test.mjs` / `tests/tier2/b11_b18_lyrics_boundaries.test.mjs` |
| 12 | Binary Search Active Line Detector | M2 | T1.F12.1 - 5 | T2.F12.1 - 5 | `tests/tier1/f11_f18_lyrics_sync.test.mjs` / `tests/tier2/b11_b18_lyrics_boundaries.test.mjs` |
| 13 | Kinetic Typography Viewport | M2 | T1.F13.1 - 5 | T2.F13.1 - 5 | `tests/tier1/f11_f18_lyrics_sync.test.mjs` / `tests/tier2/b11_b18_lyrics_boundaries.test.mjs` |
| 14 | Active Line Glow & Visual Weight | M2 | T1.F14.1 - 5 | T2.F14.1 - 5 | `tests/tier1/f11_f18_lyrics_sync.test.mjs` / `tests/tier2/b11_b18_lyrics_boundaries.test.mjs` |
| 15 | Inactive Progressive Blur | M2 | T1.F15.1 - 5 | T2.F15.1 - 5 | `tests/tier1/f11_f18_lyrics_sync.test.mjs` / `tests/tier2/b11_b18_lyrics_boundaries.test.mjs` |
| 16 | Click-to-Seek Typography | M2 | T1.F16.1 - 5 | T2.F16.1 - 5 | `tests/tier1/f11_f18_lyrics_sync.test.mjs` / `tests/tier2/b11_b18_lyrics_boundaries.test.mjs` |
| 17 | Auto-Centering Scroll Engine | M2 | T1.F17.1 - 5 | T2.F17.1 - 5 | `tests/tier1/f11_f18_lyrics_sync.test.mjs` / `tests/tier2/b11_b18_lyrics_boundaries.test.mjs` |
| 18 | Manual Sync Offset Controls | M2 | T1.F18.1 - 5 | T2.F18.1 - 5 | `tests/tier1/f11_f18_lyrics_sync.test.mjs` / `tests/tier2/b11_b18_lyrics_boundaries.test.mjs` |
| 19 | Fullscreen WebGL Quad Pipeline | M3 | T1.F19.1 - 5 | T2.F19.1 - 5 | `tests/tier1/f19_f24_webgl_shader.test.mjs` / `tests/tier2/b19_b24_shader_boundaries.test.mjs` |
| 20 | Procedural GLSL Fluid Shader | M3 | T1.F20.1 - 5 | T2.F20.1 - 5 | `tests/tier1/f19_f24_webgl_shader.test.mjs` / `tests/tier2/b19_b24_shader_boundaries.test.mjs` |
| 21 | Procedural Film Grain & Dither | M3 | T1.F21.1 - 5 | T2.F21.1 - 5 | `tests/tier1/f19_f24_webgl_shader.test.mjs` / `tests/tier2/b19_b24_shader_boundaries.test.mjs` |
| 22 | Liquid LERP Color Crossfading | M3 | T1.F22.1 - 5 | T2.F22.1 - 5 | `tests/tier1/f19_f24_webgl_shader.test.mjs` / `tests/tier2/b19_b24_shader_boundaries.test.mjs` |
| 23 | WebGL Snapshot Bridge | M3 | T1.F23.1 - 5 | T2.F23.1 - 5 | `tests/tier1/f19_f24_webgl_shader.test.mjs` / `tests/tier2/b19_b24_shader_boundaries.test.mjs` |
| 24 | Context Resilience & Fallback | M3 | T1.F24.1 - 5 | T2.F24.1 - 5 | `tests/tier1/f19_f24_webgl_shader.test.mjs` / `tests/tier2/b19_b24_shader_boundaries.test.mjs` |
| 25 | Glassmorphic Apple Story Card | M4 | T1.F25.1 - 5 | T2.F25.1 - 5 | `tests/tier1/f25_f32_story_flex.test.mjs` / `tests/tier2/b25_b32_story_boundaries.test.mjs` |
| 26 | Brutalist Swiss Poster Card | M4 | T1.F26.1 - 5 | T2.F26.1 - 5 | `tests/tier1/f25_f32_story_flex.test.mjs` / `tests/tier2/b25_b32_story_boundaries.test.mjs` |
| 27 | Vinyl Receipt Story Card | M4 | T1.F27.1 - 5 | T2.F27.1 - 5 | `tests/tier1/f25_f32_story_flex.test.mjs` / `tests/tier2/b25_b32_story_boundaries.test.mjs` |
| 28 | Story Flex Export Modal | M4 | T1.F28.1 - 5 | T2.F28.1 - 5 | `tests/tier1/f25_f32_story_flex.test.mjs` / `tests/tier2/b25_b32_story_boundaries.test.mjs` |
| 29 | High-Res 1080x1920 PNG Exporter | M4 | T1.F29.1 - 5 | T2.F29.1 - 5 | `tests/tier1/f25_f32_story_flex.test.mjs` / `tests/tier2/b25_b32_story_boundaries.test.mjs` |
| 30 | Base64 Image Proxy API Route | M4 | T1.F30.1 - 5 | T2.F30.1 - 5 | `tests/tier1/f25_f32_story_flex.test.mjs` / `tests/tier2/b25_b32_story_boundaries.test.mjs` |
| 31 | Font Loading Export Guard | M4 | T1.F31.1 - 5 | T2.F31.1 - 5 | `tests/tier1/f25_f32_story_flex.test.mjs` / `tests/tier2/b25_b32_story_boundaries.test.mjs` |
| 32 | Explicit Lucide Icon Sizing | M4 | T1.F32.1 - 5 | T2.F32.1 - 5 | `tests/tier1/f25_f32_story_flex.test.mjs` / `tests/tier2/b25_b32_story_boundaries.test.mjs` |
| 33 | Zen Study HUD Mode Overlay | M5 | T1.F33.1 - 5 | T2.F33.1 - 5 | `tests/tier1/f33_f42_study_hud_audio.test.mjs` / `tests/tier2/b33_b42_study_boundaries.test.mjs` |
| 34 | Keyboard Shortcut 'S' | M5 | T1.F34.1 - 5 | T2.F34.1 - 5 | `tests/tier1/f33_f42_study_hud_audio.test.mjs` / `tests/tier2/b33_b42_study_boundaries.test.mjs` |
| 35 | Spinning Vinyl Visualization | M5 | T1.F35.1 - 5 | T2.F35.1 - 5 | `tests/tier1/f33_f42_study_hud_audio.test.mjs` / `tests/tier2/b33_b42_study_boundaries.test.mjs` |
| 36 | MiniLyrics Focused Subtitle | M5 | T1.F36.1 - 5 | T2.F36.1 - 5 | `tests/tier1/f33_f42_study_hud_audio.test.mjs` / `tests/tier2/b33_b42_study_boundaries.test.mjs` |
| 37 | Drift-Free Pomodoro Timer | M5 | T1.F37.1 - 5 | T2.F37.1 - 5 | `tests/tier1/f33_f42_study_hud_audio.test.mjs` / `tests/tier2/b33_b42_study_boundaries.test.mjs` |
| 38 | Celebratory Confetti Celebration | M5 | T1.F38.1 - 5 | T2.F38.1 - 5 | `tests/tier1/f33_f42_study_hud_audio.test.mjs` / `tests/tier2/b33_b42_study_boundaries.test.mjs` |
| 39 | Procedural Vinyl Crackle Generator | M5 | T1.F39.1 - 5 | T2.F39.1 - 5 | `tests/tier1/f33_f42_study_hud_audio.test.mjs` / `tests/tier2/b33_b42_study_boundaries.test.mjs` |
| 40 | Procedural Rain Generator | M5 | T1.F40.1 - 5 | T2.F40.1 - 5 | `tests/tier1/f33_f42_study_hud_audio.test.mjs` / `tests/tier2/b33_b42_study_boundaries.test.mjs` |
| 41 | Procedural Brown Noise Generator | M5 | T1.F41.1 - 5 | T2.F41.1 - 5 | `tests/tier1/f33_f42_study_hud_audio.test.mjs` / `tests/tier2/b33_b42_study_boundaries.test.mjs` |
| 42 | Ambient Engine Power Management | M5 | T1.F42.1 - 5 | T2.F42.1 - 5 | `tests/tier1/f33_f42_study_hud_audio.test.mjs` / `tests/tier2/b33_b42_study_boundaries.test.mjs` |
| 43 | Native Chromium Document PiP | M5 | T1.F43.1 - 5 | T2.F43.1 - 5 | `tests/tier1/f43_f48_pip_e2e_hardening.test.mjs` / `tests/tier2/b43_b48_pip_adversarial.test.mjs` |
| 44 | PiP Stylesheet & Style Cloning | M5 | T1.F44.1 - 5 | T2.F44.1 - 5 | `tests/tier1/f43_f48_pip_e2e_hardening.test.mjs` / `tests/tier2/b43_b48_pip_adversarial.test.mjs` |
| 45 | React 19 Portal Rendering in PiP | M5 | T1.F45.1 - 5 | T2.F45.1 - 5 | `tests/tier1/f43_f48_pip_e2e_hardening.test.mjs` / `tests/tier2/b43_b48_pip_adversarial.test.mjs` |
| 46 | Document PiP Fallback | M5 | T1.F46.1 - 5 | T2.F46.1 - 5 | `tests/tier1/f43_f48_pip_e2e_hardening.test.mjs` / `tests/tier2/b43_b48_pip_adversarial.test.mjs` |
| 47 | E2E Requirement-Driven Suite | M6 | T1.F47.1 - 5 | T2.F47.1 - 5 | `tests/tier1/f43_f48_pip_e2e_hardening.test.mjs` / `tests/tier2/b43_b48_pip_adversarial.test.mjs` |
| 48 | Adversarial Coverage Hardening | M6 | T1.F48.1 - 5 | T2.F48.1 - 5 | `tests/tier1/f43_f48_pip_e2e_hardening.test.mjs` / `tests/tier2/b43_b48_pip_adversarial.test.mjs` |

---

## 4. Test Execution & Reporting

### 4.1 Running the Suite
Execute the entire 4-tier test harness with a single command:
```bash
node tests/run-all.mjs
```

### 4.2 Diagnostic & Filtering Options
```bash
# Run specific tier:
node tests/run-all.mjs --tier=1
node tests/run-all.mjs --tier=2
node tests/run-all.mjs --tier=3
node tests/run-all.mjs --tier=4

# Run specific feature group:
node tests/run-all.mjs --filter=lyrics
```

### 4.3 Output Format
The test runner reports execution metrics in standardized TAP / summary table format:
- Total Suites Executed
- Total Tests Run
- Pass / Fail / Skipped Counts
- Execution Time per Tier
- Verification Gate Status
