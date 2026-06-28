import { RestTimerProvider } from '@/components/logger/rest-timer';
import { CustomLogger, type CustomSlotData } from '@/components/logger/custom-logger';
import { prisma } from '@/lib/prisma';
import { getAllExercises } from '@/lib/queries';
import { getSettings } from '@/lib/settings';
import type { LoggerSet, LoggerSlot } from '@/components/logger/exercise-card';
import type { ExerciseLite } from '@/lib/types';

export const dynamic = 'force-dynamic';

const NO_HINT = { text: '', direction: 'none' as const, suggestedWeightKg: null, suggestedReps: null };

export default async function CustomWorkoutPage() {
  const [settings, allExercises, session] = await Promise.all([
    getSettings(),
    getAllExercises(),
    prisma.workoutSession.findFirst({
      where: { dayId: null, completed: false },
      orderBy: { date: 'desc' },
      include: { sets: { orderBy: { setNumber: 'asc' } } },
    }),
  ]);

  const exById = new Map(allExercises.map((e) => [e.id, e]));

  // Reconstruct ad-hoc exercise cards from the session's sets, grouped by slotId.
  const initialSlots: CustomSlotData[] = [];
  if (session) {
    const groups = new Map<string, { firstCreated: number; exerciseId: string; sets: typeof session.sets }>();
    for (const s of session.sets) {
      const key = s.slotId ?? `ex-${s.exerciseId}`;
      const g = groups.get(key);
      if (!g) groups.set(key, { firstCreated: s.createdAt.getTime(), exerciseId: s.exerciseId, sets: [s] });
      else g.sets.push(s);
    }
    const ordered = [...groups.entries()].sort((a, b) => a[1].firstCreated - b[1].firstCreated);
    let order = 1;
    for (const [slotId, g] of ordered) {
      const ex = exById.get(g.exerciseId) as ExerciseLite | undefined;
      if (!ex) continue;
      const sets: LoggerSet[] = g.sets
        .sort((a, b) => a.setNumber - b.setNumber)
        .map((s) => ({ setNumber: s.setNumber, weightKg: s.weightKg, reps: s.reps, rpe: s.rpe, isWarmup: s.isWarmup, completed: s.completed }));
      const slot: LoggerSlot = {
        slotId,
        order: order++,
        sets: sets.filter((s) => !s.isWarmup).length || sets.length,
        repScheme: ex.defaultRepRange ?? '—',
        targetRpe: null,
        restSeconds: settings.defaultRestSec,
        supersetGroup: null,
        supersetOrder: null,
        notes: null,
        replacesNote: null,
        exercise: ex,
        defaultExercise: { id: ex.id, slug: ex.slug, name: ex.name },
        isSwapped: false,
        hint: NO_HINT,
      };
      initialSlots.push({ slot, sets });
    }
  }

  return (
    <RestTimerProvider>
      <CustomLogger
        initialSessionId={session?.id ?? null}
        initialStartMs={session?.date.getTime() ?? null}
        initialSlots={initialSlots}
        units={settings.units}
        defaultRestSec={settings.defaultRestSec}
        allExercises={allExercises}
      />
    </RestTimerProvider>
  );
}
