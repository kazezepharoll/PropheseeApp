import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';

import { tierFromEntitlements } from '../server/entitlements';

async function startServer(port: number, env: Record<string, string>): Promise<ChildProcess> {
  const child = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], {
    env: { ...process.env, PORT: String(port), SERVER_SECRET: 'test-secret', ...env },
    stdio: 'ignore',
  });
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${port}/health`)).ok) return child;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('server did not start');
}

function client(port: number) {
  let token = '';
  const call = (method: string, path: string, body?: unknown) =>
    fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  return {
    async signIn() {
      token = (await (await call('POST', '/auth/device')).json()).token;
    },
    post: (path: string, body: unknown = {}) => call('POST', path, body),
    get: (path: string) => call('GET', path),
    setToken: (t: string) => (token = t),
  };
}

describe('master user (open mode)', () => {
  const PORT = 18787;
  const dataDir = mkdtempSync(join(tmpdir(), 'prophesee-'));
  let server: ChildProcess;
  const api = client(PORT);

  before(async () => {
    server = await startServer(PORT, { DATA_DIR: dataDir });
    await api.signIn();
  });
  after(() => server.kill());

  test('requires a valid token', async () => {
    const anon = client(PORT);
    assert.equal((await anon.post('/training/sessions', { levelId: 1 })).status, 401);
    anon.setToken('forged.token');
    assert.equal((await anon.post('/training/sessions', { levelId: 1 })).status, 401);
  });

  test('practice: reveal requires a perception and returns a secret matching the seal', async () => {
    const res = await api.post('/training/sessions', { levelId: 1, path: 'practice' });
    assert.equal(res.status, 201);
    const { trials } = await res.json();
    assert.equal(trials.length, 8);
    const t = trials[0];
    assert.equal((await api.post(`/training/trials/${t.trialId}/reveal`, {})).status, 409);
    const reveal = await api.post(`/training/trials/${t.trialId}/reveal`, { perception: { choiceIds: [t.options[0].id] } });
    assert.equal(reveal.status, 200);
    const secret = await reveal.json();
    assert.equal(createHash('sha256').update(`${secret.targetKey}|${secret.salt}`).digest('hex'), t.seal);
  });

  test('another user cannot open your trials', async () => {
    const { trials } = await (await api.post('/training/sessions', { levelId: 1 })).json();
    const other = client(PORT);
    await other.signIn();
    assert.equal((await other.post(`/training/trials/${trials[0].trialId}/reveal`, { perception: { choiceIds: ['c-red'] } })).status, 404);
  });

  test('blind: no reveal until every round is committed', async () => {
    const { trials } = await (await api.post('/training/sessions', { levelId: 7 })).json();
    const perception = { text: 'water and rocks' };
    await api.post(`/training/trials/${trials[0].trialId}/commit`, { perception });
    assert.equal((await api.post(`/training/trials/${trials[0].trialId}/reveal`, {})).status, 409);
    for (const t of trials.slice(1)) assert.equal((await api.post(`/training/trials/${t.trialId}/commit`, { perception })).status, 200);
    const reveal = await api.post(`/training/trials/${trials[0].trialId}/reveal`, {});
    assert.equal(reveal.status, 200);
    assert.ok((await reveal.json()).decoyId);
  });

  test('rejects unknown levels and trials', async () => {
    assert.equal((await api.post('/training/sessions', { levelId: 99 })).status, 400);
    assert.equal((await api.post('/training/trials/nope/reveal', { perception: { text: 'x' } })).status, 404);
  });

  test('trainer bookings are validated and saved', async () => {
    assert.equal((await api.post('/trainer/bookings', { name: 'A' })).status, 400);
    const ok = await api.post('/trainer/bookings', { name: 'Grace', contact: 'grace@example.com', preferredTime: 'Sat morning, CAT' });
    assert.equal(ok.status, 201);
    const saved = JSON.parse(readFileSync(join(dataDir, 'bookings.jsonl'), 'utf8').trim().split('\n').pop()!);
    assert.equal(saved.name, 'Grace');
    assert.equal(saved.tier, 'master');
  });
});

describe('free user', () => {
  const PORT = 18788;
  let server: ChildProcess;
  const api = client(PORT);

  before(async () => {
    server = await startServer(PORT, { OPEN_MODE_TIER: 'free' });
    await api.signIn();
  });
  after(() => server.kill());

  test('cannot start levels above the plan', async () => {
    const res = await api.post('/training/sessions', { levelId: 3 });
    assert.equal(res.status, 403);
    assert.match((await res.json()).error, /Seeker/);
  });

  test('is limited to 3 started sessions a day; unopened sessions do not count', async () => {
    assert.equal((await api.post('/training/sessions', { levelId: 1 })).status, 201); // never opened
    for (let i = 0; i < 3; i++) {
      const { trials } = await (await api.post('/training/sessions', { levelId: 1 })).json();
      assert.equal((await api.post(`/training/trials/${trials[0].trialId}/reveal`, { perception: { choiceIds: ['c-red'] } })).status, 200);
    }
    const me = await (await api.get('/me')).json();
    assert.equal(me.tier, 'free');
    assert.equal(me.sessionsToday, 3);
    assert.equal((await api.post('/training/sessions', { levelId: 1 })).status, 429);
  });
});

test('RevenueCat entitlements map to the highest active tier', () => {
  const now = Date.parse('2026-01-01T00:00:00Z');
  assert.equal(tierFromEntitlements({}, now), 'free');
  assert.equal(tierFromEntitlements({ seeker: { expires_date: '2026-02-01T00:00:00Z' } }, now), 'seeker');
  assert.equal(tierFromEntitlements({ master: { expires_date: '2025-12-01T00:00:00Z' }, advanced: { expires_date: null } }, now), 'advanced');
});
