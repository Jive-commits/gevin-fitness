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

export function ActivityCalendar({ days }: { days: DayActivity[] }) {
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
          return (
            <motion.div
              key={d.ts}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.008, 0.3), duration: 0.2 }}
              title={trained ? `${dateLabel} · trained` : `${dateLabel} · rest`}
              className={cn(
                'grid aspect-square place-items-center rounded-[8px] border',
                trained ? 'border-ember-2/40 bg-ember-grad-soft' : 'border-border surface-2',
                isToday && 'ring-2 ring-ice ring-offset-2 ring-offset-bg',
              )}
              style={trained ? { boxShadow: '0 0 12px -4px rgba(255,106,44,0.6)' } : undefined}
            >
              {trained ? (
                <Flame size={15} className="text-ember-2" fill="currentColor" />
              ) : (
                <span className="num text-[11px] font-medium tabular-nums text-text-faint">{dayNum}</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
