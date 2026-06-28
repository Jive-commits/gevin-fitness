import { RestTimerProvider } from '@/components/logger/rest-timer';
import { TodayLogger, type SlotData } from '@/components/logger/today-logger';
import {
  getActiveDay,
  getDaysList,
  getAllExercises,
  getInProgressSession,
  getLastSetsForExercise,
} from '@/lib/queries';
import { getSettings } from '@/lib/settings';
import { computeHint, incrementForMuscle } from '@/lib/progression';
import type { LoggerSet } from '@/components/logger/exercise-card';

export const dynamic = 'force-dynamic';

export default async function TodayPage() {
  const settings = await getSettings();
  const day = await getActiveDay(settings.activeBlockSlug, settings.currentDayOrder);

  if (!day) {
    return (
      <div className="grid min-h-[70dvh] place-items-center px-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-bold">No session scheduled</h1>
          <p className="mt-2 text-text-dim">Seed a program to begin training.</p>
        </div>
      </div>
    );
  }

  const [allExercises, daysList, session] = await Promise.all([
    getAllExercises(),
    getDaysList(),
    getInProgressSession(day.id),
  ]);

  // Pre-fill from last completed session + compute progression hints per slot.
  const slotsData: SlotData[] = await Promise.all(
    day.slots.map(async (slot) => {
      const last = await getLastSetsForExercise(slot.exercise.id);
      const prev = last.map((s) => ({ weightKg: s.weightKg, reps: s.reps, rpe: s.rpe }));
      const increment = incrementForMuscle(
        slot.exercise.primaryMuscle,
        settings.incrementUpperKg,
        settings.incrementLowerKg,
      );
      const hint = computeHint(prev, slot.repScheme, slot.targetRpe, increment, settings.units);

      // Merge any already-logged sets (from an in-progress session) onto the full
      // prescription, so reloading mid-workout keeps both the logged sets AND the
      // remaining to-do sets.
      const existing = session?.sets.filter((s) => s.slotId === slot.id) ?? [];
      const byNum = new Map(existing.map((s) => [s.setNumber, s]));
      const maxExisting = existing.reduce((m, s) => Math.max(m, s.setNumber), 0);
      const count = Math.max(slot.sets, maxExisting);
      const sets: LoggerSet[] = Array.from({ length: count }, (_, i) => {
        const n = i + 1;
        const e = byNum.get(n);
        if (e) {
          return { setNumber: n, weightKg: e.weightKg, reps: e.reps, rpe: e.rpe, isWarmup: e.isWarmup, completed: e.completed };
        }
        return {
          setNumber: n,
          weightKg: last[i]?.weightKg ?? last[last.length - 1]?.weightKg ?? null,
          reps: last[i]?.reps ?? null,
          rpe: null,
          isWarmup: false,
          completed: false,
        };
      });

      return {
        slot: {
          slotId: slot.id,
          order: slot.order,
          sets: slot.sets,
          repScheme: slot.repScheme,
          targetRpe: slot.targetRpe,
          restSeconds: slot.restSeconds,
          supersetGroup: slot.supersetGroup,
          supersetOrder: slot.supersetOrder,
          notes: slot.notes,
          replacesNote: slot.replacesNote,
          exercise: slot.exercise,
          defaultExercise: slot.defaultExercise,
          isSwapped: slot.isSwapped,
          hint,
        },
        sets,
      };
    }),
  );

  return (
    <RestTimerProvider>
      <TodayLogger
        key={day.id}
        dayId={day.id}
        dayName={day.name}
        blockName={day.blockName}
        splitType={day.splitType}
        slotsData={slotsData}
        initialSessionId={session?.id ?? null}
        initialStartMs={session?.startMs ?? null}
        units={settings.units}
        defaultRestSec={settings.defaultRestSec}
        allExercises={allExercises}
        swapSettings={{
          availableEquipment: settings.availableEquipment,
          backSafeOnly: settings.backSafeOnly,
          myEquipmentOnly: settings.myEquipmentOnly,
        }}
        daysList={daysList}
      />
    </RestTimerProvider>
  );
}
