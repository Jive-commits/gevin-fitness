'use client';

import { Wrench } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useLifterMode } from '@/components/providers/lifter-mode';

export function LifterModeRow() {
  const { lifterMode, setLifterMode, hydrated } = useLifterMode();

  return (
    <label className="flex items-center justify-between gap-3 rounded-card border border-border surface-2 px-4 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ember-2/12 text-ember-1">
          <Wrench size={17} />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-medium">Lifter Mode</div>
          <div className="text-[11px] text-text-faint">
            Power-user mode — every tab, every dial.
          </div>
        </div>
      </div>
      <Switch
        checked={hydrated && lifterMode}
        onCheckedChange={setLifterMode}
        aria-label="Lifter Mode"
      />
    </label>
  );
}
