import assert from 'node:assert/strict';
import { createHash, randomBytes, randomInt } from 'node:crypto';
import { test } from 'node:test';

import { levels } from '../src/data/levels';
import { findTarget, pools } from '../src/data/targets';
import { assertedWords, calibrate, chanceBaseline, scoreDescription, scoreRound } from '../src/services/scoring';
import { createTrial, sealInput, targetsFromKey, type Entropy } from '../src/services/trialFactory';
import type { RoundResult } from '../src/types';

const entropy: Entropy = {
  randomInt: (n) => randomInt(n),
  randomHex: (b) => randomBytes(b).toString('hex'),
  sha256: async (s) => createHash('sha256').update(s).digest('hex'),
};

test('every level produces a trial whose seal matches its target and salt', async () => {
  for (const level of levels) {
    for (let i = 0; i < 20; i++) {
      const { trial, secret } = await createTrial(level, 1, `t${i}`, entropy);
      const digest = await entropy.sha256(sealInput(secret.targetKey, secret.salt));
      assert.equal(trial.seal, digest);
      assert.ok(targetsFromKey(secret.targetKey).length >= 1);
      assert.ok(!JSON.stringify(trial).includes(secret.salt), 'salt must not leak into the public trial');
    }
  }
});

test('choice trials include the target among the options and never leak it', async () => {
  const words = levels.find((l) => l.id === 3)!;
  for (let i = 0; i < 50; i++) {
    const { trial, secret } = await createTrial(words, 1, 'x', entropy);
    assert.equal(trial.options.length, 4);
    assert.ok(trial.options.some((o) => o.id === secret.targetKey));
    assert.equal(new Set(trial.options.map((o) => o.id)).size, 4);
  }
});

test('describe trials pick a decoy different from the target, in the same category', async () => {
  const scenes = levels.find((l) => l.id === 6)!;
  for (let i = 0; i < 50; i++) {
    const { secret } = await createTrial(scenes, 1, 'x', entropy);
    assert.ok(secret.decoyId && secret.decoyId !== secret.targetKey);
    assert.equal(findTarget(secret.decoyId!)!.category, findTarget(secret.targetKey)!.category);
  }
});

test('chance baselines: 1/6 colours, 1/4 words, 1/6 colour+shape', async () => {
  const [l1, , l3, l4] = levels;
  const t1 = (await createTrial(l1, 1, 'a', entropy)).trial;
  const t3 = (await createTrial(l3, 1, 'b', entropy)).trial;
  const t4 = (await createTrial(l4, 1, 'c', entropy)).trial;
  assert.equal(chanceBaseline(l1, t1), 1 / 6);
  assert.equal(chanceBaseline(l3, t3), 1 / 4);
  assert.equal(chanceBaseline(l4, t4), 1 / 6);
});

test('negation is respected in descriptions', () => {
  const words = assertedWords('It was not red, but round and sweet');
  assert.ok(!words.has('red'));
  assert.ok(words.has('round'));
  const apple = findTarget('o-apple')!;
  const s = scoreDescription('not red, round and sweet fruit', apple.attributes);
  assert.deepEqual(s.matched, ['round', 'fruit', 'sweet']);
});

test('plural forms match singular synonyms', () => {
  const lighthouse = findTarget('p-lighthouse')!;
  assert.ok(scoreDescription('cliff by waves', lighthouse.attributes).score > 0);
  assert.ok(scoreDescription('cliffs', lighthouse.attributes).matched.includes('cliff'));
});

test('dual rounds score half for each correct part', async () => {
  const l4 = levels.find((l) => l.id === 4)!;
  const { trial, secret } = await createTrial(l4, 1, 'd', entropy);
  const targets = targetsFromKey(secret.targetKey);
  const reveal = { trialId: 'd', targetKey: secret.targetKey, salt: secret.salt, targets };
  const wrongShape = pools.shape.find((s) => s.id !== targets[1].id)!.id;
  assert.equal(scoreRound(l4, trial, { choiceIds: [targets[0].id, targets[1].id] }, reveal).score, 1);
  assert.equal(scoreRound(l4, trial, { choiceIds: [targets[0].id, wrongShape] }, reveal).score, 0.5);
});

test('calibration detects when confidence tracks accuracy', () => {
  const mk = (confidence: number, score: number) => ({ perception: { confidence }, score }) as RoundResult;
  const good = calibrate([mk(5, 1), mk(4, 1), mk(1, 0), mk(2, 0), mk(3, 0.5)]);
  assert.ok((good.correlation ?? 0) > 0.9);
  assert.match(good.verdict, /Well calibrated/);
  assert.match(calibrate([mk(3, 1)]).verdict, /few more rounds/);
});

test('every target id is unique and every describe target has attributes', () => {
  const all = Object.values(pools).flat();
  assert.equal(new Set(all.map((t) => t.id)).size, all.length);
  for (const t of [...pools.object, ...pools.scene]) assert.ok((t.attributes?.length ?? 0) >= 5, t.id);
});

test('negation ends at the clause boundary', () => {
  const words = assertedWords('no people but many boats; not cold warm');
  assert.ok(!words.has('people'));
  assert.ok(words.has('many') && words.has('boats'));
  assert.ok(!words.has('cold') && !words.has('warm'));
});
