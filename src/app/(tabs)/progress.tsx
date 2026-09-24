import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ComparisonBar } from '../../components/ComparisonBar';
import { Screen } from '../../components/Screen';
import { SealBadge } from '../../components/SealBadge';
import { Stat, StatRow } from '../../components/Stat';
import { Body, Eyebrow, Heading, Muted, Title } from '../../components/Typography';
import { colors, space } from '../../constants/theme';
import { getLevel } from '../../data/levels';
import { tiers } from '../../data/tiers';
import { average, calibrate } from '../../services/scoring';
import { allRounds, pct, statsByLevel, streakDays } from '../../services/stats';
import { useAppState } from '../../state/AppState';

export default function Progress() {
  const { state } = useAppState();
  const tier = tiers[state.tier];
  const sessions = state.sessions;

  if (sessions.length === 0) {
    return (
      <Screen>
        <Title>Progress</Title>
        <Card>
          <Heading>No sessions yet</Heading>
          <Body>Finish your first session and your accuracy, streak and growth will appear here, always next to a fair comparison.</Body>
          <Button label="Start training" onPress={() => router.navigate('/train')} />
        </Card>
      </Screen>
    );
  }

  const rounds = allRounds(sessions);
  const xp = sessions.reduce((sum, s) => sum + s.xp, 0);
  const byLevel = statsByLevel(sessions);
  const cal = calibrate(rounds);
  const recent = [...sessions].reverse().slice(0, 10);

  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <Eyebrow>{tier.name} plan</Eyebrow>
        <Title>Progress</Title>
      </View>

      <StatRow>
        <Stat label="Sessions" value={String(sessions.length)} />
        <Stat label="Day streak" value={String(streakDays(sessions))} />
        <Stat label="Total XP" value={String(xp)} />
      </StatRow>

      <Card>
        <Heading style={styles.small}>Overall</Heading>
        <ComparisonBar label="Your accuracy" value={average(rounds.map((r) => r.score))} baseline={average(rounds.map((r) => r.baseline))} baselineLabel="Fair comparison" />
        <Muted>The fair comparison is chance for choice levels and a random decoy target for describe levels.</Muted>
      </Card>

      <Heading>By level</Heading>
      {byLevel.map((s) => (
        <Card key={s.levelId}>
          <View style={styles.between}>
            <Body style={styles.bold}>
              {s.levelId}. {s.title}
            </Body>
            <Muted>
              {s.sessions} session{s.sessions === 1 ? '' : 's'} · best {pct(s.best)}
            </Muted>
          </View>
          <ComparisonBar
            label="Accuracy"
            value={s.accuracy}
            baseline={s.baseline}
            baselineLabel={getLevel(s.levelId)?.kind === 'describe' ? 'Decoy' : 'Chance'}
          />
        </Card>
      ))}

      {tier.calibration && cal.count > 0 && (
        <Card>
          <Heading style={styles.small}>Confidence calibration</Heading>
          <Body>{cal.verdict}</Body>
          <Muted>
            {cal.count} rated rounds · confident answers {cal.highConfidenceAccuracy === null ? '—' : pct(cal.highConfidenceAccuracy)} · unsure
            answers {cal.lowConfidenceAccuracy === null ? '—' : pct(cal.lowConfidenceAccuracy)}
          </Muted>
        </Card>
      )}

      <Heading>Recent sessions</Heading>
      {recent.map((s) => (
        <Card key={s.id} onPress={() => router.push({ pathname: '/results', params: { id: s.id } })}>
          <View style={styles.between}>
            <Body style={styles.bold}>{getLevel(s.levelId)?.title ?? `Level ${s.levelId}`}</Body>
            <Muted>{new Date(s.finishedAt).toLocaleDateString()}</Muted>
          </View>
          <Muted>
            {s.path === 'blind' ? 'Blind Test' : 'Practice'} · {pct(s.accuracy)} vs {pct(s.baseline)} · +{s.xp} XP
          </Muted>
        </Card>
      ))}

      {tier.ledger ? (
        <Card>
          <Heading style={styles.small}>Seal ledger</Heading>
          <Muted>Every round you have played, with the fingerprint that was fixed before you answered.</Muted>
          {rounds
            .slice(-30)
            .reverse()
            .map((r) => (
              <View key={r.trialId} style={{ gap: 2 }}>
                <Muted style={styles.gold}>
                  {r.reveal.targets.map((t) => t.label).join(' ')} · {pct(r.score)}
                </Muted>
                <SealBadge seal={r.seal} verified={r.sealVerified} />
              </View>
            ))}
        </Card>
      ) : (
        <Muted style={styles.center}>Master members also get a full seal ledger of every round.</Muted>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  small: { fontSize: 18 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  bold: { fontWeight: '700' },
  gold: { color: colors.goldSoft },
  center: { textAlign: 'center' },
});
