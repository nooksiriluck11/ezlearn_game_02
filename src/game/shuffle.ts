export type SwapPair = [number, number];

export function buildSwapPlan(slotCount: number, swapCount: number): SwapPair[] {
  if (slotCount < 2) return [];
  const plan: SwapPair[] = [];
  let previous = '';
  for (let i = 0; i < swapCount; i++) {
    let a = 0;
    let b = 0;
    let key = '';
    do {
      a = Math.floor(Math.random() * slotCount);
      b = Math.floor(Math.random() * slotCount);
      key = [a, b].sort().join('-');
    } while (a === b || key === previous);
    previous = key;
    plan.push([a, b]);
  }
  return plan;
}

/** Fisher-Yates. For 2+ items the result is never the original order. */
export function shuffled<T>(items: T[]): T[] {
  if (items.length < 2) return items.slice();
  let next = items.slice();
  do {
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
  } while (next.every((item, i) => item === items[i]));
  return next;
}

export function applySwap<T>(slots: T[], [a, b]: SwapPair): T[] {
  const next = slots.slice();
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}
