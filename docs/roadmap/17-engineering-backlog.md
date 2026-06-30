# Engineering Backlog — Phases 0–2

*Build-ready execution backlog. Every epic is broken into pull-on-day-one stories with real file paths, effort (S ≤ ½ day, M ≈ 1–2 days, L ≈ 3–5 days), dependencies, and acceptance criteria. Grounded in the live codebase, not the wishlist. Honors the mandate: tenancy first, killer naked loop second, viral + hardened coach third; 6 tabs → 2 with Lifter Mode; justify-or-cut every pixel.*

> Reading order is the build order. The singletons (`id: "default"` in `lib/settings.ts`, `lib/coach/profile.ts`, and 4 write sites) and the passcode gate (`lib/auth.ts`) are load-bearing in ~80 call sites — they block everything. Then the engine stays; only the consumer UI and the orchestration get rewritten.

---

## EPIC 0A — Account model + phone-OTP auth

Replace the shared-passcode gate (`lib/auth.ts` derives a token from `APP_PASSCODE`; `middleware.ts` only calls `isValidToken`) with phone-as-identity, reusing the SMS-consent record we already collect.

| # | Task | Files | Eff | Deps | Acceptance |
|---|---|---|---|---|---|
| 0A.1 | Add `User` + `AuthSession` models (nullable `userId` FKs elsewhere) | `prisma/schema.prisma` | M | — | `prisma migrate` applies clean; app still boots single-user |
| 0A.2 | Twilio Verify OTP routes | new `app/api/auth/otp/start/route.ts`, `app/api/auth/otp/check/route.ts`; replace `app/api/auth/login/route.ts` | M | 0A.1 | new phone receives SMS code; `check` `upsert`s `User` by phone, creates `AuthSession`, sets cookie to its id |
| 0A.3 | New auth surface; delete passcode | `lib/auth.ts` (delete `expectedToken`/`isValidToken`; add `getSessionUserId()`, `requireUserId()`) | M | 0A.2 | `requireUserId()` resolves cookie → `AuthSession` → `userId`, redirects if null |
| 0A.4 | Edge-safe middleware | `middleware.ts` (keep `PUBLIC_PREFIXES`; swap token check for a `jose`-verified short-lived JWT) | M | 0A.3 | unauth → `/login`; Prisma never runs on Edge; DB-backed `AuthSession` is authoritative server-side |
| 0A.5 | Logout revokes session | `app/api/auth/logout/route.ts` | S | 0A.3 | deletes `AuthSession`, clears cookie; subsequent request redirects |
| 0A.6 | Reposition copy: kill "precision instrument," ship "Stop starting over." | `app/(app)/settings/page.tsx`, login + manifest | S | — | no "precision instrument for serious lifting" string remains |

**Cut here (priced):** Sign in with Apple (column added in 0A.1, flow ships Phase 3) and fleet circuit-breakers (one tenant; template fallback covers outages).

---

## EPIC 0B — Singleton collapse + `userId` threading (~80 sites)

The hard 80% is not threading `userId` — it's collapsing the two `id:"default"` singletons without lazy-create races and without a forgotten `where`.

**Owned vs. global** (limits blast radius — library/programs/blocks/days/slots stay global catalog):

```
add userId + FK + @@index:  WorkoutSession, BodyMetric, SetLog (denormalized)
@unique userId (drop id "default"):  UserSettings, CoachProfile
userId String? (set only when isCustom):  Exercise
untouched global:  Program, Block, Day, SlotExercise, NudgeLog (scoped via profileId)
```

