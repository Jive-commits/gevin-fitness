# 10 — Brand, Name & Verbal Identity

> **First-principles mandate.** Blank canvas. The core app must be killer without the coach. Justify or cut everything on screen. Default answer to any addition is *no*. This document spends zero new features. It changes words, a palette, and a position — the cheapest, highest-leverage diff in the repo.

---

## Verdict: Keep FORGE. Don't rebrand. Reposition.

The instinct to rename for a consumer launch is wrong here, and the codebase proves why.

The problem was never the name. It's the tagline shipping in production right now:

> `"A precision instrument for serious lifting."`
> — `app/layout.tsx:28`, `app/manifest.webmanifest/route.ts:9`

That line is the power-user anchor the mandate orders us to kill. It files us next to the four tracker apps our beachhead user already deleted. **FORGE** the word, meanwhile, is already doing the job: it's a *verb*, it's physical, it's about *making something under heat and pressure* — the exact emotional truth of the person who's been re-formed by four failed restarts and is sick of it.

Rebranding now would spend our scarcest resource — focus — on the one asset that's already right. You don't buy a better metaphor with months of equity and a new domain.

| | Decision | Why |
|---|---|---|
| **Name** | **Keep `FORGE`** | Verb, physical, on-truth. Renaming burns focus on a solved problem. |
| **Tagline** | **Cut and replace** | "Precision instrument for serious lifting" is the power-user anchor. |
| **Position** | **Move** | From *instrument for the founder* → *movement for the person who keeps quitting*. |

**Naming risk to log, not act on:** a niche of crypto/dev tools also use "FORGE." Zero overlap with consumer fitness on the App Store, so ASO collision is negligible. Note it; do nothing.

### App Store identity

| Field | Value | Rationale |
|---|---|---|
| **Name** | `FORGE` | Short, ownable, a verb. |
| **Subtitle** | `Show up. Get strong. No excuses.` | The subtitle is ASO-indexed — it carries "strong" and the consequence promise, and reads as a *movement*, not a feature list. |
| **Category words to avoid** | "Strength Tracker," "Workout Log," "AI Fitness Coach" | Every one files us in a category we lose. We are not a tracker. Trackers are what this user already deleted. |

> Today the metadata literally reads `FORGE — Strength Tracker` (`app/layout.tsx:28`). "Strength Tracker" is the category we are defined *against*. Cut it.

---

## Brand personality — "The friend who won't let you fold"

One sentence: **FORGE is the friend who has receipts on you and loves you too much to watch you quit.**

Not a drill sergeant — that's generic and shame-based. Not a wellness brand — that's the soft category we're defined against. The ownable position is **earned intimacy with stakes.** Every competitor is either a neutral instrument or a relentless cheerleader. Nobody is the friend who texts `"it's 7:14, you said legs"` — because nobody else has the data *and* the nerve.

Four traits, in strict priority order:

1. **It knows you.** Personalization is the product. This leads.
2. **It has stakes.** Not showing up costs you something. This is the wedge.
3. **It's competent.** The guided rep delivers; the savagery is *earned* by a product that actually makes you stronger.
4. **It's funny.** The savage texts are screenshot-worthy because they're *witty and specific*, not just profane.

The order is load-bearing. The brand must read "knows you / competent" first and "savage" fourth. **A brand that leads with profanity is a one-screenshot novelty.** The voice can be loud; the brand underneath it has to feel like it gives a shit.

---

## Verbal identity — two registers, one personality

The savage coach voice already exists and is genuinely strong (`lib/coach/voice.ts`). But that's the *coach's* one register. The mistake to avoid is letting "Get the fuck up, you bitch" become the voice of the **whole app**.

The leak is already in the repo. The persona picker — *product chrome, not a coach text* — describes a user this way:

> "makes you feel like a little bitch for quitting on yourself"
> — `lib/coach/personas.ts:24` (the `savage` blurb, rendered in the picker UI)

A scared beginner on attempt five reads that in a setup screen and churns. That's the coach's voice leaking into the product's voice, aimed at exactly the person the mandate says to protect.

So: **two registers, one personality.**

| | **Product voice** | **Coach voice** |
|---|---|---|
| **Where** | Buttons, empty states, onboarding, the guided rep | Texts, push, post-set reactions |
| **Tone** | Plain, warm, direct. Zero jargon, zero hype. | The `mentor → savage` dial that's already built. |
| **Job** | Makes the app feel *safe and effortless* → **retention** | The *interruption* → **virality** |
| **Default** | Always calm | Gentle; *earned* up to savage |
| **Example** | "Here's today. One thing at a time." | "Day 3 of nothing. The bar isn't gonna lift itself." |

