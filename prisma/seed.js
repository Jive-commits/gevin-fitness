// FORGE idempotent seed.
// Runs on every deploy (start command). Keyed entirely by stable slugs:
//   - Exercise library metadata is canonical -> upserted (refreshed) in place.
//   - Program template structure is created once; on re-run, only canonical
//     template fields are refreshed. User-mutable fields (the swapped exerciseId,
//     edited sets/reps/RPE/rest) are PRESERVED so a re-deploy never wipes a swap.
//   - UserSettings is created-if-missing; existing preferences are never clobbered.

const { PrismaClient } = require('@prisma/client');
const { exercises } = require('./seed-data/exercises');
const { program } = require('./seed-data/program');

const prisma = new PrismaClient();

function parseRest(rest) {
  const r = String(rest).trim().toLowerCase();
  if (r === '0' || r === '') return 0;
  let m;
  if ((m = r.match(/^(\d+)\s*-\s*(\d+)\s*m$/))) return Math.round(((+m[1] + +m[2]) / 2) * 60);
  if ((m = r.match(/^(\d+)\s*m$/))) return +m[1] * 60;
  if ((m = r.match(/^(\d+)\s*s$/))) return +m[1];
  const n = parseInt(r, 10);
  return Number.isNaN(n) ? 0 : n;
}

const ALL_EQUIPMENT = [
  'BARBELL', 'DUMBBELL', 'SMITH_MACHINE', 'CABLE', 'MACHINE', 'BODYWEIGHT',
  'BAND', 'KETTLEBELL', 'EZ_BAR', 'PULL_UP_BAR', 'BENCH', 'SWISS_BALL', 'SLIDER',
];

async function main() {
  const startedAt = Date.now();
  console.log('🔥 FORGE seed starting…');

  // -------- 1. Exercise library (canonical metadata, always refreshed) --------
  const slugToId = new Map();
  let created = 0;
  for (const ex of exercises) {
    const data = {
      name: ex.name,
      primaryMuscle: ex.primaryMuscle,
      secondaryMuscles: ex.secondaryMuscles,
      movementPattern: ex.movementPattern,
      category: ex.category,
      equipment: ex.equipment,
      unilateral: ex.unilateral,
      spinalLoad: ex.spinalLoad,
      isBackSafe: ex.isBackSafe,
      defaultRepRange: ex.defaultRepRange,
      cues: ex.cues,
      tempoNote: ex.tempoNote,
      videoUrl: ex.videoUrl,
    };
    const row = await prisma.exercise.upsert({
      where: { slug: ex.slug },
      create: { slug: ex.slug, ...data },
      update: data,
    });
    slugToId.set(ex.slug, row.id);
    created++;
  }
  console.log(`  ✓ ${created} exercises upserted`);

  // -------- 2. Validate every program slot resolves to a real exercise --------
  const missing = new Set();
  for (const block of program.blocks) {
    for (const day of block.days) {
      for (const slot of day.slots) {
        if (!slugToId.has(slot.exerciseSlug)) missing.add(slot.exerciseSlug);
      }
    }
  }
  if (missing.size > 0) {
    throw new Error(
      `Program references exercises missing from the library: ${[...missing].join(', ')}`,
    );
  }

  // -------- 3. Program template --------
  const prog = await prisma.program.upsert({
    where: { slug: program.slug },
    create: {
      slug: program.slug,
      name: program.name,
      author: program.author,
      description: program.description,
    },
    update: {
      name: program.name,
      author: program.author,
      description: program.description,
    },
  });

  let slotCount = 0;
  for (const block of program.blocks) {
    const blk = await prisma.block.upsert({
      where: { slug: block.slug },
      create: {
        slug: block.slug,
        programId: prog.id,
        name: block.name,
        order: block.order,
        weeks: block.weeks,
        phase: block.phase,
        notes: block.notes,
      },
      update: {
        programId: prog.id,
        name: block.name,
        order: block.order,
        weeks: block.weeks,
        phase: block.phase,
        notes: block.notes,
      },
    });

    for (const day of block.days) {
      const d = await prisma.day.upsert({
        where: { slug: day.slug },
        create: {
          slug: day.slug,
          blockId: blk.id,
          name: day.name,
          order: day.order,
          splitType: day.splitType,
          muscleTags: day.muscleTags,
        },
        update: {
          blockId: blk.id,
          name: day.name,
          order: day.order,
          splitType: day.splitType,
          muscleTags: day.muscleTags,
        },
      });

      for (const slot of day.slots) {
        const slotSlug = `${day.slug}-s${slot.order}`;
        const exerciseId = slugToId.get(slot.exerciseSlug);
        const restSeconds = parseRest(slot.rest);

        // On UPDATE we only refresh canonical template fields and never touch the
        // user-mutable exerciseId/sets/reps/rpe/rest/notes, preserving swaps & edits.
        await prisma.slotExercise.upsert({
          where: { slug: slotSlug },
          create: {
            slug: slotSlug,
            dayId: d.id,
            order: slot.order,
            exerciseId,
            defaultExerciseId: exerciseId,
            sets: slot.sets,
            repScheme: slot.repScheme,
            targetRpe: slot.targetRpe,
            restSeconds,
            supersetGroup: slot.supersetGroup,
            supersetOrder: slot.supersetOrder,
            notes: slot.notes,
            replacesNote: slot.replacesNote,
          },
          update: {
            dayId: d.id,
            order: slot.order,
            // Canonical default + lineage are template-owned; refresh them.
            defaultExerciseId: exerciseId,
            replacesNote: slot.replacesNote,
          },
        });
        slotCount++;
      }
    }
  }
  console.log(`  ✓ program "${program.name}" with ${slotCount} slots upserted`);

  // -------- 4. UserSettings (created-if-missing; preferences preserved) --------
  const defaultUnits = (process.env.DEFAULT_UNITS || 'lb').toLowerCase() === 'kg' ? 'kg' : 'lb';
  await prisma.userSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      units: defaultUnits,
      backSafeOnly: true,
      myEquipmentOnly: true,
      availableEquipment: ALL_EQUIPMENT,
      defaultRestSec: 120,
      incrementUpperKg: 2.5,
      incrementLowerKg: 5,
      activeProgramSlug: program.slug,
      activeBlockSlug: program.blocks[0].slug,
      currentDayOrder: 1,
    },
    update: {
      // Keep the active program pointer current; leave all user prefs untouched.
      activeProgramSlug: program.slug,
    },
  });
  console.log('  ✓ settings ensured');

  console.log(`🔥 FORGE seed complete in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
