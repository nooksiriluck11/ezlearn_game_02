import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Entry, KIND_LABEL } from '../data/phrases';
import { RoundResult } from '../game/useGame';
import { fonts,colors, font, radius, shadow, spacing} from '../theme';

type Props = {
  result: RoundResult;
  entry: Entry;
  heartsLeft: number;
  onContinue: () => void;
};

function headline(result: RoundResult): { text: string; color: string } {
  if (result.passed) return { text: 'Perfect!', color: colors.good };
  if (result.skipped) return { text: 'Skipped', color: colors.textDim };
  if (result.timedOut) return { text: "Time's up!", color: colors.bad };
  return { text: 'Not quite', color: colors.bad };
}

export function ResultOverlay({ result, entry, heartsLeft, onContinue }: Props) {
  const outOfHearts = !result.passed && !result.skipped && heartsLeft <= 0;
  const head = headline(result);
  const label = outOfHearts ? 'See final score' : result.passed || result.skipped ? 'Next' : 'Try again';

  return (
    <View style={styles.card}>
      <Text style={[styles.title, { color: head.color }]}>{head.text}</Text>

      <View style={styles.kindPill}>
        <Text style={styles.kindText}>{KIND_LABEL[entry.kind]}</Text>
      </View>

      {result.question && (
        <Text style={styles.question}>
          “{result.question.th}” = {result.question.word}
        </Text>
      )}

      <Text style={styles.answer}>{entry.words.join(' ')}</Text>
      <Text style={styles.translation}>{entry.th}</Text>

      <Text style={[styles.points, result.gained < 0 && styles.pointsBad]}>
        {result.gained >= 0 ? `+${result.gained}` : result.gained} points
      </Text>

      {(result.hintEarned || result.boostEarned || result.unshuffleEarned) && (
        <View style={styles.rewards}>
          {result.hintEarned && <Text style={styles.reward}>+1 hint earned</Text>}
          {result.boostEarned && <Text style={styles.reward}>+1 time boost earned</Text>}
          {result.unshuffleEarned && <Text style={styles.reward}>+1 un-shuffle earned</Text>}
        </View>
      )}

      {!result.passed && !result.skipped && (
        <Text style={styles.hearts}>
          {heartsLeft > 0
            ? `${heartsLeft} ${heartsLeft === 1 ? 'life' : 'lives'} left`
            : 'No lives left'}
        </Text>
      )}

      <Pressable style={styles.button} onPress={onContinue}>
        <Text style={styles.buttonText}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceHi,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadow,
  },
  title: {
    fontSize: font.heading,
    fontFamily: fonts.black,
  },
  kindPill: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: 2,
  },
  kindText: {
    color: colors.mint,
    fontSize: font.tiny,
    fontFamily: fonts.black,
    letterSpacing: 1.2,
  },
  question: {
    color: colors.mint,
    fontSize: font.body,
    fontFamily: fonts.black,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  answer: {
    color: colors.text,
    fontSize: font.body + 3,
    fontFamily: fonts.black,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  translation: {
    color: colors.textDim,
    fontSize: font.body,
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: font.body * 1.5,
  },
  points: {
    color: colors.accent,
    fontSize: font.body,
    fontFamily: fonts.black,
    marginTop: spacing.xs,
  },
  pointsBad: {
    color: colors.bad,
  },
  rewards: {
    alignItems: 'center',
    gap: 2,
  },
  reward: {
    color: colors.mint,
    fontSize: font.small,
    fontFamily: fonts.black,
  },
  hearts: {
    color: colors.textDim,
    fontSize: font.small,
    fontFamily: fonts.regular,
  },
  button: {
    marginTop: spacing.sm,
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    ...shadow,
  },
  buttonText: {
    color: colors.accentText,
    fontSize: font.body,
    fontFamily: fonts.black,
  },
});
