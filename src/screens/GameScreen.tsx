import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ActionBar } from '../components/ActionBar';
import { AnswerRow } from '../components/AnswerRow';
import { AnswerTimer } from '../components/AnswerTimer';
import { CardBoard } from '../components/CardBoard';
import { Countdown } from '../components/Countdown';
import { ResultOverlay } from '../components/ResultOverlay';
import { ScoreBadge } from '../components/ScoreBadge';
import { Phase, START_HEARTS, useGame } from '../game/useGame';
import { colors, font, radius, shadow, spacing } from '../theme';

const MAX_BOARD_WIDTH = 420;

function bannerFor(phase: Phase, swapCount: number): string {
  switch (phase) {
    case 'memorize':
      return 'Memorize the order';
    case 'hiding':
      return 'Cards down…';
    case 'shuffling':
      return 'Follow the cards!';
    case 'answering':
      return 'Tap the cards in order';
    default:
      return swapCount > 0 ? `${swapCount} swap${swapCount > 1 ? 's' : ''} this round` : 'No swaps';
  }
}

type Props = {
  onGameOver: (rounds: number, score: number) => void;
};

export function GameScreen({ onGameOver }: Props) {
  const game = useGame();
  const [boardWidth, setBoardWidth] = useState(0);

  useEffect(() => {
    game.startRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (game.phase === 'gameover') onGameOver(game.round - 1, game.score);
  }, [game.phase, game.round, game.score, onGameOver]);

  useEffect(() => {
    if (game.phase !== 'result' || Platform.OS === 'web') return;
    Haptics.notificationAsync(
      game.result?.passed
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error,
    ).catch(() => {});
  }, [game.phase, game.result]);

  function onBoardLayout(e: LayoutChangeEvent) {
    setBoardWidth(Math.min(e.nativeEvent.layout.width, MAX_BOARD_WIDTH));
  }

  const ready = game.answer.length === game.cards.length && game.cards.length > 0;
  const answering = game.phase === 'answering';
  const showResult = game.phase === 'result' && game.result !== null && game.entry !== null;
  const canHint = game.cards.some(
    (c) => !game.revealed.includes(c.id) && !game.answer.includes(c.id),
  );

  return (
    <View style={styles.root}>
      <View style={styles.glow} />

      <View style={styles.header}>
        <View style={styles.hearts}>
          <Text style={styles.heartsAlive}>{'♥'.repeat(game.hearts)}</Text>
          <Text style={styles.heartsLost}>{'♥'.repeat(START_HEARTS - game.hearts)}</Text>
        </View>
        <ScoreBadge score={game.score} streak={game.streak} />
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerText}>{bannerFor(game.phase, game.config.swapCount)}</Text>
        <Text style={styles.bannerMeta}>
          {game.config.wordCount} words
          {game.config.swapCount > 0 ? ` · ${game.config.swapCount} swaps` : ''}
        </Text>
      </View>

      <Countdown value={game.phase === 'memorize' ? game.countdown : 0} />

      <View style={styles.boardArea} onLayout={onBoardLayout}>
        {boardWidth > 0 && game.slots.length > 0 && (
          <CardBoard
            cards={game.cards}
            slots={game.slots}
            answer={game.answer}
            phase={game.phase}
            faceUp={game.faceUp}
            revealed={game.revealed}
            correctFlags={game.result?.correctFlags ?? null}
            boardWidth={boardWidth}
            onCardPress={game.toggleCard}
          />
        )}
      </View>

      <View style={styles.footer}>
        {showResult ? (
          <ResultOverlay
            result={game.result!}
            entry={game.entry!}
            heartsLeft={game.hearts}
            onContinue={game.advance}
          />
        ) : (
          <>
            {answering && (
              <>
                <AnswerTimer
                  left={game.answerLeft}
                  totalMs={game.answerTotalMs}
                  deadlineAt={game.deadlineAt}
                  seed={game.phraseSeed}
                />
                <ActionBar
                  hints={game.hints}
                  boosts={game.boosts}
                  canHint={canHint}
                  onHint={game.useHint}
                  onBoost={game.useBoost}
                  onSkip={game.skip}
                />
              </>
            )}
            <AnswerRow cards={game.cards} answer={game.answer} slots={game.slots} />
            <Pressable
              style={[styles.submit, !ready && styles.submitOff]}
              onPress={game.submit}
              disabled={!ready}
            >
              <Text style={[styles.submitText, !ready && styles.submitTextOff]}>Submit</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  glow: {
    position: 'absolute',
    top: -160,
    left: -60,
    right: -60,
    height: 360,
    borderRadius: 999,
    backgroundColor: colors.bgGlow,
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  hearts: {
    flexDirection: 'row',
  },
  heartsAlive: {
    color: colors.bad,
    fontSize: font.heading,
    letterSpacing: 2,
  },
  heartsLost: {
    color: colors.surface,
    fontSize: font.heading,
    letterSpacing: 2,
  },
  banner: {
    alignItems: 'center',
    gap: 2,
  },
  bannerText: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '800',
  },
  bannerMeta: {
    color: colors.textDim,
    fontSize: font.tiny,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  boardArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  footer: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
    justifyContent: 'flex-end',
    minHeight: 190,
  },
  submit: {
    alignSelf: 'center',
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.xl + spacing.md,
    borderRadius: radius.pill,
    ...shadow,
  },
  submitOff: {
    backgroundColor: colors.surface,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    color: colors.accentText,
    fontSize: font.body,
    fontWeight: '900',
  },
  submitTextOff: {
    color: colors.textDim,
  },
});
