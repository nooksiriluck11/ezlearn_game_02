import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { CardFontSizes } from '../game/layout';
import { SWAP_MS } from '../game/useGame';
import { colors, font, radius } from '../theme';

export type CardMark = 'none' | 'correct' | 'wrong';

type Props = {
  word: string;
  /** Thai gloss for this word, shown under it when the translation setting is on. */
  gloss: string | null;
  /** Part-of-speech label, shown above the word when that setting is on. */
  pos: string | null;
  /** null when the player turned card numbers off. */
  number: number | null;
  sizes: CardFontSizes;
  x: number;
  y: number;
  width: number;
  height: number;
  faceUp: boolean;
  hinted: boolean;
  ordinal: number | null;
  mark: CardMark;
  disabled: boolean;
  onPress: () => void;
};

const FLIP_MS = 500;

export function WordCard({
  word,
  gloss,
  pos,
  number,
  sizes,
  x,
  y,
  width,
  height,
  faceUp,
  hinted,
  ordinal,
  mark,
  disabled,
  onPress,
}: Props) {
  const flip = useSharedValue(faceUp ? 0 : 1);
  const lift = useSharedValue(0);

  useEffect(() => {
    flip.value = withTiming(faceUp ? 0 : 1, { duration: FLIP_MS });
  }, [faceUp, flip]);

  useEffect(() => {
    lift.value = withTiming(ordinal !== null ? 1 : 0, { duration: 160 });
  }, [lift, ordinal]);

  const container = useAnimatedStyle(
    () => ({
      transform: [
        { translateX: withTiming(x, { duration: SWAP_MS }) },
        { translateY: withTiming(y, { duration: SWAP_MS }) },
        { translateY: -lift.value * 10 },
        { scale: 1 - lift.value * 0.06 },
        { perspective: 800 },
        { rotateY: `${flip.value * 180}deg` },
      ],
    }),
    [x, y],
  );

  const frontStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flip.value, [0, 0.5, 1], [1, 0, 0]),
  }));

  const backStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flip.value, [0, 0.5, 1], [0, 0, 1]),
  }));

  const markColor = mark === 'correct' ? colors.good : mark === 'wrong' ? colors.bad : undefined;

  return (
    <Animated.View style={[styles.wrapper, { width, height }, container]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={
            faceUp ? word : number === null ? 'face down card' : `card ${number}`
          }
      >
        <Animated.View
          style={[
            styles.face,
            styles.front,
            hinted ? { borderColor: colors.hint, borderWidth: 3 } : null,
            markColor ? { borderColor: markColor, borderWidth: 3 } : null,
            frontStyle,
          ]}
        >
          {number !== null && <Text style={styles.badgeDark}>{number}</Text>}
          <Text
            style={[styles.word, { fontSize: sizes.word }]}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {word}
          </Text>
          {pos && <Text style={[styles.pos, { fontSize: sizes.pos }]}>{pos}</Text>}
          {gloss && (
            <Text
              style={[styles.gloss, { fontSize: sizes.gloss }]}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              {gloss}
            </Text>
          )}
        </Animated.View>

        <Animated.View
          style={[
            styles.face,
            styles.back,
            ordinal !== null ? { borderColor: colors.accent } : null,
            backStyle,
          ]}
        >
          {number !== null && (
            <Text style={[styles.backNumber, { fontSize: sizes.number }]}>{number}</Text>
          )}
          {ordinal !== null && (
            <Animated.View style={styles.ordinal}>
              <Text style={styles.ordinalText}>{ordinal}</Text>
            </Animated.View>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  face: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  front: {
    backgroundColor: colors.cardFace,
    transform: [{ rotateY: '0deg' }],
  },
  back: {
    backgroundColor: colors.cardBack,
    borderWidth: 3,
    borderColor: colors.cardBackEdge,
    transform: [{ rotateY: '180deg' }],
  },
  word: {
    color: colors.cardFaceText,
    fontWeight: '800',
    textAlign: 'center',
  },
  pos: {
    color: colors.cardFaceTag,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 4,
  },
  gloss: {
    color: colors.cardFaceGloss,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 3,
  },
  badgeDark: {
    position: 'absolute',
    top: 6,
    left: 8,
    color: colors.textDim,
    fontSize: font.small,
    fontWeight: '700',
  },
  backNumber: {
    color: colors.text,
    fontWeight: '800',
    opacity: 0.55,
  },
  ordinal: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ordinalText: {
    color: colors.accentText,
    fontSize: font.small,
    fontWeight: '800',
  },
});
