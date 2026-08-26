const KEY = 'kukkukkoo/progress-v2';
/** Keys the Expo build wrote through AsyncStorage — read once so records survive the port. */
const LEGACY_KEYS = ['@kukkukkoo/progress-v2', '@kukkukku/progress-v2'];

export type Progress = {
  bestScore: number;
  bestRounds: number;
  totalRuns: number;
};

export const EMPTY_PROGRESS: Progress = { bestScore: 0, bestRounds: 0, totalRuns: 0 };

function read(): string | null {
  try {
    for (const key of [KEY, ...LEGACY_KEYS]) {
      const raw = localStorage.getItem(key);
      if (raw) return raw;
    }
  } catch {
    // Private-mode Safari throws on localStorage — a run without records still plays.
  }
  return null;
}

export function loadProgress(): Progress {
  const raw = read();
  if (!raw) return EMPTY_PROGRESS;
  try {
    return { ...EMPTY_PROGRESS, ...JSON.parse(raw) };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Nothing to do — the run itself is unaffected.
  }
}
