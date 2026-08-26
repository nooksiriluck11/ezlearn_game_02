import Phaser from 'phaser';
import { colors } from './theme';
import { DPR } from './ui/viewport';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { HomeScene } from './scenes/HomeScene';

const parent = document.getElementById('game') as HTMLDivElement;

function deviceSize(): { width: number; height: number } {
  return {
    width: Math.max(1, Math.round(parent.clientWidth * DPR)),
    height: Math.max(1, Math.round(parent.clientHeight * DPR)),
  };
}

/**
 * Fonts first. Phaser's Text draws with the Canvas API, which silently falls
 * back to the system face if Prompt has not landed yet — and the metrics that
 * size the cards would be measured against the wrong font.
 */
async function loadFonts(): Promise<void> {
  if (!document.fonts) return;
  // Both scripts, per weight: Prompt ships latin and thai as separate files and
  // the browser only fetches the ones a sample string actually needs.
  const faces = ['400', '600', '700', '900'].flatMap((w) => [
    document.fonts.load(`${w} 24px Prompt`, 'Agy'),
    document.fonts.load(`${w} 24px Prompt`, 'กุ๊ก'),
  ]);
  // Never let a slow font hold the game hostage.
  await Promise.race([
    Promise.all(faces).then(() => document.fonts.ready),
    new Promise((resolve) => setTimeout(resolve, 4000)),
  ]);
}

async function start(): Promise<void> {
  await loadFonts();
  document.getElementById('boot')?.remove();

  const size = deviceSize();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: colors.bg,
    scale: {
      // NONE + zoom is the only mode that lets the canvas be denser than its CSS box.
      mode: Phaser.Scale.NONE,
      zoom: 1 / DPR,
      width: size.width,
      height: size.height,
    },
    // Sound clips are short WAVs; WebAudio unlocks itself on the first tap.
    audio: { disableWebAudio: false },
    scene: [BootScene, HomeScene, GameScene],
  });

  // Handy from the console while developing; stripped from the production build.
  if (import.meta.env.DEV) {
    (window as unknown as { game: Phaser.Game }).game = game;
  }

  const fit = () => {
    const next = deviceSize();
    if (next.width !== game.scale.width || next.height !== game.scale.height) {
      game.scale.resize(next.width, next.height);
    }
  };

  new ResizeObserver(fit).observe(parent);
  window.addEventListener('orientationchange', () => setTimeout(fit, 120));
}

void start();
