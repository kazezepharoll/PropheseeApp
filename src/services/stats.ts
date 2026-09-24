import { levels } from '../data/levels';
import type { RoundResult, SessionRecord } from '../types';
import { average } from './scoring';

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Consecutive days with at least one finished session, counting back from today (or yesterday). */
export function streakDays(sessions: SessionRecord[]): number {
  const days = new Set(sessions.map((s) => dayKey(new Date(s.finishedAt))));
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface LevelStats {
  levelId: number;
  title: string;
  sessions: number;
  accuracy: number;
  baseline: number;
  best: number;
}

export function statsByLevel(sessions: SessionRecord[]): LevelStats[] {
  return levels
    .map((level) => {
      const own = sessions.filter((s) => s.levelId === level.id);
      const rounds = own.flatMap((s) => s.rounds);
      return {
        levelId: level.id,
        title: level.title,
        sessions: own.length,
        accuracy: average(rounds.map((r) => r.score)),
        baseline: average(rounds.map((r) => r.baseline)),
        best: own.reduce((m, s) => Math.max(m, s.accuracy), 0),
      };
    })
    .filter((s) => s.sessions > 0);
}

export function allRounds(sessions: SessionRecord[]): RoundResult[] {
  return sessions.flatMap((s) => s.rounds);
}

export const pct = (v: number) => `${Math.round(v * 100)}%`;
