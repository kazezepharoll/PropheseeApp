import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { colors, fonts, radius, space } from '../constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', disabled, loading, style }: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
      disabled={inactive}
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !inactive && styles.pressed,
        inactive && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.night : colors.gold} />
      ) : (
        <Text style={[styles.label, variant === 'primary' ? styles.labelPrimary : styles.labelOther]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 52, borderRadius: radius.pill, paddingHorizontal: space.xl, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.gold },
  secondary: { borderWidth: 1.5, borderColor: colors.gold, backgroundColor: 'transparent' },
  ghost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
  label: { fontFamily: fonts.sans, fontSize: 16, fontWeight: '700' },
  labelPrimary: { color: colors.night },
  labelOther: { color: colors.gold },
});
