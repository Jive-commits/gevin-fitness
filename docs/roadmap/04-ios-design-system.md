# DEEP DIVE — iOS-Native Design System & Information Architecture

*FORGE consumer redesign. Blank canvas, justified against the strategic brief and the existing codebase (`tailwind.config.ts`, `globals.css`, `bottom-nav.tsx`).*

---

## 1. Navigation & Information Architecture

**The verdict on the current 6 tabs: kill 4 of them.** Today's nav — Home, Today, Program, Library, Progress, Settings — is an *org chart of features*, not a map of intent. Six destinations forces the user to navigate as a precondition to acting, which violates the core principle: hide the instrument, expose only the next action. Apple HIG **clarity** means the structure should mirror the user's mental model, and a beginner's model has exactly two thoughts: *"what do I do now?"* and *"am I getting anywhere?"*

**The IA is two tabs — but justified, not inherited.** A tab bar is the right primary navigation control per HIG (flat, persistent, instant, thumb-reachable) — but only when there are 2–5 peer destinations *you return to*. Program, Library, Progress, and Calendar are not destinations you maintain; they are **reference material reached from a moment of need.** So:

- **Tab 1 — Today.** The default and the home. Opens directly onto the built session. 90% of sessions begin and end here.
- **Tab 2 — You.** Identity + progress + the one legible "you got stronger" signal + history + settings, in descending order of emotional payoff. Charts, calendar, and power-user density live *inside* here as drilldowns, not as tabs.

**The coach correctly gets no tab.** A tab is a place you tend; the coach is an *interruption with stakes*. It lives on three non-tab surfaces: (1) onboarding (a full-screen modal flow, run once), (2) a **post-set reaction** that animates in over the logger and dismisses itself, and (3) push/SMS. Giving it a tab would turn an event into a chore and dilute the "it comes for you" mystique — the entire viral premise is that you *don't* go to it. The coach is the marketing hook; the two-tab core has to be killer without it.

**Demotion map (every cut feature still reachable, nothing deleted):**

| Old tab | New home | Reached by |
|---|---|---|
| Home | merged into **Today** | default route |
| Program | drilldown in **Today** | "View full week" link below today's card |
| Library | contextual **swap sheet** | tap an exercise → "Swap" (the only place a beginner needs it) |
| Progress | section in **You** | the day-7 signal sits up top; charts are a "Details" disclosure |
| Calendar / History | section in **You** | a streak strip expands to the calendar |
| Settings | **You → gear** (top-right) | standard iOS placement |

**Navigation grammar (HIG-aligned):**

- **Tab bar** = switch between peer worlds (Today / You). Never used for actions.
- **Bottom sheets** = focused, dismissible tasks that keep you in context (swap, log a custom set, coach onboarding step, "how heavy?"). Matches the existing `BottomSheet` (`components/ui/sheet.tsx`) — good bones, keep the spring, restyle the chrome.
- **Push navigation (slide-in)** = drilling *deeper* into the same world (Today → full week → a specific day). Provides a back affordance and a sense of place (HIG **depth**).
- **Full-screen cover** = the guided rep player and onboarding — total focus, no chrome, the one decision on screen.

**Do:** land the user inside today's first exercise in ≤1 tap from cold open.
**Don't:** make "start workout" a button on a dashboard that's a tab away from a logger that's another tap in. Every tap before the first rep is a churn opportunity for a high-shame user.

---

## 2. The Design System

### 2a. Color — evolve the ember theme, don't replace it

The dark ember theme is a genuine asset and on-brand for "consequence." Keep the dark base and the ember gradient as the brand signature, but **discipline it** into an iOS-native semantic system. The current palette (`globals.css`) uses ember too freely, which reads as "intense gym-bro app" rather than "premium." HIG **deference** demands the UI recede so content leads — ember should be *earned heat*, not ambient decoration.

**Surfaces (true-black-adjacent, OLED-friendly, layered for depth):**

```
--bg:        #0A0A0C   (app background)
--surface-1: #131318   (cards)            ← elevation 1
--surface-2: #1C1C23   (nested controls)  ← elevation 2
--surface-3: #26262F   (pressed / popovers)
--hairline:  rgba(255,255,255,0.08)       ← replaces solid #2a2a33 border
```

**Change from current:** the global `* { border-color }` solid border is too heavy and "Android-y." Switch to translucent hairlines — HIG separators are luminance-relative, near-invisible until needed. Depth comes from *surface luminance steps*, not from drawing boxes.

**Semantic accents (one job each — the discipline the current theme lacks):**

```
--accent-ember: linear-gradient(120deg,#FFB23D,#FF6A2C,#FF2D55)   effort, the brand, the CTA
--success:      #2DE2B6   (mint)   completed set, "you got stronger"
--info:         #5BA8FF   (ice)    neutral data, links
--warn:         #FFB23D            form caution / injury back-off
--text:         #F4F3F0  /  --text-dim:#9B9AA5  /  --text-faint:#5E5D68
```

