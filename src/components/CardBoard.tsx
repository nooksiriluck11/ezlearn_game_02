import React from 'react';
import { StyleSheet, View } from 'react-native';
import { boardHeight, cardFontSizes, cardSize, slotPositions } from '../game/layout';
import { POS_LABEL } from '../data/phrases';
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
  showThai: boolean;
  showPos: boolean;
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
  showThai,
  showPos,
  onCardPress,
}: Props) {
  const positions = slotPositions(slots.length, boardWidth);
  const { width, height } = cardSize(boardWidth);
  const longestWord = Math.max(...cards.map((card) => card.word.length));
  const longestGloss = showThai ? Math.max(...cards.map((card) => card.th.length)) : 0;
  const sizes = cardFontSizes(width, longestWord, longestGloss);

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
            gloss={showThai ? card.th : null}
            pos={showPos ? POS_LABEL[card.pos] : null}
            number={card.number}
            sizes={sizes}
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
