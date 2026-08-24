import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '../theme';

type Props = {
  title: string;
  onClose: () => void;
  closeLabel?: string;
  children: React.ReactNode;
};

/** The shell both the settings and the bonus panels sit in, so they behave the same. */
export function Popup({ title, onClose, closeLabel = 'Done', children }: Props) {
  return (
    <View style={styles.backdrop}>
      {/* Tapping the dimmed area closes, the way these panels usually behave. */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityLabel={`Close ${title}`}
      />

      <View style={styles.card}>
        <View style={styles.head}>
          <Text style={styles.title}>{title}</Text>
          <Pressable style={styles.close} onPress={onClose} accessibilityLabel={`Close ${title}`}>
            <Text style={styles.closeMark}>✕</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {children}
        </ScrollView>

        <Pressable style={styles.done} onPress={onClose}>
          <Text style={styles.doneText}>{closeLabel}</Text>
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
    backgroundColor: 'rgba(14, 11, 36, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    backgroundColor: colors.bgSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceHi,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: font.heading - 6,
    fontWeight: '900',
  },
  close: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeMark: {
    color: colors.textDim,
    fontSize: font.small,
    fontWeight: '900',
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    gap: 2,
    paddingBottom: spacing.xs,
  },
  done: {
    alignSelf: 'stretch',
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.pill,
    alignItems: 'center',
    ...shadow,
  },
  doneText: {
    color: colors.accentText,
    fontSize: font.body,
    fontWeight: '900',
  },
});
