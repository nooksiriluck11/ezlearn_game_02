import Phaser from 'phaser';
import { play } from '../audio/sfx';
import type { GameEngine } from '../game/engine';
import { SKIP_PENALTY } from '../game/engine';
import { colors, font, radius, spacing, weights } from '../theme';
import { label, paintBar, paintSurface, surface, tappable } from './kit';

const CALM = ['Beat the clock!', 'You got this!', 'Lock it in!'];
const MID = ['Keep it up!', 'Halfway there!', 'Stay sharp!'];
const LOW = ['Hurry up!', 'Tick tock!', 'Almost out of time!'];

/** The pieces of the answer clock that change every tick. */
export type TimerParts = {
  phrase: Phaser.GameObjects.Text;
  seconds: Phaser.GameObjects.Text;
  fill: Phaser.GameObjects.Graphics;
  width: number;
  deadlineAt: number;
  low: boolean;
};

type Chip = {
  text: string;
  badge: string | null;
  tint: string;
  off: boolean;
  tap: () => void;
};

/** The row of numbered slots under the board, one per word in the phrase. */
export function answerRow(
  scene: Phaser.Scene,
  width: number,
  engine: GameEngine,
  showNumbers: boolean,
): Phaser.GameObjects.Container {
  const node = scene.add.container(0, 0);
  const count = engine.cards.length;
  const gap = spacing.sm;
  const slotWidth = Math.min(62, (width - gap * (count - 1)) / count);
  const slotHeight = 42;
  const rowWidth = count * slotWidth + (count - 1) * gap;

  engine.cards.forEach((_, index) => {
    const chosenId = engine.answer[index];
    const chosen = engine.cards.find((card) => card.id === chosenId);
    const x = -rowWidth / 2 + slotWidth / 2 + index * (slotWidth + gap);
    const slot = scene.add.container(x, 0);
    slot.add(
      surface(scene, slotWidth, slotHeight, {
        fill: colors.bgSoft,
        stroke: chosen ? colors.accent : colors.surface,
        strokeWidth: 2,
        radius: radius.sm,
      }),
    );
    if (chosen) {
      slot.add(
        label(scene, showNumbers ? `#${chosen.number}` : '●', font.body, {
          color: colors.text,
          weight: weights.bold,
        }),
      );
    } else {
      const placeholder = label(scene, `${index + 1}`, font.body, {
        color: colors.textDim,
        weight: weights.bold,
      });
      placeholder.setAlpha(0.5);
      slot.add(placeholder);
    }
    node.add(slot);
  });

  node.setSize(rowWidth, Math.max(46, slotHeight));
  return node;
}

/** Hint · +5s · Unshuffle · Skip, wrapped onto as many rows as the width needs. */
export function actionBar(
  scene: Phaser.Scene,
  width: number,
  engine: GameEngine,
): Phaser.GameObjects.Container {
  const node = scene.add.container(0, 0);
  const chips: Chip[] = [
    {
      text: 'Hint',
      badge: `${engine.hints}`,
      tint: colors.hint,
      off: engine.hints <= 0 || !engine.canHint,
      tap: () => {
        play('reward');
        engine.useHint();
      },
    },
    {
      text: '+5s',
      badge: `${engine.boosts}`,
      tint: colors.mint,
      off: engine.boosts <= 0,
      tap: () => {
        play('reward');
        engine.useBoost();
      },
    },
    {
      text: 'Unshuffle',
      badge: `${engine.unshuffles}`,
      tint: colors.warn,
      off: !engine.canUnshuffle,
      tap: () => {
        play('swap');
        engine.useUnshuffle();
      },
    },
    {
      text: 'Skip',
      badge: null,
      tint: colors.surfaceHi,
      off: false,
      tap: () => {
        play('tap');
        engine.skip();
      },
    },
  ];

  const built = chips.map((chip) => {
    const holder = scene.add.container(0, 0);
    const plate = scene.add.graphics();
    const text = label(scene, chip.text, font.small, {
      color: chip.text === 'Skip' ? colors.textDim : colors.text,
      weight: weights.black,
    });
    holder.add([plate, text]);

    let badgeWidth = 0;
    let badge: Phaser.GameObjects.Container | null = null;
    if (chip.badge !== null) {
      badge = scene.add.container(0, 0);
      const badgePlate = scene.add.graphics();
      paintSurface(badgePlate, 22, 16, {
        fill: chip.off ? null : colors.surfaceHi,
        radius: radius.pill,
      });
      badge.add([
        badgePlate,
        label(scene, chip.badge, font.tiny, { color: colors.text, weight: weights.black }),
      ]);
      badgeWidth = 22 + 6;
      holder.add(badge);
    } else {
      badge = scene.add.container(0, 0);
      badge.add(
        label(scene, `−${SKIP_PENALTY}`, font.tiny, { color: colors.bad, weight: weights.black }),
      );
      badgeWidth = 26 + 6;
      holder.add(badge);
    }

    const chipWidth = Math.ceil(text.width) + badgeWidth + spacing.md * 2;
    const chipHeight = 36;
    paintSurface(plate, chipWidth, chipHeight, {
      radius: radius.pill,
      fill: colors.surface,
      stroke: chip.tint,
      strokeWidth: 1.5,
    });
    text.setPosition(-chipWidth / 2 + spacing.md + text.width / 2, 0);
    badge.setPosition(chipWidth / 2 - spacing.md - (badgeWidth - 6) / 2, 0);
    holder.setAlpha(chip.off ? 0.35 : 1);
    if (!chip.off) tappable(holder, chipWidth, chipHeight, chip.tap);
    return { holder, width: chipWidth, height: chipHeight };
  });

  // Wrap like the native flex row did — but split evenly, so four chips read
  // as two rows of two rather than three and a stray.
  const gap = spacing.sm;
  const lineWidth = (items: typeof built) =>
    items.reduce((sum, chip) => sum + chip.width, 0) + gap * Math.max(0, items.length - 1);
  const total = lineWidth(built);
  const perRow = total <= width ? built.length : Math.ceil(built.length / 2);
  const rows: { items: typeof built; width: number }[] = [];
  for (let i = 0; i < built.length; i += perRow) {
    const items = built.slice(i, i + perRow);
    rows.push({ items, width: lineWidth(items) });
  }

  const rowHeight = 36;
  const totalHeight = rows.length * rowHeight + (rows.length - 1) * gap;
  rows.forEach((row, rowIndex) => {
    let x = -row.width / 2;
    const y = -totalHeight / 2 + rowHeight / 2 + rowIndex * (rowHeight + gap);
    row.items.forEach((chip) => {
      chip.holder.setPosition(x + chip.width / 2, y);
      node.add(chip.holder);
      x += chip.width + gap;
    });
  });

  node.setSize(width, totalHeight);
  return node;
}

