export type TierId = 'free' | 'seeker' | 'advanced' | 'master';

export type PathId = 'practice' | 'blind';

export type TargetCategory = 'colour' | 'shape' | 'word' | 'object' | 'scene';

/** How the user answers a round. */
export type LevelKind = 'choice' | 'dual' | 'describe';

/** A group of interchangeable words that all count as naming one attribute. */
export type AttributeGroup = string[];

export interface Target {
  id: string;
  category: TargetCategory;
  label: string;
  /** Visual shown on reveal (emoji, icon name or colour hex depending on category). */
  glyph: string;
  /** Only used by describe levels. */
  attributes?: AttributeGroup[];
}

export interface Level {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  kind: LevelKind;
  /** Categories the target is drawn from. A dual level uses [colour, shape]. */
  categories: TargetCategory[];
  /** Number of choices shown for choice levels. */
  optionCount?: number;
  rounds: number;
  minTier: TierId;
  /** Blind-test only: every seal is shown before round one and reveals wait until the end. */
  blindOnly: boolean;
}

export interface Option {
  id: string;
  label: string;
  glyph: string;
  category: TargetCategory;
}

/** What the client sees before answering. The target itself is withheld. */
export interface SealedTrial {
  trialId: string;
  levelId: number;
  round: number;
  seal: string;
  /** For choice levels: the options to pick from. For dual: colour options then shape options. */
  options: Option[];
  secondaryOptions?: Option[];
}

export interface Reveal {
  trialId: string;
  /** Joined target ids that were hashed into the seal, e.g. "c-red" or "c-red+s-star". */
  targetKey: string;
  salt: string;
  targets: Target[];
  /** A random target of the same category used as a fair comparison for describe levels. */
  decoy?: Target;
}

export interface Perception {
  /** Chosen option id(s) for choice and dual levels. */
  choiceIds?: string[];
  /** Free-text description for describe levels. */
  text?: string;
  /** 1 (guess) to 5 (certain). Undefined when calibration is not enabled for the tier. */
  confidence?: number;
}

export interface RoundResult {
  trialId: string;
  round: number;
  seal: string;
  perception: Perception;
  reveal: Reveal;
  /** 0 to 1. */
  score: number;
  /** Expected score by chance alone (choice levels) or the decoy score (describe levels). */
  baseline: number;
  matchedTerms?: string[];
  sealVerified?: boolean;
}

export interface SessionRecord {
  id: string;
  levelId: number;
  path: PathId;
  startedAt: string;
  finishedAt: string;
  rounds: RoundResult[];
  accuracy: number;
  baseline: number;
  xp: number;
}

export interface TrainerBooking {
  id: string;
  name: string;
  contact: string;
  preferredTime: string;
  notes: string;
  createdAt: string;
}

export interface PersistedState {
  version: 1;
  onboarded: boolean;
  displayName: string;
  tier: TierId;
  sessions: SessionRecord[];
  bookings: TrainerBooking[];
}
