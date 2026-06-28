'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, Flag, Trophy, Loader2, Dumbbell, RotateCcw, Plus, ArrowLeft, Sparkles } from 'lucide-react';
import { ExerciseCard, type LoggerSet, type LoggerSlot } from '@/components/logger/exercise-card';
import { ExercisePicker } from '@/components/library/exercise-picker';
import { BottomSheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useRestTimer } from '@/components/logger/rest-timer';
import {
  saveSet,
  ensureCustomSession,
  finishSession,
  discardSession,
  prefillForExercise,
  removeCustomExerciseSets,
  type FinishSummary,
} from '@/app/actions/session';
import { formatClock, formatDuration } from '@/lib/format';
import { formatWeight, type Units } from '@/lib/units';
import type { ExerciseLite } from '@/lib/types';
import { cn } from '@/lib/utils';

export type CustomSlotData = { slot: LoggerSlot; sets: LoggerSet[] };

const NO_HINT = { text: '', direction: 'none' as const, suggestedWeightKg: null, suggestedReps: null };

function genId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `adhoc-${crypto.randomUUID()}`;
  return `adhoc-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function CustomLogger({
  initialSessionId,
  initialStartMs,
  initialSlots,
  units,
  defaultRestSec,
  allExercises,
}: {
  initialSessionId: string | null;
  initialStartMs: number | null;
  initialSlots: CustomSlotData[];
  units: Units;
  defaultRestSec: number;
  allExercises: ExerciseLite[];
}) {
  const router = useRouter();
  const rest = useRestTimer();

  const [order, setOrder] = useState<string[]>(initialSlots.map((s) => s.slot.slotId));
  const [slotMeta, setSlotMeta] = useState<Record<string, LoggerSlot>>(() => {
    const m: Record<string, LoggerSlot> = {};
    for (const s of initialSlots) m[s.slot.slotId] = s.slot;
    return m;
  });
  const [slotSets, setSlotSets] = useState<Record<string, LoggerSet[]>>(() => {
    const m: Record<string, LoggerSet[]> = {};
    for (const s of initialSlots) m[s.slot.slotId] = s.sets;
    return m;
  });
  const [expanded, setExpanded] = useState<string | null>(initialSlots[initialSlots.length - 1]?.slot.slotId ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const [summary, setSummary] = useState<FinishSummary | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  const sessionIdRef = useRef<string | null>(initialSessionId);
  const ensurePromiseRef = useRef<Promise<string> | null>(null);
  const startMsRef = useRef<number | null>(initialStartMs);
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const ensureId = useCallback(async (): Promise<string> => {
    if (sessionIdRef.current) return sessionIdRef.current;
    if (!ensurePromiseRef.current) {
      ensurePromiseRef.current = ensureCustomSession().then((id) => {
        sessionIdRef.current = id;
        if (startMsRef.current == null) startMsRef.current = Date.now();
        return id;
      });
    }
    return ensurePromiseRef.current;
  }, []);

  const persist = useCallback(
    async (slotId: string, set: LoggerSet) => {
      const ex = slotMeta[slotId].exercise;
      const sid = await ensureId();
      return saveSet({
        sessionId: sid,
        dayId: null,
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
    [ensureId, slotMeta],
  );

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsedSec = startMsRef.current ? Math.floor((now - startMsRef.current) / 1000) : 0;

  const allSets = Object.values(slotSets).flat();
  const totalWorking = allSets.filter((s) => !s.isWarmup).length;
  const doneWorking = allSets.filter((s) => !s.isWarmup && s.completed).length;

  function updateSet(slotId: string, setNumber: number, partial: Partial<LoggerSet>) {
    setSlotSets((prev) => {
      const rows = prev[slotId].map((s) => (s.setNumber === setNumber ? { ...s, ...partial } : s));
      const updated = rows.find((s) => s.setNumber === setNumber)!;
      const key = `${slotId}:${setNumber}`;
      if (debounceRef.current[key]) clearTimeout(debounceRef.current[key]);
      debounceRef.current[key] = setTimeout(() => void persist(slotId, updated), 650);
      return { ...prev, [slotId]: rows };
    });
  }

  async function toggleComplete(slotId: string, setNumber: number) {
    const current = slotSets[slotId].find((s) => s.setNumber === setNumber)!;
    const updated = { ...current, completed: !current.completed };
    setSlotSets((prev) => ({ ...prev, [slotId]: prev[slotId].map((s) => (s.setNumber === setNumber ? updated : s)) }));
    if (updated.completed) {
      const restSec = slotMeta[slotId].restSeconds || defaultRestSec;
      if (restSec > 0 && !updated.isWarmup) rest.start(restSec, slotMeta[slotId].exercise.name);
      const res = await persist(slotId, updated);
      if (res.isPR) {
        setCelebrating(slotId);
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) { try { navigator.vibrate?.(30); } catch {} }
        setTimeout(() => setCelebrating(null), 2600);
      }
    } else {
      await persist(slotId, updated);
    }
  }

  function addSetRow(slotId: string, isWarmup: boolean) {
    setSlotSets((prev) => {
      const rows = prev[slotId];
      const nextNum = Math.max(0, ...rows.map((s) => s.setNumber)) + 1;
      const seed = [...rows].reverse().find((s) => !s.isWarmup);
      return {
        ...prev,
        [slotId]: [...rows, { setNumber: nextNum, weightKg: isWarmup ? null : seed?.weightKg ?? null, reps: isWarmup ? null : seed?.reps ?? null, rpe: null, isWarmup, completed: false }],
      };
    });
  }

  function removeSetRow(slotId: string, setNumber: number) {
    const sid = sessionIdRef.current;
    setSlotSets((prev) => ({ ...prev, [slotId]: prev[slotId].filter((s) => s.setNumber !== setNumber) }));
    if (sid) import('@/app/actions/session').then(({ deleteSet }) => deleteSet(sid, slotId, setNumber));
  }

  async function addExercise(ex: ExerciseLite) {
    const slotId = genId();
    const prefill = await prefillForExercise(ex.id);
    const count = prefill.length > 0 ? prefill.length : 3;
    const sets: LoggerSet[] = Array.from({ length: count }, (_, i) => ({
      setNumber: i + 1,
      weightKg: prefill[i]?.weightKg ?? null,
      reps: prefill[i]?.reps ?? null,
      rpe: null,
      isWarmup: false,
      completed: false,
    }));
    const slot: LoggerSlot = {
      slotId,
      order: order.length + 1,
      sets: count,
      repScheme: ex.defaultRepRange ?? '—',
      targetRpe: null,
      restSeconds: defaultRestSec,
      supersetGroup: null,
      supersetOrder: null,
      notes: null,
      replacesNote: null,
      exercise: ex,
      defaultExercise: { id: ex.id, slug: ex.slug, name: ex.name },
      isSwapped: false,
      hint: NO_HINT,
    };
    setSlotMeta((m) => ({ ...m, [slotId]: slot }));
    setSlotSets((s) => ({ ...s, [slotId]: sets }));
    setOrder((o) => [...o, slotId]);
    setExpanded(slotId);
  }

  function removeExercise(slotId: string) {
    const sid = sessionIdRef.current;
    setOrder((o) => o.filter((id) => id !== slotId));
    setSlotSets((s) => { const c = { ...s }; delete c[slotId]; return c; });
    setSlotMeta((m) => { const c = { ...m }; delete c[slotId]; return c; });
    if (sid) removeCustomExerciseSets(sid, slotId);
  }

  async function handleFinish() {
    setFinishing(true);
    const sid = await ensureId();
    const duration = startMsRef.current ? Math.floor((Date.now() - startMsRef.current) / 1000) : elapsedSec;
    const res = await finishSession(sid, duration);
    setSummary(res);
    setFinishing(false);
  }

  async function handleDiscard() {
    setDiscarding(true);
    rest.skip();
    const sid = sessionIdRef.current;
    if (sid) await discardSession(sid);
    router.push('/today');
  }

  const exerciseIds = useMemo(() => order.map((id) => slotMeta[id]?.exercise.id).filter(Boolean) as string[], [order, slotMeta]);
  const empty = order.length === 0;

  return (
    <div className="pb-4">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/80 px-4 pb-3 pt-[calc(14px+var(--safe-top))] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Link href="/today" className="tap grid h-9 w-9 shrink-0 place-items-center rounded-full surface-2 border border-border text-text-dim">
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.2em] text-text-faint">Freestyle</div>
              <h1 className="truncate font-display text-2xl font-bold">Custom workout</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button onClick={() => setDiscardOpen(true)} className="tap grid h-9 w-9 place-items-center rounded-full surface-2 border border-border text-text-dim" aria-label="Discard workout">
              <RotateCcw size={15} />
            </button>
            <div className="flex items-center gap-1.5 rounded-pill surface-2 border border-border px-3 py-1.5">
              <Clock size={13} className="text-text-faint" />
              <span className="num text-sm font-semibold tabular-nums">{formatClock(elapsedSec)}</span>
            </div>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <motion.div className="h-full rounded-full bg-ember-grad" animate={{ width: `${totalWorking ? (doneWorking / totalWorking) * 100 : 0}%` }} transition={{ type: 'spring', stiffness: 200, damping: 30 }} />
          </div>
          <span className="num text-xs text-text-dim">{doneWorking}/{totalWorking} sets</span>
        </div>
      </header>

      <div className="space-y-2.5 px-4 pt-3">
        {empty ? (
          <div className="rounded-card border border-dashed border-border surface-2 px-5 py-14 text-center">
            <Sparkles size={22} className="mx-auto mb-2 text-ember-1" />
            <p className="font-display text-lg font-semibold">Build your session</p>
            <p className="mt-1 text-sm text-text-dim">Add any exercises you want — they’re logged and tracked just like the program.</p>
          </div>
        ) : (
          order.map((slotId) => (
            <ExerciseCard
              key={slotId}
              slot={slotMeta[slotId]}
              sets={slotSets[slotId]}
              units={units}
              expanded={expanded === slotId}
              onToggleExpand={() => setExpanded(expanded === slotId ? null : slotId)}
              onChangeSet={(setNumber, partial) => updateSet(slotId, setNumber, partial)}
              onToggleComplete={(setNumber) => toggleComplete(slotId, setNumber)}
              onAddSet={(isWarmup) => addSetRow(slotId, isWarmup)}
              onRemoveSet={(setNumber) => removeSetRow(slotId, setNumber)}
              onRemoveExercise={() => removeExercise(slotId)}
              prCelebrating={celebrating === slotId}
            />
          ))
        )}

        <button
          onClick={() => setPickerOpen(true)}
          className="tap flex w-full items-center justify-center gap-2 rounded-card border border-dashed border-border surface-2 py-3.5 text-sm font-semibold text-text-dim"
        >
          <Plus size={18} /> Add exercise
        </button>

        {!empty && (
          <Button variant="primary" size="lg" className="mt-2 w-full" onClick={handleFinish} disabled={finishing}>
            {finishing ? <Loader2 className="animate-spin" size={18} /> : <><Flag size={17} /> Finish workout</>}
          </Button>
        )}
      </div>

      <ExercisePicker open={pickerOpen} onOpenChange={setPickerOpen} exercises={allExercises} onPick={addExercise} excludeIds={exerciseIds} />

      <BottomSheet open={discardOpen} onOpenChange={setDiscardOpen} title="Discard workout">
        <div className="space-y-4 py-1">
          <p className="text-sm text-text-dim">Delete this freestyle session and everything logged in it?</p>
          <div className="flex gap-2">
            <Button variant="surface" size="lg" className="flex-1" onClick={() => setDiscardOpen(false)} disabled={discarding}>Cancel</Button>
            <Button variant="danger" size="lg" className="flex-1" onClick={handleDiscard} disabled={discarding}>
              {discarding ? <Loader2 className="animate-spin" size={18} /> : 'Discard'}
            </Button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={!!summary} onOpenChange={(o) => { if (!o) { setSummary(null); router.push('/today'); } }} title="Workout complete" hideClose>
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
                      <span className="num font-semibold text-ember-1">{formatWeight(pr.e1RM, units)} {units} <span className="text-text-faint">e1RM</span></span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-border surface-2 px-3.5 py-3 text-sm text-text-dim">
                <Dumbbell size={15} className="text-text-faint" /> Logged. It all counts toward your trends and PRs.
              </div>
            )}
            <Button variant="primary" size="lg" className="w-full" onClick={() => { setSummary(null); router.push('/today'); }}>Done</Button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-xl border border-border surface-2 px-2 py-3 text-center">
      <div className="num text-xl font-bold tabular-nums">{value}{unit && <span className="ml-0.5 text-xs text-text-faint">{unit}</span>}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-text-faint">{label}</div>
    </div>
  );
}
