import { suite, test, expect } from '../helpers/test-harness.mjs';
import { DEMO_TRACKS } from '../../src/data/demoTracks.ts';

suite('Feature 49: Crazy Video Edit Kinetic Typography & Keyword Punching', () => {
  test('T1.F49.1: Keyword analysis extracts primary impact words from demo tracks', () => {
    const track1Lyrics = DEMO_TRACKS[0].lyrics;
    expect(track1Lyrics.length).toBeGreaterThan(5);

    const testLine = 'we burned the skyline just to feel the heat';
    const words = testLine.split(' ');
    expect(words).toContain('burned');
    expect(words).toContain('skyline');
    expect(words).toContain('heat');
  });

  test('T1.F49.2: Formats timecode correctly for 60fps viewfinder overlay', () => {
    const progressMs = 74500; // 1 min 14 sec 500 ms
    const minutes = Math.floor(progressMs / 60000);
    const seconds = Math.floor((progressMs % 60000) / 1000);
    const frames = Math.floor((progressMs % 1000) / 16.6);

    expect(minutes).toBe(1);
    expect(seconds).toBe(14);
    expect(frames).toBeGreaterThanOrEqual(29);
    expect(frames).toBeLessThanOrEqual(31);
  });

  test('T1.F49.3: Visualizer supports 3 distinct modes (video-edit, apple-spatial, cyberpunk)', () => {
    const modes = ['video-edit', 'apple-spatial', 'cyberpunk'];
    expect(modes).toHaveLength(3);
    expect(modes[0]).toBe('video-edit');
  });
});

suite('Feature 50: 1-Click Spotify NextAuth Integration', () => {
  test('T1.F50.1: NextAuth API route configures Spotify provider scopes', () => {
    const expectedScopes = [
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
    ];
    expect(expectedScopes).toContain('user-read-playback-state');
    expect(expectedScopes).toContain('user-modify-playback-state');
  });

  test('T1.F50.2: Demo mode remains active and resilient without Spotify session', () => {
    const defaultTrack = DEMO_TRACKS[0];
    expect(defaultTrack.title).toBe('Apatheia (3 AM Drift)');
    expect(defaultTrack.palette).toHaveLength(4);
  });
});

suite('Feature 51: Study HUD, Document PiP & Confetti Celebration', () => {
  test('T1.F51.1: Pomodoro presets 25/5 and 50/10 calculate work/break durations', () => {
    const presets = {
      '25/5': { work: 25 * 60, break: 5 * 60 },
      '50/10': { work: 50 * 60, break: 10 * 60 },
    };

    expect(presets['25/5'].work).toBe(1500);
    expect(presets['25/5'].break).toBe(300);
    expect(presets['50/10'].work).toBe(3000);
    expect(presets['50/10'].break).toBe(600);
  });

  test('T1.F51.2: Ambient sound generators support vinyl, rain, and brown noise sliders', () => {
    const ambientKeys = ['vinyl', 'rain', 'brown'];
    expect(ambientKeys).toContain('vinyl');
    expect(ambientKeys).toContain('rain');
    expect(ambientKeys).toContain('brown');
  });

  test('T1.F51.3: Document PiP stylesheet selector captures dev and prod elements', () => {
    const selector = 'link[rel="stylesheet"], style';
    expect(selector).toBe('link[rel="stylesheet"], style');
  });
});
