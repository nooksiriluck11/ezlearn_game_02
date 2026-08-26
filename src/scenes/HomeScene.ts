import Phaser from 'phaser';
import { app } from '../appState';
import { play } from '../audio/sfx';
import {
  BOOST_MS,
  CORRECT_PER_HINT,
  START_HINTS,
  START_UNSHUFFLES,
  STREAK_PER_BOOST,
  STREAK_PER_UNSHUFFLE,
} from '../game/engine';
import { HEART_CHOICES, MEMORIZE_CHOICES } from '../storage/settings';
import { colors, font, radius, spacing, weights } from '../theme';
import { Button, dispose, glow, label, surface, tappable } from '../ui/kit';
import { bonusRow, choiceRow, groupLabel, noteRow, Popup, toggleRow } from '../ui/panels';
import { BaseScene } from '../ui/viewport';

const RULES = [
  'Memorize where each word sits',
  'Cards flip, then shuffle — follow them',
  'Rebuild the phrase before time runs out',
  'Some rounds just ask which card means what',
];

// Wording is built from the real rules, so tweaking rewards.ts updates this panel too.
const BONUSES = [
  {
    tint: colors.hint,
    name: 'Hint',
    does: 'เปิดการ์ดใบที่ต้องใช้ถัดไป รอบพิเศษจะเปิดใบที่ถาม',
    how: `เริ่มมี ${START_HINTS} · ตอบถูกครบทุก ${CORRECT_PER_HINT} ข้อ`,
  },
  {
    tint: colors.mint,
    name: `+${BOOST_MS / 1000}s`,
    does: `ต่อเวลาตอบอีก ${BOOST_MS / 1000} วินาที กดตอนไหนก็ได้ระหว่างตอบ`,
    how: `ตอบถูกติดกัน ${STREAK_PER_BOOST} ข้อ`,
  },
  {
    tint: colors.warn,
    name: 'Unshuffle',
    does: 'ดึงการ์ดกลับไปเรียงตามตอนแจก ล้างการสลับของรอบนั้นทิ้ง',
    how: `เริ่มมี ${START_UNSHUFFLES} · ตอบถูกติดกัน ${STREAK_PER_UNSHUFFLE} ข้อ`,
  },
];

export class HomeScene extends BaseScene {
  private root!: Phaser.GameObjects.Container;
  private popup: Popup | null = null;

  constructor() {
    super('home');
  }

  create(): void {
    this.mountViewport();
    this.relayout();
  }

  protected relayout(): void {
    dispose(this, this.popup);
    this.popup = null;
    dispose(this, this.root);
    this.root = this.add.container(0, 0);

    const width = this.stageWidth - spacing.lg * 2;
    const centreX = this.vw / 2;

    this.root.add(glow(this, this.vw, -120, 400));
    this.buildTopBar();

    const blocks: { node: Phaser.GameObjects.Container; height: number; gap: number }[] = [];
    blocks.push({ ...this.buildHero(width), gap: spacing.md });
    blocks.push({ ...this.buildStats(width), gap: spacing.md });
    if (app.lastRun) {
      blocks.push({ ...this.buildLastRun(width), gap: spacing.md });
    }
    blocks.push({ ...this.buildRules(width), gap: spacing.lg });
    blocks.push({ ...this.buildStartButton(), gap: spacing.md });
    blocks.push({ ...this.buildFootNote(), gap: 0 });

    const total = blocks.reduce((sum, block, i) => {
      return sum + block.height + (i < blocks.length - 1 ? block.gap : 0);
    }, 0);

    const stack = this.add.container(centreX, 0);
    let y = -total / 2;
    blocks.forEach((block) => {
      block.node.setY(y + block.height / 2);
      stack.add(block.node);
      y += block.height + block.gap;
    });

    // Tall screens centre the block; short ones shrink it instead of scrolling.
    stack.setScale(Math.min(1, (this.vh - 100) / total));
    stack.setY(this.vh / 2);
    this.root.add(stack);
  }

