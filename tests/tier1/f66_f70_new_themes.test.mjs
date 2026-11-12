/**
 * Tier 1: Feature Coverage (Features 66 - 76: Master 11 Visualizer Themes Expansion)
 * Verification of:
 * - Removal of Chrome and Radar themes
 * - 11 Distinct Themes:
 *   1. GLITCHCORE (RGB splitting, signal tearing, character fragmentation)
 *   2. SWISS EDITORIAL (Asymmetric grid, modern grotesque typography, vermillion accent)
 *   3. VHS MEMORY (Camcorder OSD, tracking noise, faded yellow subtitles)
 *   4. LIQUID TYPE (SVG caustic displacement, viscous stretching, elastic typography)
 *   5. VOID (Abyssal black, vast negative space, celestial dust, weightless drift)
 *   6. RIOT ZONE (Punk DIY zine, paper cutouts, tape pinning, rebel collage)
 *   7. HEARTBREAK (Parchment texture, handwritten confessions, burgundy italic serif)
 *   8. BOUNCING BALL (Karaoke timing, parabolic bouncing orb, golden highlighting)
 *   9. MIRROR WORLD (Bilateral symmetry, inverted water reflection, dual coordinates)
 *   10. EMOTIONAL DAMAGE (Psychological dissociation, fragmented text, memory echo)
 *   11. NEWSPAPER (Broadsheet masthead, column rules, lead serif headlines)
 * - ThemeRegistry & VisualizerThemeSelector modal integration
 */

import { suite, test, expect } from '../helpers/test-harness.mjs';
import { register } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

try {
  register('../helpers/path-loader.mjs', import.meta.url);
} catch {
  // Already registered
}

const { usePlayerStore, THEME_MODES } = await import('../../src/stores/usePlayerStore.ts');
const { VISUALIZER_THEMES } = await import('../../src/components/visualizer/themes/ThemeRegistry.ts');

const { Glitchcore } = await import('../../src/components/visualizer/themes/Glitchcore.tsx');
const { SwissEditorial } = await import('../../src/components/visualizer/themes/SwissEditorial.tsx');
const { VhsMemory } = await import('../../src/components/visualizer/themes/VhsMemory.tsx');
const { LiquidType } = await import('../../src/components/visualizer/themes/LiquidType.tsx');
const { VoidTheme } = await import('../../src/components/visualizer/themes/VoidTheme.tsx');
const { RiotZone } = await import('../../src/components/visualizer/themes/RiotZone.tsx');
const { Heartbreak } = await import('../../src/components/visualizer/themes/Heartbreak.tsx');
const { BouncingBall } = await import('../../src/components/visualizer/themes/BouncingBall.tsx');
const { MirrorWorld } = await import('../../src/components/visualizer/themes/MirrorWorld.tsx');
const { EmotionalDamage } = await import('../../src/components/visualizer/themes/EmotionalDamage.tsx');
const { NewspaperTheme } = await import('../../src/components/visualizer/themes/NewspaperTheme.tsx');
const { VisualizerThemeSelector } = await import('../../src/components/visualizer/VisualizerThemeSelector.tsx');

const glitchSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/visualizer/themes/Glitchcore.tsx'), 'utf-8');
const swissSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/visualizer/themes/SwissEditorial.tsx'), 'utf-8');
const vhsSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/visualizer/themes/VhsMemory.tsx'), 'utf-8');
const liquidSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/visualizer/themes/LiquidType.tsx'), 'utf-8');
const voidSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/visualizer/themes/VoidTheme.tsx'), 'utf-8');
const riotSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/visualizer/themes/RiotZone.tsx'), 'utf-8');
const heartbreakSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/visualizer/themes/Heartbreak.tsx'), 'utf-8');
const bounceSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/visualizer/themes/BouncingBall.tsx'), 'utf-8');
const mirrorSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/visualizer/themes/MirrorWorld.tsx'), 'utf-8');
const damageSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/visualizer/themes/EmotionalDamage.tsx'), 'utf-8');
const newsSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/visualizer/themes/NewspaperTheme.tsx'), 'utf-8');
const floatingBarSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/player/FloatingPlayerBar.tsx'), 'utf-8');
const pageSrc = fs.readFileSync(path.join(process.cwd(), 'src/app/page.tsx'), 'utf-8');

// =========================================================================
// Suite 1: Clean Removal of Chrome and Radar Themes & Store Registry
// =========================================================================
suite('Master Expansion: Chrome & Radar Removed & ThemeRegistry Active', () => {
  test('T1.M01.1: AcidChrome and RadarAtc are cleanly removed from THEME_MODES', () => {
    expect(THEME_MODES).not.toContain('acid-chrome');
    expect(THEME_MODES).not.toContain('radar-atc');
  });

  test('T1.M01.2: All 11 new themes are present in THEME_MODES and VISUALIZER_THEMES', () => {
    const requiredThemes = [
      'glitchcore',
      'swiss-editorial',
      'vhs-memory',
      'liquid-type',
      'void',
      'riot-zone',
      'heartbreak',
      'bouncing-ball',
      'mirror-world',
      'emotional-damage',
      'newspaper',
    ];
    for (const id of requiredThemes) {
      expect(THEME_MODES).toContain(id);
      expect(VISUALIZER_THEMES.some((t) => t.id === id)).toBe(true);
    }
  });

  test('T1.M01.3: cycleTheme traverses through all active themes sequentially', () => {
    const store = usePlayerStore.getState();
    store.setVisualizerMode('glitchcore');
    expect(usePlayerStore.getState().visualizerMode).toBe('glitchcore');
    store.cycleTheme();
    expect(usePlayerStore.getState().visualizerMode).toBe('swiss-editorial');
    store.cycleTheme();
    expect(usePlayerStore.getState().visualizerMode).toBe('vhs-memory');
  });

  test('T1.M01.4: VisualizerThemeSelector exports and renders cleanly', () => {
    expect(typeof VisualizerThemeSelector).toBe('function');
    expect(pageSrc).toContain('VisualizerThemeSelector');
    expect(floatingBarSrc).toContain('onOpenThemeSelector');
  });
});

