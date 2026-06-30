# 15 — Phase 0: Multi-Tenant Migration Playbook

> The single-user assumption is load-bearing in **83 Prisma call sites across 14 files** and in two literal singletons (`UserSettings`/`CoachProfile` keyed `id: "default"`). This is the concrete plan to make FORGE safely multi-tenant **before user #2** without rewriting the engine. It executes Phase 0 of `11-phased-execution-roadmap.md` and `07-architecture-and-ios-path.md`. Honest effort: **3–4 weeks, one engineer.** The risk is not threading `userId` — it's the singleton-collapse races and the *one forgotten `where`* that leaks tenant A into tenant B. RLS is the seatbelt that makes the edit survivable.

## 1. The account model + auth swap

Today `lib/auth.ts` derives a SHA-256 token from a shared `APP_PASSCODE` and stores it in the `forge_session` cookie; `middleware.ts` checks `isValidToken` only. There is **no identity** — everyone is the same person. Phone-as-identity reuses the SMS-consent record the coach already collects (`CoachProfile.phoneNumber`), so login identity and TCPA consent become one entity.

```prisma
model User {
  id          String   @id @default(cuid())
  phone       String   @unique          // E.164, e.g. +15551234567
  appleSub    String?  @unique          // Sign in with Apple (Phase 3; nullable now)
  tz          String   @default("America/New_York")
  createdAt   DateTime @default(now())

  settings    UserSettings?
  coach       CoachProfile?
  sessions    WorkoutSession[]
  setLogs     SetLog[]
  bodyMetrics BodyMetric[]
  customExercises Exercise[]            // only isCustom rows are owned
  authSessions AuthSession[]
}

model AuthSession {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
  @@index([userId])
}
```

**OTP flow** (Twilio Verify; account already exists for SMS):

| Route | Replaces | Behavior |
|---|---|---|
| `POST /api/auth/otp/start` | — | body `{ phone }` → `verify.services.verifications.create({ to, channel:'sms' })` |
| `POST /api/auth/otp/check` | `app/api/auth/login/route.ts` | `{ phone, code }` → on `approved`, `upsert` `User` by phone, create `AuthSession`, set cookie to its `id` |
| `POST /api/auth/logout` | unchanged shape | delete `AuthSession`, clear cookie |

`lib/auth.ts` `expectedToken`/`isValidToken` are **deleted**. New surface:

```ts
// lib/auth.ts
export async function getSessionUserId(): Promise<string | null>  // cookie → AuthSession → userId
export async function requireUserId(): Promise<string>            // redirects if null; used in every action
```

`middleware.ts` keeps its `PUBLIC_PREFIXES` allowlist (Twilio + cron hit `/api/coach/*` with their own `CRON_SECRET`/signature checks) but swaps `isValidToken(token)` for a session check. Middleware runs on Edge where Prisma can't, so the cookie carries a **short-lived signed JWT** (`userId`, verified with `jose`) for the Edge check; the authoritative `AuthSession` lookup happens in `requireUserId()` server-side — DB-backed so revocation works. JWT 7 days, refreshed per authenticated request.

## 2. Schema changes — who gets `userId`

Owned vs. global is what limits blast radius. **Library, programs, blocks, days, and slot templates stay global** (catalog data, not user data).

| Model | Change | Notes |
|---|---|---|
| `WorkoutSession` | **add** `userId` + FK + `@@index([userId])` | direct owner |
| `BodyMetric` | **add** `userId` + FK + `@@index([userId])` | direct owner |
| `SetLog` | **add** `userId` (denormalized) + `@@index([userId])` | reachable via `session` but denormalize so RLS + `where` are flat and cheap |
| `UserSettings` | **drop** `id @default("default")`; add `userId String @unique` | one row per user |
| `CoachProfile` | **drop** `id @default("default")`; add `userId String @unique` | one row per user |
| `NudgeLog` | keep `profileId` (FK to `CoachProfile`, already user-scoped) | inherits scope transitively |
| `Exercise` | **add** `userId String?` (only set when `isCustom`) | catalog rows stay `null`/global |
| Program/Block/Day/SlotExercise/enums | **untouched** | global catalog |

`SetLog.userId` is denormalized deliberately: `lib/analytics.ts` queries `setLog` directly ~10 times (`getRecentPRs`, `getTotals`, `getWeeklyVolumeByMuscle`…), so a flat `where: { userId }` + flat RLS policy beats a join on every read. Set it in `saveSet()` from the session owner.

## 3. Threading `userId` — the 83-site enforcement layer

Hand-adding `where: { userId }` to 83 sites is error-prone — **one miss is a cross-tenant leak.** Two-part defense (RLS is part 2, §4). **Pattern:** every `lib/queries.ts`, `lib/analytics.ts`, `lib/coach/*` read-model takes `userId` as its **first parameter**; every `app/actions/*` server action calls `const userId = await requireUserId()` at the top and threads it down. Inventory by file:

