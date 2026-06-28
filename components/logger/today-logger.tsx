'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, ChevronDown, Flag, Trophy, Loader2, Dumbbell, RotateCcw, Plus } from 'lucide-react';
import { ExerciseCard, type LoggerSet, type LoggerSlot } from '@/components/logger/exercise-card';
import { SwapDrawer, type SwapSlot } from '@/components/swap/swap-drawer';
import { BottomSheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useRestTimer } from '@/components/logger/rest-timer';
import { saveSet, ensureSession, finishSession, advanceSchedule, discardSession, type FinishSummary } from '@/app/actions/session';
import { setActiveDay } from '@/app/actions/settings';
import { formatClock, formatDuration } from '@/lib/format';
import { formatWeight, type Units } from '@/lib/units';
import { cn } from '@/lib/utils';
import type { ExerciseLite } from '@/lib/types';
import type { Equipment } from '@prisma/client';

export type SlotData = { slot: LoggerSlot; sets: LoggerSet[] };

type DayMeta = { id: string; slug: string; name: string; order: number; blockSlug: string; blockName: string; splitType: string };

const SPLIT_TONE: Record<string, string> = { LEGS: 'text-ember-1', PUSH: 'text-ice', PULL: 'text-mint' };

export function TodayLogger({
  dayId,
  dayName,
  blockName,
  splitType,
  slotsData,
  initialSessionId,
  initialStartMs,
  units,
  defaultRestSec,
  allExercises,
  swapSettings,
  daysList,
}: {
  dayId: string;
  dayName: string;
  blockName: string;
  splitType: string;
  slotsData: SlotData[];
  initialSessionId: string | null;
  initialStartMs: number | null;
  units: Units;
  defaultRestSec: number;
  allExercises: ExerciseLite[];
  swapSettings: { availableEquipment: Equipment[]; backSafeOnly: boolean; myEquipmentOnly: boolean };
  daysList: DayMeta[];
}) {
  const router = useRouter();
  const rest = useRestTimer();

  const [slotSets, setSlotSets] = useState<Record<string, LoggerSet[]>>(() => {
    const m: Record<string, LoggerSet[]> = {};
    for (const sd of slotsData) m[sd.slot.slotId] = sd.sets;
    return m;
  });
  const slotMeta = useMemo(() => {
    const m: Record<string, LoggerSlot> = {};
    for (const sd of slotsData) m[sd.slot.slotId] = sd.slot;
    return m;
  }, [slotsData]);

  const firstIncompleteSlot = slotsData.find((sd) =>
    (slotSets[sd.slot.slotId] ?? sd.sets).some((s) => !s.completed && !s.isWarmup),
  );
  const [expanded, setExpanded] = useState<string | null>(firstIncompleteSlot?.slot.slotId ?? slotsData[0]?.slot.slotId ?? null);
  const [swapSlot, setSwapSlot] = useState<SwapSlot | null>(null);
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [summary, setSummary] = useState<FinishSummary | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // ----- session lifecycle (auto, no Save button) -----
  const sessionIdRef = useRef<string | null>(initialSessionId);
  const ensurePromiseRef = useRef<Promise<string> | null>(null);
  const startMsRef = useRef<number | null>(initialStartMs);
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Mirror of slotSets so a debounced save reads the LATEST set state at fire time
  // (prevents a stale field-edit save from reverting a just-completed set).
  const slotSetsRef = useRef(slotSets);
  useEffect(() => {
    slotSetsRef.current = slotSets;
  }, [slotSets]);

  const ensureId = useCallback(async (): Promise<string> => {
    if (sessionIdRef.current) return sessionIdRef.current;
    if (!ensurePromiseRef.current) {
      ensurePromiseRef.current = ensureSession(dayId).then((id) => {
        sessionIdRef.current = id;
        if (startMsRef.current == null) startMsRef.current = Date.now();
        return id;
      });
    }
    return ensurePromiseRef.current;
  }, [dayId]);

  const persist = useCallback(
    async (slotId: string, set: LoggerSet) => {
      const ex = slotMeta[slotId].exercise;
      const sid = await ensureId();
      return saveSet({
        sessionId: sid,
        dayId,
        slotId,
        exerciseId: ex.id,
        setNumber: set.setNumber,
        weightKg: set.weightKg,
        reps: set.reps,
        rpe: set.rpe,
        isWarmup: set.isWarmup,
        completed: set.completed,
      });
    },
    [dayId, ensureId, slotMeta],
  );

  // Running clock
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsedSec = startMsRef.current ? Math.floor((now - startMsRef.current) / 1000) : 0;

  const allSets = Object.values(slotSets).flat();
  const totalWorking = allSets.filter((s) => !s.isWarmup).length;
  const doneWorking = allSets.filter((s) => !s.isWarmup && s.completed).length;

  function updateSet(slotId: string, setNumber: number, partial: Partial<LoggerSet>, opts?: { immediate?: boolean }) {
    setSlotSets((prev) => {
      const rows = prev[slotId].map((s) => (s.setNumber === setNumber ? { ...s, ...partial } : s));
      const updated = rows.find((s) => s.setNumber === setNumber)!;
      // Schedule persistence (debounced for field edits, immediate for completion toggles).
      const key = `${slotId}:${setNumber}`;
      if (debounceRef.current[key]) clearTimeout(debounceRef.current[key]);
      if (opts?.immediate) {
        void persist(slotId, updated);
      } else {
        // Read the freshest state at fire time so we never clobber a completion.
        debounceRef.current[key] = setTimeout(() => {
          const latest = slotSetsRef.current[slotId]?.find((s) => s.setNumber === setNumber);
          if (latest) void persist(slotId, latest);
        }, 650);
      }
      return { ...prev, [slotId]: rows };
    });
  }

  async function toggleComplete(slotId: string, setNumber: number) {
    const current = slotSets[slotId].find((s) => s.setNumber === setNumber)!;
    const nextCompleted = !current.completed;
    const updated = { ...current, completed: nextCompleted };
    // Cancel any pending field-edit save for this set so it can't revert completion.
    const key = `${slotId}:${setNumber}`;
    if (debounceRef.current[key]) clearTimeout(debounceRef.current[key]);
    setSlotSets((prev) => ({
      ...prev,
      [slotId]: prev[slotId].map((s) => (s.setNumber === setNumber ? updated : s)),
    }));
    if (nextCompleted) {
      const restSec = slotMeta[slotId].restSeconds || defaultRestSec;
      if (restSec > 0 && !updated.isWarmup) rest.start(restSec, slotMeta[slotId].exercise.name);
      const res = await persist(slotId, updated);
      if (res.isPR) {
        setCelebrating(slotId);
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try { navigator.vibrate?.(30); } catch {}
        }
        setTimeout(() => setCelebrating(null), 2600);
      }
    } else {
      await persist(slotId, updated);
    }
  }

  function addSet(slotId: string, isWarmup: boolean) {
    setSlotSets((prev) => {
      const rows = prev[slotId];
      const nextNum = Math.max(0, ...rows.map((s) => s.setNumber)) + 1;
      // seed from the last working set's numbers
      const seed = [...rows].reverse().find((s) => !s.isWarmup);
      const row: LoggerSet = {
        setNumber: nextNum,
        weightKg: isWarmup ? null : seed?.weightKg ?? null,
        reps: isWarmup ? null : seed?.reps ?? null,
        rpe: null,
        isWarmup,
        completed: false,
      };
      return { ...prev, [slotId]: [...rows, row] };
    });
  }

  function removeSet(slotId: string, setNumber: number) {
    const sid = sessionIdRef.current;
    setSlotSets((prev) => ({ ...prev, [slotId]: prev[slotId].filter((s) => s.setNumber !== setNumber) }));
    if (sid) {
      import('@/app/actions/session').then(({ deleteSet }) => deleteSet(sid, slotId, setNumber));
    }
  }

  async function handleFinish() {
    setFinishing(true);
    const sid = await ensureId();
    const duration = startMsRef.current ? Math.floor((Date.now() - startMsRef.current) / 1000) : elapsedSec;
    const res = await finishSession(sid, duration);
    setSummary(res);
    setFinishing(false);
  }

  async function handleReset() {
    setResetting(true);
    rest.skip();
    const sid = sessionIdRef.current;
    if (sid) await discardSession(sid);
    // Hard reload guarantees a clean slate (fresh prefill, no in-progress session).
    window.location.assign('/today');
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-bg/80 px-4 pb-3 pt-[calc(14px+var(--safe-top))] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => setDayPickerOpen(true)} className="tap min-w-0 text-left">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-text-faint">
              {blockName.replace(/—.*/, '').trim()} <ChevronDown size={12} />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="truncate font-display text-2xl font-bold">{dayName}</h1>
              <span className={cn('text-[11px] font-semibold uppercase', SPLIT_TONE[splitType])}>{splitType}</span>
            </div>
          </button>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setResetOpen(true)}
              className="tap grid h-9 w-9 place-items-center rounded-full surface-2 border border-border text-text-dim"
              aria-label="Reset session"
            >
              <RotateCcw size={15} />
            </button>
            <div className="flex items-center gap-1.5 rounded-pill surface-2 border border-border px-3 py-1.5">
              <Clock size={13} className="text-text-faint" />
              <span className="num text-sm font-semibold tabular-nums">{formatClock(elapsedSec)}</span>
            </div>
          </div>
        </div>
        {/* progress */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <motion.div
              className="h-full rounded-full bg-ember-grad"
              animate={{ width: `${totalWorking ? (doneWorking / totalWorking) * 100 : 0}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 30 }}
            />
          </div>
          <span className="num text-xs text-text-dim">
            {doneWorking}/{totalWorking} sets
          </span>
        </div>
      </header>

      <div className="space-y-2.5 px-4 pt-3">
        {slotsData.map((sd) => {
          const slotId = sd.slot.slotId;
          return (
            <ExerciseCard
              key={slotId}
              slot={slotMeta[slotId]}
              sets={slotSets[slotId] ?? sd.sets}
              units={units}
              expanded={expanded === slotId}
              onToggleExpand={() => setExpanded(expanded === slotId ? null : slotId)}
              onChangeSet={(setNumber, partial) => updateSet(slotId, setNumber, partial)}
              onToggleComplete={(setNumber) => toggleComplete(slotId, setNumber)}
              onAddSet={(isWarmup) => addSet(slotId, isWarmup)}
              onRemoveSet={(setNumber) => removeSet(slotId, setNumber)}
              onSwap={() =>
                setSwapSlot({
                  id: slotId,
                  exercise: slotMeta[slotId].exercise,
                  defaultExercise: slotMeta[slotId].defaultExercise,
                  isSwapped: slotMeta[slotId].isSwapped,
                })
              }
              prCelebrating={celebrating === slotId}
            />
          );
        })}

        <Button variant="primary" size="lg" className="mt-4 w-full" onClick={handleFinish} disabled={finishing}>
          {finishing ? <Loader2 className="animate-spin" size={18} /> : <><Flag size={17} /> Finish session</>}
        </Button>
      </div>

      {swapSlot && (
        <SwapDrawer
          open={!!swapSlot}
          onOpenChange={(o) => !o && setSwapSlot(null)}
          slot={swapSlot}
          allExercises={allExercises}
          availableEquipment={swapSettings.availableEquipment}
          defaultBackSafe={swapSettings.backSafeOnly}
          defaultMyEquipment={swapSettings.myEquipmentOnly}
          onSwapped={() => router.refresh()}
        />
      )}

      <DayPicker
        open={dayPickerOpen}
        onOpenChange={setDayPickerOpen}
        days={daysList}
        currentDayId={dayId}
        onPick={async (d) => {
          setDayPickerOpen(false);
          await setActiveDay(d.blockSlug, d.order);
          router.refresh();
        }}
      />

      <SummarySheet
        summary={summary}
        units={units}
        onClose={async () => {
          setSummary(null);
          await advanceSchedule(dayId);
          router.refresh();
        }}
      />

      <BottomSheet open={resetOpen} onOpenChange={setResetOpen} title="Reset session">
        <div className="space-y-4 py-1">
          <p className="text-sm text-text-dim">
            Clear everything logged for <span className="font-medium text-text">{dayName}</span> and start fresh?
            This deletes the in-progress session and its sets — finished sessions aren’t affected.
          </p>
          <div className="flex gap-2">
            <Button variant="surface" size="lg" className="flex-1" onClick={() => setResetOpen(false)} disabled={resetting}>
              Cancel
            </Button>
            <Button variant="danger" size="lg" className="flex-1" onClick={handleReset} disabled={resetting}>
              {resetting ? <Loader2 className="animate-spin" size={18} /> : 'Reset'}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

function DayPicker({
  open,
  onOpenChange,
  days,
  currentDayId,
  onPick,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  days: DayMeta[];
  currentDayId: string;
  onPick: (d: DayMeta) => void;
}) {
  const byBlock = days.reduce<Record<string, DayMeta[]>>((acc, d) => {
    (acc[d.blockName] ??= []).push(d);
    return acc;
  }, {});
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Pick a session">
      <div className="space-y-4 py-1">
        <Link
          href="/today/custom"
          className="tap flex items-center gap-3 rounded-xl border border-ember-2/30 bg-ember-grad-soft px-3.5 py-3"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ember-grad text-black">
            <Plus size={18} />
          </span>
          <div className="flex-1">
            <div className="font-semibold">Start a custom workout</div>
            <div className="text-[11px] text-text-faint">Freestyle — add any exercises, off-program</div>
          </div>
        </Link>
        {Object.entries(byBlock).map(([block, ds]) => (
          <div key={block}>
            <div className="mb-1.5 text-[11px] uppercase tracking-wide text-text-faint">{block}</div>
            <div className="space-y-1.5">
              {ds.map((d) => (
                <button
                  key={d.id}
                  onClick={() => onPick(d)}
                  className={cn(
                    'tap flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left',
                    d.id === currentDayId ? 'border-ember-2/40 bg-ember-2/10' : 'border-border surface-2',
                  )}
                >
                  <span className="num grid h-7 w-7 place-items-center rounded-lg surface-2 text-xs font-bold text-text-dim">
                    {d.order}
                  </span>
                  <span className="flex-1 font-medium">{d.name}</span>
                  <span className={cn('text-[11px] font-semibold uppercase', SPLIT_TONE[d.splitType])}>{d.splitType}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}

function SummarySheet({ summary, units, onClose }: { summary: FinishSummary | null; units: Units; onClose: () => void }) {
  return (
    <BottomSheet open={!!summary} onOpenChange={(o) => !o && onClose()} title="Session complete" hideClose>
      {summary && (
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Volume" value={formatWeight(summary.totalVolumeKg, units)} unit={units} />
            <Stat label="Sets" value={`${summary.workingSets}`} />
            <Stat label="Time" value={formatDuration(summary.durationSec)} />
          </div>

          {summary.prs.length > 0 ? (
            <div className="rounded-xl border border-ember-2/25 bg-ember-grad-soft p-3.5">
              <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gradient-ember">
                <Trophy size={15} className="text-ember-1" /> {summary.prs.length} new PR{summary.prs.length === 1 ? '' : 's'}
              </div>
              <ul className="space-y-1.5">
                {summary.prs.map((pr) => (
                  <li key={pr.exerciseId} className="flex items-center justify-between text-sm">
                    <span className="text-text-dim">{pr.name}</span>
                    <span className="num font-semibold text-ember-1">
                      {formatWeight(pr.e1RM, units)} {units} <span className="text-text-faint">e1RM</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-border surface-2 px-3.5 py-3 text-sm text-text-dim">
              <Dumbbell size={15} className="text-text-faint" /> Solid work logged. Schedule advanced to the next day.
            </div>
          )}

          <Button variant="primary" size="lg" className="w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      )}
    </BottomSheet>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-xl border border-border surface-2 px-2 py-3 text-center">
      <div className="num text-xl font-bold tabular-nums">
        {value}
        {unit && <span className="ml-0.5 text-xs text-text-faint">{unit}</span>}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-text-faint">{label}</div>
    </div>
  );
}
