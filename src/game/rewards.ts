export const START_HINTS = 1;
/** Every Nth correct round hands out another hint. */
export const CORRECT_PER_HINT = 3;
/** Every Nth consecutive correct round hands out a time boost. */
export const STREAK_PER_BOOST = 4;
export const BOOST_MS = 5000;
export const SKIP_PENALTY = 50;

export type Rewards = {
  nextStreak: number;
  nextCorrect: number;
  hintEarned: boolean;
  boostEarned: boolean;
};

export function rewardsFor(passed: boolean, streak: number, correctTotal: number): Rewards {
  const nextStreak = passed ? streak + 1 : 0;
  const nextCorrect = passed ? correctTotal + 1 : correctTotal;
  return {
    nextStreak,
    nextCorrect,
    hintEarned: passed && nextCorrect % CORRECT_PER_HINT === 0,
    boostEarned: passed && nextStreak % STREAK_PER_BOOST === 0,
  };
}
