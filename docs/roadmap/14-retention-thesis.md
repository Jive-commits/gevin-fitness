# 14 — The Retention Thesis: FORGE Is Killer Without the Coach

> **The premise this whole company is bet on:** delete the savage AI coach entirely and FORGE *still* earns a daily open. The coach is the trailer. This is the movie. If the movie can't stand on its own, we don't have a product — we have a gimmick with good marketing.
>
> This document defends that premise against the actual repo, names where it's currently false, and prescribes the smallest set of investments that flip it to an unambiguous yes. Per the first-principles mandate: the AI coach is the **marketing hook, not the retention engine.** Every element below has to earn its place or get cut.

---

## 1. The core value moment

The single sentence the product hangs on:

> **"I opened the app, it told me exactly what to do, walked me through it, and showed me a number that went up — and I never once had to think."**

That loop is already half-built in the repo, and it's the genuine asset:

| Step | What happens | Where it lives |
|---|---|---|
| Open | A schedule cursor (`currentDayOrder`, 1–6) resolves to **today's concrete session** — no blank state, no "build a workout" | `app/(app)/today/page.tsx` |
| Pre-fill | Every set is pre-filled from your last performance (`getLastSetsForExercise`) and stamped with a progression target (`computeHint`) | `today/page.tsx`, `lib/progression.ts` |
| Log | Session auto-creates on first tap (`ensureSession`); every set auto-saves on a 650 ms debounce; rest ring breathes between sets | `components/logger/today-logger.tsx` |
| Finish | One honest summary (volume / sets / time / PR), a haptic PR celebration, and **the cursor advances** so tomorrow is already decided | `today-logger.tsx` |

**There is no Save button. There is no authoring step. There is no blank canvas staring back at you.** Most fitness apps make you the programmer. FORGE makes you the athlete. That is the differentiator, and it is real in the code today.

The catch — and it's the thesis's central tension — is that the *content* riding on that machine is a serious lifter's push/pull/legs block with rep schemes like "8–10 @ RPE 7–8." A beginner who can't yet hinge has no idea what RPE 7 feels like, and `computeHint` **gates progression on that RPE number.** The mechanism is world-class. The content layered on top was built for the founder, not for the beachhead user we're actually shipping to.

---

## 2. The habit loop and its triggers

Stripped to its bones, the loop is:

**Open → today's session is already there → tap Start → walked set by set → finish → one number moved → cursor advances → tomorrow is pre-decided.**

The thing that makes this a *habit* and not a chore: **the next action never has to be invented.** Closing today's loop loads tomorrow's. That's the "investment" phase of the Hook model happening for free — finishing is itself the act that pre-commits the next session.

But there is a structural hole, and we name it honestly: **the core product has no return trigger of its own.** The home dashboard shows a streak and an activity calendar, but the *only* thing in the repo that actively pulls a user back is the coach's SMS/push cron. The in-app loop is excellent — once you're in the app. Nothing the product *owns* gets you back in tomorrow. If the coach is the only return trigger, then "killer without the coach" is false by construction. Closing this is investment #3 below.

---

## 3. Why it beats the incumbents — for *this* user

Every incumbent is built for someone who **already trains.** Our user has restarted four times and quit four times because the tool assumed knowledge they don't have.

| Incumbent | What it is | Why it fails our beginner |
|---|---|---|
| **Strong / Hevy** | Beautiful logging spreadsheets | Core screen is an **empty template you author.** That blank template *is* the churn for someone who doesn't know what to do. |
| **Fitbod** | Auto-generates a session | Closest competitor — but optimizes recovery for the gym-fluent, surfaces RPE and dense substitution menus, never answers "am I doing this safely?" |
| **Apple Fitness+** | Follow-along classes | No progressive strength tracking, never tells you *your* next weight. |
| **Ladder** | Coach-programmed group training | Content you consume, not a system that adapts to *your* logged numbers and *your* gym's equipment. |

FORGE's unfair combination for the beginner is three things no incumbent gives all at once:

1. **Zero-authoring prescription** — you arrive an athlete, not a programmer.
2. **The back-safe swap engine** (`lib/swap.ts`) — ranks substitutes by movement pattern, target muscle, and *the equipment you actually have*, with a **hard back-safe filter.** "The machine you wanted is taken / hurts your back — here's the closest safe thing you can build right now, in one tap." That's the exact panic moment a beginner hits on the floor, and **no one else answers it.** This is a quiet moat.
3. **Auto-progression** — it does the math the beginner doesn't know how to do.

---

## 4. The aha, and the reason to return on day 1 / 7 / 30

