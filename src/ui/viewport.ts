import Phaser from 'phaser';
import { colors, hex } from '../theme';

/**
 * Phaser's RESIZE mode gives the canvas a 1:1 CSS-pixel backing store, which on
 * a phone means everything renders at a third of the screen's real resolution.
 * Instead the canvas is sized in *device* pixels and squeezed back down with
 * CSS, and each Scene camera zooms by the same factor — so Scene code keeps
 * working in CSS pixels while the GPU draws at full density.
 *
 * Capped at 2: beyond that the fill-rate cost buys nothing the eye can see.
 */
export const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

/** The content column. Wider screens get bars, not stretched cards. */
export const MAX_STAGE = 460;

export abstract class BaseScene extends Phaser.Scene {
  /** Viewport size in CSS pixels — the units every layout in this game uses. */
  protected vw = 0;
  protected vh = 0;

  /** Width of the centred content column, and its left edge. */
  protected get stageWidth(): number {
    return Math.min(this.vw, MAX_STAGE);
  }

  protected get stageX(): number {
    return (this.vw - this.stageWidth) / 2;
  }

  /** Call first thing in `create()`. */
  protected mountViewport(): void {
    this.applyViewport();
    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
    });
  }

  private handleResize(): void {
    this.applyViewport();
    this.relayout();
  }

  private applyViewport(): void {
    this.vw = this.scale.width / DPR;
    this.vh = this.scale.height / DPR;
    this.cameras.resize(this.scale.width, this.scale.height);
    const cam = this.cameras.main;
    cam.setZoom(DPR);
    cam.centerOn(this.vw / 2, this.vh / 2);
    cam.setBackgroundColor(hex(colors.bg));
  }

  /** Reposition everything for the new `vw` / `vh`. */
  protected abstract relayout(): void;
}
