export const colors = {
  bg: '#0E0B24',
  bgGlow: '#1B1447',
  bgSoft: '#1C1940',
  surface: '#282350',
  surfaceHi: '#332C63',
  cardFace: '#FFF6E5',
  cardFaceText: '#2A1D4A',
  cardFaceGloss: '#6B5B9A',
  cardFaceTag: '#A08CD0',
  cardBack: '#3B2F8F',
  cardBackEdge: '#6C5CE7',
  accent: '#FFD166',
  accentText: '#3A2A00',
  mint: '#5EEAD4',
  good: '#3DD68C',
  warn: '#FFA94D',
  bad: '#FF6B81',
  hint: '#C6A4FF',
  text: '#F4F1FF',
  textDim: '#9E97C9',
};

/** Graphics fills take numbers, Text styles take strings — same palette, both shapes. */
export function hex(color: string): number {
  return Number.parseInt(color.slice(1), 16);
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 36,
};

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
};

/**
 * One family, four weights. Prompt covers latin and thai; the symbols the UI
 * leans on (♥ ★ ✕ ⚙ 🔥) are not in it, so the stack falls through to the
 * system font for those glyphs.
 */
export const FAMILY = "'Prompt', system-ui, -apple-system, 'Segoe UI', sans-serif";

export const weights = {
  regular: '400',
  semibold: '600',
  bold: '700',
  black: '900',
} as const;

export type Weight = (typeof weights)[keyof typeof weights];

export const font = {
  title: 40,
  heading: 26,
  body: 16,
  small: 13,
  tiny: 11,
  countdown: 96,
  score: 33,
};

/** Offset + opacity of the fake drop shadow the UI kit paints behind raised surfaces. */
export const shadow = {
  offsetY: 6,
  alpha: 0.35,
  spread: 3,
};
