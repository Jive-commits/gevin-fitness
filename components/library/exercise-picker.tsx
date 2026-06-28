'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { BottomSheet } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Chip } from '@/components/ui/chip';
import { BackSafeBadge, MusclePills, EquipmentChips } from '@/components/exercise/exercise-bits';
import { MUSCLE_GROUPS } from '@/lib/constants';
import type { ExerciseLite } from '@/lib/types';
import type { Muscle } from '@prisma/client';

/** A searchable exercise picker used to add a movement to a freestyle workout. */
export function ExercisePicker({
  open,
  onOpenChange,
  exercises,
  onPick,
  excludeIds = [],
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  exercises: ExerciseLite[];
  onPick: (ex: ExerciseLite) => void;
  excludeIds?: string[];
}) {
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState<string | null>(null);

  const groupMuscles = useMemo<Muscle[] | null>(
    () => (group ? MUSCLE_GROUPS.find((g) => g.label === group)?.muscles ?? null : null),
    [group],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises
      .filter((ex) => !excludeIds.includes(ex.id))
      .filter((ex) =>
        q ? ex.name.toLowerCase().includes(q) || ex.primaryMuscle.toLowerCase().includes(q) || ex.equipment.some((e) => e.toLowerCase().includes(q)) : true,
      )
      .filter((ex) => (groupMuscles ? groupMuscles.includes(ex.primaryMuscle) || ex.secondaryMuscles.some((m) => groupMuscles.includes(m)) : true))
      .slice(0, 80);
  }, [exercises, search, groupMuscles, excludeIds]);

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Add exercise" description="Pick any movement to log">
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exercises…" className="pl-9" autoComplete="off" />
      </div>
      <div className="-mx-5 mb-3 flex gap-2 overflow-x-auto px-5 no-scrollbar">
        <Chip active={group === null} onClick={() => setGroup(null)}>All</Chip>
        {MUSCLE_GROUPS.map((g) => (
          <Chip key={g.label} active={group === g.label} tone="ember" onClick={() => setGroup(group === g.label ? null : g.label)}>
            {g.label}
          </Chip>
        ))}
      </div>
      <ul className="space-y-2">
        {filtered.map((ex) => (
          <li key={ex.id}>
            <button
              onClick={() => {
                onPick(ex);
                onOpenChange(false);
              }}
              className="tap w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-left hover:surface-2"
            >
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{ex.name}</span>
                {ex.isCustom && <span className="rounded-pill bg-ice/12 px-1.5 py-0.5 text-[10px] font-medium text-ice">Custom</span>}
              </div>
              <div className="mt-1.5">
                <MusclePills primary={ex.primaryMuscle} secondary={ex.secondaryMuscles} max={2} />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <EquipmentChips equipment={ex.equipment} max={3} />
                {ex.isBackSafe && <BackSafeBadge />}
              </div>
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="rounded-xl border border-border surface-2 px-4 py-10 text-center text-sm text-text-dim">No matches.</li>
        )}
      </ul>
    </BottomSheet>
  );
}
