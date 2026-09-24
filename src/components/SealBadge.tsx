import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, space } from '../constants/theme';

interface Props {
  seal: string;
  verified?: boolean;
  full?: boolean;
}

export function SealBadge({ seal, verified, full }: Props) {
  const icon = verified === true ? 'check-decagram' : verified === false ? 'alert-decagram' : 'lock';
  const tint = verified === true ? colors.success : verified === false ? colors.danger : colors.gold;
  return (
    <View style={styles.row} accessibilityLabel={`Seal ${seal}`}>
      <MaterialCommunityIcons name={icon} size={16} color={tint} />
      <Text style={styles.hash} numberOfLines={full ? 3 : 1} selectable>
        {full ? seal : `${seal.slice(0, 12)}…${seal.slice(-6)}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: 'rgba(233,185,73,0.08)',
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  hash: { flex: 1, fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted },
});
