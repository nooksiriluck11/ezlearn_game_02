import { play, setSoundEnabled } from './audio/sfx';
import type { Progress } from './storage/progress';
import { loadProgress, saveProgress } from './storage/progress';
import type { Settings } from './storage/settings';
import { loadSettings, saveSettings } from './storage/settings';

export type Run = { rounds: number; score: number };

/**
 * What the old App component held: settings, records, and the run just finished.
 * Scenes come and go, this does not.
 */
class AppState {
  settings: Settings = loadSettings();
  progress: Progress = loadProgress();
  lastRun: Run | null = null;

  updateSettings(patch: Partial<Settings>): void {
    this.settings = { ...this.settings, ...patch };
    saveSettings(this.settings);
    if (patch.sound !== undefined) {
      setSoundEnabled(patch.sound);
      // Blip back so switching sound on proves itself.
      if (patch.sound) play('tap');
    }
  }

  recordRun(rounds: number, score: number): void {
    this.lastRun = { rounds, score };
    this.progress = {
      bestRounds: Math.max(this.progress.bestRounds, rounds),
      bestScore: Math.max(this.progress.bestScore, score),
      totalRuns: this.progress.totalRuns + 1,
    };
    saveProgress(this.progress);
  }
}

export const app = new AppState();
