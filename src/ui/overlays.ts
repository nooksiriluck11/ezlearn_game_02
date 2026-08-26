import Phaser from 'phaser';
import { play } from '../audio/sfx';
import type { Entry } from '../data/phrases';
import { KIND_LABEL } from '../data/phrases';
import type { GameEngine, RoundResult } from '../game/engine';
import { colors, font, radius, spacing, weights } from '../theme';
import { Button, label, scrim, surface } from './kit';

/** One stacked line of the result card, with the gap that follows it. */
type Part = {
  child: Phaser.GameObjects.GameObject & { y: number };
  height: number;
  gap: number;
};

function headlineFor(result: RoundResult): { text: string; color: string } {
  if (result.passed) return { text: 'Perfect!', color: colors.good };
  if (result.skipped) return { text: 'Skipped', color: colors.textDim };
  if (result.timedOut) return { text: "Time's up!", color: colors.bad };
  return { text: 'Not quite', color: colors.bad };
}

/**
 * The card that closes a round: what happened, the phrase, its Thai meaning,
 * the points, and what to press next. Returned unpositioned — the caller knows
 * how much room it has and scales it to fit.
 */
export function resultCard(
  scene: Phaser.Scene,
  engine: GameEngine,
  opts: { result: RoundResult; entry: Entry; cardWidth: number; onContinue: () => void },
): { node: Phaser.GameObjects.Container; height: number } {
  const { result, entry, cardWidth } = opts;
  const outOfHearts = !result.passed && !result.skipped && engine.hearts <= 0;
  const head = headlineFor(result);
  const buttonLabel = outOfHearts
    ? 'See final score'
    : result.passed || result.skipped
      ? 'Next'
      : 'Try again';

  const inner = cardWidth - spacing.lg * 2;
  const node = scene.add.container(0, 0);
  const parts: Part[] = [];
  const push = (child: Part['child'], height: number, gap: number) =>
    parts.push({ child, height, gap });

  const title = label(scene, head.text, font.heading, {
    color: head.color,
    weight: weights.black,
  });
  push(title, title.height, spacing.xs);

  const pill = scene.add.container(0, 0);
  const kindText = label(scene, KIND_LABEL[entry.kind], font.tiny, {
    color: colors.mint,
    weight: weights.black,
    letterSpacing: 1.2,
  });
  pill.add(
    surface(scene, kindText.width + spacing.md, 20, {
      fill: colors.surface,
      radius: radius.pill,
    }),
  );
  pill.add(kindText);
  push(pill, 20, spacing.sm);

  if (result.question) {
    const question = label(scene, `“${result.question.th}” = ${result.question.word}`, font.body, {
      color: colors.mint,
      weight: weights.black,
      wrapWidth: inner,
    });
    push(question, question.height, spacing.xs);
  }

  const answer = label(scene, entry.words.join(' '), font.body + 3, {
    color: colors.text,
    weight: weights.black,
    wrapWidth: inner,
  });
  push(answer, answer.height, spacing.xs);

  const translation = label(scene, entry.th, font.body, {
    color: colors.textDim,
    wrapWidth: inner,
    lineSpacing: 6,
  });
  push(translation, translation.height, spacing.sm);

  const points = label(
    scene,
    `${result.gained >= 0 ? `+${result.gained}` : result.gained} points`,
    font.body,
    { color: result.gained < 0 ? colors.bad : colors.accent, weight: weights.black },
  );
  push(points, points.height, spacing.xs);

  [
    result.hintEarned ? '+1 hint earned' : null,
    result.boostEarned ? '+1 time boost earned' : null,
    result.unshuffleEarned ? '+1 un-shuffle earned' : null,
  ]
    .filter((text): text is string => text !== null)
    .forEach((text) => {
      const reward = label(scene, text, font.small, {
        color: colors.mint,
        weight: weights.black,
      });
      push(reward, reward.height, 2);
    });

  if (!result.passed && !result.skipped) {
    const lives = label(
      scene,
      engine.hearts > 0
        ? `${engine.hearts} ${engine.hearts === 1 ? 'life' : 'lives'} left`
        : 'No lives left',
      font.small,
      { color: colors.textDim },
    );
    push(lives, lives.height, spacing.sm);
  }

  const button = new Button(
  scene,
    buttonLabel,
    {
      padX: spacing.xl,
      padY: spacing.sm + 4,
      radius: radius.pill,
      fill: colors.accent,
      fontSize: font.body,
      raised: true,
    },
    () => {
      play('tap');
      opts.onContinue();
    },
  );
  push(button, button.height, 0);

  const bodyHeight = parts.reduce((sum, part, i) => {
    return sum + part.height + (i < parts.length - 1 ? part.gap : 0);
  }, 0);
  const cardHeight = bodyHeight + spacing.lg * 2;

  const plate = surface(scene, cardWidth, cardHeight, {
    fill: colors.bgSoft,
    stroke: colors.surfaceHi,
    strokeWidth: 1,
    radius: radius.lg,
    raised: true,
  });
  node.add(plate);

  let y = -cardHeight / 2 + spacing.lg;
  parts.forEach((part) => {
    part.child.y = y + part.height / 2;
    node.add(part.child);
    y += part.height + part.gap;
  });

  return { node, height: cardHeight };
}

