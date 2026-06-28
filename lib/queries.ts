import 'server-only';
import { prisma } from '@/lib/prisma';
import type { ExerciseLite, SlotView, DayView } from '@/lib/types';
import type { Prisma } from '@prisma/client';

const exerciseSelect = {
  id: true,
  slug: true,
  name: true,
  primaryMuscle: true,
  secondaryMuscles: true,
  movementPattern: true,
  category: true,
  equipment: true,
  unilateral: true,
  spinalLoad: true,
  isBackSafe: true,
  defaultRepRange: true,
  cues: true,
  tempoNote: true,
  videoUrl: true,
  isCustom: true,
} satisfies Prisma.ExerciseSelect;

type SlotWithEx = Prisma.SlotExerciseGetPayload<{
  include: {
    exercise: { select: typeof exerciseSelect };
    defaultExercise: { select: { id: true; slug: true; name: true } };
  };
}>;

function toExerciseLite(e: SlotWithEx['exercise']): ExerciseLite {
  return e as ExerciseLite;
}

function toSlotView(slot: SlotWithEx): SlotView {
  return {
    id: slot.id,
    order: slot.order,
    sets: slot.sets,
    repScheme: slot.repScheme,
    targetRpe: slot.targetRpe,
    restSeconds: slot.restSeconds,
    supersetGroup: slot.supersetGroup,
    supersetOrder: slot.supersetOrder,
    notes: slot.notes,
    replacesNote: slot.replacesNote,
    exercise: toExerciseLite(slot.exercise),
    defaultExercise: slot.defaultExercise,
    isSwapped: slot.exerciseId !== slot.defaultExerciseId,
  };
}

const slotInclude = {
  exercise: { select: exerciseSelect },
  defaultExercise: { select: { id: true, slug: true, name: true } },
} satisfies Prisma.SlotExerciseInclude;

export async function getProgram() {
  const program = await prisma.program.findFirst({
    include: {
      blocks: {
        orderBy: { order: 'asc' },
        include: {
          days: {
            orderBy: { order: 'asc' },
            include: {
              slots: { orderBy: { order: 'asc' }, include: slotInclude },
            },
          },
        },
      },
    },
  });
  return program;
}

/** Full program shaped as DayView[] grouped by block. */
export async function getProgramDays(): Promise<
  { blockSlug: string; blockName: string; phase: string; weeks: number; notes: string | null; days: DayView[] }[]
> {
  const program = await getProgram();
  if (!program) return [];
  return program.blocks.map((block) => ({
    blockSlug: block.slug,
    blockName: block.name,
    phase: block.phase,
    weeks: block.weeks,
    notes: block.notes,
    days: block.days.map((day) => ({
      id: day.id,
      slug: day.slug,
      name: day.name,
      order: day.order,
      splitType: day.splitType,
      muscleTags: day.muscleTags,
      blockName: block.name,
      blockSlug: block.slug,
      slots: day.slots.map(toSlotView),
    })),
  }));
}

export async function getDayView(dayId: string): Promise<DayView | null> {
  const day = await prisma.day.findUnique({
    where: { id: dayId },
    include: {
      block: true,
      slots: { orderBy: { order: 'asc' }, include: slotInclude },
    },
  });
  if (!day) return null;
  return {
    id: day.id,
    slug: day.slug,
    name: day.name,
    order: day.order,
    splitType: day.splitType,
    muscleTags: day.muscleTags,
    blockName: day.block.name,
    blockSlug: day.block.slug,
    slots: day.slots.map(toSlotView),
  };
}

export async function getDayBySlug(slug: string): Promise<DayView | null> {
  const day = await prisma.day.findUnique({ where: { slug } });
  if (!day) return null;
  return getDayView(day.id);
}

/** All days across the program in (block, order) order — for the day picker. */
export async function getDaysList() {
  const program = await getProgram();
  if (!program) return [];
  const out: { id: string; slug: string; name: string; order: number; blockSlug: string; blockName: string; splitType: string }[] = [];
  for (const block of program.blocks) {
    for (const day of block.days) {
      out.push({
        id: day.id,
        slug: day.slug,
        name: day.name,
        order: day.order,
        blockSlug: block.slug,
        blockName: block.name,
        splitType: day.splitType,
      });
    }
  }
  return out;
}

/** Resolve the currently-scheduled day from settings (active block + day cursor). */
export async function getActiveDay(activeBlockSlug: string | null, currentDayOrder: number): Promise<DayView | null> {
  const block = activeBlockSlug
    ? await prisma.block.findUnique({ where: { slug: activeBlockSlug } })
    : await prisma.block.findFirst({ orderBy: { order: 'asc' } });
  if (!block) return null;
  const day =
    (await prisma.day.findFirst({ where: { blockId: block.id, order: currentDayOrder } })) ??
    (await prisma.day.findFirst({ where: { blockId: block.id }, orderBy: { order: 'asc' } }));
  if (!day) return null;
  return getDayView(day.id);
}

/** The current in-progress (incomplete) session for a day, with its logged sets. */
export async function getInProgressSession(dayId: string) {
  const session = await prisma.workoutSession.findFirst({
    where: { dayId, completed: false },
    orderBy: { date: 'desc' },
    include: { sets: { orderBy: { setNumber: 'asc' } } },
  });
  if (!session) return null;
  return { id: session.id, startMs: session.date.getTime(), sets: session.sets };
}

/** Full library as ExerciseLite[] for swap ranking and the Library screen. */
export async function getAllExercises(): Promise<ExerciseLite[]> {
  const rows = await prisma.exercise.findMany({
    select: exerciseSelect,
    orderBy: [{ primaryMuscle: 'asc' }, { name: 'asc' }],
  });
  return rows as ExerciseLite[];
}

export async function getExerciseBySlug(slug: string): Promise<ExerciseLite | null> {
  const row = await prisma.exercise.findUnique({ where: { slug }, select: exerciseSelect });
  return (row as ExerciseLite) ?? null;
}

/**
 * Last logged set numbers for an exercise (most recent completed session),
 * used to pre-fill the logger and drive progression hints.
 */
export async function getLastSetsForExercise(exerciseId: string) {
  const lastSet = await prisma.setLog.findFirst({
    where: { exerciseId, completed: true, isWarmup: false },
    orderBy: { createdAt: 'desc' },
    select: { sessionId: true },
  });
  if (!lastSet) return [];
  return prisma.setLog.findMany({
    where: { sessionId: lastSet.sessionId, exerciseId, isWarmup: false },
    orderBy: { setNumber: 'asc' },
    select: { setNumber: true, weightKg: true, reps: true, rpe: true },
  });
}