| File | Sites | Action |
|---|---|---|
| `lib/analytics.ts` | 14 | add `userId` 1st param to all 13 exports (`getExerciseSeries`, `getRecentPRs`, `getTotals`, `getWeeklyVolumeByMuscle`, `getConsistency`, `getBodyweightSeries`, `getDailyActivity`, …); add `userId` to every `setLog`/`workoutSession`/`bodyMetric` `where` |
| `lib/queries.ts` | 12 | session/setLog reads get `userId`; `getProgram`/`getDayView`/`getAllExercises` stay global **but** `getAllExercises` must filter `OR: [{ isCustom:false }, { userId }]` so user A never sees user B's custom lifts |
| `app/actions/session.ts` | 18 | `ensureSession`/`ensureCustomSession`/`saveSet` set `userId` on create; `advanceSchedule` updates `UserSettings` by `where:{ userId }` (line 184 `id:'default'` → gone) |
| `app/actions/coach.ts` | 4 | three `coachProfile.update({where:{id:'default'}})` → `where:{ userId }` |
| `app/actions/exercises.ts` | 8 | custom-exercise create sets `userId`; edits/deletes filter by it |
| `app/actions/settings.ts` | 4 | `upsert`/`update` `id:'default'` → `where:{ userId }`, `create:{ userId }` |
| `app/actions/program.ts` | 6 | program is global; only the `UserSettings` cursor writes get `userId` |
| `app/actions/history.ts` | 1 | session read gets `userId` |
| `lib/coach/activity.ts` | 1 | `getCoachActivity(userId, tz, now)` — `workoutSession.findMany` gets `where:{ userId, completed:true }` |
| `lib/coach/nudge.ts` | 5 | `runCoachTick({ userId })`; `getCoachProfile(userId)`, `getSettings(userId)`, `getCoachActivity(userId,…)`, `nudgeLog` dupe-check + create scoped via `profileId` |
| `lib/coach/profile.ts` | 3 | `getCoachProfile(userId)` lazy-creates by `userId` (see §5 race) |
| `lib/settings.ts` | 2 | `getSettings(userId)` lazy-creates by `userId` |
| `app/api/coach/sms/route.ts` | 4 | inbound: resolve `User` by `From` phone → `userId`; everything scoped to that user |
| `app/(app)/today/custom/page.tsx` | 1 | passes `requireUserId()` result into the action |

Server components in `app/(app)/*` call `requireUserId()` once and pass it into the read models.

## 4. Postgres RLS — the fail-closed backstop

RLS makes a forgotten `where` **fail closed** instead of leaking. Set a per-transaction GUC via a Prisma client extension; policies on every owned table read it.

```sql
ALTER TABLE "WorkoutSession" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "WorkoutSession"
  USING ("userId" = current_setting('app.current_user_id', true));
-- repeat for SetLog, BodyMetric, UserSettings, CoachProfile.
-- Custom exercises: USING ("isCustom" = false OR "userId" = current_setting('app.current_user_id', true));
-- NudgeLog: USING via profileId -> CoachProfile.userId.
```

```ts
// lib/prisma.ts — extend the client
prisma.$extends({ query: { $allModels: { async $allOperations({ args, query }) {
  const uid = userIdContext.getStore();           // AsyncLocalStorage, set by requireUserId()
  if (!uid) return query(args);                   // global/catalog reads (Exercise library) run unscoped
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${uid}, true)`;
    return query(args);
  });
}}}})
```

Connect the app as a **non-`BYPASSRLS`** role — the table owner/superuser silently bypasses RLS. Migrations and seed run as the privileged role; runtime uses the restricted role.

## 5. The riskiest part: singleton collapse + lazy-create races

The hard 80% is **not** threading `userId` — it's `getSettings()`/`getCoachProfile()`, which today `findUnique({id:'default'})` then create-if-missing. Per-user, two concurrent first-requests race to create the same row. Fix with a unique constraint + idempotent upsert:

```ts
export async function getSettings(userId: string): Promise<AppSettings> {
  const row = await prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: { userId, units: defaultUnits(), availableEquipment: ALL_EQUIPMENT },
  });
  // …map as before
}
```

`@unique` on `userId` makes the upsert race-safe (the loser hits the constraint and re-reads). `CoachProfile` gets the same treatment, preserving its existing try/catch fallback. **Partial-onboarding states** (`isOnboarded` checks `onboardedAt || (primaryGoal && why)`) are unchanged — they already tolerate an empty profile.

## 6. Data migration for the existing single user

One row exists per singleton; one human owns all current data. Backfill in a single transactional migration:

```sql
-- 1. create the founder User from the existing CoachProfile phone (fallback to a seeded phone)
INSERT INTO "User"(id, phone, tz) SELECT 'founder', COALESCE("phoneNumber",'+10000000000'), "timezone"
  FROM "CoachProfile" WHERE id='default';
