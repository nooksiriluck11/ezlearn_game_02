import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { HEART_CHOICES, MEMORIZE_CHOICES, Settings } from '../storage/settings';
import { colors, font, spacing } from '../theme';
import { Popup } from './Popup';
import { SettingChoice } from './SettingChoice';
import { SettingRow } from './SettingRow';

type Props = {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onClose: () => void;
};

export function SettingsModal({ settings, onChange, onClose }: Props) {
  return (
    <Popup title="⚙ Settings" onClose={onClose}>
        <Text style={styles.group}>CARDS</Text>
        <SettingRow
          icon="🇹🇭"
          label="Thai on cards"
          hint="แสดงคำแปลไทยใต้คำศัพท์บนการ์ด"
          value={settings.showThai}
          onChange={(next) => onChange({ showThai: next })}
        />
        <SettingRow
          icon="🔤"
          label="Part of speech"
          hint="บอกชนิดของคำ NOUN VERB ADJ เหนือคำบนการ์ด"
          value={settings.showPos}
          onChange={(next) => onChange({ showPos: next })}
        />
        <SettingRow
          icon="🔢"
          label="Card numbers"
          hint="ปิดแล้วการ์ดจะไม่มีเลข ต้องจ้องตามการ์ดตอนสลับเอง"
          value={settings.showNumbers}
          onChange={(next) => onChange({ showNumbers: next })}
        />

        <Text style={styles.group}>DIFFICULTY</Text>
        <SettingChoice
          icon="⏱"
          label="Memorize time"
          hint="เวลานับถอยหลังตอนจำการ์ด ยิ่งน้อยยิ่งท้าทาย"
          options={MEMORIZE_CHOICES}
          value={settings.memorizeSeconds}
          format={(option) => `${option}s`}
          onChange={(next) => onChange({ memorizeSeconds: next })}
        />
        <SettingChoice
          icon="♥"
          label="Hearts"
          hint="ยิ่งหัวใจน้อยยิ่งได้คะแนนเยอะ · 3 ดวง ×1 · 4 ดวง ×0.85 · 5 ดวง ×0.7"
          options={HEART_CHOICES}
          value={settings.hearts}
          format={(option) => `${option}`}
          onChange={(next) => onChange({ hearts: next })}
        />

        <Text style={styles.group}>SOUND</Text>
        <SettingRow
          icon="🔊"
          label="Sound effects"
          hint="เสียงนับถอยหลัง สลับการ์ด และเฉลย"
          value={settings.sound}
          onChange={(next) => onChange({ sound: next })}
        />
    </Popup>
  );
}

const styles = StyleSheet.create({
  group: {
    color: colors.mint,
    fontSize: font.tiny,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: spacing.sm,
    marginBottom: 2,
  },
});
