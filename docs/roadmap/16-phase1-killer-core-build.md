# Phase 1 — Killer-Core Build Spec: The Naked Loop

*Build-ready spec for the naked loop — **open → today is built → one tap → walked rep-by-rep → one honest number moves.** Scope is the three things that make the core killer with the coach deleted: the **guided rep**, **post-sensation calibration**, and the **legible day-7 load-on-the-bar signal**. Everything else hides behind Lifter Mode.*

> Assumes Phase 0 landed (`userId` threaded, the `id:"default"` singletons in `lib/settings.ts` / `lib/coach/profile.ts` collapsed to per-user rows, phone-OTP). This wraps the engine; it does not rewrite the math in `lib/progression.ts` or `lib/analytics.ts`.

---

## 1. The guided-rep component — full-screen, one move at a time

Today `components/logger/today-logger.tsx` renders **all** slots as an accordion of `ExerciseCard`s (weight/reps/RPE steppers, set-pills, swap, progress sheet, hint banner, warm-up toggle, details). We keep that file behind Lifter Mode and build a new default surface beside it.

**New files:** `components/logger/guided-rep.tsx` (full-bleed card + state machine), `components/logger/exercise-animation.tsx` (looping clip for compounds / static diagram for isolation, reads the new `lib/exercise-media.ts` resolver, §5), `lib/rep-language.ts` (`formatTarget(repScheme, sets, setIndex)` turns `3 × 8-10 @ RPE 7-8` into *"Set 2 of 3 — aim for 8 reps, a weight that's hard but doable"*; never shows RPE).

**Component contract** (drop-in for the data `app/(app)/today/page.tsx` already assembles):

```ts
// components/logger/guided-rep.tsx
type GuidedStep = { slotId: string; setNumber: number };
export function GuidedRep(props: {
  slotsData: SlotData[];              // reused from today-logger.tsx, unchanged
  units: Units;
  defaultRestSec: number;
  // callbacks reuse the EXISTING app/actions/session.ts surface — no new write path:
  onLogSet: (slotId: string, set: LoggerSet) => Promise<SaveSetResult>; // wraps saveSet()
  onCalibrate: (slotId: string, sensation: Sensation) => void;          // §3
  onFinish: () => Promise<FinishSummary>;                               // wraps finishSession()
}): JSX.Element;
```

The card is three zones (doc 03 §2). **Each element justified — nothing else ships:**

| Zone | Element | Earns the pixel because | Cut |
|---|---|---|---|
| Top | Looping form demo (`ExerciseAnimation`) | Answers *"am I doing this right / will I hurt myself"* (doc 14 §5) | details link, library tab |
| Mid | Move name + plain target (`formatTarget`) | Only instruction a non-exerciser can obey | `3 × 8-10 @ RPE 7-8`, set-pills, superset badges |
| Cue | One line from `Exercise.cues` (schema line 28) | One safety cue, not a paragraph | `tempoNote`, multi-cue lists |
| Bottom | Fat **Log set** (weight/reps baked in) | The one primary action; "confirmation, not data entry" | weight/reps/RPE steppers, Apply banner, swap, warm-up |
| Edge | `●●○○○` progress (non-interactive) | Orientation only | session timer, day-picker, reset |

Below **Log set**, a small *"Off target? Edit"* reveals two quiet inline `Stepper`s for the rare miss — default path is one tap. Calibration (§3) renders **after** the tap. Long-press on the demo opens *"Can't do this one?"* → the existing `SwapDrawer` (one alternative; scoring stays under the hood, doc 13).

**State machine** (drives the spring transitions; the tab bar hides for all states except `summary`):

```
DEMO ──Log set──► LOGGING(saveSet) ──► CALIBRATE(set 1 only) ──► REST(ring breathes)
                                   └──(sets 2+)──► REST
REST ──ring done / Skip rest──► next set in slot ──► next slot ──► … ──► SUMMARY
```

Reuse wholesale from `today-logger.tsx`: `ensureSession` lazy-create + ref guard (lines 92–102), the 650 ms debounced/immediate `persist` split (lines 136–154), `useRestTimer()`, and the PR haptic (`navigator.vibrate(30)`, lines 172–176). Auto-save is sacred and bulletproof — do not touch it.

---

## 2. The confirm-in-one-tap weight + the novice floor

The engine already emits the one-tap default: `computeHint()` in `lib/progression.ts` returns `{ suggestedWeightKg, suggestedReps }`, and `exercise-card.tsx`'s `acceptHint()` (lines 93–99) applies it. We **pre-bake** that into the set instead of offering an "Apply" banner — the banner is cut. `app/(app)/today/page.tsx` (lines 56–70) already pre-fills each set from `getLastSetsForExercise`; we extend that pre-fill so **Log set** submits a non-null weight on the first tap.

**The blocker** (doc 14 §5, line 82): `computeHint`'s `range` branch gates progression on RPE — `easyEnough = target == null || rpe == null || rpe <= target`. A beginner has no RPE, so route them down a separate RPE-free rule. **Do not rewrite `computeHint`; add a sibling.**