**Product-voice rules:**

- Short declaratives. Talks like a calm friend who knows you're nervous.
- "That's heavier than last week. You're getting stronger." / "Pick a weight that's hard but doable."
- **Banned words:** *crush, beast mode, grind, no pain no gain, let's get after it.* If marketing copy hype-creeps, it has drifted into the coach register where it doesn't belong.

**The throughline that makes them one brand and not two: specificity and respect.** Both registers refuse generic motivation; both assume you're an adult who chose this. The product voice is the friend *before* the gym. The coach voice is the friend texting you *off the couch*. Same friend.

### Naming the coach modes for consumers

The internal IDs (`mentor / zen / analyst / hype / savage`) are fine in code. But the *picker* should sell a **journey, not a menu of five equals.** Frame it as an intensity ladder the user climbs:

> **Gentle → Real → Savage** as the headline dial, with the named personas as flavor beneath.

This operationalizes "Savage is opt-in and earned" as a literal UI metaphor — and forces a rewrite of the picker blurbs out of the punching-down voice. The product names the rung; the coach earns it.

---

## Visual brand vibe

**Direction: forged metal meets Apple clarity.** Dark — but not the current near-black `#0a0a0c` murk (`app/manifest.webmanifest/route.ts:11`), which reads as a power-user terminal. Think *heat on dark steel*: a deep charcoal base with a single ember / molten-orange accent that only ignites on moments that matter.

| Element | Decision |
|---|---|
| **Base** | Deep charcoal, not near-black terminal murk |
| **Accent** | **One** signature ember. Collapse the existing `ember / mint / ice` tints (`personas.ts`) to ember + neutrals. |
| **Accent rule** | Color is the *reward system*, not decoration. It ignites only on a logged set, a PR, a streak save. |
| **Type — display** | Space Grotesk on hero moments only — carries the forge personality. |
| **Type — body** | Lean iOS-native, SF-style, large titles per HIG. |
| **Type — mono** | JetBrains Mono is a power-user tell. Keep it **only** where a number should feel like a verdict — your weight on the bar, your e1RM moving. (`app/layout.tsx:5–24`) |

Ruthless subtraction applies to the palette too. One ember. Everything else neutral.

### The screenshot is a design surface

Savage texts will be screenshotted and posted. So the *text bubble itself* needs branded chrome — a subtle FORGE wordmark / ember mark in the corner — so every organic share is a free impression *with attribution*.

**Design the share artifact as a first-class screen, not an afterthought.** This is the one place where investing in visual brand directly earns growth, which is the only justification that survives the mandate.

---

## Taglines

| Use | Line | Why it earns its place |
|---|---|---|
| **Primary (the movement)** | **Stop starting over.** | Names the *pain*, not the feature. Speaks straight to the four-failed-restarts beachhead — a promise and an indictment at once. |
| **The wedge** | The coach that comes for you. | Sells the consequence engine in six words. |
| **The product truth** | Just tell me what to do today. | The whole effortless-for-beginners promise, in the user's own voice. |
| **Savage / social** (TikTok, paid — *not* the App Store) | Your last first day. | Screenshot-bait. Twists "first day" into a threat. |

Lead consumer marketing with **"Stop starting over."** It's the only line here that names the pain instead of the feature — and pain is what gets shared.

---

## The one thing to change this week

Ship the repositioning at the brand surface. No new features. One diff:

1. Replace `"A precision instrument for serious lifting"` in `app/layout.tsx` and `app/manifest.webmanifest/route.ts`.
2. Drop `"Strength Tracker"` from the metadata title.
3. Rewrite the persona-picker blurbs in `lib/coach/personas.ts` so the **product** never calls the user a bitch — only the **coach**, only when earned — and reframe the picker as the **Gentle → Real → Savage** ladder.

That moves FORGE from *instrument for the founder* to *movement for the person who keeps quitting* — without a single new feature. Which is exactly the bias-to-subtraction the mandate demands.

**Relevant files:** `app/layout.tsx` · `app/manifest.webmanifest/route.ts` · `lib/coach/personas.ts` · `lib/coach/voice.ts`
