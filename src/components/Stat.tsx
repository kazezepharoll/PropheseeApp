import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, space } from '../constants/theme';

interface Props {
  label: string;
  value: string;
  hint?: string;
}

export function Stat({ label, value, hint }: Props) {
  return (
    <View style={styles.tile}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  tile: {
    flex: 1,
    backgroundColor: colors.indigoRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.indigoLine,
    padding: space.md,
    gap: 2,
  },
  value: { fontFamily: fonts.serif, fontSize: 24, color: colors.gold, fontWeight: '700' },
  label: { fontFamily: fonts.sans, fontSize: 13, color: colors.text },
  hint: { fontFamily: fonts.sans, fontSize: 11, color: colors.textFaint },
});
