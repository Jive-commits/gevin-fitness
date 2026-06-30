'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2, ArrowLeftRight, Dumbbell, Sparkles } from 'lucide-react';
import { Stepper } from '@/components/ui/stepper';
import { Button } from '@/components/ui/button';
import { ExerciseAnimation } from '@/components/exercise/exercise-animation';
import { EXERCISE_MEDIA } from '@/lib/exercise-media';
import { useRestTimer } from '@/components/logger/rest-timer';
import { SwapDrawer, type SwapSlot } from '@/components/swap/swap-drawer';
import type { SlotData } from '@/components/logger/today-logger';
import type { LoggerSet } from '@/components/logger/exercise-card';
import {
  saveSet,
  ensureSession,
  finishSession,
  advanceSchedule,
  type FinishSummary,
} from '@/app/actions/session';
import { incrementForMuscle } from '@/lib/progression';
import { formatTarget, setLabel } from '@/lib/rep-language';
import { SENSATION_RPE, applySensation, SENSATION_CHIPS, type Sensation } from '@/lib/calibration';
import { kgToDisplay, displayToKg, roundDisplay, loadStep, formatWeight, type Units } from '@/lib/units';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ExerciseLite } from '@/lib/types';
import type { Equipment } from '@prisma/client';

const LOWER = ['QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES'];

/** A flattened pointer into the slot/set matrix. */
type Step = { slotIdx: number; setNumber: number };

