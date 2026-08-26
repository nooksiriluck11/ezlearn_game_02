import Phaser from 'phaser';
import { colors, FAMILY, hex, radius, shadow, weights } from '../theme';
import type { Weight } from '../theme';
import { DPR } from './viewport';

export type TextOpts = {
  color?: string;
  weight?: Weight;
  align?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineSpacing?: number;
  wrapWidth?: number;
};

/**
 * Every label in the game goes through here. Phaser builds the canvas font from
 * `fontStyle + fontSize + fontFamily`, so the CSS weight rides in as fontStyle.
 */
export function label(
  scene: Phaser.Scene,
  text: string,
  size: number,
  opts: TextOpts = {},
): Phaser.GameObjects.Text {
  const node = scene.add.text(0, 0, text, {
    fontFamily: FAMILY,
    fontSize: `${size}px`,
    fontStyle: opts.weight ?? weights.regular,
    color: opts.color ?? colors.text,
    align: opts.align ?? 'center',
    letterSpacing: opts.letterSpacing ?? 0,
    // Prompt's Thai glyphs stack tall; a little air keeps two-line text legible.
    lineSpacing: opts.lineSpacing ?? Math.round(size * 0.35),
    // Phaser derives a line's height from this probe string, not from the text
    // itself — without the Thai marks the tall ones get sliced off the top.
    testString: '|MÉqgyก์ปั๊ญฐ',
    // Advanced wrap throws outright if a single glyph is wider than the box.
    ...(opts.wrapWidth
      ? { wordWrap: { width: Math.max(size * 1.6, opts.wrapWidth), useAdvancedWrap: true } }
      : {}),
  });
  node.setOrigin(opts.align === 'left' ? 0 : opts.align === 'right' ? 1 : 0.5, 0.5);
  // The camera zooms by DPR, so the glyph canvas has to be drawn at DPR too.
  node.setResolution(DPR);
  return node;
}

export type SurfaceStyle = {
  fill?: string | null;
  stroke?: string | null;
  strokeWidth?: number;
  radius?: number;
  alpha?: number;
  /** Paints a soft dark plate underneath, standing in for the native drop shadow. */
  raised?: boolean;
};

/** A rounded rectangle centred on its own origin, so parents can scale it cleanly. */
export function surface(
  scene: Phaser.Scene,
  width: number,
  height: number,
  style: SurfaceStyle = {},
): Phaser.GameObjects.Graphics {
  const gfx = scene.add.graphics();
  paintSurface(gfx, width, height, style);
  return gfx;
}

export function paintSurface(
  gfx: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  style: SurfaceStyle = {},
): void {
  const r = Math.min(style.radius ?? radius.md, width / 2, height / 2);
  const x = -width / 2;
  const y = -height / 2;
  gfx.clear();

  if (style.raised) {
    gfx.fillStyle(0x000000, shadow.alpha);
    gfx.fillRoundedRect(
      x - shadow.spread / 2,
      y + shadow.offsetY,
      width + shadow.spread,
      height,
      r,
    );
  }
  if (style.fill) {
    gfx.fillStyle(hex(style.fill), style.alpha ?? 1);
    gfx.fillRoundedRect(x, y, width, height, r);
  }
  if (style.stroke) {
    const w = style.strokeWidth ?? 1;
    gfx.lineStyle(w, hex(style.stroke), 1);
    // Inset by half the stroke so the outline sits inside the given box.
    gfx.strokeRoundedRect(x + w / 2, y + w / 2, width - w, height - w, Math.max(0, r - w / 2));
  }
}

/**
 * A rounded bar whose left edge sits on the graphics origin, so scaling its X
 * grows it rightwards instead of from the middle.
 */
export function paintBar(
  gfx: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  fill: string,
): void {
  gfx.clear();
  gfx.fillStyle(hex(fill), 1);
  gfx.fillRoundedRect(0, -height / 2, width, height, height / 2);
}

export type ButtonStyle = SurfaceStyle & {
  textColor?: string;
  fontSize?: number;
  weight?: Weight;
};

/**
 * A tappable pill. Sizes itself to its label unless given a width, dims when
 * disabled, and dips slightly while held so a tap feels answered.
 */
export class Button extends Phaser.GameObjects.Container {
  private readonly plate: Phaser.GameObjects.Graphics;
  private readonly caption: Phaser.GameObjects.Text;
  private style: ButtonStyle;
  private enabled = true;

