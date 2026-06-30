# FORGE — Product & the Core Daily Loop

> **First-principles mandate:** Blank canvas. The current app — accordion logger, kg/lb steppers, RPE 5–10, 6 tabs, e1RM charts — is a power-user cockpit, and we do not anchor on it. The AI coach is the marketing trailer, not the retention engine: if the coach vanished, this loop must still be a top-tier app people open daily. Every pixel earns its place or gets cut. The default answer to any new feature is **no**.

---

## 1. The whole product in one sentence

For someone who has never trained, the app collapses into a single instruction they can obey:

> **Press start, do exactly what the screen shows, watch one number go up.**

The program engine, the library, the charts, RPE, the swap matrix — all of it is scaffolding the beginner should *never see* until they have earned the right to want it. The current app shows the scaffolding first. We are inverting that. A beginner does not need a cockpit; they need a windshield with one arrow on it.

---

## 2. The naked loop — one move, full-screen, one decision

We throw out the accordion-of-all-exercises model. The unit of the experience becomes **one move at a time** — a guided card stack, not a spreadsheet.

End to end:

**Open → the session is already built and waiting → press Start → for each exercise: silent looping form demo + the target in plain words → do the set → tap one big button to log it → the rest ring breathes and counts down → next set / next move → finish → one honest "you got stronger" number.**

Five nouns the beginner ever sees during a workout: **Start · the move · the target · the log button · the rest ring.** No steppers by default, no RPE, no accordion, no tabs — the tab bar *hides* during an active session. The content is the workout; chrome recedes.

### The guided rep — the one world-class feature

A full-bleed card, three zones:

| Zone | What it shows | Source |
|---|---|---|
| **Top** | Silent looping form demo of the move | `lib/exercise-media.ts` (see §7 — the long pole) |
| **Middle** | *"Goblet Squat — Set 2 of 3. Aim for 8 reps with a weight that's hard but doable."* Plain language, never `3 × 8-10 @ RPE 7`. | `repScheme` / `targetRpe`, run through a formatter |
| **Cue** | One coaching line: *"chest up, push the floor away."* One. Not a paragraph. | `Exercise.cues` |
| **Bottom** | A fat **"Log this set"** button. Tapping logs the *prescribed* reps at the *suggested* weight. The beginner types nothing. | `lib/progression.ts` |

This is the core inversion, stated as a product law:

> **Logging is confirmation, not data entry.** The engine proposes the number; the user confirms it in one tap.

A tiny "edit" affordance under the button reveals reps/weight for the rare off-target set — but the default path is one tap. The engine already emits `suggestedWeightKg` and `suggestedReps`; today those are an optional "Apply" hint, and for beginners they simply become the pre-filled defaults.

### Weight, for someone who can't pick a weight

The single hardest beginner moment. We never show an empty weight field. Three-tier resolution:

1. **First time on a lift:** offer a *feeling*, not a number — *"Pick a weight you could lift about 12 times before failing"* with three coarse chips (**Lighter / About right / Heavier**) and a starting suggestion seeded from `UserSettings.bodyweightKg` and a conservative per-exercise coefficient. Bodyweight moves skip weight entirely.
2. **After set 1:** *"How did that feel?"* → **Too easy / Just right / Too hard.** This replaces RPE for beginners and feeds the identical RPE math underneath (too-easy ≈ 6, just-right ≈ 8, too-hard ≈ 9.5). The engine adjusts the next set's load live.
3. **Next session:** the engine has a number; it pre-fills and the user confirms or nudges with +/−.

We **wrap** the progression engine, we do not rewrite it. The raw dials (RPE 5–10, kg steppers) become the power-user reveal; the beginner gets feeling-chips that map onto the same math.

---

## 3. First session in 60 seconds — the exact first-run flow

The point: **earn a rep before we earn anything else.** Onboarding must end *inside a working set*, not on a settings screen.

| Time | Step | Action | What it sets |
|---|---|---|---|
| 0:00 | **Open** | Phone number → 6-digit code. No email, no password. | Real auth, ~15s |
| 0:15 | **"What's this for?"** | One tap from six goal chips | `primaryGoal` → starting program |
| 0:25 | **"How many days a week, honestly?"** | One tap: 2 / 3 / 4 | `trainingDaysPerWeek` → split (2–3 full-body, 4 = PPL) |
| 0:35 | **"Where are you training?"** | One tap: Gym / Home | `availableEquipment` → drives swaps; never prescribe a barbell to a living-room floor |
| 0:45 | **"Here's today. ~25 min, 4 moves."** | Glanceable preview, demos as thumbnails → **"Let's go."** | — |
| 0:50 | **The first guided set** | A low-skill, hard-to-do-wrong move (goblet squat / a machine — never a barbell back squat on rep one). Demo loops. *"Aim for ~10 reps, light. We're just learning the move."* They lift. They tap **"Log this set."** | First rep banked |
| ~1:00 | **First rep is banked** | Rest ring breathes. The coach's first and only onboarding line: *"That's one. Most people never start. Three more moves."* | First-run aha |

