'use client';

import { ResponsiveContainer, LineChart, Line, YAxis, Tooltip, XAxis } from 'recharts';

export function Sparkline({
  points,
  color = '#5BA8FF',
  height = 64,
  suffix = '',
  decimals = 1,
}: {
  points: { ts: number; value: number }[];
  color?: string;
  height?: number;
  suffix?: string;
  decimals?: number;
}) {
  if (points.length === 0) {
    return <div className="grid place-items-center text-xs text-text-faint" style={{ height }}>No data yet.</div>;
  }
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(0.5, (max - min) * 0.2);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <YAxis hide domain={[min - pad, max + pad]} />
          <XAxis dataKey="ts" hide />
          <Tooltip
            contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
            labelStyle={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}
            labelFormatter={(ts) => new Date(ts as number).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            formatter={(v: number) => [`${v.toFixed(decimals)}${suffix}`, '']}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
