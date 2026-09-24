import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { Body, Heading, Muted, Title } from '../../components/Typography';
import { appVersion } from '../../constants/config';
import { colors, fonts, radius, space } from '../../constants/theme';
import { tiers } from '../../data/tiers';
import { isServerMode } from '../../services/api';
import { useAppState } from '../../state/AppState';

export default function Profile() {
  const { state, setDisplayName, resetProgress } = useAppState();
  const [name, setName] = useState(state.displayName);

  const confirmReset = () => {
    const message = 'This deletes all sessions and bookings on this device. It cannot be undone.';
    if (Platform.OS === 'web') {
      if (window.confirm(`Reset progress?\n\n${message}`)) resetProgress();
      return;
    }
    Alert.alert('Reset progress?', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => resetProgress() },
    ]);
  };

  return (
    <Screen>
      <Title>Profile</Title>

      <Card>
        <Heading style={styles.small}>Your name</Heading>
        <TextInput
          value={name}
          onChangeText={setName}
          onBlur={() => setDisplayName(name.trim())}
          onSubmitEditing={() => setDisplayName(name.trim())}
          placeholder="How should we greet you?"
          placeholderTextColor={colors.textFaint}
          maxLength={40}
          style={styles.input}
          returnKeyType="done"
          accessibilityLabel="Your name"
        />
        <Muted>Plan: {tiers[state.tier].name}</Muted>
      </Card>

      <Card onPress={() => router.push('/how-it-works')}>
        <View style={styles.row}>
          <MaterialCommunityIcons name="shield-check-outline" size={22} color={colors.gold} />
          <Body style={{ flex: 1 }}>How blind testing works</Body>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textFaint} />
        </View>
      </Card>

      <Card onPress={() => router.push('/privacy')}>
        <View style={styles.row}>
          <MaterialCommunityIcons name="lock-outline" size={22} color={colors.gold} />
          <Body style={{ flex: 1 }}>Privacy policy and terms</Body>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textFaint} />
        </View>
      </Card>

      {state.bookings.length > 0 && (
        <Card>
          <Heading style={styles.small}>Trainer requests</Heading>
          {state.bookings.map((b) => (
            <Muted key={b.id}>
              {new Date(b.createdAt).toLocaleDateString()} · {b.preferredTime}
            </Muted>
          ))}
        </Card>
      )}

      <Card>
        <Heading style={styles.small}>Your data</Heading>
        <Muted>
          Your sessions, progress and settings are stored only on this device.{' '}
          {isServerMode
            ? 'Targets are sealed by the PropheSee server, which receives your answers so it can open each seal.'
            : 'Targets are sealed on this device.'}
        </Muted>
        <Button label="Reset progress" variant="secondary" onPress={confirmReset} />
      </Card>

      <Muted style={styles.center}>PropheSee v{appVersion}</Muted>
    </Screen>
  );
}

const styles = StyleSheet.create({
  small: { fontSize: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  input: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.indigoLine,
    backgroundColor: colors.indigo,
    color: colors.text,
    padding: space.md,
    fontFamily: fonts.sans,
    fontSize: 16,
  },
  center: { textAlign: 'center' },
});
