import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius, space } from '../constants/theme';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  highlighted?: boolean;
  accessibilityLabel?: string;
}

export function Card({ children, onPress, style, highlighted, accessibilityLabel }: Props) {
  const content = [styles.card, highlighted && styles.highlighted, style];
  if (!onPress) return <View style={content}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [...content, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.indigoRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.indigoLine,
    padding: space.lg,
    gap: space.sm,
  },
  highlighted: { borderColor: colors.gold },
  pressed: { opacity: 0.85 },
});
