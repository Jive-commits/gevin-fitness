import 'server-only';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session-user';
import type { Units } from '@/lib/units';
import type { Equipment } from '@prisma/client';

export type AppSettings = {
  id: string;
  units: Units;
  backSafeOnly: boolean;
  myEquipmentOnly: boolean;
  availableEquipment: Equipment[];
  defaultRestSec: number;
  incrementUpperKg: number;
  incrementLowerKg: number;
  activeProgramSlug: string | null;
  activeBlockSlug: string | null;
  currentDayOrder: number;
  bodyweightKg: number | null;
};

const ALL_EQUIPMENT: Equipment[] = [
  'BARBELL', 'DUMBBELL', 'SMITH_MACHINE', 'CABLE', 'MACHINE', 'BODYWEIGHT',
  'BAND', 'KETTLEBELL', 'EZ_BAR', 'PULL_UP_BAR', 'BENCH', 'SWISS_BALL', 'SLIDER',
];

/** Read the current tenant's settings, lazily creating the row if needed. */
export async function getSettings(): Promise<AppSettings> {
  const userId = await getCurrentUserId();
  let row = await prisma.userSettings.findFirst({ where: { userId } });
  if (!row) {
    // Adopt a pre-tenancy singleton row onto this user, if one exists.
    const legacy = await prisma.userSettings.findUnique({ where: { id: 'default' } });
    if (legacy && legacy.userId == null) {
      row = await prisma.userSettings.update({ where: { id: 'default' }, data: { userId } });
    } else if (legacy && legacy.userId === userId) {
      row = legacy;
    }
  }
  if (!row) {
    const defaultUnits =
      (process.env.DEFAULT_UNITS || 'lb').toLowerCase() === 'kg' ? 'kg' : 'lb';
    row = await prisma.userSettings.create({
      data: {
        userId,
        units: defaultUnits,
        availableEquipment: ALL_EQUIPMENT,
      },
    });
  }
  return {
    id: row.id,
    units: (row.units === 'lb' ? 'lb' : 'kg') as Units,
    backSafeOnly: row.backSafeOnly,
    myEquipmentOnly: row.myEquipmentOnly,
    availableEquipment: row.availableEquipment,
    defaultRestSec: row.defaultRestSec,
    incrementUpperKg: row.incrementUpperKg,
    incrementLowerKg: row.incrementLowerKg,
    activeProgramSlug: row.activeProgramSlug,
    activeBlockSlug: row.activeBlockSlug,
    currentDayOrder: row.currentDayOrder,
    bodyweightKg: row.bodyweightKg ?? null,
  };
}
