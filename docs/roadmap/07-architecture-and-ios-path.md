# 07 — Technical Architecture & the Path to Native iOS

> **Mandate check.** This document serves the product, not the other way around. The core app — log a lift, get the next move, see you got stronger — must be killer with the coach deleted. Every line below either ships that core, or unblocks the *one* viral hook (the coach). Nothing else earns server cycles. Default answer to new infrastructure: **no**.

---

## The Stack Call: PWA → Capacitor Shell

Not React Native. Not Swift. Not yet.

FORGE's value is **server-rendered**: Next.js App Router server components, server actions (`app/actions/*`), Prisma queries, and the coach pipeline all live on the server. A React Native or Swift rewrite throws away 100% of the UI and the server-action data flow to chase a "native feel" we don't yet need. The iOS-native *feel* the redesign demands — large titles, spring motion, haptics, bottom sheets — is already reachable in the browser: `framer-motion` (existing dependency) for spring physics, CSS `env(safe-area-inset-*)`, and Capacitor's Haptics plugin for the taptic engine.

**Ship the consumer redesign as a PWA. Then wrap the same web build in Capacitor for an App Store binary.** One codebase, one deploy, native shell only where it pays.

| Option | Verdict | Why |
|---|---|---|
| **PWA + Capacitor shell** | ✅ Ship this | Reuses server-rendered UI + server actions; native bridge only for HealthKit, APNs, haptics, biometric unlock |
| React Native / Expo | ⛔ Phase 4, only if forced | Discards UI + data flow; justified only if `WKWebView` jank measurably hurts retention |
| Swift native | ⛔ Off the table | Doubles surface area for a two-tab app whose logic is server-side |

Capacitor loads the **production web app by remote URL** (not bundled assets), so coach and content updates ship without an App Store review. Native plugins bridge the four things the web can't do on iOS: **HealthKit, APNs push, haptics, biometric session unlock.** Keep Next.js on Railway as the server.

---

## Multi-Tenancy: The Migration That Must Come Before User #2

The schema comment says "userId-ready." The reality, confirmed across **83 Prisma call sites in ~15 files**, is single-tenant to the bone:

- `UserSettings` and `CoachProfile` are literal singletons keyed `id: "default"` (`lib/settings.ts`, `lib/coach/profile.ts`).
- Auth is a passcode-derived SHA-256 cookie with **no user identity** (`lib/auth.ts`) — everyone who knows the passcode is the same person.
- `getCoachActivity()` queries `workoutSession` with no owner filter.
- The cron ticks exactly one profile.

This touches every query and the entire coach loop, so it goes **first**.

### Data model

Add a `User` model (`id`, `phone` unique, `appleSub` nullable, `createdAt`, `tz`). Add `userId` (FK, **indexed**) to every owned table:

| Owned (gets `userId`) | Global / shared (untouched) |
|---|---|
| `WorkoutSession`, `SetLog`, `BodyMetric` | Exercise library, programs, blocks |
| `UserSettings`, `CoachProfile`, `NudgeLog` | Days, slot templates |
| Custom `Exercise` rows (`isCustom = true`) | Catalog/reference data |

Library, programs, blocks, days, and slot templates **stay global** — they're catalog data, not user data — which sharply limits the blast radius. Collapse the two singletons: drop `id: "default"`, make `userId` the unique key, and rekey the lazy-create logic in `getSettings()` / `getCoachProfile()` off the session user instead of a constant.

### Auth

Replace the passcode gate with **phone-OTP** as the primary path and **Sign in with Apple** as the native fast-lane (App Store guideline 4.8 effectively requires it once any third-party login exists, and it doubles as clean identity for the Capacitor build). The coach already collects and verifies a phone number for SMS — **phone-as-identity reuses that**, so the SMS consent record and the login identity become the same entity. Use **Twilio Verify** for OTP (the account already exists). Issue a signed JWT (or DB-backed session) carrying `userId`; `middleware.ts` swaps `isValidToken` for a real session lookup but keeps its public-prefix allowlist for `/api/coach/*`.

### The enforcement layer is the real work

With 83 call sites, hand-adding `where: { userId }` to each is error-prone — **one miss is a cross-tenant data leak.** Two-part defense:

