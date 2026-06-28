// Progression hints (§10). Looks at the last logged session for a lift and the
// slot prescription, and proposes the next target. Hints only — never auto-applied.

export type PrevSet = {
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
};

export type ProgressionHint = {
  text: string;
  direction: 'up' | 'hold' | 'none';
  suggestedWeightKg: number | null;
  suggestedReps: number | null;
};

type ParsedScheme =
  | { type: 'range'; low: number; high: number }
  | { type: 'heavy'; target: number }
  | { type: 'fixed'; target: number }
  | { type: 'perleg'; target: number }
  | { type: 'time' }
  | { type: 'other' };

function parseScheme(scheme: string): ParsedScheme {
  const s = scheme.trim().toLowerCase();
  if (/s$/.test(s) && /^\d+s$/.test(s)) return { type: 'time' };
  if (/\/leg/.test(s)) {
    const n = parseInt(s, 10);
    return { type: 'perleg', target: Number.isNaN(n) ? 0 : n };
  }
  const range = s.match(/^(\d+)\s*-\s*(\d+)$/);
  if (range) return { type: 'range', low: +range[1], high: +range[2] };
  const n = parseInt(s, 10);
  if (!Number.isNaN(n)) return n <= 6 ? { type: 'heavy', target: n } : { type: 'fixed', target: n };
  return { type: 'other' };
}

function parseTargetRpe(rpe: string | null): number | null {
  if (!rpe) return null;
  const nums = rpe.match(/\d+(\.\d+)?/g);
  if (!nums) return null;
  return Math.max(...nums.map(Number)); // ceiling of a range like "7-8"
}

function fmtInc(kg: number, units: 'kg' | 'lb'): string {
  if (units === 'lb') {
    const lb = Math.round(kg / 0.45359237);
    return `+${lb} lb`;
  }
  return `+${kg % 1 === 0 ? kg : kg.toFixed(1)} kg`;
}

/** Pick the heaviest working set as the reference "top set". */
function topSet(prev: PrevSet[]): PrevSet | null {
  const valid = prev.filter((s) => s.weightKg != null && s.reps != null);
  if (valid.length === 0) return null;
  return valid.reduce((best, s) => ((s.weightKg ?? 0) > (best.weightKg ?? 0) ? s : best));
}

export function computeHint(
  prev: PrevSet[],
  repScheme: string,
  targetRpe: string | null,
  incrementKg: number,
  units: 'kg' | 'lb' = 'kg',
): ProgressionHint {
  const none: ProgressionHint = { text: '', direction: 'none', suggestedWeightKg: null, suggestedReps: null };
  if (!prev || prev.length === 0) return none;

  const scheme = parseScheme(repScheme);
  const target = parseTargetRpe(targetRpe);
  const top = topSet(prev);
  if (!top || top.weightKg == null || top.reps == null) return none;

  const w = top.weightKg;
  const rpe = top.rpe;
  const inc = fmtInc(incrementKg, units);

  switch (scheme.type) {
    case 'range': {
      const allHitTop = prev
        .filter((s) => s.reps != null)
        .every((s) => (s.reps ?? 0) >= scheme.high);
      const easyEnough = target == null || rpe == null || rpe <= target;
      if (allHitTop && easyEnough) {
        return {
          text: `Hit the top of the range last week — try ${inc} and reset to ${scheme.low} reps.`,
          direction: 'up',
          suggestedWeightKg: w + incrementKg,
          suggestedReps: scheme.low,
        };
      }
      return {
        text: `Hold the load and chase +1 rep toward ${scheme.high}.`,
        direction: 'hold',
        suggestedWeightKg: w,
        suggestedReps: Math.min((top.reps ?? scheme.low) + 1, scheme.high),
      };
    }
    case 'heavy': {
      const hitReps = (top.reps ?? 0) >= scheme.target;
      const atTarget = target != null && rpe != null && rpe <= target;
      if (hitReps && atTarget) {
        return {
          text: `Clean ${scheme.target} at RPE ${target} — add ${inc}.`,
          direction: 'up',
          suggestedWeightKg: w + incrementKg,
          suggestedReps: scheme.target,
        };
      }
      return {
        text: `Repeat the load and sharpen the ${scheme.target}s before adding weight.`,
        direction: 'hold',
        suggestedWeightKg: w,
        suggestedReps: scheme.target,
      };
    }
    case 'fixed':
    case 'perleg': {
      if (target != null && rpe != null && rpe <= target - 1) {
        return {
          text: `Felt easy last time (RPE ${rpe} ≤ ${target - 1}) — add ${inc}.`,
          direction: 'up',
          suggestedWeightKg: w + incrementKg,
          suggestedReps: scheme.target,
        };
      }
      return {
        text: `Match last session and keep RPE around ${target ?? '—'}.`,
        direction: 'hold',
        suggestedWeightKg: w,
        suggestedReps: scheme.target,
      };
    }
    default:
      return none;
  }
}

const LOWER_MUSCLES = ['QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES'];
export function incrementForMuscle(
  primaryMuscle: string,
  upperKg: number,
  lowerKg: number,
): number {
  return LOWER_MUSCLES.includes(primaryMuscle) ? lowerKg : upperKg;
}
