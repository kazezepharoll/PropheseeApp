import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import { after, before, test } from 'node:test';

const PORT = 18787;
const base = `http://127.0.0.1:${PORT}`;
let server: ChildProcess;

before(async () => {
  server = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${base}/health`)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('server did not start');
});

after(() => server.kill());

const post = (path: string, body: unknown) =>
  fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('practice: reveal requires a perception and returns a secret matching the seal', async () => {
  const res = await post('/training/sessions', { levelId: 1, path: 'practice' });
  assert.equal(res.status, 201);
  const { trials } = await res.json();
  assert.equal(trials.length, 8);
  const t = trials[0];
  assert.equal((await post(`/training/trials/${t.trialId}/reveal`, {})).status, 409);
  const reveal = await post(`/training/trials/${t.trialId}/reveal`, { perception: { choiceIds: [t.options[0].id] } });
  assert.equal(reveal.status, 200);
  const secret = await reveal.json();
  assert.equal(createHash('sha256').update(`${secret.targetKey}|${secret.salt}`).digest('hex'), t.seal);
});

test('blind: no reveal until every round is committed', async () => {
  const { trials } = await (await post('/training/sessions', { levelId: 7 })).json();
  const perception = { text: 'water and rocks' };
  await post(`/training/trials/${trials[0].trialId}/commit`, { perception });
  assert.equal((await post(`/training/trials/${trials[0].trialId}/reveal`, {})).status, 409);
  for (const t of trials.slice(1)) assert.equal((await post(`/training/trials/${t.trialId}/commit`, { perception })).status, 200);
  const reveal = await post(`/training/trials/${trials[0].trialId}/reveal`, {});
  assert.equal(reveal.status, 200);
  assert.ok((await reveal.json()).decoyId);
});

test('rejects unknown levels and trials', async () => {
  assert.equal((await post('/training/sessions', { levelId: 99 })).status, 400);
  assert.equal((await post('/training/trials/nope/reveal', { perception: { text: 'x' } })).status, 404);
});
