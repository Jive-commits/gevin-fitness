'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ArrowLeftRight, Plus, Flame, Trash2, Sparkles, TrendingUp } from 'lucide-react';
import { Stepper } from '@/components/ui/stepper';
import { kgToDisplay, displayToKg, roundDisplay, loadStep, formatWeight, type Units } from '@/lib/units';
import type { ProgressionHint } from '@/lib/progression';
import type { ExerciseLite } from '@/lib/types';
import { cn } from '@/lib/utils';

export type LoggerSet = {
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
  isWarmup: boolean;
  completed: boolean;
};

export type LoggerSlot = {
  slotId: string;
  order: number;
  sets: number;
  repScheme: string;
  targetRpe: string | null;
  restSeconds: number;
  supersetGroup: string | null;
  supersetOrder: number | null;
  notes: string | null;
  replacesNote: string | null;
  exercise: ExerciseLite;
  defaultExercise: { id: string; slug: string; name: string };
  isSwapped: boolean;
  hint: ProgressionHint;
};

const LOWER = ['QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES'];

export function ExerciseCard({
  slot,
  sets,
  units,
  expanded,
  onToggleExpand,
  onChangeSet,
  onToggleComplete,
  onAddSet,
  onRemoveSet,
  onSwap,
  onRemoveExercise,
  prCelebrating,
}: {
  slot: LoggerSlot;
  sets: LoggerSet[];
  units: Units;
  expanded: boolean;
  onToggleExpand: () => void;
  onChangeSet: (setNumber: number, partial: Partial<LoggerSet>) => void;
  onToggleComplete: (setNumber: number) => void;
  onAddSet: (isWarmup: boolean) => void;
  onRemoveSet: (setNumber: number) => void;
  onSwap?: () => void;
  onRemoveExercise?: () => void;
  prCelebrating: boolean;
}) {
  const working = sets.filter((s) => !s.isWarmup);
  const doneCount = working.filter((s) => s.completed).length;
  const allDone = working.length > 0 && doneCount === working.length;

  const firstIncomplete = sets.findIndex((s) => !s.completed);
  const [activeIdx, setActiveIdx] = useState(firstIncomplete >= 0 ? firstIncomplete : 0);
  const active = sets[activeIdx] ?? sets[0];

  const isLower = LOWER.includes(slot.exercise.primaryMuscle);
  const step = loadStep(units, isLower);
  const ss = slot.supersetGroup && slot.supersetOrder ? `${slot.supersetGroup}${slot.supersetOrder}` : null;
  const target = `${slot.sets} × ${slot.repScheme}${slot.targetRpe ? ` @ RPE ${slot.targetRpe}` : ''}`;

  function setWeight(displayVal: number | null) {
    if (!active) return;
    onChangeSet(active.setNumber, {
      weightKg: displayVal == null ? null : displayToKg(displayVal, units),
    });
  }

  const weightDisplay =
    active?.weightKg == null ? null : roundDisplay(kgToDisplay(active.weightKg, units)!, units);

  function acceptHint() {
    if (!active || !slot.hint.suggestedWeightKg) return;
    onChangeSet(active.setNumber, {
      weightKg: slot.hint.suggestedWeightKg,
      reps: slot.hint.suggestedReps ?? active.reps,
    });
  }

  return (
    <motion.div
      layout
      className={cn(
        'overflow-hidden rounded-card border bg-surface transition-colors',
        allDone ? 'border-mint/30' : expanded ? 'border-ember-2/30 shadow-ember' : 'border-border',
      )}
    >
      {/* Header */}
      <button onClick={onToggleExpand} className="tap flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <span
          className={cn(
            'num grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-bold',
            ss ? 'bg-ember-2/15 text-ember-1' : allDone ? 'bg-mint/15 text-mint' : 'surface-2 border border-border text-text-faint',
          )}
        >
          {allDone ? <Check size={18} strokeWidth={3} /> : ss ?? slot.order}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-display font-semibold">{slot.exercise.name}</span>
          </div>
          <div className="num mt-0.5 text-xs text-text-dim">{target}</div>
        </div>
        {/* progress dots */}
        <div className="flex shrink-0 items-center gap-1">
          {working.map((s, i) => (
            <span
              key={i}
              className={cn('h-1.5 w-1.5 rounded-full', s.completed ? 'bg-mint' : 'bg-[var(--surface-2)] border border-border')}
            />
          ))}
        </div>
        <ChevronDown size={18} className={cn('shrink-0 text-text-faint transition-transform', expanded && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {expanded && active && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 pb-4 pt-3">
              {/* lineage / notes */}
              {(slot.notes || slot.isSwapped || slot.replacesNote) && (
                <div className="mb-3 space-y-1">
                  {slot.notes && <div className="text-[11px] text-ice">{slot.notes}</div>}
                  {(slot.isSwapped || slot.replacesNote) && (
                    <div className="text-[11px] text-text-faint">
                      {slot.isSwapped ? `swapped from ${slot.defaultExercise.name}` : slot.replacesNote}
                    </div>
                  )}
                </div>
              )}

              {/* set pills */}
              <div className="mb-3 flex flex-wrap gap-1.5">
                {sets.map((s, i) => (
                  <button
                    key={s.setNumber}
                    onClick={() => setActiveIdx(i)}
                    className={cn(
                      'num flex h-8 min-w-[34px] items-center justify-center gap-1 rounded-lg border px-2 text-xs font-semibold',
                      i === activeIdx
                        ? 'border-ember-2/50 bg-ember-2/12 text-ember-1'
                        : s.completed
                          ? 'border-mint/30 bg-mint/10 text-mint'
                          : 'border-border surface-2 text-text-faint',
                    )}
                  >
                    {s.isWarmup ? <Flame size={12} /> : s.completed ? <Check size={12} strokeWidth={3} /> : null}
                    {s.isWarmup ? 'W' : s.setNumber - sets.filter((x, j) => j < i && x.isWarmup).length}
                  </button>
                ))}
                <button
                  onClick={() => onAddSet(false)}
                  className="tap grid h-8 w-8 place-items-center rounded-lg border border-dashed border-border text-text-faint"
                  aria-label="Add set"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* active set */}
              <div
                className={cn(
                  'rounded-xl border p-4 transition-colors',
                  active.completed ? 'border-mint/30 bg-mint/[0.06]' : 'border-border surface-2',
                )}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-text-dim">
                    {active.isWarmup ? 'Warm-up set' : `Set ${active.setNumber - sets.filter((x, j) => j < activeIdx && x.isWarmup).length}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onChangeSet(active.setNumber, { isWarmup: !active.isWarmup })}
                      className={cn(
                        'tap inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-[11px] font-medium',
                        active.isWarmup ? 'border-ember-2/40 bg-ember-2/12 text-ember-1' : 'border-border text-text-faint',
                      )}
                    >
                      <Flame size={11} /> Warm-up
                    </button>
                    {sets.length > 1 && (
                      <button
                        onClick={() => {
                          onRemoveSet(active.setNumber);
                          setActiveIdx((i) => Math.max(0, i - 1));
                        }}
                        className="tap grid h-7 w-7 place-items-center rounded-lg text-text-faint hover:text-ember-3"
                        aria-label="Remove set"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <Stepper
                    label={`Weight (${units})`}
                    value={weightDisplay}
                    onChange={setWeight}
                    step={step}
                    min={0}
                    max={units === 'lb' ? 1500 : 700}
                    size="lg"
                    emberWhenSet
                  />
                  <div className="flex w-full flex-wrap items-start justify-center gap-x-2 gap-y-3">
                    <Stepper
                      label="Reps"
                      value={active.reps}
                      onChange={(v) => onChangeSet(active.setNumber, { reps: v })}
                      step={1}
                      min={0}
                      max={100}
                      compact
                    />
                    <Stepper
                      label="RPE"
                      value={active.rpe}
                      onChange={(v) => onChangeSet(active.setNumber, { rpe: v })}
                      step={0.5}
                      min={5}
                      max={10}
                      compact
                    />
                  </div>
                </div>

                <button
                  onClick={() => onToggleComplete(active.setNumber)}
                  className={cn(
                    'tap mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold',
                    active.completed
                      ? 'border border-mint/40 bg-mint/15 text-mint'
                      : 'bg-ember-grad text-black shadow-ember-sm',
                  )}
                >
                  {active.completed ? (
                    <>
                      <Check size={18} strokeWidth={3} /> Logged — tap to undo
                    </>
                  ) : (
                    <>
                      <Check size={18} strokeWidth={3} /> Complete set
                    </>
                  )}
                </button>
              </div>

              {/* progression hint */}
              {slot.hint.direction === 'up' && !active.completed && (
                <button
                  onClick={acceptHint}
                  className="tap mt-3 flex w-full items-center gap-2 rounded-xl border border-ember-2/25 bg-ember-grad-soft px-3.5 py-2.5 text-left"
                >
                  <TrendingUp size={15} className="shrink-0 text-ember-1" />
                  <span className="flex-1 text-xs text-text-dim">{slot.hint.text}</span>
                  <span className="shrink-0 rounded-pill bg-ember-2/15 px-2 py-0.5 text-[11px] font-medium text-ember-1">
                    Apply
                  </span>
                </button>
              )}
              {slot.hint.direction === 'hold' && !active.completed && (
                <div className="mt-3 flex items-center gap-2 px-1 text-[11px] text-text-faint">
                  <TrendingUp size={13} /> {slot.hint.text}
                </div>
              )}

              {/* swap / remove + warm-up */}
              <div className="mt-3 flex gap-2">
                {onSwap && (
                  <button
                    onClick={onSwap}
                    className="tap flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border surface-2 py-2.5 text-xs font-medium text-text-dim"
                  >
                    <ArrowLeftRight size={14} /> Swap
                  </button>
                )}
                {onRemoveExercise && (
                  <button
                    onClick={onRemoveExercise}
                    className="tap flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border surface-2 py-2.5 text-xs font-medium text-text-dim"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                )}
                <button
                  onClick={() => onAddSet(true)}
                  className="tap flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border surface-2 py-2.5 text-xs font-medium text-text-dim"
                >
                  <Flame size={14} /> Add warm-up
                </button>
                <Link
                  href={`/library/${slot.exercise.slug}`}
                  className="tap flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border surface-2 py-2.5 text-xs font-medium text-text-dim"
                >
                  Details
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PR celebration */}
      <AnimatePresence>
        {prCelebrating && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 border-t border-ember-2/30 bg-ember-grad-soft px-4 py-2.5"
          >
            <Sparkles size={15} className="text-ember-1 animate-count-glow" />
            <span className="text-xs font-semibold text-gradient-ember">New estimated 1RM PR!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
