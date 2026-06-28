'use client';

import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import type { DayActivity } from '@/lib/analytics';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function colIndex(ts: number): number {
  // Monday = 0 … Sunday = 6
  return (new Date(ts).getUTCDay() + 6) % 7;
}

export function ActivityCalendar({
  days,
  onSelectDay,
}: {
  days: DayActivity[];
  onSelectDay?: (ts: number) => void;
}) {
  if (days.length === 0) return null;
  const lead = colIndex(days[0].ts);
  const todayTs = days[days.length - 1].ts;

  return (
    <div>
      <div className="mb-1.5 grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-text-faint">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: lead }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((d, i) => {
          const trained = d.sessions > 0;
          const isToday = d.ts === todayTs;
          const dayNum = new Date(d.ts).getUTCDate();
          const dateLabel = new Date(d.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          const Comp = trained && onSelectDay ? motion.button : motion.div;
          return (
            <Comp
              key={d.ts}
              {...(trained && onSelectDay ? { onClick: () => onSelectDay(d.ts), type: 'button' } : {})}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.008, 0.3), duration: 0.2 }}
              title={trained ? `${dateLabel} · trained — tap to view` : `${dateLabel} · rest`}
              className={cn(
                'relative grid aspect-square place-items-center rounded-[8px] border',
                trained ? 'border-ember-2/40 bg-ember-grad-soft' : 'border-border surface-2',
                trained && onSelectDay && 'tap cursor-pointer',
                isToday && 'ring-2 ring-ice ring-offset-2 ring-offset-bg',
              )}
              style={trained ? { boxShadow: '0 0 12px -4px rgba(255,106,44,0.6)' } : undefined}
            >
              {trained ? (
                <>
                  <Flame size={14} className="text-ember-2" fill="currentColor" />
                  <span className="num absolute right-1 top-0.5 text-[8px] font-semibold leading-none text-ember-1/80">{dayNum}</span>
                </>
              ) : (
                <span className="num text-[11px] font-medium tabular-nums text-text-faint">{dayNum}</span>
              )}
            </Comp>
          );
        })}
      </div>
    </div>
  );
}
