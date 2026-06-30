# Growth & Go-To-Market Engine

> **First-principles mandate.** The AI coach is the marketing *hook*, not the reason people stay. The core app — an effortless guided workout for people who don't know how to train — must be killer on its own. Every loop below is wired to a mechanic that already exists in the codebase. We are not inventing growth surface; we are exploiting what the product already does.

## The one-sentence thesis

**The artifact is the ad, the guided rep is the retention, and the bridge is the one thing competitors can't copy: the coach quotes your own onboarding back at you.**

"Get up, bitch" is the thumbnail. "It's 7:14, you said *legs*, this is the wedding you cried about in onboarding" — generated today by `buildUserMessage` injecting the user's stated `why` + streak + days-since — is why the screenshot gets 2M views *and* why the install doesn't churn. Profanity is packaging. Personalization is product.

---

## 1. The feature that markets itself

The shareable unit is **not the app**. It's a **text-message screenshot**. The market is drowning in fitness *information*; nobody screenshots a workout plan. People screenshot a machine that knows their excuse and roasts them for it.

**What we must protect:**

- **Specificity beats profanity.** A generic "go train, bitch" is a one-screenshot novelty. "You said this mattered more than your ex — it's day 4" is a cult. The `streak_risk` and `missed_day` branches already inject `why` verbatim; content's job is to make the *visible, shippable default* always reference something only the user told us.
- **The reveal format.** The viral video is *setup → punchline*: "I told a fitness app why I really want this. Three days later it sent me this." The app supplies the punchline; the creator supplies the setup.

**The in-app share moment — and where it isn't.** Sharing is offered **once, post-moment, then disappears.** When `NudgeLog` records an outbound text scoring high on personalization (a `why` fragment or a PR), a single dismissible "Share this text" card surfaces in the **You** tab — never mid-workout, never a recurring nag. One tap produces a watermarked, PII-free image. We make the *one* great moment frictionless, then get out of the way. We do not build a content treadmill.

---

## 2. The content engine

Three formats, all built from real product output, on TikTok + Reels + Shorts.

| Format | Share | What it does |
|---|---|---|
| **Roast reactions** | ~60% | Creator reads their real onboarding answer aloud, reveals the coach's text. Vulnerability → violence → relatability — the most replicable arc on fitness TikTok. |
| **POV "it sends you this at 7am"** | ~25% | Screen mockups of an escalating missed-streak arc (day 1 gentle → day 4 savage), mapped exactly to the `evaluateTrigger` urgency ladder. No face needed; remixable meme template. |
| **"It actually works"** | ~15% | Before/after of the **guided rep** + a legible week-1 progress moment. The counterweight that converts laughers into keepers — and the post App Store reviewers see. Without it we're a leaky bucket with a great logo. |

**Hook bank (test first):** "I let an AI read my deepest insecurity," "the meanest app on the App Store," "I begged it to stop and it said no," "fitness apps are too nice — this one called me a bitch." Profanity-forward for reach, but we always A/B a *specificity* variant, because specificity is what makes it sharable a second time.

---

## 3. In-product loops (and the one we refuse to build)

- **Loop 1 — Artifact (viral coefficient).** Earn a great text → share card surfaces once → screenshot posted → new install. Measured as **organic shares per active user**, not invites sent. This is a *content* loop, not a referral loop.
- **Loop 2 — Retention (the real moat).** Open → today's session pre-built → guided rep → one honest number moves → coach *reacts* to the work (`milestone`/PR and `comeback` fire here). Growth that doesn't feed this loop is vanity.
- **Loop 3 — Re-engagement (compounding).** Push as primary owned channel; SMS as premium re-engagement behind 10DLC. A churned user gets a `missed_day` text → returns → triggers `comeback` → which is itself screenshot-worthy → Loop 1. The loops eat each other's output.

**What we will NOT build: the "sic the coach on your friend" referral.** It's a harassment vector and a guaranteed App Store rejection — unsolicited profane SMS to a non-consenting third party torches the 10DLC registration the whole channel depends on. Virality comes only from the artifact the *user* chooses to share. Re-flagged because under growth pressure someone *will* propose it.

---

## 4. Launch plan

