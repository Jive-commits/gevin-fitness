# Monetization & Business Model

We are not monetizing a feature. We are monetizing **consequence and competence** — the only two things this market can't get for free. Information is $0 and infinite. So the paywall never sits in front of *information*; it sits in front of *the coach having stakes in your life* and *the proof you're getting stronger*.

This follows the product's spine: the naked guided rep loop is the movie (retention), the savage coach is the trailer (virality). **You never paywall the trailer, and you never paywall enough of the movie to break the day-1 promise.** Everything below is downstream of that one rule.

---

## 1. Pricing & Packaging

**One paid tier. $9.99/mo, $59.99/yr (~$5/mo, 50% off).**

One tier, not three. A beachhead user who has restarted four times will not parse a pricing matrix — the matrix is itself a churn surface, so we cut it. Annual is the real product: it front-loads the "I'm committed this time" identity purchase this exact user is dying to make, and it converts the cohort *before* the week-3 motivation crash.

### What's free — the hook plus proof the core works

| Free feature | Why it's free (justification) |
|---|---|
| Full guided rep loop — today's session, form demos, tap-to-log, rest ring | The world-class core. A paywall here kills the bucket the viral spike fills. |
| Coach in gentle/default personas, in-app, reacting post-set | The trailer must be free or distribution dies. |
| **Savage persona, in-app, fully free** | This is the screenshot engine. Paywalling the meme strangles the TikTok. |
| Week-1 visible-progress moment | The legible "you got stronger" signal — the anti-churn keystone. |

### Paid — "FORGE Plus" — gates *reach and depth*, never the meme

| Paid feature | Why it converts |
|---|---|
| **SMS / push delivery of coach texts** | The coach hunting you down when you've ghosted. Consequence is the wedge. |
| **Two-way SMS coaching** (the `generateReply` loop) | Text the coach back, get torn into in real time. |
| **Full personalization depth** | The omniscient callbacks — your onboarding *why*, your specific skipped day. The cult version. |
| **Power-user mode** (density toggle, charts, manual swaps) | Serious lifters self-select, cost ~$0 to serve, and are high-LTV. |

What we are **NOT** paywalling: information, the exercise library, or the first taste of savagery. The wall is on *reach and depth* — exactly where willingness-to-pay is highest and free alternatives are weakest.

---

## 2. The Freemium-to-Paid Funnel & Paywall Placement

Virality and paywalls fight each other when the wall is early. So we place it **after earned value, never before**:

1. **Install → onboarding → first guided session completed.** Zero paywall. The first-session metric must fire first.
2. **Days 1–7:** free coach reacts, free savage texts appear in-app, the week-1 progress moment lands. The user gets the trailer *and* the movie at no cost. This is where the screenshot gets posted.
3. **The paywall trigger is behavioral, not time-based.** The first time the user *ghosts* — closes the app and misses a session — the coach hits the wall, in character:
   > *"I'd come for you right now, but you've got me muzzled. Turn on texts and I'll never let you disappear again."*

   We monetize at the moment of maximum felt need (the slip), in the exact voice that is our brand. **This is the only paywall that is on-brand to the wedge itself.**
4. **Annual-first offer at a progress win** (PR / streak milestone), when identity is "I'm someone who does this now" — the highest-intent purchase window.

Net effect: virality runs entirely on the free tier (no friction on the shareable artifact) while conversion runs on the *consequence* the free tier deliberately withholds. They never compete.

---

## 3. Unit Economics

The code makes the cost ceiling low *and deterministic*, which is the whole game.

**LLM cost.** `grok-4`, `max_tokens: 1024` (`lib/coach/voice.ts:139,160`), one system+user turn per nudge. Realistic spend: ~600 tokens in (prompts are compact) + ≤200 out (texts are <320 chars) ≈ <1k tokens — well under **$0.01 per generation**. The deterministic gate (16h cooldown, 20h same-trigger dedup — `lib/coach/nudge.ts:12-13`) caps an engaged user at **~1 generation/day → ≤$0.30/mo**. And `templateFallback` (`voice.ts:79,216`) means a cost spike or outage degrades to **$0 marginal cost with no product breakage** — we cap spend per user and ship templates past the cap, invisibly. **LLM is a rounding error against $5–10/mo.**

