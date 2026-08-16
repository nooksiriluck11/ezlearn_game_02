import { useCallback, useEffect, useRef, useState } from 'react';
import { Entry, pickEntry, Pos } from '../data/phrases';
import { getLevelConfig, LevelConfig } from './levels';
import { BOOST_MS, rewardsFor, SKIP_PENALTY, START_HINTS } from './rewards';
import { applySwap, buildSwapPlan, shuffled } from './shuffle';

export { BOOST_MS, CORRECT_PER_HINT, SKIP_PENALTY, START_HINTS, STREAK_PER_BOOST } from './rewards';

export type Phase = 'memorize' | 'hiding' | 'shuffling' | 'answering' | 'result' | 'gameover';

export type Card = {
  id: string;
  word: string;
  th: string;
  pos: Pos;
  correctIndex: number;
  number: number;
};

export type RoundResult = {
  correctFlags: boolean[];
  gained: number;
  passed: boolean;
  timedOut: boolean;
  skipped: boolean;
  hintEarned: boolean;
  boostEarned: boolean;
};

export const START_HEARTS = 3;
export const FLIP_MS = 600;
export const SWAP_MS = 450;

const POINTS_PER_CARD = 20;
const PERFECT_BONUS = 100;
const POINTS_PER_SWAP = 50;

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

export function useGame() {
  const [round, setRound] = useState(1);
  const [config, setConfig] = useState<LevelConfig>(() => getLevelConfig(1));
  const [entry, setEntry] = useState<Entry | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('memorize');
  const [countdown, setCountdown] = useState(0);
  const [answer, setAnswer] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [hearts, setHearts] = useState(START_HEARTS);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctTotal, setCorrectTotal] = useState(0);
  const [hints, setHints] = useState(START_HINTS);
  const [boosts, setBoosts] = useState(0);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [phraseSeed, setPhraseSeed] = useState(0);

  // Clock is deadline-based so a time boost just pushes the deadline out.
  const [deadlineAt, setDeadlineAt] = useState(0);
  const [answerTotalMs, setAnswerTotalMs] = useState(0);
  const [answerLeft, setAnswerLeft] = useState(0);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastEntry = useRef<Entry | undefined>(undefined);
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
      const nextConfig = getLevelConfig(nextRound);
      const nextEntry = pickEntry(nextConfig.wordCount, lastEntry.current);
      lastEntry.current = nextEntry;
      const { cards: nextCards, slots: nextSlots } = deal(nextEntry);

      setRound(nextRound);
      setConfig(nextConfig);
      setEntry(nextEntry);
      setCards(nextCards);
      setSlots(nextSlots);
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
    [clearTimers, later],
  );

  const startRun = useCallback(() => {
    setHearts(START_HEARTS);
    setScore(0);
    setStreak(0);
    setCorrectTotal(0);
    setHints(START_HINTS);
    setBoosts(0);
    lastEntry.current = undefined;
    startRound(1);
  }, [startRound]);

  const toggleCard = useCallback(
    (cardId: string) => {
      if (phase !== 'answering') return;
      setAnswer((current) =>
        current.includes(cardId) ? current.filter((id) => id !== cardId) : [...current, cardId],
      );
    },
    [phase],
  );

  const finish = useCallback(
    (mode: 'submit' | 'timeout' | 'skip') => {
      if (phase !== 'answering') return;
      if (mode === 'submit' && answer.length !== cards.length) return;

      if (mode === 'skip') {
        const cost = Math.min(SKIP_PENALTY, score);
        setScore((s) => s - cost);
        setStreak(0);
        setResult({
          correctFlags: cards.map(() => false),
          gained: -cost,
          passed: false,
          timedOut: false,
          skipped: true,
          hintEarned: false,
          boostEarned: false,
        });
        setPhase('result');
        return;
      }

      const correctFlags = cards.map((card, i) => answer[i] === card.id);
      const correctCount = correctFlags.filter(Boolean).length;
      const passed = correctCount === cards.length;
      const gained =
        correctCount * POINTS_PER_CARD +
        (passed ? PERFECT_BONUS + config.swapCount * POINTS_PER_SWAP : 0);

      const { nextStreak, nextCorrect, hintEarned, boostEarned } = rewardsFor(
        passed,
        streak,
        correctTotal,
      );

      setScore((s) => s + gained);
      setStreak(nextStreak);
      setCorrectTotal(nextCorrect);
      if (hintEarned) setHints((h) => h + 1);
      if (boostEarned) setBoosts((b) => b + 1);
      if (!passed) setHearts((h) => h - 1);

      setResult({
        correctFlags,
        gained,
        passed,
        timedOut: mode === 'timeout',
        skipped: false,
        hintEarned,
        boostEarned,
      });
      setPhase('result');
    },
    [answer, cards, config.swapCount, correctTotal, phase, score, streak],
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
    const target = cards.find((c) => !revealed.includes(c.id) && !answer.includes(c.id));
    if (!target) return;
    setRevealed((current) => [...current, target.id]);
    setHints((h) => h - 1);
  }, [answer, cards, hints, phase, revealed]);

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

  return {
    round,
    config,
    entry,
    cards,
    slots,
    phase,
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
    result,
    faceUp,
    phraseSeed,
    startRun,
    toggleCard,
    submit,
    skip,
    useHint,
    useBoost,
    holdClock,
    releaseClock,
    advance,
  };
}