| Phase | Window | Move |
|---|---|---|
| **0 — Waitlist** | wk −4 to 0 | One landing page, hook front and center: a live roast generator (powered by existing `templateFallback`/`sampleIntent`, no cron). The sample *is* the first shareable artifact. Capture phone for the SMS channel; "skip the line by posting your roast." |
| **1 — Seeded creators** | wk 0–2 | 15–30 mid-tier fitness/comedy creators (50k–500k: high engagement, low cost, authentic). The product roasts *them*; we film the real reaction. No scripts. |
| **2 — Product Hunt + press** | wk 2–4 | Angle: "The AI coach that texts you like it has stakes in your life." The *restraint* (safety floor, gentle default, consent-first) is the story — "responsibly savage" is more defensible than "edgy." |
| **3 — App Store** | wk 3+ | Capacitor PWA shell, no RN rewrite pre-PMF. Submit with **gentle as default**, savage behind explicit opt-in. Defenses are real and in-code: hard limits in `GLOBAL_RULES` (no slurs/sexual/self-harm, backs off on injury) + full STOP/HELP. This is also the right *growth* call — savage-by-default would shame scared beginners out on attempt five. |

---

## 5. ASO

- **Name / subtitle:** lead with the job-to-be-done so we rank for intent and survive review — *"FORGE — Your workout, done for you"* / *"Guided workouts + a coach that won't let you quit."* Profanity lives in screenshots and reviews, not metadata.
- **Screenshots:** (1) the guided rep — "what do I do right now," the retention promise; (2) a lightly censored savage text — the hook; (3) the day-7 progress moment. Sell the movie, not just the trailer.
- **Keywords:** *workout for beginners, gym plan, accountability, habit, get strong* — beachhead intent, not "savage AI" (low volume, high novelty-churn).
- **Reviews are marketing:** "This app called me a bitch and I've gone 11 days straight" is the highest-converting, user-generated App Store copy imaginable.

---

## 6. 90-day growth plan

**North-star: Weekly Logged Workouts per Active User ≥ 3, held 4 weeks.** Installs that don't log are not wins.

| Metric | Days 0–30 (Ignite) | Days 31–60 (Stoke) | Days 61–90 (Compound) |
|---|---|---|---|
| **Primary channel** | Seeded creators + waitlist conversion | UGC flywheel + paid amplification of top organic | Scale winners; self-serve creator kit |
| **Content cadence** | 3–5 seeded posts/day | 50%+ organic UGC | UGC-dominant; we curate |
| **Installs (vanity)** | 10–25k | 75–150k | 300k+ |
| **First-session completion** | **≥55%** (the real gate) | ≥60% | ≥65% |
| **Day-7 progress moment fired** | ≥50% of activated | ≥60% | ≥65% |
| **NSM: WLW/AU ≥3 @ 4wk** | baseline | **≥25% of activated** | ≥35% |
| **Organic shares / active user** | 0.15 | 0.30 | 0.40 |

**The honest risk.** A viral spike floods us with low-intent installs who came to laugh and bounce. That's *acceptable* — but only if first-session completion and the day-7 progress moment hold. If those sag while installs soar, **we throttle spend and fix the guided rep before pouring more water into the bucket.** Virality without retention is a leaky bucket, and we will not pretend install graphs are growth.

---

## 7. Every loop ties back to a core mechanic

| Growth surface | Core mechanic | In code today |
|---|---|---|
| Roast-reaction content | `buildUserMessage` injecting `why` + streak | ✅ `voice.ts` |
| In-app share card | high-personalization `NudgeLog` outbound event | ✅ schema; surface is new UI |
| Escalation meme (POV) | `evaluateTrigger` urgency ladder | ✅ `triggers.ts` |
| Re-engagement loop | `missed_day` → `comeback` push | ✅ `nudge.ts` + cron |
| "It works" content / ASO shot 1 | guided rep + day-7 progress moment | 🔨 building this quarter |
| App Store survival | safety floor, consent, STOP/HELP, gentle default | ✅ `GLOBAL_RULES`, `sms.ts` |

The growth engine and the retention engine are **the same engine viewed from two ends.** The coach reacts to logged work; the reaction is shareable; the share drives installs; the installs hit a guided rep that produces more logged work that produces more reactions. The coach is the trailer; the effortless guided workout is the movie — and **we do not let the movie disappoint**, because a one-screenshot novelty churns and a cult compounds.

**Highest-leverage demand growth can make of product:** make the *default, shippable, screenshottable* coach text quote the user's own onboarding **every time** — not just at max intensity. That single constraint is the difference between a meme that spikes and dies and a brand people get loyal to. Personalization is the product; profanity is just how it gets on the For You page.
