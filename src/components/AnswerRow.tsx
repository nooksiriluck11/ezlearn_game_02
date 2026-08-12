import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../game/useGame';
import { colors, font, radius, spacing } from '../theme';

type Props = {
  cards: Card[];
  answer: string[];
  slots: string[];
};

export function AnswerRow({ cards, answer, slots }: Props) {
  return (
    <View style={styles.row}>
      {cards.map((_, index) => {
        const chosenId = answer[index];
        return (
          <View
            key={index}
            style={[styles.slot, { borderColor: chosenId ? colors.accent : colors.surface }]}
          >
            {chosenId ? (
              <Text style={styles.word}>{`#${slots.indexOf(chosenId) + 1}`}</Text>
            ) : (
              <Text style={styles.placeholder}>{index + 1}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 46,
  },
  slot: {
    minWidth: 62,
    height: 42,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 2,
    backgroundColor: colors.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  word: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '700',
  },
  placeholder: {
    color: colors.textDim,
    fontSize: font.body,
    fontWeight: '700',
    opacity: 0.5,
  },
});
