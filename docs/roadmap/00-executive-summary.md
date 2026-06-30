# FORGE — Executive Summary

*The first document you read. The whole roadmap in one sitting. If you read only this page, you know the bet, the plan, and what we refuse to build.*

---

## The vision, in one paragraph

FORGE is the fitness app that answers **"what do I do right now?"** with zero thinking — for the 22–32 year-old who owns the gear, has the membership, watches the content, and still cannot string two weeks together. They have restarted four times. They are high-intent, high-shame, high-churn, and chronically online — and the one fact that reshapes the entire product is that **they do not actually know how to lift.** The market drowns this person in information; we sell the missing layer between knowing and doing. You open FORGE, today's session is already built, you tap once, you're walked rep-by-rep so you never feel lost or unsafe, and by Friday a real number on the bar has gone up. A coach that knows your data comes for you when you ghost. That's it. That's the product.

## The wedge

The wedge is **consequence**: the first fitness app where not showing up *costs you something* — a coach that texts you like it has stakes in your life. But the wedge is a marketing hook, not the reason anyone stays, and we never confuse the two. Virality is the **artifact the user chooses to post**, never a referral loop. The unit is a screenshot of a text so specific it feels earned: not "get up, bitch" (a meme that dies in one screenshot) but *"it's 7:14, you said legs, this is the wedding you cried about in onboarding"* (a cult that compounds). **Personalization is the product; profanity is the packaging.**

## The retention thesis (the real moat)

Delete the coach entirely and FORGE must still earn the open. It does — because we move the reward from *data entry* to *competence you can feel*. A non-exerciser churns because every other app makes them **decide**: what workout, what weight, am I doing this right, did it even count. Those decisions are where shame and abandonment live. FORGE removes every one of them:

| The decision every app forces | What FORGE does instead |
| --- | --- |
| What do I train today? | Session pre-built; cursor pre-advances tomorrow |
| What weight? | Engine proposes; you confirm in one tap |
| Am I doing this right? | One move full-screen with a real form clip |
| How hard was that? | Asked *after* the rep ("Too easy / Just right / Too hard"), never before |
| Did it even count? | A legible "+15 lb on squat since Monday" by day 7 |

The naked loop — **open → today's session already built → one tap → walked rep-by-rep → one honest number moves** — is self-reinforcing and survives the coach's deletion. The coach drives the install spike; the naked loop converts the laughers into keepers. The deeper moat is the **accumulating per-user emotional corpus** — your why, your wedding, your four restarts, your logged history — which a fast follower cannot cold-start. A clone ships the format in a quarter; it cannot ship *your* eighteen months of context. That moat is real **only if the keeper retains**, which is why we measure the D90 curve before we believe it.

## The bet

> **Logging is confirmation, not data entry.** The engine proposes; the user confirms in one tap. The beginner who can't pick a weight never sees an empty field — they log the engine's conservative floor on the first tap, then judge effort *after* feeling the weight. Same progression engine a serious lifter uses; we hide every dial.

Everything rides on that inversion working for someone who can't hinge. If post-sensation calibration genuinely moves load on the bar for a true novice, the core is killer. If it doesn't, the core fails its user. So that's the **first thing we test**, ahead of everything.

## The phased plan at a glance

| Phase | Goal | Headline scope | Gate to pass |
| --- | --- | --- | --- |
| **0 — Foundation** | Multi-user, billable, safe | Thread `userId` through all call sites; collapse the `id:"default"` singletons; phone-OTP auth; RLS in parallel | Two real users, fully isolated; cross-tenant integration test green |
| **1 — Killer core** | Make the naked loop world-class | Guided rep full-screen; post-sensation calibration; **10 compound form clips**; legible week-1 strength signal; 6 tabs → 2; core-owned "your session is ready" push | First-session completion ≥55%; D7 progress moment fires ≥50% |
| **2 — Viral loops** | Turn the artifact into distribution | Roast / recap / streak-flex share cards (offered once, post-moment); durable scheduler; async Grok; **output post-filter + crisis circuit-breaker** | Organic shares/active user ≥0.30; ≥25% hit north-star |
| **3 — Native + money** | App Store presence + revenue | Capacitor shell (remote URL); HealthKit read-only → coach; APNs; 10DLC + premium SMS; behavioral in-character paywall; **Savage ships locked** | Approval with persona intact; free→paid 3–6%; ~85% gross margin |
| **4 — Scale** | Pour fuel once the bucket holds | Paid amplification of top organic; win-back; Health Connect; selective RN only where measured jank hurts | North-star ≥35% and defensible; $75–150k MRR plausible |

**North-star:** Weekly Logged Workouts per Active User (3+, held 4 weeks). **Inputs:** first-session completion, the day-7 visible-progress moment, organic shares per active user.

## The two critical-path items engineering cannot compress

1. **Real form content.** `public/` holds one SVG and zero form media. We commission **10 clips for the compound lifts beginners actually fear** (squat, hinge/RDL, bench, OHP, row, lat pulldown, leg press, three machine subs) starting day one of Phase 1. Isolation work ships a clean static diagram — never a mismatched stock JPEG, which teaches the wrong lift and burns trust on the one feature that must be flawless.
2. **App Store review.** We budget **2–3 rejection cycles as a named schedule risk**, not a mitigated checkbox. Savage ships *locked* behind a one-time explicit-consent interstitial; reviewers see a gentle app.

## The top 5 priorities

1. **The guided rep must be genuinely world-class — including real form clips for the compound core.** It is the movie; everything else is the trailer. A wrong-exercise slideshow is not it.
2. **The week-1 "you got stronger" moment must be legible by day 7 — load-on-the-bar, not e1RM.** D30 is mathematically downstream of D7; this is the highest-leverage retention fix in the entire roadmap, and the **post-sensation calibration fix** is what keeps that number real instead of a flat line from chronic under-loading.
3. **The default, shippable coach text must quote the user's own onboarding every time** — not just at max intensity. This is the difference between a spike that dies and a cult that compounds.
4. **Tenancy + phone-OTP auth before user #2.** Cheapest now, a rewrite later; it gates billing, the coach, and everything downstream. "Retrofit later" is a fiction — the singletons are load-bearing in every query.
5. **Subtract ruthlessly and keep the discipline.** Two tabs (Today and You — the coach gets no tab). One primary action per screen. Ember on exactly one element. Lifter Mode hides the instrument behind a toggle. The deterministic gate + template fallback keep the coach cheap and unbreakable. **Restraint is the premium signal.**

## What we are proud NOT to build

The cuts are the strategy, not a compromise. We will not build: the "send Coach after your friend" referral loop (a harassment vector and a guaranteed rejection); wearable six-source ingestion (a feature for people who already work out — the opposite of our beachhead); full HealthKit in v1; SMS as the primary channel; a React Native rewrite before PMF; RPE-by-default, periodization, manual program editing, multi-curve charts, and the exercise library / calendar as standalone tabs (all demoted behind a dormant Lifter Mode, nothing deleted from the codebase); a streak ribbon over the one decision on Today (a streak counter is a liability counter for a four-times-restarter); a pre-set feeling-chip before the first rep; and **any screen with more than one primary action.**

---

**The bottom line.** We already built an excellent lifter's instrument. The discipline of this entire plan is refusing to fall in love with it. Five features survive and must be flawless — the pre-built Today, the guided rep, the two-tap auto-saved log, the legible week-1 signal, and the coach that quotes your why. Everything else we cut, hid, or demoted with conviction. The tagline is no longer "a precision instrument for serious lifting." It's **"Stop starting over."** That's the only line that names the pain instead of the feature — and naming the pain is the whole job.
