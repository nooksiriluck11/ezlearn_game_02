import Phaser from 'phaser';
import type { Entry, Pos } from '../data/phrases';
import { pickEntry } from '../data/phrases';
import type { LevelConfig } from './levels';
import { getLevelConfig } from './levels';
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

/**
 * Timers come from the Scene clock rather than `setTimeout`, so a round pauses
 * with the Scene and dies with it. Keeping it an interface also keeps the rules
 * in this file free of Phaser.
 */
export type Scheduler = {
  after(ms: number, fn: () => void): void;
  clear(): void;
  now(): number;
};

export const FLIP_MS = 500;
export const SWAP_MS = 450;
/** Beat between the last card landing face-down and the first swap. */
export const SETTLE_MS = 600;

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

/**
 * The whole round loop, with no drawing in it. Scenes read the public fields and
 * redraw on the events below:
 *
 *   'round'     a fresh hand was dealt — rebuild the board
 *   'phase'     the round moved on
 *   'countdown' memorize seconds ticked
 *   'slots'     a swap (or the un-shuffle item) moved the cards
 *   'answer'    the picked order changed
 *   'revealed'  a hint turned a card face up
 *   'hud'       score, hearts, streak or item counts moved
 *   'clock'     the answer timer ticked
 *   'result'    the round was graded
 *   'gameover'  the last life is gone
 */
export class GameEngine extends Phaser.Events.EventEmitter {
  round = 1;
  config: LevelConfig = getLevelConfig(1);
  entry: Entry | null = null;
  cards: Card[] = [];
  slots: string[] = [];
  /** The order the cards were dealt in — what the un-shuffle item puts them back to. */
  dealtSlots: string[] = [];
  kind: RoundKind = 'order';
  targetId: string | null = null;
  phase: Phase = 'memorize';
  countdown = 0;
  answer: string[] = [];
  revealed: string[] = [];
  hearts: number;
  score = 0;
  streak = 0;
  correctTotal = 0;
  hints = START_HINTS;
  boosts = 0;
  unshuffles = START_UNSHUFFLES;
  result: RoundResult | null = null;
  phraseSeed = 0;

  // Clock is deadline-based so a time boost just pushes the deadline out.
  deadlineAt = 0;
  answerTotalMs = 0;
  answerLeft = 0;

  private lastEntry: Entry | undefined = undefined;
  private lastKind: RoundKind = 'order';
  private heldMs: number | null = null;

  constructor(
    private readonly options: GameOptions,
    private readonly clock: Scheduler,
  ) {
    super();
    this.hearts = options.startHearts;
  }

  get target(): Card | null {
    return this.cards.find((card) => card.id === this.targetId) ?? null;
  }

  get faceUp(): boolean {
    return this.phase === 'memorize' || this.phase === 'result';
  }

  /** Nothing to undo when the cards never moved. */
  get canUnshuffle(): boolean {
    return (
      this.phase === 'answering' &&
      this.unshuffles > 0 &&
      this.slots.some((id, i) => id !== this.dealtSlots[i])
    );
  }

  get canHint(): boolean {
    return this.cards.some((c) => !this.revealed.includes(c.id) && !this.answer.includes(c.id));
  }

  startRun(): void {
    this.hearts = this.options.startHearts;
    this.score = 0;
    this.streak = 0;
    this.correctTotal = 0;
    this.hints = START_HINTS;
    this.boosts = 0;
    this.unshuffles = START_UNSHUFFLES;
    this.lastEntry = undefined;
    this.lastKind = 'order';
    this.emit('hud');
    this.startRound(1);
  }

  private setPhase(phase: Phase): void {
    this.phase = phase;
    if (phase === 'answering') this.openClock();
    this.emit('phase', phase);
  }

