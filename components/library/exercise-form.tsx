'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { BottomSheet } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Chip } from '@/components/ui/chip';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { muscleLabel, patternLabel, equipmentLabel, spinalLoadLabel } from '@/lib/format';
import { MUSCLES, PATTERNS, EQUIPMENT, SPINAL_LOADS } from '@/lib/constants';
import { createCustomExercise, updateCustomExercise, type CustomExerciseInput } from '@/app/actions/exercises';
import type { ExerciseLite } from '@/lib/types';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** When provided, the form edits this custom exercise; otherwise it creates. */
  editing?: ExerciseLite | null;
};

function deriveBackSafe(s: string) {
  return s === 'NONE' || s === 'LOW';
}

export function ExerciseForm({ open, onOpenChange, editing }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(editing?.name ?? '');
  const [primary, setPrimary] = useState<string>(editing?.primaryMuscle ?? 'CHEST');
  const [secondary, setSecondary] = useState<string[]>(editing?.secondaryMuscles ?? []);
  const [pattern, setPattern] = useState<string>(editing?.movementPattern ?? 'ISOLATION');
  const [category, setCategory] = useState<string>(editing?.category ?? 'ISOLATION');
  const [equipment, setEquipment] = useState<string[]>(editing?.equipment ?? []);
  const [unilateral, setUnilateral] = useState(editing?.unilateral ?? false);
  const [spinal, setSpinal] = useState<string>(editing?.spinalLoad ?? 'NONE');
  const [backSafeTouched, setBackSafeTouched] = useState(false);
  const [backSafe, setBackSafe] = useState(editing?.isBackSafe ?? true);
  const [repRange, setRepRange] = useState(editing?.defaultRepRange ?? '');
  const [cues, setCues] = useState(editing?.cues ?? '');
  const [videoUrl, setVideoUrl] = useState(editing?.videoUrl ?? '');

  const effectiveBackSafe = backSafeTouched ? backSafe : deriveBackSafe(spinal);

  function toggle(arr: string[], v: string, set: (a: string[]) => void) {
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  }

  function submit() {
    setError(null);
    const input: CustomExerciseInput = {
      name,
      primaryMuscle: primary,
      secondaryMuscles: secondary.filter((m) => m !== primary),
      movementPattern: pattern,
      category,
      equipment,
      unilateral,
      spinalLoad: spinal,
      isBackSafe: effectiveBackSafe,
      defaultRepRange: repRange || null,
      cues: cues || null,
      videoUrl: videoUrl || null,
    };
    startTransition(async () => {
      const res = editing ? await updateCustomExercise(editing.id, input) : await createCustomExercise(input);
      if (res.ok) {
        onOpenChange(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit custom exercise' : 'Add exercise'}
      description={editing ? editing.name : 'Build your own — fully tagged like the library.'}
    >
      <div className="space-y-5 py-1">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Weird Machine Row" />
        </Field>

        <Field label="Primary muscle">
          <ChipRow>
            {MUSCLES.map((m) => (
              <Chip key={m} active={primary === m} tone="ember" onClick={() => setPrimary(m)}>
                {muscleLabel(m)}
              </Chip>
            ))}
          </ChipRow>
        </Field>

        <Field label="Secondary muscles" hint="optional">
          <ChipRow>
            {MUSCLES.filter((m) => m !== primary).map((m) => (
              <Chip key={m} active={secondary.includes(m)} onClick={() => toggle(secondary, m, setSecondary)}>
                {muscleLabel(m)}
              </Chip>
            ))}
          </ChipRow>
        </Field>

        <div className="grid grid-cols-1 gap-4">
          <Field label="Movement pattern">
            <ChipRow>
              {PATTERNS.map((p) => (
                <Chip key={p} active={pattern === p} onClick={() => setPattern(p)}>
                  {patternLabel(p)}
                </Chip>
              ))}
            </ChipRow>
          </Field>
          <Field label="Category">
            <div className="flex gap-2">
              {['COMPOUND', 'ISOLATION'].map((c) => (
                <Chip key={c} active={category === c} tone="ember" onClick={() => setCategory(c)}>
                  {c === 'COMPOUND' ? 'Compound' : 'Isolation'}
                </Chip>
              ))}
            </div>
          </Field>
        </div>

        <Field label="Equipment">
          <ChipRow>
            {EQUIPMENT.map((e) => (
              <Chip key={e} active={equipment.includes(e)} onClick={() => toggle(equipment, e, setEquipment)}>
                {equipmentLabel(e)}
              </Chip>
            ))}
          </ChipRow>
        </Field>

        <Field label="Spinal load" hint="drives back-safe">
          <div className="flex gap-2">
            {SPINAL_LOADS.map((s) => (
              <Chip
                key={s}
                active={spinal === s}
                tone={s === 'NONE' || s === 'LOW' ? 'mint' : 'ember'}
                onClick={() => {
                  setSpinal(s);
                  if (!backSafeTouched) setBackSafe(deriveBackSafe(s));
                }}
              >
                {spinalLoadLabel(s)}
              </Chip>
            ))}
          </div>
        </Field>

        <div className="flex items-center justify-between rounded-xl border border-border surface-2 px-3.5 py-3">
          <div className="flex items-center gap-2">
            {effectiveBackSafe ? (
              <ShieldCheck size={18} className="text-mint" />
            ) : (
              <ShieldAlert size={18} className="text-ember-2" />
            )}
            <div>
              <div className="text-sm font-medium">Back-safe</div>
              <div className="text-[11px] text-text-faint">
                {backSafeTouched ? 'manual override' : 'derived from spinal load'}
              </div>
            </div>
          </div>
          <Switch
            checked={effectiveBackSafe}
            onCheckedChange={(v) => {
              setBackSafeTouched(true);
              setBackSafe(v);
            }}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border surface-2 px-3.5 py-3">
          <div className="text-sm font-medium">Unilateral (per-side)</div>
          <Switch checked={unilateral} onCheckedChange={setUnilateral} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Default reps" hint="optional">
            <Input value={repRange} onChange={(e) => setRepRange(e.target.value)} placeholder="8-12" className="num text-center" />
          </Field>
          <Field label="Video URL" hint="optional">
            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://…" />
          </Field>
        </div>

        <Field label="Coaching cues" hint="optional">
          <textarea
            value={cues}
            onChange={(e) => setCues(e.target.value)}
            rows={2}
            placeholder="One or two short cues…"
            className="w-full rounded-xl surface-2 border border-border px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint focus-visible:border-ice focus-visible:outline-none"
          />
        </Field>

        {error && <p className="text-sm text-ember-3">{error}</p>}

        <Button variant="primary" size="lg" className="w-full" onClick={submit} disabled={pending || !name.trim() || equipment.length === 0}>
          {pending ? <Loader2 className="animate-spin" size={18} /> : editing ? 'Save changes' : 'Create exercise'}
        </Button>
      </div>
    </BottomSheet>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-text-faint">{label}</span>
        {hint && <span className="text-[10px] text-text-faint/70">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className={cn('-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar')}>{children}</div>;
}
