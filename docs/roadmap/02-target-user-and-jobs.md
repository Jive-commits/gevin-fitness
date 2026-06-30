# FORGE — Target User & Jobs-to-be-Done

> **First-principles mandate:** Blank canvas. The current app is a dense, clunky power-user instrument; we do not anchor on it. The AI coach is a marketing hook, not the reason anyone stays — the core must be killer on its own. Every element on screen and every feature earns its place or gets cut. The default answer to any new feature is **no**.

This document does one thing: it draws the person we are building for in enough detail that any product decision can be checked against them. If a feature does not serve *this* person doing *this* job, it does not ship.

---

## 1. The beachhead — one person, not a segment

We are not building for "people who want to get fit." We are building for **one person**, and we will say their name out loud in every meeting:

**The 22–32 year-old who has restarted four times.** They own the gear. They hold the membership. They watch the content. And they still cannot string two weeks together.

| Trait | What it means for the product |
|---|---|
| **High intent** | They already *want* this. We never sell motivation — they have it. We sell the bridge between wanting and doing. |
| **High shame** | Every failed restart left a scar. Anything that makes them feel stupid, behind, or watched costs us the user. |
| **High churn everywhere else** | Every competitor has already had them and lost them. We are the fifth app, not the first. We must feel different in the first 90 seconds. |
| **Chronically online** | They share everything. The earned screenshot is native to how they already behave — that is our distribution. |
| **They do not actually know how to lift** | The single fact that reshapes the entire product. They cannot pick a weight, cannot read RPE, do not know if their form is safe, do not know if it "counted." |

That last row is load-bearing. Most fitness apps assume gym fluency — they hand you empty fields and a number to type. To our user, an empty field is a small humiliation. **We design for someone who has never been shown what to do and is afraid to ask.**

### Who this is explicitly NOT for

| We build for | We do **not** build for |
|---|---|
| The four-times-restarter who feels lost and unsafe | The lifter who already knows their program |
| Someone who needs the decision made *for* them | Someone who wants to author their own template |
| Someone who needs to *feel* competent in week 1 | Someone optimizing e1RM curves and periodization |
| Someone whose enemy is *not showing up* | Someone whose enemy is *suboptimal programming* |

Picking this person is the whole strategy. Build for the serious lifter and you build the instrument we already have — and lose the 95% who churn. Build for our person and the serious lifter can still live here (§5); the reverse is not true.

---

## 2. The job they are actually hiring us for

People do not buy products; they hire them to make progress in a circumstance. Our user's circumstance is **"it's a training day, and I am one decision away from skipping again."**

Their job-to-be-done is **not** "teach me a deadlift library" or "track my volume." In their own words:

> *"Get me to show up today, walk me through it so I don't feel lost or unsafe, and let me see I'm getting stronger."*

That decomposes into three functional jobs and one emotional job — and the emotional one is the real purchase.

| Job | Type | What "done" looks like |
|---|---|---|
| **Show up today** | Functional | The session is already built and waiting; no planning stands between them and starting. |
| **Walk me through it** | Functional | One move on screen at a time, the weight proposed, the form shown — they are never lost, never unsafe. |
| **Show me I'm stronger** | Functional | A legible "you got stronger" signal lands by day 7, in plain language they can read. |
| **Let me feel competent, not stupid** | **Emotional** | Across the whole session they feel guided and capable — never tested, judged, or behind. This is the job they will actually pay to have done. |

The functional jobs are table stakes no incumbent quite nails for a true beginner. The **emotional job is the moat of the experience**: they keep opening FORGE because, here, they are not made to feel stupid. Every screen is graded against it.

---

## 3. The anxieties — the real product is removing these

A non-exerciser does not churn because the app lacks a feature. They churn because, somewhere in the loop, it made them **decide** — and decision is where shame and abandonment live. Each anxiety below is a churn trigger; our product is its deliberate removal.

| The anxiety (their inner voice) | When it strikes | How FORGE kills it |
|---|---|---|
| *"I don't even know what to do today."* | The moment they open any other app | **Pre-built Today** — the session is resolved and waiting; no menu, no planning, no blank slate. |
| *"What weight am I supposed to use?"* | Standing at the rack, holding nothing | **The engine proposes; they confirm.** First set logs a conservative floor on one tap. They never pick a weight cold or face an empty field. |
| *"Am I doing this wrong? Am I going to hurt myself?"* | Mid-set, unsure of form | **The guided rep** — one move full-screen with a real looping form clip (compounds) or a clean diagram (isolation). They are shown, not quizzed. |
| *"How hard was that — what do I even say?"* | When an app demands RPE | Calibration asked *after* the rep, in plain language: **"Too easy / Just right / Too hard."** Judgment after sensation, never before. We deleted the pre-set feeling-chip entirely — it asked for a reference a beginner doesn't have. |
| *"Did this even count? Am I getting anywhere?"* | Days in, with nothing to show | **Load-on-the-bar deltas by day 7** — "+15 lb on squat since Monday." Real, legible, theirs. Never e1RM, which is abstract and invisible in week one. |
| *"I'm so far behind everyone."* | Seeing streaks, leaderboards, ripped strangers | **No streak ribbon over the one decision. No leaderboards. No social compare.** A streak counter is a *liability* counter for someone who has restarted four times. |
| *"The machine I need is taken / hurts my back."* | A panic moment mid-gym | **One-tap back-safe swap** — the closest safe substitute for the equipment they actually have. No incumbent answers this in one tap. |