- [ ] **0B.1 — Schema: add nullable `userId` + collapse singleton ids (M).** `prisma/schema.prisma`. `SetLog.userId` is denormalized on purpose — `lib/analytics.ts` queries `setLog` directly ~10× (`getTotals`, `getRecentPRs`, `getWeeklyVolumeByMuscle`, `getDailyActivity`…), so a flat `where:{ userId }` beats a join. Dep: 0A.1. *Accept:* migration applies nullable.
- [ ] **0B.2 — Race-safe lazy-create upserts (M).** `lib/settings.ts` `getSettings(userId)` and `lib/coach/profile.ts` `getCoachProfile(userId)` → `prisma.upsert({ where:{ userId }, update:{}, create:{ userId, … } })`. `@unique userId` makes the loser of a race hit the constraint and re-read. Dep: 0B.1. *Accept:* 50 concurrent first-requests create exactly one row.
- [ ] **0B.3 — Thread `userId` through read models (L).** Every `lib/queries.ts` / `lib/analytics.ts` / `lib/coach/*` export takes `userId` as its **first param**. `getAllExercises` must filter `OR:[{ isCustom:false }, { userId }]`. Dep: 0B.1–2. *Accept:* `tsc` flags every unthreaded caller (lean on the compiler).
- [ ] **0B.4 — Thread `userId` through server actions (L).** Each `app/actions/*` calls `const userId = await requireUserId()` at the top. Kill the literal `id:'default'` at `session.ts:184` (`advanceSchedule`), `settings.ts:27/39/50`, `coach.ts:43/69/96`. Dep: 0A.3, 0B.3. *Accept:* zero `'default'` literals remain; actions set `userId` on every create.
- [ ] **0B.5 — Coach scoping (M).** `nudge.ts` `runCoachTick({ userId })`; `app/api/coach/sms/route.ts` resolves sender `From` phone → `User` → `userId`; cron stays single-tenant (fan-out is Phase 2). Dep: 0B.3. *Accept:* inbound SMS routes to the right user's profile.

---

## EPIC 0C — RLS backstop + data migration + ship gate

- [ ] **0C.1 — Backfill migration for the founder (M).** SQL migration: create `User` from existing `CoachProfile.phoneNumber`; `UPDATE` every `WorkoutSession`/`SetLog`/`BodyMetric`/custom `Exercise`/`UserSettings`/`CoachProfile` to `userId='founder'`. Dep: 0B.1. *Accept:* founder still sees all history.
- [ ] **0C.2 — `NOT NULL` + FK + indexes (S).** Third migration, only after backfill. Dep: 0C.1. *Accept:* no orphan rows; FKs enforced.
- [ ] **0C.3 — Postgres RLS + restricted role + GUC extension (L).** `lib/prisma.ts` `$extends` sets `app.current_user_id` per-transaction from an `AsyncLocalStorage` store written by `requireUserId()`; `CREATE POLICY tenant_isolation` on every owned table. Connect runtime as a **non-`BYPASSRLS`** role. Dep: 0C.2. *Accept:* with the GUC unset, owned-table queries return 0 rows (fail-closed proven).
- [ ] **0C.4 — Cross-tenant integration test (THE SHIP-BLOCKER) (M).** Vitest + throwaway Postgres in CI: user B sees zero of user A's sessions/PRs; a `findMany()` with **no** `where` under B's GUC returns 0 (RLS isolates, not the app); collapsed singletons no longer share `why`. Dep: 0C.3. *Accept:* green in CI; **gates the entire Phase 0 ship.**

---

## EPIC 1A — 6 tabs → 2 (Today / You) + Lifter Mode

`components/nav/bottom-nav.tsx` hardcodes 6 tabs (Home, Today, Program, Library, Progress, Settings). Collapse to **Today** and **You**; the coach gets no tab; Program/Library/Progress/History demote to contextual drilldowns or behind Lifter Mode.

| # | Task | Files | Eff | Deps | Acceptance |
|---|---|---|---|---|---|
| 1A.1 | Rewrite nav to 2 tabs | `components/nav/bottom-nav.tsx` (`grid-cols-6` → `grid-cols-2`) | S | — | only Today + You render; ember underline on active only |
| 1A.2 | Build the **You** hub | new `app/(app)/you/page.tsx`; fold in streak + last-3 + one strength chip | M | 1A.1, 1D.2 | one strength proof chip, no multi-curve chart by default |
| 1A.3 | `lifterMode` flag + toggle | add `lifterMode Boolean @default(false)` to `UserSettings`; toggle in You; `app/actions/settings.ts` | S | 0B.4 | toggle persists per-user |
| 1A.4 | Lifter Mode re-exposes density | `app/(app)/today/page.tsx` renders `TodayLogger` (full accordion) when `lifterMode`, else `GuidedRep`; Program/Library/Progress/History reachable only when on | M | 1A.3, 1B.1 | default user never reaches `/program` `/library` `/progress` `/history` as tabs; Lifter Mode restores all of them; **nothing deleted** |

**Cut/hidden, not deleted:** Program/blocks, Library, Progress charts, History calendar, custom/freestyle, bodyweight, RPE steppers, e1RM rows — all live behind Lifter Mode.

---

## EPIC 1B — The guided rep (full-screen, one move at a time)

`components/logger/today-logger.tsx` renders ALL slots as an accordion of `ExerciseCard`s. Keep it behind Lifter Mode; build a new default surface beside it that reuses the existing write path.

