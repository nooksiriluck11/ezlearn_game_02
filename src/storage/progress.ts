import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@kukkukku/progress-v2';

export type Progress = {
  bestScore: number;
  bestRounds: number;
  totalRuns: number;
};

export const EMPTY_PROGRESS: Progress = { bestScore: 0, bestRounds: 0, totalRuns: 0 };

export async function loadProgress(): Promise<Progress> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return EMPTY_PROGRESS;
  try {
    return { ...EMPTY_PROGRESS, ...JSON.parse(raw) };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export async function saveProgress(progress: Progress): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(progress));
}
