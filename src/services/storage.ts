import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PersistedState } from '../types';

const KEY = 'prophesee:state:v1';

export const initialState: PersistedState = {
  version: 1,
  onboarded: false,
  displayName: '',
  tier: 'free',
  sessions: [],
  bookings: [],
};

export async function loadState(): Promise<PersistedState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return { ...initialState, ...parsed, version: 1 };
  } catch {
    return initialState;
  }
}

export async function saveState(state: PersistedState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable: keep running with in-memory state.
  }
}

export async function clearState(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
