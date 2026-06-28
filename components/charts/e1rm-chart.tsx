'use client';

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from 'recharts';
import { kgToDisplay, roundDisplay, type Units } from '@/lib/units';
import { brzycki1RM } from '@/lib/format';

export type ChartPoint = {
  ts: number;
  e1RM: number; // kg
  topWeightKg: number;
  topReps: number;
  isPR: boolean;
  lowConfidence: boolean;
};

const AXIS = { fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--text-faint)' };

function regression(points: { x: number; y: number }[]) {
  if (points.length < 2) return null;
  const n = points.length;
  const mx = points.reduce((a, p) => a + p.x, 0) / n;
  const my = points.reduce((a, p) => a + p.y, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.x - mx) * (p.y - my);
    den += (p.x - mx) ** 2;
  }
  if (den === 0) return null;
  const slope = num / den;
  const intercept = my - slope * mx;
  return { slope, intercept };
}

export function E1RMChart({ points, units }: { points: ChartPoint[]; units: Units }) {
  if (points.length === 0) {
    return <div className="grid h-48 place-items-center text-sm text-text-faint">No logged sets yet.</div>;
  }

  const data = points.map((p) => ({
    ts: p.ts,
    value: roundDisplay(kgToDisplay(p.e1RM, units)!, units),
    isPR: p.isPR,
    low: p.lowConfidence,
    weight: roundDisplay(kgToDisplay(p.topWeightKg, units)!, units),
    reps: p.topReps,
    brzycki: roundDisplay(kgToDisplay(brzycki1RM(p.topWeightKg, p.topReps), units)!, units),
  }));

  const reg = regression(data.map((d) => ({ x: d.ts, y: d.value })));
  const withTrend = data.map((d) => ({ ...d, trend: reg ? Math.round((reg.slope * d.ts + reg.intercept) * 10) / 10 : null }));

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(2, (max - min) * 0.15);

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={withTrend} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="e1rm-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFB23D" />
              <stop offset="100%" stopColor="#FF2D55" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="ts"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(ts) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            tick={AXIS}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            minTickGap={28}
          />
          <YAxis domain={[Math.floor(min - pad), Math.ceil(max + pad)]} tick={AXIS} tickLine={false} axisLine={false} width={44} />
          <Tooltip
            contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}
            labelFormatter={(ts) => new Date(ts as number).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            formatter={(val: number, name: string, item: { payload?: { weight: number; reps: number; brzycki: number; low: boolean } }) => {
              if (name === 'trend') return [`${val} ${units}`, 'trend'];
              const p = item.payload;
              return [
                `${val} ${units}${p?.low ? ' (low-conf)' : ''}  ·  ${p?.weight}×${p?.reps}  ·  Brzycki ${p?.brzycki}`,
                'e1RM',
              ];
            }}
          />
          {reg && <Line type="linear" dataKey="trend" stroke="var(--text-faint)" strokeWidth={1.5} strokeDasharray="5 4" dot={false} isAnimationActive={false} />}
          <Line
            type="monotone"
            dataKey="value"
            stroke="url(#e1rm-line)"
            strokeWidth={2.5}
            dot={(props: { cx?: number; cy?: number; payload?: { isPR: boolean; low: boolean } }) => {
              const { cx, cy, payload } = props;
              if (cx == null || cy == null) return <g />;
              if (payload?.isPR) {
                return <circle cx={cx} cy={cy} r={5} fill="#FF2D55" stroke="var(--bg)" strokeWidth={2} />;
              }
              return <circle cx={cx} cy={cy} r={3} fill="#FF6A2C" opacity={payload?.low ? 0.4 : 1} />;
            }}
            activeDot={{ r: 6, fill: '#FFB23D' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
