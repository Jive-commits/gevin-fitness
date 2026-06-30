# Risks & Open Questions

*The honest ledger. This is where the plan is allowed to be wrong. Every other doc states what we believe; this one states what could kill us, what we'd be embarrassed to have missed, and the cheapest experiment that turns each open question from an argument into a fact. The mandate holds here too: we do not add a safeguard, a metric, or a feature to feel thorough — every item below earns its place by guarding something load-bearing, or it gets cut.*

---

## 1. The one-paragraph honest truth

The core loop is genuinely good and already half-built — `today/page.tsx` resolves a session, pre-fills sets, auto-saves, and advances the cursor. But the loop is good in *mechanism* and untested in *content* for the one user we're building for: the person who **cannot lift and cannot judge effort.** Two bets carry the whole plan, and neither is proven: (1) the progression engine works when a never-lifted user drives it with a feeling instead of a number, and (2) a "you got stronger" signal is legible by day 7. If either is false, the core fails its user and no amount of viral coach text saves it. Everything below is downstream of that.

---

## 2. Risk register

Ranked by *expected damage* (likelihood × blast radius), not by how scary it sounds.

| # | Risk | Likelihood | Blast radius | Mitigation / guardrail | Owner signal that it's breaking |
|---|------|-----------|--------------|------------------------|----------------------------------|
| R1 | **Measurement-validity collapse.** A novice's "Just right" is miscalibrated; the engine faithfully stalls them; the D7 number goes flat. | High | Fatal — kills the #1 retention feature | Calibrate *after* sensation (ask "Too easy / Just right / Too hard" only post-rep); novice-overload load tilt for weeks 1–3 | Median squat load flat across weeks 1–3 |
| R2 | **The leaky bucket.** Viral spike imports the lowest-intent slice of an already-churny segment; D90 bleeds to single digits. | High | Fatal to the business, not the product | Throttle paid spend the instant first-session completion or the D7 moment sags; measure the D90 keeper curve, never installs | D90 keeper curve fails to flatten above ~25% |
| R3 | **Floor violation ships.** Hard limits are LLM-instructed prose at temp 1.1 (`voice.ts`), not enforcement. One slur in 10k sends, screenshotted, is the reputational event. | Medium | Severe — brand + App Store removal | Deterministic post-filter denylist *after* generation, *before* send → fall back to template, log the hit | Any floor hit in the adversarial send corpus |
| R4 | **Vulnerable-user harm.** Coach fires *at the moment of failure* — the lowest emotional point — and the injury break depends on the model noticing (`voice.ts:228`). | Medium | Severe — real harm + liability | Deterministic crisis circuit-breaker in `triggers.ts`: self-harm/ED lexicon OR 2+ "I can't" replies → force Mentor + surface 988, independent of the LLM | Any crisis-lexicon inbound that did not downgrade |
| R5 | **App Store rejection of Savage.** Reviewers tap Savage, screenshot "little bitch." Our consent model is invisible at review time. | High (2–3 cycles) | High — blocks launch, not the product | Ship Savage *locked*; default Mentor; unlock post-install behind a profane-consent interstitial; document in Review Notes; 17+ | Each rejection round-trip = multi-week slip |
| R6 | **Form-content long pole slips.** `public/` holds one SVG, zero form media. 25 bespoke clips is a net-new film project on the critical path. | High | High — guided rep ships hollow | Scope to **10 compound clips** (the lifts beginners fear); isolation gets a clean static diagram, never a fake demo; commission day 1 | Clip QA not done when Phase 1 needs to ship |
| R7 | **Cross-tenant data leak** during the 83-site `userId` migration. One missed `where` leaks across users. | Medium | Severe — trust + legal | Ship `userId` filters + a cross-tenant integration test as the blocker; add RLS in parallel as fail-closed backstop | Integration test reads another tenant's row |
| R8 | **Webhook latency breach.** The inline Grok call has a 20s `setTimeout` abort (`voice.ts:152`) inside the Twilio reply path; under load it breaches Twilio's webhook limit. | Medium | Medium — channel breaks, not the app | Move the Grok call async off the webhook; ack Twilio immediately, send the reply out-of-band | p95 webhook latency climbs toward the Twilio ceiling |
| R9 | **TCPA exposure.** Quiet hours key off the stored `profile.timezone` (`nudge.ts`), not the recipient's actual location. A traveler gets a 2am profane text. | Low–Med | Severe $$ — $500–$1,500/msg, class-actionable | IP/device-inferred location + a 9am–8pm-local hard clamp on SMS; re-confirm consent on number change; immutable STOP audit log | Any send outside recipient-local 9–8 |
| R10 | **No moat.** Every single feature is an 8-week clone; the meme decays in one screenshot. | Medium | Strategic, slow-acting | The only compounding asset is the **per-user emotional corpus** (the why, the history) — and it compounds *only if the keeper retains* (see R2) | A funded competitor ships guided-rep + coach |
| R11 | **Carrier silent throttle.** 10DLC + SHAFT tokens ("bitch/pussy") trips carrier filters regardless of consent — no ban, just silent delivery decay. | Medium | Medium — premium channel rots invisibly | Heavy profanity stays **push-only**; SMS runs a softened, SHAFT-free sender; push is the default channel so launch never blocks on carrier reputation | SMS delivery rate drifts down with no error |