  private buildTopBar(): void {
    const y = spacing.md + 19;
    const gear = this.add.container(this.vw - spacing.md - 19, y);
    const gearPlate = surface(this, 38, 38, {
      fill: colors.bgSoft,
      stroke: colors.surfaceHi,
      strokeWidth: 1,
      radius: radius.pill,
    });
    const gearMark = label(this, '⚙', font.body + 2, { color: colors.textDim });
    gear.add([gearPlate, gearMark]);
    tappable(gear, 42, 42, () => {
      play('tap');
      this.openSettings();
    });

    const bonus = new Button(
      this,
      'Bonus items',
      {
        height: 38,
        padX: spacing.md,
        fill: colors.bgSoft,
        stroke: colors.surfaceHi,
        strokeWidth: 1,
        radius: radius.pill,
        textColor: colors.mint,
        fontSize: font.small,
      },
      () => {
        play('tap');
        this.openBonus();
      },
    );
    bonus.setPosition(this.vw - spacing.md - 38 - spacing.sm - bonus.width / 2, y);

    this.root.add([bonus, gear]);
  }

  private buildHero(width: number): { node: Phaser.GameObjects.Container; height: number } {
    const node = this.add.container(0, 0);
    const kicker = label(this, 'kukkukkoo', font.small, {
      color: colors.mint,
      weight: weights.black,
      letterSpacing: 3,
    });
    const title = label(this, 'กุกกุกกู๊', font.title, {
      color: colors.accent,
      weight: weights.black,
    });
    const subtitle = label(this, 'Memory & focus, one phrase at a time', font.body, {
      color: colors.textDim,
      wrapWidth: width,
    });

    let y = 0;
    for (const [child, gap] of [
      [kicker, spacing.xs],
      [title, spacing.xs],
      [subtitle, 0],
    ] as const) {
      child.setY(y + child.height / 2);
      y += child.height + gap;
    }
    [kicker, title, subtitle].forEach((child) => (child.y -= y / 2));
    node.add([kicker, title, subtitle]);
    return { node, height: y };
  }

  private buildStats(width: number): { node: Phaser.GameObjects.Container; height: number } {
    const node = this.add.container(0, 0);
    const height = 96;
    const boxWidth = (width - spacing.sm) / 2;

    const box = (x: number, title: string, value: string, unit: string | null) => {
      const holder = this.add.container(x, 0);
      holder.add(
        surface(this, boxWidth, height, {
          fill: colors.bgSoft,
          stroke: colors.surfaceHi,
          strokeWidth: 1,
          radius: radius.md,
        }),
      );
      const caption = label(this, title, font.tiny, {
        color: colors.textDim,
        weight: weights.black,
        letterSpacing: 1.2,
      });
      caption.setY(-height / 2 + spacing.md + 6);
      const amount = label(this, value, font.score, {
        color: colors.accent,
        weight: weights.black,
      });
      amount.setY(unit ? -2 : 6);
      holder.add([caption, amount]);
      if (unit) {
        const suffix = label(this, unit, font.tiny, { color: colors.textDim });
        suffix.setY(height / 2 - spacing.md - 6);
        holder.add(suffix);
      }
      return holder;
    };

    node.add(box(-(boxWidth + spacing.sm) / 2, 'BEST SCORE', app.progress.bestScore.toLocaleString(), null));
    node.add(box((boxWidth + spacing.sm) / 2, 'BEST STREAK', `${app.progress.bestRounds}`, 'rounds'));
    return { node, height };
  }

  private buildLastRun(width: number): { node: Phaser.GameObjects.Container; height: number } {
    const node = this.add.container(0, 0);
    const run = app.lastRun!;
    const text = label(
      this,
      `Last run · ${run.score.toLocaleString()} points · ${run.rounds} rounds`,
      font.small,
      { color: colors.textDim, wrapWidth: width },
    );
    node.add(text);
    return { node, height: text.height };
  }

  private buildRules(width: number): { node: Phaser.GameObjects.Container; height: number } {
    const node = this.add.container(0, 0);
    const left = -width / 2;
    let y = 0;
    const children: Phaser.GameObjects.Text[] = [];

    RULES.forEach((rule, index) => {
      const step = label(this, `${index + 1}`, font.tiny, {
        color: colors.accent,
        weight: weights.black,
      });
      step.setAlpha(0.8);
      const text = label(this, rule, font.small, {
        color: colors.textDim,
        align: 'left',
        wrapWidth: width - 28,
        lineSpacing: 3,
      });
      const rowHeight = Math.max(20, text.height);
      step.setPosition(left + 10, y + rowHeight / 2);
      text.setPosition(left + 28, y + rowHeight / 2);
      children.push(step, text);
      y += rowHeight + spacing.sm;
    });
    y -= spacing.sm;

    children.forEach((child) => (child.y -= y / 2));
    node.add(children);
    return { node, height: y };
  }

