import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, space } from '../constants/theme';

interface Props {
  label: string;
  value: number;
  baseline: number;
  baselineLabel: string;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

/** Your score next to the fair comparison, on the same scale. */
export function ComparisonBar({ label, value, baseline, baselineLabel }: Props) {
  return (
    <View style={styles.wrap}>
      <Row label={label} value={value} color={colors.gold} />
      <Row label={baselineLabel} value={baseline} color={colors.textFaint} />
    </View>
  );
}

function Row({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.row} accessibilityLabel={`${label} ${pct(value)}`}>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, Math.max(0, value * 100))}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.value}>{pct(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  label: { width: 110, fontFamily: fonts.sans, fontSize: 13, color: colors.textMuted },
  track: { flex: 1, height: 10, borderRadius: radius.pill, backgroundColor: colors.indigo, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  value: { width: 44, textAlign: 'right', fontFamily: fonts.sans, fontSize: 13, color: colors.text, fontWeight: '600' },
});
