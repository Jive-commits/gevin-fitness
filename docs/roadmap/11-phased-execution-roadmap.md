# Phased Execution Roadmap

*The single sequenced plan: Phases 0–4 with goals, scope, key bets, success metrics, the de-risked critical path, and what to build first. Every line is downstream of one fact: our user owns the gear, has the membership, and still can't string two weeks together — because nobody taught them to lift. We decide so they don't.*

The order is not negotiable: tenancy gates billing and the coach, the killer core proves retention, virality gets fuel only once the bucket holds. **Five features survive and must be flawless** — the pre-built Today, the guided rep, the two-tap auto-saved log, the legible week-1 strength signal, and the coach that quotes your why. Everything else is hidden behind **Lifter Mode** or deleted. If a thing on screen isn't serving one of the five, cut it.

---

## Phase 0 — Foundation: tenancy + real auth

**Goal.** Make the app multi-user, billable, and safe — cheapest now, a full rewrite later. "userId-ready" is a comment, not reality; the singletons are load-bearing in every query and the coach loop.

**Scope.**

- Add a `User` model; thread `userId` through all 83 Prisma call sites; collapse the `UserSettings` and `CoachProfile` singletons (`id: 'default'` in `lib/settings.ts`, `lib/coach/profile.ts`) to per-user rows.
- Keep library, programs, blocks, days, and slot templates **global/shared** — catalog data, not user data — which sharply limits blast radius.
- Replace the shared passcode (`lib/auth.ts`, no identity) with **phone-OTP** via Twilio Verify; phone-as-identity reuses the SMS consent record we already collect.
- Ship `userId` filters + a **cross-tenant integration test** as the ship-blocker; add Postgres RLS **in parallel** as the fail-closed seatbelt.
- Reposition in the same window: kill "A precision instrument for serious lifting," ship **"Stop starting over."**

**Cut here (priced honestly):** Sign in with Apple and the circuit-breaker/token-budget fleet controls — one tenant, and the template fallback already covers outages.

**Key bet.** "Retrofit later" is a fiction. The hard 80% is the singleton collapse — lazy-create races, partial-onboarding states, row migration — not threading `userId`. RLS makes a missed `where` fail closed instead of leaking.

**Success metrics.** Two real users, fully isolated. Zero cross-tenant reads in audit. Phone-OTP login works end to end.

---

## Phase 1 — The KILLER beginner core (the headline)

**Goal.** Make the naked loop world-class and prove first-session completion and the day-7 strength moment. Delete the coach — what remains must still earn the open. The entire design and content budget goes here.

**Scope.**

- Rebuild the logger from accordion-of-everything to **one move full-screen** — the guided rep: looping clip (compounds) or static diagram (isolation), target in plain language ("8 reps, a weight that's hard but doable"), one fat "Log this set," a breathing rest ring, next.
- Collapse six tabs to **two: Today and You.** The coach gets no tab; Program, Library, Calendar, Charts demote to contextual drilldowns.
- **Logging is confirmation, not data entry.** The engine pre-fills the floor; the user confirms in one tap and never sees an empty field.
- **Post-sensation calibration.** On the first set we ask *nothing* — pre-fill the floor, log on first tap, then ask "Too easy / Just right / Too hard" *after* they've felt the weight. The pre-set feeling-chip is deleted; it demanded a reference a beginner lacks. Bias toward **load increase on "Just right" for three weeks** — the failure mode is under-loading, and an empty-barbell stall reads as "this app doesn't work."
- **The legible week-1 signal.** Load-on-the-bar deltas — "+15 lb on squat since Monday" — by day 7. **Never e1RM**; too slow and abstract for someone who's lifted four days.
- 60-second onboarding that **ends inside a logged rep**; move the emotional-why intake to *after* the first session.
- Default the coach to gentle. Give the **core its own push** — "your session is ready" — so the loop self-propels without a coach text. Web Push (VAPID) works in installed PWAs on iOS 16.4+.

**The content long pole — start day 1.** `public/` holds one SVG, zero form media. v1 ships **10 real looping clips** for the compounds beginners fear (back squat, hinge/RDL, bench, overhead press, row, lat pulldown, leg press, three machine substitutes); isolation gets a static diagram. We never ship a mismatched stock JPEG as a "demo" — a wrong demo teaches the wrong lift.

**Reuse wholesale.** The Today page (`app/(app)/today/page.tsx`) already resolves a cursor into a pre-built session, pre-fills from last time, auto-saves, runs the rest ring, and pre-advances tomorrow — best-in-class for a beginner; the content on it was built for the founder. We wrap the dials, not rewrite the math (see *What to build first*).

**Key bets.** "Same engine, hide the dials" works for someone who can't hinge. Post-sensation calibration actually moves load on the bar for a true novice. The coach feels sharp on day 1 with only goal + schedule + today's logged fact.

**Success metrics.** First-session completion ≥55%. Day-7 strength moment fires for ≥50% of activated users. North-star (Weekly Logged Workouts per Active User) baseline set. Median squat load rises across weeks 1–3, not flat.

---

## Phase 2 — Viral artifact + durable scheduler

**Goal.** Turn the artifact into a repeatable distribution engine and harden the coach for fan-out. Personalization is the product, profanity the packaging.

**Scope.**