**The rule that fixes the "not aesthetic" complaint:** ember appears on **exactly one element per screen** — the primary action or the live effort moment (the rest ring, the active set, the CTA). Everything else is greyscale + a single mint "done" state. When everything glows, nothing does. Restraint *is* the premium signal (cf. Linear, Things).

**Do:** ember the "Start" button and the rest-timer ring.
**Don't:** ember the tab bar, card borders, every number, and the streak — the current build's instinct.

### 2b. Typography — SF-style roles, drop Space Grotesk for display

Today's stack is Space Grotesk (display) + Inter (body) + JetBrains Mono (all numbers). For a *native-feeling* iOS app, the strongest move is **SF Pro itself** — on iOS/iPadOS via `-apple-system`, it's free, instantly native, optically tuned. **Replace Space Grotesk with SF Pro Display / `-apple-system`.** Keep **JetBrains Mono but narrow its job:** numbers that are *data you compare* (weight, reps, e1RM) stay mono + tabular; numbers that are *just UI* (a streak count, a timer) move to SF Rounded for warmth. Inter stays as the cross-platform fallback so Android / desktop PWA users get a near-SF experience.

**Type scale (SF roles, 4pt rhythm):**

| Role | Size / line | Weight | Use |
|---|---|---|---|
| Large Title | 34 / 41 | bold | screen titles ("Today", "You") — collapses on scroll |
| Title 1 | 28 / 34 | bold | the day-7 "you got stronger" hero |
| Title 2 | 22 / 28 | semibold | section headers ("Up next") |
| Headline | 17 / 22 | semibold | exercise name on the card |
| Body | 17 / 22 | regular | instructions, coach text |
| Callout | 16 / 21 | regular | secondary guidance ("hard but doable") |
| Subhead | 15 / 20 | medium | labels |
| Footnote | 13 / 18 | regular | metadata |
| Caption | 12 / 16 | regular | tab labels, timestamps |
| Numeric XL | 56 / 56 | mono bold | the live weight in the logger |

**Large titles are non-negotiable** — the single most iOS-native typographic signal, and they create breathing room (collapse to an inline title on scroll). The current app uses tight `text-lg` headers everywhere, which reads dense. **Dynamic Type:** size off `rem` so the OS text-size setting scales everything (accessibility + native feel).

**Do:** "Today" as a 34pt large title that shrinks on scroll.
**Don't:** put body copy in mono — it's a texture for *data*; mono prose feels like a terminal and undermines "approachable for beginners."

### 2c. Spacing, grid, radii

- **8pt grid, 4pt for type / icon nudges.** Base unit = 8. Screen gutters = **20pt** (HIG default), generous. The single biggest "make it feel premium" lever is *adding whitespace*, not adding elements.
- **One content column, ~600pt max** (existing `max-w-xl`), centered — keeps the PWA phone-shaped on desktop and ready for the iOS shell.
- **Vertical rhythm:** 24pt between sections, 12pt within a card, 16pt card padding.
- **Corner radii (continuous / superellipse where possible):** controls 12, cards **16** (down from the current 17, to align to the 8/4 system), sheets **24** (keep), pills 999, the full-screen rep player edge-to-edge (0). iOS uses *continuous* corners; approximate the squircle look via slightly larger radii + matched padding.

### 2d. Depth & material (HIG: depth)

Depth comes from **translucency and luminance**, not drop shadows.

- **Tab bar & nav:** `bg-surface/80` + `backdrop-blur-xl` + top hairline (the current nav already does this — keep). Translucency tells the user content continues beneath = depth.
- **Sheets:** opaque `surface-1` rising over a `bg-black/60 backdrop-blur-sm` dimmed, scaled-down parent. The parent should recede slightly (`scale 0.96`) — the classic iOS sheet-stacking cue. The current sheet dims but doesn't recede the parent; **add the parent push-back.**
- **Shadows:** one soft ambient shadow for floating elements only (`0 12px 40px -16px rgba(0,0,0,.7)`). No ember glow-shadows on resting cards — reserve glow exclusively for the *live* rest ring.

**Do:** blur the tab bar so the workout list scrolls under it.
**Don't:** stack hard `shadow-ember` on every card (current `boxShadow.ember`) — it's the #1 reason it reads "gamer," not "Apple."

### 2e. Motion & spring

Native iOS motion is **spring-based, interruptible, and purposeful**. Framer Motion is already in the stack — codify three springs as tokens:

| Token | Curve | Use |
|---|---|---|
| `spring.snappy` | stiffness 500, damping 34 | taps, toggles, tab indicator (matches current nav) |
| `spring.smooth` | stiffness 380, damping 32 | sheets, push transitions (matches current sheet) |
| `spring.gentle` | stiffness 200, damping 26 | rest ring, hero reveals, coach entrance |

