// FORGE default program — "Home PPL — Back-Safe Build"
// Two 8-week blocks, 6 days each. Every slot references a library exercise by slug.
// rest is stored as a human string ("2-3m", "1-2m", "30s", "0") and parsed to seconds at seed time.
// Each slot seeds defaultExerciseSlug === exerciseSlug so "reset to default" works out of the box.

const LEGS = ['QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES'];
const PUSH = ['CHEST', 'FRONT_DELTS', 'SIDE_DELTS', 'TRICEPS', 'ABS'];
const PULL = ['LATS', 'UPPER_BACK', 'REAR_DELTS', 'BICEPS', 'TRAPS'];

// Compact slot factory: s(order, slug, sets, reps, rpe, rest, opts)
function s(order, exerciseSlug, sets, repScheme, targetRpe, rest, opts = {}) {
  return {
    order,
    exerciseSlug,
    sets,
    repScheme,
    targetRpe,
    rest,
    supersetGroup: opts.ss ?? null,
    supersetOrder: opts.so ?? null,
    notes: opts.notes ?? null,
    replacesNote: opts.rep ?? null,
  };
}

const program = {
  slug: 'home-ppl-back-safe-build',
  name: 'Home PPL — Back-Safe Build',
  author: 'Adapted from Jeff Nippard’s Intermediate–Advanced PPL',
  description:
    'A fixed 6-day push/pull/legs program engineered to be back-safe: every spinal-loading hinge is swapped for a hip-thrust, supported-row, or knee-flexion alternative. RPE-led, hard ceiling RPE 8 on the big lifts. Ramp-in for 1–2 weeks at RPE 5–6 (3–4 reps shy) before pushing Block 1.',
  blocks: [
    {
      slug: 'ppl-block-1',
      name: 'Block 1 — Technique & Volume',
      order: 1,
      weeks: 8,
      phase: 'TECHNIQUE_VOLUME',
      notes:
        'Weeks 1–8 building technique and volume. Ramp-in weeks 0: run at RPE 5–6, 3–4 reps shy, for 1–2 weeks first. Deload week 9 (~2 sets/exercise, −10% load, RPE 5–6).',
      days: [
        {
          slug: 'b1-d1',
          name: 'Legs #1',
          order: 1,
          splitType: 'LEGS',
          muscleTags: LEGS,
          slots: [
            s(1, 'smith-machine-squat', 4, '5', '7', '3-4m', { rep: 'equip · was back squat @70%' }),
            s(2, 'bulgarian-split-squat', 2, '8/leg', '7', '2-3m', { rep: 'back-safe · replaces deadlift @65%' }),
            s(3, 'smith-machine-hip-thrust', 3, '10-12', '6', '2-3m'),
            s(4, 'walking-lunge', 2, '20/leg', '7', '1-2m'),
            s(5, 'cable-leg-extension', 3, '15', '7', '0', { ss: 'A', so: 1, rep: 'equip · was leg extension' }),
            s(6, 'slider-leg-curl', 3, '15', '7', '1-2m', { ss: 'A', so: 2, rep: 'equip · was seated leg curl' }),
            s(7, 'smith-standing-calf-raise', 3, '10', '7', '1-2m', { rep: 'equip' }),
          ],
        },
        {
          slug: 'b1-d2',
          name: 'Push #1',
          order: 2,
          splitType: 'PUSH',
          muscleTags: PUSH,
          slots: [
            s(1, 'barbell-bench-press', 3, '4', '7-8', '2-3m', { rep: '~75%' }),
            s(2, 'seated-dumbbell-press', 3, '8-10', '7', '2-3m'),
            s(3, 'dip', 3, '6-10', '7', '1-2m', { rep: 'equip · fallback: Smith CGBP / DB floor press' }),
            s(4, 'low-to-high-cable-flye', 3, '12-15', '8', '1-2m'),
            s(5, 'db-skull-crusher', 3, '12', '8', '1-2m'),
            s(6, 'dumbbell-lateral-raise', 3, '15', '8', '1-2m'),
            s(7, 'cable-crunch', 3, '10-12', '7', '1-2m', { rep: 'back-safe · was ab wheel rollout' }),
          ],
        },
        {
          slug: 'b1-d3',
          name: 'Pull #1',
          order: 3,
          splitType: 'PULL',
          muscleTags: PULL,
          slots: [
            s(1, 'one-arm-cable-lat-pull-in', 2, '15-20', '5', '1-2m'),
            s(2, 'pull-up', 4, '6-8', '7', '2-3m'),
            s(3, 'chest-supported-dumbbell-row', 3, '8-10', '7', '2-3m', { rep: 'back-safe · replaces Pendlay row' }),
            s(4, 'cable-high-row', 3, '10-12', '8', '1-2m', { rep: 'equip · was machine high row' }),
            s(5, 'face-pull', 3, '20', '8', '1-2m'),
            s(6, 'reverse-grip-curl', 3, '20', '9', '0', { ss: 'A', so: 1, rep: 'equip · was reverse-grip EZ curl' }),
            s(7, 'supinated-dumbbell-curl', 3, '15', '9', '1-2m', { ss: 'A', so: 2, rep: 'equip · was supinated EZ curl' }),
            s(8, 'db-preacher-curl', 3, '12', '7', '1-2m'),
          ],
        },
        {
          slug: 'b1-d4',
          name: 'Legs #2',
          order: 4,
          splitType: 'LEGS',
          muscleTags: LEGS,
          slots: [
            s(1, 'smith-machine-hip-thrust', 4, '6-8', '7-8', '3-4m', { rep: 'back-safe · replaces deadlift @72.5%' }),
            s(2, 'smith-front-squat', 3, '6-8', '7', '2-3m', { rep: 'equip · was front squat @60%' }),
            s(3, 'cable-glute-kickback', 3, '20', '8', '1-2m', { rep: 'back-safe · from cable pull-through' }),
            s(4, 'step-up', 3, '10-12', '7', '1-2m', { rep: 'equip · was single-leg leg press' }),
            s(5, 'cable-leg-extension', 3, '15', '7', '1-2m', { rep: 'equip · was single-leg leg ext' }),
            s(6, 'single-leg-slider-curl', 3, '12', '7', '1-2m', { rep: 'equip' }),
            s(7, 'smith-standing-calf-raise', 3, '15', '7', '1-2m', { rep: 'equip' }),
          ],
        },
        {
          slug: 'b1-d5',
          name: 'Push #2',
          order: 5,
          splitType: 'PUSH',
          muscleTags: PUSH,
          slots: [
            s(1, 'close-grip-bench-press', 3, '6', '7', '2-3m', { rep: '~70%' }),
            s(2, 'seated-dumbbell-press', 3, '5', '7-8', '2-3m', { rep: 'back-safe · replaces standing military @80%' }),
            s(3, 'incline-dumbbell-press', 3, '10-12', '7', '1-2m'),
            s(4, 'cable-flye', 3, '15', '7', '1-2m', { rep: 'equip · was pec deck' }),
            s(5, 'cable-lateral-raise', 3, '8', '8', '1-2m'),
            s(6, 'cable-tricep-kickback', 3, '20', '8', '1-2m'),
            s(7, 'bicycle-crunch', 3, '12', '7', '1m'),
          ],
        },
        {
          slug: 'b1-d6',
          name: 'Pull #2',
          order: 6,
          splitType: 'PULL',
          muscleTags: PULL,
          slots: [
            s(1, 'neutral-grip-pulldown', 3, '10-12', '8', '2-3m', { rep: 'equip' }),
            s(2, 'cable-seated-row-elbows-out', 3, '10', '8', '0', { ss: 'A', so: 1 }),
            s(3, 'cable-seated-row', 3, '10', '8', '2-3m', { ss: 'A', so: 2 }),
            s(4, 'straight-arm-pulldown', 3, '15', '7', '1-2m'),
            s(5, 'dumbbell-shrug', 3, '15', '8', '1-2m', { rep: 'back-safe · replaces snatch-grip barbell shrug' }),
            s(6, 'cable-reverse-flye', 3, '20', '8', '0'),
            s(7, 'single-arm-cable-curl', 3, '12', '7', '1-2m'),
            s(8, 'hammer-curl', 3, '8', '7', '1-2m'),
          ],
        },
      ],
    },
    {
      slug: 'ppl-block-2',
      name: 'Block 2 — Peaking & Intensity',
      order: 2,
      weeks: 8,
      phase: 'PEAKING_INTENSITY',
      notes:
        'Weeks 10–17 peaking and intensity. Loading stays RPE-led with a hard ceiling of RPE 8 on the big lifts. Deload week 18.',
      days: [
        {
          slug: 'b2-d1',
          name: 'Legs #1',
          order: 1,
          splitType: 'LEGS',
          muscleTags: LEGS,
          slots: [
            s(1, 'smith-machine-hip-thrust', 4, '4-6', '8', '3-4m', { rep: 'back-safe · replaces deadlift @75%' }),
            s(2, 'smith-machine-squat', 2, '6', '6', '3-4m', { notes: 'Tempo: 2s eccentric', rep: 'equip · was tempo back squat @60%' }),
            s(3, 'slider-leg-curl', 2, '20', '7', '1-2m', { rep: 'back-safe · replaces 45° hyperextension' }),
            s(4, 'smith-reverse-lunge', 2, '15', '7', '1-2m'),
            s(5, 'cable-leg-extension', 2, '12', '6', '1-2m', { notes: 'Tempo: 3s eccentric', rep: 'equip · was enhanced-eccentric leg ext' }),
            s(6, 'nordic-curl', 2, '12', '6', '1-2m', { notes: 'Tempo: 3s eccentric', rep: 'equip · was enhanced-eccentric lying curl' }),
            s(7, 'lateral-band-walk', 2, '15', '8', '1-2m', { rep: 'equip · needs band' }),
            s(8, 'smith-standing-calf-raise', 2, '8', '6', '1-2m', { notes: 'Tempo: controlled', rep: 'equip' }),
          ],
        },
        {
          slug: 'b2-d2',
          name: 'Push #1',
          order: 2,
          splitType: 'PUSH',
          muscleTags: PUSH,
          slots: [
            s(1, 'barbell-bench-press', 2, '8', '7-8', '2-3m', { rep: '~75%' }),
            s(2, 'arnold-press', 2, '12', '7', '1-2m'),
            s(3, 'close-grip-smith-press', 2, '15', '7', '1-2m'),
            s(4, 'low-to-high-cable-flye', 2, '15-20', '8', '1-2m'),
            s(5, 'floor-skull-crusher', 2, '8-10', '7', '1-2m'),
            s(6, 'egyptian-lateral-raise', 2, '12-15', '8', '1-2m'),
            s(7, 'overhead-rope-extension', 2, '12-15', '7', '1-2m'),
            s(8, 'lying-leg-raise', 3, '6-10', '6', '1-2m', { rep: 'back-safe · safer vs hanging leg raise' }),
          ],
        },
        {
          slug: 'b2-d3',
          name: 'Pull #1',
          order: 3,
          splitType: 'PULL',
          muscleTags: PULL,
          slots: [
            s(1, 'one-arm-cable-lat-pull-in', 2, '15-20', '5', '1-2m'),
            s(2, 'pull-up', 3, '12', '7', '2-3m'),
            s(3, 'single-arm-cable-row', 2, '6-8', '7', '1-2m', { rep: 'back-safe · from DB one-arm row' }),
            s(4, 'chest-supported-dumbbell-row', 2, '10-12', '7', '1-2m', { rep: 'equip · was chest-supported T-bar row' }),
            s(5, 'cable-reverse-flye', 2, '12-15', '8', '1-2m', { notes: 'Low-to-high path' }),
            s(6, 'cable-rope-upright-row', 2, '20', '8', '1-2m'),
            s(7, 'supinated-dumbbell-curl', 2, '12-15', '8', '1-2m'),
            s(8, 'spider-curl', 3, '15-20', '8', '1-2m'),
          ],
        },
        {
          slug: 'b2-d4',
          name: 'Legs #2',
          order: 4,
          splitType: 'LEGS',
          muscleTags: LEGS,
          slots: [
            s(1, 'smith-machine-squat', 3, '4', '8', '3-4m', { rep: 'equip · was back squat @75%' }),
            s(2, 'nordic-curl', 3, '8', '7-8', '2-3m', { rep: 'back-safe · replaces Romanian deadlift' }),
            s(3, 'smith-machine-hip-thrust', 2, '10', '7', '2-3m', { notes: 'Tempo: 3s pause at top' }),
            s(4, 'goblet-squat', 2, '12', '6', '1-2m', { notes: 'Tempo: 3s eccentric' }),
            s(5, 'slider-leg-curl', 2, '15', '8', '1-2m', { rep: 'equip · was seated leg curl' }),
            s(6, 'cable-glute-kickback', 2, '20', '8', '1-2m', { rep: 'back-safe · from pull-through' }),
            s(7, 'smith-standing-calf-raise', 3, '12', '7', '1-2m', { rep: 'equip' }),
          ],
        },
        {
          slug: 'b2-d5',
          name: 'Push #2',
          order: 5,
          splitType: 'PUSH',
          muscleTags: PUSH,
          slots: [
            s(1, 'barbell-bench-press', 3, '4', '8', '2-3m', { rep: '~75%' }),
            s(2, 'seated-dumbbell-press', 3, '6-8', '7-8', '2-3m', { rep: 'back-safe · replaces military/push-press complex' }),
            s(3, 'dip', 2, '8-10', '6', '1-2m', { notes: 'Tempo: 3s eccentric', rep: 'equip · fallback Smith CGBP / DB floor press' }),
            s(4, 'tricep-pressdown-rope', 3, '12-15', '7', '1-2m'),
            s(5, 'cable-lateral-raise', 3, '15-20', '8', '1-2m', { rep: 'equip · was machine lateral raise' }),
            s(6, 'plank', 3, '30s', '7', '1-2m'),
          ],
        },
        {
          slug: 'b2-d6',
          name: 'Pull #2',
          order: 6,
          splitType: 'PULL',
          muscleTags: PULL,
          slots: [
            s(1, 'single-arm-pulldown', 3, '12', '7', '2-3m'),
            s(2, 'seal-row', 3, '8-10', '7', '2-3m'),
            s(3, 'kneeling-straight-arm-pulldown', 3, '15-20', '8', '1-2m'),
            s(4, 'cable-reverse-flye', 3, '15', '7', '1-2m', { rep: 'equip · was reverse pec deck' }),
            s(5, 'pronated-dumbbell-curl', 3, '8', '9', '0', { ss: 'A', so: 1 }),
            s(6, 'hammer-curl', 3, '8', '9', '0', { ss: 'A', so: 2 }),
            s(7, 'supinated-dumbbell-curl', 3, '8', '9', '1-2m', { ss: 'A', so: 3 }),
          ],
        },
      ],
    },
  ],
};

module.exports = { program };
