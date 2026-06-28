-- Unique key so the live logger can upsert a set by (session, slot, set number).
CREATE UNIQUE INDEX "SetLog_sessionId_slotId_setNumber_key" ON "SetLog"("sessionId", "slotId", "setNumber");