1. **`getCurrentUserId()`** resolved from the session in every server action and route, threaded through `lib/queries.ts`, `lib/analytics.ts`, `lib/coach/*`.
2. **Postgres Row-Level Security** as a backstop so a forgotten filter **fails closed** instead of leaking. Set `app.current_user_id` per transaction via a Prisma middleware/extension; define RLS policies on every owned table.

RLS is the seatbelt that makes the 83-site edit survivable.

---

## "Plugged Into All Your Data": Stage It, Don't Boil the Ocean

**v1 "all your data" = the data we already own** — logged sessions, streaks, the emotional *why*. That's the omniscience the coach needs for screenshot-worthy texts ("it's 7:14, you said legs") and it requires **zero new integrations**. Six-source wearable ingestion (Whoop/Oura/Garmin/Terra) is an **anti-feature**: it serves people who *already* train — the opposite of the beachhead. Hold it.

**Phase 2 — HealthKit, read-only, three signals only: steps, sleep, bodyweight.** HealthKit can't be reached from a PWA, which is exactly why it waits for the Capacitor build. Request *read* scopes for `stepCount`, `sleepAnalysis`, `bodyMass`; write **nothing** back in v1.

- Body-weight already has a home: the `BodyMetric` table.
- Steps and sleep land in a new `HealthSample` table (`userId`, `type`, `value`, `unit`, `start`, `end`, `source`).
- These feed the coach's `NudgeFacts`, **not new dashboards.** "You walked 1,800 steps yesterday and skipped legs" is omniscience; a steps chart is the instrument clutter the mandate cuts.
- Use HealthKit **background delivery** to sync deltas, not full history.
- Manual bodyweight entry stays as the universal fallback so the web app is never crippled. Android/Health Connect mirrors this later on the same `HealthSample` schema.

---

## The Grok Coach Pipeline at Scale + Cost Control

The pipeline's *shape* is sound; only its *execution* is single-tenant. `runCoachTick()` (`lib/coach/nudge.ts`) is already a clean deterministic gate: pure rules in `evaluateTrigger()` (`triggers.ts`) decide **when**, and Grok only decides **how it sounds** (`voice.ts`). It already carries the right cost guards — `aiConfigured()` check, a 20s `AbortController` timeout, `max_tokens`, and a full `templateFallback()` so an outage or spike never breaks the product. **Preserve all of this.**

What breaks at N users is **orchestration**:

- **The in-process scheduler (`instrumentation.ts`) ticks one global profile every 30 min.** It can't fan out and dies on every redeploy. Replace with a durable queue: a cron (Railway Cron or `pg-boss` to avoid new infra) enqueues "evaluate user X" jobs for users whose local hour and cadence make them *candidates*; workers run `runCoachTick({ userId })`. Cooldown/dedup (`COOLDOWN_MS`, the `nudgeLog` dupe check) already exists per-profile — it just needs the `userId` filter.
- **Don't call Grok for every candidate.** The gate already returns `no_trigger` *before* the LLM for most ticks — keep that ordering religiously so tokens are spent only when a nudge will actually send. Add per-user daily/monthly token budgets and a **global circuit breaker** that flips the whole fleet to `templateFallback` if xAI latency or spend crosses a threshold.
- **Cache the prefix.** Persona system prompts (`buildSystemPrompt`) are static per persona × intensity. The large `GLOBAL_RULES` + persona block is a perfect cached prefix; only per-user `buildUserMessage` varies.
- **Make the Grok call async to the request.** `generateReply()` runs **inline in the Twilio webhook** (`app/api/coach/sms/route.ts`); at scale a slow xAI call risks the webhook timeout. Move reply generation to the queue and send via Twilio's REST API (already in `sms.ts`) instead of TwiML so the webhook returns instantly.
- **Pin the model.** `XAI_MODEL` defaults to `grok-4`; keep it env-pinned with a documented fallback so a deprecation doesn't silently change voice or cost.

---

## Push, Scheduling, Observability

**Push is the primary savage channel** — no carrier gatekeeper, no 10DLC wait. Web Push (VAPID) works in installed PWAs including iOS 16.4+ Safari, so notifications land *before* the native shell. The Capacitor build upgrades to **APNs** for reliable background delivery and rich notifications. Add a `PushSubscription` / `DeviceToken` table per user, and route nudge output through a channel resolver — **push first, SMS as premium re-engagement** behind 10DLC. The existing `channelOf()` logic generalizes cleanly.