  constructor(
    scene: Phaser.Scene,
    text: string,
    style: ButtonStyle & { width?: number; height?: number; padX?: number; padY?: number },
    private readonly onTap: () => void,
  ) {
    super(scene, 0, 0);
    this.style = style;
    this.plate = scene.add.graphics();
    this.caption = label(scene, text, style.fontSize ?? 16, {
      color: style.textColor ?? colors.accentText,
      weight: style.weight ?? weights.black,
    });
    this.add([this.plate, this.caption]);

    const width = style.width ?? Math.ceil(this.caption.width) + (style.padX ?? 36) * 2;
    const height = style.height ?? Math.ceil(this.caption.height) + (style.padY ?? 12) * 2;
    this.resize(width, height);

    this.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.enabled) this.setScale(0.96);
      })
      .on('pointerout', () => this.setScale(1))
      .on('pointerupoutside', () => this.setScale(1))
      .on('pointerup', () => {
        this.setScale(1);
        if (this.enabled) this.onTap();
      });

    scene.add.existing(this);
  }

  resize(width: number, height: number): this {
    paintSurface(this.plate, width, height, { radius: radius.pill, ...this.style });
    this.setSize(width, height);
    if (this.input) this.input.hitArea.setTo(0, 0, width, height);
    return this;
  }

  setLabel(text: string): this {
    this.caption.setText(text);
    return this;
  }

  setStyleTo(style: ButtonStyle): this {
    this.style = { ...this.style, ...style };
    if (style.textColor) this.caption.setColor(style.textColor);
    paintSurface(this.plate, this.width, this.height, { radius: radius.pill, ...this.style });
    return this;
  }

  setEnabled(on: boolean): this {
    this.enabled = on;
    this.setAlpha(on ? 1 : 0.4);
    return this;
  }
}

/** Makes any container tappable without the visual chrome a Button carries. */
export function tappable(
  target: Phaser.GameObjects.Container,
  width: number,
  height: number,
  onTap: () => void,
): void {
  target.setSize(width, height);
  target
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => target.setScale(0.94))
    .on('pointerout', () => target.setScale(1))
    .on('pointerupoutside', () => target.setScale(1))
    .on('pointerup', () => {
      target.setScale(1);
      onTap();
    });
}

const GLOW_KEY = 'ui-glow';

/** One shared radial-gradient sprite — a shape with a hard edge is not a glow. */
function ensureGlowTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(GLOW_KEY)) return;
  const size = 256;
  const texture = scene.textures.createCanvas(GLOW_KEY, size, size);
  if (!texture) return;
  const ctx = texture.context;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.62)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  texture.refresh();
}

/**
 * The violet wash both screens sit under: a wide, squat bloom bleeding off both
 * edges, the way the native layout let its glow overflow the screen.
 */
export function glow(
  scene: Phaser.Scene,
  width: number,
  top: number,
  height: number,
): Phaser.GameObjects.Image {
  ensureGlowTexture(scene);
  const image = scene.add.image(width / 2, top + height / 2, GLOW_KEY);
  image.setDisplaySize(width + 320, height * 1.7);
  image.setTint(hex(colors.bgGlow));
  image.setAlpha(0.85);
  return image;
}

/** Full-screen dimmer that swallows taps aimed at whatever it covers. */
export function scrim(
  scene: Phaser.Scene,
  width: number,
  height: number,
  alpha: number,
  onTap?: () => void,
): Phaser.GameObjects.Rectangle {
  const rect = scene.add.rectangle(width / 2, height / 2, width, height, hex(colors.bg), alpha);
  rect.setInteractive({ useHandCursor: false });
  if (onTap) rect.on('pointerup', onTap);
  return rect;
}

/**
 * Destroys a subtree and kills every tween pointed at it. Phaser keeps running a
 * tween whose target is gone — including the repeating ones — so a screen that
 * rebuilds itself would otherwise leak a new pulse every rebuild.
 */
export function dispose(
  scene: Phaser.Scene,
  node: Phaser.GameObjects.Container | Phaser.GameObjects.GameObject | null | undefined,
): void {
  if (!node) return;
  const targets: Phaser.GameObjects.GameObject[] = [];
  const walk = (obj: Phaser.GameObjects.GameObject) => {
    targets.push(obj);
    const children = (obj as Phaser.GameObjects.Container).list;
    if (Array.isArray(children)) children.forEach(walk);
  };
  walk(node);
  scene.tweens.killTweensOf(targets);
  node.destroy();
}