---

## 3. The hard tensions (where two true things fight)

These are not bugs; they are genuine trade-offs where both sides have a real claim. We resolve, not average.

- **Auto-progression vs. the true beginner.** The engine does progressive-overload math for a serious lifter; a beginner needs a low floor and encouragement. *Resolution:* same engine, dials hidden, calibration moved to *after* the rep, with a deliberate novice-overload tilt — because the failure mode is under-loading, and an empty-barbell stall reads as "this app is broken." Unproven until R1's experiment runs.
- **"Daily-open" vs. the truth.** Lifting is a 3x/week activity; the naked loop is structurally a 3x/week loop. *Resolution:* stop saying "daily open." The north-star is **Weekly Logged Workouts per Active User**, and we don't bloat the tool chasing a daily habit the activity doesn't support.
- **The coach is the hook vs. the coach is not the product.** It drives the install spike and it must not be load-bearing for retention. *Resolution:* keep one core-owned push trigger ("your session is ready") that is independent of the coach — without it, "the loop survives the coach's deletion" is literally untestable.
- **Savage-as-growth vs. Savage-as-harm.** The intensity that goes viral can shame a scared beginner out on attempt five. *Resolution:* gentle default, savage opt-in and *earned*; contempt aimed at the **typed excuse**, never the person or the absence; the *return* is always celebrated in gentle voice regardless of dial.
- **Specificity sells vs. omniscience isn't built.** "Plugged into all your data" is a week-4 feature sold as a day-1 hook. *Resolution:* v1 "all your data" = the data we already own (logged sessions, streak, the emotional why). That is enough for a screenshot-worthy text on day 1.

---

## 4. Red-team findings we adopted (and the one we rebutted)

The review packet forced real changes. We list them so nobody re-litigates a settled call.

- **Adopted — calibrate after sensation, not before.** We deleted the pre-set "Lighter / About right / Heavier" chip; it asked a beginner for a reference they don't have. This is the single highest-value change in the packet because it de-risks R1.
- **Adopted — Savage ships locked + a real post-filter + a deterministic crisis breaker.** Prose hard-limits became enforced ones. (R3, R4, R5.)
- **Adopted — paywall never rides the re-engagement moment.** Monetize the win (a logged PR), not the wound (the ghost). A returning four-times-quitter meeting a paywall-shaped insult leaves for good.
- **Adopted — cut the scope.** 25 clips → 10; cut the Today form-demo thumbnail strip (banned ambient motion), the streak ribbon on Today (a liability counter for a restarter), Sign in with Apple, and the fleet-control suite (one tenant; template fallback already covers outages).
- **Rebutted — "there's no moat."** Any single feature is a clone, true. But the accumulating per-user emotional corpus cannot be cold-started by a second mover. The concession: this only counts **if the keeper retains**, which is why the D90 curve — not first-session completion — is the first thing we measure.

---

## 5. Open questions → cheapest experiment first

Ordered. We do not run experiment N+1 until N has a verdict, because each one can invalidate the next.

| # | Open question | Cheapest experiment | Pass bar |
|---|---------------|---------------------|----------|
| Q1 | Does post-sensation calibration actually move load on the bar for a true novice? | Recruit 15–20 never-lifters; run 3 weeks of the wrapped engine; log load only. No new UI build needed beyond the chip. | Median squat load rises across weeks 1–3, not flat |
| Q2 | Is the D7 strength signal legible, and does the D90 keeper curve flatten above ~25%? | Instrument the existing cohort; read the curve. No build — just analytics on data we own. | D7 "you got stronger" moment fires for ≥50%; D90 flattens >~25% |
| Q3 | Does the core-owned push alone (coach deleted) sustain weekly logged workouts? | A/B: cohort with the "session ready" push and **no coach texts** vs. control. | Push-only cohort holds north-star within noise of control |
| Q4 | Does the post-filter + circuit-breaker hold zero floor-violations? | Run an adversarial prompt corpus through generation → post-filter, offline. No users involved. | Zero floor violations before Savage unlocks to anyone |
| Q5 | Where does the form content come from — build, license, or generate? | Price all three for the **10 compound moves only**; pick on cost × calendar time, not fidelity alone. | A QA-passed source secured before Phase 1 ship |

**Why this order:** Q1 is first because if calibration doesn't move the bar, the D7 signal (Q2) has nothing to show, the core push (Q3) has nothing to retain, and the coach (Q4) is decorating a corpse. The cheapest experiments are also the earliest — Q1 and Q2 need almost no new code, only honest measurement of data we already have.

---

## 6. The line we hold

Five features survive and must be flawless: the pre-built Today, the guided rep, the two-tap auto-saved log, the legible week-1 strength signal, and the coach that quotes your why. Every risk above guards one of those five or the trust that lets them ship. We are not adding a sixth thing to feel safe. The discipline that makes the product premium is the same discipline that makes this list short: **we guard what's load-bearing and we let the rest break.**

*Get up. The bucket only holds if the core delivers.*
