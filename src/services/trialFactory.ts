/**
 * Pure trial generation shared by the app (local mode) and the server.
 * Nothing here imports React Native, so `server/` can run the same code.
 */
import { findTarget, pools } from '../data/targets';
import type { Level, Option, SealedTrial, Target, TargetCategory } from '../types';

export interface Entropy {
  /** Uniform integer in [0, n). Must be cryptographically random in production. */
  randomInt(n: number): number;
  randomHex(bytes: number): string;
  sha256(input: string): Promise<string>;
}

/** Everything the client must not see until it has answered. */
export interface TrialSecret {
  targetKey: string;
  salt: string;
  decoyId?: string;
}

export interface CreatedTrial {
  trial: SealedTrial;
  secret: TrialSecret;
}

export function sealInput(targetKey: string, salt: string): string {
  return `${targetKey}|${salt}`;
}

export function targetsFromKey(targetKey: string): Target[] {
  return targetKey.split('+').map((id) => {
    const t = findTarget(id);
    if (!t) throw new Error(`Unknown target ${id}`);
    return t;
  });
}

function pick<T>(items: T[], e: Entropy): T {
  return items[e.randomInt(items.length)];
}

function shuffle<T>(items: T[], e: Entropy): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = e.randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function toOption(t: Target): Option {
  return { id: t.id, label: t.label, glyph: t.glyph, category: t.category };
}

/** Options that always include the target, in random order. */
function optionsFor(category: TargetCategory, target: Target, count: number, e: Entropy): Option[] {
  const others = shuffle(pools[category].filter((t) => t.id !== target.id), e).slice(0, count - 1);
  return shuffle([target, ...others], e).map(toOption);
}

export async function createTrial(level: Level, round: number, trialId: string, e: Entropy): Promise<CreatedTrial> {
  const salt = e.randomHex(16);
  let targetKey: string;
  let options: Option[] = [];
  let secondaryOptions: Option[] | undefined;
  let decoyId: string | undefined;

  if (level.kind === 'dual') {
    const colour = pick(pools.colour, e);
    const shape = pick(pools.shape, e);
    targetKey = `${colour.id}+${shape.id}`;
    options = shuffle(pools.colour, e).map(toOption);
    secondaryOptions = shuffle(pools.shape, e).map(toOption);
  } else {
    const category = pick(level.categories, e);
    const target = pick(pools[category], e);
    targetKey = target.id;
    if (level.kind === 'choice') {
      const count = level.optionCount ?? pools[category].length;
      options = count >= pools[category].length ? shuffle(pools[category], e).map(toOption) : optionsFor(category, target, count, e);
    } else {
      decoyId = pick(pools[category].filter((t) => t.id !== target.id), e).id;
    }
  }

  const seal = await e.sha256(sealInput(targetKey, salt));
  return {
    trial: { trialId, levelId: level.id, round, seal, options, secondaryOptions },
    secret: { targetKey, salt, decoyId },
  };
}
