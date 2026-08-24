import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
// Per-weight imports on purpose: the package root pulls all 18 faces into the
// bundle (~3 MB), these four are the only ones the UI names.
import { Prompt_400Regular } from '@expo-google-fonts/prompt/400Regular';
import { Prompt_600SemiBold } from '@expo-google-fonts/prompt/600SemiBold';
import { Prompt_700Bold } from '@expo-google-fonts/prompt/700Bold';
import { Prompt_900Black } from '@expo-google-fonts/prompt/900Black';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { play, setSoundEnabled } from './src/audio/sfx';
import { GameScreen } from './src/screens/GameScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { EMPTY_PROGRESS, loadProgress, Progress, saveProgress } from './src/storage/progress';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, Settings } from './src/storage/settings';
import { colors } from './src/theme';

type Screen = 'home' | 'game';
type Run = { rounds: number; score: number };

export default function App() {
  const [fontsLoaded] = useFonts({
    Prompt_400Regular,
    Prompt_600SemiBold,
    Prompt_700Bold,
    Prompt_900Black,
  });
  const [screen, setScreen] = useState<Screen>('home');
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);
  const [lastRun, setLastRun] = useState<Run | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const soundKnown = useRef(false);

  useEffect(() => {
    loadProgress().then(setProgress);
    loadSettings().then(setSettings);
  }, []);

  useEffect(() => {
    setSoundEnabled(settings.sound);
    // Blip back so switching sound on proves itself — but not on the initial load.
    if (soundKnown.current && settings.sound) play('tap');
    soundKnown.current = true;
  }, [settings.sound]);

  const onSettingsChange = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const onGameOver = useCallback((rounds: number, score: number) => {
    setLastRun({ rounds, score });
    setScreen('home');
    setProgress((current) => {
      const next: Progress = {
        bestRounds: Math.max(current.bestRounds, rounds),
        bestScore: Math.max(current.bestScore, score),
        totalRuns: current.totalRuns + 1,
      };
      saveProgress(next);
      return next;
    });
  }, []);

  // Holding the first paint until the faces land avoids a flash of the system font.
  if (!fontsLoaded) {
    return <View style={styles.root} />;
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      {screen === 'home' ? (
        <HomeScreen
          progress={progress}
          lastRun={lastRun}
          settings={settings}
          onSettingsChange={onSettingsChange}
          onStart={() => setScreen('game')}
        />
      ) : (
        <GameScreen settings={settings} onGameOver={onGameOver} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
