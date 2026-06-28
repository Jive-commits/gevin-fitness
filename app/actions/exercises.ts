'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Muscle, MovementPattern, Category, Equipment, SpinalLoad } from '@prisma/client';

const MUSCLES = ['QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'CHEST', 'LATS', 'UPPER_BACK', 'TRAPS', 'FRONT_DELTS', 'SIDE_DELTS', 'REAR_DELTS', 'BICEPS', 'TRICEPS', 'FOREARMS', 'ABS', 'OBLIQUES'];
const PATTERNS = ['SQUAT', 'HINGE', 'LUNGE', 'HORIZONTAL_PUSH', 'VERTICAL_PUSH', 'HORIZONTAL_PULL', 'VERTICAL_PULL', 'ISOLATION', 'CARRY', 'CORE', 'CALF_RAISE'];
const EQUIPMENT = ['BARBELL', 'DUMBBELL', 'SMITH_MACHINE', 'CABLE', 'MACHINE', 'BODYWEIGHT', 'BAND', 'KETTLEBELL', 'EZ_BAR', 'PULL_UP_BAR', 'BENCH', 'SWISS_BALL', 'SLIDER'];
const SPINAL = ['NONE', 'LOW', 'MODERATE', 'HIGH'];

export type CustomExerciseInput = {
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  movementPattern: string;
  category: string;
  equipment: string[];
  unilateral: boolean;
  spinalLoad: string;
  isBackSafe?: boolean | null; // null/undefined -> derive
  defaultRepRange?: string | null;
  cues?: string | null;
  videoUrl?: string | null;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48);
}

function deriveBackSafe(spinalLoad: string): boolean {
  return spinalLoad === 'NONE' || spinalLoad === 'LOW';
}

function validate(input: CustomExerciseInput): string | null {
  if (!input.name || !input.name.trim()) return 'Name is required.';
  if (!MUSCLES.includes(input.primaryMuscle)) return 'Invalid primary muscle.';
  if (!PATTERNS.includes(input.movementPattern)) return 'Invalid movement pattern.';
  if (!['COMPOUND', 'ISOLATION'].includes(input.category)) return 'Invalid category.';
  if (!SPINAL.includes(input.spinalLoad)) return 'Invalid spinal load.';
  if (input.secondaryMuscles.some((m) => !MUSCLES.includes(m))) return 'Invalid secondary muscle.';
  if (input.equipment.some((e) => !EQUIPMENT.includes(e))) return 'Invalid equipment.';
  if (input.equipment.length === 0) return 'Pick at least one piece of equipment.';
  return null;
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = `custom-${base || 'exercise'}`;
  let slug = root;
  let i = 2;
  // Guarantee no collision with seeded or other custom exercises.
  while (true) {
    const existing = await prisma.exercise.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${root}-${i++}`;
  }
}

export async function createCustomExercise(input: CustomExerciseInput) {
  const err = validate(input);
  if (err) return { ok: false as const, error: err };

  const slug = await uniqueSlug(slugify(input.name));
  const isBackSafe =
    input.isBackSafe === null || input.isBackSafe === undefined
      ? deriveBackSafe(input.spinalLoad)
      : input.isBackSafe;

  const ex = await prisma.exercise.create({
    data: {
      slug,
      name: input.name.trim(),
      primaryMuscle: input.primaryMuscle as Muscle,
      secondaryMuscles: input.secondaryMuscles as Muscle[],
      movementPattern: input.movementPattern as MovementPattern,
      category: input.category as Category,
      equipment: input.equipment as Equipment[],
      unilateral: !!input.unilateral,
      spinalLoad: input.spinalLoad as SpinalLoad,
      isBackSafe,
      defaultRepRange: input.defaultRepRange?.trim() || null,
      cues: input.cues?.trim() || null,
      videoUrl: input.videoUrl?.trim() || null,
      isCustom: true,
    },
  });
  revalidatePath('/library');
  return { ok: true as const, id: ex.id, slug: ex.slug };
}

export async function updateCustomExercise(id: string, input: CustomExerciseInput) {
  const target = await prisma.exercise.findUnique({ where: { id }, select: { isCustom: true } });
  if (!target) return { ok: false as const, error: 'Not found.' };
  if (!target.isCustom) return { ok: false as const, error: 'Seeded exercises can’t be edited.' };
  const err = validate(input);
  if (err) return { ok: false as const, error: err };

  const isBackSafe =
    input.isBackSafe === null || input.isBackSafe === undefined
      ? deriveBackSafe(input.spinalLoad)
      : input.isBackSafe;

  await prisma.exercise.update({
    where: { id },
    data: {
      name: input.name.trim(),
      primaryMuscle: input.primaryMuscle as Muscle,
      secondaryMuscles: input.secondaryMuscles as Muscle[],
      movementPattern: input.movementPattern as MovementPattern,
      category: input.category as Category,
      equipment: input.equipment as Equipment[],
      unilateral: !!input.unilateral,
      spinalLoad: input.spinalLoad as SpinalLoad,
      isBackSafe,
      defaultRepRange: input.defaultRepRange?.trim() || null,
      cues: input.cues?.trim() || null,
      videoUrl: input.videoUrl?.trim() || null,
    },
  });
  revalidatePath('/library');
  revalidatePath(`/library/${id}`);
  return { ok: true as const };
}

export async function deleteCustomExercise(id: string) {
  const ex = await prisma.exercise.findUnique({
    where: { id },
    select: { isCustom: true, name: true },
  });
  if (!ex) return { ok: false as const, error: 'Not found.' };
  if (!ex.isCustom) return { ok: false as const, error: 'Seeded exercises can’t be deleted.' };

  const [logCount, slots] = await Promise.all([
    prisma.setLog.count({ where: { exerciseId: id } }),
    prisma.slotExercise.findMany({
      where: { exerciseId: id },
      select: { id: true, slug: true, day: { select: { name: true } } },
    }),
  ]);

  if (logCount > 0) {
    return {
      ok: false as const,
      error: `“${ex.name}” has ${logCount} logged set${logCount === 1 ? '' : 's'}. Delete those sessions first to remove it.`,
      blockedBy: 'logs' as const,
    };
  }
  if (slots.length > 0) {
    return {
      ok: false as const,
      error: `“${ex.name}” is currently swapped into ${slots.length} program slot${slots.length === 1 ? '' : 's'}. Reset those slots to default first.`,
      blockedBy: 'slots' as const,
      slots,
    };
  }

  await prisma.exercise.delete({ where: { id } });
  revalidatePath('/library');
  return { ok: true as const };
}
