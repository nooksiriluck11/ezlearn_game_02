import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '../theme';

type Props = {
  score: number;
  rounds: number;
  onKeepPlaying: () => void;
  onQuit: () => void;
};

/** Covers the board on purpose: no free extra look at the cards while deciding. */
export function QuitOverlay({ score, rounds, onKeepPlaying, onQuit }: Props) {
  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={styles.title}>Quit this run?</Text>
        <Text style={styles.body}>
          {rounds > 0
            ? `${score.toLocaleString()} points from ${rounds} ${rounds === 1 ? 'round' : 'rounds'} are saved.`
            : 'Nothing scored yet — the clock stops here.'}
        </Text>

        <Pressable style={styles.stay} onPress={onKeepPlaying}>
          <Text style={styles.stayText}>Keep playing</Text>
        </Pressable>
        <Pressable style={styles.quit} onPress={onQuit}>
          <Text style={styles.quitText}>Quit</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(14, 11, 36, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.bgSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceHi,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow,
  },
  title: {
    color: colors.text,
    fontSize: font.heading - 2,
    fontWeight: '900',
  },
  body: {
    color: colors.textDim,
    fontSize: font.small,
    textAlign: 'center',
    lineHeight: font.small * 1.5,
  },
  stay: {
    marginTop: spacing.xs,
    alignSelf: 'stretch',
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.pill,
    alignItems: 'center',
    ...shadow,
  },
  stayText: {
    color: colors.accentText,
    fontSize: font.body,
    fontWeight: '900',
  },
  quit: {
    alignSelf: 'stretch',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.surfaceHi,
    alignItems: 'center',
  },
  quitText: {
    color: colors.bad,
    fontSize: font.body,
    fontWeight: '800',
  },
});
