'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowLeftRight, Pencil, GitBranch, ChevronUp, ArrowUp, ArrowDown, ListOrdered } from 'lucide-react';
import { BackSafeBadge } from '@/components/exercise/exercise-bits';
import { SwapDrawer, type SwapSlot } from '@/components/swap/swap-drawer';
import { SlotEditor, type EditableSlot } from '@/components/program/slot-editor';
import { formatClock } from '@/lib/format';
import { reorderSlots } from '@/app/actions/program';
import { cn } from '@/lib/utils';
import type { DayView, SlotView, ExerciseLite } from '@/lib/types';
import type { Equipment } from '@prisma/client';

type Block = {
  blockSlug: string;
  blockName: string;
  phase: string;
  weeks: number;
  notes: string | null;
  days: DayView[];
};

type Settings = {
  availableEquipment: Equipment[];
  backSafeOnly: boolean;
  myEquipmentOnly: boolean;
};

const SPLIT_TONE: Record<string, string> = {
  LEGS: 'text-ember-1',
  PUSH: 'text-ice',
  PULL: 'text-mint',
};

export function ProgramView({
  blocks,
  allExercises,
  settings,
  programName,
  programAuthor,
  programDescription,
}: {
  blocks: Block[];
  allExercises: ExerciseLite[];
  settings: Settings;
  programName: string;
  programAuthor: string | null;
  programDescription: string | null;
}) {
  const router = useRouter();
  const [blockIdx, setBlockIdx] = useState(0);
  const [openDay, setOpenDay] = useState<string | null>(blocks[0]?.days[0]?.id ?? null);
  const [swapSlot, setSwapSlot] = useState<SwapSlot | null>(null);
  const [editSlot, setEditSlot] = useState<EditableSlot | null>(null);
  const [reorderDay, setReorderDay] = useState<string | null>(null);
  const [showDesc, setShowDesc] = useState(false);

  const block = blocks[blockIdx];
  if (!block) return null;

  function moveSlot(day: DayView, index: number, dir: -1 | 1) {
    const ids = day.slots.map((s) => s.id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    reorderSlots(day.id, ids).then(() => router.refresh());
  }

  return (
    <div className="px-4 pb-6 pt-3">
      {/* Program meta */}
      <div className="mb-3 rounded-card border border-border surface-2 p-4">
        <div className="text-[11px] uppercase tracking-[0.2em] text-text-faint">Active program</div>
        <div className="mt-0.5 font-display text-lg font-bold">{programName}</div>
        {programAuthor && <div className="mt-0.5 text-xs text-text-dim">{programAuthor}</div>}
        {programDescription && (
          <>
            <AnimatePresence initial={false}>
              {showDesc && (
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden text-sm leading-relaxed text-text-dim"
                >
                  <span className="block pt-2">{programDescription}</span>
                </motion.p>
              )}
            </AnimatePresence>
            <button
              onClick={() => setShowDesc((v) => !v)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-ember-1"
            >
              {showDesc ? 'Hide' : 'About this program'}
              {showDesc ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </>
        )}
      </div>

      {/* Block switcher */}
      <div className="mb-3 flex gap-1 rounded-pill border border-border surface-2 p-1">
        {blocks.map((b, i) => (
          <button
            key={b.blockSlug}
            onClick={() => {
              setBlockIdx(i);
              setOpenDay(b.days[0]?.id ?? null);
            }}
            className={cn(
              'tap relative flex-1 rounded-pill px-3 py-2 text-[13px] font-semibold transition-colors',
              i === blockIdx ? 'text-black' : 'text-text-dim',
            )}
          >
            {i === blockIdx && (
              <motion.span layoutId="block-pill" className="absolute inset-0 rounded-pill bg-ember-grad" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
            )}
            <span className="relative">Block {b.days[0] ? i + 1 : i + 1}</span>
          </button>
        ))}
      </div>

      {/* Block meta */}
      <div className="mb-3 flex items-center gap-2 px-1 text-xs text-text-dim">
        <span className="num">{block.weeks} weeks</span>
        <span className="text-text-faint">·</span>
        <span>{block.blockName.replace(/^Block \d+ — /, '')}</span>
      </div>
      {block.notes && (
        <div className="mb-3 rounded-xl border border-ember-2/20 bg-ember-grad-soft px-3.5 py-2.5 text-xs leading-relaxed text-text-dim">
          {block.notes}
        </div>
      )}

      {/* Days */}
      <div className="space-y-2.5">
        {block.days.map((day) => {
          const isOpen = openDay === day.id;
          const reordering = reorderDay === day.id;
          return (
            <div key={day.id} className="overflow-hidden rounded-card border border-border bg-surface">
              <button
                onClick={() => setOpenDay(isOpen ? null : day.id)}
                className="tap flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <span className="num grid h-8 w-8 shrink-0 place-items-center rounded-lg surface-2 text-sm font-bold text-text-dim">
                  {day.order}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base font-semibold">{day.name}</span>
                    <span className={cn('text-[11px] font-semibold uppercase tracking-wide', SPLIT_TONE[day.splitType])}>
                      {day.splitType}
                    </span>
                  </div>
                  <div className="num mt-0.5 text-xs text-text-faint">{day.slots.length} exercises</div>
                </div>
                <ChevronDown size={18} className={cn('shrink-0 text-text-faint transition-transform', isOpen && 'rotate-180')} />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border px-3 pb-3 pt-2">
                      <div className="mb-2 flex justify-end">
                        <button
                          onClick={() => setReorderDay(reordering ? null : day.id)}
                          className={cn(
                            'tap inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[11px] font-medium',
                            reordering ? 'border-ember-2/40 bg-ember-2/12 text-ember-1' : 'border-border text-text-faint',
                          )}
                        >
                          <ListOrdered size={12} /> {reordering ? 'Done' : 'Reorder'}
                        </button>
                      </div>
                      <SlotList
                        day={day}
                        reordering={reordering}
                        onSwap={(slot) => setSwapSlot(slot)}
                        onEdit={(slot) => setEditSlot(slot)}
                        onMove={(idx, dir) => moveSlot(day, idx, dir)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {swapSlot && (
        <SwapDrawer
          open={!!swapSlot}
          onOpenChange={(o) => !o && setSwapSlot(null)}
          slot={swapSlot}
          allExercises={allExercises}
          availableEquipment={settings.availableEquipment}
          defaultBackSafe={settings.backSafeOnly}
          defaultMyEquipment={settings.myEquipmentOnly}
          onSwapped={() => router.refresh()}
        />
      )}
      {editSlot && (
        <SlotEditor open={!!editSlot} onOpenChange={(o) => !o && setEditSlot(null)} slot={editSlot} />
      )}
    </div>
  );
}

function SlotList({
  day,
  reordering,
  onSwap,
  onEdit,
  onMove,
}: {
  day: DayView;
  reordering: boolean;
  onSwap: (s: SwapSlot) => void;
  onEdit: (s: EditableSlot) => void;
  onMove: (idx: number, dir: -1 | 1) => void;
}) {
  return (
    <ul className="space-y-1.5">
      {day.slots.map((slot, idx) => (
        <SlotRow
          key={slot.id}
          slot={slot}
          index={idx}
          total={day.slots.length}
          reordering={reordering}
          onSwap={onSwap}
          onEdit={onEdit}
          onMove={onMove}
        />
      ))}
    </ul>
  );
}

function SlotRow({
  slot,
  index,
  total,
  reordering,
  onSwap,
  onEdit,
  onMove,
}: {
  slot: SlotView;
  index: number;
  total: number;
  reordering: boolean;
  onSwap: (s: SwapSlot) => void;
  onEdit: (s: EditableSlot) => void;
  onMove: (idx: number, dir: -1 | 1) => void;
}) {
  const ss = slot.supersetGroup && slot.supersetOrder ? `${slot.supersetGroup}${slot.supersetOrder}` : null;
  const target = `${slot.sets} × ${slot.repScheme}${slot.targetRpe ? ` @ RPE ${slot.targetRpe}` : ''}`;

  return (
    <motion.li layout className="relative rounded-xl border border-border surface-2 p-3">
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            'num grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11px] font-bold',
            ss ? 'bg-ember-2/15 text-ember-1' : 'surface-2 border border-border text-text-faint',
          )}
        >
          {ss ?? slot.order}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/library/${slot.exercise.slug}`} className="truncate font-medium hover:text-ember-1">
              {slot.exercise.name}
            </Link>
            {slot.exercise.isBackSafe && <BackSafeBadge />}
          </div>
          <div className="num mt-0.5 text-xs text-text-dim">
            {target}
            <span className="text-text-faint"> · rest {formatClock(slot.restSeconds)}</span>
          </div>
          {slot.notes && <div className="mt-1 text-[11px] text-ice">{slot.notes}</div>}
          {(slot.isSwapped || slot.replacesNote) && (
            <div className="mt-1.5 flex items-start gap-1 text-[11px] text-text-faint">
              <GitBranch size={11} className="mt-0.5 shrink-0" />
              <span>
                {slot.isSwapped ? (
                  <>swapped from <span className="text-text-dim">{slot.defaultExercise.name}</span></>
                ) : (
                  slot.replacesNote
                )}
              </span>
            </div>
          )}
        </div>

        {reordering ? (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onMove(index, -1)}
              disabled={index === 0}
              className="tap grid h-7 w-7 place-items-center rounded-md surface-2 border border-border text-text-dim disabled:opacity-30"
              aria-label="Move up"
            >
              <ArrowUp size={14} />
            </button>
            <button
              onClick={() => onMove(index, 1)}
              disabled={index === total - 1}
              className="tap grid h-7 w-7 place-items-center rounded-md surface-2 border border-border text-text-dim disabled:opacity-30"
              aria-label="Move down"
            >
              <ArrowDown size={14} />
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 gap-1">
            <button
              onClick={() => onEdit({ id: slot.id, exerciseName: slot.exercise.name, sets: slot.sets, repScheme: slot.repScheme, targetRpe: slot.targetRpe, restSeconds: slot.restSeconds, notes: slot.notes })}
              className="tap grid h-9 w-9 place-items-center rounded-lg surface-2 border border-border text-text-dim hover:text-text"
              aria-label="Edit prescription"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => onSwap({ id: slot.id, exercise: slot.exercise, defaultExercise: slot.defaultExercise, isSwapped: slot.isSwapped })}
              className="tap grid h-9 w-9 place-items-center rounded-lg border border-ember-2/30 bg-ember-2/10 text-ember-1"
              aria-label="Swap exercise"
            >
              <ArrowLeftRight size={15} />
            </button>
          </div>
        )}
      </div>
    </motion.li>
  );
}
