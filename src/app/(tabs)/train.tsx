import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { Body, Eyebrow, Heading, Muted, Title } from '../../components/Typography';
import { VerseCarousel } from '../../components/VerseCarousel';
import { colors, space } from '../../constants/theme';
import { levels } from '../../data/levels';
import { tiers } from '../../data/tiers';
import { pct, statsByLevel } from '../../services/stats';
import { useAppState } from '../../state/AppState';
import type { Level, PathId } from '../../types';

const paths: { id: PathId; title: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; text: string }[] = [
  {
    id: 'practice',
    title: 'Practice',
    icon: 'school-outline',
    text: 'Each target is revealed right after you answer, with feedback and a tip. Best for learning.',
  },
  {
    id: 'blind',
    title: 'Blind Test',
    icon: 'shield-lock-outline',
    text: 'Every seal is shown before round one. Nothing is revealed until you finish. Best for proving growth.',
  },
];

function notify(title: string, message: string, onUpgrade?: () => void) {
  if (Platform.OS === 'web') {
    // Alert buttons are not supported on web.
    if (onUpgrade && window.confirm(`${title}\n\n${message}\n\nView memberships?`)) onUpgrade();
    else if (!onUpgrade) window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message, onUpgrade ? [{ text: 'Not now', style: 'cancel' }, { text: 'View memberships', onPress: onUpgrade }] : undefined);
}

export default function Train() {
  const { state, levelAccess, canStartSession, sessionsToday } = useAppState();
  const [path, setPath] = useState<PathId>('practice');
  const tier = tiers[state.tier];
  const stats = new Map(statsByLevel(state.sessions).map((s) => [s.levelId, s]));

  const open = (level: Level) => {
    const access = canStartSession(level);
    if (!access.ok) {
      const upgrade = !levelAccess(level).ok || tier.dailySessionLimit !== null;
      notify(level.title, access.reason ?? 'Locked', upgrade ? () => router.push('/membership') : undefined);
      return;
    }
    const chosen: PathId = level.blindOnly ? 'blind' : path;
    router.push({ pathname: '/session/[levelId]', params: { levelId: String(level.id), path: chosen } });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Eyebrow>{state.displayName ? `Welcome, ${state.displayName}` : 'Welcome'}</Eyebrow>
        <Title>Choose Your Path</Title>
      </View>

      <VerseCarousel />

      <View style={styles.paths}>
        {paths.map((p) => (
          <Card
            key={p.id}
            onPress={() => setPath(p.id)}
            highlighted={path === p.id}
            style={styles.path}
            accessibilityLabel={`${p.title} path${path === p.id ? ', selected' : ''}`}
          >
            <MaterialCommunityIcons name={p.icon} size={26} color={path === p.id ? colors.gold : colors.textMuted} />
            <Heading style={styles.pathTitle}>{p.title}</Heading>
            <Muted>{p.text}</Muted>
          </Card>
        ))}
      </View>

      <View style={styles.levelsHeader}>
        <Heading>Training Levels</Heading>
        <Muted>
          {tier.name} plan
          {tier.dailySessionLimit !== null ? ` · ${Math.max(0, tier.dailySessionLimit - sessionsToday)} sessions left today` : ''}
        </Muted>
      </View>

      {levels.map((level) => {
        const access = levelAccess(level);
        const s = stats.get(level.id);
        return (
          <Card key={level.id} onPress={() => open(level)} style={!access.ok ? styles.locked : undefined} accessibilityLabel={`Level ${level.id}, ${level.title}${access.ok ? '' : ', locked'}`}>
            <View style={styles.levelRow}>
              <View style={[styles.badge, !access.ok && styles.badgeLocked]}>
                {access.ok ? (
                  <Body style={styles.badgeText}>{level.id}</Body>
                ) : (
                  <MaterialCommunityIcons name="lock" size={18} color={colors.textFaint} />
                )}
              </View>
              <View style={styles.levelBody}>
                <Heading style={styles.levelTitle}>{level.title}</Heading>
                <Muted>
                  {level.subtitle} · {level.rounds} rounds{level.blindOnly ? ' · Blind only' : ''}
                </Muted>
                {!access.ok ? (
                  <Muted style={styles.gold}>{access.reason}</Muted>
                ) : s ? (
                  <Muted style={styles.gold}>
                    Your accuracy {pct(s.accuracy)} vs {level.kind === 'describe' ? 'decoy' : 'chance'} {pct(s.baseline)} · {s.sessions} session{s.sessions === 1 ? '' : 's'}
                  </Muted>
                ) : null}
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textFaint} />
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.xs },
  paths: { flexDirection: 'row', gap: space.md },
  path: { flex: 1 },
  pathTitle: { fontSize: 18 },
  levelsHeader: { gap: 2, marginTop: space.sm },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  levelBody: { flex: 1, gap: 2 },
  levelTitle: { fontSize: 18 },
  badge: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  badgeLocked: { backgroundColor: colors.indigo },
  badgeText: { color: colors.night, fontWeight: '700' },
  locked: { opacity: 0.7 },
  gold: { color: colors.goldSoft },
});