- Roast, weekly-recap, and streak-flex cards as branded share artifacts — offered **once, post-moment**, then gone. No share prompts inside the logging loop.
- Replace the in-process scheduler (`instrumentation.ts`, a `setInterval` on one global profile that dies on every deploy) with a **durable queue + cron** (pg-boss); per-user evaluation becomes a job.
- Make the Grok call **async to the Twilio webhook** — the inline 20s `setTimeout` abort in `voice.ts` will breach Twilio's webhook limit under load. Correctness, not optimization.
- **Deterministic output post-filter:** every body runs a denylist/regex *after* generation, *before* send; on hit → `templateFallback` + log. Today the safety floor is a temp-1.1 prompt request, not enforcement.
- **Vulnerability circuit-breaker in `triggers.ts`:** crisis/self-harm/ED lexicon or 2+ consecutive "I can't" replies → force-downgrade to gentle and surface 988, independent of the LLM.
- Per-user token budgets, global circuit breaker, observability (the `NudgeLog` table is the analytics spine), earned-savage unlock ladder.

**Key bet.** The *default, shippable* coach text must quote the user's own onboarding **every time**, not just at max intensity. "It's 7:14, you said legs, this is the wedding you cried about in onboarding" is a cult; "Get up, bitch" is a one-screenshot novelty. That single constraint separates a spike from a brand.

**Success metrics.** Organic shares per active user ≥0.30. ≥25% of activated users hit North-star (3+ logged/wk, held 4 weeks). Zero floor-violations across an adversarial send corpus before savage unlocks to anyone.

---

## Phase 3 — Native iOS shell + monetization

**Goal.** Widen the funnel with an App Store presence and turn on revenue without breaking the day-1 promise.

**Scope.**

- **Capacitor shell** wrapping the *same* web build via remote URL — content ships without App Store review. WKWebView is good enough; native is for entitlements, not the UI.
- Native plugins for what the web can't reach: HealthKit (read-only steps/sleep/weight, feeding the **coach's facts, not dashboards**), APNs, haptics, biometric unlock.
- Add Sign in with Apple. Complete 10DLC; ship **SMS as the premium re-engagement channel** — push stays default so carrier reputation stays clean.
- **Ship savage *locked.*** Default Mentor; savage unlocks post-install behind a one-time "explicit, profane, tap to confirm" interstitial, 17+. Reviewers see a gentle app.
- Stripe + the behavioral, in-character paywall — one tier, **$9.99/mo, $59.99/yr.** The guided rep and in-app savage coach are free; paid is delivery reach when you've ghosted, two-way SMS, full personalization, Lifter Mode. The paywall **monetizes the win, not the wound:** the return is always celebrated gently; the annual-first offer fires at a logged PR, never on the ghost.

**Key bet.** Charging *increases* retention — the paid SMS consequence is also the strongest re-engagement lever.

**Success metrics.** App Store approval with the savage persona intact. Free→paid 3–6%. ~85% gross margin held. Annual mix climbing.

---

## Phase 4 — Scale (only once the bucket provably holds)

**Goal.** Pour fuel only after the keeper-cohort retention curve flattens. Virality fills the bucket for free; money goes in last.

**Scope.** Scale paid amplification of top organic; self-serve creator kit; win-back flows; paywall-copy A/B as a brand asset. Health Connect (Android) reusing the `HealthSample` schema. Selective React Native **only** where measured WKWebView jank hurts retention. Default answer: no.

**Success metrics.** North-star ≥35% of activated and defensible. Plausible $75–150k MRR. CAC paid back inside keeper LTV.

---

## The de-risked critical path

Two items gate ship and **can't be compressed by adding engineers** — they are calendar time:

1. **Real form content** (10 compound clips) — a net-new film/license project. Start commissioning on day 1 of Phase 1.
2. **App Store review** — budget **2–3 rejection cycles** as a named schedule risk, not a mitigated checkbox.

Everything else sequences around those two poles.

```
Phase 0 ──► Phase 1 ──────► Phase 2 ──► Phase 3 ──► Phase 4
tenancy     killer core      viral +     native +    scale
+ auth      (clips start     scheduler   $ (review   (only if
            here, day 1)     hardening   cycles)     proven)
```

| Phase | Rough timeline | The one thing that must be true to exit |
|-------|----------------|------------------------------------------|
| 0 | 3–4 weeks | Two users, zero cross-tenant reads, OTP login works |
| 1 | ~8 weeks | First-session ≥55%, day-7 signal ≥50%, load rises wks 1–3 |
| 2 | ~4–6 weeks | Default text quotes the why; zero floor-violations |
| 3 | ~6–8 weeks | App Store approval, savage intact, free→paid ≥3% |
| 4 | ongoing | Keeper curve flat above ~25% before paid spend |

---

## What to build first, from the code we already have

We are not starting from zero; the discipline is refusing to fall in love with the instrument we already built.

**Reused unchanged:** the Prisma schema (+`userId`), the swap engine (`lib/swap.ts`), progression math (`lib/progression.ts`), analytics (`lib/analytics.ts`), and the **entire coach pipeline** (`triggers.ts` → `voice.ts` → template fallback). That shape is already correct; it's why we ship where competitors get rejected.

**The two real rebuilds** — the two places single-user assumptions are load-bearing:

1. **Orchestration:** auth + multi-tenancy (Phase 0) and the durable queue replacing `instrumentation.ts` (Phase 2).
2. **The consumer UI:** blank-canvas rebuild (Phase 1) — two tabs, one move full-screen, one primary action per screen, ember on one element, the instrument behind Lifter Mode.

**Order of first commits:** `User` model and `userId` migration → singleton collapse → OTP swap-out → cross-tenant test (Phase 0 ships). Then, engine intact beneath it, the guided-rep rebuild and post-sensation calibration on top of the existing pre-built Today.

---

We built an excellent lifter's instrument. The work isn't polishing it — it's hiding it, wrapping a beginner-proof loop around its engine, and shipping the one moment that makes a scared first-timer feel strong by Friday. The default answer to any new feature is no.
