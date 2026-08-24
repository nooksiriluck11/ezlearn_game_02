import { useCallback, useEffect, useRef, useState } from 'react';
import { Entry, pickEntry, Pos } from '../data/phrases';
import { getLevelConfig, LevelConfig } from './levels';
import {
  BOOST_MS,
  rewardsFor,
  scoreMultiplier,
  SKIP_PENALTY,
  START_HINTS,
  START_UNSHUFFLES,
} from './rewards';
import { applySwap, buildSwapPlan, shuffled } from './shuffle';

export {
  BASE_HEARTS,
  BOOST_MS,
  CORRECT_PER_HINT,
  scoreMultiplier,
  SKIP_PENALTY,
  START_HINTS,
  START_UNSHUFFLES,
  STREAK_PER_BOOST,
  STREAK_PER_UNSHUFFLE,
} from './rewards';

export type Phase = 'memorize' | 'hiding' | 'shuffling' | 'answering' | 'result' | 'gameover';

/**
 * 'order' is the normal round: rebuild the whole phrase.
 * 'meaning' drops in now and then and asks for one card only — which one means X.
 */
export type RoundKind = 'order' | 'meaning';

export type Card = {
  id: string;
  word: string;
  th: string;
  pos: Pos;
  correctIndex: number;
  number: number;
};

export type RoundResult = {
  kind: RoundKind;
  /** The card a 'meaning' round asked for, kept for the reveal screen. */
  question: { th: string; word: string } | null;
  correctFlags: boolean[];
  gained: number;
  passed: boolean;
  timedOut: boolean;
  skipped: boolean;
  hintEarned: boolean;
  boostEarned: boolean;
  unshuffleEarned: boolean;
};

export type GameOptions = {
  memorizeSeconds: number;
  startHearts: number;
};

export const START_HEARTS = 3;
export const FLIP_MS = 600;
export const SWAP_MS = 450;

const POINTS_PER_CARD = 20;
const PERFECT_BONUS = 100;
const POINTS_PER_SWAP = 50;
/** One tap, one answer — flat pay, plus the usual swap bonus. */
const MEANING_POINTS = 80;

/** Meaning rounds only start showing up once the basic round is familiar. */
const MEANING_FROM_ROUND = 3;
const MEANING_CHANCE = 0.3;

/**
 * A card is only askable if its Thai gloss carries meaning on its own and no
 * other card in the round shares it — otherwise the question has two answers.
 */
function meaningTarget(cards: Card[]): Card | null {
  const seen = new Map<string, number>();
  cards.forEach((card) => seen.set(card.th, (seen.get(card.th) ?? 0) + 1));
  const usable = cards.filter((card) => card.th !== '—' && seen.get(card.th) === 1);
  if (usable.length === 0) return null;
  return usable[Math.floor(Math.random() * usable.length)];
}

/** Numbers are stamped on the cards when they are dealt, so they travel through every swap. */
function deal(entry: Entry): { cards: Card[]; slots: string[] } {
  const base = entry.words.map((word, i) => ({
    id: `c${i}-${word}`,
    word,
    th: entry.wordsTh[i],
    pos: entry.wordsPos[i],
    correctIndex: i,
  }));
  const slots = shuffled(base.map((c) => c.id));
  return {
    cards: base.map((card) => ({ ...card, number: slots.indexOf(card.id) + 1 })),
    slots,
  };
}

