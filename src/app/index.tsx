import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { Body, Eyebrow, Title } from '../components/Typography';
import { VerseCarousel } from '../components/VerseCarousel';
import { colors, space } from '../constants/theme';
import { useAppState } from '../state/AppState';

export default function Landing() {
  const { state, completeOnboarding } = useAppState();

  if (state.onboarded) return <Redirect href="/train" />;

  const begin = () => {
    completeOnboarding();
    router.replace('/train');
  };

  return (
    <Screen edges={['top', 'bottom']} contentStyle={styles.content}>
      <View style={styles.brand}>
        <MaterialCommunityIcons name="eye-outline" size={44} color={colors.gold} />
        <Title style={styles.center}>PropheSee</Title>
        <Eyebrow style={styles.center}>Train your spiritual perception</Eyebrow>
      </View>

      <VerseCarousel />

      <View style={styles.points}>
        <Point icon="lock" text="Every target is sealed before you see anything." />
        <Point icon="scale-balance" text="Your results always sit next to what chance would score." />
        <Point icon="chart-line" text="Track your growth, one honest session at a time." />
      </View>

      <View style={styles.actions}>
        <Button label="Begin Training" onPress={begin} />
        <Button label="How blind testing works" variant="ghost" onPress={() => router.push('/how-it-works')} />
      </View>
    </Screen>
  );
}

function Point({ icon, text }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; text: string }) {
  return (
    <View style={styles.point}>
      <MaterialCommunityIcons name={icon} size={20} color={colors.gold} />
      <Body style={styles.pointText}>{text}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'space-between', gap: space.xl, paddingTop: space.xxl },
  brand: { alignItems: 'center', gap: space.sm },
  center: { textAlign: 'center' },
  points: { gap: space.md },
  point: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  pointText: { flex: 1 },
  actions: { gap: space.xs },
});

