import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const SOURCES = {
  tick: require('../../assets/sfx/tick.wav'),
  hurry: require('../../assets/sfx/hurry.wav'),
  flip: require('../../assets/sfx/flip.wav'),
  swap: require('../../assets/sfx/swap.wav'),
  tap: require('../../assets/sfx/tap.wav'),
  go: require('../../assets/sfx/go.wav'),
  correct: require('../../assets/sfx/correct.wav'),
  wrong: require('../../assets/sfx/wrong.wav'),
  gameover: require('../../assets/sfx/gameover.wav'),
  reward: require('../../assets/sfx/reward.wav'),
};

export type SfxName = keyof typeof SOURCES;

let players: Record<SfxName, AudioPlayer> | null = null;
let enabled = true;

/** Players are built on the first sound so a muted run never touches the audio stack. */
function ensurePlayers(): Record<SfxName, AudioPlayer> {
  if (players) return players;
  setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  const built = {} as Record<SfxName, AudioPlayer>;
  (Object.keys(SOURCES) as SfxName[]).forEach((name) => {
    built[name] = createAudioPlayer(SOURCES[name]);
  });
  players = built;
  return built;
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

export function play(name: SfxName): void {
  if (!enabled) return;
  try {
    const player = ensurePlayers()[name];
    // Rewind first: a player still mid-sound ignores play() otherwise.
    player.seekTo(0);
    player.play();
  } catch {
    // A dead audio stack should never take the round down with it.
  }
}
