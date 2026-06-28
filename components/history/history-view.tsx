'use client';

import { useState } from 'react';
import { Clock, Layers, Dumbbell } from 'lucide-react';
import { ActivityCalendar } from '@/components/home/activity-calendar';
import { DaySessionSheet } from '@/components/history/day-session-sheet';
import { formatWeight, type Units } from '@/lib/units';
import { formatDuration } from '@/lib/format';
import type { DayActivity, SessionSummary } from '@/lib/analytics';

export function HistoryView({
  days,
  sessions,
  units,
}: {
  days: DayActivity[];
  sessions: SessionSummary[];
  units: Units;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="space-y-4 px-4 pb-6 pt-3">
      <section className="rounded-card border border-border bg-surface p-4">
        <h2 className="mb-3 font-display text-base font-semibold">Calendar</h2>
        <ActivityCalendar days={days} onSelectDay={setSelected} />
        <p className="mt-3 text-[11px] text-text-faint">Tap any 🔥 day to see what you trained.</p>
      </section>

      <section>
        <h2 className="mb-2 px-1 font-display text-base font-semibold">All sessions</h2>
        {sessions.length === 0 ? (
          <div className="rounded-card border border-border surface-2 px-5 py-12 text-center text-sm text-text-dim">
            No logged sessions yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setSelected(s.dayTs)}
                  className="tap flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-3 text-left hover:surface-2"
                >
                  <div className="num grid h-11 w-11 shrink-0 place-items-center rounded-lg surface-2 text-center leading-none">
                    <span className="text-[9px] uppercase text-text-faint">{new Date(s.ts).toLocaleDateString(undefined, { month: 'short' })}</span>
                    <span className="text-base font-bold">{new Date(s.ts).getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{s.name}</div>
                    <div className="num mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-text-faint">
                      <span className="inline-flex items-center gap-1"><Dumbbell size={11} /> {s.exercises} ex · {s.sets} sets</span>
                      <span className="inline-flex items-center gap-1"><Layers size={11} /> {formatWeight(s.volumeKg, units)} {units}</span>
                      {s.durationSec ? <span className="inline-flex items-center gap-1"><Clock size={11} /> {formatDuration(s.durationSec)}</span> : null}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {sessions.length >= 60 && (
          <p className="mt-3 text-center text-[11px] text-text-faint">Showing your 60 most recent sessions.</p>
        )}
      </section>

      <DaySessionSheet dayTs={selected} onOpenChange={(o) => !o && setSelected(null)} units={units} />
    </div>
  );
}
