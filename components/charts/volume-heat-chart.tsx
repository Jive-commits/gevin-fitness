'use client';

import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MUSCLE_GROUPS } from '@/lib/constants';
import { kgToDisplay, type Units } from '@/lib/units';
import type { WeeklyMuscleVolume } from '@/lib/analytics';

const GROUP_COLORS: Record<string, string> = {
  Legs: '#FF2D55',
  Back: '#FF6A2C',
  Chest: '#FFB23D',
  Shoulders: '#2DE2B6',
  Arms: '#5BA8FF',
  Core: '#9B9AA5',
};

const muscleToGroup: Record<string, string> = {};
for (const g of MUSCLE_GROUPS) for (const m of g.muscles) muscleToGroup[m] = g.label;

const AXIS = { fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--text-faint)' };

export function VolumeHeatChart({ weeks, units }: { weeks: WeeklyMuscleVolume[]; units: Units }) {
  const [metric, setMetric] = useState<'sets' | 'tonnage'>('sets');

  if (weeks.length === 0) {
    return <div className="grid h-44 place-items-center text-sm text-text-faint">Log sessions to see weekly volume.</div>;
  }

  const data = weeks.map((w) => {
    const row: Record<string, number | string> = {
      week: new Date(w.weekStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    };
    for (const g of MUSCLE_GROUPS) row[g.label] = 0;
    for (const [muscle, v] of Object.entries(w.byMuscle)) {
      const group = muscleToGroup[muscle] ?? 'Core';
      const val = metric === 'sets' ? v.sets : Math.round(kgToDisplay(v.tonnageKg, units)!);
      row[group] = (row[group] as number) + val;
    }
    return row;
  });

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-text-faint">
          weekly volume · {metric === 'sets' ? 'sets' : `tonnage (${units})`}
        </span>
        <div className="flex gap-1 rounded-pill surface-2 border border-border p-0.5">
          {(['sets', 'tonnage'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`rounded-pill px-2.5 py-1 text-[11px] font-medium ${metric === m ? 'bg-ember-grad text-black' : 'text-text-dim'}`}
            >
              {m === 'sets' ? 'Sets' : 'Tonnage'}
            </button>
          ))}
        </div>
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="week" tick={AXIS} tickLine={false} axisLine={{ stroke: 'var(--border)' }} minTickGap={16} />
            <YAxis tick={AXIS} tickLine={false} axisLine={false} width={42} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}
            />
            {MUSCLE_GROUPS.map((g, i) => (
              <Bar
                key={g.label}
                dataKey={g.label}
                stackId="v"
                fill={GROUP_COLORS[g.label]}
                radius={i === MUSCLE_GROUPS.length - 1 ? [4, 4, 0, 0] : undefined}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {MUSCLE_GROUPS.map((g) => (
          <span key={g.label} className="inline-flex items-center gap-1 text-[11px] text-text-dim">
            <span className="h-2 w-2 rounded-full" style={{ background: GROUP_COLORS[g.label] }} />
            {g.label}
          </span>
        ))}
      </div>
    </div>
  );
}
