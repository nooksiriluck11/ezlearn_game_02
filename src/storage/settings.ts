import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@kukkukkoo/settings-v1';
/** Pre-rename key — read once so existing players keep their setup. */
const LEGACY_KEY = '@kukkukku/settings-v1';

export const MEMORIZE_CHOICES = [5, 7, 10] as const;
export const HEART_CHOICES = [3, 4, 5] as const;

export type Settings = {
  /** Show the Thai gloss under each English word on the cards. */
  showThai: boolean;
  /** Show what part of speech each word plays, above the word. */
  showPos: boolean;
  /** Number every card. Off means the only way to follow a card is to watch it move. */
  showNumbers: boolean;
  /** Seconds to memorize, overriding the level table. */
  memorizeSeconds: number;
  /** Lives per run. */
  hearts: number;
  sound: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  showThai: false,
  showPos: false,
  showNumbers: true,
  memorizeSeconds: 5,
  hearts: 3,
  sound: true,
};

export async function loadSettings(): Promise<Settings> {
  const raw = (await AsyncStorage.getItem(KEY)) ?? (await AsyncStorage.getItem(LEGACY_KEY));
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
