import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '../theme';

type Props = {
  icon: string;
  label: string;
  hint: string;
  value: boolean;
  onChange: (next: boolean) => void;
};

export function SettingRow({ icon, label, hint, value, onChange }: Props) {
  return (
    <Pressable
      style={styles.row}
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
    >
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
      <View style={[styles.track, value && styles.trackOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </Pressable>
  );
}

const TRACK_WIDTH = 46;
const KNOB = 20;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  icon: {
    fontSize: font.body,
    width: 24,
    textAlign: 'center',
  },
  text: {
    flex: 1,
  },
  label: {
    color: colors.text,
    fontSize: font.small,
    fontWeight: '800',
  },
  hint: {
    color: colors.textDim,
    fontSize: font.tiny,
  },
  track: {
    width: TRACK_WIDTH,
    height: KNOB + 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceHi,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  trackOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: radius.pill,
    backgroundColor: colors.textDim,
  },
  knobOn: {
    backgroundColor: colors.accentText,
    transform: [{ translateX: TRACK_WIDTH - KNOB - 8 }],
  },
});
