import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

/**
 * Anonymous device accounts. The token is `userId.signature`, so the server can verify it
 * without storing anything. The same userId is used as the RevenueCat app user id.
 */
if (!process.env.SERVER_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('SERVER_SECRET must be set in production (any long random string, e.g. `openssl rand -hex 32`).');
}
const secret = process.env.SERVER_SECRET ?? randomBytes(32).toString('hex');
if (!process.env.SERVER_SECRET) {
  console.warn('SERVER_SECRET is not set: device tokens will stop working when the server restarts.');
}

function sign(userId: string): string {
  return createHmac('sha256', secret).update(userId).digest('base64url');
}

export function issueDeviceAccount(): { userId: string; token: string } {
  const userId = randomUUID();
  return { userId, token: `${userId}.${sign(userId)}` };
}

/** Returns the userId for a valid bearer token, otherwise null. */
export function verifyToken(header: string | undefined): string | null {
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const userId = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(userId));
  return given.length === expected.length && timingSafeEqual(given, expected) ? userId : null;
}
