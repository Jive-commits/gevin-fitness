-- Multi-tenant foundation. Adds the User table and nullable userId tenancy columns,
-- creates the single default tenant for the current single-passcode app, and
-- backfills all existing rows onto it. Additive + backfilled = no behavior change.

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Seed the single default tenant (one passcode = one user today).
INSERT INTO "User" ("id", "name", "createdAt")
VALUES ('usr_default', 'Default', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- AddColumn (nullable)
ALTER TABLE "UserSettings"   ADD COLUMN "userId" TEXT;
ALTER TABLE "CoachProfile"   ADD COLUMN "userId" TEXT;
ALTER TABLE "WorkoutSession" ADD COLUMN "userId" TEXT;
ALTER TABLE "BodyMetric"     ADD COLUMN "userId" TEXT;

-- Backfill existing rows onto the default tenant
UPDATE "UserSettings"   SET "userId" = 'usr_default' WHERE "userId" IS NULL;
UPDATE "CoachProfile"   SET "userId" = 'usr_default' WHERE "userId" IS NULL;
UPDATE "WorkoutSession" SET "userId" = 'usr_default' WHERE "userId" IS NULL;
UPDATE "BodyMetric"     SET "userId" = 'usr_default' WHERE "userId" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");
CREATE UNIQUE INDEX "CoachProfile_userId_key" ON "CoachProfile"("userId");
CREATE INDEX "WorkoutSession_userId_idx" ON "WorkoutSession"("userId");
CREATE INDEX "BodyMetric_userId_idx" ON "BodyMetric"("userId");

-- AddForeignKey
ALTER TABLE "UserSettings"   ADD CONSTRAINT "UserSettings_userId_fkey"   FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CoachProfile"   ADD CONSTRAINT "CoachProfile_userId_fkey"   FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BodyMetric"     ADD CONSTRAINT "BodyMetric_userId_fkey"     FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
