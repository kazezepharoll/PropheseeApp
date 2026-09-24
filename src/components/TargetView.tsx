import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, space } from '../constants/theme';
import type { Target } from '../types';
import { Glyph } from './Glyph';

interface Props {
  targets: Target[];
  size?: number;
  showLabel?: boolean;
}

/** A revealed target. A colour + shape pair renders as one tinted shape. */
export function TargetView({ targets, size = 72, showLabel = true }: Props) {
  const colour = targets.find((t) => t.category === 'colour');
  const shape = targets.find((t) => t.category === 'shape');
  const label = targets.map((t) => t.label).join(' ');

  let visual;
  if (colour && shape) visual = <Glyph category="shape" glyph={shape.glyph} tint={colour.glyph} size={size} />;
  else if (targets[0].category === 'word') visual = <Text style={[styles.word, { fontSize: size * 0.4 }]}>{targets[0].label}</Text>;
  else visual = <Glyph category={targets[0].category} glyph={targets[0].glyph} size={size} />;

  return (
    <View style={styles.wrap} accessibilityLabel={`Target: ${label}`}>
      <View style={[styles.frame, { minHeight: size + space.xl }]}>{visual}</View>
      {showLabel && targets[0].category !== 'word' ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.sm },
  frame: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.night,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: space.md,
  },
  word: { fontFamily: fonts.serif, color: colors.text },
  label: { fontFamily: fonts.serif, fontSize: 20, color: colors.text },
});
