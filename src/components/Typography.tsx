import type { ReactNode } from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';

import { colors, fonts } from '../constants/theme';

interface Props {
  children: ReactNode;
  style?: TextStyle | TextStyle[];
  numberOfLines?: number;
}

export function Title({ children, style }: Props) {
  return <Text style={[styles.title, style]} accessibilityRole="header">{children}</Text>;
}

export function Heading({ children, style }: Props) {
  return <Text style={[styles.heading, style]} accessibilityRole="header">{children}</Text>;
}

export function Body({ children, style, numberOfLines }: Props) {
  return <Text style={[styles.body, style]} numberOfLines={numberOfLines}>{children}</Text>;
}

export function Muted({ children, style, numberOfLines }: Props) {
  return <Text style={[styles.muted, style]} numberOfLines={numberOfLines}>{children}</Text>;
}

export function Eyebrow({ children, style }: Props) {
  return <Text style={[styles.eyebrow, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 38, color: colors.text, fontWeight: '600' },
  heading: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 28, color: colors.text, fontWeight: '600' },
  body: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 23, color: colors.text },
  muted: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  eyebrow: { fontFamily: fonts.sans, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.gold, fontWeight: '700' },
});