-- 2. point every owned row at it
UPDATE "WorkoutSession" SET "userId"='founder';
UPDATE "BodyMetric"     SET "userId"='founder';
UPDATE "SetLog"         SET "userId"='founder';
UPDATE "Exercise"       SET "userId"='founder' WHERE "isCustom"=true;
UPDATE "UserSettings"   SET "userId"='founder' WHERE id='default';
UPDATE "CoachProfile"   SET "userId"='founder' WHERE id='default';
-- 3. only after backfill: make userId NOT NULL + add FKs + RLS
```

Run as **three Prisma migrations**: (a) nullable `userId` + `User`/`AuthSession` tables, (b) the backfill SQL above, (c) `NOT NULL` + FK + indexes + enable RLS. Never enable RLS before the backfill — unscoped legacy rows vanish from every query.

## 7. Ordered checklist with acceptance criteria

- [ ] **1. `User` + `AuthSession` models, nullable `userId` columns** — `prisma migrate` applies clean; existing app still boots.
- [ ] **2. Backfill migration** — every `WorkoutSession`/`SetLog`/`BodyMetric`/custom `Exercise` row has `userId='founder'`; founder can still see all history.
- [ ] **3. `NOT NULL` + FK + `@@index([userId])`; collapse singletons to `@unique userId`** — `id:'default'` removed from schema and all 13 code sites; `getSettings`/`getCoachProfile` upserts are race-safe under 50 concurrent first-requests.
- [ ] **4. Phone-OTP routes + `getSessionUserId`/`requireUserId`; delete passcode auth** — new phone receives code, verifies, lands authenticated; `middleware.ts` redirects unauthenticated to `/login`; logout revokes the `AuthSession`.
- [ ] **5. Thread `userId` through all 83 sites** — table in §3 fully checked; `tsc` passes (every read model now *requires* `userId`, so the compiler flags any unthreaded caller — lean on this).
- [ ] **6. RLS policies + restricted runtime role + AsyncLocalStorage GUC extension** — with the GUC unset, owned-table queries return 0 rows (fail-closed proven).
- [ ] **7. Coach scoping** — `runCoachTick({ userId })`; inbound SMS resolves sender phone → `userId`; cron still single-tenant for now (fleet fan-out is Phase 2, explicitly out of scope here).
- [ ] **8. Cross-tenant integration test (the ship-blocker)** — see below.
- [ ] **9. Repositioning copy** — kill "A precision instrument for serious lifting," ship "Stop starting over." (`05-screen-by-screen-redesign.md`).

**Cross-tenant test** (Vitest + a throwaway Postgres, runs in CI):

```ts
test('tenants are fully isolated', async () => {
  const a = await signUp('+15550000001'); const b = await signUp('+15550000002');
  await asUser(a, () => saveSet({ exerciseId: squatId, weightKg: 100, reps: 5, /*…*/ }));
  expect(await asUser(b, () => getTotals(b.id)).totalSessions).toBe(0);         // B sees nothing
  expect(await asUser(b, () => getRecentPRs(b.id))).toHaveLength(0);
  // RLS backstop: call a read WITHOUT the userId filter but WITH B's GUC set →
  await asUser(b, async () => {
    const rows = await prisma.workoutSession.findMany();  // no where clause on purpose
    expect(rows).toHaveLength(0);                          // RLS, not the app, isolates
  });
  await asUser(a, () => updateCoachProfile(a.id, { why: 'wedding' }));
  expect((await getCoachProfile(b.id)).why).toBeNull();   // singletons no longer shared
});
```

## 8. What's deliberately CUT from Phase 0 (priced honestly)

| Cut | Why it waits |
|---|---|
| Sign in with Apple | one tenant; column added now, flow ships Phase 3 with the Capacitor build (App Store 4.8 forces it only once a 3rd-party login exists) |
| Coach fleet fan-out / durable queue (`pg-boss`) | `instrumentation.ts` ticks one profile — fine until N users; replacing it is Phase 2 |
| Per-user token budgets + global circuit breaker | the `templateFallback()` already covers outages for one tenant |
| Web Push / `PushSubscription` table | Phase 1 channel work, not tenancy |

**Net.** The schema, `swap.ts`, `progression.ts`, `analytics.ts`, and the entire `triggers → voice → fallback` coach pipeline survive untouched in *shape* — they only gain a `userId` argument. The only true rewrites are the auth surface and the enforcement layer, the two places single-user assumptions are load-bearing. Non-negotiable exit criterion: **two real users, fully isolated, zero cross-tenant reads in audit, OTP login working end to end.**