| Marker | The reason to return | Status in the current build |
|---|---|---|
| **End of session 1 (aha)** | "That was easy and I wasn't lost." The win is **competence**, not data. | The summary sheet lands it — but the headline must be "you finished, here's what you did," **not** "+2.5 kg e1RM," which is meaningless on day one. |
| **Day 2** | The decision is already made — the cursor advanced to a different, pre-decided session, and yesterday proved it's painless. | ✅ Works today. |
| **Day 7** | "I'm getting stronger." | ❌ **Broken for the beachhead.** The week-1 signal is **Epley estimated 1RM** (`lib/analytics.ts`, `getExerciseSeries`). e1RM is abstract, and the code's own `isLowConfidence` flag proves it: on light beginner loads the number is noisy and slow. The "you got stronger" moment does not legibly exist yet. |
| **Day 30** | Identity. "I'm someone who trains now." Streak + activity calendar + "you've trained N days," and the cursor means you never fall off because you "didn't know what to do." | ⚠️ Rests **entirely** on the day-7 signal having fired. If week 1 didn't *feel* like progress, there is no day 30. D30 is mathematically downstream of D7. |

---

## 5. The investments that most move D1 / D7 / D30

Ruthless. These three, in order. Nothing else this quarter. The default answer to a fourth feature is **no.**

### 1 — A true-beginner prescription path that reuses the engine (drives D1, and makes the whole thesis true)

Do **not** build a second engine. The Prisma schema already supports it (`prisma/schema.prisma`) — no migration. Swap the loaded `Program` / `Block` / `Day` for a beginner block with plain-language targets ("a weight that's hard but doable for 8"), and replace RPE-gated progression with a **double-progression rule a beginner cannot fail:**

> Hit the top of the rep range on every set → next time add the smallest increment (`incrementUpperKg` / `incrementLowerKg` already exist). Otherwise, repeat the load and chase one more rep.

`computeHint`'s `range` branch nearly does this already — it just needs to **stop *requiring* RPE** (`easyEnough = target == null || rpe == null || rpe <= target` must become genuinely RPE-optional for this path). This is the line between "killer for the founder" and "killer for the user we're building for."

### 2 — Replace the week-1 progress signal (drives D7 → therefore D30)

Epley is the wrong yardstick for this user. Ship a **"you got stronger" moment that's legible by day 7:**

- Total weight moved this week vs. last week.
- "You've added 15 lb to your squat since you started."
- A per-exercise **first-time → now** delta.

Every byte of this data already exists in `SetLog`. This is a `lib/analytics.ts` + summary-screen job, not new infrastructure. **This is the single highest-leverage retention fix in this document,** because 30-day retention is downstream of it.

### 3 — Give the core product its OWN return trigger (drives D2–D7, de-risks the entire thesis)

Today the coach's cron is the only thing that pulls a user back. Ship a PWA push that says nothing savage — just true and useful:

> *"Legs today. 38 minutes. Already set up."*

That is a core-product trigger that **survives the coach being deleted.** Without it, "killer without the coach" is literally untestable, because the coach owns re-engagement.

### The honest near-tie: form-demo content (flagged, not greenlit)

The "silent looping form demo" promised earlier **does not exist.** `lib/exercise-media.ts` flips between two static JPGs (`0.jpg` / `1.jpg`) from a public-domain DB — a slideshow, not a demo — and it visibly maps **distinct lifts to the same image pair** (`front-squat` and `smith-front-squat` share frames; `goblet-squat` and `heel-elevated-squat` share frames). For a user whose core fear is *"am I doing this wrong / will I hurt myself,"* a believable form demo is part of the competence aha, not a nice-to-have. It ranks #4 only because it's a content-sourcing project (license / film / generate) with a longer pole — **not because it matters less.**

---

## Verdict

**Is the core killer without the coach *today*? No — but the gap is small, named, and the machine to close it already exists.**

The loop architecture — zero-authoring prescription, no-Save-button auto-save logging, back-safe swap engine, auto-progression, cursor advance — is genuinely best-in-class and beats every incumbent for our beginner. What's missing is that the content and signals riding on that machine are tuned for the founder: RPE-gated progression a beginner can't read, an e1RM signal that's invisible in week one, a "form demo" that's a two-frame slideshow, and no return trigger the product owns.

Fix the four — **beginner prescription + double-progression, a legible week-1 strength signal, a core-owned push trigger, and a real form demo** — and the answer flips to an unambiguous **yes.** The coach stays the trailer. This is the movie, and after these fixes it doesn't disappoint.

---

### Files referenced (all absolute)

- `/home/user/gevin-fitness/lib/progression.ts` — RPE-gated hints; the beginner blocker.
- `/home/user/gevin-fitness/lib/swap.ts` — the back-safe, equipment-aware swap moat.
- `/home/user/gevin-fitness/components/logger/today-logger.tsx` — the no-Save-button auto-save loop.
- `/home/user/gevin-fitness/app/(app)/today/page.tsx` — zero-authoring prescription + schedule cursor.
- `/home/user/gevin-fitness/app/(app)/home/page.tsx` — e1RM / PR signal, streak, activity calendar.
- `/home/user/gevin-fitness/lib/analytics.ts` — Epley e1RM; the wrong week-1 signal (`isLowConfidence` proves it).
- `/home/user/gevin-fitness/lib/exercise-media.ts` — two-frame JPG slideshow, not a real form demo.
- `/home/user/gevin-fitness/prisma/schema.prisma` — already supports a beginner Program/Block/Day with no migration.
