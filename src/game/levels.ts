export type LevelConfig = {
  level: number;
  wordCount: number;
  memorizeSeconds: number;
  swapCount: number;
  /** Time limit for arranging the answer. Runs out -> the round is submitted as-is. */
  answerSeconds: number;
};

const TABLE: Omit<LevelConfig, 'level'>[] = [
  { wordCount: 3, memorizeSeconds: 5, swapCount: 0, answerSeconds: 10 },
  { wordCount: 3, memorizeSeconds: 5, swapCount: 0, answerSeconds: 9 },
  { wordCount: 4, memorizeSeconds: 5, swapCount: 0, answerSeconds: 11 },
  { wordCount: 4, memorizeSeconds: 5, swapCount: 1, answerSeconds: 10 },
  { wordCount: 5, memorizeSeconds: 5, swapCount: 0, answerSeconds: 12 },
  { wordCount: 5, memorizeSeconds: 5, swapCount: 2, answerSeconds: 11 },
  { wordCount: 5, memorizeSeconds: 4, swapCount: 3, answerSeconds: 10 },
  { wordCount: 5, memorizeSeconds: 4, swapCount: 4, answerSeconds: 9 },
];

export const MAX_SWAPS = 6;
export const MIN_ANSWER_SECONDS = 7;

export function getLevelConfig(level: number): LevelConfig {
  if (level <= TABLE.length) return { level, ...TABLE[level - 1] };
  const last = TABLE[TABLE.length - 1];
  const extra = level - TABLE.length;
  return {
    level,
    ...last,
    swapCount: Math.min(last.swapCount + extra, MAX_SWAPS),
    answerSeconds: Math.max(last.answerSeconds - extra, MIN_ANSWER_SECONDS),
  };
}