export function useGame({ memorizeSeconds, startHearts }: GameOptions) {
  const [round, setRound] = useState(1);
  const [config, setConfig] = useState<LevelConfig>(() => getLevelConfig(1));
  const [entry, setEntry] = useState<Entry | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  // The order the cards were dealt in — what the un-shuffle item puts them back to.
  const [dealtSlots, setDealtSlots] = useState<string[]>([]);
  const [kind, setKind] = useState<RoundKind>('order');
  const [targetId, setTargetId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('memorize');
  const [countdown, setCountdown] = useState(0);
  const [answer, setAnswer] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [hearts, setHearts] = useState(startHearts);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctTotal, setCorrectTotal] = useState(0);
  const [hints, setHints] = useState(START_HINTS);
  const [boosts, setBoosts] = useState(0);
  const [unshuffles, setUnshuffles] = useState(START_UNSHUFFLES);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [phraseSeed, setPhraseSeed] = useState(0);

  // Clock is deadline-based so a time boost just pushes the deadline out.
  const [deadlineAt, setDeadlineAt] = useState(0);
  const [answerTotalMs, setAnswerTotalMs] = useState(0);
  const [answerLeft, setAnswerLeft] = useState(0);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastEntry = useRef<Entry | undefined>(undefined);
  const lastKind = useRef<RoundKind>('order');
  const heldMs = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const startRound = useCallback(
    (nextRound: number) => {
      clearTimers();
      // The player's memorize setting wins over the level table.
      const nextConfig = { ...getLevelConfig(nextRound), memorizeSeconds };
      const nextEntry = pickEntry(nextConfig.wordCount, lastEntry.current);
      lastEntry.current = nextEntry;
      const { cards: nextCards, slots: nextSlots } = deal(nextEntry);

      setRound(nextRound);
      setConfig(nextConfig);
      setEntry(nextEntry);
      setCards(nextCards);
      setSlots(nextSlots);
      setDealtSlots(nextSlots);

      // Never two meaning rounds back to back, and only when a card can be asked about.
      const tryMeaning =
        nextRound >= MEANING_FROM_ROUND &&
        lastKind.current !== 'meaning' &&
        Math.random() < MEANING_CHANCE;
      const target = tryMeaning ? meaningTarget(nextCards) : null;
      lastKind.current = target ? 'meaning' : 'order';
      setKind(lastKind.current);
      setTargetId(target?.id ?? null);
      setAnswer([]);
      setRevealed([]);
      setResult(null);
      setDeadlineAt(0);
      setAnswerLeft(nextConfig.answerSeconds);
      setPhraseSeed(Math.floor(Math.random() * 1000));
      setCountdown(nextConfig.memorizeSeconds);
      setPhase('memorize');

      for (let tick = 1; tick <= nextConfig.memorizeSeconds; tick++) {
        later(() => setCountdown(nextConfig.memorizeSeconds - tick), tick * 1000);
      }

      const hideAt = nextConfig.memorizeSeconds * 1000;
      later(() => setPhase('hiding'), hideAt);

      const plan = buildSwapPlan(nextConfig.wordCount, nextConfig.swapCount);
      const shuffleAt = hideAt + FLIP_MS;
      if (plan.length === 0) {
        later(() => setPhase('answering'), shuffleAt);
      } else {
        later(() => setPhase('shuffling'), shuffleAt);
        plan.forEach((pair, i) => {
          later(() => setSlots((current) => applySwap(current, pair)), shuffleAt + i * SWAP_MS);
        });
        later(() => setPhase('answering'), shuffleAt + plan.length * SWAP_MS + SWAP_MS / 2);
      }
    },
    [clearTimers, later, memorizeSeconds],
  );

  const startRun = useCallback(() => {
    setHearts(startHearts);
    setScore(0);
    setStreak(0);
    setCorrectTotal(0);
    setHints(START_HINTS);
    setBoosts(0);
    setUnshuffles(START_UNSHUFFLES);
    lastEntry.current = undefined;
    lastKind.current = 'order';
    startRound(1);
  }, [startHearts, startRound]);

  const toggleCard = useCallback(
    (cardId: string) => {
      if (phase !== 'answering') return;
      setAnswer((current) => {
        if (kind === 'meaning') return current[0] === cardId ? [] : [cardId];
        return current.includes(cardId) ? current.filter((id) => id !== cardId) : [...current, cardId];
      });
    },
    [kind, phase],
  );

  const finish = useCallback(
    (mode: 'submit' | 'timeout' | 'skip') => {
      if (phase !== 'answering') return;
      const needed = kind === 'meaning' ? 1 : cards.length;
      if (mode === 'submit' && answer.length !== needed) return;
      const target = cards.find((card) => card.id === targetId) ?? null;
      const question = target ? { th: target.th, word: target.word } : null;

      if (mode === 'skip') {
        const cost = Math.min(SKIP_PENALTY, score);
        setScore((s) => s - cost);
        setStreak(0);
        setResult({
          kind,
          question,
          correctFlags: cards.map(() => false),
          gained: -cost,
          passed: false,
          timedOut: false,
          skipped: true,
          hintEarned: false,
          boostEarned: false,
          unshuffleEarned: false,
        });
        setPhase('result');
        return;
      }

      const correctFlags =
        kind === 'meaning'
          ? [answer[0] === targetId]
          : cards.map((card, i) => answer[i] === card.id);
      const correctCount = correctFlags.filter(Boolean).length;
      const passed = kind === 'meaning' ? correctFlags[0] : correctCount === cards.length;
      // The Skip penalty stays flat — only points earned scale with the risk taken.
      const earned =
        kind === 'meaning'
          ? passed
            ? MEANING_POINTS + config.swapCount * POINTS_PER_SWAP
            : 0
          : correctCount * POINTS_PER_CARD +
            (passed ? PERFECT_BONUS + config.swapCount * POINTS_PER_SWAP : 0);
      const gained = Math.round(earned * scoreMultiplier(startHearts));

      const { nextStreak, nextCorrect, hintEarned, boostEarned, unshuffleEarned } = rewardsFor(
        passed,
        streak,
        correctTotal,
      );

      setScore((s) => s + gained);
      setStreak(nextStreak);
      setCorrectTotal(nextCorrect);
      if (hintEarned) setHints((h) => h + 1);
      if (boostEarned) setBoosts((b) => b + 1);
      if (unshuffleEarned) setUnshuffles((u) => u + 1);
      if (!passed) setHearts((h) => h - 1);

      setResult({
        kind,
        question,
        correctFlags,
        gained,
        passed,
        timedOut: mode === 'timeout',
        skipped: false,
        hintEarned,
        boostEarned,
        unshuffleEarned,
      });
      setPhase('result');
    },
    [
      answer,
      cards,
      config.swapCount,
      correctTotal,
      kind,
      phase,
      score,
      startHearts,
      streak,
      targetId,
    ],
  );

  const submit = useCallback(() => finish('submit'), [finish]);
  const skip = useCallback(() => finish('skip'), [finish]);

  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  }, [finish]);

  // Open the clock when answering begins.
  useEffect(() => {
    if (phase !== 'answering') return;
    const total = config.answerSeconds * 1000;
    setAnswerTotalMs(total);
    setDeadlineAt(Date.now() + total);
    setAnswerLeft(config.answerSeconds);
  }, [phase, config.answerSeconds]);

  useEffect(() => {
    if (phase !== 'answering' || deadlineAt === 0) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000));
      setAnswerLeft(left);
      if (left <= 0) {
        clearInterval(id);
        finishRef.current('timeout');
      }
    }, 200);
    return () => clearInterval(id);
  }, [phase, deadlineAt]);

  const useHint = useCallback(() => {
    if (phase !== 'answering' || hints <= 0) return;
    // Order rounds: cards sit in phrase order, so the first unplayed one is the next needed.
    const target =
      kind === 'meaning'
        ? cards.find((c) => c.id === targetId && !revealed.includes(c.id))
        : cards.find((c) => !revealed.includes(c.id) && !answer.includes(c.id));
    if (!target) return;
    setRevealed((current) => [...current, target.id]);
    setHints((h) => h - 1);
  }, [answer, cards, hints, kind, phase, revealed, targetId]);

  /** Freezes the answer clock (deadline 0 stops both the tick and the bar). */
  const holdClock = useCallback(() => {
    if (phase !== 'answering' || deadlineAt === 0) return;
    heldMs.current = Math.max(0, deadlineAt - Date.now());
    setDeadlineAt(0);
  }, [deadlineAt, phase]);

  const releaseClock = useCallback(() => {
    const left = heldMs.current;
    heldMs.current = null;
    if (left === null) return;
    setDeadlineAt(Date.now() + left);
  }, []);

  const useBoost = useCallback(() => {
    if (phase !== 'answering' || boosts <= 0) return;
    setBoosts((b) => b - 1);
    setAnswerTotalMs((t) => t + BOOST_MS);
    setDeadlineAt((d) => d + BOOST_MS);
  }, [boosts, phase]);

  /** Slides every card back to where it was dealt, undoing this round's swaps. */
  const useUnshuffle = useCallback(() => {
    if (phase !== 'answering' || unshuffles <= 0) return;
    setSlots(dealtSlots);
    setUnshuffles((u) => u - 1);
  }, [dealtSlots, phase, unshuffles]);

  const advance = useCallback(() => {
    if (!result) return;
    if (result.passed || result.skipped) {
      startRound(round + 1);
    } else if (hearts > 0) {
      startRound(round);
    } else {
      clearTimers();
      setPhase('gameover');
    }
  }, [clearTimers, hearts, result, round, startRound]);

  const faceUp = phase === 'memorize' || phase === 'result';
  // Nothing to undo when the cards never moved.
  const canUnshuffle =
    phase === 'answering' && unshuffles > 0 && slots.some((id, i) => id !== dealtSlots[i]);

  return {
    round,
    config,
    entry,
    cards,
    slots,
    phase,
    kind,
    target: cards.find((card) => card.id === targetId) ?? null,
    countdown,
    answer,
    revealed,
    answerLeft,
    deadlineAt,
    answerTotalMs,
    hearts,
    score,
    streak,
    hints,
    boosts,
    unshuffles,
    canUnshuffle,
    result,
    faceUp,
    phraseSeed,
    startRun,
    toggleCard,
    submit,
    skip,
    useHint,
    useBoost,
    useUnshuffle,
    holdClock,
    releaseClock,
    advance,
  };
}
