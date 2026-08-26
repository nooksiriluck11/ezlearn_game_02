import Phaser from 'phaser';
import { app } from '../appState';
import { buzz, play } from '../audio/sfx';
import { POS_LABEL } from '../data/phrases';
import type { Phase, RoundResult, Scheduler } from '../game/engine';
import { GameEngine, scoreMultiplier } from '../game/engine';
import {
  boardHeight,
  boardWidthForHeight,
  cardFontSizes,
  cardSize,
  slotPositions,
} from '../game/layout';
import { colors, font, radius, spacing, weights } from '../theme';
import { CardView } from '../ui/CardView';
import type { TimerParts } from '../ui/footer';
import { actionBar, answerRow, answerTimer, updateAnswerTimer } from '../ui/footer';
import { Button, dispose, glow, label, surface, tappable } from '../ui/kit';
import { quitCard, resultCard } from '../ui/overlays';
import { BaseScene } from '../ui/viewport';

const HEADER_HEIGHT = 34;
const BANNER_HEIGHT = 40;
const COUNTDOWN_HEIGHT = 112;
const MIN_COUNTDOWN_HEIGHT = 44;
/**
 * Reserved bottom strip. Sized for the tallest footer — timer, a two-row action
 * bar, the answer row and Submit — so the board keeps the same centre all round
 * instead of drifting up when the answering controls appear.
 */
const FOOTER_HEIGHT = 278;
const MIN_BOARD_HEIGHT = 120;
/** U+FE0E asks for the monochrome glyph — without it the lost hearts stay red emoji. */
const HEART = '♥\uFE0E';

function bannerFor(phase: Phase, swapCount: number, asking: string | null): string {
  switch (phase) {
    case 'memorize':
      return 'Memorize the order';
    case 'hiding':
      return 'Cards down…';
    case 'shuffling':
      return 'Follow the cards!';
    case 'answering':
      // The question only appears once the cards are down — otherwise it gives itself away.
      return asking ? `Which card means “${asking}”?` : 'Tap the cards in order';
    default:
      return swapCount > 0 ? `${swapCount} swap${swapCount > 1 ? 's' : ''} this round` : 'No swaps';
  }
}

export class GameScene extends BaseScene {
  private engine!: GameEngine;
  private timers: Phaser.Time.TimerEvent[] = [];

  private chrome!: Phaser.GameObjects.Container;
  private boardHolder!: Phaser.GameObjects.Container;
  private board!: Phaser.GameObjects.Container;
  private footer!: Phaser.GameObjects.Container;
  private overlay: Phaser.GameObjects.Container | null = null;

  private heartsRow!: Phaser.GameObjects.Container;
  private heartsText!: Phaser.GameObjects.Text;
  private heartsLost!: Phaser.GameObjects.Text;
  private heartsScale = 1;
  private scoreValue!: Phaser.GameObjects.Text;
  private scoreBadge!: Phaser.GameObjects.Container;
  private streakPill!: Phaser.GameObjects.Container;
  private streakText!: Phaser.GameObjects.Text;
  private bannerText!: Phaser.GameObjects.Text;
  private bannerMeta!: Phaser.GameObjects.Text;
  private countdownText!: Phaser.GameObjects.Text;

  private cards = new Map<string, CardView>();
  private timer: TimerParts | null = null;
  private boardWidth = 0;
  private lastScore = 0;
  private lastHeartCount = 0;

  constructor() {
    super('game');
  }

