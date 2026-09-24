import { findTarget } from '../data/targets';
import { categoryTips, generalTips } from '../data/tips';
import type { Perception, Target } from '../types';

export function answerLabel(p: Perception): string {
  if (p.text !== undefined) return `“${p.text.trim()}”`;
  return (p.choiceIds ?? []).map((id) => findTarget(id)?.label ?? id).join(' ');
}

/** A success tip that suits the target category, rotating with the round number. */
export function tipFor(targets: Target[], round: number): string {
  const specific = categoryTips[targets[targets.length - 1].category] ?? [];
  const all = [...specific, ...generalTips];
  return all[round % all.length];
}