- **Tab / nav indicator:** keep the `layoutId` shared-element morph (the current nav's best detail).
- **Set completion:** the logged row settles with a mint fill that *wipes* left→right (75ms), the number does a subtle scale-pop, the rest ring springs into existence. This is the dopamine beat — the "one honest number moves" moment.
- **Coach reaction:** slides up from the bottom edge on `spring.gentle`, holds ~3.5s, auto-dismisses — it *reacts to the work, never narrates during it.*
- **Large-title collapse:** title scrolls from 34→17pt and parks inline under a blurred bar — pure iOS.
- **Always honor `prefers-reduced-motion`** (already wired in `globals.css`) — springs become instant cross-fades.

**Do:** make completing a set *feel* like a thunk of progress.
**Don't:** animate decoratively (looping pulses on idle elements, like the current `pulse-ember`) — motion must mean something or it's noise.

### 2f. Haptics

The PWA has the `navigator.vibrate` floor today; the Capacitor iOS shell unlocks real `UIImpactFeedbackGenerator`. Map haptics to **meaning**, sparingly:

- **Set complete** → `medium` impact (the core reward — make it physical).
- **Rest timer ends** → `success` notification haptic + a local notification if backgrounded.
- **Stepper +/-** on weight / reps → `selection` tick (the "Watch crown" feel — makes dialing a weight satisfying).
- **PR / day-7 progress moment** → `success` haptic paired with the hero animation.
- **Coach savage text arrives** → `heavy` impact (it should *land*).

**Don't** haptic-spam navigation taps — overuse deadens the signal.

### 2g. Iconography

Standardize on **SF Symbols** in the native shell (instantly iOS), with **Lucide** (already installed) as the PWA fallback, chosen to rhyme with SF Symbols (consistent stroke weight). Rules: outline by default, filled when active (the tab-bar convention), `regular` weight, optically sized to the 17pt text baseline. Two tabs need exactly two icons: **bolt** (Today) and **person** (You). Active = filled + ember; inactive = outline + `text-faint`. Cut the 6-icon zoo.

### 2h. Component patterns (the kit)

The few components the surviving feature set actually needs — each world-class, nothing speculative:

1. **Exercise Card (the hero of Today).** One per movement. Headline name, a silent looping form-demo thumbnail, plain-language target ("8 reps · a weight that's hard but doable"), and the set steppers. Tap → expands to the **full-screen guided rep player.** This is where the design budget goes.
2. **Stepper (`ui/stepper.tsx`, exists — restyle).** Big tap targets (44pt min, HIG), mono numerals, `selection` haptic, long-press to accelerate. The most-used control — must feel like a physical dial.
3. **Rest-Timer Ring (`logger/rest-timer.tsx`, exists).** The one place ember *glows.* A breathing conic-gradient ring, the only ambient motion in the app, on `spring.gentle`.
4. **Primary CTA.** Ember-gradient, full-width-minus-gutters, 17pt semibold — the *only* ember-filled button on any screen.
5. **Bottom Sheet (exists).** Add parent push-back + grabber. The workhorse for swap, "how heavy?", coach steps.
6. **Coach Bubble.** Persona-tinted (gentle = ice / mint, savage = ember), arrives on `spring.gentle`, with an inline **Share** affordance that appears *once, post-moment* — never inside the loop.
7. **Progress Hero ("You").** The day-7 legible signal as a Title-1 statement ("You're lifting 15% heavier than week 1"), not a chart. Charts are a "Details" disclosure beneath.
8. **Segmented control** for the gentle↔savage dial and kg / lb — native iOS, defaults to gentle.

---

## 3. Justifying Every Persistent On-Screen Element

The only things on screen *at rest* during a workout, each earning its place:

- **Tab bar (2 items)** — primary navigation; the one persistent chrome. Justified: instant world-switch, thumb-reachable, the most native control. *Hides* in the full-screen rep player.
- **Large title** — orientation + the native signal; collapses on scroll to reclaim space.
- **The current exercise card** — *the* unit of the product; literally the one decision on screen.
- **Primary CTA / set steppers** — the single next action.
- **Rest ring** — only when resting; the live feedback that work registered.

Everything else — program editor, multi-curve charts, library browser, RPE fields, calendar grid, equipment filters — is **a tap away inside a drilldown or a settings toggle, never persistent.** Power-user mode is a single switch in **You → Settings** that re-enables density (RPE inputs, full week, raw charts) for the founder-type lifter, defaulting off. If an element can't be tied to *"what do I do now?"* or *"am I getting stronger?"*, it does not appear by default.

That is the whole IA thesis: **subtract until only the next action remains, then make that one action world-class.**

---

*Relevant files grounding this redesign: `app/globals.css` (theme tokens to evolve), `tailwind.config.ts` (ember / mint / ice palette, radii, springs), `components/nav/bottom-nav.tsx` (6-tab nav to collapse to 2), `components/ui/sheet.tsx` (keep spring, add parent push-back), `components/ui/stepper.tsx` and `components/logger/rest-timer.tsx` (the two world-class controls), and `app/layout.tsx` (swap Space Grotesk → SF Pro / `-apple-system`).*