- [ ] **1B.1 — `GuidedRep` component + state machine (L).** new `components/logger/guided-rep.tsx`. `DEMO → LOGGING(saveSet) → CALIBRATE(set 1 only) → REST(ring) → next`. **Reuse wholesale** from `today-logger.tsx`: `ensureId` lazy-create + ref guard (lines 92–102), the 650 ms debounced/immediate `persist` split (136–154), `useRestTimer()`, the PR haptic (`navigator.vibrate(30)`, 172–176). Auto-save is sacred — do not touch it. Dep: 0B.4. *Accept:* one move on screen; tab bar hides except `summary`.
- [ ] **1B.2 — `ExerciseAnimation` (M).** new `components/logger/exercise-animation.tsx`: looping `<video loop muted playsinline>` for compounds, static `<img>` diagram for isolation, via the new resolver (1E.1). Dep: 1E.1. *Accept:* compound → clip, isolation → diagram, unknown → name+cue only.
- [ ] **1B.3 — Plain-language target (S).** new `lib/rep-language.ts` `formatTarget(repScheme, sets, setIndex)` turns `3 × 8-10 @ RPE 7-8` into "Set 2 of 3 — aim for 8 reps, a weight that's hard but doable." **Never renders RPE.** Dep: — . *Accept:* no RPE/superset/set-pill strings reach the default card.
- [ ] **1B.4 — One fat "Log set" + quiet edit (M).** weight/reps baked in (1C.1); below it a small "Off target? Edit" reveals two inline `Stepper`s for the rare miss. Long-press demo → existing `SwapDrawer` (one alternative). Dep: 1B.1, 1C.1. *Accept:* default path is one tap; no Apply banner, no swap matrix as a destination.
- [ ] **1B.5 — Port the finish summary (M).** port `SummarySheet` (`today-logger.tsx` lines 418–458) into `GuidedRep`'s `summary` state; replace the e1RM-PR headline with the `StrengthSignal` sentence (1D.1); keep Volume/Sets/Time tiles. Dep: 1B.1, 1D.1. *Accept:* summary shows "You got stronger" + one sentence, never an e1RM number.

---

## EPIC 1C — One-tap weight + post-sensation calibration

The engine already emits the one-tap default (`computeHint` in `lib/progression.ts`; `acceptHint` in `exercise-card.tsx`). The blocker: `computeHint`'s `range` branch gates on RPE (`easyEnough = target==null || rpe==null || rpe <= target`) — a beginner has none. Add a sibling; do not rewrite.

- [ ] **1C.1 — Beginner progression + starting floor (M).** new `computeBeginnerTarget(prev, repScheme, incrementKg, units)` in `lib/progression.ts` (double-progression, RPE never read); new `lib/starting-load.ts` `startingFloorKg(ex, bodyweightKg, experience)` (deliberately LOW coefficients per `movementPattern`; bias to under-load — a light bar is one-set recoverable, a heavy rep-one is a safety event). Add `experience String?` to per-user settings. Dep: 0B.1. *Accept:* working sets pre-fill a non-null weight at first tap, 100% of the time.
- [ ] **1C.2 — Post-sensation calibration (M).** new `lib/calibration.ts`: `Sensation = too_easy|just_right|too_hard` → RPE `6|8|9.5`; `applySensation(currentKg, s, incrementKg)`. Renders **after** set 1's `saveSet`, **once per slot**. Writes the mapped RPE onto the just-logged set via the existing `saveSet` (`app/actions/session.ts` — `rpe` already persists) — zero new write path, corpus intact for Lifter Mode/coach. **Cut the pre-set feeling-chip.** Dep: 1B.1, 1C.1. *Accept:* chips render only post-`saveSet`, set 1 only.
- [ ] **1C.3 — Weeks-1–3 load-increase bias (S).** "Just right" still nudges next session's floor up one increment for ~3 weeks before settling into pure double-progression (the dominant novice failure is chronic under-loading → a flat day-7 line). Dep: 1C.1–2. *Accept:* synthetic novice on "just right" sees median load rise week-over-week, not flat.

---

## EPIC 1D — Legible day-7 strength signal (load on the bar, NOT e1RM)

`lib/analytics.ts` computes session-best Epley e1RM with a regression slope — abstract and slow, and its own `isLowConfidence(reps>12)` flag proves it's noisy on light novice loads. Demote e1RM to Lifter Mode; build a legible signal. No migration — every byte is already in `SetLog`.

