# FORGE — Vision & Positioning

> **First-principles mandate:** This is a blank canvas. The current app is a dense, clunky power-user instrument; we do not anchor on it. The AI coach is a marketing hook, not a retention engine. Every element on screen must earn its place or get cut. The default answer to any new feature is **no**.

---

## 1. The one-line positioning

**FORGE is the fitness app that answers "what do I do right now?" with zero thinking — and a coach that comes for you when you don't.**

Public tagline: **"Stop starting over."** It names the pain, not a feature. We are killing the old line — *"A precision instrument for serious lifting"* — because it anchors on exactly the power-user identity we are walking away from.

---

## 2. Who this is for (and who it is not)

The beachhead is **one person**: the 22–32 year-old who has restarted four times. They own the gear, hold the membership, watch the content — and still can't string two weeks together. High intent, high shame, high churn, chronically online.

The single fact that reshapes the entire product: **they do not actually know how to lift.** Every decision below is downstream of that.

| We build for | We explicitly do **not** build for |
|---|---|
| The four-times-restarter who feels lost and unsafe | The lifter who already knows their program |
| Someone who needs the decision made *for* them | Someone who wants to author their own template |
| Someone who needs to *feel* competent in week 1 | Someone optimizing e1RM curves and periodization |

Their job-to-be-done is **not** "teach me a deadlift library." It is: *"Get me to show up today, walk me through it so I don't feel lost or unsafe, and let me see I'm getting stronger."*

---

## 3. The wedge & the insight

The market is drowning in **information**. Strong and Hevy are spreadsheets with a skin; Fitbod auto-generates but assumes gym fluency and floods you with RPE; Fitness+ is follow-along cardio; Ladder is content you consume. None sell the missing layer.

**The wedge is consequence.** FORGE is the first fitness app where *not showing up costs you something* — a coach that knows your data and texts you like it has stakes in your life. We don't sell knowing. We sell the bridge between **knowing and doing**.

The core insight, stated as a product law:

> **Logging is confirmation, not data entry.** The engine proposes; the user confirms in one tap. The beginner never faces an empty field, never picks a weight cold, never judges effort before they've felt it.

This is why a blank-canvas redesign is mandatory. The instrument exposes every dial. The killer app hides all of them and surfaces exactly **one decision at a time**.

---

## 4. The viral mechanic (the hook, not the home)

Virality is the **artifact the user chooses to post** — a screenshot of a text so specific and so *earned* that they share it themselves. The unit is **organic content volume per active user**, never invites sent. We will never build a "send Coach after your friend" referral loop — it's a harassment vector and an App Store rejection.

The decisive constraint, from the team's sharpest critique:

> **Personalization is the product; profanity is the packaging.** "Get up, bitch" is a meme that dies in one screenshot. *"It's 7:14, you said legs, this is the wedding you cried about in onboarding"* is a cult.

The coach is the **trailer**. It drives the install spike. It is not the reason anyone stays. If we deleted the coach entirely, FORGE must still earn the open. That bar is the whole strategy.

---

## 5. Why now

| Force | Why it favors FORGE now |
|---|---|
| **LLMs are cheap, fast, and personal** | A deterministic gate decides *when* to fire; the model only decides *how it sounds*. An engaged user costs under ~$0.30/mo in LLM, capped by the gate and a $0 template fallback. Two years ago this voice was unaffordable; today it's a rounding error. |
| **Push beats the carrier gatekeeper** | Web Push (VAPID) and APNs let the "consequence" land for free. SMS becomes a *premium* re-engagement layer, not a launch blocker. |
| **The market over-indexed on tracking** | Every incumbent solved logging for people who already train. The unsolved job — *get the non-exerciser to show up and feel safe* — is wide open. |
| **PWA + Capacitor collapses the build** | One server-rendered web build wraps into an App Store binary. No React Native rewrite before PMF. Content ships without review. |
| **Shame moved online** | Our user is chronically online and shares everything. The earned-savage screenshot is native to how they already behave. |

---

## 6. North-star & input metrics

**North-star: Weekly Logged Workouts per Active User** — target **3+, held 4 weeks.** Completed sessions are the only thing that both produces real results and predicts retention. We do not say "daily open"; a 3×/week program is structurally a 3×/week loop.

The inputs that move it, in priority order:

1. **First-session completion rate** — did onboarding earn an actual rep? *(Target ≥55%.)* Onboarding that ends *inside* a logged set, not a settings form.
2. **Week-1 visible-progress moment** — did a legible "you got stronger" signal fire by day 7? *(Target: fires for ≥50% of activated users.)* This is **load-on-the-bar deltas** ("+15 lb on squat since Monday"), never estimated 1RM, which is abstract, noisy on light loads, and slow.
3. **Organic shares per active user** — the viral coefficient of the artifact. *(Target ≥0.30.)*

