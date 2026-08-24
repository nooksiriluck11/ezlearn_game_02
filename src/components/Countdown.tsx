import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { fonts,colors, font} from '../theme';

export function Countdown({ value }: { value: number }) {
  const pop = useSharedValue(1);

  useEffect(() => {
    if (value <= 0) return;
    pop.value = withSequence(
      withTiming(1.35, { duration: 120 }),
      withTiming(1, { duration: 260 }),
    );
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [pop, value]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <Animated.View style={[styles.wrap, style]}>
      <Text style={styles.number}>{value > 0 ? value : ''}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: font.countdown * 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    color: colors.accent,
    fontSize: font.countdown,
    fontFamily: fonts.black,
    lineHeight: font.countdown * 1.05,
  },
});