/**
 * The answer clock: a nagging phrase, the seconds left, and a bar that glides
 * down. Returns the handful of parts `updateAnswerTimer` writes to each tick.
 */
export function answerTimer(
  scene: Phaser.Scene,
  width: number,
  engine: GameEngine,
): { node: Phaser.GameObjects.Container; parts: TimerParts } {
  const node = scene.add.container(0, 0);
  const totalSeconds = engine.answerTotalMs / 1000;
  const ratio = totalSeconds > 0 ? engine.answerLeft / totalSeconds : 0;
  const low = ratio <= 0.3;
  const mid = !low && ratio <= 0.6;
  const bank = low ? LOW : mid ? MID : CALM;
  const tone = low ? colors.bad : mid ? colors.warn : colors.accent;

  const phrase = label(scene, bank[engine.phraseSeed % bank.length], font.small, {
    color: tone,
    weight: weights.black,
    align: 'left',
    letterSpacing: 0.3,
  });
  phrase.setPosition(-width / 2, -10);
  const seconds = label(scene, `${engine.answerLeft}s`, font.small, {
    color: tone,
    weight: weights.black,
    align: 'right',
  });
  seconds.setPosition(width / 2, -10);

  const track = surface(scene, width, 8, { fill: colors.surface, radius: radius.pill });
  track.setPosition(0, 8);
  const fill = scene.add.graphics();
  paintBar(fill, width, 8, tone);
  fill.setPosition(-width / 2, 8);
  fill.setScale(Math.max(0, Math.min(1, ratio)), 1);

  node.add([phrase, seconds, track, fill]);
  node.setSize(width, 30);
  const parts: TimerParts = { phrase, seconds, fill, width, deadlineAt: 0, low: false };
  updateAnswerTimer(scene, parts, engine);
  return { node, parts };
}

/**
 * The clock ticks every frame; rebuilding the footer that often would churn a
 * dozen objects a second, so only the three parts that change get touched.
 */
export function updateAnswerTimer(
  scene: Phaser.Scene,
  parts: TimerParts,
  engine: GameEngine,
): void {
  const totalSeconds = engine.answerTotalMs / 1000;
  const ratio = totalSeconds > 0 ? engine.answerLeft / totalSeconds : 0;
  const low = ratio <= 0.3;
  const mid = !low && ratio <= 0.6;
  const bank = low ? LOW : mid ? MID : CALM;
  const tone = low ? colors.bad : mid ? colors.warn : colors.accent;

  parts.phrase.setText(bank[engine.phraseSeed % bank.length]).setColor(tone);
  parts.seconds.setText(`${engine.answerLeft}s`).setColor(tone);
  paintBar(parts.fill, parts.width, 8, tone);

  // One long linear glide per deadline — a time boost simply moves the
  // deadline and the bar restarts from wherever it had got to.
  if (engine.deadlineAt !== parts.deadlineAt) {
    parts.deadlineAt = engine.deadlineAt;
    scene.tweens.killTweensOf(parts.fill);
    if (engine.deadlineAt === 0) {
      parts.fill.setScale(Math.max(0, Math.min(1, ratio)), 1);
    } else {
      const remaining = Math.max(0, engine.deadlineAt - scene.time.now);
      parts.fill.setScale(Math.max(0, Math.min(1, remaining / engine.answerTotalMs)), 1);
      scene.tweens.add({ targets: parts.fill, scaleX: 0, duration: remaining, ease: 'Linear' });
    }
  }

  // Start the nag pulse once, when the clock first turns red.
  if (low !== parts.low) {
    parts.low = low;
    scene.tweens.killTweensOf(parts.phrase);
    parts.phrase.setScale(1);
    if (low) {
      scene.tweens.add({
        targets: parts.phrase,
        scale: 1.06,
        duration: 340,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }
}