The keeper test that gates everything: **does the D90 retention curve flatten above ~25%?** First-session completion is the leading signal; the curve is the proof. We do not buy MRR against a leaky bucket.

---

## 7. The retention thesis (the real moat sits downstream of this)

A non-exerciser churns because every other app makes them **decide** — what workout, what weight, am I doing this right, did it even count — and those decisions are where shame and abandonment live.

FORGE removes every decision. The **naked loop**:

```
open → today's session is already built → one tap →
walked rep-by-rep → one honest number moves → tomorrow is pre-decided
```

The reward for opening is **competence you can feel in week one.** The loop is self-reinforcing: finishing today loads tomorrow. Five features carry this — and only these five must be flawless:

1. **The pre-built Today** — session resolved, every set pre-filled from last time, the cursor advances tomorrow before you close the app.
2. **The guided rep** — one move full-screen, a silent looping form clip (compounds) or a clean diagram (isolation), the target in plain language ("8 reps, a weight that's hard but doable"), one fat "Log this set."
3. **The two-tap auto-saved log** — no Save button; first set logs the engine's conservative floor on tap; calibration ("Too easy / Just right / Too hard") is asked **after** the rep, never before.
4. **The legible week-1 strength signal** — load-on-the-bar deltas, legible by day 7.
5. **The coach that quotes your why** — deterministic gate decides *when*, the LLM decides *how it sounds*, a template fallback covers any outage.

Everything else is cut, hidden, or demoted. Program, Library, Calendar, and Charts are not tabs — they are reference material reached from a moment of need. The IA is **two tabs: Today and You.** The coach gets no tab; a tab is a place you maintain, and the coach is an interruption with stakes.

The architecture already half-exists in the repo — `today/page.tsx` resolves a schedule cursor into a pre-built session, pre-fills from last time, and auto-advances; the logger auto-saves with no Save button. That mechanism is best-in-class. **The content riding on it is built for the founder, not the beachhead** (RPE-gated progression a beginner can't read, an e1RM signal invisible in week one, a two-frame JPG "demo"). The product plan is the work of closing that gap.

---

## 8. The moat

No single feature is a moat. The guided rep is an 8-week clone. The meme decays. We say that plainly.

The compounding asset is the **accumulating per-user emotional corpus** — the why, the wedding, the four restarts, the logged history. A second mover can copy the *format* in a quarter; it cannot cold-start *your* eighteen months of context. That is what makes the coach's specificity impossible to clone.

The moat compounds **only if the keeper retains.** So we measure the D90 curve before we claim it. Three structural reinforcers protect the corpus while it accumulates:

- **The back-safe swap engine** — ranks substitutes by muscle, movement pattern, *and* the equipment you actually have, hard-filtered to back-safe. "The machine you wanted is taken or hurts your back — here's the closest safe thing you can do right now" is a beginner's panic moment no incumbent answers in one tap.
- **The deterministic gate + template fallback** — the coach is cheap and unbreakable; a model failure or cost spike never breaks the product. This is why we ship where competitors get rejected.
- **Restraint as the premium signal** — two tabs, one primary action per screen, ember on exactly one element. The discipline *is* the brand and the survivable cost structure (~85%+ gross margin).

---

## 9. What we will not build (the strategy, stated as subtraction)

We are proud of these cuts.

- The **referral-Coach loop** — harassment vector, guaranteed rejection.
- **Wearable / Whoop / Oura / Garmin six-source ingestion** — a feature for people who already train.
- **Full HealthKit in v1** — Phase 3, native shell only, and only ever to feed the coach, never new dashboards.
- **SMS as the primary channel** — push carries the moment; SMS is gated premium.
- **A React Native rewrite before PMF** — Capacitor wraps the PWA.
- **RPE-by-default, periodization, manual program editing, multi-curve charts, the library/calendar as standalone tabs, e1RM as the headline metric** — all survive behind a dormant **Lifter Mode** toggle; nothing is deleted, it's demoted from the default.
- **Any screen with more than one primary action.**
- **Share prompts inside the logging loop** — sharing is offered once, post-moment, then disappears. We do not turn a habit tool into a content treadmill.
- **Mismatched stock JPEGs as a "form demo"** — a wrong demo teaches the wrong lift and burns the one feature that must be flawless.

The bias is to subtraction. Five features survive and must be world-class. Everything else we cut, hid, or demoted with conviction. We already built an excellent lifter's instrument; the discipline of this plan is refusing to fall in love with it.
