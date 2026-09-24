import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/theme';
import type { TargetCategory } from '../types';

interface Props {
  category: TargetCategory;
  glyph: string;
  size?: number;
  /** Tint for shapes, e.g. when a dual target shows a coloured shape. */
  tint?: string;
}

/** Renders a target or option visual: a colour swatch, a shape icon or an emoji. */
export function Glyph({ category, glyph, size = 40, tint }: Props) {
  if (category === 'colour') {
    return <View style={[styles.swatch, { width: size, height: size, borderRadius: size / 2, backgroundColor: glyph }]} />;
  }
  if (category === 'shape') {
    return (
      <MaterialCommunityIcons
        name={glyph as keyof typeof MaterialCommunityIcons.glyphMap}
        size={size}
        color={tint ?? colors.goldSoft}
      />
    );
  }
  return <Text style={{ fontSize: size * 0.85, lineHeight: size }}>{glyph}</Text>;
}

const styles = StyleSheet.create({
  swatch: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
});
