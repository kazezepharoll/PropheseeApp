import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fonts, space } from '../constants/theme';
import type { RoundResult } from '../types';
import { Card } from './Card';
import { SealBadge } from './SealBadge';
import { Body, Muted } from './Typography';

export function SealProof({ result }: { result: RoundResult }) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button" style={styles.proofHeader}>
        <MaterialCommunityIcons
          name={result.sealVerified ? 'check-decagram' : 'alert-decagram'}
          size={20}
          color={result.sealVerified ? colors.success : colors.danger}
        />
        <Body style={{ flex: 1 }}>{result.sealVerified ? 'Seal verified: target was fixed before you answered' : 'Seal did not match'}</Body>
        <MaterialCommunityIcons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
      </Pressable>
      {open && (
        <View style={styles.proof}>
          <Muted>Seal shown before you answered (SHA-256):</Muted>
          <SealBadge seal={result.seal} full verified={result.sealVerified} />
          <Muted>Recompute it yourself with any SHA-256 tool from this exact text:</Muted>
          <Body style={styles.mono}>{`${result.reveal.targetKey}|${result.reveal.salt}`}</Body>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  proofHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  proof: { gap: space.sm, marginTop: space.sm },
  mono: { fontFamily: fonts.mono, fontSize: 12, color: colors.textMuted },
});
