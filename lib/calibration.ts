// Post-sensation calibration for the guided-rep flow. The beginner never types an
// RPE; after set 1 of a working slot they pick a coarse chip, which we (a) map to
// an RPE proxy persisted on the just-logged set via the EXISTING saveSet `rpe`
// field (no schema change) and (b) use to nudge the next set's load.
//
// Additive helper; no shared file is edited.

export type Sensation = 'too_easy' | 'just_right' | 'too_hard';

/** RPE proxy written onto the just-logged set so the corpus stays intact for Lifter Mode. */
export const SENSATION_RPE: Record<Sensation, number> = {
  too_easy: 6,
  just_right: 8,
  too_hard: 9.5,
};

/**
 * Adjust the next set's load (in kg) given how set 1 felt.
 *   too_easy   → bump up by one increment
 *   just_right → hold
 *   too_hard   → ease down by one increment (never below 0)
 */
export function applySensation(currentKg: number | null, s: Sensation, incrementKg: number): number | null {
  if (currentKg == null) return currentKg;
  if (s === 'too_easy') return currentKg + incrementKg;
  if (s === 'too_hard') return Math.max(0, currentKg - incrementKg);
  return currentKg;
}

export const SENSATION_CHIPS: { value: Sensation; label: string }[] = [
  { value: 'too_easy', label: 'Too easy' },
  { value: 'just_right', label: 'Just right' },
  { value: 'too_hard', label: 'Too hard' },
];
