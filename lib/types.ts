import type {
  Muscle,
  Equipment,
  MovementPattern,
  Category,
  SpinalLoad,
  SplitType,
} from '@prisma/client';

// Plain, serializable shapes passed from server components to client components.

export type ExerciseLite = {
  id: string;
  slug: string;
  name: string;
  primaryMuscle: Muscle;
  secondaryMuscles: Muscle[];
  movementPattern: MovementPattern;
  category: Category;
  equipment: Equipment[];
  unilateral: boolean;
  spinalLoad: SpinalLoad;
  isBackSafe: boolean;
  defaultRepRange: string | null;
  cues: string | null;
  tempoNote: string | null;
  videoUrl: string | null;
  isCustom: boolean;
};

export type SlotView = {
  id: string;
  order: number;
  sets: number;
  repScheme: string;
  targetRpe: string | null;
  restSeconds: number;
  supersetGroup: string | null;
  supersetOrder: number | null;
  notes: string | null;
  replacesNote: string | null;
  exercise: ExerciseLite;
  defaultExercise: { id: string; slug: string; name: string };
  isSwapped: boolean;
};

export type DayView = {
  id: string;
  slug: string;
  name: string;
  order: number;
  splitType: SplitType;
  muscleTags: Muscle[];
  blockName: string;
  blockSlug: string;
  slots: SlotView[];
};

export type LastSetHint = {
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
};
