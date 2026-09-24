import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ComparisonBar } from '../../components/ComparisonBar';
import { ConfidencePicker } from '../../components/ConfidencePicker';
import { OptionGrid } from '../../components/OptionGrid';
import { Screen } from '../../components/Screen';
import { SealBadge } from '../../components/SealBadge';
import { SealProof } from '../../components/SealProof';
import { TargetView } from '../../components/TargetView';
import { Body, Eyebrow, Heading, Muted, Title } from '../../components/Typography';
import { colors, fonts, radius, space } from '../../constants/theme';
import { getLevel } from '../../data/levels';
import { tiers } from '../../data/tiers';
import { isServerMode } from '../../services/api';
import { answerLabel, tipFor } from '../../services/describe';
import { newId } from '../../services/entropy';
import { average, feedbackFor, scoreRound, xpFor } from '../../services/scoring';
import { commitPerception, discardSession, revealTarget, startSession, verifySeal } from '../../services/targetService';
import { useAppState, type Access } from '../../state/AppState';
import type { Level, PathId, Perception, RoundResult, SealedTrial } from '../../types';

type Phase = 'loading' | 'overview' | 'concealed' | 'perceive' | 'revealing' | 'reveal' | 'finishing' | 'error';

function confirmLeave(onLeave: () => void) {
  const message = 'Your answers in this session will not be saved.';
  if (Platform.OS === 'web') {
    if (window.confirm(`Leave this session?\n\n${message}`)) onLeave();
    return;
  }
  Alert.alert('Leave this session?', message, [
    { text: 'Stay', style: 'cancel' },
    { text: 'Leave', style: 'destructive', onPress: onLeave },
  ]);
}

export default function SessionScreen() {
  const params = useLocalSearchParams<{ levelId: string; path?: string }>();
  const level = getLevel(Number(params.levelId));
  const { canStartSession } = useAppState();
  const [access] = useState<Access>(() => (level ? canStartSession(level) : { ok: false }));

  if (!level) {
    return (
      <Screen>
        <Title>Level not found</Title>
        <Button label="Back to levels" onPress={() => router.replace('/train')} />
      </Screen>
    );
  }
  if (!access.ok) {
    return (
      <Screen>
        <Title>{level.title}</Title>
        <Body>{access.reason}</Body>
        <Button label="View memberships" onPress={() => router.replace('/membership')} />
      </Screen>
    );
  }
  const path: PathId = level.blindOnly || params.path === 'blind' ? 'blind' : 'practice';
  return <Session level={level} path={path} />;
}

