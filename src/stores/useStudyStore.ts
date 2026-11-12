import { create } from 'zustand';
import { triggerFireworks } from '@/lib/confetti';
import { playSuccessChime } from '@/lib/soundFx';

export type PomodoroPreset = '25/5' | '50/10';
export type PomodoroMode = 'work' | 'break';

export interface AmbientVolumes {
  vinyl: number;
  rain: number;
  brown: number;
}

interface StudyState {
  isStudyMode: boolean;
  isPipActive: boolean;

  // Pomodoro Timer
  pomodoroPreset: PomodoroPreset;
  pomodoroMode: PomodoroMode;
  timeLeftSeconds: number;
  isRunning: boolean;
  sessionsCompleted: number;

  // Ambient Sounds
  ambientVolumes: AmbientVolumes;
  isAmbientMuted: boolean;

  // Actions
  toggleStudyMode: () => void;
  openStudyMode: () => void;
  closeStudyMode: () => void;
  setPipActive: (active: boolean) => void;

  setPomodoroPreset: (preset: PomodoroPreset) => void;
  setPomodoroMode: (mode: PomodoroMode) => void;
  togglePomodoroMode: () => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;

  setAmbientVolume: (type: keyof AmbientVolumes, volume: number) => void;
  toggleAmbientMute: () => void;
}

const PRESET_DURATIONS: Record<PomodoroPreset, { work: number; break: number }> = {
  '25/5': { work: 25 * 60, break: 5 * 60 },
  '50/10': { work: 50 * 60, break: 10 * 60 },
};

export const useStudyStore = create<StudyState>((set, get) => ({
  isStudyMode: false,
  isPipActive: false,

  pomodoroPreset: '25/5',
  pomodoroMode: 'work',
  timeLeftSeconds: 25 * 60,
  isRunning: false,
  sessionsCompleted: 0,

  ambientVolumes: {
    vinyl: 0.35,
    rain: 0.4,
    brown: 0.25,
  },
  isAmbientMuted: false,

  toggleStudyMode: () => set((state) => ({ isStudyMode: !state.isStudyMode })),
  openStudyMode: () => set({ isStudyMode: true }),
  closeStudyMode: () => set({ isStudyMode: false }),
  setPipActive: (active) => set({ isPipActive: active }),

  setPomodoroPreset: (preset) => {
    const { pomodoroMode } = get();
    const durations = PRESET_DURATIONS[preset];
    const newTime = pomodoroMode === 'work' ? durations.work : durations.break;
    set({
      pomodoroPreset: preset,
      timeLeftSeconds: newTime,
      isRunning: false,
    });
  },

  setPomodoroMode: (mode) => {
    const { pomodoroPreset } = get();
    const durations = PRESET_DURATIONS[pomodoroPreset];
    set({
      pomodoroMode: mode,
      timeLeftSeconds: mode === 'work' ? durations.work : durations.break,
      isRunning: false,
    });
  },

  togglePomodoroMode: () => {
    const { pomodoroMode, pomodoroPreset } = get();
    const newMode: PomodoroMode = pomodoroMode === 'work' ? 'break' : 'work';
    const durations = PRESET_DURATIONS[pomodoroPreset];
    set({
      pomodoroMode: newMode,
      timeLeftSeconds: newMode === 'work' ? durations.work : durations.break,
      isRunning: false,
    });
  },

  toggleTimer: () => set((state) => ({ isRunning: !state.isRunning })),

  resetTimer: () => {
    const { pomodoroPreset, pomodoroMode } = get();
    const durations = PRESET_DURATIONS[pomodoroPreset];
    set({
      timeLeftSeconds: pomodoroMode === 'work' ? durations.work : durations.break,
      isRunning: false,
    });
  },

  tickTimer: () => {
    const { isRunning, timeLeftSeconds, pomodoroMode, pomodoroPreset, sessionsCompleted } = get();
    if (!isRunning) return;

    if (timeLeftSeconds > 1) {
      set({ timeLeftSeconds: timeLeftSeconds - 1 });
    } else {
      // Session finished!
      const durations = PRESET_DURATIONS[pomodoroPreset];
      if (pomodoroMode === 'work') {
        // Trigger celebratory fireworks celebration and chime on finishing a focus session
        try {
          triggerFireworks();
          playSuccessChime(0.12);
        } catch {
          // Graceful fallback if window/audio is hidden or unsupported
        }

        set({
          pomodoroMode: 'break',
          timeLeftSeconds: durations.break,
          isRunning: true,
          sessionsCompleted: sessionsCompleted + 1,
        });
      } else {
        try {
          playSuccessChime(0.08);
        } catch {
          // Graceful fallback
        }

        set({
          pomodoroMode: 'work',
          timeLeftSeconds: durations.work,
          isRunning: true,
        });
      }
    }
  },

  setAmbientVolume: (type, volume) => {
    set((state) => ({
      ambientVolumes: {
        ...state.ambientVolumes,
        [type]: Math.max(0, Math.min(1, volume)),
      },
    }));
  },

  toggleAmbientMute: () => set((state) => ({ isAmbientMuted: !state.isAmbientMuted })),
}));
