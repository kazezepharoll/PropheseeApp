import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, space } from '../constants/theme';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
}

export function Screen({ children, scroll = true, edges = ['top'], contentStyle }: Props) {
  return (
    <LinearGradient colors={[colors.night, colors.indigo, '#2B2360']} style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={edges}>
        {scroll ? (
          <ScrollView contentContainerStyle={[styles.content, contentStyle]} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.fill, styles.content, contentStyle]}>{children}</View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: space.lg, paddingBottom: space.xxl, gap: space.lg, width: '100%', maxWidth: 640, alignSelf: 'center' },
});
