import Phaser from 'phaser';
import type { CardFontSizes } from '../game/layout';
import { FLIP_MS, SWAP_MS } from '../game/engine';
import { colors, font, radius, weights } from '../theme';
import { label, paintSurface } from './kit';

export type CardMark = 'none' | 'hint' | 'correct' | 'wrong';

export type CardViewOptions = {
  word: string;
  /** Thai gloss for this word, shown under it when the translation setting is on. */
  gloss: string | null;
  /** Part-of-speech label, shown above the word when that setting is on. */
  pos: string | null;
  /** null when the player turned card numbers off. */
  number: number | null;
  sizes: CardFontSizes;
  width: number;
  height: number;
  faceUp: boolean;
};

/**
 * One card. Three nested containers so the three motions never fight:
 * the root slides between slots, the lifter raises it when picked, and the flipper
 * squashes on its X axis to turn the card over.
 */
export class CardView extends Phaser.GameObjects.Container {
  private readonly lifter: Phaser.GameObjects.Container;
  private readonly flipper: Phaser.GameObjects.Container;
  private readonly front: Phaser.GameObjects.Container;
  private readonly back: Phaser.GameObjects.Container;
  private readonly frontPlate: Phaser.GameObjects.Graphics;
  private readonly ordinalBadge: Phaser.GameObjects.Container;
  private readonly ordinalText: Phaser.GameObjects.Text;

  private faceUp: boolean;
  private mark: CardMark = 'none';
  private picked = false;
  private flipTween: Phaser.Tweens.Tween | null = null;
  private moveTween: Phaser.Tweens.Tween | null = null;

  constructor(
    scene: Phaser.Scene,
    private readonly opts: CardViewOptions,
  ) {
    super(scene, 0, 0);
    this.faceUp = opts.faceUp;

    const { width, height, sizes } = opts;
    this.lifter = scene.add.container(0, 0);
    this.flipper = scene.add.container(0, 0);
    this.front = scene.add.container(0, 0);
    this.back = scene.add.container(0, 0);

    this.frontPlate = scene.add.graphics();
    this.front.add(this.frontPlate);

    if (opts.number !== null) {
      const badge = label(scene, `${opts.number}`, font.small, {
        color: colors.textDim,
        weight: weights.bold,
        align: 'left',
      });
      badge.setPosition(-width / 2 + 8, -height / 2 + 12);
      this.front.add(badge);
    }

    // The word, the part of speech above nothing and the gloss below it stack
    // as one block centred in the card.
    const word = label(scene, opts.word, sizes.word, {
      color: colors.cardFaceText,
      weight: weights.black,
    });
    // Never wrapped: the fitted size is an estimate from character counts, so a
    // wide word is squeezed down instead of being broken across two lines.
    const overflow = (width - 12) / word.width;
    if (overflow < 1) word.setScale(overflow);

    // The whole face block scales as one, so a small card shrinks its text
    // instead of letting it spill over the edges.
    const face = scene.add.container(0, 0);
    const stack: Phaser.GameObjects.Text[] = [word];
    if (opts.pos) {
      const pos = label(scene, opts.pos, sizes.pos, {
        color: colors.cardFaceTag,
        weight: weights.black,
        letterSpacing: 1,
      });
      stack.push(pos);
    }
    if (opts.gloss) {
      const gloss = label(scene, opts.gloss, sizes.gloss, {
        color: colors.cardFaceGloss,
        weight: weights.semibold,
        wrapWidth: width - 10,
        lineSpacing: 1,
      });
      stack.push(gloss);
    }

    let stackHeight = 0;
    stack.forEach((child, i) => {
      stackHeight += child.displayHeight + (i > 0 ? 4 : 0);
    });
    let y = -stackHeight / 2;
    stack.forEach((child, i) => {
      if (i > 0) y += 4;
      child.setY(y + child.displayHeight / 2);
      y += child.displayHeight;
    });
    face.add(stack);
    face.setScale(Math.min(1, (height - 12) / Math.max(1, stackHeight)));
    this.front.add(face);

    const backPlate = scene.add.graphics();
    paintSurface(backPlate, width, height, {
      fill: colors.cardBack,
      stroke: colors.cardBackEdge,
      strokeWidth: 3,
      radius: radius.md,
    });
    this.back.add(backPlate);

    if (opts.number !== null) {
      const bigNumber = label(scene, `${opts.number}`, sizes.number, {
        color: colors.text,
        weight: weights.black,
      });
      bigNumber.setAlpha(0.55);
      this.back.add(bigNumber);
    }

    this.ordinalBadge = scene.add.container(width / 2 - 18, -height / 2 + 18);
    const ordinalPlate = scene.add.graphics();
    paintSurface(ordinalPlate, 26, 24, { fill: colors.accent, radius: radius.pill });
    this.ordinalText = label(scene, '', font.small, {
      color: colors.accentText,
      weight: weights.black,
    });
    this.ordinalBadge.add([ordinalPlate, this.ordinalText]);
    this.ordinalBadge.setVisible(false);
    this.back.add(this.ordinalBadge);

    this.paintFront();
    this.flipper.add([this.back, this.front]);
    this.lifter.add(this.flipper);
    this.add(this.lifter);

    this.front.setVisible(this.faceUp);
    this.back.setVisible(!this.faceUp);

    this.setSize(width, height);
    scene.add.existing(this);
  }

