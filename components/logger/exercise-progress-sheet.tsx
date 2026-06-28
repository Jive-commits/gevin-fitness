'use client';

import { useEffect, useState } from 'react';
import { Loader2, Trophy } from 'lucide-react';
import { BottomSheet } from '@/components/ui/sheet';
import { E1RMChart } from '@/components/charts/e1rm-chart';
import { TrendPill } from '@/components/exercise/trend-pill';
import { getExerciseProgress } from '@/app/actions/progress';
import { formatWeight, type Units } from '@/lib/units';
import { formatDate } from '@/lib/format';
import type { SessionPoint, ExerciseTrend, ExercisePRs } from '@/lib/analytics';

type Data = {
  series: SessionPoint[];
  trend: ExerciseTrend;
  history: { ts: number; sets: { setNumber: number; weightKg: number; reps: number; rpe: number | null }[] }[];
  prs: ExercisePRs;
};

export function ExerciseProgressSheet({
  open,
  onOpenChange,
  exerciseId,
  exerciseName,
  units,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  exerciseId: string;
  exerciseName: string;
  units: Units;
}) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    getExerciseProgress(exerciseId)
      .then((d) => { if (active) setData(d as Data); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, exerciseId]);

  const hasData = data && data.series.length > 0;

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Progress" description={exerciseName}>
      {loading && !data ? (
        <div className="grid h-48 place-items-center text-text-faint">
          <Loader2 className="animate-spin" size={22} />
        </div>
      ) : !hasData ? (
        <div className="grid h-44 place-items-center px-6 text-center text-sm text-text-faint">
          No history yet — log a working set on this lift and your e1RM trend appears here.
        </div>
      ) : (
        <div className="space-y-4 py-1">
          <div className="flex items-center justify-between">
            <TrendPill trend={data!.trend} units={units} />
            {data!.trend.current != null && (
              <span className="num text-sm font-bold text-gradient-ember">{formatWeight(data!.trend.current, units)} {units}</span>
            )}
          </div>

          <E1RMChart points={data!.series} units={units} />

          {data!.prs.bestE1RM && (
            <div className="flex items-center gap-2 rounded-xl border border-ember-2/25 bg-ember-grad-soft px-3.5 py-2.5 text-sm">
              <Trophy size={15} className="shrink-0 text-ember-1" />
              <span className="text-text-dim">Best e1RM</span>
              <span className="num ml-auto font-semibold text-ember-1">{formatWeight(data!.prs.bestE1RM.value, units)} {units}</span>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-[11px] uppercase tracking-wide text-text-faint">Last sessions</h3>
            <ul className="space-y-2">
              {data!.history.map((h, i) => (
                <li key={i} className="flex items-start justify-between gap-3 rounded-xl border border-border surface-2 px-3 py-2.5">
                  <span className="num shrink-0 pt-0.5 text-xs text-text-faint">{formatDate(h.ts)}</span>
                  <div className="flex flex-1 flex-wrap justify-end gap-1.5">
                    {h.sets.map((s, j) => (
                      <span key={j} className="num rounded-md bg-[var(--bg)] px-1.5 py-0.5 text-[11px] text-text-dim">
                        {formatWeight(s.weightKg, units)}×{s.reps}
                        {s.rpe != null && <span className="text-ember-1">@{s.rpe}</span>}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
