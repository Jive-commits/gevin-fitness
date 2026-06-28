-- Default to pounds for fresh installs, and flip the existing single-user row once.
ALTER TABLE "UserSettings" ALTER COLUMN "units" SET DEFAULT 'lb';
UPDATE "UserSettings" SET "units" = 'lb' WHERE "units" = 'kg';

-- Allow off-program "freestyle" sessions (no Day) + an optional label.
ALTER TABLE "WorkoutSession" ALTER COLUMN "dayId" DROP NOT NULL;
ALTER TABLE "WorkoutSession" ADD COLUMN "name" TEXT;
