import { RestTimerProvider } from '@/components/logger/rest-timer';
import { GuidedLogger } from '@/components/logger/guided-logger';
import type { SlotData } from '@/components/logger/today-logger';
import {
  getActiveDay,
  getAllExercises,
  getInProgressSession,
  getLastSetsForExercise,
} from '@/lib/queries';
import { getSettings } from '@/lib/settings';
import { getConsistency } from '@/lib/analytics';
import { computeHint, incrementForMuscle } from '@/lib/progression';
import type { LoggerSet } from '@/components/logger/exercise-card';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function GuidedTodayPage() {
  const settings = await getSettings();
  const day = await getActiveDay(settings.activeBlockSlug, settings.currentDayOrder);

  if (!day) {
    return (
      <div className="grid min-h-[70dvh] place-items-center px-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-bold">No session scheduled</h1>
          <p className="mt-2 text-text-dim">Seed a program to begin training.</p>
          <Link href="/today" className="mt-4 inline-block text-sm font-medium text-ice">
            Back to Today
          </Link>
        </div>
      </div>
    );
  }

  const [allExercises, session, consistency] = await Promise.all([
    getAllExercises(),
    getInProgressSession(day.id),
    getConsistency(),
  ]);

  // Build the SAME merged slot/set shape today-logger receives (mirrors today/page.tsx).
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
        // Pre-fill weight from the engine's suggestion (the one-tap default), then
        // fall back to last session's matching set, so Log set is never empty.
        return {
          setNumber: n,
          weightKg: hint.suggestedWeightKg ?? last[i]?.weightKg ?? last[last.length - 1]?.weightKg ?? null,
          reps: hint.suggestedReps ?? last[i]?.reps ?? null,
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
      <GuidedLogger
        key={day.id}
        dayId={day.id}
        dayName={day.name}
        slotsData={slotsData}
        initialSessionId={session?.id ?? null}
        initialStartMs={session?.startMs ?? null}
        units={settings.units}
        defaultRestSec={settings.defaultRestSec}
        incrementUpperKg={settings.incrementUpperKg}
        incrementLowerKg={settings.incrementLowerKg}
        sessionCount={consistency.sessions + 1}
        allExercises={allExercises}
        swapSettings={{
          availableEquipment: settings.availableEquipment,
          backSafeOnly: settings.backSafeOnly,
          myEquipmentOnly: settings.myEquipmentOnly,
        }}
      />
    </RestTimerProvider>
  );
}
