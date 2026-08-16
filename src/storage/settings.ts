import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@kukkukku/settings-v1';

export type Settings = {
  /** Show the Thai gloss under each English word on the cards. */
  showThai: boolean;
  /** Show what part of speech each word plays, above the word. */
  showPos: boolean;
  sound: boolean;
};

export const DEFAULT_SETTINGS: Settings = { showThai: false, showPos: false, sound: true };

export async function loadSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}
