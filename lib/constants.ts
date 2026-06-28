import type { Muscle, MovementPattern, Equipment, SpinalLoad, Category } from '@prisma/client';

export const MUSCLES: Muscle[] = [
  'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'CHEST', 'LATS', 'UPPER_BACK', 'TRAPS',
  'FRONT_DELTS', 'SIDE_DELTS', 'REAR_DELTS', 'BICEPS', 'TRICEPS', 'FOREARMS', 'ABS', 'OBLIQUES',
];

export const PATTERNS: MovementPattern[] = [
  'SQUAT', 'HINGE', 'LUNGE', 'HORIZONTAL_PUSH', 'VERTICAL_PUSH', 'HORIZONTAL_PULL',
  'VERTICAL_PULL', 'ISOLATION', 'CARRY', 'CORE', 'CALF_RAISE',
];

export const EQUIPMENT: Equipment[] = [
  'BARBELL', 'DUMBBELL', 'SMITH_MACHINE', 'CABLE', 'MACHINE', 'BODYWEIGHT',
  'BAND', 'KETTLEBELL', 'EZ_BAR', 'PULL_UP_BAR', 'BENCH', 'SWISS_BALL', 'SLIDER',
];

export const SPINAL_LOADS: SpinalLoad[] = ['NONE', 'LOW', 'MODERATE', 'HIGH'];
export const CATEGORIES: Category[] = ['COMPOUND', 'ISOLATION'];

// Muscle grouping for the Library/Progress filters.
export const MUSCLE_GROUPS: { label: string; muscles: Muscle[] }[] = [
  { label: 'Legs', muscles: ['QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES'] },
  { label: 'Chest', muscles: ['CHEST'] },
  { label: 'Back', muscles: ['LATS', 'UPPER_BACK', 'TRAPS'] },
  { label: 'Shoulders', muscles: ['FRONT_DELTS', 'SIDE_DELTS', 'REAR_DELTS'] },
  { label: 'Arms', muscles: ['BICEPS', 'TRICEPS', 'FOREARMS'] },
  { label: 'Core', muscles: ['ABS', 'OBLIQUES'] },
];
