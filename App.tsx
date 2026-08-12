import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GameScreen } from './src/screens/GameScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { EMPTY_PROGRESS, loadProgress, Progress, saveProgress } from './src/storage/progress';
import { colors } from './src/theme';

type Screen = 'home' | 'game';
type Run = { rounds: number; score: number };

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);
  const [lastRun, setLastRun] = useState<Run | null>(null);

  useEffect(() => {
    loadProgress().then(setProgress);
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

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      {screen === 'home' ? (
        <HomeScreen progress={progress} lastRun={lastRun} onStart={() => setScreen('game')} />
      ) : (
        <GameScreen onGameOver={onGameOver} />
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
