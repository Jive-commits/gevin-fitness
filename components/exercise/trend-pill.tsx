import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { kgToDisplay, roundDisplay, type Units } from '@/lib/units';
import type { ExerciseTrend } from '@/lib/analytics';
import { cn } from '@/lib/utils';

export function TrendPill({ trend, units }: { trend: ExerciseTrend; units: Units }) {
  const map = {
    up: { label: 'Increasing', icon: TrendingUp, cls: 'border-mint/30 bg-mint/12 text-mint' },
    down: { label: 'Declining', icon: TrendingDown, cls: 'border-ember-3/30 bg-ember-3/12 text-ember-3' },
    flat: { label: 'Plateau', icon: Minus, cls: 'border-border surface-2 text-text-dim' },
    none: { label: 'Not enough data', icon: Minus, cls: 'border-border surface-2 text-text-faint' },
  }[trend.status];
  const Icon = map.icon;
  const slopeDisplay = roundDisplay(Math.abs(kgToDisplay(trend.slopePerWeekKg, units)!), units);
  const sign = trend.slopePerWeekKg > 0 ? '+' : trend.slopePerWeekKg < 0 ? '−' : '';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={cn('inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-[13px] font-semibold', map.cls)}>
        <Icon size={15} strokeWidth={2.4} /> {map.label}
      </span>
      {trend.status !== 'none' && (
        <span className="num text-xs text-text-dim">
          {sign}
          {slopeDisplay} {units}/wk
        </span>
      )}
      {trend.pctVs4wk != null && (
        <span className="num text-xs text-text-faint">
          {trend.pctVs4wk >= 0 ? '+' : ''}
          {trend.pctVs4wk.toFixed(1)}% vs 4wk
        </span>
      )}
    </div>
  );
}
