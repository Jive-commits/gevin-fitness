'use client';

import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Brush,
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
const DAY = 86400000;

// Ranges are relative to the most recent logged point (not "now"), so they always
// show data even when the freshest sessions are weeks back (e.g. imported history).
const RANGES = [
  { label: '1M', days: 31 },
  { label: '3M', days: 92 },
  { label: '6M', days: 183 },
  { label: '1Y', days: 366 },
  { label: 'All', days: Infinity },
] as const;

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
  return { slope, intercept: my - slope * mx };
}

export function E1RMChart({ points, units }: { points: ChartPoint[]; units: Units }) {
  // Default to a recent window; lifters with long histories can zoom out.
  const span = points.length ? points[points.length - 1].ts - points[0].ts : 0;
  const defaultRange = span > 366 * DAY ? '6M' : 'All';
  const [range, setRange] = useState<string>(defaultRange);

  const filtered = useMemo(() => {
    if (points.length === 0) return [];
    const r = RANGES.find((x) => x.label === range)!;
    if (r.days === Infinity) return points;
    const latest = points[points.length - 1].ts;
    const cut = latest - r.days * DAY;
    const f = points.filter((p) => p.ts >= cut);
    return f.length >= 2 ? f : points.slice(-2);
  }, [points, range]);

  if (points.length === 0) {
    return <div className="grid h-48 place-items-center text-sm text-text-faint">No logged sets yet.</div>;
  }

  const data = filtered.map((p) => ({
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
  const shownSpan = data.length > 1 ? data[data.length - 1].ts - data[0].ts : 0;
  const multiYear = shownSpan > 320 * DAY;

  const fmtTick = (ts: number) =>
    new Date(ts).toLocaleDateString(undefined, multiYear ? { month: 'short', year: '2-digit' } : { month: 'short', day: 'numeric' });

  // Only offer ranges that actually subset the data.
  const usableRanges = RANGES.filter((r, i) => r.days === Infinity || i === 0 || r.days < (span / DAY) * 1.4);

  return (
    <div>
      {span > 60 * DAY && (
        <div className="mb-2 flex justify-end gap-1">
          {usableRanges.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r.label)}
              className={`num rounded-pill px-2.5 py-1 text-[11px] font-medium transition-colors ${
                range === r.label ? 'bg-ember-grad text-black' : 'surface-2 border border-border text-text-dim'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={withTrend} margin={{ top: 8, right: 8, bottom: 2, left: -16 }}>
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
              tickFormatter={fmtTick}
              tick={AXIS}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              minTickGap={36}
            />
            <YAxis domain={[Math.floor(min - pad), Math.ceil(max + pad)]} tick={AXIS} tickLine={false} axisLine={false} width={44} />
            <Tooltip
              contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}
              labelFormatter={(ts) => new Date(ts as number).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              formatter={(val: number, name: string, item: { payload?: { weight: number; reps: number; brzycki: number; low: boolean } }) => {
                if (name === 'trend') return [`${val} ${units}`, 'trend'];
                const p = item.payload;
                return [`${val} ${units}${p?.low ? ' (low-conf)' : ''}  ·  ${p?.weight}×${p?.reps}  ·  Brzycki ${p?.brzycki}`, 'e1RM'];
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
                if (payload?.isPR) return <circle cx={cx} cy={cy} r={5} fill="#FF2D55" stroke="var(--bg)" strokeWidth={2} />;
                return <circle cx={cx} cy={cy} r={3} fill="#FF6A2C" opacity={payload?.low ? 0.4 : 1} />;
              }}
              activeDot={{ r: 6, fill: '#FFB23D' }}
              isAnimationActive={false}
            />
            {data.length > 4 && (
              <Brush
                dataKey="ts"
                height={26}
                travellerWidth={10}
                gap={Math.max(1, Math.floor(data.length / 40))}
                stroke="var(--ember-2)"
                fill="rgba(28,28,35,0.55)"
                tickFormatter={fmtTick}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
