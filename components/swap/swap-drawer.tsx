'use client';

import { useMemo, useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Search, RotateCcw, Check, ArrowLeftRight, Plus } from 'lucide-react';
import { BottomSheet } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Chip } from '@/components/ui/chip';
import { Switch } from '@/components/ui/switch';
import { BackSafeBadge, SpinalLoadMeter, MusclePills, EquipmentChips } from '@/components/exercise/exercise-bits';
import { rankSwapCandidates } from '@/lib/swap';
import { muscleLabel, equipmentLabel } from '@/lib/format';
import { MUSCLES, EQUIPMENT } from '@/lib/constants';
import { swapExercise, resetSlotToDefault } from '@/app/actions/program';
import type { ExerciseLite } from '@/lib/types';
import type { Equipment, Muscle } from '@prisma/client';
import { cn } from '@/lib/utils';

export type SwapSlot = {
  id: string;
  exercise: ExerciseLite;
  defaultExercise: { id: string; slug: string; name: string };
  isSwapped: boolean;
};

export function SwapDrawer({
  open,
  onOpenChange,
  slot,
  allExercises,
  availableEquipment,
  defaultBackSafe,
  defaultMyEquipment,
  onSwapped,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  slot: SwapSlot;
  allExercises: ExerciseLite[];
  availableEquipment: Equipment[];
  defaultBackSafe: boolean;
  defaultMyEquipment: boolean;
  onSwapped?: (ex: ExerciseLite) => void;
}) {
  const [search, setSearch] = useState('');
  const [backSafe, setBackSafe] = useState(defaultBackSafe);
  const [myEquip, setMyEquip] = useState(defaultMyEquipment);
  const [muscle, setMuscle] = useState<Muscle | null>(slot.exercise.primaryMuscle);
  const [equip, setEquip] = useState<Equipment[]>([]);
  const [pending, startTransition] = useTransition();
  const [justSwapped, setJustSwapped] = useState<string | null>(null);

  const target = useMemo(
    () => ({
      primaryMuscle: slot.exercise.primaryMuscle,
      secondaryMuscles: slot.exercise.secondaryMuscles,
      movementPattern: slot.exercise.movementPattern,
      category: slot.exercise.category,
      defaultRepRange: slot.exercise.defaultRepRange,
      currentExerciseId: slot.exercise.id,
    }),
    [slot.exercise],
  );

  const ranked = useMemo(() => {
    let list = rankSwapCandidates(allExercises, target, {
      availableEquipment,
      backSafeOnly: backSafe,
      myEquipmentOnly: myEquip,
      search,
      muscle,
    });
    if (equip.length > 0) {
      list = list.filter((r) => r.exercise.equipment.some((e) => equip.includes(e)));
    }
    return list.slice(0, 60);
  }, [allExercises, target, availableEquipment, backSafe, myEquip, search, muscle, equip]);

  const topScore = ranked[0]?.score ?? 1;

  function doSwap(ex: ExerciseLite) {
    setJustSwapped(ex.id);
    onSwapped?.(ex);
    startTransition(async () => {
      await swapExercise(slot.id, ex.id);
      setTimeout(() => onOpenChange(false), 220);
    });
  }

  function doReset() {
    startTransition(async () => {
      await resetSlotToDefault(slot.id);
      onSwapped?.({ ...slot.exercise, id: slot.defaultExercise.id });
      onOpenChange(false);
    });
  }

  // Muscle quick-filter: the slot's primary, its secondaries, then the rest.
  const muscleOrder: Muscle[] = useMemo(() => {
    const lead = [slot.exercise.primaryMuscle, ...slot.exercise.secondaryMuscles];
    const rest = MUSCLES.filter((m) => !lead.includes(m));
    return [...new Set([...lead, ...rest])];
  }, [slot.exercise]);

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Swap exercise"
      description={
        <span className="flex items-center gap-1.5">
          <ArrowLeftRight size={12} className="text-text-faint" />
          Replacing <span className="font-medium text-text">{slot.exercise.name}</span>
        </span>
      }
    >
      {/* Program default + reset */}
      <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-border surface-2 px-3.5 py-2.5">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-text-faint">Program default</div>
          <div className="truncate text-sm font-medium">{slot.defaultExercise.name}</div>
        </div>
        {slot.isSwapped ? (
          <button
            onClick={doReset}
            disabled={pending}
            className="tap inline-flex items-center gap-1.5 rounded-pill border border-mint/30 bg-mint/10 px-3 py-1.5 text-[13px] font-medium text-mint disabled:opacity-50"
          >
            <RotateCcw size={13} /> Reset
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-pill surface-2 px-2.5 py-1 text-[11px] text-text-faint">
            <Check size={12} /> Active
          </span>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exercises…"
          className="pl-9"
          autoComplete="off"
        />
      </div>

      {/* Toggles */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <label className="flex items-center justify-between gap-2 rounded-xl border border-border surface-2 px-3 py-2">
          <span className="text-[13px] font-medium text-text-dim">Back-safe only</span>
          <Switch checked={backSafe} onCheckedChange={setBackSafe} />
        </label>
        <label className="flex items-center justify-between gap-2 rounded-xl border border-border surface-2 px-3 py-2">
          <span className="text-[13px] font-medium text-text-dim">My equipment</span>
          <Switch checked={myEquip} onCheckedChange={setMyEquip} />
        </label>
      </div>

      {/* Muscle chips */}
      <div className="-mx-5 mb-2 flex gap-2 overflow-x-auto px-5 no-scrollbar">
        <Chip active={muscle === null} onClick={() => setMuscle(null)}>
          Any muscle
        </Chip>
        {muscleOrder.map((m) => (
          <Chip key={m} active={muscle === m} tone="ember" onClick={() => setMuscle(muscle === m ? null : m)}>
            {muscleLabel(m)}
          </Chip>
        ))}
      </div>

      {/* Equipment chips */}
      <div className="-mx-5 mb-3 flex gap-2 overflow-x-auto px-5 no-scrollbar">
        {EQUIPMENT.map((e) => (
          <Chip
            key={e}
            active={equip.includes(e)}
            onClick={() => setEquip((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]))}
          >
            {equipmentLabel(e)}
          </Chip>
        ))}
      </div>

      {/* Results */}
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-text-faint">
          {ranked.length} match{ranked.length === 1 ? '' : 'es'}
        </span>
        {backSafe && (
          <span className="text-[11px] text-mint">Back-safe filter on</span>
        )}
      </div>

      {ranked.length === 0 ? (
        <div className="rounded-xl border border-border surface-2 px-4 py-10 text-center">
          <p className="text-sm text-text-dim">No exercises match these filters.</p>
          <p className="mt-1 text-xs text-text-faint">Loosen the equipment or back-safe filter.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {ranked.map((r) => {
            const ex = r.exercise;
            const rel = Math.round((r.score / topScore) * 100);
            const swapped = justSwapped === ex.id;
            return (
              <motion.li
                key={ex.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button
                  onClick={() => doSwap(ex)}
                  disabled={pending}
                  className={cn(
                    'tap w-full rounded-xl border px-3.5 py-3 text-left transition-colors',
                    swapped
                      ? 'border-mint/50 bg-mint/10'
                      : 'border-border bg-surface hover:surface-2',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{ex.name}</span>
                        {ex.isCustom && (
                          <span className="rounded-pill bg-ice/12 px-1.5 py-0.5 text-[10px] font-medium text-ice">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5">
                        <MusclePills primary={ex.primaryMuscle} secondary={ex.secondaryMuscles} max={2} />
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <EquipmentChips equipment={ex.equipment} max={3} />
                        {ex.isBackSafe ? (
                          <BackSafeBadge />
                        ) : (
                          <SpinalLoadMeter load={ex.spinalLoad} showLabel={false} />
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {swapped ? (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="grid h-7 w-7 place-items-center rounded-full bg-mint text-black"
                        >
                          <Check size={16} strokeWidth={3} />
                        </motion.span>
                      ) : (
                        <span className="num text-[11px] text-text-faint">{rel}%</span>
                      )}
                      <div className="h-1 w-12 overflow-hidden rounded-full bg-[var(--surface-2)]">
                        <div className="h-full rounded-full bg-ember-grad" style={{ width: `${rel}%` }} />
                      </div>
                    </div>
                  </div>
                </button>
              </motion.li>
            );
          })}
        </ul>
      )}
    </BottomSheet>
  );
}