export function GuidedLogger({
  dayId,
  dayName,
  slotsData,
  initialSessionId,
  initialStartMs,
  units,
  defaultRestSec,
  incrementUpperKg,
  incrementLowerKg,
  sessionCount,
  allExercises,
  swapSettings,
}: {
  dayId: string;
  dayName: string;
  slotsData: SlotData[];
  initialSessionId: string | null;
  initialStartMs: number | null;
  units: Units;
  defaultRestSec: number;
  incrementUpperKg: number;
  incrementLowerKg: number;
  sessionCount: number;
  allExercises: ExerciseLite[];
  swapSettings: { availableEquipment: Equipment[]; backSafeOnly: boolean; myEquipmentOnly: boolean };
}) {
  const router = useRouter();
  const rest = useRestTimer();

  // Optimistic local copy of the set matrix, keyed by slotId (mirrors today-logger).
  const [slotSets, setSlotSets] = useState<Record<string, LoggerSet[]>>(() => {
    const m: Record<string, LoggerSet[]> = {};
    for (const sd of slotsData) m[sd.slot.slotId] = sd.sets;
    return m;
  });
  const slotMeta = useMemo(() => slotsData.map((sd) => sd.slot), [slotsData]);

  // Working sets only (skip warm-ups) flattened to one cursor per (slot, set).
  const steps = useMemo<Step[]>(() => {
    const out: Step[] = [];
    slotsData.forEach((sd, slotIdx) => {
      for (const s of sd.sets) if (!s.isWarmup) out.push({ slotIdx, setNumber: s.setNumber });
    });
    return out;
  }, [slotsData]);

  // Start at the first not-yet-completed working set (resume mid-session).
  const firstIncomplete = useMemo(() => {
    const idx = steps.findIndex((st) => {
      const slot = slotsData[st.slotIdx].slot.slotId;
      const set = (slotSets[slot] ?? []).find((s) => s.setNumber === st.setNumber);
      return set && !set.completed;
    });
    return idx >= 0 ? idx : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [cursor, setCursor] = useState(firstIncomplete);
  const [phase, setPhase] = useState<'log' | 'calibrate'>('log');
  const [logging, setLogging] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [prBloom, setPrBloom] = useState(false);
  const [swapSlot, setSwapSlot] = useState<SwapSlot | null>(null);
  const [summary, setSummary] = useState<FinishSummary | null>(null);
  const [finishing, setFinishing] = useState(false);
  // Track which slots have already shown calibration (asked once per slot, set 1 only).
  const calibratedRef = useRef<Set<string>>(new Set());

  const step = steps[cursor];
  const slot = step ? slotMeta[step.slotIdx] : null;
  const slotId = slot?.slotId ?? '';
  const sets = slotSets[slotId] ?? [];
  const active = sets.find((s) => s.setNumber === step?.setNumber) ?? null;

  // Index of the current set within its slot's WORKING sets (for "Set x of n").
  const workingInSlot = sets.filter((s) => !s.isWarmup);
  const setIndexInSlot = Math.max(0, workingInSlot.findIndex((s) => s.setNumber === step?.setNumber));
  const totalSetsInSlot = workingInSlot.length;
  const totalMoves = slotsData.length;
  const moveNumber = (step?.slotIdx ?? 0) + 1;

  const isLower = slot ? LOWER.includes(slot.exercise.primaryMuscle) : false;
  const stepSize = loadStep(units, isLower);
  const incrementKg = slot
    ? incrementForMuscle(slot.exercise.primaryMuscle, incrementUpperKg, incrementLowerKg)
    : incrementUpperKg;

  // ----- session lifecycle (auto-save, no Save button) — mirrors today-logger -----
  const sessionIdRef = useRef<string | null>(initialSessionId);
  const ensurePromiseRef = useRef<Promise<string> | null>(null);
  const startMsRef = useRef<number | null>(initialStartMs);
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
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
    async (sid: string, sl: { slotId: string; exercise: ExerciseLite }, set: LoggerSet) => {
      const id = await ensureId();
      return saveSet({
        sessionId: id,
        dayId,
        slotId: sl.slotId,
        exerciseId: sl.exercise.id,
        setNumber: set.setNumber,
        weightKg: set.weightKg,
        reps: set.reps,
        rpe: set.rpe,
        isWarmup: set.isWarmup,
        completed: set.completed,
      });
    },
    [dayId, ensureId],
  );

  // Debounced field edits (weight/reps) — keeps a session safe even if the user
  // never taps "Log set" (auto-save is sacred). Reads freshest state at fire time.
  function updateActive(partial: Partial<LoggerSet>) {
    if (!slot || !active) return;
    const sid = slotId;
    const num = active.setNumber;
    setSlotSets((prev) => ({
      ...prev,
      [sid]: prev[sid].map((s) => (s.setNumber === num ? { ...s, ...partial } : s)),
    }));
    const key = `${sid}:${num}`;
    if (debounceRef.current[key]) clearTimeout(debounceRef.current[key]);
    debounceRef.current[key] = setTimeout(() => {
      const latest = slotSetsRef.current[sid]?.find((s) => s.setNumber === num);
      if (latest && (latest.weightKg != null || latest.reps != null)) {
        void persist(sessionIdRef.current ?? '', { slotId: sid, exercise: slot.exercise }, latest);
      }
    }, 650);
  }

  // ----- running clock -----
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsedSec = startMsRef.current ? Math.floor((now - startMsRef.current) / 1000) : 0;

  const weightDisplay = active?.weightKg == null ? null : roundDisplay(kgToDisplay(active.weightKg, units)!, units);

  function setWeight(displayVal: number | null) {
    updateActive({ weightKg: displayVal == null ? null : displayToKg(displayVal, units) });
  }

  // ----- the one primary action -----
  async function handleLogSet() {
    if (!slot || !active || logging) return;
    setLogging(true);
    const key = `${slotId}:${active.setNumber}`;
    if (debounceRef.current[key]) clearTimeout(debounceRef.current[key]);

    const logged: LoggerSet = { ...active, completed: true };
    setSlotSets((prev) => ({
      ...prev,
      [slotId]: prev[slotId].map((s) => (s.setNumber === logged.setNumber ? logged : s)),
    }));
    haptic(18);

    const res = await persist(sessionIdRef.current ?? '', { slotId, exercise: slot.exercise }, logged);
    setLogging(false);

    if (res.isPR) {
      setPrBloom(true);
      haptic([20, 30, 60]);
      setTimeout(() => setPrBloom(false), 2000);
    }

    // Calibration only after set 1 of a working slot, once per slot.
    const isFirstWorkingSet = setIndexInSlot === 0;
    if (isFirstWorkingSet && !calibratedRef.current.has(slotId)) {
      setPhase('calibrate');
    } else {
      startRestAndAdvance();
    }
  }

  // ----- post-sensation calibration -----
  function handleCalibrate(s: Sensation) {
    calibratedRef.current.add(slotId);
    haptic(10);

    if (slot && active) {
      // (b) persist the RPE proxy onto the just-logged set via the existing field.
      const rpe = SENSATION_RPE[s];
      const num = active.setNumber;
      const updated: LoggerSet = { ...active, completed: true, rpe };
      setSlotSets((prev) => ({
        ...prev,
        [slotId]: prev[slotId].map((x) => (x.setNumber === num ? updated : x)),
      }));
      void persist(sessionIdRef.current ?? '', { slotId, exercise: slot.exercise }, updated);

      // (a) adjust the suggested weight for the REMAINING sets in this slot.
      const nextKg = applySensation(active.weightKg, s, incrementKg);
      if (nextKg !== active.weightKg) {
        setSlotSets((prev) => ({
          ...prev,
          [slotId]: prev[slotId].map((x) =>
            !x.isWarmup && x.setNumber > num && !x.completed ? { ...x, weightKg: nextKg } : x,
          ),
        }));
      }
    }
    setPhase('log');
    startRestAndAdvance();
  }

  function startRestAndAdvance() {
    // Rest ring (reuse the existing provider). Cheap & ambient.
    if (slot) {
      const restSec = slot.restSeconds || defaultRestSec;
      const nextStep = steps[cursor + 1];
      const nextName = nextStep ? slotMeta[nextStep.slotIdx].exercise.name : slot.exercise.name;
      if (restSec > 0 && cursor < steps.length - 1) rest.start(restSec, nextName);
    }
    advanceCursor();
  }

  function advanceCursor() {
    if (cursor < steps.length - 1) {
      setCursor((c) => c + 1);
      setEditOpen(false);
    } else {
      void handleFinish();
    }
  }

  async function handleFinish() {
    if (finishing) return;
    setFinishing(true);
    rest.skip();
    const sid = await ensureId();
    const duration = startMsRef.current ? Math.floor((Date.now() - startMsRef.current) / 1000) : elapsedSec;
    const res = await finishSession(sid, duration);
    setSummary(res);
    setFinishing(false);
    haptic([15, 40, 15, 40, 30]);
  }

  // ----- empty / done states -----
  if (steps.length === 0 || !slot || !active) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-bg px-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-bold">Nothing to guide</h1>
          <p className="mt-2 text-text-dim">This session has no working sets.</p>
          <Button asChild variant="surface" size="lg" className="mt-5">
            <Link href="/today">Back to Today</Link>
          </Button>
        </div>
      </div>
    );
  }

  const targetText = formatTarget(slot.repScheme, totalSetsInSlot, setIndexInSlot);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      {/* Header: close + progress dots */}
      <header className="flex items-center justify-between px-4 pt-[calc(12px+var(--safe-top))]">
        <Link
          href="/today"
          className="tap grid h-9 w-9 place-items-center rounded-full surface-2 border border-border text-text-dim"
          aria-label="Exit guided workout"
        >
          <X size={18} />
        </Link>
        <div className="flex items-center gap-1.5" aria-hidden>
          {slotsData.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i < step.slotIdx ? 'w-1.5 bg-mint' : i === step.slotIdx ? 'w-6 bg-ember-grad' : 'w-1.5 bg-[var(--surface-2)] border border-border',
              )}
            />
          ))}
        </div>
        <div className="num w-9 text-right text-xs font-semibold tabular-nums text-text-faint">
          {Math.floor(elapsedSec / 60)}m
        </div>
      </header>

      {/* Body — one move */}
      <div className="flex min-h-0 flex-1 flex-col px-5 pt-3">
        <div className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-text-faint">
          Move {moveNumber} of {totalMoves} · {setLabel(setIndexInSlot, totalSetsInSlot)}
        </div>

        {/* Form demo */}
        <button
          type="button"
          onClick={() =>
            setSwapSlot({
              id: slotId,
              exercise: slot.exercise,
              defaultExercise: slot.defaultExercise,
              isSwapped: slot.isSwapped,
            })
          }
          className="tap mx-auto w-full max-w-sm text-left"
          aria-label="Swap this exercise"
        >
          <DemoOrName slug={slot.exercise.slug} name={slot.exercise.name} />
        </button>

        {/* Name + plain target */}
        <div className="mt-4 text-center">
          <h1 className="font-display text-[26px] font-bold leading-tight">{slot.exercise.name}</h1>
          <p className="mt-1.5 text-[15px] text-text-dim">{targetText}</p>
          {slot.exercise.cues && (
            <p className="mx-auto mt-2 max-w-xs text-[13px] text-ice">{firstCue(slot.exercise.cues)}</p>
          )}
        </div>

        <div className="flex-1" />

        {/* Bottom action zone */}
        <AnimatePresence mode="wait">
          {phase === 'calibrate' ? (
            <motion.div
              key="calibrate"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="pb-[calc(20px+var(--safe-bottom))]"
            >
              <div className="mb-3 text-center font-display text-lg font-semibold">How did that feel?</div>
              <div className="grid grid-cols-3 gap-2">
                {SENSATION_CHIPS.map((chip) => (
                  <button
                    key={chip.value}
                    onClick={() => handleCalibrate(chip.value)}
                    className={cn(
                      'tap flex min-h-[64px] flex-col items-center justify-center rounded-2xl border px-2 py-3 text-sm font-semibold',
                      chip.value === 'just_right'
                        ? 'border-ember-2/40 bg-ember-grad-soft text-text'
                        : 'border-border surface-2 text-text-dim',
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-center text-[12px] text-text-faint">
                Sets your next weight — no guessing.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="log"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="pb-[calc(20px+var(--safe-bottom))]"
            >
              {/* quiet pre-filled steppers, revealed on demand */}
              <AnimatePresence initial={false}>
                {editOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mb-4 flex items-start justify-center gap-5 rounded-2xl border border-border surface-2 py-4">
                      <Stepper
                        label={`Weight (${units})`}
                        value={weightDisplay}
                        onChange={setWeight}
                        step={stepSize}
                        min={0}
                        max={units === 'lb' ? 1500 : 700}
                        size="lg"
                        emberWhenSet
                      />
                      <Stepper
                        label="Reps"
                        value={active.reps}
                        onChange={(v) => updateActive({ reps: v })}
                        step={1}
                        min={0}
                        max={100}
                        size="lg"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* baked-in target summary */}
              {!editOpen && (
                <div className="mb-4 flex items-center justify-center gap-3 text-center">
                  <SummaryNumber value={weightDisplay == null ? '—' : `${formatWeight(active.weightKg, units)}`} unit={weightDisplay == null ? '' : units} label="weight" />
                  <span className="text-text-faint">×</span>
                  <SummaryNumber value={active.reps == null ? '—' : `${active.reps}`} unit="" label="reps" />
                </div>
              )}

              <button
                onClick={handleLogSet}
                disabled={logging}
                className="tap flex min-h-[60px] w-full items-center justify-center gap-2 rounded-2xl bg-ember-grad text-lg font-bold text-black shadow-ember disabled:opacity-60"
              >
                {logging ? <Loader2 className="animate-spin" size={22} /> : <><Check size={22} strokeWidth={3} /> Log set</>}
              </button>

              <div className="mt-3 flex items-center justify-center gap-4 text-[12px]">
                <button onClick={() => setEditOpen((v) => !v)} className="tap font-medium text-text-faint">
                  {editOpen ? 'Hide' : 'Off target? Edit'}
                </button>
                <span className="text-border">·</span>
                <button
                  onClick={() =>
                    setSwapSlot({
                      id: slotId,
                      exercise: slot.exercise,
                      defaultExercise: slot.defaultExercise,
                      isSwapped: slot.isSwapped,
                    })
                  }
                  className="tap inline-flex items-center gap-1 font-medium text-text-faint"
                >
                  <ArrowLeftRight size={12} /> Swap it
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PR bloom */}
      <AnimatePresence>
        {prBloom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-[60] grid place-items-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.7, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="text-center"
            >
              <Sparkles size={48} className="mx-auto text-ember-1 animate-count-glow" />
              <div className="mt-3 font-display text-2xl font-bold text-gradient-ember">New PR</div>
              <p className="mt-1 text-sm text-text-dim">Heaviest you&apos;ve ever logged on this lift.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swap drawer (long-tap / Swap it) */}
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

      {/* Finishing spinner */}
      <AnimatePresence>
        {finishing && !summary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[55] grid place-items-center bg-bg/80 backdrop-blur-sm"
          >
            <Loader2 className="animate-spin text-ember-1" size={28} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* You-got-stronger summary */}
      <StrongerSheet
        summary={summary}
        units={units}
        dayName={dayName}
        moves={totalMoves}
        sessionCount={sessionCount}
        onClose={async () => {
          setSummary(null);
          await advanceSchedule(dayId);
          router.push('/home');
        }}
      />
    </div>
  );
}

function DemoOrName({ slug, name }: { slug: string; name: string }) {
  // ExerciseAnimation renders null when there's no media; wrap so we still show a
  // tidy placeholder tile instead of empty space (keeps the layout stable).
  return (
    <div className="relative">
      <ExerciseAnimation slug={slug} name={name} />
      <FallbackTile slug={slug} />
    </div>
  );
}

/** Shown only when ExerciseAnimation has no asset (its own render is null then). */
function FallbackTile({ slug }: { slug: string }) {
  if (EXERCISE_MEDIA[slug]?.length) return null;
  return (
    <div className="grid aspect-[4/3] w-full place-items-center rounded-card border border-border surface-2 text-text-faint">
      <Dumbbell size={40} />
    </div>
  );
}

function SummaryNumber({ value, unit, label }: { value: string; unit: string; label: string }) {
  return (
    <div className="text-center">
      <div className="num text-3xl font-bold tabular-nums text-gradient-ember">
        {value}
        {unit && <span className="ml-0.5 text-base text-text-faint">{unit}</span>}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-text-faint">{label}</div>
    </div>
  );
}

function StrongerSheet({
  summary,
  units,
  dayName,
  moves,
  sessionCount,
  onClose,
}: {
  summary: FinishSummary | null;
  units: Units;
  dayName: string;
  moves: number;
  sessionCount: number;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {summary && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[61] mx-auto w-full max-w-xl rounded-t-[24px] border-x border-t border-border bg-surface px-5 pb-[calc(24px+var(--safe-bottom))] pt-3 shadow-[0_-12px_50px_-12px_rgba(0,0,0,0.8)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 380 }}
          >
            <div className="mb-2 flex justify-center pt-1">
              <div className="h-1 w-9 rounded-full bg-border" />
            </div>
            <div className="py-4 text-center">
              <div className="font-display text-[30px] font-bold leading-tight">
                You got <span className="text-gradient-ember">stronger</span>.
              </div>
              <p className="mt-2 text-[15px] text-text-dim">
                {dayName} · done. That&apos;s {sessionCount} session{sessionCount === 1 ? '' : 's'} now.
              </p>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2.5">
              <Stat value={`${moves}`} label="moves" />
              <Stat value={`${summary.workingSets}`} label="sets" />
              <Stat value={formatDuration(summary.durationSec)} label="time" />
            </div>

            <Button variant="primary" size="lg" className="mt-5 w-full" onClick={onClose}>
              Done
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border surface-2 px-2 py-3.5 text-center">
      <div className="num text-2xl font-bold tabular-nums">{value}</div>
      <div className="mt-1 text-[11px] font-semibold text-text-faint">{label}</div>
    </div>
  );
}

function firstCue(cues: string): string {
  // Exercise.cues may be a sentence or a bullet list; take the first clean line.
  const line = cues.split(/[\n•]/).map((c) => c.trim()).find(Boolean) ?? cues.trim();
  return line.length > 90 ? line.slice(0, 88) + '…' : line;
}

function haptic(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate?.(pattern);
    } catch {
      /* ignore */
    }
  }
}
