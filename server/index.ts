/**
 * PropheSee target server.
 *
 * Chooses and seals targets so the answer is never on the user's device until they
 * have committed a perception. Uses the same trial factory and target pools as the app.
 *
 *   npm run server            # PORT defaults to 8787
 *
 * Endpoints (all but /health and /auth/device need `Authorization: Bearer <token>`)
 *   GET  /health
 *   POST /auth/device                                                -> { userId, token }
 *   GET  /me                                                         -> { userId, tier, sessionsToday }
 *   POST /training/sessions                 { levelId, path }        -> { sessionId, trials }
 *   POST /training/trials/:trialId/commit   { perception }           -> { committed: true }
 *   POST /training/trials/:trialId/reveal   { perception? }          -> { targetKey, salt, decoyId? }
 *   POST /trainer/bookings                  { name, contact, preferredTime, notes } -> { ok: true }
 *
 * Levels are checked against the user's plan (RevenueCat) and the free daily limit.
 * Blind sessions refuse every reveal until every trial in the session is committed.
 * Session state is in memory; run a single instance, or move it to Redis/Postgres to scale out.
 */
import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import { getLevel } from '../src/data/levels';
import { tierRank, tiers } from '../src/data/tiers';
import { createTrial, type Entropy, type TrialSecret } from '../src/services/trialFactory';
import type { PathId, Perception } from '../src/types';
import { issueDeviceAccount, verifyToken } from './auth';
import { saveBooking } from './bookings';
import { entitlementsMode, tierFor } from './entitlements';

const PORT = Number(process.env.PORT ?? 8787);
const TTL_MS = 6 * 60 * 60 * 1000;
const MAX_SESSIONS = 50_000;
const MAX_BODY = 8 * 1024;
const RATE_LIMIT_PER_MIN = Number(process.env.RATE_LIMIT_PER_MIN ?? 120);
const MAX_BOOKINGS_PER_DAY = 3;

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
  userId: string;
  path: PathId;
  started: boolean;
  createdAt: number;
  trials: Map<string, StoredTrial>;
}

const sessions = new Map<string, StoredSession>();
const trialToSession = new Map<string, string>();

/** Per-user counters for the current UTC day: sessions started (first reveal) and booking requests. */
const daily = new Map<string, { day: string; sessions: number; bookings: number }>();
const today = () => new Date().toISOString().slice(0, 10);
function counters(userId: string) {
  let c = daily.get(userId);
  if (!c || c.day !== today()) {
    c = { day: today(), sessions: 0, bookings: 0 };
    daily.set(userId, c);
  }
  return c;
}

const hits = new Map<string, { minute: number; count: number }>();
function rateLimited(ip: string): boolean {
  const minute = Math.floor(Date.now() / 60_000);
  const h = hits.get(ip);
  if (!h || h.minute !== minute) {
    hits.set(ip, { minute, count: 1 });
    return false;
  }
  return ++h.count > RATE_LIMIT_PER_MIN;
}

function prune() {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.createdAt > TTL_MS) {
      for (const t of s.trials.keys()) trialToSession.delete(t);
      sessions.delete(id);
    }
  }
  const day = today();
  for (const [id, c] of daily) if (c.day !== day) daily.delete(id);
  hits.clear();
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

function findTrial(trialId: string, userId: string): { session: StoredSession; trial: StoredTrial } {
  const sessionId = trialToSession.get(trialId);
  const session = sessionId ? sessions.get(sessionId) : undefined;
  const trial = session?.trials.get(trialId);
  if (!session || !trial || session.userId !== userId) throw new HttpError(404, 'Trial not found or expired');
  return { session, trial };
}

function requireUser(req: IncomingMessage): string {
  const userId = verifyToken(req.headers.authorization);
  if (!userId) throw new HttpError(401, 'Sign-in required');
  return userId;
}

function text(raw: unknown, field: string, max: number, required = true): string {
  const v = typeof raw === 'string' ? raw.trim().slice(0, max) : '';
  if (required && v.length < 2) throw new HttpError(400, `${field} is required`);
  return v;
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, { ok: true, entitlements: entitlementsMode });

  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim() ?? req.socket.remoteAddress ?? '';
  if (rateLimited(ip)) throw new HttpError(429, 'Too many requests, slow down');

  if (req.method === 'POST' && url.pathname === '/auth/device') return send(res, 201, issueDeviceAccount());

  const userId = requireUser(req);

  if (req.method === 'GET' && url.pathname === '/me') {
    return send(res, 200, { userId, tier: await tierFor(userId), sessionsToday: counters(userId).sessions });
  }

  if (req.method === 'POST' && url.pathname === '/training/sessions') {
    const body = await readJson(req);
    const level = getLevel(Number(body.levelId));
    if (!level) throw new HttpError(400, 'Unknown levelId');
    const tier = tiers[await tierFor(userId)];
    if (tierRank(tier.id) < tierRank(level.minTier)) throw new HttpError(403, `Requires ${tiers[level.minTier].name} membership`);
    if (tier.dailySessionLimit !== null && counters(userId).sessions >= tier.dailySessionLimit) {
      throw new HttpError(429, `You have used today's ${tier.dailySessionLimit} free sessions. Come back tomorrow or upgrade for unlimited sessions.`);
    }
    const path: PathId = level.blindOnly || body.path === 'blind' ? 'blind' : 'practice';
    if (sessions.size >= MAX_SESSIONS) prune();
    if (sessions.size >= MAX_SESSIONS) throw new HttpError(503, 'Server busy, try again shortly');

    const sessionId = randomUUID();
    const stored: StoredSession = { userId, path, started: false, createdAt: Date.now(), trials: new Map() };
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
    const { session, trial } = findTrial(trialId, userId);

    if (!trial.perception) {
      if (body.perception === undefined) throw new HttpError(409, 'Commit a perception before revealing');
      trial.perception = parsePerception(body.perception);
    }
    if (action === 'commit') return send(res, 200, { committed: true });

    if (session.path === 'blind') {
      const waiting = [...session.trials.values()].filter((t) => !t.perception).length;
      if (waiting > 0) throw new HttpError(409, `Blind session: ${waiting} round(s) still need an answer before any reveal`);
    }
    if (!session.started) {
      // A session counts toward the daily limit once its first target is opened.
      session.started = true;
      counters(userId).sessions++;
    }
    trial.revealed = true;
    return send(res, 200, trial.secret);
  }

  if (req.method === 'POST' && url.pathname === '/trainer/bookings') {
    const body = await readJson(req);
    const c = counters(userId);
    if (c.bookings >= MAX_BOOKINGS_PER_DAY) throw new HttpError(429, 'You have already sent several requests today. A trainer will be in touch.');
    await saveBooking({
      userId,
      name: text(body.name, 'name', 80),
      contact: text(body.contact, 'contact', 120),
      preferredTime: text(body.preferredTime, 'preferredTime', 160),
      notes: text(body.notes, 'notes', 1000, false),
      tier: await tierFor(userId),
      createdAt: new Date().toISOString(),
    });
    c.bookings++;
    return send(res, 201, { ok: true });
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
  console.log(`PropheSee target server listening on :${PORT} (entitlements: ${entitlementsMode})`);
});
