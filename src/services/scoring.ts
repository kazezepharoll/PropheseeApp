import type { AttributeGroup, Level, Perception, Reveal, RoundResult, SealedTrial, Target } from '../types';

const NEGATIONS = new Set(['not', 'no', 'never', 'without', "isn't", "wasn't", "don't", 'nor']);

const BREAK = '|';
const CLAUSE_ENDS = new Set([BREAK, 'but', 'yet', 'although', 'though']);

/** Lowercase words, with punctuation that ends a clause kept as a "|" token. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[,.;:!?()\n]/g, ` ${BREAK} `)
    .replace(/[^a-z'|\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter(Boolean);
}

/**
 * Words the user asserted, skipping up to two words after a negation
 * ("not red", "no people") until the clause ends at punctuation or "but".
 */
export function assertedWords(text: string): Set<string> {
  const tokens = tokenize(text);
  const out = new Set<string>();
  let negatedFor = 0;
  for (const tok of tokens) {
    if (CLAUSE_ENDS.has(tok)) {
      negatedFor = 0;
      continue;
    }
    if (NEGATIONS.has(tok)) {
      negatedFor = 2;
      continue;
    }
    if (negatedFor > 0) {
      negatedFor--;
      continue;
    }
    out.add(tok);
    // Light plural handling so "rocks" matches "rock" and vice versa.
    if (tok.endsWith('s') && tok.length > 3) out.add(tok.slice(0, -1));
    else out.add(`${tok}s`);
  }
  return out;
}

export interface DescribeScore {
  score: number;
  matched: string[];
}

export function scoreDescription(text: string, attributes: AttributeGroup[] = []): DescribeScore {
  if (attributes.length === 0) return { score: 0, matched: [] };
  const words = assertedWords(text);
  const matched: string[] = [];
  for (const group of attributes) {
    const hit = group.find((w) => words.has(w));
    if (hit) matched.push(hit);
  }
  return { score: matched.length / attributes.length, matched };
}

/** Expected score from chance alone for choice and dual levels. */
export function chanceBaseline(level: Level, trial: SealedTrial): number {
  if (level.kind === 'choice') return 1 / Math.max(trial.options.length, 1);
  if (level.kind === 'dual') {
    const a = 1 / Math.max(trial.options.length, 1);
    const b = 1 / Math.max(trial.secondaryOptions?.length ?? 1, 1);
    return (a + b) / 2;
  }
  return 0;
}

export function scoreRound(level: Level, trial: SealedTrial, perception: Perception, reveal: Reveal): RoundResult {
  const targets = reveal.targets;
  let score = 0;
  let baseline = chanceBaseline(level, trial);
  let matchedTerms: string[] | undefined;

  if (level.kind === 'choice') {
    score = perception.choiceIds?.[0] === targets[0].id ? 1 : 0;
  } else if (level.kind === 'dual') {
    const [colour, shape] = targets;
    const chosen = perception.choiceIds ?? [];
    score = ((chosen[0] === colour.id ? 1 : 0) + (chosen[1] === shape.id ? 1 : 0)) / 2;
  } else {
    const text = perception.text ?? '';
    const real = scoreDescription(text, targets[0].attributes);
    score = real.score;
    matchedTerms = real.matched;
    baseline = reveal.decoy ? scoreDescription(text, reveal.decoy.attributes).score : 0;
  }

  return {
    trialId: trial.trialId,
    round: trial.round,
    seal: trial.seal,
    perception,
    reveal,
    score,
    baseline,
    matchedTerms,
  };
}

export function average(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

export function xpFor(rounds: RoundResult[]): number {
  // Showing up earns a little; only a session-wide edge over the fair baseline earns more.
  const edge = rounds.reduce((sum, r) => sum + r.score - r.baseline, 0);
  return Math.round(rounds.length * 2 + Math.max(0, edge) * 20);
}

export interface Calibration {
  count: number;
  highConfidenceAccuracy: number | null;
  lowConfidenceAccuracy: number | null;
  correlation: number | null;
  verdict: string;
}

function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 3) return null;
  const mx = average(xs);
  const my = average(ys);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
}

export function calibrate(rounds: RoundResult[]): Calibration {
  const rated = rounds.filter((r) => typeof r.perception.confidence === 'number');
  const high = rated.filter((r) => (r.perception.confidence ?? 0) >= 4).map((r) => r.score);
  const low = rated.filter((r) => (r.perception.confidence ?? 0) <= 2).map((r) => r.score);
  const correlation = pearson(
    rated.map((r) => r.perception.confidence ?? 0),
    rated.map((r) => r.score),
  );

  let verdict: string;
  if (rated.length < 3) verdict = 'Rate your confidence on a few more rounds to see calibration.';
  else if (correlation === null) verdict = 'Vary your confidence ratings honestly so calibration can be measured.';
  else if (correlation > 0.3) verdict = 'Well calibrated: your confident answers tend to be your accurate ones.';
  else if (correlation < -0.3) verdict = 'Inverted: you are more accurate when you feel less sure. Trust the quiet impressions.';
  else verdict = 'Not yet calibrated: confidence and accuracy are not related so far.';

  return {
    count: rated.length,
    highConfidenceAccuracy: high.length ? average(high) : null,
    lowConfidenceAccuracy: low.length ? average(low) : null,
    correlation,
    verdict,
  };
}

export function feedbackFor(result: RoundResult, level: Level): string {
  const { score, baseline } = result;
  if (level.kind === 'describe') {
    if (score === 0) return 'No attributes matched this time. Compare your impressions with the reveal and note what was close.';
    if (score > baseline) return `You named ${Math.round(score * 100)}% of the target's attributes, above the decoy comparison.`;
    if (score === baseline) return 'Your description fit the target and the decoy equally. Try fewer, more specific impressions.';
    return 'Your description fit the decoy better than the target. Stay with your first impression rather than listing possibilities.';
  }
  if (score === 1) return 'A clear hit.';
  if (score === 0.5) return 'Half right. One part of the target came through.';
  return 'A miss. Notice what you perceived and hold it lightly.';
}

export function describeTarget(targets: Target[]): string {
  return targets.map((t) => t.label).join(' ');
}
