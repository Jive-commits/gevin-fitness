'use server';

import { prisma } from '@/lib/prisma';
import { epley1RM } from '@/lib/format';

const DAY = 86400000;

export type DaySession = {
  id: string;
  ts: number;
  name: string;
  durationSec: number | null;
  volumeKg: number;
  bestE1RM: number | null;
  exercises: {
    name: string;
    slug: string;
    sets: { weightKg: number | null; reps: number | null; rpe: number | null; isWarmup: boolean }[];
  }[];
};

/** All completed sessions on a given UTC day, with their exercises + sets. */
export async function getDaySessions(dayTs: number): Promise<DaySession[]> {
  const start = new Date(dayTs);
  const end = new Date(dayTs + DAY);
  const sessions = await prisma.workoutSession.findMany({
    where: { date: { gte: start, lt: end }, completed: true },
    orderBy: { date: 'asc' },
    include: {
      day: { select: { name: true } },
      sets: { orderBy: { setNumber: 'asc' }, include: { exercise: { select: { name: true, slug: true } } } },
    },
  });

  return sessions.map((s) => {
    const byEx = new Map<string, DaySession['exercises'][number]>();
    let volume = 0;
    let bestE1RM = 0;
    for (const set of s.sets) {
      const g = byEx.get(set.exerciseId) ?? { name: set.exercise.name, slug: set.exercise.slug, sets: [] };
      g.sets.push({ weightKg: set.weightKg, reps: set.reps, rpe: set.rpe, isWarmup: set.isWarmup });
      byEx.set(set.exerciseId, g);
      if (set.completed && !set.isWarmup && set.weightKg && set.reps) {
        volume += set.weightKg * set.reps;
        bestE1RM = Math.max(bestE1RM, epley1RM(set.weightKg, set.reps));
      }
    }
    return {
      id: s.id,
      ts: s.date.getTime(),
      name: s.name ?? s.day?.name ?? 'Workout',
      durationSec: s.durationSec,
      volumeKg: volume,
      bestE1RM: bestE1RM || null,
      exercises: [...byEx.values()],
    };
  });
}
