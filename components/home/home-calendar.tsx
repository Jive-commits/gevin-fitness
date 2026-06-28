'use client';

import { useState } from 'react';
import { ActivityCalendar } from '@/components/home/activity-calendar';
import { DaySessionSheet } from '@/components/history/day-session-sheet';
import type { DayActivity } from '@/lib/analytics';
import type { Units } from '@/lib/units';

export function HomeCalendar({ days, units }: { days: DayActivity[]; units: Units }) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <>
      <ActivityCalendar days={days} onSelectDay={setSelected} />
      <DaySessionSheet dayTs={selected} onOpenChange={(o) => !o && setSelected(null)} units={units} />
    </>
  );
}
