import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

import { tierOrder } from '../data/tiers';
import type { TierId } from '../types';

/**
 * Billing boundary. Membership changes only go through here.
 *
 * - Simulated: in development, or with EXPO_PUBLIC_SIMULATE_PURCHASES=true. Anyone can switch plans for free.
 * - RevenueCat: with EXPO_PUBLIC_REVENUECAT_IOS_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_KEY.
 *   Dashboard setup: entitlements `seeker`, `advanced`, `master`, and a current offering with
 *   packages whose identifiers are `seeker`, `advanced` and `master`.
 * - Otherwise (e.g. web, or keys missing): purchases are unavailable.
 */
export const purchasesSimulated = __DEV__ || process.env.EXPO_PUBLIC_SIMULATE_PURCHASES === 'true';

const apiKey = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
  default: undefined,
});

export const billingAvailable = !purchasesSimulated && !!apiKey;

let configured = false;
const packages = new Map<TierId, PurchasesPackage>();

export function tierFromCustomerInfo(info: Pick<CustomerInfo, 'entitlements'>): TierId {
  let best: TierId = 'free';
  for (const tier of tierOrder) if (info.entitlements.active[tier] && tierOrder.indexOf(tier) > tierOrder.indexOf(best)) best = tier;
  return best;
}

/**
 * Configure billing for this user. Calls `onTier` with the store's current plan now and
 * whenever it changes (renewal, expiry, purchase on another device).
 */
export async function initPurchases(userId: string | null, onTier: (tier: TierId) => void): Promise<void> {
  if (!billingAvailable || !apiKey) return;
  try {
    if (!configured) {
      Purchases.configure({ apiKey, appUserID: userId });
      Purchases.addCustomerInfoUpdateListener((info) => onTier(tierFromCustomerInfo(info)));
      configured = true;
    } else if (userId) {
      await Purchases.logIn(userId);
    }
    onTier(tierFromCustomerInfo(await Purchases.getCustomerInfo()));
    const offerings = await Purchases.getOfferings();
    for (const p of offerings.current?.availablePackages ?? []) {
      if ((tierOrder as string[]).includes(p.identifier)) packages.set(p.identifier as TierId, p);
    }
  } catch (e) {
    console.warn('Billing setup failed', e);
  }
}

/** Localized store price for a tier, when billing is live. */
export function storePrice(tier: TierId): string | undefined {
  const p = packages.get(tier);
  return p ? p.product.priceString : undefined;
}

export class PurchaseCancelled extends Error {}

export async function purchaseTier(tier: TierId, current: TierId): Promise<TierId> {
  if (purchasesSimulated) return tier;
  if (!billingAvailable) throw new Error('Memberships can be bought in the PropheSee app for iPhone and Android.');
  if (tier === 'free' || tierOrder.indexOf(tier) < tierOrder.indexOf(current)) {
    throw new Error(
      Platform.OS === 'ios'
        ? 'To downgrade or cancel, open Settings › Apple ID › Subscriptions.'
        : 'To downgrade or cancel, open Google Play › Payments & subscriptions › Subscriptions.',
    );
  }
  const pkg = packages.get(tier);
  if (!pkg) throw new Error('This membership is not available right now. Please try again later.');
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return tierFromCustomerInfo(customerInfo);
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) throw new PurchaseCancelled();
    throw new Error((e as Error).message || 'The purchase did not complete.');
  }
}

export async function restorePurchases(current: TierId): Promise<TierId> {
  if (!billingAvailable) return current;
  return tierFromCustomerInfo(await Purchases.restorePurchases());
}
