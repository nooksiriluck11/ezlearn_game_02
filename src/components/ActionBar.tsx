import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SKIP_PENALTY } from '../game/useGame';
import { colors, font, radius, spacing } from '../theme';

type Props = {
  hints: number;
  boosts: number;
  canHint: boolean;
  onHint: () => void;
  onBoost: () => void;
  onSkip: () => void;
};

export function ActionBar({ hints, boosts, canHint, onHint, onBoost, onSkip }: Props) {
  const hintOff = hints <= 0 || !canHint;
  const boostOff = boosts <= 0;

  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.chip, styles.hintChip, hintOff && styles.off]}
        onPress={onHint}
        disabled={hintOff}
      >
        <Text style={[styles.label, hintOff && styles.labelOff]}>💡 Hint</Text>
        <View style={[styles.count, hintOff && styles.countOff]}>
          <Text style={styles.countText}>{hints}</Text>
        </View>
      </Pressable>

      <Pressable
        style={[styles.chip, styles.boostChip, boostOff && styles.off]}
        onPress={onBoost}
        disabled={boostOff}
      >
        <Text style={[styles.label, boostOff && styles.labelOff]}>⏱ +5s</Text>
        <View style={[styles.count, boostOff && styles.countOff]}>
          <Text style={styles.countText}>{boosts}</Text>
        </View>
      </Pressable>

      <Pressable style={[styles.chip, styles.skipChip]} onPress={onSkip}>
        <Text style={styles.skipLabel}>⏭ Skip</Text>
        <Text style={styles.penalty}>−{SKIP_PENALTY}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
  },
  hintChip: {
    borderColor: colors.hint,
  },
  boostChip: {
    borderColor: colors.mint,
  },
  skipChip: {
    borderColor: colors.surfaceHi,
  },
  off: {
    opacity: 0.35,
  },
  label: {
    color: colors.text,
    fontSize: font.small,
    fontWeight: '800',
  },
  labelOff: {
    color: colors.textDim,
  },
  count: {
    minWidth: 20,
    paddingHorizontal: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHi,
    alignItems: 'center',
  },
  countOff: {
    backgroundColor: 'transparent',
  },
  countText: {
    color: colors.text,
    fontSize: font.tiny,
    fontWeight: '900',
  },
  skipLabel: {
    color: colors.textDim,
    fontSize: font.small,
    fontWeight: '800',
  },
  penalty: {
    color: colors.bad,
    fontSize: font.tiny,
    fontWeight: '900',
  },
});