  create(): void {
    this.mountViewport();

    const clock: Scheduler = {
      after: (ms, fn) => {
        this.timers.push(this.time.delayedCall(ms, fn));
      },
      clear: () => {
        this.timers.forEach((timer) => this.time.removeEvent(timer));
        this.timers = [];
      },
      now: () => this.time.now,
    };

    this.engine = new GameEngine(
      { memorizeSeconds: app.settings.memorizeSeconds, startHearts: app.settings.hearts },
      clock,
    );

    this.buildChrome();
    this.wireEngine();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.engine.destroy());
    this.engine.startRun();
  }

  override update(time: number): void {
    this.engine.update(time);
  }

  // ---------------------------------------------------------------- wiring

  private wireEngine(): void {
    const engine = this.engine;

    engine.on('round', () => {
      this.buildBoard();
      this.renderFooter();
    });

    engine.on('phase', (phase: Phase) => {
      this.renderBanner();
      this.syncBoard(false);
      this.renderFooter();
      if (phase === 'memorize') this.renderCountdown();
      if (phase === 'hiding') play('flip');
      if (phase === 'answering') play('go');
      if (phase === 'gameover') play('gameover');
    });

    engine.on('countdown', () => {
      this.renderCountdown();
      if (engine.countdown > 0) play('tick');
    });

    engine.on('slots', () => {
      this.syncBoard(true);
      if (engine.phase === 'shuffling') play('swap');
    });

    engine.on('answer', () => {
      this.syncOrdinals();
      this.renderFooter();
    });

    engine.on('revealed', () => this.syncBoard(false));

    engine.on('hud', () => {
      this.renderHud();
      this.renderFooter();
    });

    engine.on('clock', () => {
      if (this.timer) updateAnswerTimer(this, this.timer, engine);
    });

    engine.on('result', (result: RoundResult) => {
      this.syncBoard(false);
      this.renderBanner();
      this.showResult(result);
      play(result.passed ? 'correct' : result.skipped ? 'flip' : 'wrong');
      buzz(result.passed ? 18 : [12, 60, 12]);
      if (result.hintEarned || result.boostEarned || result.unshuffleEarned) {
        this.time.delayedCall(520, () => play('reward'));
      }
    });

    engine.on('gameover', (rounds: number, score: number) => {
      app.recordRun(rounds, score);
      this.scene.start('home');
    });
  }

  // ---------------------------------------------------------------- chrome

  private buildChrome(): void {
    // Everything below is rebuilt from scratch, so drop the previous set whole —
    // leaving one behind would leave a ghost footer painted over the result card.
    dispose(this, this.chrome);
    dispose(this, this.boardHolder);
    dispose(this, this.footer);
    this.timer = null;
    this.cards.clear();
    this.chrome = this.add.container(0, 0);
    this.chrome.add(glow(this, this.vw, -160, 360));

    const left = this.stageX + spacing.md;
    const right = this.stageX + this.stageWidth - spacing.md;
    const headerY = spacing.xs + HEADER_HEIGHT / 2;

    const quit = this.add.container(left + 17, headerY);
    quit.add(
      surface(this, HEADER_HEIGHT, HEADER_HEIGHT, {
        fill: colors.bgSoft,
        stroke: colors.surfaceHi,
        strokeWidth: 1,
        radius: radius.pill,
      }),
    );
    quit.add(label(this, '✕', font.body, { color: colors.textDim, weight: weights.black }));
    tappable(quit, 38, 38, () => {
      play('tap');
      this.engine.holdClock();
      this.showQuitPrompt();
    });

    this.heartsRow = this.add.container(left + 42, headerY);
    this.heartsText = label(this, '', font.heading, {
      color: colors.bad,
      align: 'left',
      letterSpacing: 2,
    });
    this.heartsLost = label(this, '', font.heading, {
      color: colors.surface,
      align: 'left',
      letterSpacing: 2,
    });
    this.heartsRow.add([this.heartsText, this.heartsLost]);

    this.scoreBadge = this.add.container(0, headerY);
    const badgeWidth = 118;
    this.scoreBadge.add(
      surface(this, badgeWidth, 44, {
        fill: colors.surface,
        stroke: colors.surfaceHi,
        strokeWidth: 1,
        radius: radius.pill,
        raised: true,
      }),
    );
    const star = label(this, '★', font.heading, { color: colors.accent });
    star.setPosition(-badgeWidth / 2 + 20, 0);
    const scoreLabel = label(this, 'SCORE', font.tiny, {
      color: colors.textDim,
      weight: weights.black,
      align: 'left',
      letterSpacing: 1.2,
    });
    scoreLabel.setPosition(-badgeWidth / 2 + 38, -9);
    this.scoreValue = label(this, '0', font.score - 6, {
      color: colors.text,
      weight: weights.black,
      align: 'left',
    });
    this.scoreValue.setPosition(-badgeWidth / 2 + 38, 8);
    this.scoreBadge.add([star, scoreLabel, this.scoreValue]);
    this.scoreBadge.setPosition(right - badgeWidth / 2, headerY);

    this.streakPill = this.add.container(0, headerY);
    this.streakPill.add(
      surface(this, 54, 26, { fill: colors.surface, radius: radius.pill }),
    );
    this.streakText = label(this, '🔥 0', font.small, {
      color: colors.warn,
      weight: weights.black,
    });
    this.streakPill.add(this.streakText);
    this.streakPill.setPosition(right - badgeWidth - spacing.sm - 27, headerY);
    this.streakPill.setVisible(false);

    const bannerTop = spacing.xs + HEADER_HEIGHT + spacing.sm;
    const centreX = this.vw / 2;
    this.bannerText = label(this, '', font.body, {
      color: colors.text,
      weight: weights.black,
      wrapWidth: this.stageWidth - spacing.lg,
    });
    this.bannerText.setPosition(centreX, bannerTop + 11);
    this.bannerMeta = label(this, '', font.tiny, {
      color: colors.textDim,
      weight: weights.bold,
      letterSpacing: 0.8,
    });
    this.bannerMeta.setPosition(centreX, bannerTop + 30);

    const countdownTop = bannerTop + BANNER_HEIGHT;
    this.countdownText = label(this, '', this.countdownFontSize(), {
      color: colors.accent,
      weight: weights.black,
    });
    this.countdownText.setPosition(centreX, countdownTop + this.countdownHeight() / 2);

    this.chrome.add([
      quit,
      this.heartsRow,
      this.streakPill,
      this.scoreBadge,
      this.bannerText,
      this.bannerMeta,
      this.countdownText,
    ]);

    this.boardHolder = this.add.container(centreX, this.boardCentreY());
    this.footer = this.add.container(0, 0);

    this.renderHud();
  }

  /**
   * On a short window the footer shrinks to a share of the height and its
   * contents scale with it, so the board is not starved down to nothing.
   */
  private footerHeight(): number {
    return Math.min(FOOTER_HEIGHT, this.vh * 0.42);
  }

  /** The countdown block gives up its space first when the window is short. */
  private countdownHeight(): number {
    const fixed = spacing.xs + HEADER_HEIGHT + spacing.sm + BANNER_HEIGHT;
    const spare = this.vh - fixed - this.footerHeight() - MIN_BOARD_HEIGHT;
    return Math.max(MIN_COUNTDOWN_HEIGHT, Math.min(COUNTDOWN_HEIGHT, spare));
  }

  private countdownFontSize(): number {
    return Math.round(Math.min(font.countdown, this.countdownHeight() * 0.86));
  }

  private boardTop(): number {
    return spacing.xs + HEADER_HEIGHT + spacing.sm + BANNER_HEIGHT + this.countdownHeight();
  }

  private boardAreaHeight(): number {
    return Math.max(MIN_BOARD_HEIGHT, this.vh - this.footerHeight() - this.boardTop());
  }

  private boardCentreY(): number {
    return this.boardTop() + this.boardAreaHeight() / 2;
  }

  // ---------------------------------------------------------------- board

  private buildBoard(): void {
    dispose(this, this.board);
    this.cards.clear();
    this.board = this.add.container(0, 0);
    this.boardHolder.add(this.board);

    const count = this.engine.cards.length;
    if (count === 0) return;

    const room = this.boardAreaHeight();
    this.boardWidth = Math.max(
      120,
      Math.min(this.stageWidth - spacing.md * 2, 420, boardWidthForHeight(count, room)),
    );

    const { width, height } = cardSize(this.boardWidth);
    const longestWord = Math.max(...this.engine.cards.map((card) => card.word.length));
    const longestGloss = app.settings.showThai
      ? Math.max(...this.engine.cards.map((card) => card.th.length))
      : 0;
    const sizes = cardFontSizes(width, longestWord, longestGloss);

    const positions = slotPositions(count, this.boardWidth);
    const originX = -this.boardWidth / 2;
    const originY = -boardHeight(count, this.boardWidth) / 2;

    this.engine.cards.forEach((card) => {
      const view = new CardView(this, {
        word: card.word,
        gloss: app.settings.showThai ? card.th : null,
        pos: app.settings.showPos ? POS_LABEL[card.pos] : null,
        number: app.settings.showNumbers ? card.number : null,
        sizes,
        width,
        height,
        faceUp: this.engine.faceUp,
      });
      view.onTap(() => {
        if (this.engine.phase !== 'answering') return;
        play('tap');
        this.engine.toggleCard(card.id);
      });
      const slot = this.engine.slots.indexOf(card.id);
      view.slideTo(
        originX + positions[slot].x + width / 2,
        originY + positions[slot].y + height / 2,
        false,
      );
      this.board.add(view);
      this.cards.set(card.id, view);
    });

    this.boardHolder.setScale(1);
    this.boardHolder.setPosition(this.vw / 2, this.boardCentreY());
  }

  /** Pushes the engine's slot order, face state and marks into the views. */
  private syncBoard(animate: boolean): void {
    if (!this.board || this.cards.size === 0) return;
    const count = this.engine.cards.length;
    const { width, height } = cardSize(this.boardWidth);
    const positions = slotPositions(count, this.boardWidth);
    const originX = -this.boardWidth / 2;
    const originY = -boardHeight(count, this.boardWidth) / 2;
    const flags = this.engine.result?.correctFlags ?? null;

    this.engine.cards.forEach((card) => {
      const view = this.cards.get(card.id);
      if (!view) return;
      const slot = this.engine.slots.indexOf(card.id);
      if (slot !== -1) {
        view.slideTo(
          originX + positions[slot].x + width / 2,
          originY + positions[slot].y + height / 2,
          animate,
        );
      }
      const hinted = this.engine.revealed.includes(card.id);
      view.setFaceUp(this.engine.faceUp || hinted, true);

      const answerIndex = this.engine.answer.indexOf(card.id);
      if (flags && answerIndex !== -1) {
        view.setMark(flags[answerIndex] ? 'correct' : 'wrong');
      } else {
        view.setMark(hinted && !this.engine.faceUp ? 'hint' : 'none');
      }
    });
    this.syncOrdinals();
  }

  private syncOrdinals(): void {
    this.engine.cards.forEach((card) => {
      const view = this.cards.get(card.id);
      if (!view) return;
      const index = this.engine.answer.indexOf(card.id);
      view.setOrdinal(index === -1 ? null : index + 1);
      view.setBackHighlight(index !== -1);
    });
  }

  // ---------------------------------------------------------------- hud

  private renderHud(): void {
    const engine = this.engine;
    this.streakPill.setVisible(engine.streak >= 2);
    this.streakText.setText(`🔥 ${engine.streak}`);
    this.heartsText.setText(HEART.repeat(Math.max(0, engine.hearts)));
    this.heartsLost.setText(HEART.repeat(Math.max(0, app.settings.hearts - engine.hearts)));
    this.heartsLost.setPosition(this.heartsText.width, 0);

    // Five hearts are wide enough to reach the streak pill — shrink, never overlap.
    const rightEdge =
      (this.streakPill.visible ? this.streakPill.x - 27 : this.scoreBadge.x - 59) - spacing.sm;
    const rowWidth = this.heartsText.width + this.heartsLost.width;
    this.heartsScale = Math.min(1, (rightEdge - this.heartsRow.x) / Math.max(1, rowWidth));
    this.heartsRow.setScale(this.heartsScale);

    if (engine.hearts < this.lastHeartCount) {
      this.tweens.add({
        targets: this.heartsRow,
        scale: { from: this.heartsScale * 1.3, to: this.heartsScale },
        duration: 320,
        ease: 'Back.easeOut',
      });
    }
    this.lastHeartCount = engine.hearts;

    this.scoreValue.setText(engine.score.toLocaleString());
    if (engine.score !== this.lastScore) {
      this.lastScore = engine.score;
      this.tweens.add({
        targets: this.scoreBadge,
        scale: { from: 1.18, to: 1 },
        duration: 350,
        ease: 'Back.easeOut',
      });
    }
  }

  private renderBanner(): void {
    const engine = this.engine;
    const asking = engine.kind === 'meaning' ? engine.target : null;
    const showAsk = engine.phase === 'answering' && asking;
    this.bannerText.setText(
      bannerFor(engine.phase, engine.config.swapCount, showAsk ? asking.th : null),
    );
    const multiplier = scoreMultiplier(app.settings.hearts);
    this.bannerMeta.setText(
      `${engine.config.wordCount} WORDS` +
        (engine.config.swapCount > 0 ? ` · ${engine.config.swapCount} SWAPS` : '') +
        (multiplier !== 1 ? ` · ×${multiplier.toFixed(2).replace(/0$/, '')} POINTS` : ''),
    );
  }

  private renderCountdown(): void {
    const value = this.engine.phase === 'memorize' ? this.engine.countdown : 0;
    this.countdownText.setText(value > 0 ? `${value}` : '');
    if (value <= 0) return;
    this.tweens.add({
      targets: this.countdownText,
      scale: { from: 1.35, to: 1 },
      duration: 380,
      ease: 'Back.easeOut',
    });
    buzz(8);
  }

  // ---------------------------------------------------------------- footer

  private renderFooter(): void {
    dispose(this, this.footer);
    this.timer = null;
    // Origin at the bottom centre: rows stack upwards from there, which lets the
    // whole strip scale down on a short window without moving its base.
    this.footer = this.add.container(this.vw / 2, this.vh - spacing.lg);
    if (this.engine.phase === 'result' || this.engine.phase === 'gameover') return;

    const engine = this.engine;
    const width = this.stageWidth - spacing.md * 2;
    const answering = engine.phase === 'answering';

    const needed = engine.kind === 'meaning' ? 1 : engine.cards.length;
    const ready = engine.answer.length === needed && engine.cards.length > 0;

    const submit = new Button(
      this,
      'Submit',
      {
        padX: spacing.xl + spacing.md,
        padY: spacing.sm + 4,
        radius: radius.pill,
        fill: ready ? colors.accent : colors.surface,
        textColor: ready ? colors.accentText : colors.textDim,
        fontSize: font.body,
        raised: ready,
      },
      () => {
        play('tap');
        engine.submit();
      },
    );
    submit.setPosition(0, -submit.height / 2);
    submit.setEnabled(ready);
    this.footer.add(submit);

    let y = -submit.height - spacing.md;

    if (engine.kind === 'order') {
      const row = answerRow(this, width, engine, app.settings.showNumbers);
      row.setPosition(0, y - row.height / 2);
      this.footer.add(row);
      y -= row.height + spacing.md;
    } else {
      const note = label(this, 'Pick the one card that means it', font.small, {
        color: colors.textDim,
      });
      note.setPosition(0, y - 23);
      this.footer.add(note);
      y -= 46 + spacing.md;
    }

    if (answering) {
      const bar = actionBar(this, width, engine);
      bar.setPosition(0, y - bar.height / 2);
      this.footer.add(bar);
      y -= bar.height + spacing.md;

      const clock = answerTimer(this, width, engine);
      clock.node.setPosition(0, y - clock.node.height / 2);
      this.footer.add(clock.node);
      this.timer = clock.parts;
    }

    this.footer.setScale(this.footerHeight() / FOOTER_HEIGHT);
  }

  // ---------------------------------------------------------------- overlays

  private clearOverlay = (): void => {
    dispose(this, this.overlay);
    this.overlay = null;
  };

  private showResult(result: RoundResult): void {
    this.clearOverlay();
    const entry = this.engine.entry;
    if (!entry) return;

    const { node, height } = resultCard(this, this.engine, {
      result,
      entry,
      cardWidth: this.stageWidth - spacing.md * 2,
      onContinue: () => {
        this.clearOverlay();
        this.engine.advance();
      },
    });

    // The card sits where the footer would be, shrunk if the window is short.
    const bottom = this.vh - spacing.md;
    const scale = Math.min(1, (this.vh - this.boardTop() - spacing.sm) / height);
    node.setScale(scale);
    node.setPosition(this.vw / 2, bottom - (height * scale) / 2);
    node.setDepth(50);
    node.setAlpha(0);
    this.tweens.add({ targets: node, alpha: 1, duration: 180 });
    this.overlay = node;

    // The reveal is the point of this screen, so lift and shrink the board
    // rather than let the card cover the cards it is talking about.
    this.fitBoardAbove(bottom - height * scale);
  }

  private showQuitPrompt(): void {
    this.clearOverlay();
    this.overlay = quitCard(this, this.engine, {
      vw: this.vw,
      vh: this.vh,
      onStay: () => {
        this.clearOverlay();
        this.engine.releaseClock();
      },
      onQuit: () => this.engine.giveUp(),
    });
  }

  /** Squeezes the board into the strip left above `limit`. */
  private fitBoardAbove(limit: number): void {
    if (!this.board || this.cards.size === 0) return;
    const top = this.boardTop();
    const room = Math.max(80, limit - spacing.sm - top);
    const height = boardHeight(this.engine.cards.length, this.boardWidth);
    this.boardHolder.setScale(Math.min(1, room / height));
    this.boardHolder.setPosition(this.vw / 2, top + room / 2);
  }

  // ---------------------------------------------------------------- resize

  protected relayout(): void {
    // A resize can land between mounting the viewport and building the run.
    if (!this.engine) return;
    this.clearOverlay();
    this.buildChrome();
    this.renderBanner();
    this.renderCountdown();
    this.buildBoard();
    this.syncBoard(false);
    this.renderFooter();
    // A quit prompt or result card is rebuilt from the phase it interrupted.
    if (this.engine.phase === 'result' && this.engine.result) {
      this.showResult(this.engine.result);
    }
  }
}