```ts
// lib/progression.ts — NEW, beginner path. computeHint() stays for Lifter Mode.
export function computeBeginnerTarget(
  prev: PrevSet[], repScheme: string, incrementKg: number, units: 'kg' | 'lb',
): ProgressionHint;
// Double-progression a beginner cannot fail (doc 13, doc 14 §5):
//   • all sets hit top of range last session → suggest +incrementKg, reset reps to low
//   • otherwise → hold load, chase +1 rep
//   • RPE is never read.
```

**First-ever lift on a movement** (doc 03 §2): no `prev`, so seed a *conservative floor*, never an empty field:

```ts
// lib/starting-load.ts — NEW
export function startingFloorKg(ex: ExerciseLite, bodyweightKg: number | null, experience: Experience): number;
//   • BODYWEIGHT pattern → 0 (no weight UI; reps only)
//   • else floor = round(coef[movementPattern] * (bodyweightKg ?? FALLBACK_BW) , loadStep)
//   • coefficients are deliberately LOW (e.g. SQUAT 0.35, HINGE 0.40, H_PUSH 0.30, V_PUSH 0.20,
//     V_PULL machine-assisted, ISOLATION 0.05); a "never lifted" Experience halves them again.
```

`bodyweightKg` already exists on `UserSettings` (schema line 149). `Experience` is captured in onboarding (doc 05 §1, screen 3) — add `experience String?` to the per-user settings/profile row. **Deliberately bias the floor toward under-loading:** a too-light bar is recoverable in one set via calibration; a floor too heavy on rep one is a safety event and an instant uninstall.

**Bias calibration toward load increase for weeks 1–3** (doc 11, line 38): the dominant novice failure is *chronic under-loading → a flat day-7 line that reads "this app doesn't work."* So "Just right" still nudges the next session's floor up by one increment for ~3 weeks before settling into pure double-progression.

---

## 3. Post-sensation calibration — replaces RPE-before

**The inversion (doc 00 line 24, doc 03 §2):** ask **nothing** before the set. The floor is pre-filled, the user logs on the first tap, *then* — only after set 1 of a working slot, having felt the weight — the card asks **"How did that feel?"** with three coarse chips, mapping onto the same RPE math the serious lifter uses, dials hidden.

| Chip | Maps to RPE | Effect on next set's load |
|---|---|---|
| **Too easy** | ≈ 6 | `+incrementKg` (one step), this session |
| **Just right** | ≈ 8 | hold this session; nudge next session's floor up (weeks 1–3 bias, §2) |
| **Too hard** | ≈ 9.5 | `−incrementKg` for remaining sets |

```ts
// lib/calibration.ts — NEW
export type Sensation = 'too_easy' | 'just_right' | 'too_hard';
export const SENSATION_RPE: Record<Sensation, number> = { too_easy: 6, just_right: 8, too_hard: 9.5 };
export function applySensation(currentKg: number, s: Sensation, incrementKg: number): number;
```

**Wiring — zero new write path.** The chip writes the mapped RPE onto the *just-logged* set via the existing `saveSet` (`app/actions/session.ts`; the `rpe` field already persists), keeping the RPE corpus intact for Lifter Mode and the coach while the beginner never types a number. The returned `applySensation` value pre-fills the next set's `weightKg` before the rest ring releases. **Asked once per slot, on set 1 only** — never between every set (doc 03 §5). **Cut:** the pre-set feeling-chip (doc 00 line 62) — it demanded a reference a beginner lacks.

---

## 4. The day-7 progress moment — load on the bar, NOT e1RM

`lib/analytics.ts` computes session-best Epley e1RM (`getExerciseSeries`; `epley1RM` in `lib/format.ts` line 84) with a regression slope. **Wrong week-1 yardstick** (doc 14 §4): e1RM is abstract, slow, and the code's own `isLowConfidence(reps > 12)` flag (`lib/format.ts` line 100) proves it's noisy on light novice loads. **Demote e1RM to Lifter Mode** and build a legible load-on-the-bar signal. Every byte needed is already in `SetLog` — an analytics + summary-screen job, no migration.

```ts
// lib/analytics.ts — NEW, alongside the e1RM functions (which stay for Lifter Mode)
export type StrengthSignal =
  | { tier: 'adapted'; exercise: string; text: string }      // fires day 1
  | { tier: 'beat_last'; exercise: string; deltaLb: number } // fires ~day 3-4
  | { tier: 'week_delta'; exercise: string; deltaLb: number; sessions: number }; // ~day 7
export async function getStrengthSignal(userId: string): Promise<StrengthSignal | null>;
// Escalating, top-most that fires wins (doc 03 §4):
//   adapted   — set 3 beat set 1 on load OR reps (nearly always true for a novice)
//   beat_last — top working set load beats the prior session for that lift
//   week_delta— heaviest completed load for a lift now vs its FIRST logged session,
//               in the user's units. "+15 lb on squat since Monday."
```