function Session({ level, path }: { level: Level; path: PathId }) {
  const { state, addSession } = useAppState();
  const calibration = tiers[state.tier].calibration;
  const blind = path === 'blind';

  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState('');
  const [trials, setTrials] = useState<SealedTrial[]>([]);
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<Perception>({});
  const [results, setResults] = useState<RoundResult[]>([]);
  const pending = useRef<{ trial: SealedTrial; perception: Perception }[]>([]);
  const startedAt = useRef(new Date().toISOString());
  const saved = useRef(false);

  useEffect(() => {
    let alive = true;
    startSession(level, path)
      .then((t) => {
        if (!alive) return;
        setTrials(t);
        setPhase('overview');
      })
      .catch((e: Error) => {
        if (!alive) return;
        setError(e.message);
        setPhase('error');
      });
    return () => {
      alive = false;
    };
  }, [level, path]);

  useEffect(() => () => discardSession(trials), [trials]);

  const trial = trials[index];
  const current = results[results.length - 1];

  const answered =
    level.kind === 'choice'
      ? !!draft.choiceIds?.[0]
      : level.kind === 'dual'
        ? !!draft.choiceIds?.[0] && !!draft.choiceIds?.[1]
        : (draft.text?.trim().length ?? 0) >= 3;
  const canSubmit = answered && (!calibration || draft.confidence !== undefined);

  async function resolve(t: SealedTrial, perception: Perception): Promise<RoundResult> {
    const reveal = await revealTarget(t, perception);
    const result = scoreRound(level, t, perception, reveal);
    result.sealVerified = await verifySeal(t.seal, reveal.targetKey, reveal.salt);
    return result;
  }

  async function finish(all: RoundResult[]) {
    if (saved.current) return;
    saved.current = true;
    const id = newId();
    addSession({
      id,
      levelId: level.id,
      path,
      startedAt: startedAt.current,
      finishedAt: new Date().toISOString(),
      rounds: all,
      accuracy: average(all.map((r) => r.score)),
      baseline: average(all.map((r) => r.baseline)),
      xp: xpFor(all),
    });
    router.replace({ pathname: '/results', params: { id } });
  }

  async function submit() {
    if (!trial || !canSubmit) return;
    const perception: Perception = {
      ...(level.kind === 'describe' ? { text: draft.text?.trim() ?? '' } : { choiceIds: draft.choiceIds }),
      ...(calibration ? { confidence: draft.confidence } : {}),
    };
    setDraft({});
    const last = index === trials.length - 1;

    try {
      if (blind) {
        await commitPerception(trial, perception);
        pending.current.push({ trial, perception });
        if (!last) {
          setIndex(index + 1);
          setPhase('concealed');
          return;
        }
        setPhase('finishing');
        const all: RoundResult[] = [];
        for (const p of pending.current) all.push(await resolve(p.trial, p.perception));
        await finish(all);
      } else {
        setPhase('revealing');
        const result = await resolve(trial, perception);
        setResults((r) => [...r, result]);
        setPhase('reveal');
      }
    } catch (e) {
      setError((e as Error).message);
      setPhase('error');
    }
  }

  function next() {
    if (index === trials.length - 1) {
      setPhase('finishing');
      finish(results);
      return;
    }
    setIndex(index + 1);
    setPhase('concealed');
  }

  const leave = () => {
    if (phase === 'overview' || phase === 'loading' || phase === 'error') router.back();
    else confirmLeave(() => router.back());
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={leave} accessibilityRole="button" accessibilityLabel="Leave session" hitSlop={12}>
          <MaterialCommunityIcons name="close" size={26} color={colors.textMuted} />
        </Pressable>
        <Eyebrow>
          Level {level.id} · {level.title} · {blind ? 'Blind Test' : 'Practice'}
        </Eyebrow>
        <View style={{ width: 26 }} />
      </View>

      {trials.length > 0 && phase !== 'overview' && (
        <View style={styles.progress}>
          {trials.map((t, i) => (
            <View key={t.trialId} style={[styles.progressDot, i < index && styles.progressDone, i === index && styles.progressNow]} />
          ))}
        </View>
      )}

      {phase === 'loading' && <Centered text="Sealing your targets…" />}
      {phase === 'finishing' && <Centered text={blind ? 'Opening the seals…' : 'Saving your session…'} />}
      {phase === 'revealing' && <Centered text="Opening the seal…" />}

      {phase === 'error' && (
        <Card>
          <Heading>Something went wrong</Heading>
          <Body>{error}</Body>
          <Button label="Back to levels" onPress={() => router.replace('/train')} />
        </Card>
      )}

      {phase === 'overview' && (
        <>
          <Title>{level.title}</Title>
          <Body>{level.description}</Body>
          {blind ? (
            <Card>
              <Heading style={styles.small}>Your sealed targets</Heading>
              <Muted>
                These fingerprints were fixed before you begin. After the final round each one is opened and checked, so no target can be
                swapped after you answer.
              </Muted>
              {trials.map((t) => (
                <View key={t.trialId} style={styles.sealRow}>
                  <Muted style={styles.sealRound}>Round {t.round}</Muted>
                  <View style={{ flex: 1 }}>
                    <SealBadge seal={t.seal} />
                  </View>
                </View>
              ))}
            </Card>
          ) : (
            <Card>
              <Heading style={styles.small}>How practice works</Heading>
              <Muted>
                Each round shows the seal of a hidden target. Answer, and the target is revealed with feedback. The seal is then checked
                against the target so you know it was fixed before you answered.
              </Muted>
            </Card>
          )}
          {!isServerMode && (
            <Muted style={styles.note}>Offline mode: targets are sealed on this device.</Muted>
          )}
          <Button label="Begin" onPress={() => setPhase('concealed')} />
        </>
      )}

      {phase === 'concealed' && trial && (
        <>
          <Eyebrow>
            Round {trial.round} of {trials.length}
          </Eyebrow>
          <View style={styles.veil}>
            <MaterialCommunityIcons name="eye-off-outline" size={48} color={colors.gold} />
            <Heading style={styles.center}>The target is sealed</Heading>
            <Muted style={styles.center}>Be still. Breathe slowly. Notice the first impression that comes, then hold it.</Muted>
          </View>
          <SealBadge seal={trial.seal} />
          <Button label="I'm ready" onPress={() => setPhase('perceive')} />
        </>
      )}

      {phase === 'perceive' && trial && (
        <>
          <Eyebrow>
            Round {trial.round} of {trials.length}
          </Eyebrow>
          <Heading>{promptFor(level)}</Heading>
          <SealBadge seal={trial.seal} />

          {level.kind === 'choice' && (
            <OptionGrid
              options={trial.options}
              selectedId={draft.choiceIds?.[0]}
              onSelect={(id) => setDraft((d) => ({ ...d, choiceIds: [id] }))}
              columns={trial.options.length === 4 ? 2 : 3}
            />
          )}

          {level.kind === 'dual' && (
            <>
              <Muted>Colour</Muted>
              <OptionGrid
                options={trial.options}
                selectedId={draft.choiceIds?.[0]}
                onSelect={(id) => setDraft((d) => ({ ...d, choiceIds: [id, d.choiceIds?.[1] ?? ''] }))}
              />
              <Muted>Shape</Muted>
              <OptionGrid
                options={trial.secondaryOptions ?? []}
                selectedId={draft.choiceIds?.[1] || undefined}
                onSelect={(id) => setDraft((d) => ({ ...d, choiceIds: [d.choiceIds?.[0] ?? '', id] }))}
              />
            </>
          )}

          {level.kind === 'describe' && (
            <>
              <TextInput
                value={draft.text ?? ''}
                onChangeText={(text) => setDraft((d) => ({ ...d, text }))}
                placeholder="Colours, shapes, textures, sounds, temperature, feelings…"
                placeholderTextColor={colors.textFaint}
                multiline
                maxLength={400}
                style={styles.input}
                accessibilityLabel="Describe your perception"
              />
              <Muted>Write a few specific impressions. Listing many possibilities raises the decoy score too.</Muted>
            </>
          )}

          {calibration && <ConfidencePicker value={draft.confidence} onChange={(confidence) => setDraft((d) => ({ ...d, confidence }))} />}

          <Button label={blind ? (index === trials.length - 1 ? 'Seal my answers' : 'Record and continue') : 'Reveal the target'} onPress={submit} disabled={!canSubmit} />
        </>
      )}

      {phase === 'reveal' && current && (
        <>
          <Eyebrow>
            Round {current.round} of {trials.length}
          </Eyebrow>
          <TargetView targets={current.reveal.targets} />
          <Card>
            <Muted>Your perception</Muted>
            <Body>{answerLabel(current.perception)}</Body>
            {current.matchedTerms && current.matchedTerms.length > 0 && <Muted style={styles.gold}>Matched: {current.matchedTerms.join(', ')}</Muted>}
            <Body style={styles.feedback}>{feedbackFor(current, level)}</Body>
            <ComparisonBar
              label="This round"
              value={current.score}
              baseline={current.baseline}
              baselineLabel={level.kind === 'describe' ? `Decoy: ${current.reveal.decoy?.label ?? '—'}` : 'Chance'}
            />
          </Card>

          <Card>
            <View style={styles.tipRow}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={colors.gold} />
              <Body style={{ flex: 1 }}>{tipFor(current.reveal.targets, current.round)}</Body>
            </View>
          </Card>

          <SealProof result={current} />

          <Button label={index === trials.length - 1 ? 'See results' : 'Next round'} onPress={next} />
        </>
      )}
    </Screen>
  );
}

