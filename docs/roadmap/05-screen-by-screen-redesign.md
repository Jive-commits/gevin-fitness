# FORGE — Screen-by-Screen Redesign

*Blank-canvas redesign. The current app is a six-tab power instrument; this is not a polish pass on it. Every element below earns its place or it's gone. Design system: near-black canvas, one ember accent reserved for the single primary action per screen, SF-style large titles, generous 20–24pt margins, bottom-sheet flows, spring motion (stiffness ~200, damping ~26), haptics on every state change. Two tabs — **Today** and **You** — rendered as an iOS segmented tab bar with a blurred material background. The coach has no tab; it lives in onboarding, post-set reactions, and your texts.*

The core app must be killer with the coach deleted. The coach is the marketing hook, not the reason anyone stays. Retention comes from the naked loop being effortless and genuinely great. The default answer to any new element is **no**.

---

## 1. Onboarding / Coach Intro

**Purpose.** Convert a chronically-online, four-times-restarted, high-shame installer into someone who finishes a real rep before they close the app — while harvesting the emotional *why* that makes every future text land. First-session completion is the input metric; this screen exists to earn it.

**Layout — a vertical card stack, one decision per screen, no twelve-dot progress bar.**

1. **Cold open** — the FORGE mark, one line (*"What do I do today? We'll answer that in 60 seconds."*), one button: **Start**.
2. **Goal** — six large tappable tiles (lose fat, build muscle, get stronger, stay consistent, athletic, health) from the existing `GOAL_OPTIONS`. One tap advances; no Next button.
3. **Experience** — three tiles: *Never really lifted / I've dabbled / I know my way around*. This single answer routes everything — starting load floor, whether RPE ever appears, the coach's default gentleness.
4. **The why** — the conversational intake (`OnboardingChat` against `coachChatTurn`), opening with the real `INTAKE_OPENER`: *"What's the one thing you actually want — be specific, not 'get in shape.'"* It digs twice, stores `why` / `whyDeeper` / `identity`, then ends.
5. **Coach reveal** — the persona picker showing real `samples` from the catalog, defaulted to **Mentor**, with Savage visibly *locked* behind an "earn it" chip.
6. **One scheduling line** — which days, prefilled to a sane 3.

