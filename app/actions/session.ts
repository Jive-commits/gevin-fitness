'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { epley1RM } from '@/lib/format';

/** Find the in-progress session for a day, or create one. */
export async function ensureSession(dayId: string): Promise<string> {
  const existing = await prisma.workoutSession.findFirst({
    where: { dayId, completed: false },
    orderBy: { date: 'desc' },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.workoutSession.create({ data: { dayId }, select: { id: true } });
  return created.id;
}

/** Find the in-progress freestyle (off-program) session, or create one. */
export async function ensureCustomSession(name?: string): Promise<string> {
  const existing = await prisma.workoutSession.findFirst({
    where: { dayId: null, completed: false },
    orderBy: { date: 'desc' },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.workoutSession.create({
    data: { dayId: null, name: name ?? 'Freestyle workout' },
    select: { id: true },
  });
  return created.id;
}

export type SaveSetInput = {
  sessionId?: string | null;
  dayId?: string | null;
  slotId: string;
  exerciseId: string;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
  isWarmup: boolean;
  completed: boolean;
};

export type SaveSetResult = {
  ok: true;
  sessionId: string;
  setId: string;
  e1RM: number | null;
  isPR: boolean;
};

/** Upsert a single set. Lazily creates the session. Flags a new e1RM PR. */
export async function saveSet(input: SaveSetInput): Promise<SaveSetResult> {
  const sessionId =
    input.sessionId || (input.dayId ? await ensureSession(input.dayId) : await ensureCustomSession());

  const row = await prisma.setLog.upsert({
    where: {
      sessionId_slotId_setNumber: {
        sessionId,
        slotId: input.slotId,
        setNumber: input.setNumber,
      },
    },
    create: {
      sessionId,
      exerciseId: input.exerciseId,
      slotId: input.slotId,
      setNumber: input.setNumber,
      weightKg: input.weightKg,
      reps: input.reps,
      rpe: input.rpe,
      isWarmup: input.isWarmup,
      completed: input.completed,
    },
    update: {
      weightKg: input.weightKg,
      reps: input.reps,
      rpe: input.rpe,
      isWarmup: input.isWarmup,
      completed: input.completed,
      exerciseId: input.exerciseId,
    },
  });

  let e1RM: number | null = null;
  let isPR = false;
  if (input.completed && !input.isWarmup && input.weightKg && input.reps) {
    e1RM = epley1RM(input.weightKg, input.reps);
    // Best prior e1RM for this lift, excluding the set we just logged.
    const prior = await prisma.setLog.findMany({
      where: {
        exerciseId: input.exerciseId,
        completed: true,
        isWarmup: false,
        id: { not: row.id },
        weightKg: { not: null },
        reps: { not: null },
      },
      select: { weightKg: true, reps: true },
    });
    const priorBest = prior.reduce((best, s) => Math.max(best, epley1RM(s.weightKg!, s.reps!)), 0);
    // New PR when this set's e1RM beats every prior working set (priorBest 0 = first ever).
    isPR = e1RM > priorBest + 0.001;
  }

  return { ok: true, sessionId, setId: row.id, e1RM, isPR };
}

/** Delete a single logged set. */
export async function deleteSet(sessionId: string, slotId: string, setNumber: number) {
  await prisma.setLog.deleteMany({ where: { sessionId, slotId, setNumber } });
  return { ok: true };
}

export type FinishSummary = {
  ok: true;
  totalVolumeKg: number;
  workingSets: number;
  durationSec: number;
  prs: { exerciseId: string; name: string; e1RM: number }[];
};

/** Finish a session: compute the summary, mark complete, advance the schedule. */
export async function finishSession(sessionId: string, durationSec: number): Promise<FinishSummary> {
  const session = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    include: { sets: true, day: true },
  });
  if (!session) throw new Error('Session not found');

  const working = session.sets.filter((s) => s.completed && !s.isWarmup && s.weightKg && s.reps);
  const totalVolumeKg = working.reduce((sum, s) => sum + s.weightKg! * s.reps!, 0);

  // PR detection: per exercise, this session's best e1RM vs best from earlier sessions.
  const byExercise = new Map<string, number>();
  for (const s of working) {
    const e = epley1RM(s.weightKg!, s.reps!);
    byExercise.set(s.exerciseId, Math.max(byExercise.get(s.exerciseId) ?? 0, e));
  }
  const prs: { exerciseId: string; name: string; e1RM: number }[] = [];
  for (const [exerciseId, sessionBest] of byExercise) {
    const prior = await prisma.setLog.findMany({
      where: {
        exerciseId,
        completed: true,
        isWarmup: false,
        sessionId: { not: sessionId },
        weightKg: { not: null },
        reps: { not: null },
      },
      select: { weightKg: true, reps: true },
    });
    const priorBest = prior.reduce((b, s) => Math.max(b, epley1RM(s.weightKg!, s.reps!)), 0);
    if (sessionBest > priorBest + 0.001) {
      const ex = await prisma.exercise.findUnique({ where: { id: exerciseId }, select: { name: true } });
      prs.push({ exerciseId, name: ex?.name ?? 'Lift', e1RM: sessionBest });
    }
  }

  await prisma.workoutSession.update({
    where: { id: sessionId },
    data: { completed: true, durationSec },
  });

  // NOTE: the schedule cursor is intentionally NOT advanced here. A server action
  // auto-revalidates its calling route, so advancing now would re-render Today on
  // the next day (remounting the logger via key) and yank the summary sheet away.
  // The cursor advances on summary dismissal via advanceSchedule() instead.
  revalidatePath('/progress');
  return { ok: true, totalVolumeKg, workingSets: working.length, durationSec, prs };
}

/** Advance the schedule cursor within the active block (1..6 cycle). */
export async function advanceSchedule(dayId: string) {
  const day = await prisma.day.findUnique({ where: { id: dayId }, include: { block: true } });
  if (!day) return { ok: false };
  const maxOrder = (await prisma.day.aggregate({ where: { blockId: day.blockId }, _max: { order: true } }))._max.order ?? 6;
  const next = day.order >= maxOrder ? 1 : day.order + 1;
  await prisma.userSettings.update({
    where: { id: 'default' },
    data: { currentDayOrder: next, activeBlockSlug: day.block.slug },
  });
  revalidatePath('/today');
  return { ok: true };
}

/** Discard an in-progress session (and its sets). */
export async function discardSession(sessionId: string) {
  await prisma.workoutSession.deleteMany({ where: { id: sessionId, completed: false } });
  revalidatePath('/today');
  return { ok: true };
}

/** Last logged working sets for a lift — used to prefill a freshly-added exercise. */
export async function prefillForExercise(exerciseId: string) {
  const last = await prisma.setLog.findFirst({
    where: { exerciseId, completed: true, isWarmup: false },
    orderBy: { createdAt: 'desc' },
    select: { sessionId: true },
  });
  if (!last) return [];
  return prisma.setLog.findMany({
    where: { sessionId: last.sessionId, exerciseId, isWarmup: false },
    orderBy: { setNumber: 'asc' },
    select: { weightKg: true, reps: true, rpe: true },
  });
}

/** Remove all sets for one ad-hoc exercise (by its synthetic slotId) in a session. */
export async function removeCustomExerciseSets(sessionId: string, slotId: string) {
  await prisma.setLog.deleteMany({ where: { sessionId, slotId } });
  return { ok: true };
}