  private startRound(nextRound: number): void {
    this.clock.clear();
    // The player's memorize setting wins over the level table.
    const config = { ...getLevelConfig(nextRound), memorizeSeconds: this.options.memorizeSeconds };
    const entry = pickEntry(config.wordCount, this.lastEntry);
    this.lastEntry = entry;
    const { cards, slots } = deal(entry);

    this.round = nextRound;
    this.config = config;
    this.entry = entry;
    this.cards = cards;
    this.slots = slots;
    this.dealtSlots = slots;

    // Never two meaning rounds back to back, and only when a card can be asked about.
    const tryMeaning =
      nextRound >= MEANING_FROM_ROUND &&
      this.lastKind !== 'meaning' &&
      Math.random() < MEANING_CHANCE;
    const target = tryMeaning ? meaningTarget(cards) : null;
    this.lastKind = target ? 'meaning' : 'order';
    this.kind = this.lastKind;
    this.targetId = target?.id ?? null;
    this.answer = [];
    this.revealed = [];
    this.result = null;
    this.deadlineAt = 0;
    this.answerTotalMs = config.answerSeconds * 1000;
    this.answerLeft = config.answerSeconds;
    this.phraseSeed = Math.floor(Math.random() * 1000);
    this.countdown = config.memorizeSeconds;

    this.emit('round');
    this.phase = 'memorize';
    this.emit('phase', this.phase);

    for (let tick = 1; tick <= config.memorizeSeconds; tick++) {
      this.clock.after(tick * 1000, () => {
        this.countdown = config.memorizeSeconds - tick;
        this.emit('countdown', this.countdown);
      });
    }

    const hideAt = config.memorizeSeconds * 1000;
    this.clock.after(hideAt, () => this.setPhase('hiding'));

    const plan = buildSwapPlan(config.wordCount, config.swapCount);
    const shuffleAt = hideAt + SETTLE_MS;
    if (plan.length === 0) {
      this.clock.after(shuffleAt, () => this.setPhase('answering'));
      return;
    }
    this.clock.after(shuffleAt, () => this.setPhase('shuffling'));
    plan.forEach((pair, i) => {
      this.clock.after(shuffleAt + i * SWAP_MS, () => {
        this.slots = applySwap(this.slots, pair);
        this.emit('slots');
      });
    });
    this.clock.after(shuffleAt + plan.length * SWAP_MS + SWAP_MS / 2, () =>
      this.setPhase('answering'),
    );
  }

  toggleCard(cardId: string): void {
    if (this.phase !== 'answering') return;
    if (this.kind === 'meaning') {
      this.answer = this.answer[0] === cardId ? [] : [cardId];
    } else {
      this.answer = this.answer.includes(cardId)
        ? this.answer.filter((id) => id !== cardId)
        : [...this.answer, cardId];
    }
    this.emit('answer');
  }

  submit(): void {
    this.finish('submit');
  }

  skip(): void {
    this.finish('skip');
  }

