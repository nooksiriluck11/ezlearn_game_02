import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BOOST_MS,
  CORRECT_PER_HINT,
  START_HINTS,
  START_UNSHUFFLES,
  STREAK_PER_BOOST,
  STREAK_PER_UNSHUFFLE,
} from '../game/useGame';
import { fonts,colors, font, spacing} from '../theme';

// Wording is built from the real rules, so tweaking rewards.ts updates this screen too.
const BONUSES = [
  {
    tint: colors.hint,
    name: 'Hint',
    does: 'เปิดการ์ดใบที่ต้องใช้ถัดไป รอบพิเศษจะเปิดใบที่ถาม',
    how: `เริ่มมี ${START_HINTS} · ตอบถูกครบทุก ${CORRECT_PER_HINT} ข้อ`,
  },
  {
    tint: colors.mint,
    name: `+${BOOST_MS / 1000}s`,
    does: `ต่อเวลาตอบอีก ${BOOST_MS / 1000} วินาที กดตอนไหนก็ได้ระหว่างตอบ`,
    how: `ตอบถูกติดกัน ${STREAK_PER_BOOST} ข้อ`,
  },
  {
    tint: colors.warn,
    name: 'Unshuffle',
    does: 'ดึงการ์ดกลับไปเรียงตามตอนแจก ล้างการสลับของรอบนั้นทิ้ง',
    how: `เริ่มมี ${START_UNSHUFFLES} · ตอบถูกติดกัน ${STREAK_PER_UNSHUFFLE} ข้อ`,
  },
];

export function BonusList() {
  return (
    <>
      {BONUSES.map((bonus) => (
        <View key={bonus.name} style={styles.row}>
          {/* The dot matches the chip colour this item has in game. */}
          <View style={[styles.dot, { backgroundColor: bonus.tint }]} />
          <View style={styles.text}>
            <Text style={styles.name}>{bonus.name}</Text>
            <Text style={styles.does}>{bonus.does}</Text>
            <Text style={styles.how}>{bonus.how}</Text>
          </View>
        </View>
      ))}

      <Text style={styles.note}>ตอบผิดหรือกด Skip เมื่อไหร่ streak ขาด ต้องนับหนึ่งใหม่</Text>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginHorizontal: 8,
  },
  text: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: font.small,
    fontFamily: fonts.black,
  },
  does: {
    color: colors.textDim,
    fontSize: font.tiny,
    fontFamily: fonts.regular,
  },
  how: {
    color: colors.mint,
    fontSize: font.tiny,
    fontFamily: fonts.black,
    marginTop: 2,
  },
  note: {
    color: colors.textDim,
    fontSize: font.tiny,
    fontFamily: fonts.regular,
    opacity: 0.8,
    marginTop: spacing.xs,
  },
});
