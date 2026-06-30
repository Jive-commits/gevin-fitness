# Feature Justification & The Anti-Feature List — The Zero-Based Audit

The brief already made the structural calls: two tabs, the guided rep as the one world-class build, a gentle-default coach. This audit does the dirty work underneath those decisions. It goes line-by-line through what we actually shipped and rules on each piece for one person — the beginner who has restarted four times and doesn't know how to hinge.

The bias is subtraction. A feature survives only if it serves the naked loop — **open → today is built → one tap → walked rep-by-rep → one honest number moves** — or makes that loop safe. Everything else demotes, hides, or dies. The default verdict is **cut**. A feature has to argue its way back onto the screen.

One thing the code review changes upfront: our "silent looping form demo" **does not exist yet**. What ships today is `lib/exercise-media.ts` — two static public-domain JPEGs per lift, alternated, and visibly *wrong* on many movements (nordic-curl shows a barbell curl, banded-pushup shows a clock push-up, hip-abduction shows a hip thrust). For a user who doesn't know how to lift, a wrong demo is worse than none: it teaches the wrong movement and erodes the trust the whole product runs on. The single world-class feature is therefore a *net-new content build*, not a polish of an asset we have. That reality sharpens every verdict below.

## The verdict table

| Feature (as built) | Verdict | One-line reason |
|---|---|---|
| **Fixed PPL program** | **KEEP — reframe** | "What do I do today" is the whole wedge. Keep the prescription engine; kill the 6-day rigidity. Beginner gets 3 full-body days, not a lifter's split. |
| **Set logger (steppers, pre-fill, auto-save)** | **KEEP — world-class** | This *is* the naked loop. The two-tap log and "never lost a session" auto-save are already our best asset. Everything rebuilds around it. |
| **Rest timer ring** | **KEEP — simplify** | Removes a real beginner decision ("how long do I wait?"). Keep the breathing ring; cut all config. It just runs. |
| **Guided rep / form demo** | **BUILD (does not exist)** | Today's "demo" is mismatched static JPEGs — actively harmful. This is the one feature we make world-class this quarter. |
| **Exercise library (150+, searchable)** | **HIDE behind swap / power mode** | A database is a power-user tool and a paradox-of-choice trap. It survives only as the *source* the swap drilldown reads — never as a tab. |
| **Swap engine** | **SIMPLIFY to "give me a different one"** | The ranked, multi-factor, back-safe/equipment-filtered engine is genuinely good — but a beginner can't evaluate "same pattern, target as secondary." Collapse to one button returning one safe alternative. Scoring stays under the hood. |
| **Back-safety / spinalLoad model** | **KEEP — invisible** | Our safety floor and a real differentiator. It silently constrains prescriptions and swaps. The user never sees the machinery. |
| **e1RM charts (Epley + regression + slope)** | **CUT from default; demote** | Estimated 1RM is too slow and too abstract for the week-1 progress signal. A kg/week slope is a serious-lifter artifact. Replace, don't tune. |
| **Progress page (volume heat, RPE trend, PRs)** | **CUT / fold into "You"** | Multi-metric analytics is the dense instrument the brief is killing. Keep exactly one "you got stronger" moment; the rest is power mode. |
| **History / calendar** | **SIMPLIFY to streak + last-3** | A beginner needs "I showed up," not a training-load calendar. A streak ring and last few sessions live in "You"; full calendar is power-mode. |
| **Custom exercises (add/edit/delete)** | **HIDE behind power mode** | Authoring exercises is a content-author's job. Zero beginner value, pure complexity surface. Kept for serious lifters, default off. |
| **Manual program editing (sets/reps/RPE/rest, reorder)** | **CUT from default** | Editing the prescription is the *opposite* of "zero thinking." The promise is we decide so they don't. Power mode only. |
| **RPE everywhere (targetRpe, logging, trend)** | **CUT for beginners** | "Rate your reps-in-reserve" is incomprehensible to someone who can't hinge. Progression runs on reps + completion, not self-reported RPE. RPE returns only in power mode. |
| **Auto-progression hints (range/heavy/RPE logic)** | **REBUILD the beginner path** | The engine needs RPE and rep-range fluency the beginner lacks. Keep it for power mode; build a dead-simple rule: hit all reps two sessions running → nudge weight up; missed → hold. |
| **Two 8-week blocks / phases / peaking** | **CUT** | Periodization is a competitive-lifter concept. Irrelevant to "string two weeks together." Power mode only. |
| **kg/lb units, increments config** | **KEEP — minimal** | Unit choice is a one-time, unavoidable real-world need. Auto-set from locale; bury the rest. |
| **AI coach — onboarding (the "why")** | **KEEP — world-class** | Capturing the emotional *why* is what makes the artifact a cult instead of a meme. This is the coach's actual product. Protect it. |
| **AI coach — personas + intensity dial** | **KEEP — default gentle** | Encouraging by default, savage earned/opt-in. The dial stays; the floor (no slurs, nothing sexual, no punching down, backs off on injury) is brand survival. |
| **AI coach — deterministic trigger engine** | **KEEP** | Rules decide *when*, the LLM decides *how it sounds*. Keep cooldowns, de-dupe, token caps, and template fallback so a model outage never breaks the app. |
| **AI coach as a destination/tab** | **CUT the tab** | The coach is an interruption (onboarding, post-set reaction, a text), not a place you maintain. No tab. |
| **SMS (Twilio, STOP/HELP, quiet hours, consent)** | **DEMOTE to premium re-engagement** | Savage moments ship on **push** in v1 — no carrier gatekeeper, no 10DLC long pole. SMS is the gated premium channel. Keep the compliance plumbing; it's load-bearing later. |
| **CSV history import** | **CUT from consumer surface** | A migration tool for one power user (the founder). Keep the script; it never appears in the consumer app. |
| **Bodyweight tracking (BodyMetric)** | **HIDE behind power mode** | Optional, off-loop, and a shame trigger for our exact user. Off by default. |
| **Passcode gate** | **CUT — replace with phone-OTP** | A single shared passcode can't survive user #2. Real auth and tenancy before anyone else logs in. |

