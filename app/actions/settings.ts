'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Equipment } from '@prisma/client';

export async function updateSettings(data: {
  units?: 'kg' | 'lb';
  backSafeOnly?: boolean;
  myEquipmentOnly?: boolean;
  availableEquipment?: Equipment[];
  defaultRestSec?: number;
  incrementUpperKg?: number;
  incrementLowerKg?: number;
}) {
  const clean: Record<string, unknown> = {};
  if (data.units === 'kg' || data.units === 'lb') clean.units = data.units;
  if (typeof data.backSafeOnly === 'boolean') clean.backSafeOnly = data.backSafeOnly;
  if (typeof data.myEquipmentOnly === 'boolean') clean.myEquipmentOnly = data.myEquipmentOnly;
  if (Array.isArray(data.availableEquipment)) clean.availableEquipment = data.availableEquipment;
  if (typeof data.defaultRestSec === 'number' && data.defaultRestSec >= 0 && data.defaultRestSec <= 900)
    clean.defaultRestSec = Math.round(data.defaultRestSec);
  if (typeof data.incrementUpperKg === 'number' && data.incrementUpperKg > 0) clean.incrementUpperKg = data.incrementUpperKg;
  if (typeof data.incrementLowerKg === 'number' && data.incrementLowerKg > 0) clean.incrementLowerKg = data.incrementLowerKg;

  await prisma.userSettings.upsert({
    where: { id: 'default' },
    create: { id: 'default', ...clean },
    update: clean,
  });
  revalidatePath('/settings');
  revalidatePath('/today');
  revalidatePath('/program');
  return { ok: true };
}

/** Point the schedule at a specific day (used by the Today day-picker). */
export async function setActiveDay(blockSlug: string, dayOrder: number) {
  await prisma.userSettings.update({
    where: { id: 'default' },
    data: { activeBlockSlug: blockSlug, currentDayOrder: dayOrder },
  });
  revalidatePath('/today');
  return { ok: true };
}

export async function logBodyweight(weightKg: number) {
  if (!(weightKg > 0) || weightKg > 500) return { ok: false, error: 'Invalid weight.' };
  await prisma.bodyMetric.create({ data: { weightKg } });
  await prisma.userSettings.update({ where: { id: 'default' }, data: { bodyweightKg: weightKg } });
  revalidatePath('/progress');
  return { ok: true };
}
