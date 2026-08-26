const KEY = 'kukkukkoo/settings-v1';
/** Keys the Expo build wrote through AsyncStorage — read once so setups survive the port. */
const LEGACY_KEYS = ['@kukkukkoo/settings-v1', '@kukkukku/settings-v1'];

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

export function loadSettings(): Settings {
  try {
    for (const key of [KEY, ...LEGACY_KEYS]) {
      const raw = localStorage.getItem(key);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // Fall through to defaults.
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Nothing to do — the run itself is unaffected.
  }
}