## The irreducible KEY feature set

Five things. If any one of these is merely *present* instead of *exceptional*, the product fails its beachhead. Everything in the table above either feeds one of these or gets out of the way.

1. **The pre-built "Today."** Open the app and the session already exists — exercises, sets, target weights pre-filled from last time. Zero setup, zero choice, zero blank page. The answer to the only question our user is asking.
2. **The guided rep.** One exercise on screen, a *correct* silent looping form demo, the target in plain English ("8 reps — a weight that's hard but doable"), tap to log, rest ring breathes, next. The build of the quarter and the gap no competitor nails.
3. **The two-tap log with bulletproof auto-save.** Already our strongest muscle. A logged set is never lost, never gated behind a Save button. Sacred.
4. **The week-1 "you got stronger" moment.** A legible, early, concrete signal by day 7 — "you added 10 lb to your squat since Monday," not an e1RM slope. Non-negotiable: it's the input metric that predicts retention.
5. **The coach that quotes *your* why.** Gentle by default, escalating to earned-savage, firing on a deterministic gate, weaponizing the onboarding *why* and the skipped day. Personalization is the product; profanity is the packaging.

## WHAT WE WILL NOT BUILD

- **A "real form demo" by mismatched stock photos.** We will not ship the current `exercise-media` JPEGs as the "form demo." A wrong demo teaches the wrong lift and burns the one feature that has to be flawless. Build it right or do not ship the guided rep claiming visual guidance.
- **RPE-by-default, periodization, and manual program editing.** Lifter instruments. They make the beginner feel stupid and contradict "we decide so you don't." Power mode only, default off.
- **The exercise library, calendar, and charts as standalone tabs.** Paradox-of-choice and dense-instrument surfaces. They survive only as contextual drilldowns or under the power toggle.
- **e1RM/Epley as the headline progress metric.** Too abstract, too slow for week 1. We will not let the abstract number be the thing a beginner is asked to care about.
- **A "send the coach after your friend" referral loop.** A harassment vector and an App Store rejection. Virality is the screenshot the user *chooses* to post — never an outbound weapon aimed at a third party.
- **Wearable / Whoop / Oura / Garmin / Terra ingestion and full HealthKit (v1).** Six-source data is a feature for people who already train — the opposite of our user. HealthKit waits for the native shell (Phase 2).
- **SMS as the primary channel.** Push carries the savage moment in v1; SMS is gated premium re-engagement behind 10DLC. We will not block launch on carrier registration.
- **A React Native rewrite before PMF.** Capacitor wraps the PWA for iOS v1. We do not spend the pre-PMF budget on a rewrite.
- **Any screen with more than one primary action, and share prompts inside the logging loop.** One decision on screen at a time. Sharing is offered once, post-moment, then disappears. We will not turn a habit tool into a content treadmill.
- **A coach tab, a custom-exercise authoring surface, and bodyweight logging in the default experience.** Each is a maintenance destination or a shame trigger that earns nothing for the naked loop. Hidden or cut.

## The throughline

We already built a genuinely excellent *lifter's instrument* — the swap scorer, the back-safety model, the auto-save logger, the regression charts are real engineering. The mistake would be to fall in love with it. For the beginner who has restarted four times, most of that sophistication has to go invisible or go away, so that **five things can be world-class instead of fifty things being merely present.**

No adding shit. Earn the pixel or lose it.