**Scheduling** moves from in-process `setInterval` to durable cron + queue. This also fixes a latent bug: the in-process scheduler loses its timer on every deploy, so nudges silently pause — fine for a demo, unacceptable for a product.

**Observability** today is `console.log` + a `/api/health` route. It needs:

- Structured logging with `userId` / `trigger` / `source` on every nudge.
- Error tracking (Sentry) around the Grok and Twilio calls.
- A **coach-economics dashboard**: nudges sent, AI-vs-template ratio, tokens/$ per user, SMS delivery rate, STOP rate. `NudgeLog` already records `source`, `status`, `twilioSid`, `meta` — that's the analytics spine; just aggregate it.

---

## Privacy & Compliance

- **Health data:** read-only HealthKit, explicit per-type consent, encrypted at rest, never sold, never used for ads. Apple **forbids** HealthKit data in iCloud or for advertising. Ship a clear privacy policy and a data-deletion path (App Store requirements). Keep health data out of LLM prompts beyond the minimal derived facts the coach needs.
- **App Store + the savage voice:** the profane persona is the review risk. Survival rests on the **already-implemented safety floor** in `GLOBAL_RULES` (no slurs / protected-class attacks, nothing sexual, no self-harm, backs off on injury) plus **gentle by default, savage opt-in and age-gated (17+)** with a clear in-app explanation that the user chose this tone. The "send coach after your friend" idea stays **killed** — coach only ever texts the consenting user.
- **SMS / TCPA + 10DLC:** the code already does this right — `smsConsent` / `smsConsentAt`, `smsStopped`, STOP/START/HELP handling (`classifyInbound`), quiet hours, and Twilio signature validation. Complete **10DLC brand/campaign registration** before SMS volume scales; keep push as the default so SMS stays a low-volume premium channel and carrier reputation stays clean.

---

## Phased Migration — Reuse Aggressively

| Phase | What ships | Reuse |
|---|---|---|
| **0 — Tenancy + auth** *(before user #2)* | `User` model; `userId` through all 83 call sites; collapse the two singletons; Postgres RLS; passcode → phone-OTP + Sign in with Apple | Whole schema (+`userId`) |
| **1 — Consumer redesign (PWA)** | Two tabs (Today / You), guided-rep feature, Web Push (VAPID), `framer-motion` spring motion, iOS-native styling | `lib/swap.ts`, `lib/progression.ts`, `lib/analytics.ts` (Epley), **entire coach pipeline** |
| **2 — Coach at scale** | Queue + durable cron replace `instrumentation.ts`; async Grok; token budgets + circuit breaker; observability; 10DLC | Existing rules → LLM → fallback pipeline |
| **3 — Capacitor iOS shell** | Wrap the *same* web build; HealthKit (read-only steps/sleep/weight), APNs, haptics, biometric unlock; App Store submission | The entire PWA |
| **4 — Only if forced** | Selective React Native for any screen where `WKWebView` jank measurably hurts retention | **Default answer: no** |

**Net.** The schema, the swap/progression/analytics libraries, and the coach's rules → LLM → fallback pipeline all survive and get reused. The **two real rebuilds** are the consumer UI (which the mandate *wants* rebuilt from a blank canvas) and the orchestration layer (auth + multi-tenant queue) — exactly the two places single-user assumptions are load-bearing.

---

### Key files grounding this analysis

- `prisma/schema.prisma` — singletons, `userId`-absent owned tables
- `lib/auth.ts` — passcode-only, no identity
- `lib/settings.ts`, `lib/coach/profile.ts` — `id: "default"` singletons
- `lib/coach/nudge.ts`, `lib/coach/triggers.ts`, `lib/coach/voice.ts` — deterministic gate + Grok + template fallback
- `instrumentation.ts` — single-tenant in-process scheduler to replace
- `app/api/coach/sms/route.ts` — inline Grok call in webhook + TCPA handling
- `middleware.ts`, `app/manifest.webmanifest/route.ts` — PWA + auth gate
