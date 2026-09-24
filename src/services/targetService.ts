import { findTarget } from '../data/targets';
import type { Level, PathId, Perception, Reveal, SealedTrial } from '../types';
import { api, isServerMode } from './api';
import { deviceEntropy, newId } from './entropy';
import { createTrial, sealInput, targetsFromKey, type TrialSecret } from './trialFactory';

/**
 * Local-mode secrets live only in this module, never in React state or storage.
 * This is still readable by a determined user; server mode is the real blind test.
 */
const localSecrets = new Map<string, TrialSecret>();

/** Seal a single target for one round. */
export async function getTarget(level: Level, round: number): Promise<SealedTrial> {
  const { trial, secret } = await createTrial(level, round, newId(), deviceEntropy);
  localSecrets.set(trial.trialId, secret);
  return trial;
}

/** Seal every round of a session before the first round begins. */
export async function startSession(level: Level, path: PathId): Promise<SealedTrial[]> {
  if (isServerMode) {
    const res = await api.post<{ trials: SealedTrial[] }>('/training/sessions', { levelId: level.id, path });
    return res.trials;
  }
  const trials: SealedTrial[] = [];
  for (let round = 1; round <= level.rounds; round++) trials.push(await getTarget(level, round));
  return trials;
}

/** Lock in an answer without revealing. Blind sessions commit every round before any reveal. */
export async function commitPerception(trial: SealedTrial, perception: Perception): Promise<void> {
  if (isServerMode) await api.post(`/training/trials/${trial.trialId}/commit`, { perception });
}

/** Submit the perception and receive the target. The perception is committed first. */
export async function revealTarget(trial: SealedTrial, perception: Perception): Promise<Reveal> {
  let secret: TrialSecret;
  if (isServerMode) {
    secret = await api.post<TrialSecret>(`/training/trials/${trial.trialId}/reveal`, { perception });
  } else {
    const s = localSecrets.get(trial.trialId);
    if (!s) throw new Error('This target is no longer available. Please start a new session.');
    localSecrets.delete(trial.trialId);
    secret = s;
  }
  return {
    trialId: trial.trialId,
    targetKey: secret.targetKey,
    salt: secret.salt,
    targets: targetsFromKey(secret.targetKey),
    decoy: secret.decoyId ? findTarget(secret.decoyId) : undefined,
  };
}

/** Recompute the fingerprint from the revealed target and salt, and compare with the seal shown before answering. */
export async function verifySeal(seal: string, targetKey: string, salt: string): Promise<boolean> {
  const digest = await deviceEntropy.sha256(sealInput(targetKey, salt));
  return digest === seal;
}

export function discardSession(trials: SealedTrial[]): void {
  trials.forEach((t) => localSecrets.delete(t.trialId));
}