  private paintFront(): void {
    const border =
      this.mark === 'correct'
        ? colors.good
        : this.mark === 'wrong'
          ? colors.bad
          : this.mark === 'hint'
            ? colors.hint
            : null;
    paintSurface(this.frontPlate, this.opts.width, this.opts.height, {
      fill: colors.cardFace,
      stroke: border,
      strokeWidth: border ? 3 : 0,
      radius: radius.md,
    });
  }

  onTap(handler: () => void): this {
    this.setInteractive({ useHandCursor: true }).on('pointerup', handler);
    return this;
  }

  /** Slides to a slot. The first placement of a round lands instantly. */
  slideTo(x: number, y: number, animate: boolean): void {
    this.moveTween?.stop();
    if (!animate) {
      this.setPosition(x, y);
      return;
    }
    this.moveTween = this.scene.tweens.add({
      targets: this,
      x,
      y,
      duration: SWAP_MS,
      ease: 'Cubic.easeInOut',
    });
  }

  setFaceUp(up: boolean, animate: boolean): void {
    if (up === this.faceUp) return;
    this.faceUp = up;
    this.flipTween?.stop();
    if (!animate) {
      this.flipper.setScale(1, 1);
      this.front.setVisible(up);
      this.back.setVisible(!up);
      return;
    }
    // Squash to nothing, swap the visible face at the midpoint, then unsquash.
    this.flipTween = this.scene.tweens.add({
      targets: this.flipper,
      scaleX: 0,
      duration: FLIP_MS / 2,
      ease: 'Quad.easeIn',
      onComplete: () => {
        // The board is rebuilt between rounds; a card destroyed mid-flip has no Scene left.
        if (!this.scene) return;
        this.front.setVisible(up);
        this.back.setVisible(!up);
        this.flipTween = this.scene.tweens.add({
          targets: this.flipper,
          scaleX: 1,
          duration: FLIP_MS / 2,
          ease: 'Quad.easeOut',
        });
      },
    });
  }

  /** The pick order badge, and the small lift that goes with being picked. */
  setOrdinal(ordinal: number | null): void {
    const picked = ordinal !== null;
    this.ordinalBadge.setVisible(picked);
    if (picked) this.ordinalText.setText(`${ordinal}`);
    // Only the transition is worth animating — re-syncing the board is not.
    if (picked === this.picked) return;
    this.picked = picked;
    this.scene.tweens.add({
      targets: this.lifter,
      y: picked ? -10 : 0,
      scale: picked ? 0.94 : 1,
      duration: 160,
      ease: 'Quad.easeOut',
    });
  }

  setMark(mark: CardMark): void {
    if (mark === this.mark) return;
    this.mark = mark;
    this.paintFront();
  }

  override destroy(fromScene?: boolean): void {
    // Tweens outlive their targets otherwise, and fire callbacks into a dead Scene.
    this.flipTween?.stop();
    this.moveTween?.stop();
    this.scene?.tweens.killTweensOf([this, this.lifter, this.flipper]);
    super.destroy(fromScene);
  }

  /** Highlights the face-down card the player picked, matching the front border. */
  setBackHighlight(on: boolean): void {
    const plate = this.back.list[0] as Phaser.GameObjects.Graphics;
    paintSurface(plate, this.opts.width, this.opts.height, {
      fill: colors.cardBack,
      stroke: on ? colors.accent : colors.cardBackEdge,
      strokeWidth: 3,
      radius: radius.md,
    });
  }
}
