// Plain-language target for the guided-rep flow. Turns a dense prescription like
// `3 × 8-10 @ RPE 7-8` into a single sentence a non-exerciser can obey, e.g.
// "8 reps — a weight that's hard but doable". RPE is NEVER surfaced here.
//
// Additive helper for the guided logger; the dense logger keeps its own `target`
// string. No shared file is edited.

type ParsedReps =
  | { kind: 'range'; low: number; high: number }
  | { kind: 'fixed'; target: number }
  | { kind: 'perleg'; target: number }
  | { kind: 'time'; seconds: number }
  | { kind: 'amrap' }
  | { kind: 'other'; raw: string };

function parseReps(scheme: string): ParsedReps {
  const s = scheme.trim().toLowerCase();
  if (/^amrap$/.test(s)) return { kind: 'amrap' };
  const time = s.match(/^(\d+)\s*s$/);
  if (time) return { kind: 'time', seconds: +time[1] };
  const perleg = s.match(/^(\d+)\s*\/\s*leg$/) || s.match(/^(\d+)\/leg$/);
  if (perleg) return { kind: 'perleg', target: +perleg[1] };
  const range = s.match(/^(\d+)\s*-\s*(\d+)$/);
  if (range) return { kind: 'range', low: +range[1], high: +range[2] };
  const n = parseInt(s, 10);
  if (!Number.isNaN(n) && /^\d+$/.test(s)) return { kind: 'fixed', target: n };
  return { kind: 'other', raw: scheme };
}

/** A short, coaching-grade qualifier keyed off how heavy the rep target is. */
function effortHint(reps: number): string {
  if (reps <= 5) return 'a weight that feels heavy but you stay in control';
  if (reps <= 8) return "a weight that's hard but doable";
  if (reps <= 12) return 'a weight you can move with good form';
  return 'a lighter weight you can really feel';
}

/**
 * One human sentence for the current move.
 * @param repScheme  slot.repScheme, e.g. "8-10", "5", "12", "30s", "10/leg"
 * @param sets       total working sets for the slot
 * @param setIndex   zero-based index of the set being performed
 */
export function formatTarget(repScheme: string, sets: number, setIndex: number): string {
  const parsed = parseReps(repScheme);
  switch (parsed.kind) {
    case 'range':
      return `${parsed.low}-${parsed.high} reps — ${effortHint(parsed.high)}`;
    case 'fixed':
      return `${parsed.target} reps — ${effortHint(parsed.target)}`;
    case 'perleg':
      return `${parsed.target} reps each leg — ${effortHint(parsed.target)}`;
    case 'time':
      return `Hold for ${parsed.seconds} seconds — steady and controlled`;
    case 'amrap':
      return 'As many clean reps as you can — stop before form breaks';
    default:
      return `${parsed.raw} — controlled reps with good form`;
  }
}

/** Short "Set x of n" line for the progress label. */
export function setLabel(setIndex: number, sets: number): string {
  return `Set ${setIndex + 1} of ${sets}`;
}
