import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, font, radius, shadow, spacing } from '../theme';

type Props = {
  score: number;
  streak: number;
};

export function ScoreBadge({ score, streak }: Props) {
  const pop = useSharedValue(1);
  const [shown, setShown] = useState(score);

  useEffect(() => {
    if (score === shown) return;
    setShown(score);
    pop.value = withSequence(withTiming(1.18, { duration: 130 }), withTiming(1, { duration: 220 }));
  }, [pop, score, shown]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <View style={styles.row}>
      {streak >= 2 && (
        <View style={styles.streak}>
          <Text style={styles.streakText}>🔥 {streak}</Text>
        </View>
      )}
      <Animated.View style={[styles.badge, style]}>
        <Text style={styles.star}>★</Text>
        <View>
          <Text style={styles.label}>SCORE</Text>
          <Text style={styles.value}>{score.toLocaleString()}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  streak: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  streakText: {
    color: colors.warn,
    fontSize: font.small,
    fontWeight: '800',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceHi,
    ...shadow,
  },
  star: {
    color: colors.accent,
    fontSize: font.heading,
  },
  label: {
    color: colors.textDim,
    fontSize: font.tiny,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  value: {
    color: colors.text,
    fontSize: font.score - 6,
    fontWeight: '900',
    lineHeight: font.score,
  },
});