/** Covers the board on purpose: no free extra look at the cards while deciding. */
export function quitCard(
  scene: Phaser.Scene,
  engine: GameEngine,
  opts: { vw: number; vh: number; onStay: () => void; onQuit: () => void },
): Phaser.GameObjects.Container {
  const { vw, vh } = opts;
  const rounds = engine.round - 1;
  const node = scene.add.container(0, 0);
  const cardWidth = Math.min(vw - spacing.lg * 2, 340);
  const inner = cardWidth - spacing.lg * 2;

  const veil = scrim(scene, vw, vh, 0.92);
  const card = scene.add.container(vw / 2, vh / 2);

  const title = label(scene, 'Quit this run?', font.heading - 2, {
    color: colors.text,
    weight: weights.black,
  });
  const body = label(
    scene,
    rounds > 0
      ? `${engine.score.toLocaleString()} points from ${rounds} ${rounds === 1 ? 'round' : 'rounds'} are saved.`
      : 'Nothing scored yet — the clock stops here.',
    font.small,
    { color: colors.textDim, wrapWidth: inner, lineSpacing: 6 },
  );

  const stay = new Button(
    scene,
    'Keep playing',
    {
      width: inner,
      height: 44,
      radius: radius.pill,
      fill: colors.accent,
      fontSize: font.body,
      raised: true,
    },
    () => {
      play('tap');
      opts.onStay();
    },
  );
  const quit = new Button(
    scene,
    'Quit',
    {
      width: inner,
      height: 42,
      radius: radius.pill,
      fill: null,
      stroke: colors.surfaceHi,
      strokeWidth: 1,
      textColor: colors.bad,
      fontSize: font.body,
    },
    () => {
      play('tap');
      opts.onQuit();
    },
  );

  const gap = spacing.sm;
  const bodyHeight =
    title.height + gap + body.height + gap + spacing.xs + stay.height + gap + quit.height;
  const cardHeight = bodyHeight + spacing.lg * 2;

  card.add(
    surface(scene, cardWidth, cardHeight, {
      fill: colors.bgSoft,
      stroke: colors.surfaceHi,
      strokeWidth: 1,
      radius: radius.lg,
      raised: true,
    }),
  );

  let y = -cardHeight / 2 + spacing.lg;
  for (const [child, height, after] of [
    [title, title.height, gap],
    [body, body.height, gap + spacing.xs],
    [stay, stay.height, gap],
    [quit, quit.height, 0],
  ] as const) {
    (child as Phaser.GameObjects.Container).y = y + height / 2;
    card.add(child as Phaser.GameObjects.GameObject);
    y += height + after;
  }

  card.setScale(Math.min(1, (vh - spacing.lg * 2) / cardHeight));
  node.add([veil, card]);
  node.setDepth(80);
  return node;
}
