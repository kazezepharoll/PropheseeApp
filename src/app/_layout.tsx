import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '../constants/theme';
import { AppStateProvider, useAppState } from '../state/AppState';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { ready } = useAppState();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.night },
        headerStyle: { backgroundColor: colors.night },
        headerTintColor: colors.gold,
        headerTitleStyle: { color: colors.text },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="session/[levelId]" options={{ gestureEnabled: false, animation: 'fade' }} />
      <Stack.Screen name="results" options={{ headerShown: true, title: 'Session Results', headerBackTitle: 'Back' }} />
      <Stack.Screen name="trainer" options={{ headerShown: true, title: 'Trainer Session', headerBackTitle: 'Back' }} />
      <Stack.Screen name="how-it-works" options={{ headerShown: true, title: 'How Blind Testing Works', headerBackTitle: 'Back' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
