-- CreateTable
CREATE TABLE "CoachProfile" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "primaryGoal" TEXT,
    "goalDetail" TEXT,
    "why" TEXT,
    "whyDeeper" TEXT,
    "identity" TEXT,
    "obstacles" TEXT,
    "trainingDaysPerWeek" INTEGER NOT NULL DEFAULT 4,
    "targetDate" TIMESTAMP(3),
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "persona" TEXT NOT NULL DEFAULT 'mentor',
    "intensity" INTEGER NOT NULL DEFAULT 2,
    "channel" TEXT NOT NULL DEFAULT 'in_app',
    "phoneNumber" TEXT,
    "smsConsent" BOOLEAN NOT NULL DEFAULT false,
    "smsConsentAt" TIMESTAMP(3),
    "smsStopped" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "quietStartHour" INTEGER NOT NULL DEFAULT 21,
    "quietEndHour" INTEGER NOT NULL DEFAULT 8,
    "lastNudgeAt" TIMESTAMP(3),
    "onboardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NudgeLog" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "persona" TEXT,
    "body" TEXT NOT NULL,
    "meta" JSONB,
    "twilioSid" TEXT,
    "status" TEXT NOT NULL DEFAULT 'created',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NudgeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NudgeLog_profileId_idx" ON "NudgeLog"("profileId");

-- CreateIndex
CREATE INDEX "NudgeLog_createdAt_idx" ON "NudgeLog"("createdAt");

-- AddForeignKey
ALTER TABLE "NudgeLog" ADD CONSTRAINT "NudgeLog_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

