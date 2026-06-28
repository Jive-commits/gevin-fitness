import { ShieldCheck } from 'lucide-react';
import type { Muscle, Equipment, SpinalLoad } from '@prisma/client';
import { muscleLabel, equipmentLabel, SPINAL_LOAD_VALUE } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Mint "back-safe" badge. */
export function BackSafeBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border border-mint/25 bg-mint/12 px-2 py-0.5 text-[11px] font-medium leading-none text-mint',
        className,
      )}
    >
      <ShieldCheck size={11} strokeWidth={2.5} />
      Back-safe
    </span>
  );
}

/** Four-segment spinal-load meter, hotter = more loaded. */
export function SpinalLoadMeter({
  load,
  showLabel = true,
  className,
}: {
  load: SpinalLoad;
  showLabel?: boolean;
  className?: string;
}) {
  const value = SPINAL_LOAD_VALUE[load]; // 0..3
  const segColors = ['bg-mint', 'bg-ember-1', 'bg-ember-2', 'bg-ember-3'];
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex gap-0.5" role="img" aria-label={`Spinal load: ${load.toLowerCase()}`}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 w-3 rounded-full',
              i <= value ? segColors[value] : 'bg-[var(--surface-2)]',
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-[10px] uppercase tracking-wide text-text-faint">
          {load === 'NONE' ? 'no spine load' : `${load.toLowerCase()} load`}
        </span>
      )}
    </div>
  );
}

export function MusclePills({
  primary,
  secondary = [],
  max = 3,
  className,
}: {
  primary: Muscle;
  secondary?: Muscle[];
  max?: number;
  className?: string;
}) {
  const shown = secondary.slice(0, max);
  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      <span className="rounded-pill bg-ember-2/12 px-2 py-0.5 text-[11px] font-medium leading-none text-ember-1">
        {muscleLabel(primary)}
      </span>
      {shown.map((m) => (
        <span
          key={m}
          className="rounded-pill surface-2 border border-border px-2 py-0.5 text-[11px] leading-none text-text-dim"
        >
          {muscleLabel(m)}
        </span>
      ))}
    </div>
  );
}

export function EquipmentChips({
  equipment,
  max = 4,
  className,
}: {
  equipment: Equipment[];
  max?: number;
  className?: string;
}) {
  const shown = equipment.slice(0, max);
  const rest = equipment.length - shown.length;
  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {shown.map((e) => (
        <span
          key={e}
          className="num rounded-md surface-2 border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-text-faint"
        >
          {equipmentLabel(e)}
        </span>
      ))}
      {rest > 0 && <span className="text-[10px] text-text-faint">+{rest}</span>}
    </div>
  );
}
