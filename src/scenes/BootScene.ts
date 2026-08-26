import Phaser from 'phaser';
import { attachSound, SFX_KEYS, setSoundEnabled } from '../audio/sfx';
import { loadSettings } from '../storage/settings';
import { colors, FAMILY, hex, weights } from '../theme';
import { DPR } from '../ui/viewport';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    SFX_KEYS.forEach((name) => this.load.audio(name, `/sfx/${name}.wav`));
    this.showProgress();
  }

  create(): void {
    attachSound(this.sound);
    setSoundEnabled(loadSettings().sound);
    this.scene.start('home');
  }

  /** A thin mint bar — the clips are small, so this is usually a single frame. */
  private showProgress(): void {
    const width = this.scale.width / DPR;
    const height = this.scale.height / DPR;
    const cam = this.cameras.main;
    cam.setZoom(DPR);
    cam.centerOn(width / 2, height / 2);
    cam.setBackgroundColor(hex(colors.bg));

    const word = this.add
      .text(width / 2, height / 2 - 20, 'kukkukkoo', {
        fontFamily: FAMILY,
        fontSize: '13px',
        fontStyle: weights.black,
        color: colors.mint,
        letterSpacing: 3,
      })
      .setOrigin(0.5)
      .setResolution(DPR);

    const track = this.add.rectangle(width / 2, height / 2 + 14, 140, 4, hex(colors.surface));
    const fill = this.add.rectangle(width / 2 - 70, height / 2 + 14, 0, 4, hex(colors.mint));
    fill.setOrigin(0, 0.5);

    this.load.on('progress', (value: number) => fill.setSize(140 * value, 4));
    this.load.once('complete', () => {
      word.destroy();
      track.destroy();
      fill.destroy();
    });
  }
}
