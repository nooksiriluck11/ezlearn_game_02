import type Phaser from 'phaser';

export const SFX_KEYS = [
  'tick',
  'hurry',
  'flip',
  'swap',
  'tap',
  'go',
  'correct',
  'wrong',
  'gameover',
  'reward',
] as const;

export type SfxName = (typeof SFX_KEYS)[number];

let manager: Phaser.Sound.BaseSoundManager | null = null;
let enabled = true;

/** BootScene hands over the game-wide sound manager once the clips are decoded. */
export function attachSound(soundManager: Phaser.Sound.BaseSoundManager): void {
  manager = soundManager;
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

export function play(name: SfxName): void {
  if (!enabled || !manager) return;
  try {
    // Fire-and-forget: each call gets its own instance, so overlapping taps stack.
    manager.play(name);
  } catch {
    // A dead audio stack should never take the round down with it.
  }
}

/** Web equivalent of the native haptic tap — silently absent on desktop. */
export function buzz(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Ignored on browsers that expose the method but refuse the call.
  }
}