  private finish(mode: 'submit' | 'timeout' | 'skip'): void {
    if (this.phase !== 'answering') return;
    const needed = this.kind === 'meaning' ? 1 : this.cards.length;
    if (mode === 'submit' && this.answer.length !== needed) return;
    const target = this.target;
    const question = target ? { th: target.th, word: target.word } : null;

    this.deadlineAt = 0;

    if (mode === 'skip') {
      const cost = Math.min(SKIP_PENALTY, this.score);
      this.score -= cost;
      this.streak = 0;
      this.emit('hud');
      this.settle({
        kind: this.kind,
        question,
        correctFlags: this.cards.map(() => false),
        gained: -cost,
        passed: false,
        timedOut: false,
        skipped: true,
        hintEarned: false,
        boostEarned: false,
        unshuffleEarned: false,
      });
      return;
    }

    const correctFlags =
      this.kind === 'meaning'
        ? [this.answer[0] === this.targetId]
        : this.cards.map((card, i) => this.answer[i] === card.id);
    const correctCount = correctFlags.filter(Boolean).length;
    const passed = this.kind === 'meaning' ? correctFlags[0] : correctCount === this.cards.length;
    // The Skip penalty stays flat — only points earned scale with the risk taken.
    const earned =
      this.kind === 'meaning'
        ? passed
          ? MEANING_POINTS + this.config.swapCount * POINTS_PER_SWAP
          : 0
        : correctCount * POINTS_PER_CARD +
          (passed ? PERFECT_BONUS + this.config.swapCount * POINTS_PER_SWAP : 0);
    const gained = Math.round(earned * scoreMultiplier(this.options.startHearts));

    const { nextStreak, nextCorrect, hintEarned, boostEarned, unshuffleEarned } = rewardsFor(
      passed,
      this.streak,
      this.correctTotal,
    );

    this.score += gained;
    this.streak = nextStreak;
    this.correctTotal = nextCorrect;
    if (hintEarned) this.hints += 1;
    if (boostEarned) this.boosts += 1;
    if (unshuffleEarned) this.unshuffles += 1;
    if (!passed) this.hearts -= 1;
    this.emit('hud');

    this.settle({
      kind: this.kind,
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
  }

  private settle(result: RoundResult): void {
    this.clock.clear();
    this.result = result;
    this.setPhase('result');
    this.emit('result', result);
  }

  /** Opens the answer clock the moment answering begins. */
  private openClock(): void {
    this.answerTotalMs = this.config.answerSeconds * 1000;
    this.deadlineAt = this.clock.now() + this.answerTotalMs;
    this.answerLeft = this.config.answerSeconds;
    this.emit('clock');
  }

  /** Driven from the Scene's update loop — the only thing that watches the deadline. */
  update(now: number): void {
    if (this.phase !== 'answering' || this.deadlineAt === 0) return;
    const left = Math.max(0, Math.ceil((this.deadlineAt - now) / 1000));
    if (left !== this.answerLeft) {
      this.answerLeft = left;
      this.emit('clock');
    }
    if (left <= 0) this.finish('timeout');
  }

  useHint(): void {
    if (this.phase !== 'answering' || this.hints <= 0) return;
    // Order rounds: cards sit in phrase order, so the first unplayed one is the next needed.
    const target =
      this.kind === 'meaning'
        ? this.cards.find((c) => c.id === this.targetId && !this.revealed.includes(c.id))
        : this.cards.find((c) => !this.revealed.includes(c.id) && !this.answer.includes(c.id));
    if (!target) return;
    this.revealed = [...this.revealed, target.id];
    this.hints -= 1;
    this.emit('revealed', target.id);
    this.emit('hud');
  }

  /** Freezes the answer clock (deadline 0 stops both the tick and the bar). */
  holdClock(): void {
    if (this.phase !== 'answering' || this.deadlineAt === 0) return;
    this.heldMs = Math.max(0, this.deadlineAt - this.clock.now());
    this.deadlineAt = 0;
    this.emit('clock');
  }

  releaseClock(): void {
    const left = this.heldMs;
    this.heldMs = null;
    if (left === null) return;
    this.deadlineAt = this.clock.now() + left;
    this.emit('clock');
  }

  useBoost(): void {
    if (this.phase !== 'answering' || this.boosts <= 0) return;
    this.boosts -= 1;
    this.answerTotalMs += BOOST_MS;
    this.deadlineAt += BOOST_MS;
    this.emit('hud');
    this.emit('clock');
  }

  /** Slides every card back to where it was dealt, undoing this round's swaps. */
  useUnshuffle(): void {
    if (this.phase !== 'answering' || this.unshuffles <= 0) return;
    this.slots = this.dealtSlots;
    this.unshuffles -= 1;
    this.emit('slots');
    this.emit('hud');
  }

  advance(): void {
    const result = this.result;
    if (!result) return;
    if (result.passed || result.skipped) {
      this.startRound(this.round + 1);
    } else if (this.hearts > 0) {
      this.startRound(this.round);
    } else {
      this.clock.clear();
      this.setPhase('gameover');
      this.emit('gameover', this.round - 1, this.score);
    }
  }

  /** Ends the run where it stands — the quit button's exit. */
  giveUp(): void {
    this.clock.clear();
    this.phase = 'gameover';
    this.emit('gameover', this.round - 1, this.score);
  }

  override destroy(): void {
    this.clock.clear();
    super.destroy();
  }
}
