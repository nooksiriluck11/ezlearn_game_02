import React from 'react';
import { StyleSheet, View } from 'react-native';
import { boardHeight, cardSize, slotPositions } from '../game/layout';
import { Card, Phase } from '../game/useGame';
import { CardMark, WordCard } from './WordCard';

type Props = {
  cards: Card[];
  slots: string[];
  answer: string[];
  phase: Phase;
  faceUp: boolean;
  revealed: string[];
  correctFlags: boolean[] | null;
  boardWidth: number;
  onCardPress: (cardId: string) => void;
};

export function CardBoard({
  cards,
  slots,
  answer,
  phase,
  faceUp,
  revealed,
  correctFlags,
  boardWidth,
  onCardPress,
}: Props) {
  const positions = slotPositions(slots.length, boardWidth);
  const { width, height } = cardSize(boardWidth);

  function markFor(cardId: string): CardMark {
    if (!correctFlags) return 'none';
    const answerIndex = answer.indexOf(cardId);
    if (answerIndex === -1) return 'none';
    return correctFlags[answerIndex] ? 'correct' : 'wrong';
  }

  return (
    <View style={[styles.board, { width: boardWidth, height: boardHeight(slots.length, boardWidth) }]}>
      {cards.map((card) => {
        const slotIndex = slots.indexOf(card.id);
        if (slotIndex === -1) return null;
        const answerIndex = answer.indexOf(card.id);
        const hinted = revealed.includes(card.id);
        return (
          <WordCard
            key={card.id}
            word={card.word}
            slotNumber={slotIndex + 1}
            x={positions[slotIndex].x}
            y={positions[slotIndex].y}
            width={width}
            height={height}
            faceUp={faceUp || hinted}
            hinted={hinted && !faceUp}
            ordinal={answerIndex === -1 ? null : answerIndex + 1}
            mark={markFor(card.id)}
            disabled={phase !== 'answering'}
            onPress={() => onCardPress(card.id)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    alignSelf: 'center',
  },
});
