import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ComparisonBar } from '../components/ComparisonBar';
import { Screen } from '../components/Screen';
import { SealProof } from '../components/SealProof';
import { Stat, StatRow } from '../components/Stat';
import { TargetView } from '../components/TargetView';
import { Body, Eyebrow, Heading, Muted, Title } from '../components/Typography';
import { colors, space } from '../constants/theme';
import { getLevel } from '../data/levels';
import { generalTips } from '../data/tips';
import { tiers } from '../data/tiers';
import { answerLabel } from '../services/describe';
import { calibrate, feedbackFor } from '../services/scoring';
import { pct } from '../services/stats';
import { useAppState } from '../state/AppState';

function summary(accuracy: number, baseline: number): string {
  const edge = accuracy - baseline;
  if (edge > 0.15) return 'Well above the fair comparison. Keep training under the same conditions to see if it holds.';
  if (edge > 0.02) return 'Above the fair comparison this session. One session is a small sample; the trend over many is what matters.';
  if (edge >= -0.02) return 'About what chance alone would score. That is normal early on. Stay consistent.';
  return 'Below the fair comparison this session. Rest, then come back with a quiet mind.';
}

export default function Results() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useAppState();
  const session = state.sessions.find((s) => s.id === id);
  const level = session ? getLevel(session.levelId) : undefined;

  if (!session || !level) {
    return (
      <Screen edges={[]}>
        <Body>This session could not be found.</Body>
        <Button label="Back to levels" onPress={() => router.replace('/train')} />
      </Screen>
    );
  }

  const describe = level.kind === 'describe';
  const showCalibration = tiers[state.tier].calibration && session.rounds.some((r) => r.perception.confidence !== undefined);
  const cal = calibrate(session.rounds);
  const verified = session.rounds.filter((r) => r.sealVerified).length;
  const tip = generalTips[new Date(session.finishedAt).getMinutes() % generalTips.length];

  return (
    <Screen edges={[]}>
      <View style={{ gap: space.xs }}>
        <Eyebrow>
          Level {level.id} · {level.title} · {session.path === 'blind' ? 'Blind Test' : 'Practice'}
        </Eyebrow>
        <Title>Session Results</Title>
      </View>

      <StatRow>
        <Stat label="Accuracy" value={pct(session.accuracy)} />
        <Stat label={describe ? 'Decoy score' : 'Chance'} value={pct(session.baseline)} />
        <Stat label="XP earned" value={`+${session.xp}`} />
      </StatRow>

      <Card>
        <ComparisonBar label="You" value={session.accuracy} baseline={session.baseline} baselineLabel={describe ? 'Decoy targets' : 'Chance alone'} />
        <Body>{summary(session.accuracy, session.baseline)}</Body>
      </Card>

      <Card>
        <View style={styles.row}>
          <MaterialCommunityIcons name="check-decagram" size={20} color={verified === session.rounds.length ? colors.success : colors.danger} />
          <Body style={{ flex: 1 }}>
            {verified} of {session.rounds.length} seals verified
          </Body>
        </View>
        <Muted>Every target was fingerprinted before you answered, and each fingerprint was recomputed after the reveal.</Muted>
      </Card>

      {showCalibration && (
        <Card>
          <Heading style={styles.small}>Confidence calibration</Heading>
          <Body>{cal.verdict}</Body>
          <Muted>
            Confident answers (4–5): {cal.highConfidenceAccuracy === null ? '—' : pct(cal.highConfidenceAccuracy)} · Unsure answers (1–2):{' '}
            {cal.lowConfidenceAccuracy === null ? '—' : pct(cal.lowConfidenceAccuracy)}
          </Muted>
        </Card>
      )}

      <Heading>Round by round</Heading>
      {session.rounds.map((r) => (
        <Card key={r.trialId}>
          <View style={styles.row}>
            <View style={styles.thumb}>
              <TargetView targets={r.reveal.targets} size={36} showLabel={false} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Muted>Round {r.round} · Target: {r.reveal.targets.map((t) => t.label).join(' ')}</Muted>
              <Body>You: {answerLabel(r.perception)}</Body>
              <Muted style={styles.gold}>
                Score {pct(r.score)} · {describe ? `decoy ${pct(r.baseline)}` : `chance ${pct(r.baseline)}`}
                {r.perception.confidence ? ` · confidence ${r.perception.confidence}/5` : ''}
              </Muted>
            </View>
          </View>
          {session.path === 'blind' && <Muted>{feedbackFor(r, level)}</Muted>}
          <SealProof result={r} />
        </Card>
      ))}

      <Card>
        <View style={styles.row}>
          <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={colors.gold} />
          <Body style={{ flex: 1 }}>{tip}</Body>
        </View>
      </Card>

      <Button label="Train again" onPress={() => router.replace({ pathname: '/session/[levelId]', params: { levelId: String(level.id), path: session.path } })} />
      <Button label="Back to levels" variant="secondary" onPress={() => router.replace('/train')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  small: { fontSize: 18 },
  thumb: { width: 72 },
  gold: { color: colors.goldSoft },
});
