import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts,colors, font, radius, spacing} from '../theme';

type Props = {
  icon: string;
  label: string;
  hint: string;
  options: readonly number[];
  value: number;
  format: (option: number) => string;
  onChange: (next: number) => void;
};

/** Same shape as SettingRow, but the control on the right is a set of pills. */
export function SettingChoice({ icon, label, hint, options, value, format, onChange }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
      <View style={styles.pills}>
        {options.map((option) => {
          const picked = option === value;
          return (
            <Pressable
              key={option}
              style={[styles.pill, picked && styles.pillOn]}
              onPress={() => onChange(option)}
              accessibilityRole="radio"
              accessibilityState={{ selected: picked }}
              accessibilityLabel={`${label} ${format(option)}`}
            >
              <Text style={[styles.pillText, picked && styles.pillTextOn]}>{format(option)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  icon: {
    fontSize: font.body,
    fontFamily: fonts.regular,
    width: 24,
    textAlign: 'center',
  },
  text: {
    flex: 1,
  },
  label: {
    color: colors.text,
    fontSize: font.small,
    fontFamily: fonts.black,
  },
  hint: {
    color: colors.textDim,
    fontSize: font.tiny,
    fontFamily: fonts.regular,
  },
  pills: {
    flexDirection: 'row',
    gap: 4,
  },
  pill: {
    minWidth: 38,
    paddingVertical: 5,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceHi,
    alignItems: 'center',
  },
  pillOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pillText: {
    color: colors.textDim,
    fontSize: font.tiny,
    fontFamily: fonts.black,
  },
  pillTextOn: {
    color: colors.accentText,
  },
});