> **The product law, restated:** *Logging is confirmation, not data entry.* Every anxiety above is a decision we took off their plate. The killer app hides all of them and surfaces exactly **one** at a time.

---

## 4. The week-1 win — the moment that makes a keeper

Retention is decided in the first week — specifically by whether one moment fires: **a legible "you got stronger" signal by day 7.** This is the highest-leverage retention lever in the roadmap, because D30 and D90 are mathematically downstream of D7.

**Why not estimated 1RM?** It's the founder's metric, not the beginner's — abstract, noisy on light loads, slow to move. It can read *flat* in week one even when the user is plainly getting stronger, and to someone watching for proof it isn't working *again*, a flat line is a reason to quit.

**What we ship instead — load-on-the-bar deltas in plain language:**

> *"+15 lb on squat since Monday."*

Real weight, on a lift they did, in words they read without instruction. Concrete, theirs, inside the first week.

### The mechanical safeguard that makes the number real

There is a trap here we walked into deliberately to disarm it: if calibration is wrong, the engine faithfully *stalls* the user, the day-7 delta reads flat, and the win never fires. A never-lifted user's "Just right" can't be trusted as a reference. So:

- We ask for **nothing** before the first set. We pre-fill the engine's conservative floor and log it on the first tap.
- We ask **"Too easy / Just right / Too hard"** *only after they've felt the weight* — sensation first, judgment second.
- For the **first three weeks**, the progression rule **biases toward load increase** — a deliberate novice-overload tilt. The failure mode for a beginner is *under*-loading, and an empty-barbell stall reads as "this app doesn't work."

This is what keeps the week-1 number from being a flat line. It is also the **first thing we test**, ahead of everything: *does post-sensation calibration actually move load on the bar for a true novice?* Pass = median squat load rises across weeks 1–3. If it doesn't, the core fails its user, and no coach text can save it.

**The week-1 win, end to end:**

```
day 1: onboarding ends INSIDE a logged rep → first competence
days 2–6: pre-built session → guided rep → two-tap log → it's effortless
day 7: "+15 lb on squat since Monday" → proof it's working, in their words
```

That is the coachless app earning the open. The coach drives the install spike; *this* converts the laughers into keepers. Strip the coach and this is still a top-tier daily-use product — the coach is the trailer; the week-1 win is the movie, and the movie does not disappoint.

---

## 5. The power-user we retain (without serving them on the default surface)

We walk away from the power-user as the *beachhead* — not from the product. The serious lifter who already lives in the current instrument is real and cheap to keep. The discipline: **they live behind a toggle, never on the default surface.**

| Power-user need | Where it lives | Why it's not in the default |
|---|---|---|
| RPE-by-default, manual program editing, periodization | **Lifter Mode** (one settings toggle) | Every one is an instrument that makes a beginner feel stupid and contradicts "we decide so you don't." |
| Multi-curve charts, e1RM headline, full history | Lifter Mode / contextual drilldowns | Abstract and invisible to a beginner; available on demand, never default. |
| The exercise library, calendar | Contextual drilldowns reached from a moment of need | A tab is a destination you maintain; these are reference material, not destinations. |
| Custom-exercise authoring, bodyweight logging in the default surface | Lifter Mode | Net new decisions on the one screen that must have a single action. |

**Nothing is deleted from the codebase.** It is *demoted from the default.* This matters for three reasons:

1. **The same engine serves both.** The beginner's feeling-chips and the lifter's RPE feed the *identical* progression math. We wrap the engine; we do not fork it. Lifter Mode just exposes dials we otherwise hide.
2. **Beginners graduate.** Today's scared novice is next year's intermediate. When they're ready for the dials, the dials are there — the product grows with them instead of capping them.
3. **The power-user is a low-cost retained segment,** not a customer we contort the default experience to please. The moment a power-user need leaks onto the default Today screen, we have failed the beachhead.

> **The rule, stated as subtraction:** the default surface answers to the four-times-restarter and no one else. Every power-user feature survives — behind **Lifter Mode**, demoted with conviction. If a lifter's instrument ever shows up on the beginner's one-decision screen, cut it back behind the toggle.

---

## 6. The throughline

One person. One job: *get me to show up, walk me through it, show me I'm stronger* — and underneath it, *let me feel competent, not stupid.* The product is the systematic removal of every decision that triggers their shame, culminating in a real number on the bar by day 7. The power-user is retained, not served, behind a single toggle. We already built an excellent lifter's instrument; the discipline of this plan is refusing to fall in love with it, and building instead for the person every other app has already lost.