- [ ] **1D.1 — `getStrengthSignal(userId)` (M).** new export in `lib/analytics.ts` alongside the e1RM functions (which stay). Escalating, top-most wins: `adapted` (set 3 beat set 1 on load or reps — fires day 1), `beat_last` (top set beats prior session — ~day 3-4), `week_delta` ("+15 lb on squat since Monday" — ~day 7, in the user's units). Dep: 0B.3. *Accept:* `adapted` fires for a 3-ascending-set synthetic novice; `week_delta` non-null given two sessions a week apart with any increase.
- [ ] **1D.2 — Surface it (M).** finish summary (1B.5) + one read-only proof chip on **You** (auto-selecting the most-improved lift; no picker, no chart). Dep: 1D.1, 1A.2. *Accept:* headline is load-on-the-bar text, never an e1RM number.
- [ ] **1D.3 — Core-owned "your session is ready" push (L).** Add `PushSubscription` model, `public/sw.js`, `public/manifest.webmanifest`; VAPID Web Push. `week_delta` fires "+15 lb on squat this week. Legs today, 38 min, already set up." The core's own return trigger — survives the coach's deletion. Dep: 1D.1, 0A.4. *Accept:* installed PWA (iOS 16.4+) receives the day-7 push without any coach enabled.

---

## EPIC 1E — Commission 10 compound form clips (the calendar-time long pole)

`public/` holds **only `icon.svg`** (verified). `lib/exercise-media.ts` is a 2-frame JPG alternation from `free-exercise-db`, *visibly wrong* on many lifts (`nordic-curl`→barbell curl, `banded-pushup`→clock push-up, `hip-abduction`→hip thrust, `barbell-row`→dumbbell incline row). A wrong demo teaches the wrong lift — start day 1; cannot be compressed by adding engineers.

- [ ] **1E.1 — New media resolver (S).** rewrite `lib/exercise-media.ts`: `mediaFor(slug)` → `{kind:'clip', url:'/media/clips/<slug>.mp4'}` for the 10 compounds, `{kind:'diagram', url:'/media/diagrams/<slug>.svg'}` otherwise, `null` → name+cue only. Dep: — . *Accept:* no `raw.githubusercontent` JPG URLs remain on the default surface.
- [ ] **1E.2 — Film/license 10 clips (L, calendar-time, parallel).** Commission 3–5s silent vertical 1080×1350 loops for: `back-squat`, `romanian-deadlift`, `barbell-bench-press`, `overhead-press`, `barbell-row`, `lat-pulldown`, `leg-press`, `goblet-squat`, `machine-chest-press`, `machine-shoulder-press`. Deliver to `public/media/clips/`. Dep: 1E.1 (contract). *Accept:* all 10 show the correct lift; isolation falls back to a clean diagram, never a mismatched JPG.

---

## EPIC 2A — Durable coach scheduler

`instrumentation.ts` is a `setInterval` on `globalThis` that ticks **one** profile and dies on every deploy; `runCoachTick()` evaluates a single tenant.

| # | Task | Files | Eff | Deps | Acceptance |
|---|---|---|---|---|---|
| 2A.1 | Stand up pg-boss durable queue | new `lib/coach/queue.ts`; `lib/prisma.ts` connection reuse | M | Phase 0 | jobs survive a deploy/restart |
| 2A.2 | Per-user enqueue cron | rewrite `app/api/coach/cron/route.ts` to enqueue one job per enabled `User`; delete the `setInterval` in `instrumentation.ts` | M | 2A.1, 0B.5 | N users each evaluated once per cadence; no global singleton tick |
| 2A.3 | Async Grok off the Twilio webhook | `lib/coach/voice.ts` (the inline 20s `setTimeout` abort in `grokChat` breaches Twilio's webhook limit under load); `app/api/coach/sms/route.ts` acks fast, replies via queue | M | 2A.1 | inbound SMS webhook returns < 2s; reply delivered async |

---

## EPIC 2B — Deterministic coach safety (post-filter + circuit-breaker)

Today the only safety floor is **LLM-instructed text** — the `HARD LIMITS` paragraph in `GLOBAL_RULES` (`lib/coach/voice.ts`) at temp 1.1. That is a request, not enforcement.

- [ ] **2B.1 — Deterministic output post-filter (M).** new `lib/coach/safety.ts` `screen(body): {ok, reason?}` — denylist/regex for slurs, sexual content, violence threats, self-harm/ED/medical. Run it in `generateNudgeBody` and `generateReply` (`lib/coach/voice.ts`) *after* generation, *before* send; on hit → `templateFallback()` + log to `NudgeLog.meta`. Dep: Phase 0. *Accept:* zero floor-violations across an adversarial send corpus; every hit logged.
- [ ] **2B.2 — Vulnerability circuit-breaker (M).** new logic in `lib/coach/triggers.ts`: a crisis/self-harm/ED lexicon hit on inbound, or 2+ consecutive "I can't" replies → force-downgrade persona to gentle (`mentor`) and surface 988, **independent of the LLM**. Wire into `app/api/coach/sms/route.ts`. Dep: 2B.1. *Accept:* a crisis-lexicon inbound never gets a savage reply; 988 surfaces deterministically.
- [ ] **2B.3 — Earned-savage unlock gate (S).** savage persona refuses to send until 2B.1 reports zero violations on the corpus; gate in `app/actions/coach.ts` `saveCoachConfig`. Dep: 2B.1. *Accept:* savage cannot be selected before the corpus passes.

---

## EPIC 2C — Shareable artifacts (roast / recap / streak-flex)

The viral unit is the screenshot the user **chooses** to post — offered **once, post-moment**, never inside the logging loop.

- [ ] **2C.1 — Share-card render route (M).** new `app/api/share/[kind]/route.tsx` using `next/og` (`ImageResponse`); kinds: `roast` (latest savage `NudgeLog.body` quoting the user's why), `recap` (week from `getWeeklyVolumeByMuscle` / `getConsistency`), `streak` (`getCoachActivity.dailyStreak`). Branded, vertical. Dep: Phase 1, 0B.3. *Accept:* each kind renders a correct, branded PNG for a real user.
- [ ] **2C.2 — Post-moment share offer (M).** offer card after a logged PR / week-recap / streak milestone in `GuidedRep` summary + You — once, then gone; Web Share API. **No share prompt inside the loop.** Dep: 2C.1, 1B.5. *Accept:* offered exactly once per moment; absent from the rep loop.

---

## Suggested sprint sequence

| Sprint | Epics | Exit |
|---|---|---|
| **S1** | 0A.1–0A.5, 0B.1–0B.2 | OTP login works; singletons collapse race-safe |
| **S2** | 0B.3–0B.5, 0C.1–0C.2; **1E.2 film starts** | `userId` threaded; founder backfilled |
| **S3** | 0C.3–0C.4 (ship gate), 0A.6 | **Phase 0 ships:** two users isolated, cross-tenant test green |
| **S4** | 1E.1, 1B.1–1B.3, 1C.1 | guided-rep skeleton renders; one-tap floor pre-fills |
| **S5** | 1C.2–1C.3, 1B.4, 1D.1 | post-sensation calibration; strength signal computes |
| **S6** | 1A.1–1A.4, 1B.5, 1D.2 | 2 tabs + Lifter Mode; "you got stronger" in summary + You |
| **S7** | 1D.3, **1E.2 clips land** | core-owned push; 10 correct clips wired; **Phase 1 gate** |
| **S8** | 2A.1–2A.3 | durable scheduler; async Grok; webhook < 2s |
| **S9** | 2B.1–2B.3 | deterministic floor + crisis breaker; zero corpus violations |
| **S10** | 2C.1–2C.2 | share cards offered once post-moment |

### Critical path

```
0A.1 ─► 0A.2/3 ─► 0B.1 ─► 0B.2 ─► 0B.3 ─► 0B.4 ─► 0C.1 ─► 0C.2 ─► 0C.3 ─► 0C.4 (SHIP GATE)
                                                                              │
1E.2 (film — START DAY 1, runs in parallel, ~6 wks) ──────────────────────────┤
                                                                              ▼
                                              1E.1 ─► 1B.1 ─► 1C.1 ─► 1C.2 ─► 1B.5 ─► 1D.1 ─► 1D.2 (Phase 1 gate)
                                                                              ▼
                                                            2A.1 ─► 2A.2/2A.3 ─► 2B.1 ─► 2B.2 ─► 2C.1 ─► 2C.2
```

**Two items are calendar time, not headcount:** the **10 compound clips** (1E.2 — start filming day 1 of Phase 1, before any UI is ready for them) and the **0C.4 cross-tenant test** as the non-negotiable Phase-0 ship gate. Everything else sequences around those two poles. The engine (`swap.ts`, `progression.ts`, `analytics.ts`, the `triggers → voice → fallback` pipeline) survives untouched in shape — it only gains a `userId` argument and a deterministic safety post-filter.
