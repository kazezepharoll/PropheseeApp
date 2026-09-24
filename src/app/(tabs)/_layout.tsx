import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';

import { colors } from '../../constants/theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

function icon(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => <MaterialCommunityIcons name={name} color={color as string} size={size} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: { backgroundColor: colors.night, borderTopColor: colors.indigoLine },
        sceneStyle: { backgroundColor: colors.night },
      }}
    >
      <Tabs.Screen name="train" options={{ title: 'Train', tabBarIcon: icon('eye-outline') }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: icon('chart-line') }} />
      <Tabs.Screen name="membership" options={{ title: 'Membership', tabBarIcon: icon('crown-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('account-circle-outline') }} />
    </Tabs>
  );
}
