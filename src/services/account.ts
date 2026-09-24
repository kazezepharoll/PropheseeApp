import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { api, hasAuthToken, isServerMode, setAuthToken } from './api';
import { newId } from './entropy';

const KEY = 'prophesee.account.v1';

export interface Account {
  userId: string;
  /** Present when the account was issued by the server. */
  token?: string;
}

async function read(): Promise<string | null> {
  if (Platform.OS === 'web') return AsyncStorage.getItem(KEY);
  return SecureStore.getItemAsync(KEY);
}

async function write(value: string): Promise<void> {
  if (Platform.OS === 'web') return AsyncStorage.setItem(KEY, value);
  return SecureStore.setItemAsync(KEY, value);
}

/**
 * Anonymous account for this install. In server mode it is issued by the server so trials,
 * limits and purchases (RevenueCat app user id) all refer to the same user.
 * Falls back to a local id when the server can't be reached, and retries on next launch.
 */
export async function loadAccount(): Promise<Account> {
  const raw = await read().catch(() => null);
  const saved = raw ? (JSON.parse(raw) as Account) : null;

  if (!isServerMode) {
    if (saved) return saved;
    const local = { userId: newId() };
    await write(JSON.stringify(local)).catch(() => {});
    return local;
  }

  if (saved?.token) {
    setAuthToken(saved.token);
    return saved;
  }
  try {
    const issued = await api.post<{ userId: string; token: string }>('/auth/device');
    await write(JSON.stringify(issued)).catch(() => {});
    setAuthToken(issued.token);
    return issued;
  } catch {
    return saved ?? { userId: newId() };
  }
}

/** Make sure server calls are signed in, retrying if the app launched offline. */
export async function ensureSignedIn(): Promise<void> {
  if (!isServerMode || hasAuthToken()) return;
  await loadAccount();
  if (!hasAuthToken()) throw new Error('Could not reach the PropheSee server. Check your connection and try again.');
}