In under a minute, ~4 taps, **zero decisions about weights or reps.** Only *after* a completed session do we offer the deeper coach onboarding — opt-in, post-value.

**Explicitly cut from first-run:** account/email, the chat-based emotional intake, unit selection (default lb, change later), any mention of programs/blocks/phases, the library, RPE, warm-up configuration, SMS consent, persona/intensity selection.

---

## 4. The week-1 "you got stronger" moment

Estimated-1RM (Epley, `lib/analytics.ts`) is too slow and too abstract — a beginner does not know what "e1RM 142 lb" means and won't have a meaningful one by day 7. We demote e1RM to the power-user view and define an **earlier, more legible** progress signal that almost always fires within a week, in three escalating flavors:

1. **"You adapted" (fires day 1):** if set 3 beats set 1 on load or reps → *"You did more on your last set than your first. That's your body learning — already."* Nearly always true for novices.
2. **"You beat last time" (fires ~day 3–4):** *"Goblet squat: 8 reps at 25 lb → 10 reps at 30 lb. That's progress you can feel."* Volume-per-lift, in their units, named.
3. **"Look what a week did" (fires ~day 7):** one hero stat — total reps this week vs. zero a week ago, or *"You showed up 3 times. People who hit 3 in week one are far more likely to still be here in a month."*

The North-Star is **weekly logged workouts**; this signal is engineered to make completing workout #3 feel *visibly* rewarded.

---

## 5. The coach as a light accent, not a crutch

The coach is the trailer; the guided workout is the movie. Inside the loop the coach is nearly silent:

- **During the workout it never narrates.** No commentary between sets. The rest ring and the demo do the work. The coach *reacts* to the work — it never narrates it.
- **One post-set line, max once per session,** and only at a real moment (first-ever set, a beat-last-time, the final set). **Gentle by default.**
- **The emotional "why" intake (`lib/coach/intake.ts`) moves to *after* the first completed session** and is optional. On day 1 the coach stays sharp with only the goal chip, the schedule, and today's logged/not-logged fact: *"It's 7:14, you said you'd train today, and you haven't."* The deep why is the earned upgrade that turns "get up" into "this is the wedding you cried about."
- **Savage is opt-in and climbed toward,** never the default. A scared beginner gets the Mentor; the viral savage texts are a setting the keeper turns on (push first, SMS later).

The coach lives in exactly three places: **onboarding's tail, post-set reactions, and the texts.** It has **no tab**.

---

## 6. Progressive disclosure — what we HIDE vs REVEAL

**Two tabs, period: `Today` and `You`.** The full power-user instrument still exists in the codebase — we gate it behind earned intent and one toggle.

**Beginner default — VISIBLE:**

- **Today:** the pre-built session, the guided card stack, the rest ring, the finish summary.
- **You:** the weekly streak, the week-1 progress signal, a simple "getting stronger" view, coach settings.
- One-tap logging, feeling-chips, plain-language targets.

**HIDDEN until earned** (contextual reveal or a single **"Lifter Mode"** toggle in `You`):

| Hidden thing | Lives now in | When it reveals |
|---|---|---|
| Raw RPE 5–10 stepper | `exercise-card.tsx` | Replaced by feeling-chips; raw RPE only in Lifter Mode |
| kg/lb steppers as default input | `exercise-card.tsx` | One-tap log is default; steppers behind "edit" |
| Exercise **Library** as a tab | `/library` | Becomes a contextual "see other options" drilldown, not a destination |
| **Program / blocks / phases** | `/program` | Hidden for beginners; the program just *runs*. Lifter Mode exposes it |
| e1RM **charts** | `/progress`, `e1rm-chart.tsx` | Demoted under the legible signal; full charts in Lifter Mode |
| **Calendar / History** as a tab | `/history` | Folds into `You` as the streak; deep history in Lifter Mode |
| **Swap engine** | `swap-drawer.tsx` | Surfaces only as "swap this move" when the user signals they can't do one |
| Warm-ups, supersets, tempo | logger | Auto-handled or hidden; revealed in Lifter Mode |

**Lifter Mode is one toggle** that flips `Today` back to the dense accordion and restores RPE, charts, program editing, and the manual swap matrix. The serious lifter loses nothing; the beginner never sees it. Nothing is deleted from the codebase — it is demoted from the default surface.

