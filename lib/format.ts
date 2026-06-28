import type { Muscle, Equipment, SpinalLoad, MovementPattern } from '@prisma/client';

const TITLE: Record<string, string> = {};

export function titleCase(s: string): string {
  if (TITLE[s]) return TITLE[s];
  const out = s
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  TITLE[s] = out;
  return out;
}

export const muscleLabel = (m: Muscle): string => titleCase(m);
export const patternLabel = (p: MovementPattern): string => titleCase(p);

export function equipmentLabel(e: Equipment): string {
  switch (e) {
    case 'SMITH_MACHINE':
      return 'Smith';
    case 'EZ_BAR':
      return 'EZ-Bar';
    case 'PULL_UP_BAR':
      return 'Pull-Up Bar';
    case 'SWISS_BALL':
      return 'Swiss Ball';
    case 'BODYWEIGHT':
      return 'Bodyweight';
    default:
      return titleCase(e);
  }
}

export const SPINAL_LOAD_VALUE: Record<SpinalLoad, number> = {
  NONE: 0,
  LOW: 1,
  MODERATE: 2,
  HIGH: 3,
};

export function spinalLoadLabel(s: SpinalLoad): string {
  return titleCase(s);
}

/** Parse a rest string like "2-3m", "1-2m", "30s", "0" into seconds. */
export function parseRestToSeconds(rest: string): number {
  const r = rest.trim().toLowerCase();
  if (r === '0' || r === '') return 0;
  const minRange = r.match(/^(\d+)\s*-\s*(\d+)\s*m$/);
  if (minRange) {
    const lo = parseInt(minRange[1], 10);
    const hi = parseInt(minRange[2], 10);
    return Math.round(((lo + hi) / 2) * 60);
  }
  const min = r.match(/^(\d+)\s*m$/);
  if (min) return parseInt(min[1], 10) * 60;
  const sec = r.match(/^(\d+)\s*s$/);
  if (sec) return parseInt(sec[1], 10);
  const n = parseInt(r, 10);
  return Number.isNaN(n) ? 0 : n;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function formatDuration(totalSeconds: number | null | undefined): string {
  if (!totalSeconds) return '—';
  const m = Math.round(totalSeconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

/**
 * Canonical estimated 1RM via Epley — weight × reps only. RPE is intentionally
 * NOT a factor here (logged for the lifter's reference, never the estimate).
 */
export function epley1RM(weightKg: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

/** Brzycki estimate — shown only as a sanity cross-check in the detail tooltip. */
export function brzycki1RM(weightKg: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weightKg;
  if (reps >= 37) return weightKg * (1 + reps / 30); // formula breaks down; fall back
  return (weightKg * 36) / (37 - reps);
}

/** Epley drifts high past ~12 reps — flag those estimates as low confidence. */
export const LOW_CONFIDENCE_REPS = 12;
export function isLowConfidence(reps: number): boolean {
  return reps > LOW_CONFIDENCE_REPS;
}

export function formatDate(d: Date | string | number): string {
  const date = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
