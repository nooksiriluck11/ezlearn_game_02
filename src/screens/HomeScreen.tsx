import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Progress } from '../storage/progress';
import { colors, font, radius, shadow, spacing } from '../theme';

type Props = {
  progress: Progress;
  lastRun: { rounds: number; score: number } | null;
  onStart: () => void;
};

const RULES = [
  { icon: '👀', text: 'Memorize where each word sits' },
  { icon: '🔀', text: 'Cards flip, then shuffle — follow them' },
  { icon: '⏱', text: 'Rebuild the phrase before time runs out' },
];

export function HomeScreen({ progress, lastRun, onStart }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.glow} />

      <View style={styles.hero}>
        <Text style={styles.title}>กุกกุกกู๊</Text>
        <Text style={styles.subtitle}>Memory & focus, one phrase at a time</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>BEST SCORE</Text>
          <Text style={styles.statValue}>{progress.bestScore.toLocaleString()}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>BEST STREAK</Text>
          <Text style={styles.statValue}>{progress.bestRounds}</Text>
          <Text style={styles.statUnit}>rounds</Text>
        </View>
      </View>

      {lastRun && (
        <Text style={styles.lastRun}>
          Last run · {lastRun.score.toLocaleString()} points · {lastRun.rounds} rounds
        </Text>
      )}

      <View style={styles.rules}>
        {RULES.map((rule) => (
          <View key={rule.text} style={styles.rule}>
            <Text style={styles.ruleIcon}>{rule.icon}</Text>
            <Text style={styles.ruleText}>{rule.text}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.button} onPress={onStart}>
        <Text style={styles.buttonText}>{lastRun ? 'Play again' : 'Start'}</Text>
      </Pressable>

      <Text style={styles.footNote}>{progress.totalRuns} runs played</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  glow: {
    position: 'absolute',
    top: -120,
    left: -80,
    right: -80,
    height: 400,
    borderRadius: 999,
    backgroundColor: colors.bgGlow,
    opacity: 0.7,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    color: colors.accent,
    fontSize: font.title,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textDim,
    fontSize: font.body,
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.bgSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceHi,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    color: colors.textDim,
    fontSize: font.tiny,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  statValue: {
    color: colors.accent,
    fontSize: font.score,
    fontWeight: '900',
  },
  statUnit: {
    color: colors.textDim,
    fontSize: font.tiny,
  },
  lastRun: {
    color: colors.textDim,
    fontSize: font.small,
    textAlign: 'center',
    marginTop: -spacing.sm,
  },
  rules: {
    gap: spacing.sm,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ruleIcon: {
    fontSize: font.body,
    width: 24,
    textAlign: 'center',
  },
  ruleText: {
    color: colors.textDim,
    fontSize: font.small,
    flex: 1,
  },
  button: {
    alignSelf: 'center',
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl + spacing.lg,
    borderRadius: radius.pill,
    ...shadow,
  },
  buttonText: {
    color: colors.accentText,
    fontSize: font.heading - 4,
    fontWeight: '900',
  },
  footNote: {
    color: colors.textDim,
    fontSize: font.tiny,
    textAlign: 'center',
    marginTop: -spacing.sm,
  },
});
