// Canonical storage is always kg. Display converts to the user's unit.

export type Units = 'kg' | 'lb';

const KG_PER_LB = 0.45359237;

export function kgToDisplay(kg: number | null | undefined, units: Units): number | null {
  if (kg === null || kg === undefined) return null;
  if (units === 'lb') return kg / KG_PER_LB;
  return kg;
}

export function displayToKg(value: number, units: Units): number {
  if (units === 'lb') return value * KG_PER_LB;
  return value;
}

/** Round to a sensible display precision for the gym (0.5 kg / 1 lb steps look clean). */
export function roundDisplay(value: number, units: Units): number {
  const step = units === 'lb' ? 1 : 0.5;
  return Math.round(value / step) * step;
}

export function formatWeight(kg: number | null | undefined, units: Units): string {
  const v = kgToDisplay(kg, units);
  if (v === null) return '—';
  const r = roundDisplay(v, units);
  return Number.isInteger(r) ? `${r}` : `${r.toFixed(1)}`;
}

export function unitLabel(units: Units): string {
  return units;
}

/** Default load step in display units (upper vs lower body). */
export function loadStep(units: Units, lower = false): number {
  if (units === 'lb') return lower ? 10 : 5;
  return lower ? 5 : 2.5;
}
