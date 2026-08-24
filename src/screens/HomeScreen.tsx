import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BonusModal } from '../components/BonusModal';
import { SettingsModal } from '../components/SettingsModal';
import { Progress } from '../storage/progress';
import { Settings } from '../storage/settings';
import { colors, font, radius, shadow, spacing } from '../theme';

type Props = {
  progress: Progress;
  lastRun: { rounds: number; score: number } | null;
  settings: Settings;
  onSettingsChange: (patch: Partial<Settings>) => void;
  onStart: () => void;
};

const RULES = [
  'Memorize where each word sits',
  'Cards flip, then shuffle — follow them',
  'Rebuild the phrase before time runs out',
  'Some rounds just ask which card means what',
];

export function HomeScreen({ progress, lastRun, settings, onSettingsChange, onStart }: Props) {
  const [open, setOpen] = useState<'none' | 'settings' | 'bonus'>('none');

  return (
    <View style={styles.root}>
      <View style={styles.glow} />

      <View style={styles.topBar}>
        <Pressable
          style={styles.bonusButton}
          onPress={() => setOpen('bonus')}
          accessibilityRole="button"
          accessibilityLabel="Bonus items"
        >
          <Text style={styles.bonusButtonText}>Bonus items</Text>
        </Pressable>

        <Pressable
          style={styles.gear}
          onPress={() => setOpen('settings')}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <Text style={styles.gearMark}>⚙</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      <View style={styles.hero}>
        <Text style={styles.kicker}>kukkukkoo</Text>
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
        {RULES.map((rule, index) => (
          <View key={rule} style={styles.rule}>
            <Text style={styles.ruleStep}>{index + 1}</Text>
            <Text style={styles.ruleText}>{rule}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.button} onPress={onStart}>
        <Text style={styles.buttonText}>{lastRun ? 'Play again' : 'Start'}</Text>
      </Pressable>

        <Text style={styles.footNote}>{progress.totalRuns} runs played</Text>
      </ScrollView>

      {open === 'settings' && (
        <SettingsModal
          settings={settings}
          onChange={onSettingsChange}
          onClose={() => setOpen('none')}
        />
      )}

      {open === 'bonus' && <BonusModal onClose={() => setOpen('none')} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // The glow bleeds past both edges on purpose — clip it so the page never scrolls sideways.
    overflow: 'hidden',
  },
  topBar: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bonusButton: {
    height: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.bgSoft,
    borderWidth: 1,
    borderColor: colors.surfaceHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bonusButtonText: {
    color: colors.mint,
    fontSize: font.small,
    fontWeight: '800',
  },
  gear: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.bgSoft,
    borderWidth: 1,
    borderColor: colors.surfaceHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearMark: {
    color: colors.textDim,
    fontSize: font.body + 2,
    lineHeight: font.body + 6,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    // Centres the block on tall screens, but lets it grow and scroll on short ones.
    flexGrow: 1,
    justifyContent: 'center',
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
  kicker: {
    color: colors.mint,
    fontSize: font.small,
    fontWeight: '800',
    letterSpacing: 3,
    textTransform: 'lowercase',
  },
  title: {
    color: colors.accent,
    fontSize: font.title,
    fontWeight: '900',
    marginTop: -2,
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
  ruleStep: {
    color: colors.accent,
    fontSize: font.tiny,
    fontWeight: '900',
    width: 20,
    textAlign: 'center',
    opacity: 0.8,
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