**SMS cost.** The only real variable cost — which is *why it's the paywall*. US A2P 10DLC: ~$0.005–0.0079 per segment plus carrier fees, plus campaign registration (~$15–50 one-time, ~$10/mo). A savage text can run 2 segments. At ~1 outbound/day plus occasional 2-way ≈ 40–60 segments/mo ≈ **$0.30–0.60/mo per paying SMS user**. Push is the *free* default channel, so most paid users cost us only LLM + push (~$0).

| Cost line (worst-case paid SMS user) | Monthly |
|---|---|
| LLM (`grok-4`, gated ~1/day) | ~$0.30 |
| SMS (40–60 segments) | ~$0.60 |
| Infra + Stripe fees | ~$0.50 |
| **Total cost** | **~$1.40** |
| **Revenue (blended)** | **~$5–10** |
| **Gross margin** | **~80%+** |

Push-only paid users run ~95% margin. This is a structurally healthy SaaS curve — nothing here pressures the model. The discipline already in the code (token caps, deterministic gate, template fallback) is what keeps it that way at scale. **Protect it.**

---

## 4. Retention / LTV Levers (priority order)

LTV = ARPU ÷ churn, so **churn is the only lever that matters at our stage** — and churn is owned by the *core*, not the coach.

1. **First-session completion.** A user who never gets a rep never converts and never returns. World-class onboarding-to-rep beats any pricing tweak.
2. **Week-1 progress moment.** The legible "you got stronger" signal — why annual buyers don't refund in week 3.
3. **Streak / consequence loop.** SMS-delivered consequence is both the paid feature *and* the strongest retention mechanic. **The paywall and the retention engine are the same lever** — the rare case where charging *increases* retention.
4. **Annual mix.** Every annual sub converts ~12 churn decisions into one. The cheapest LTV multiplier we have.
5. **Win-back via the premium SMS channel.** Re-engaging a lapsed user is exactly what the paid channel is *for* — a retention tool we also charge for.

We do **not** add gamification, social feeds, or content treadmills to juice retention. They violate the subtraction mandate and dilute the wedge.

---

## 5. 12-Month Trajectory

**Assumptions (deliberately conservative):**

- Virality is real but spiky — installs arrive in TikTok-driven bursts, mostly low-intent ("came to laugh").
- Free→paid conversion **3–6%** (freemium norm; our behavioral paywall should beat median, but model low).
- Blended ARPU ~$6/mo (annual-weighted).
- Gross margin ~85%.
- Keeper-cohort monthly churn ~5–8% (because the core delivers).

| Quarter | Build | Target | The metric that matters |
|---|---|---|---|
| **Q1 (1–3)** | Tenancy + phone-OTP auth (you cannot bill singletons). Stripe, behavioral paywall, push delivery. Savage-text content engine. | No revenue target. | First-session completion + week-1 signal. |
| **Q2 (4–6)** | 10DLC registration, SMS as the premium channel, paywall live. First paid cohorts. | ~25–50k installs, 2–4% conv → **~$5–15k MRR**. | North-Star: 3+ logged workouts/wk held 4 weeks. |
| **Q3 (7–9)** | A/B the savage paywall copy (it's a brand asset). Push annual mix. Win-back flows. | **~$30–60k MRR** *if North-Star holds*. | If it doesn't: freeze monetization, fix the core. |
| **Q4 (10–12)** | Capacitor iOS shell (no RN rewrite pre-PMF). App Store presence + trust premium. | Plausible **$75–150k MRR**, low-to-mid five-figure paid base. | A defensible North-Star — the only proof the bucket holds. |

### The one trap to refuse

If the viral spike inflates installs but the keeper cohort doesn't hold 3+ workouts/week, **do not raise paid-acquisition spend to chase MRR.** That's buying a leaky bucket. Money goes in only when the core retention curve flattens. Virality fills the bucket for free; our only job is that the bucket holds — and the bucket is the guided rep, **not** the coach.

---

*Grounding: figures anchor to the live implementation — `grok-4` at `max_tokens` 1024 with a deterministic 16h-cooldown / 20h-dedup gate and a $0-cost `templateFallback` (`lib/coach/voice.ts`, `lib/coach/nudge.ts`), and Twilio SMS as one of two channels with `in_app`/push as the free default (`lib/coach/sms.ts`). No billing code exists today, so pricing is fully greenfield.*