  private buildStartButton(): { node: Phaser.GameObjects.Container; height: number } {
    const node = this.add.container(0, 0);
    const button = new Button(
      this,
      app.lastRun ? 'Play again' : 'Start',
      {
        fill: colors.accent,
        radius: radius.pill,
        padX: spacing.xl + spacing.lg,
        padY: spacing.md,
        fontSize: font.heading - 4,
        raised: true,
      },
      () => {
        play('tap');
        this.scene.start('game');
      },
    );
    node.add(button);
    return { node, height: button.height };
  }

  private buildFootNote(): { node: Phaser.GameObjects.Container; height: number } {
    const node = this.add.container(0, 0);
    const text = label(this, `${app.progress.totalRuns} runs played`, font.tiny, {
      color: colors.textDim,
    });
    node.add(text);
    return { node, height: text.height };
  }

  private closePopup = (): void => {
    dispose(this, this.popup);
    this.popup = null;
  };

  private openSettings(): void {
    this.popup = new Popup(this, this.vw, this.vh, {
      title: '⚙ Settings',
      onClose: this.closePopup,
      rows: (width) => [
        groupLabel(this, width, 'CARDS'),
        toggleRow(this, width, {
          icon: '🇹🇭',
          label: 'Thai on cards',
          hint: 'แสดงคำแปลไทยใต้คำศัพท์บนการ์ด',
          value: app.settings.showThai,
          onChange: (next) => app.updateSettings({ showThai: next }),
        }),
        toggleRow(this, width, {
          icon: '🔤',
          label: 'Part of speech',
          hint: 'บอกชนิดของคำ NOUN VERB ADJ เหนือคำบนการ์ด',
          value: app.settings.showPos,
          onChange: (next) => app.updateSettings({ showPos: next }),
        }),
        toggleRow(this, width, {
          icon: '🔢',
          label: 'Card numbers',
          hint: 'ปิดแล้วการ์ดจะไม่มีเลข ต้องจ้องตามการ์ดตอนสลับเอง',
          value: app.settings.showNumbers,
          onChange: (next) => app.updateSettings({ showNumbers: next }),
        }),
        groupLabel(this, width, 'DIFFICULTY'),
        choiceRow(this, width, {
          icon: '⏱',
          label: 'Memorize time',
          hint: 'เวลานับถอยหลังตอนจำการ์ด ยิ่งน้อยยิ่งท้าทาย',
          options: MEMORIZE_CHOICES,
          value: app.settings.memorizeSeconds,
          format: (option) => `${option}s`,
          onChange: (next) => app.updateSettings({ memorizeSeconds: next }),
        }),
        choiceRow(this, width, {
          icon: '♥',
          label: 'Hearts',
          hint: 'ยิ่งหัวใจน้อยยิ่งได้คะแนนเยอะ · 3 ดวง ×1 · 4 ดวง ×0.85 · 5 ดวง ×0.7',
          options: HEART_CHOICES,
          value: app.settings.hearts,
          format: (option) => `${option}`,
          onChange: (next) => app.updateSettings({ hearts: next }),
        }),
        groupLabel(this, width, 'SOUND'),
        toggleRow(this, width, {
          icon: '🔊',
          label: 'Sound effects',
          hint: 'เสียงนับถอยหลัง สลับการ์ด และเฉลย',
          value: app.settings.sound,
          onChange: (next) => app.updateSettings({ sound: next }),
        }),
      ],
    });
  }

  private openBonus(): void {
    this.popup = new Popup(this, this.vw, this.vh, {
      title: 'Bonus items',
      closeLabel: 'Got it',
      onClose: this.closePopup,
      rows: (width) => [
        ...BONUSES.map((bonus) => bonusRow(this, width, bonus)),
        noteRow(this, width, 'ตอบผิดหรือกด Skip เมื่อไหร่ streak ขาด ต้องนับหนึ่งใหม่'),
      ],
    });
  }
}
