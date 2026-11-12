import confetti from 'canvas-confetti';

export interface FireworksOptions {
  durationMs?: number;
  zIndex?: number;
}

/**
 * Multi-burst celebratory fireworks animation using canvas-confetti.
 * Fires staggered mortars across the viewport over durationMs (default: 3000ms).
 * Safe in SSR, headless, and reduced-motion environments.
 */
export function triggerFireworks(options: FireworksOptions = {}): void {
  if (typeof window === 'undefined') return;

  const duration = options.durationMs ?? 3000;
  const zIndex = options.zIndex ?? 9999;
  const animationEnd = Date.now() + duration;

  const colors = ['#7C3AED', '#06B6D4', '#D946EF', '#10B981', '#F59E0B', '#3B82F6'];

  const defaults: confetti.Options = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex,
    disableForReducedMotion: true,
    colors,
  };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  // 1. Initial immediate center launch
  try {
    confetti({
      ...defaults,
      particleCount: 70,
      spread: 100,
      origin: { x: 0.5, y: 0.65 },
    });
  } catch {
    // Non-blocking fallback for headless / unsupported environments
  }

  // 2. Multi-burst staggered interval loop
  const interval: NodeJS.Timeout = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 40 * (timeLeft / duration);

    try {
      // Left mortar burst
      confetti({
        ...defaults,
        particleCount: Math.max(15, Math.floor(particleCount)),
        origin: { x: randomInRange(0.15, 0.35), y: randomInRange(0.15, 0.45) },
      });

      // Right mortar burst
      confetti({
        ...defaults,
        particleCount: Math.max(15, Math.floor(particleCount)),
        origin: { x: randomInRange(0.65, 0.85), y: randomInRange(0.15, 0.45) },
      });
    } catch {
      clearInterval(interval);
    }
  }, 250);
}

/**
 * Single celebratory burst helper.
 */
export function triggerConfettiBurst(particleCount = 80): void {
  if (typeof window === 'undefined') return;
  try {
    confetti({
      particleCount,
      spread: 70,
      origin: { y: 0.6 },
      zIndex: 9999,
      disableForReducedMotion: true,
      colors: ['#7C3AED', '#06B6D4', '#D946EF', '#10B981', '#F59E0B'],
    });
  } catch {}
}
