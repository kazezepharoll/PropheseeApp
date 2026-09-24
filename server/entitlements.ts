import { tierOrder } from '../src/data/tiers';
import type { TierId } from '../src/types';

/**
 * Looks up a user's plan from RevenueCat (entitlement ids: seeker, advanced, master).
 * Without REVENUECAT_SECRET_KEY the server runs "open": every user gets OPEN_MODE_TIER (default master).
 * Use open mode only for development and testing.
 */
const key = process.env.REVENUECAT_SECRET_KEY;
const CACHE_MS = 60_000;
const cache = new Map<string, { tier: TierId; at: number }>();

export const entitlementsMode: 'revenuecat' | 'open' = key ? 'revenuecat' : 'open';

const openTier = (tierOrder as string[]).includes(process.env.OPEN_MODE_TIER ?? '') ? (process.env.OPEN_MODE_TIER as TierId) : 'master';

if (!key) console.warn(`REVENUECAT_SECRET_KEY is not set: every user is treated as ${openTier}.`);

interface SubscriberResponse {
  subscriber?: { entitlements?: Record<string, { expires_date: string | null }> };
}

export function tierFromEntitlements(entitlements: Record<string, { expires_date: string | null }>, now = Date.now()): TierId {
  let best: TierId = 'free';
  for (const tier of tierOrder) {
    const e = entitlements[tier];
    if (!e) continue;
    const active = e.expires_date === null || Date.parse(e.expires_date) > now;
    if (active && tierOrder.indexOf(tier) > tierOrder.indexOf(best)) best = tier;
  }
  return best;
}

export async function tierFor(userId: string): Promise<TierId> {
  if (!key) return openTier;
  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.tier;

  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`RevenueCat lookup failed with ${res.status}`);
  const body = (await res.json()) as SubscriberResponse;
  const tier = tierFromEntitlements(body.subscriber?.entitlements ?? {});
  cache.set(userId, { tier, at: Date.now() });
  return tier;
}
