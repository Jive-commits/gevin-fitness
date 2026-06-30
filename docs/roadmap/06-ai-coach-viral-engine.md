# The AI Coach as Viral Engine

> **First-principles framing.** The coach is the *trailer, not the movie.* It sells the install and earns the screenshot; the guided rep keeps the user. Its job is narrow and ruthless: manufacture **one** moment per user, every few days, so specific they feel seen — and occasionally so savage they screenshot it. Everything below serves that and nothing else. The skeleton is built (`lib/coach/triggers.ts`, `voice.ts`, `personas.ts`, `nudge.ts`); the work is sharpening it, not expanding it.

The single load-bearing sentence: **personalization is the product, profanity is the packaging.** "Get up, bitch" is a meme that dies in one screenshot. *"It's 7:14, you said legs, this is the wedding you cried about in onboarding"* is a cult. `voice.ts` already injects `f.why` (the user's own words) and `quoteWhy()` throws it back in their face. That mechanic *is* the moat. We protect and deepen it — and we never let the coach pretend to carry retention, because the core logging loop already does.

---

## 1. The persona system — keeping "savage" edgy-but-loved

We ship five personas (already built): **Savage 🔥, Hype 📣, Mentor 🧭, Stoic 🌀, Analyst 📊.** The architecture is correct: client-safe metadata in `personas.ts` (names, taglines, three real sample texts so you *hear* the voice before choosing), generation prompts isolated in `voice.ts`, and an intensity dial (1–3) that only sharpens Savage.

Three decisions make this defensible:

| Decision | Mechanic | Why it survives review |
|---|---|---|
| **Default gentle, earn savage** | Dial defaults to encouraging; a scared beginner gets **Mentor**, not Savage. Savage is `intense: true` and carries a heads-up. | The TikTok-viral text is *also* the one that shames a fragile beginner out of the funnel. Gating it is safety **and** retention — unlocking Savage at a 14-day streak makes the harsh voice a *reward.* That inversion is itself shareable ("I unlocked the mean coach lol"). |
| **Contempt for the excuse, never the person** | Prompt aims "bitch/pussy/soft" at "their excuses and their quitting"; hard-limits forbid slurs, sexual content, threats, self-harm; **mandatory tone-break on injury.** | "You're being soft *right now*" is loved. "You *are* worthless" is a one-star review and an App Store flag. That line is the whole brand. |
| **A real human texting, not an AI** | Prompt strips corporate softeners ("just a friendly reminder," "you've got this"); temperature 1.1 so lines aren't templated. | Screenshot-worthiness comes from reading like a friend with stakes in your life, not a notification. |

---

## 2. The data it's plugged into — why nudges feel scarily personal

**"All your data" in v1 = the data we already own.** The omniscience gap is real — "plugged into everything" is a week-4 promise sold as a day-1 hook. We close it by being *sharp with little,* not vague with a lot.

What the coach already sees (`triggers.ts` + `nudge.ts`):

| Signal | Source field | What it buys |
|---|---|---|
| Logged sessions | `daysSinceLastTrained`, `trainedToday`, `comebackGap` | Missed-day and comeback nudges |
| Streak | `dailyStreak`, milestone set `{3, 7, 14, 21, 30, 50, 75, 100…}` | Streak-risk + flex moments |
| PRs | `newPRToday` (name + e1RM) | Earned celebration |
| Cadence | `daysPerWeek` target | "Behind pace" is computed, not guessed |
| The emotional why | `profile.why` / `whyDeeper` | The single highest-leverage field |
| Time + timezone | `localHour` | Streak-risk fires in the evening; never nags at dawn |

The personalization *feels* like surveillance because the trigger engine fuses **three cheap facts into one expensive-feeling line:** "It's 7:14" (time) + "you said legs" (today's plan) + "the wedding you cried about" (why). We don't need wearables to be scary — we need to **quote the user back to themselves at the moment of failure.**

**Roadmap layer (Phase 2, post native shell, explicit):** time-of-day patterns ("you always skip Thursdays"); HealthKit steps/sleep as *context, not prescription* ("4 hours of sleep and still no excuse to skip the warm-up"). Per the anti-features list: **no Whoop/Oura/Garmin/Terra six-source ingestion** — that's a feature for people who already train, the opposite of our beachhead. Omniscience *grows*; it does not gate v1.

---

## 3. SMS + push strategy

**Savage moments ship primarily on push; SMS is the premium re-engagement channel, gated behind 10DLC.** The reasoning is carrier risk: profanity over SMS without proper 10DLC registration gets the number filtered or banned, and a banned number kills the whole channel.

The code supports the split: `channelOf(profile)` resolves `in_app | sms | both`, and `runCoachTick` has an `inAppOnly` path for page-load surfacing that **never texts.** Push (when the Capacitor shell lands) inherits that path — no carrier gatekeeper, instant, free, and it renders the full savage line in the notification shade where it's most screenshot-able.

**SMS is the closer, not the default** — the channel for the user who's gone dark (left the app, killed push). A text hits different because it's *intrusive in a way you consented to.* Delivery discipline is already in `nudge.ts`:

- 16-hour cooldown between auto-nudges
- 20-hour same-trigger dedup
- quiet-hours enforcement (`inQuietHours`, default 21:00 → 08:00, correctly wrapping midnight)

The coach is a scalpel — **one earned interruption,** never a stream. A coach that texts twice a day is spam. A coach that texts once, at 7:14pm, quoting your wedding, is a cult.

---

## 4. The shareable moments

Virality is the **artifact the user chooses to share** — never a referral loop. The "sic Coach on your friend" feature is an explicit anti-feature: harassment vector and guaranteed App Store rejection. Three artifacts, each a *designed object,* not a raw screenshot:

1. **The roast card.** After a savage nudge fires, a one-tap "Screenshot this" renders the text on a branded card — black, ember accent matching Savage, FORGE mark small in the corner. Sharing is offered **once, post-moment, then disappears.** No share prompt ever appears inside the logging loop — we do not turn a habit tool into a content treadmill.
2. **The weekly recap card.** Sunday: workouts logged, streak, the one number that moved, in the persona's voice. Savage users get a recap that roasts the rest days. The roast is the spike; the recap is the heartbeat — the *repeatable* viral unit.
3. **The streak flex.** Milestone hits (`STREAK_MILESTONES`) auto-generate a flex card. A 30-day streak with a Savage caption is a humblebrag with a punchline — the most natural thing to post.

**Design rule:** the card must look good *muted* and *cropped,* because that's how it travels on TikTok. The metric we watch is **organic shares per active user,** not invites sent.

---

## 5. Example savage texts across intensities (within the safety floor)

All real-flavor, all aimed at the *excuse,* never the person. The why-quote is the multiplier.

**Intensity 1 — crude but eased off ("one or two jabs, not a barrage"):**
> Two days dark. You said this mattered. Prove it — one session, today.

**Intensity 2 — full brutal:**
> 12-day streak and you're folding because you're "tired"? Tired isn't an injury. Quit being a little bitch and train.

**Intensity 3 — NO MERCY:**
> It's 7:14, you said legs, and you're parked on the couch like the last four times. You told me this was about not being the guy who quits everything. So what's this, pussy? Get up. One hour. Now.

**The injury tone-break (hard limit, all intensities):**
> Hold up — if you're actually hurt, that's different. Rest it, ice it, see someone if it's bad. The streak waits. Take care of yourself first.

That last one is **brand survival, not compliance theater.** It's the line that makes the savagery feel like it comes from someone who actually cares — which is precisely why people trust it enough to share it.

---

## 6. Trust / safety + consent — the App-Store-shippable model

The reason this ships where competitors get rejected: **the gate is deterministic; the LLM only decides how it sounds.** Rules in `triggers.ts` decide *when* and *whether;* `voice.ts` decides *the wording.* A model failure or cost spike never breaks the product — `generateNudgeBody` falls back to a hand-written `templateFallback` that already carries the persona voice. Harsh content can't go off-rails into a slur because the **hard-limits block is in the system prompt on every single call,** and the fallback is human-authored and pre-vetted.

Consent model (already in schema, `prisma/schema.prisma` lines 162–185):

| Control | Implementation | Standard met |
|---|---|---|
| Opt-in, default-off | `smsConsent = false` until explicit, stamped `smsConsentAt`; push and SMS are separate consents | TCPA |
| STOP / HELP / START | `classifyInbound` (`sms.ts`): STOP sets `smsStopped`, checked as a hard gate in `nudge.ts`; HELP returns info; START re-subscribes | 10DLC table stakes |
| Quiet hours | Enforced **server-side** (`inQuietHours`), not client-trusted | — |
| Spoofing | `validateTwilioSignature` on the inbound webhook | — |
| Consensual tone | Prompt framing ("they EXPLICITLY signed up to be called out hard") + opt-in dial + heads-up on the `intense` persona | The user asked for exactly this |

**For the App Store reviewer:** Savage is opt-in, gated, reversible in one tap, never targets protected classes, breaks character on any injury/crisis signal, and never shares or weaponizes data against third parties. That is a shippable consumer app, not a harassment tool.

---

## The one line that matters

The coach goes viral because it quotes **your** why at **your** moment of failure in a voice **you chose** and can silence in one tap — and it doesn't have to carry retention, because the guided rep behind it already does. Profanity is the packaging; being *seen* is the product.

---

### Grounding files

- `lib/coach/voice.ts` — persona prompts, hard-limits safety floor, template fallback
- `lib/coach/triggers.ts` — deterministic trigger gate
- `lib/coach/nudge.ts` — cooldown / dedup / quiet-hours / channel resolution
- `lib/coach/personas.ts` — 5-persona catalog
- `lib/coach/sms.ts` — STOP / HELP / START + Twilio signature validation
- `prisma/schema.prisma` (lines 162–185) — consent, quiet-hours, intensity fields