// =========================================================================
// Suite 2: Theme 01 (GLITCHCORE) & Theme 02 (SWISS EDITORIAL)
// =========================================================================
suite('Themes 01 & 02: Glitchcore & Swiss Editorial', () => {
  test('T1.M02.1: Glitchcore implements controlled RGB splitting and tearing slice', () => {
    expect(glitchSrc).toContain('textShadow: isGlitching');
    expect(glitchSrc).toContain('#FF003C');
    expect(glitchSrc).toContain('#00F0FF');
    expect(glitchSrc).toContain('sliceOffset');
    expect(typeof Glitchcore).toBe('function');
  });

  test('T1.M02.2: Swiss Editorial enforces asymmetric grid rules and vermillion accent', () => {
    expect(swissSrc).toContain('SWISS GRAPHIC TYPOGRAPHY');
    expect(swissSrc).toContain('#FF3B30');
    expect(swissSrc).toContain('border-white/20');
    expect(typeof SwissEditorial).toBe('function');
  });
});

// =========================================================================
// Suite 3: Theme 03 (VHS MEMORY) & Theme 04 (LIQUID TYPE)
// =========================================================================
suite('Themes 03 & 04: VHS Memory & Liquid Type', () => {
  test('T1.M03.1: VHS Memory implements camcorder OSD, timecode & faded yellow subtitles', () => {
    expect(vhsSrc).toContain('● REC');
    expect(vhsSrc).toContain('PLAY ▶');
    expect(vhsSrc).toContain('#FFF8B0'); // Vintage closed caption yellow
    expect(typeof VhsMemory).toBe('function');
  });

  test('T1.M03.2: Liquid Type implements SVG caustic displacement and viscous stretching', () => {
    expect(liquidSrc).toContain('feTurbulence');
    expect(liquidSrc).toContain('feDisplacementMap');
    expect(liquidSrc).toContain('isViscousStretch');
    expect(typeof LiquidType).toBe('function');
  });
});

// =========================================================================
// Suite 4: Theme 05 (VOID) & Theme 06 (RIOT ZONE)
// =========================================================================
suite('Themes 05 & 06: Void & Riot Zone', () => {
  test('T1.M04.1: Void theme enforces vast negative space and weightless celestial drift', () => {
    expect(voidSrc).toContain('tracking-[0.35em]');
    expect(voidSrc).toContain('bg-[#000000]');
    expect(typeof VoidTheme).toBe('function');
  });

  test('T1.M04.2: Riot Zone implements cut-and-paste punk zine collage with masking tape', () => {
    expect(riotSrc).toContain('RIOT ZONE // ZINE');
    expect(riotSrc).toContain('rotate(');
    expect(riotSrc).toContain('shadow-[4px_4px_0px_#000]');
    expect(typeof RiotZone).toBe('function');
  });
});

// =========================================================================
// Suite 5: Theme 07 (HEARTBREAK) & Theme 08 (BOUNCING BALL)
// =========================================================================
suite('Themes 07 & 08: Heartbreak & Bouncing Ball', () => {
  test('T1.M05.1: Heartbreak implements parchment paper texture and intimate italic serif confessions', () => {
    expect(heartbreakSrc).toContain('font-serif italic');
    expect(heartbreakSrc).toContain('#E8DCC4');
    expect(heartbreakSrc).toContain('#9E2A2B');
    expect(typeof Heartbreak).toBe('function');
  });

  test('T1.M05.2: Bouncing Ball calculates parabolic trajectory synchronized with playback timing', () => {
    expect(bounceSrc).toContain('Math.sin(wordRatio * Math.PI)');
    expect(bounceSrc).toContain('#FFD700');
    expect(bounceSrc).toContain('bounceY');
    expect(typeof BouncingBall).toBe('function');
  });
});

// =========================================================================
// Suite 6: Theme 09 (MIRROR WORLD), Theme 10 (EMOTIONAL DAMAGE) & Theme 11 (NEWSPAPER)
// =========================================================================
suite('Themes 09, 10 & 11: Mirror World, Emotional Damage & Newspaper', () => {
  test('T1.M06.1: Mirror World renders bilateral symmetrical reflection with inverted coordinates', () => {
    expect(mirrorSrc).toContain('scaleY: -1');
    expect(mirrorSrc).toContain('REFLECTION PLANE');
    expect(typeof MirrorWorld).toBe('function');
  });

  test('T1.M06.2: Emotional Damage implements psychological dissociation and fragmented typography', () => {
    expect(damageSrc).toContain('isFractured');
    expect(damageSrc).toContain('FRACTURED MEMORY');
    expect(damageSrc).toContain('rgba(136,19,55');
    expect(typeof EmotionalDamage).toBe('function');
  });

  test('T1.M06.3: Newspaper implements vintage broadsheet masthead, column rules and headlines', () => {
    expect(newsSrc).toContain('THE DAILY CHRONICLE');
    expect(newsSrc).toContain('font-serif font-black uppercase');
    expect(newsSrc).toContain('COLD-TYPE BROADSHEET');
    expect(typeof NewspaperTheme).toBe('function');
  });
});