---

## 7. The long pole — guided-rep form content

The single biggest risk to the guided-rep promise. Current media (`lib/exercise-media.ts`) is a 2-frame JPG alternation from the public-domain `free-exercise-db` — fine as a placeholder, **not** world-class. A juddering 2-frame GIF undercuts "this feels native and premium."

**Recommendation:** for the ~25-move beginner core (not all 150), commission or generate true short looping form clips — 3–5s, silent, consistent lighting/model. That is where the design/content budget goes. The other ~125 moves keep the placeholder until reached. **Cut:** chasing world-class media for all 150 at once. Get it perfect for the moves a beginner actually touches in weeks 1–4.

---

## 8. Habit & streak mechanics — justify, then mostly cut

The North-Star is **3+ workouts/week held for 4 weeks.** Streaks must reward the behavior that predicts retention — *showing up* — not a punishing daily chain that a 3×/week user breaks by design.

**KEEP:**

- A **weekly** streak ("3 of 3 this week"), not daily. A daily chain shames a 3×/week trainee for resting, which is exactly wrong for this body and this user. `getConsistency().streakWeeks` already models it. One streak number, on `You` and the home hero.
- The post-session summary as the dopamine beat (volume / sets / time already in `SummarySheet`), reframed around the legible progress signal from §4, not e1RM PRs.

**CUT:** badges, levels, XP, freeze/repair economies, daily-chain streaks, system push-notification streak nags (the coach owns all proactive outreach — one voice, no notification spam competing with it), and "total tonnage = 14,200 lb" hero stats for beginners (meaningless after 3 workouts; keep it in Lifter Mode).

---

## 9. The ruthless cut list

**SURVIVES — and must be world-class:** the guided rep · one-tap logging · the auto-built, auto-progressing session · feeling-chips · the breathing rest ring · the week-1 progress signal · the weekly streak · two tabs.

**CUT / HIDDEN for beginners:** 6-tab nav → 2 tabs · Library tab · Program/blocks/phases tab · e1RM charts as default · RPE-by-default · kg steppers as default input · manual warm-up config · supersets exposure · the swap *matrix* as a destination · the freestyle "custom workout" home entry (`/today/custom` — a power-user escape hatch that confuses someone who doesn't know what to freestyle) · total-tonnage / working-sets stat tiles · the chat-based emotional intake *before* the first rep · SMS consent in onboarding · persona/intensity selection in onboarding.

Every one of these still exists for the power user behind Lifter Mode. Demoted, not deleted.

---

## 10. The retention thesis for this loop

A non-exerciser churns because every other app makes them **decide** — what workout? what weight? am I doing this right? did it even count? — and decisions are where shame and abandonment live.

This loop **removes every decision:** the session is pre-built, the weight is proposed, the form is shown, the log is one tap, and progress is made legible by day 7. The reward for opening the app is **competence you can feel in week one** — *"I showed up, I knew exactly what to do, and the screen showed me I got stronger."*

That competence loop is self-reinforcing and survives the coach's removal entirely — which is the bar the mandate sets. The coach drives the **viral install spike**; this naked loop is what makes the keepers from that spike actually keep, converting a one-screenshot novelty into 3+ logged workouts a week, held four weeks.

> **The movie does not disappoint, so the trailer's audience stays.**

---

### Files grounding this redesign

- **Core loop to rebuild:** `/home/user/gevin-fitness/components/logger/today-logger.tsx`, `/home/user/gevin-fitness/components/logger/exercise-card.tsx`
- **Engine to wrap, not rewrite:** `/home/user/gevin-fitness/lib/progression.ts` (already emits `suggestedWeightKg` / `suggestedReps` — the one-tap default)
- **Nav to collapse 6 → 2:** `/home/user/gevin-fitness/components/nav/bottom-nav.tsx`
- **Progress-signal source:** `/home/user/gevin-fitness/lib/analytics.ts` (`getConsistency`, `getTotals`, `getRecentPRs`)
- **Coach to relocate / gentle-default:** `/home/user/gevin-fitness/lib/coach/intake.ts` (move past first rep), `/home/user/gevin-fitness/lib/coach/voice.ts` (gentle default)
- **Form-content long pole:** `/home/user/gevin-fitness/lib/exercise-media.ts` (2-frame placeholder → upgrade the ~25-move beginner core)
- **Schema supporting it as-is:** `/home/user/gevin-fitness/prisma/schema.prisma` (`Exercise.cues`, `UserSettings.bodyweightKg` / `availableEquipment`, `CoachProfile` goal/why fields)
