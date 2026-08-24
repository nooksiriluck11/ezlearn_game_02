export const START_HINTS = 1;
export const START_UNSHUFFLES = 1;
/** Every Nth correct round hands out another hint. */
export const CORRECT_PER_HINT = 3;
/** Every Nth consecutive correct round hands out a time boost. */
export const STREAK_PER_BOOST = 4;
/** Every Nth consecutive correct round hands out another un-shuffle. */
export const STREAK_PER_UNSHUFFLE = 3;
export const BOOST_MS = 5000;
/** Baseline lives — the setting every high score before this was set at. */
export const BASE_HEARTS = 3;
/** Each extra life costs this share of the points earned. */
const PER_EXTRA_HEART = 0.15;
export const SKIP_PENALTY = 50;

/**
 * Fewer lives, bigger risk, bigger payout. 3 hearts scores full, and each extra
 * heart shaves points off — playing safe should not also pay best.
 */
export function scoreMultiplier(hearts: number): number {
  return Math.max(0.5, 1 - PER_EXTRA_HEART * Math.max(0, hearts - BASE_HEARTS));
}

export type Rewards = {
  nextStreak: number;
  nextCorrect: number;
  hintEarned: boolean;
  boostEarned: boolean;
  unshuffleEarned: boolean;
};

export function rewardsFor(passed: boolean, streak: number, correctTotal: number): Rewards {
  const nextStreak = passed ? streak + 1 : 0;
  const nextCorrect = passed ? correctTotal + 1 : correctTotal;
  return {
    nextStreak,
    nextCorrect,
    hintEarned: passed && nextCorrect % CORRECT_PER_HINT === 0,
    boostEarned: passed && nextStreak % STREAK_PER_BOOST === 0,
    unshuffleEarned: passed && nextStreak % STREAK_PER_UNSHUFFLE === 0,
  };
}
