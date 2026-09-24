/**
 * PropheSee target server.
 *
 * Chooses and seals targets so the answer is never on the user's device until they
 * have committed a perception. Uses the same trial factory and target pools as the app.
 *
 *   npm run server            # PORT defaults to 8787
 *
 * Endpoints
 *   GET  /health
 *   POST /training/sessions                 { levelId, path }        -> { sessionId, trials }
 *   POST /training/trials/:trialId/commit   { perception }           -> { committed: true }
 *   POST /training/trials/:trialId/reveal   { perception? }          -> { targetKey, salt, decoyId? }
 *
 * Blind sessions refuse every reveal until every trial in the session is committed.
 * State is in memory; run a single instance, or move `sessions` to Redis/Postgres to scale out.
 */
import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import { getLevel } from '../src/data/levels';
import { createTrial, type Entropy, type TrialSecret } from '../src/services/trialFactory';
import type { PathId, Perception } from '../src/types';

const PORT = Number(process.env.PORT ?? 8787);
const TTL_MS = 6 * 60 * 60 * 1000;
const MAX_SESSIONS = 50_000;
const MAX_BODY = 8 * 1024;

const entropy: Entropy = {
  randomInt: (n) => randomInt(n),
  randomHex: (bytes) => randomBytes(bytes).toString('hex'),
  sha256: async (input) => createHash('sha256').update(input).digest('hex'),
};

interface StoredTrial {
  secret: TrialSecret;
  perception?: Perception;
  revealed: boolean;
}

interface StoredSession {
  path: PathId;
  createdAt: number;
  trials: Map<string, StoredTrial>;
}

const sessions = new Map<string, StoredSession>();
const trialToSession = new Map<string, string>();

function prune() {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.createdAt > TTL_MS) {
      for (const t of s.trials.keys()) trialToSession.delete(t);
      sessions.delete(id);
    }
  }
}
setInterval(prune, 10 * 60 * 1000).unref();

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN ?? '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY) throw new HttpError(413, 'Body too large');
    chunks.push(chunk as Buffer);
  }
  if (chunks.length === 0) return {};
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    throw new HttpError(400, 'Invalid JSON');
  }
}

function parsePerception(raw: unknown): Perception {
  if (!raw || typeof raw !== 'object') throw new HttpError(400, 'perception is required');
  const p = raw as Record<string, unknown>;
  const out: Perception = {};
  if (Array.isArray(p.choiceIds)) out.choiceIds = p.choiceIds.filter((x): x is string => typeof x === 'string').slice(0, 2);
  if (typeof p.text === 'string') out.text = p.text.slice(0, 400);
  if (typeof p.confidence === 'number') out.confidence = Math.min(5, Math.max(1, Math.round(p.confidence)));
  if (!out.choiceIds?.length && !out.text) throw new HttpError(400, 'perception must include choiceIds or text');
  return out;
}

function findTrial(trialId: string): { session: StoredSession; trial: StoredTrial } {
  const sessionId = trialToSession.get(trialId);
  const session = sessionId ? sessions.get(sessionId) : undefined;
  const trial = session?.trials.get(trialId);
  if (!session || !trial) throw new HttpError(404, 'Trial not found or expired');
  return { session, trial };
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, { ok: true, sessions: sessions.size });

  if (req.method === 'POST' && url.pathname === '/training/sessions') {
    const body = await readJson(req);
    const level = getLevel(Number(body.levelId));
    if (!level) throw new HttpError(400, 'Unknown levelId');
    const path: PathId = level.blindOnly || body.path === 'blind' ? 'blind' : 'practice';
    if (sessions.size >= MAX_SESSIONS) prune();
    if (sessions.size >= MAX_SESSIONS) throw new HttpError(503, 'Server busy, try again shortly');

    const sessionId = randomUUID();
    const stored: StoredSession = { path, createdAt: Date.now(), trials: new Map() };
    const trials = [];
    for (let round = 1; round <= level.rounds; round++) {
      const { trial, secret } = await createTrial(level, round, randomUUID(), entropy);
      stored.trials.set(trial.trialId, { secret, revealed: false });
      trialToSession.set(trial.trialId, sessionId);
      trials.push(trial);
    }
    sessions.set(sessionId, stored);
    return send(res, 201, { sessionId, path, trials });
  }

  const match = url.pathname.match(/^\/training\/trials\/([\w-]+)\/(commit|reveal)$/);
  if (req.method === 'POST' && match) {
    const [, trialId, action] = match;
    const body = await readJson(req);
    const { session, trial } = findTrial(trialId);

    if (!trial.perception) {
      if (body.perception === undefined) throw new HttpError(409, 'Commit a perception before revealing');
      trial.perception = parsePerception(body.perception);
    }
    if (action === 'commit') return send(res, 200, { committed: true });

    if (session.path === 'blind') {
      const waiting = [...session.trials.values()].filter((t) => !t.perception).length;
      if (waiting > 0) throw new HttpError(409, `Blind session: ${waiting} round(s) still need an answer before any reveal`);
    }
    trial.revealed = true;
    return send(res, 200, trial.secret);
  }

  throw new HttpError(404, 'Not found');
}

createServer((req, res) => {
  handle(req, res).catch((e: unknown) => {
    const status = e instanceof HttpError ? e.status : 500;
    if (status === 500) console.error(e);
    send(res, status, { error: e instanceof Error && status !== 500 ? e.message : 'Internal error' });
  });
}).listen(PORT, () => {
  console.log(`PropheSee target server listening on :${PORT}`);
});
