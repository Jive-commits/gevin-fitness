'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Clock, Layers, Trophy, ChevronRight } from 'lucide-react';
import { BottomSheet } from '@/components/ui/sheet';
import { getDaySessions, type DaySession } from '@/app/actions/history';
import { formatWeight, type Units } from '@/lib/units';
import { formatDuration } from '@/lib/format';

export function DaySessionSheet({
  dayTs,
  onOpenChange,
  units,
}: {
  dayTs: number | null;
  onOpenChange: (open: boolean) => void;
  units: Units;
}) {
  const [data, setData] = useState<DaySession[] | null>(null);
  const [loading, setLoading] = useState(false);
  const open = dayTs != null;

  useEffect(() => {
    if (dayTs == null) return;
    let active = true;
    setLoading(true);
    setData(null);
    getDaySessions(dayTs)
      .then((d) => { if (active) setData(d); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [dayTs]);

  const title = dayTs != null
    ? new Date(dayTs).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={title} description="Workout breakdown">
      {loading ? (
        <div className="grid h-40 place-items-center text-text-faint"><Loader2 className="animate-spin" size={22} /></div>
      ) : !data || data.length === 0 ? (
        <div className="grid h-32 place-items-center text-sm text-text-faint">No workout logged this day.</div>
      ) : (
        <div className="space-y-5 py-1">
          {data.map((s) => (
            <div key={s.id}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-display text-base font-semibold">{s.name}</span>
                <div className="flex items-center gap-2.5 text-[11px] text-text-faint">
                  <span className="num inline-flex items-center gap-1"><Layers size={11} /> {formatWeight(s.volumeKg, units)} {units}</span>
                  {s.durationSec ? <span className="num inline-flex items-center gap-1"><Clock size={11} /> {formatDuration(s.durationSec)}</span> : null}
                </div>
              </div>
              <ul className="space-y-1.5">
                {s.exercises.map((ex, i) => (
                  <li key={i} className="rounded-xl border border-border surface-2 px-3 py-2.5">
                    <Link href={`/library/${ex.slug}`} className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium hover:text-ember-1">{ex.name}</span>
                      <ChevronRight size={14} className="shrink-0 text-text-faint" />
                    </Link>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {ex.sets.map((set, j) => (
                        <span
                          key={j}
                          className={`num rounded-md px-1.5 py-0.5 text-[11px] ${set.isWarmup ? 'bg-[var(--bg)] text-text-faint' : 'bg-[var(--bg)] text-text-dim'}`}
                        >
                          {set.weightKg != null ? `${formatWeight(set.weightKg, units)}×${set.reps ?? '—'}` : `${set.reps ?? '—'} reps`}
                          {set.rpe != null && <span className="text-ember-1">@{set.rpe}</span>}
                          {set.isWarmup && <span className="ml-0.5 text-ember-2/70">w</span>}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
              {s.bestE1RM != null && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-text-faint">
                  <Trophy size={11} className="text-ember-1" /> Best e1RM this session: <span className="num text-ember-1">{formatWeight(s.bestE1RM, units)} {units}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}
