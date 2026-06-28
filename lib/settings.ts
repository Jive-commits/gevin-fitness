import 'server-only';
import { prisma } from '@/lib/prisma';
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

/** Read settings, lazily creating the single default row if the seed hasn't run yet. */
export async function getSettings(): Promise<AppSettings> {
  let row = await prisma.userSettings.findUnique({ where: { id: 'default' } });
  if (!row) {
    const defaultUnits =
      (process.env.DEFAULT_UNITS || 'kg').toLowerCase() === 'lb' ? 'lb' : 'kg';
    row = await prisma.userSettings.create({
      data: {
        id: 'default',
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
