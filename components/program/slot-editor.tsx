'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { BottomSheet } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Stepper } from '@/components/ui/stepper';
import { Button } from '@/components/ui/button';
import { formatClock } from '@/lib/format';
import { editSlot } from '@/app/actions/program';

export type EditableSlot = {
  id: string;
  exerciseName: string;
  sets: number;
  repScheme: string;
  targetRpe: string | null;
  restSeconds: number;
  notes: string | null;
};

export function SlotEditor({
  open,
  onOpenChange,
  slot,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  slot: EditableSlot;
}) {
  const [sets, setSets] = useState(slot.sets);
  const [reps, setReps] = useState(slot.repScheme);
  const [rpe, setRpe] = useState(slot.targetRpe ?? '');
  const [rest, setRest] = useState(slot.restSeconds);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await editSlot(slot.id, {
        sets,
        repScheme: reps,
        targetRpe: rpe || null,
        restSeconds: rest,
      });
      onOpenChange(false);
    });
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Edit prescription" description={slot.exerciseName}>
      <div className="space-y-5 py-1">
        <div className="flex items-start justify-around gap-2">
          <Stepper label="Sets" value={sets} onChange={(v) => setSets(v ?? 1)} min={1} max={20} step={1} />
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-text-faint">Rest</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setRest((r) => Math.max(0, r - 15))}
                className="tap grid h-11 w-11 place-items-center rounded-xl surface-2 border border-border text-text-dim"
                aria-label="Less rest"
              >
                −
              </button>
              <span className="num grid h-12 min-w-[72px] place-items-center text-2xl font-bold tabular-nums">
                {formatClock(rest)}
              </span>
              <button
                type="button"
                onClick={() => setRest((r) => Math.min(900, r + 15))}
                className="tap grid h-11 w-11 place-items-center rounded-xl surface-2 border border-border text-text-dim"
                aria-label="More rest"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1.5">
            <span className="block text-[11px] font-medium uppercase tracking-wide text-text-faint">Reps / scheme</span>
            <Input value={reps} onChange={(e) => setReps(e.target.value)} placeholder="8-10" className="num text-center" />
          </label>
          <label className="space-y-1.5">
            <span className="block text-[11px] font-medium uppercase tracking-wide text-text-faint">Target RPE</span>
            <Input value={rpe} onChange={(e) => setRpe(e.target.value)} placeholder="7-8" className="num text-center" />
          </label>
        </div>

        <p className="text-xs text-text-faint">
          Schemes can be a range (<span className="num">8-10</span>), fixed (<span className="num">5</span>),
          per-leg (<span className="num">20/leg</span>), or timed (<span className="num">30s</span>).
        </p>

        <Button variant="primary" size="lg" className="w-full" onClick={save} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" size={18} /> : 'Save changes'}
        </Button>
      </div>
    </BottomSheet>
  );
}
