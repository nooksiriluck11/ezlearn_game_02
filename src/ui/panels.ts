import Phaser from 'phaser';
import { colors, font, hex, radius, spacing, weights } from '../theme';
import { Button, label, paintSurface, scrim, surface, tappable } from './kit';

/** A row knows its own height so the stack can place the next one under it. */
export type Row = { node: Phaser.GameObjects.Container; height: number };

export function groupLabel(scene: Phaser.Scene, width: number, text: string): Row {
  const node = scene.add.container(0, 0);
  const title = label(scene, text, font.tiny, {
    color: colors.mint,
    weight: weights.black,
    align: 'left',
    letterSpacing: 1.2,
  });
  title.setPosition(-width / 2, spacing.sm);
  node.add(title);
  return { node, height: 26 };
}

/** Dim closing line under a panel's rows. */
export function noteRow(scene: Phaser.Scene, width: number, text: string): Row {
  const node = scene.add.container(0, 0);
  const body = label(scene, text, font.tiny, {
    color: colors.textDim,
    align: 'left',
    wrapWidth: width,
    lineSpacing: 3,
  });
  body.setAlpha(0.8);
  body.setPosition(-width / 2, 0);
  node.add(body);
  return { node, height: body.height + spacing.sm };
}

const ROW_HEIGHT = 46;
const TRACK_WIDTH = 46;
const KNOB = 20;

/**
 * Stacks a row's label over its hint and centres the pair on the row. The hints
 * are Thai and wrap to two or three lines on a narrow phone, so the row has to
 * take its height from the text rather than assume one line.
 */
function stackText(
  name: Phaser.GameObjects.Text,
  hint: Phaser.GameObjects.Text,
  x: number,
): number {
  const block = name.height + 2 + hint.height;
  name.setPosition(x, -block / 2 + name.height / 2);
  hint.setPosition(x, block / 2 - hint.height / 2);
  return Math.max(ROW_HEIGHT, block + 12);
}

export function toggleRow(
  scene: Phaser.Scene,
  width: number,
  opts: { icon: string; label: string; hint: string; value: boolean; onChange: (next: boolean) => void },
): Row {
  const node = scene.add.container(0, 0);
  const left = -width / 2;

  const icon = label(scene, opts.icon, font.body, { align: 'center' });
  icon.setPosition(left + 12, 0);

  const name = label(scene, opts.label, font.small, {
    color: colors.text,
    weight: weights.black,
    align: 'left',
  });
  const hint = label(scene, opts.hint, font.tiny, {
    color: colors.textDim,
    align: 'left',
    wrapWidth: width - 32 - TRACK_WIDTH - 20,
    lineSpacing: 2,
  });
  const height = stackText(name, hint, left + 32);

  const track = scene.add.graphics();
  const knob = scene.add.circle(0, 0, KNOB / 2, hex(colors.textDim));
  const switchX = width / 2 - TRACK_WIDTH / 2;

  const paint = (on: boolean, animate: boolean) => {
    paintSurface(track, TRACK_WIDTH, KNOB + 6, {
      radius: radius.pill,
      fill: on ? colors.accent : colors.surface,
      stroke: on ? colors.accent : colors.surfaceHi,
      strokeWidth: 1,
    });
    knob.setFillStyle(hex(on ? colors.accentText : colors.textDim));
    const x = switchX + (on ? (TRACK_WIDTH - KNOB) / 2 - 3 : -(TRACK_WIDTH - KNOB) / 2 + 3);
    if (animate) {
      scene.tweens.add({ targets: knob, x, duration: 140, ease: 'Quad.easeOut' });
    } else {
      knob.x = x;
    }
  };

  track.setPosition(switchX, 0);
  let value = opts.value;
  paint(value, false);

  node.add([icon, name, hint, track, knob]);
  tappable(node, width, height, () => {
    value = !value;
    paint(value, true);
    opts.onChange(value);
  });

  return { node, height };
}

export function choiceRow(
  scene: Phaser.Scene,
  width: number,
  opts: {
    icon: string;
    label: string;
    hint: string;
    options: readonly number[];
    value: number;
    format: (option: number) => string;
    onChange: (next: number) => void;
  },
): Row {
  const node = scene.add.container(0, 0);
  const left = -width / 2;

  // Kept tight: every pixel here is one the Thai hint needs to break on a space
  // instead of mid-word.
  const pillWidth = 34;
  const pillHeight = 26;
  const pillGap = 4;
  const pillsWidth = opts.options.length * pillWidth + (opts.options.length - 1) * pillGap;

  const icon = label(scene, opts.icon, font.body);
  icon.setPosition(left + 12, 0);

  const name = label(scene, opts.label, font.small, {
    color: colors.text,
    weight: weights.black,
    align: 'left',
  });
  const hint = label(scene, opts.hint, font.tiny, {
    color: colors.textDim,
    align: 'left',
    wrapWidth: width - 32 - pillsWidth - 10,
    lineSpacing: 2,
  });
  const height = stackText(name, hint, left + 32);

  node.add([icon, name, hint]);

  let value = opts.value;
  const repaint: (() => void)[] = [];

  opts.options.forEach((option, index) => {
    const pill = scene.add.container(
      width / 2 - pillsWidth + pillWidth / 2 + index * (pillWidth + pillGap),
      0,
    );
    const plate = scene.add.graphics();
    const text = label(scene, opts.format(option), font.tiny, { weight: weights.black });
    pill.add([plate, text]);

    const paint = () => {
      const picked = option === value;
      paintSurface(plate, pillWidth, pillHeight, {
        radius: radius.pill,
        fill: picked ? colors.accent : colors.surface,
        stroke: picked ? colors.accent : colors.surfaceHi,
        strokeWidth: 1,
      });
      text.setColor(picked ? colors.accentText : colors.textDim);
    };
    paint();
    repaint.push(paint);

    tappable(pill, pillWidth, pillHeight, () => {
      value = option;
      repaint.forEach((fn) => fn());
      opts.onChange(option);
    });
    node.add(pill);
  });

  return { node, height };
}

