import type { Equipment, Muscle } from '@prisma/client';
import type { ExerciseLite } from '@/lib/types';

export type SwapTarget = {
  primaryMuscle: Muscle;
  secondaryMuscles: Muscle[];
  movementPattern: string;
  category: string;
  defaultRepRange: string | null;
  currentExerciseId: string;
};

export type SwapFilters = {
  availableEquipment: Equipment[];
  backSafeOnly: boolean;
  myEquipmentOnly: boolean;
  search?: string;
  /** Optional explicit muscle filter (defaults to the target's primary in the UI). */
  muscle?: Muscle | null;
};

export type RankedCandidate = {
  exercise: ExerciseLite;
  score: number;
  reasons: string[];
};

/** An exercise is buildable if at least one of its listed implements is available. */
export function isBuildable(ex: ExerciseLite, available: Equipment[]): boolean {
  if (ex.equipment.length === 0) return true;
  return ex.equipment.some((e) => available.includes(e));
}

function repRangeMidpoint(range: string | null): number | null {
  if (!range) return null;
  const m = range.match(/(\d+)\s*-\s*(\d+)/);
  if (m) return (parseInt(m[1], 10) + parseInt(m[2], 10)) / 2;
  const n = parseInt(range, 10);
  return Number.isNaN(n) ? null : n;
}

export function scoreCandidate(
  ex: ExerciseLite,
  target: SwapTarget,
  available: Equipment[],
): RankedCandidate {
  let score = 0;
  const reasons: string[] = [];

  if (ex.primaryMuscle === target.primaryMuscle) {
    score += 100;
    reasons.push('same primary muscle');
  } else if (target.secondaryMuscles.includes(ex.primaryMuscle)) {
    score += 45;
    reasons.push('hits a target muscle');
  } else if (ex.secondaryMuscles.includes(target.primaryMuscle)) {
    score += 30;
    reasons.push('works the target as a secondary');
  }

  if (ex.movementPattern === target.movementPattern) {
    score += 60;
    reasons.push('same movement pattern');
  }

  const overlap = ex.secondaryMuscles.filter((m) => target.secondaryMuscles.includes(m)).length;
  if (overlap > 0) {
    score += Math.min(overlap * 8, 24);
    reasons.push('overlapping secondary muscles');
  }

  if (ex.category === target.category) score += 15;

  const a = repRangeMidpoint(ex.defaultRepRange);
  const b = repRangeMidpoint(target.defaultRepRange);
  if (a !== null && b !== null && Math.abs(a - b) <= 4) score += 10;

  if (isBuildable(ex, available)) score += 12;
  if (ex.isBackSafe) score += 6;

  return { exercise: ex, score, reasons };
}

/**
 * Rank candidate exercises for a swap. Applies hard filters (back-safe, equipment),
 * excludes the current exercise, then sorts by match score desc, name asc.
 */
export function rankSwapCandidates(
  candidates: ExerciseLite[],
  target: SwapTarget,
  filters: SwapFilters,
): RankedCandidate[] {
  const search = (filters.search ?? '').trim().toLowerCase();

  const ranked = candidates
    .filter((ex) => ex.id !== target.currentExerciseId)
    .filter((ex) => (filters.backSafeOnly ? ex.isBackSafe : true))
    .filter((ex) => (filters.myEquipmentOnly ? isBuildable(ex, filters.availableEquipment) : true))
    .filter((ex) => (filters.muscle ? ex.primaryMuscle === filters.muscle || ex.secondaryMuscles.includes(filters.muscle) : true))
    .filter((ex) =>
      search
        ? ex.name.toLowerCase().includes(search) ||
          ex.primaryMuscle.toLowerCase().includes(search) ||
          ex.equipment.some((e) => e.toLowerCase().includes(search))
        : true,
    )
    .map((ex) => scoreCandidate(ex, target, filters.availableEquipment));

  ranked.sort((x, y) => y.score - x.score || x.exercise.name.localeCompare(y.exercise.name));
  return ranked;
}
