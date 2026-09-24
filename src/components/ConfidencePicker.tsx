import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, space } from '../constants/theme';
import { Muted } from './Typography';

const LABELS = ['Guess', 'Faint', 'Some', 'Clear', 'Certain'];

interface Props {
  value?: number;
  onChange: (v: number) => void;
}

export function ConfidencePicker({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Muted>How confident are you?</Muted>
      <View style={styles.row}>
        {LABELS.map((label, i) => {
          const v = i + 1;
          const active = value === v;
          return (
            <Pressable
              key={label}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Confidence ${v} of 5, ${label}`}
              onPress={() => onChange(v)}
              style={[styles.pill, active && styles.active]}
            >
              <Text style={[styles.num, active && styles.activeText]}>{v}</Text>
              <Text style={[styles.label, active && styles.activeText]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  row: { flexDirection: 'row', gap: space.xs },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.indigoLine,
    backgroundColor: colors.indigoRaised,
  },
  active: { backgroundColor: colors.gold, borderColor: colors.gold },
  num: { fontFamily: fonts.sans, fontSize: 16, fontWeight: '700', color: colors.text },
  label: { fontFamily: fonts.sans, fontSize: 11, color: colors.textMuted },
  activeText: { color: colors.night },
});