**Where it surfaces** (no leaderboard, doc 05 §5):
1. **Finish summary** (`SummarySheet`, `today-logger.tsx` lines 418–458, ported into `GuidedRep`'s `summary` state): replace the e1RM-PR headline with *"You got stronger"* + the single `getStrengthSignal` sentence. Volume/sets/time `Stat` tiles stay (the dopamine beat); per-PR `e1RM` rows cut to Lifter Mode.
2. **You tab** — one read-only proof chip, auto-selecting the most-improved lift. No exercise picker, no multi-curve chart.
3. **Core-owned push** (doc 11 line 41, doc 07 line 93): the day-7 `week_delta` fires a Web Push (VAPID) — *"+15 lb on squat this week. Legs today, 38 min, already set up."* The core's own return trigger, surviving the coach's deletion (doc 14 investment #3). Add a `PushSubscription` table, a `sw.js`, and `manifest.webmanifest` — net-new for Phase 1.

**Acceptance:** `adapted` fires for a synthetic novice doing 3 ascending sets; `week_delta` produces a non-null sentence given two sessions a week apart with any load increase.

---

## 5. The form-content long pole — commission day 1

`public/` holds **only `icon.svg`** (verified). `lib/exercise-media.ts` is a 2-frame JPG alternation from `free-exercise-db`, *visibly wrong* on many lifts (`nordic-curl` → barbell curl; `banded-pushup` → clock push-up; `hip-abduction` → hip thrust). A wrong demo teaches the wrong lift and burns the one feature that must be flawless (doc 13 line 7). For the compound core, **commission 10 real looping clips** (3–5s, silent, consistent model/lighting, vertical 1080×1350). Isolation keeps a clean **static diagram** — never a mismatched JPEG.

**The 10 clips to commission** (compounds beginners fear; slugs are real, from `lib/exercise-media.ts`):

- [ ] `back-squat` (barbell back squat)
- [ ] `romanian-deadlift` (hinge / RDL)
- [ ] `barbell-bench-press`
- [ ] `overhead-press`
- [ ] `barbell-row`
- [ ] `lat-pulldown`
- [ ] `leg-press`
- [ ] `goblet-squat` — machine/DB sub for back squat (the safe rep-one default)
- [ ] `machine-chest-press` — machine sub for bench
- [ ] `machine-shoulder-press` — machine sub for OHP

```ts
// lib/exercise-media.ts — NEW resolver replacing the JPG map
export function mediaFor(slug: string): { kind: 'clip'; url: string } | { kind: 'diagram'; url: string } | null;
// COMPOUND_CLIPS (the 10 above) → /media/clips/<slug>.mp4 (served from public/, <video loop muted playsinline>)
// everything else → /media/diagrams/<slug>.svg (commissioned static); null → name + cue only, no media
```

A calendar-time content build that can't be compressed by adding engineers (doc 11 critical path) — start day 1.

---

## 6. What's cut / hidden behind Lifter Mode

One toggle in **You** flips `Today` from `GuidedRep` back to `TodayLogger`. Nothing is deleted; it is demoted from the default surface.

| Hidden in default | Lives in | Reveal |
|---|---|---|
| RPE steppers + `computeHint` RPE-gated path | `exercise-card.tsx`, `progression.ts` | Lifter Mode |
| e1RM charts / slope / per-PR rows | `analytics.ts`, `e1rm-chart.tsx`, `SummarySheet` | Lifter Mode |
| Set-pills, warm-up toggle, superset badges, details | `exercise-card.tsx` | Lifter Mode |
| Swap **matrix** as a destination | `swap-drawer.tsx` | Long-press "Can't do this one?" only |
| Custom/freestyle (`/today/custom`, DayPicker lines 378–389) | `today-logger.tsx` | Lifter Mode |
| Program/blocks, Library, Calendar tabs; tonnage grid | `/program`, `/library`, `/history`, home | Lifter Mode (6 tabs → Today + You) |
| Pre-set feeling-chip | — | **Deleted** — replaced by post-sensation calibration |

---

## 7. Acceptance criteria

| # | Criterion | Pass bar |
|---|---|---|
| 1 | First-session completion (onboarding → ≥1 working set → finish) | **≥ 55%** |
| 2 | Day-7 strength moment fires (non-null `getStrengthSignal` by day 7) | **≥ 50%** of activated |
| 3 | One-tap log never shows an empty weight field | 100% of working sets pre-filled at first tap |
| 4 | Calibration is post-sensation only | chips render after `saveSet`, set 1 only, once per slot |
| 5 | Median squat load rises across weeks 1–3 | positive week-over-week cohort delta |
| 6 | Headline metric is load-on-the-bar | summary + You render `StrengthSignal` text, never an e1RM number |
| 7 | Compound demos correct | all 10 clips show the right lift; isolation → diagram, never a wrong JPG |

**Exit gate (doc 11):** criteria 1 + 2 + 5 green, North-star (Weekly Logged Workouts per Active User) baseline captured. The core must earn the open with the coach deleted.
