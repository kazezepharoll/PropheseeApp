import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { tiers, tierRank } from '../data/tiers';
import { clearState, initialState, loadState, saveState } from '../services/storage';
import type { Level, PersistedState, SessionRecord, TierId, TrainerBooking } from '../types';

export interface Access {
  ok: boolean;
  reason?: string;
}

interface AppStateValue {
  ready: boolean;
  state: PersistedState;
  sessionsToday: number;
  completeOnboarding: () => void;
  setDisplayName: (name: string) => void;
  setTier: (tier: TierId) => void;
  addSession: (session: SessionRecord) => void;
  addBooking: (booking: TrainerBooking) => void;
  resetProgress: () => Promise<void>;
  levelAccess: (level: Level) => Access;
  canStartSession: (level: Level) => Access;
}

const AppStateContext = createContext<AppStateValue | null>(null);

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<PersistedState>(initialState);
  const loaded = useRef(false);

  useEffect(() => {
    loadState().then((s) => {
      loaded.current = true;
      setState(s);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (loaded.current) saveState(state);
  }, [state]);

  const update = useCallback((fn: (s: PersistedState) => PersistedState) => setState(fn), []);

  const sessionsToday = useMemo(() => state.sessions.filter((s) => isToday(s.finishedAt)).length, [state.sessions]);

  const levelAccess = useCallback(
    (level: Level): Access => {
      if (tierRank(state.tier) >= tierRank(level.minTier)) return { ok: true };
      return { ok: false, reason: `Requires ${tiers[level.minTier].name} membership` };
    },
    [state.tier],
  );

  const canStartSession = useCallback(
    (level: Level): Access => {
      const access = levelAccess(level);
      if (!access.ok) return access;
      const limit = tiers[state.tier].dailySessionLimit;
      if (limit !== null && sessionsToday >= limit) {
        return { ok: false, reason: `You have used today's ${limit} free sessions. Come back tomorrow or upgrade for unlimited sessions.` };
      }
      return { ok: true };
    },
    [levelAccess, sessionsToday, state.tier],
  );

  const value = useMemo<AppStateValue>(
    () => ({
      ready,
      state,
      sessionsToday,
      completeOnboarding: () => update((s) => ({ ...s, onboarded: true })),
      setDisplayName: (displayName) => update((s) => ({ ...s, displayName })),
      setTier: (tier) => update((s) => ({ ...s, tier })),
      addSession: (session) => update((s) => ({ ...s, sessions: [...s.sessions, session] })),
      addBooking: (booking) => update((s) => ({ ...s, bookings: [...s.bookings, booking] })),
      resetProgress: async () => {
        await clearState();
        setState({ ...initialState, onboarded: true });
      },
      levelAccess,
      canStartSession,
    }),
    [ready, state, sessionsToday, update, levelAccess, canStartSession],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}
