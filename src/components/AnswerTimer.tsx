import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, font, radius, spacing } from '../theme';

const CALM = ['Beat the clock!', 'You got this!', 'Lock it in!'];
const MID = ['Keep it up!', 'Halfway there!', 'Stay sharp!'];
const LOW = ['Hurry up!', 'Tick tock!', 'Almost out of time!'];

type Props = {
  left: number;
  totalMs: number;
  deadlineAt: number;
  seed: number;
};

export function AnswerTimer({ left, totalMs, deadlineAt, seed }: Props) {
  const progress = useSharedValue(1);
  const pulse = useSharedValue(1);

  const totalSeconds = totalMs / 1000;
  const ratio = totalSeconds > 0 ? left / totalSeconds : 0;
  const low = ratio <= 0.3;
  const mid = !low && ratio <= 0.6;

  const bank = low ? LOW : mid ? MID : CALM;
  const phrase = bank[seed % bank.length];
  const tone = low ? colors.bad : mid ? colors.warn : colors.accent;

  // One long linear animation per deadline — smooth at 60fps, and a
  // time boost simply moves the deadline and restarts it.
  useEffect(() => {
    if (deadlineAt === 0 || totalMs === 0) return;
    const remaining = Math.max(0, deadlineAt - Date.now());
    progress.value = remaining / totalMs;
    progress.value = withTiming(0, { duration: remaining, easing: Easing.linear });
  }, [deadlineAt, progress, totalMs]);

  useEffect(() => {
    pulse.value = low
      ? withRepeat(
          withSequence(withTiming(1.06, { duration: 340 }), withTiming(1, { duration: 340 })),
          -1,
          false,
        )
      : withTiming(1, { duration: 200 });
  }, [low, pulse]);

  const fill = useAnimatedStyle(() => ({
    transform: [{ scaleX: Math.max(0, Math.min(1, progress.value)) }],
  }));
  const label = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View style={styles.wrap}>
      <View style={styles.labels}>
        <Animated.Text style={[styles.phrase, { color: tone }, label]}>{phrase}</Animated.Text>
        <Text style={[styles.seconds, { color: tone }]}>{left}s</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { backgroundColor: tone }, fill]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  labels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phrase: {
    fontSize: font.small,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  seconds: {
    fontSize: font.small,
    fontWeight: '900',
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    width: '100%',
    borderRadius: radius.pill,
    transformOrigin: 'left',
  },
});
