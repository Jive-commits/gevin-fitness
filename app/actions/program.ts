'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/** Swap a slot's current exercise. Preserves defaultExerciseId + replacesNote. */
export async function swapExercise(slotId: string, exerciseId: string) {
  const ex = await prisma.exercise.findUnique({ where: { id: exerciseId }, select: { id: true } });
  if (!ex) return { ok: false, error: 'Exercise not found' };
  await prisma.slotExercise.update({
    where: { id: slotId },
    data: { exerciseId },
  });
  revalidatePath('/program');
  revalidatePath('/today');
  return { ok: true };
}

/** Reset a slot back to its canonical program-default exercise. */
export async function resetSlotToDefault(slotId: string) {
  const slot = await prisma.slotExercise.findUnique({
    where: { id: slotId },
    select: { defaultExerciseId: true },
  });
  if (!slot) return { ok: false, error: 'Slot not found' };
  await prisma.slotExercise.update({
    where: { id: slotId },
    data: { exerciseId: slot.defaultExerciseId },
  });
  revalidatePath('/program');
  revalidatePath('/today');
  return { ok: true };
}

/** Edit a slot's prescription (sets / reps / RPE / rest). */
export async function editSlot(
  slotId: string,
  data: { sets?: number; repScheme?: string; targetRpe?: string | null; restSeconds?: number; notes?: string | null },
) {
  const clean: Record<string, unknown> = {};
  if (typeof data.sets === 'number' && data.sets > 0 && data.sets <= 20) clean.sets = data.sets;
  if (typeof data.repScheme === 'string' && data.repScheme.trim()) clean.repScheme = data.repScheme.trim();
  if (data.targetRpe !== undefined) clean.targetRpe = data.targetRpe?.toString().trim() || null;
  if (typeof data.restSeconds === 'number' && data.restSeconds >= 0 && data.restSeconds <= 900) clean.restSeconds = data.restSeconds;
  if (data.notes !== undefined) clean.notes = data.notes?.toString().trim() || null;

  await prisma.slotExercise.update({ where: { id: slotId }, data: clean });
  revalidatePath('/program');
  revalidatePath('/today');
  return { ok: true };
}

/** Reorder slots within a day. orderedSlotIds is the new top-to-bottom order. */
export async function reorderSlots(dayId: string, orderedSlotIds: string[]) {
  await prisma.$transaction(
    orderedSlotIds.map((id, i) =>
      prisma.slotExercise.update({ where: { id }, data: { order: i + 1 } }),
    ),
  );
  revalidatePath('/program');
  revalidatePath('/today');
  return { ok: true };
}
