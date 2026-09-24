import type { TierId } from '../types';

export interface Tier {
  id: TierId;
  name: string;
  /** Display price. Real prices come from the App Store / Play Store once billing is connected. */
  price: string;
  tagline: string;
  maxLevel: number;
  dailySessionLimit: number | null;
  calibration: boolean;
  ledger: boolean;
  perks: string[];
}

export const tierOrder: TierId[] = ['free', 'seeker', 'advanced', 'master'];

export const tiers: Record<TierId, Tier> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 'Free',
    tagline: 'Begin the watch',
    maxLevel: 2,
    dailySessionLimit: 3,
    calibration: false,
    ledger: false,
    perks: ['Levels 1–2: Colours and Shapes', '3 sessions a day', 'Practice and Blind Test paths', 'Sealed targets on every round'],
  },
  seeker: {
    id: 'seeker',
    name: 'Seeker',
    price: '$4.99 / month',
    tagline: 'Sharpen your senses',
    maxLevel: 4,
    dailySessionLimit: null,
    calibration: false,
    ledger: false,
    perks: ['Levels 1–4 including Words and Colour + Shape', 'Unlimited sessions', 'Full progress history'],
  },
  advanced: {
    id: 'advanced',
    name: 'Advanced',
    price: '$9.99 / month',
    tagline: 'Describe what you see',
    maxLevel: 6,
    dailySessionLimit: null,
    calibration: true,
    ledger: false,
    perks: ['Levels 1–6 including Objects and Scenes', 'Free-text perception with decoy comparison', 'Confidence calibration'],
  },
  master: {
    id: 'master',
    name: 'Master',
    price: '$19.99 / month',
    tagline: 'Proven under blind conditions',
    maxLevel: 8,
    dailySessionLimit: null,
    calibration: true,
    ledger: true,
    perks: ['All 8 levels including sealed Watchman trials', 'Seal ledger for every round you have played', 'Everything in Advanced'],
  },
};

export const trainerSession = {
  name: '1-to-1 Trainer Session',
  price: '$49 / session',
  description:
    'A live session with a trainer who prepares sealed targets in advance. Every seal is shared with you before you begin, and you review the reveals together.',
};

export function tierRank(id: TierId): number {
  return tierOrder.indexOf(id);
}
