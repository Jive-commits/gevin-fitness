'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { ExerciseForm } from '@/components/library/exercise-form';
import { BottomSheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { deleteCustomExercise } from '@/app/actions/exercises';
import type { ExerciseLite } from '@/lib/types';

export function CustomExerciseActions({ exercise }: { exercise: ExerciseLite }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function doDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteCustomExercise(exercise.id);
      if (res.ok) {
        setConfirmOpen(false);
        router.push('/library');
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setEditOpen(true)}
          className="tap flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border surface-2 py-2.5 text-sm font-medium text-text-dim"
        >
          <Pencil size={15} /> Edit
        </button>
        <button
          onClick={() => { setError(null); setConfirmOpen(true); }}
          className="tap flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-ember-3/30 bg-ember-3/10 py-2.5 text-sm font-medium text-ember-3"
        >
          <Trash2 size={15} /> Delete
        </button>
      </div>

      <ExerciseForm open={editOpen} onOpenChange={setEditOpen} editing={exercise} />

      <BottomSheet open={confirmOpen} onOpenChange={setConfirmOpen} title="Delete custom exercise">
        <div className="space-y-4 py-1">
          <p className="text-sm text-text-dim">
            Delete <span className="font-medium text-text">{exercise.name}</span>? This can’t be undone.
          </p>
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-ember-2/30 bg-ember-grad-soft px-3.5 py-3 text-sm text-text-dim">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-ember-2" />
              <span>{error} You can reset the slot from the Program screen’s swap drawer.</span>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="surface" size="lg" className="flex-1" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="lg" className="flex-1" onClick={doDelete} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" size={18} /> : 'Delete'}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