function promptFor(level: Level): string {
  switch (level.kind) {
    case 'choice':
      return level.categories[0] === 'word' ? 'Which word is sealed?' : `Which ${level.categories[0]} is sealed?`;
    case 'dual':
      return 'Which colour and which shape?';
    default:
      return 'Describe what you perceive';
  }
}

function Centered({ text }: { text: string }) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator color={colors.gold} size="large" />
      <Muted>{text}</Muted>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progress: { flexDirection: 'row', gap: 4 },
  progressDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.indigoLine },
  progressDone: { backgroundColor: colors.goldSoft },
  progressNow: { backgroundColor: colors.gold },
  centered: { alignItems: 'center', gap: space.md, paddingVertical: space.xxl * 2 },
  small: { fontSize: 18 },
  sealRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  sealRound: { width: 64 },
  note: { textAlign: 'center' },
  veil: {
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.xxl,
    paddingHorizontal: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.indigoLine,
    backgroundColor: colors.night,
  },
  center: { textAlign: 'center' },
  input: {
    minHeight: 130,
    textAlignVertical: 'top',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.indigoLine,
    backgroundColor: colors.indigoRaised,
    color: colors.text,
    padding: space.md,
    fontFamily: fonts.sans,
    fontSize: 16,
  },
  gold: { color: colors.goldSoft },
  feedback: { marginVertical: space.xs },
  tipRow: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
});