export function bonusRow(
  scene: Phaser.Scene,
  width: number,
  opts: { tint: string; name: string; does: string; how: string },
): Row {
  const node = scene.add.container(0, 0);
  const left = -width / 2;
  const textLeft = left + 24;
  const wrap = width - 32;

  const dot = scene.add.circle(left + 12, 0, 4, hex(opts.tint));

  const name = label(scene, opts.name, font.small, {
    color: colors.text,
    weight: weights.black,
    align: 'left',
  });
  const does = label(scene, opts.does, font.tiny, {
    color: colors.textDim,
    align: 'left',
    wrapWidth: wrap,
    lineSpacing: 3,
  });
  const how = label(scene, opts.how, font.tiny, {
    color: colors.mint,
    weight: weights.black,
    align: 'left',
    wrapWidth: wrap,
    lineSpacing: 3,
  });

  let y = 0;
  for (const [node2, gap] of [
    [name, 4],
    [does, 4],
    [how, 0],
  ] as const) {
    node2.setPosition(textLeft, y + node2.height / 2);
    y += node2.height + gap;
  }
  // The dot lines up with the name, not the block's middle.
  dot.setPosition(left + 12, name.y);
  node.add([dot, name, does, how]);
  node.setY(0);

  // Rows are placed by their centre, so shift the block up by half its height.
  [name, does, how, dot].forEach((child) => (child.y -= y / 2));
  return { node, height: y + spacing.sm };
}

export type PopupOptions = {
  title: string;
  closeLabel?: string;
  /** Builds the body rows for a given inner width. */
  rows: (innerWidth: number) => Row[];
  onClose: () => void;
};

/**
 * The shell both the settings and the bonus panels sit in. Instead of scrolling
 * a clipped body — masks are a filter in Phaser 4, and overkill here — the whole
 * card scales down when it would not fit the window.
 */
export class Popup extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, vw: number, vh: number, opts: PopupOptions) {
    super(scene, 0, 0);

    const cardWidth = Math.min(vw - spacing.md * 2, 420);
    const inner = cardWidth - spacing.md * 2;
    const headHeight = 34;
    const doneHeight = 44;

    const rows = opts.rows(inner);
    const bodyHeight = rows.reduce((total, row) => total + row.height, 0);
    const cardHeight =
      spacing.md * 2 + headHeight + spacing.sm + bodyHeight + spacing.md + doneHeight;

    const veil = scrim(scene, vw, vh, 0.9, opts.onClose);
    const card = scene.add.container(vw / 2, vh / 2);
    const plate = surface(scene, cardWidth, cardHeight, {
      fill: colors.bgSoft,
      stroke: colors.surfaceHi,
      strokeWidth: 1,
      radius: radius.lg,
      raised: true,
    });
    card.add(plate);

    const top = -cardHeight / 2 + spacing.md;

    const title = label(scene, opts.title, font.heading - 6, {
      color: colors.text,
      weight: weights.black,
      align: 'left',
    });
    title.setPosition(-inner / 2, top + headHeight / 2);
    card.add(title);

    const close = scene.add.container(inner / 2 - 15, top + headHeight / 2);
    const closePlate = surface(scene, 30, 30, {
      fill: colors.surface,
      stroke: colors.surfaceHi,
      strokeWidth: 1,
      radius: radius.pill,
    });
    const closeMark = label(scene, '✕', font.small, {
      color: colors.textDim,
      weight: weights.black,
    });
    close.add([closePlate, closeMark]);
    tappable(close, 34, 34, opts.onClose);
    card.add(close);

    let y = top + headHeight + spacing.sm;
    rows.forEach((row) => {
      row.node.setPosition(0, y + row.height / 2);
      card.add(row.node);
      y += row.height;
    });

    const done = new Button(
      scene,
      opts.closeLabel ?? 'Done',
      {
        width: inner,
        height: doneHeight,
        fill: colors.accent,
        radius: radius.pill,
        fontSize: font.body,
        raised: true,
      },
      opts.onClose,
    );
    done.setPosition(0, cardHeight / 2 - spacing.md - doneHeight / 2);
    card.add(done);

    // Never taller than the window: shrink rather than clip.
    const fit = Math.min(1, (vh - spacing.md * 2) / cardHeight, (vw - spacing.md) / cardWidth);
    card.setScale(fit);

    this.add([veil, card]);
    scene.add.existing(this);
    this.setDepth(100);
  }
}
