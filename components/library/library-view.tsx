'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Plus, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Chip } from '@/components/ui/chip';
import { Switch } from '@/components/ui/switch';
import { ExerciseForm } from '@/components/library/exercise-form';
import { BackSafeBadge, SpinalLoadMeter, MusclePills, EquipmentChips } from '@/components/exercise/exercise-bits';
import { equipmentLabel } from '@/lib/format';
import { MUSCLE_GROUPS, EQUIPMENT } from '@/lib/constants';
import type { ExerciseLite } from '@/lib/types';
import type { Equipment, Muscle } from '@prisma/client';

export function LibraryView({ exercises }: { exercises: ExerciseLite[] }) {
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState<string | null>(null);
  const [equip, setEquip] = useState<Equipment[]>([]);
  const [backSafe, setBackSafe] = useState(false);
  const [customOnly, setCustomOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const groupMuscles = useMemo<Muscle[] | null>(() => {
    if (!group) return null;
    return MUSCLE_GROUPS.find((g) => g.label === group)?.muscles ?? null;
  }, [group]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter((ex) => {
      if (q && !(ex.name.toLowerCase().includes(q) || ex.primaryMuscle.toLowerCase().includes(q) || ex.equipment.some((e) => e.toLowerCase().includes(q)))) return false;
      if (groupMuscles && !(groupMuscles.includes(ex.primaryMuscle) || ex.secondaryMuscles.some((m) => groupMuscles.includes(m)))) return false;
      if (equip.length > 0 && !ex.equipment.some((e) => equip.includes(e))) return false;
      if (backSafe && !ex.isBackSafe) return false;
      if (customOnly && !ex.isCustom) return false;
      return true;
    });
  }, [exercises, search, groupMuscles, equip, backSafe, customOnly]);

  const customCount = exercises.filter((e) => e.isCustom).length;

  return (
    <div className="px-4 pb-6 pt-3">
      <button
        onClick={() => setAddOpen(true)}
        className="tap mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-ember-grad py-3 text-sm font-semibold text-black shadow-ember-sm"
      >
        <Plus size={18} /> Add exercise
      </button>

      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search 150+ exercises…" className="pl-9" autoComplete="off" />
      </div>

      {/* Muscle group chips */}
      <div className="-mx-4 mb-2 flex gap-2 overflow-x-auto px-4 no-scrollbar">
        <Chip active={group === null} onClick={() => setGroup(null)}>All</Chip>
        {MUSCLE_GROUPS.map((g) => (
          <Chip key={g.label} active={group === g.label} tone="ember" onClick={() => setGroup(group === g.label ? null : g.label)}>
            {g.label}
          </Chip>
        ))}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="tap ml-auto inline-flex shrink-0 items-center gap-1 rounded-pill border border-border surface-2 px-3 py-1.5 text-[13px] text-text-dim"
        >
          <SlidersHorizontal size={13} /> Filters
        </button>
      </div>

      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-3 space-y-3 overflow-hidden">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar">
            {EQUIPMENT.map((e) => (
              <Chip key={e} active={equip.includes(e)} onClick={() => setEquip((p) => (p.includes(e) ? p.filter((x) => x !== e) : [...p, e]))}>
                {equipmentLabel(e)}
              </Chip>
            ))}
          </div>
          <div className="flex gap-2">
            <label className="flex flex-1 items-center justify-between gap-2 rounded-xl border border-border surface-2 px-3 py-2">
              <span className="text-[13px] font-medium text-text-dim">Back-safe</span>
              <Switch checked={backSafe} onCheckedChange={setBackSafe} />
            </label>
            <label className="flex flex-1 items-center justify-between gap-2 rounded-xl border border-border surface-2 px-3 py-2">
              <span className="text-[13px] font-medium text-text-dim">Custom only</span>
              <Switch checked={customOnly} onCheckedChange={setCustomOnly} />
            </label>
          </div>
        </motion.div>
      )}

      <div className="mb-2 flex items-center justify-between px-1">
        <span className="num text-[11px] uppercase tracking-wide text-text-faint">{filtered.length} exercises</span>
        {customCount > 0 && <span className="text-[11px] text-ice">{customCount} custom</span>}
      </div>

      <ul className="space-y-2">
        {filtered.map((ex) => (
          <li key={ex.id}>
            <Link href={`/library/${ex.slug}`} className="tap flex items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-3 hover:surface-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{ex.name}</span>
                  {ex.isCustom && <span className="rounded-pill bg-ice/12 px-1.5 py-0.5 text-[10px] font-medium text-ice">Custom</span>}
                </div>
                <div className="mt-1.5">
                  <MusclePills primary={ex.primaryMuscle} secondary={ex.secondaryMuscles} max={2} />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <EquipmentChips equipment={ex.equipment} max={3} />
                  {ex.isBackSafe ? <BackSafeBadge /> : <SpinalLoadMeter load={ex.spinalLoad} showLabel={false} />}
                </div>
              </div>
              <ChevronRight size={18} className="shrink-0 text-text-faint" />
            </Link>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="rounded-xl border border-border surface-2 px-4 py-12 text-center text-sm text-text-dim">
            No exercises match. Try clearing filters or add your own.
          </li>
        )}
      </ul>

      <ExerciseForm open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
