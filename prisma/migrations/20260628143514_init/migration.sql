-- CreateEnum
CREATE TYPE "Muscle" AS ENUM ('QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'CHEST', 'LATS', 'UPPER_BACK', 'TRAPS', 'FRONT_DELTS', 'SIDE_DELTS', 'REAR_DELTS', 'BICEPS', 'TRICEPS', 'FOREARMS', 'ABS', 'OBLIQUES');

-- CreateEnum
CREATE TYPE "MovementPattern" AS ENUM ('SQUAT', 'HINGE', 'LUNGE', 'HORIZONTAL_PUSH', 'VERTICAL_PUSH', 'HORIZONTAL_PULL', 'VERTICAL_PULL', 'ISOLATION', 'CARRY', 'CORE', 'CALF_RAISE');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('COMPOUND', 'ISOLATION');

-- CreateEnum
CREATE TYPE "Equipment" AS ENUM ('BARBELL', 'DUMBBELL', 'SMITH_MACHINE', 'CABLE', 'MACHINE', 'BODYWEIGHT', 'BAND', 'KETTLEBELL', 'EZ_BAR', 'PULL_UP_BAR', 'BENCH', 'SWISS_BALL', 'SLIDER');

-- CreateEnum
CREATE TYPE "SpinalLoad" AS ENUM ('NONE', 'LOW', 'MODERATE', 'HIGH');

-- CreateEnum
CREATE TYPE "SplitType" AS ENUM ('LEGS', 'PUSH', 'PULL');

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primaryMuscle" "Muscle" NOT NULL,
    "secondaryMuscles" "Muscle"[],
    "movementPattern" "MovementPattern" NOT NULL,
    "category" "Category" NOT NULL,
    "equipment" "Equipment"[],
    "unilateral" BOOLEAN NOT NULL DEFAULT false,
    "spinalLoad" "SpinalLoad" NOT NULL,
    "isBackSafe" BOOLEAN NOT NULL,
    "defaultRepRange" TEXT,
    "cues" TEXT,
    "tempoNote" TEXT,
    "videoUrl" TEXT,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "author" TEXT,
    "description" TEXT,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "weeks" INTEGER NOT NULL,
    "phase" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Day" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "splitType" "SplitType" NOT NULL,
    "muscleTags" "Muscle"[],

    CONSTRAINT "Day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlotExercise" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "defaultExerciseId" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "repScheme" TEXT NOT NULL,
    "targetRpe" TEXT,
    "restSeconds" INTEGER NOT NULL,
    "supersetGroup" TEXT,
    "supersetOrder" INTEGER,
    "notes" TEXT,
    "replacesNote" TEXT,

    CONSTRAINT "SlotExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "durationSec" INTEGER,

    CONSTRAINT "WorkoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "slotId" TEXT,
    "setNumber" INTEGER NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "reps" INTEGER,
    "rpe" DOUBLE PRECISION,
    "isWarmup" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SetLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyMetric" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weightKg" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BodyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "units" TEXT NOT NULL DEFAULT 'kg',
    "backSafeOnly" BOOLEAN NOT NULL DEFAULT true,
    "myEquipmentOnly" BOOLEAN NOT NULL DEFAULT true,
    "availableEquipment" "Equipment"[],
    "defaultRestSec" INTEGER NOT NULL DEFAULT 120,
    "incrementUpperKg" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "incrementLowerKg" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "activeProgramSlug" TEXT,
    "currentDayOrder" INTEGER NOT NULL DEFAULT 1,
    "activeBlockSlug" TEXT,
    "bodyweightKg" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_slug_key" ON "Exercise"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Program_slug_key" ON "Program"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Block_slug_key" ON "Block"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Day_slug_key" ON "Day"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SlotExercise_slug_key" ON "SlotExercise"("slug");

-- CreateIndex
CREATE INDEX "WorkoutSession_dayId_idx" ON "WorkoutSession"("dayId");

-- CreateIndex
CREATE INDEX "WorkoutSession_date_idx" ON "WorkoutSession"("date");

-- CreateIndex
CREATE INDEX "SetLog_exerciseId_idx" ON "SetLog"("exerciseId");

-- CreateIndex
CREATE INDEX "SetLog_sessionId_idx" ON "SetLog"("sessionId");

-- CreateIndex
CREATE INDEX "BodyMetric_date_idx" ON "BodyMetric"("date");

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Day" ADD CONSTRAINT "Day_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotExercise" ADD CONSTRAINT "SlotExercise_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotExercise" ADD CONSTRAINT "SlotExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotExercise" ADD CONSTRAINT "SlotExercise_defaultExerciseId_fkey" FOREIGN KEY ("defaultExerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetLog" ADD CONSTRAINT "SetLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetLog" ADD CONSTRAINT "SetLog_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
