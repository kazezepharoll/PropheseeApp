import type { TierId } from '../types';

/**
 * Billing boundary. Membership changes go through here so a store SDK
 * (e.g. RevenueCat or expo-iap with App Store / Play billing) can replace the simulation
 * without touching screens.
 *
 * Simulation is on in development builds and whenever EXPO_PUBLIC_SIMULATE_PURCHASES=true.
 */
export const purchasesSimulated = __DEV__ || process.env.EXPO_PUBLIC_SIMULATE_PURCHASES === 'true';

export async function purchaseTier(tier: TierId): Promise<TierId> {
  if (!purchasesSimulated) {
    throw new Error('In-app purchases are not connected yet. Memberships will be available soon.');
  }
  return tier;
}

export async function restorePurchases(current: TierId): Promise<TierId> {
  return current;
}