**The ONE primary action: tap Start, end on your first guided rep.** Onboarding does not dead-end on a settings screen (today's `coach-card` "not onboarded" state links to `/settings` — a confession of the old IA). It hands straight to a single bodyweight or empty-bar movement: *"Let's do one set so today isn't zero."* The aha is a logged rep, not a completed form.

**Cut vs. the current app.** No units / equipment / back-safe / increment configuration up front — those are `UserSettings` defaults beginners can't answer and don't need; surface them later, contextually, in power mode. No program selection — there is one program and it's chosen. No "lock in my profile" terminal button as the finish line. No persona intensity dial on first run.

**Native details.** Cards push horizontally with a spring; the chat keyboard uses an inline accessory, never a modal. Tiles give a light haptic on tap, medium on the screen that advances. The savage-locked chip rubber-band shakes if tapped — denial as foreshadowing.

---

## 2. Home / Today

**Purpose.** Answer "what do I do right now?" with zero thinking. This is the naked loop's front door and the app's true home; it must work with the coach deleted.

**Layout — one hero card, nothing else above the fold.** Large title *Today* with the date beneath. Then a single full-bleed **session card**:

- The split in plain language (*"Push day — chest, shoulders, triceps"*, not `PUSH`).
- The human duration (*"About 40 min · 5 moves"*).
- A thumbnail strip of the first three exercises' looping form demos as a silent preview.
- One button filling the card's base: **Start**.

Below the fold, only if earned: a slim **streak ribbon** (*"3 weeks · this is the longest you've gone"*) and one **proof-of-progress** chip (Screen 5). That's the entire screen.

**The ONE primary action: Start.** Everything else is a peek you can ignore.

**Cut vs. the current app — the most aggressive cut.** The real `home/page.tsx` renders, in one scroll: a coach card, a Next-up CTA, a 35-day activity calendar with a "tap a 🔥 day" hint, a four-tile stats grid (total volume, sessions, days trained, working sets), and a recent-PRs list — five competing sections, each with its own "see all" link.

| Old section | Fate | Why |
|---|---|---|
| Coach card + pep-talk buttons | Removed from home | Stops competing with the one Start decision |
| 35-day activity calendar | Demoted into **You** | A drilldown, not a daily decision |
| 4-tile tonnage/working-set grid | Power mode only | Vanity metrics a beginner can't interpret |
| Recent-PRs list | Replaced by one week-1 chip | One legible signal beats a leaderboard |
| Freestyle/custom workout entry | Removed from home | A power path reached *inside* a session, never a co-equal choice that makes a beginner pick |

**Native details.** The session card is a real `.regularMaterial` panel that lifts on press (scale 0.98, spring back). Start fires a medium haptic and a shared-element transition: the card's title and demo strip fly up into the workout header so context never breaks. Pull-to-refresh re-fetches the day. On a rest day the hero flips calm — *"Rest day. Recovery is the work."* — and the button becomes a low-emphasis *"Train anyway."*

---

## 3. The In-Workout Experience

**Purpose.** The one world-class feature this quarter: walk a beginner rep-by-rep so they never feel lost or unsafe. The design budget goes here.

**Layout — one exercise, full screen, nothing else.** The sharpest break. Today's `TodayLogger` shows *all* slots as an accordion of `ExerciseCard`s, each crammed with set-pills, weight/reps/RPE steppers, a swap button, a progress sheet, a hint banner, a warm-up toggle, and a details link — a power-user worksheet. The new screen shows **a single move**:

- A large silent looping form demo on top (`ExerciseAnimation` + the existing two-frame `EXERCISE_MEDIA` asset).
- The target in human language below — *"8 reps — a weight that's hard but doable"*, never `3 × 8-10 @ RPE 7`.
- One big primary control: **Log set**.

Tapping it commits the set and starts the rest ring, which **breathes** full-screen with the count and a single *"Skip rest."* When rest ends, a spring carries you to the next set or move. A thin segmented bar at the very top (●●○○○) is the only density — it shows where you are, nothing tappable.

**The ONE primary action: Log set.** Weight and reps sit as two quiet inline steppers pre-filled from last time via the existing auto-progression engine — the beginner just accepts and taps; the numbers are confirmation, not data entry. **RPE never appears** unless power mode is on.

**Cut vs. the current app.**

- The whole-workout accordion view → one move at a time.
- The per-card Swap / Progress / Warm-up / Details row → gone from default. Swap is a long-press on the demo (*"Can't do this one?"*); warm-ups auto-insert for loaded compounds; details and the progress peek move to power mode.
- Session-reset, day-picker, and superset-group affordances in the header → gone for beginners.
- The progression *hint banner* as a separate "Apply" card → gone; the suggestion is silently baked into the pre-filled weight.

The auto-progression math stays (it's good). Every dial it exposes is hidden.

**Native details.** Logging a set fires a satisfying haptic and a check that fills with a spring. The rest ring uses the existing `RestTimerProvider` but goes full-bleed and ambient. A **PR is a moment, not a banner**: the existing Epley e1RM detection triggers a brief gold particle bloom and a heavier haptic — screenshot-worthy. The last move slides up a clean summary sheet (`FinishSummary` already holds volume/sets/time, but lead with *"You got stronger"* + the single legible signal). Swipe-down anywhere pauses without losing state — the auto-save debounce already persists every set.

---

## 4. The Coach Chat / Feed

**Purpose.** Deliver the viral artifact and re-engagement. Explicitly **not a tab** — a tab implies a place you maintain; the coach is an interruption.

**Layout — a thread you arrive at, never browse.** Reached by tapping a coach text (push/SMS deep link via the existing `NudgeLog`) or a small avatar in **You**. iMessage-style: the coach's nudges on the left, pulling real specifics from the `why` / streak / last-session data — enough for screenshot-worthy texts. A persistent **Share** button sits on any coach message — the *only* place sharing exists. The composer is minimal; the coach reacts, it doesn't host a conversation. A single pinned chip at top — *"Mentor · climbing toward Savage"* — shows the dial state.

**The ONE primary action: Share (screenshot/export the text).** Virality is the artifact, not a referral — there is no "send coach after a friend." The `coachPepTalk` generator survives as a manual trigger here, not on home.

**Cut vs. the current app.** The home-screen `CoachCard` with its inline bubble + "Get a pep talk" / "Another" buttons → gone from home; the coach stops competing with the Start decision. Persona / intensity / SMS config → moved entirely into **You** (setup, not conversation). Share prompts inside the logging loop → never built.

**Native details.** New texts arrive with a typing indicator and a haptic. Savage messages render with a subtle ember edge-glow. Share invokes the native share sheet with a pre-composed image card (text on a branded gradient — the TikTok unit). The safety floor is enforced server-side in `voice.ts`; if the coach backs off on injury, the bubble visibly softens tone.

---

## 5. Progress

**Purpose.** Fire the week-1 "you're getting stronger" moment. Estimated-1RM is too abstract and too slow for a beginner; it cannot be the headline.

**Layout — one sentence, then one chart.** Lives as a section inside **You**. The hero is a plain-language strength statement: *"You're lifting 15 lb more on chest press than week one."* Beneath it, a **single** clean sparkline (the existing `Sparkline` / `e1rm-chart` components, restyled) for the user's most-improved lift only — auto-selected, not picked. A "Show all lifts" row drops into power mode.

**The ONE primary action: none — this screen is read-only proof.** Its job is to be *seen*, not operated.

**Cut vs. the current app.** The exercise-picker bar, the multi-curve e1RM chart, the volume heat chart, and the four-stat tonnage grid → all demoted to power mode. The week-1 signal is deliberately **load-on-the-bar, not e1RM**: *"you added 10 lb"* is legible on day 3; e1RM only becomes the headline once there's enough data.

**Native details.** The number counts up on appear with a spring; crossing a milestone gives a light haptic. The sparkline draws left-to-right on first view.

---

## 6. Profile / Settings — "You"

**Purpose.** The second tab. Identity, history, coach config, and the **power-user toggle** — the one switch that re-exposes everything this redesign hid.

**Layout — a short grouped iOS list.** Top: name + streak + the progress hero (Screen 5). Then grouped rows:

- **Your why** — editable; re-reading it is itself motivating.
- **Coach** — persona, intensity dial, SMS consent / quiet-hours from `CoachProfile`.
- **History** — the calendar + session log demoted from the old home.
- **Plan** — training days.
- **Power-user mode** — one toggle that turns on RPE, the full multi-exercise logger, all charts, swap / library / program drilldowns, and tonnage stats. Units / equipment / increments live here, not in onboarding.

**The ONE primary action: the Power-user toggle** — the explicit bridge between the consumer app and the founder's instrument. Density is a settings toggle, never the default.

**Cut vs. the current app.** Library, Program, Calendar, and Progress as **standalone tabs** → collapsed into contextual drilldowns here. The six-tab bar itself → replaced by two.

**Native details.** Standard grouped-inset list, large title that collapses on scroll, native switches with haptics. The intensity dial slides; dragging toward Savage shows the safety-floor note inline.

---

## Net Cut

| Dimension | Current app | Redesign |
|---|---|---|
| Tabs | 6 | 2 |
| Home sections | 5 competing | 1 hero card |
| Logging view | All-exercises accordion | One move at a time |
| Analytics | Multi-curve charts + tonnage grid | One sentence + one sparkline |
| Coach | Ambient home clutter | An artifact you arrive at and share |

The naked loop — **open → session built → Start → walked rep-by-rep → one honest number moves** — is now the entire default surface. The instrument still exists, one toggle away. Nothing on screen is there unless it earns the room.
