# Open Decisions & Gaps Log

*The founder's action list. The other 18 documents say what we believe; this one says what we have not decided, where the docs contradict each other, and what to build before we spend a dollar of paid acquisition or a month of plumbing. The mandate holds: nothing earns a place here to look thorough. Every item is load-bearing, cheap to test, or both. Two synthesized critiques fed this — one stress-tested the Phase 0/1 build docs against the real code, one checked the full set (00–16) for completeness. Where they agree, the item is hardened. Where the code contradicts the doc, the code wins.*

> **First, a structural flag.** The roadmap stops at doc 16. Docs 15 and 16 reference a doc 17 "engineering backlog" as the single source of sequencing — it does not exist. ROADMAP.md's index only lists through 14, so 15–16 aren't even indexed. Before anyone builds, either write 17 or fold its sequencing into 11. Today there is no single ordered backlog, and two build docs point at a void.

---

## 1. The open decisions, ranked

These are the calls only the founder can make. Each is unresolved across the current docs, and each is cheaply testable before it becomes expensive to be wrong about.

| Decision | Why it matters | Options | Recommended default | How to cheaply test it |
|---|---|---|---|---|
| **D0 — Does post-sensation calibration move load for a true novice?** (R1, doc 12 Q1) | The entire core fails if false. Every doc concedes it's unproven; no one has run the test. This is decision zero — multi-tenancy, virality, and money are all downstream. | (a) Sensation-only ("Too easy / Just right / Too hard" post-rep); (b) sensation + RPE; (c) prescribe-and-hold with no novice input | (a) sensation-only, novice-overload tilt weeks 1–3 | 15–20 never-lifted people, 2 weeks, manual/Wizard-of-Oz progression. Did median squat load rise? Did they self-report "got stronger"? No app changes needed. |
| **D1 — Build the naked loop before or after the multi-tenant migration?** | Phase 0 is 3–4 weeks of plumbing with zero user-visible value. Phase 1 holds the existential question (D0). Sequencing the migration first means a month spent before you learn anything. | (a) Migration first (current docs); (b) **core first on the single-user DB behind a flag, thread `userId` once it earns the open** | (b) Prove the loop, then scale it | Build `GuidedRep` + post-sensation calibration + `getStrengthSignal` on today's single-user DB. Measure completion ≥55% and the day-7 signal. If the loop doesn't retain, the migration was wasted. |
| **D2 — Onboarding ordering: why before or after the first rep?** | Doc 03 §3 cuts conversational intake from first-run and moves "the why" to *after* the first session. Doc 05 §1 puts intake + persona reveal *before* the first guided rep. One is wrong, and the 60-second "end inside a rep" promise depends on which. | (a) Rep first, why after (doc 03); (b) why first, rep after (doc 05) | (a) Rep first — protects the 60-second promise and the killer-without-coach thesis | Two onboarding mocks in the prototype, 10 first-run users each. Which reaches a completed rep faster, and which retains to session 2? |
| **D3 — Where does form content come from — film, license, or generate?** (R6, doc 12 Q5) | Ten consistent vertical 1080×1350 clips is weeks of vendor coordination — the true critical path. Doc 12 calls it uncompressible, then buries it as "commission day 1." | (a) Film bespoke; (b) license a library; (c) generate; (d) static diagrams only at v1 | (a) Film the 10 compound lifts; isolation gets clean static diagrams, never fake demos | Get one vendor quote and one licensed-clip sample this week. Treat the clip-delivery date as the headline date Phase 1 ships against. |
| **D4 — Stripe vs. StoreKit for subscriptions?** | Apple's IAP rules forbid Stripe for digital subs in an App Store binary. Doc 11 says "Stripe + behavioral paywall"; doc 09 claims ~85% gross margin. The 30% cut breaks that math. | (a) StoreKit/IAP in-app; (b) Stripe web-only checkout; (c) hybrid (web acquisition, IAP in-app) | (c) Hybrid — acquire on web at full margin, offer compliant IAP in the binary | Read Apple's current external-purchase guidance; re-run doc 09's margin table with a 15–30% IAP haircut before quoting 85% anywhere. |
| **D5 — Inbound SMS tenant resolution on one shared number.** | Code today (`app/api/coach/sms/route.ts`) never reads `From` — it calls bare `getCoachProfile()`. Multi-tenant inbound is a *new* lookup path. With one shared `TWILIO_FROM_NUMBER`, an inbound `STOP` is only attributable by sender phone, and two users who never set `phoneNumber` are indistinguishable. | (a) Resolve user by `From` phone, require verified number; (b) per-user provisioned numbers; (c) push-first, SMS as opt-in upgrade | (c) Push-first; SMS only after a verified, unique `phoneNumber` — sidesteps the collision entirely | Add a uniqueness + verification gate on `phoneNumber` before any second user gets SMS. Test STOP attribution with two seeded users. |
| **D6 — Is ~25% the right D90 keeper go/no-go?** (R2) | The whole spend decision rests on this number, asserted but never justified. Bet the business on a validated threshold, not a guessed one. | (a) ~25% flat; (b) derive from CAC/LTV once IAP cut (D4) is known; (c) lower bar, tighter spend cap | (b) Derive it from real unit economics after D4 | Once D4 fixes the margin, back-solve the keeper rate that makes paid CAC profitable. Don't spend until the curve flattens above it. |

---

## 2. Gaps and contradictions to fix in the docs

These are not strategy calls — they are places where the documents disagree with each other or with the code. Each should be reconciled in a single editing pass, because a builder reading them today gets conflicting instructions.

**Contradictions between docs (pick one, update the other):**

1. **Form-clip count: 25 vs. 10.** Doc 03 §7 still says "the ~25-move beginner core." Docs 00, 11, 12 (R6), and 16 all say **10**. Doc 12 §4 records the 25→10 cut as deliberate — doc 03 was simply never updated. *Fix: change doc 03 to 10.*
2. **Onboarding ordering** (same as D2). Doc 03 §3 vs. doc 05 §1. *Fix follows the D2 decision.*
3. **e1RM: "demote" vs. resurfaced.** Doc 13 says e1RM is cut from default / demoted; doc 16 says demote to Lifter Mode — yet doc 05 §5 lists the existing `e1rm-chart` components, restyled, as the sparkline source for the headline progress chip. That re-surfaces the metric the rest of the roadmap exiles. *Fix: define a separate novice "got-stronger" signal for the chip; keep e1RM in Lifter Mode only.*
4. **Streak ribbon on Today.** Doc 05 §2 puts "a slim streak ribbon" below the fold. Doc 00 and doc 12 §4 explicitly cut it as "a liability counter for a restarter." Direct conflict on the home screen. *Fix: remove it from doc 05; a restarter app must never show a broken streak.*

**Gaps (specified nowhere, must be designed):**

5. **No data-deletion / GDPR-CCPA path.** Phone-as-identity, an emotional corpus, and health data — yet doc 07 mentions deletion in a single clause and doc 15's `onDelete: Cascade` only covers FKs. No user-facing deletion flow, retention policy, or right-to-be-forgotten exists. For an app whose moat *is* storing someone's trauma, this is a real gap and a launch blocker in some stores.
6. **Non-founder users go silent between Phase 0 and Phase 2.** Multi-user ships in Phase 0; cron fan-out is deferred to Phase 2 (doc 15 §7 keeps the cron single-tenant). Nothing verifies users #2..N receive nudges in between. The coach is silent for everyone but the founder for two phases. *Fix: either bring minimal per-user scheduling into Phase 1 or state plainly that SMS/push is founder-only until Phase 2.*
7. **Day-7 return trigger depends on scheduling that's cut.** `instrumentation.ts` is an in-process `setInterval` on one Railway instance. Phase 1's §4.3 day-7 Web Push return-trigger needs durable per-user scheduling — which is explicitly a Phase-2 item. A Phase-1 feature depends on a Phase-2 cut. *Fix: move minimal durable scheduling into Phase 1, or drop the day-7 trigger from Phase 1's gate.*
8. **LLM cost math is internally inconsistent.** Docs 01 §5 and 09 claim "under ~$0.30/mo." Doc 09's own table lists `grok-4` at `max_tokens: 1024` — a premium model. The ≤$0.30 figure is asserted, never grounded in actual per-token pricing, and the margin story rests on it. *Fix: ground the figure in real xAI pricing × expected monthly send volume, or revise it.*
9. **App Store / carrier exposure of profane SMS is acknowledged but not priced.** `personas.ts` ships a "Savage" persona that texts literal profanity. R5 and R11 flag App Store rejection and 10DLC/SHAFT carrier filtering, but neither doc puts a schedule cost on the review round-trips or the channel decay. *Fix: ship Savage locked behind a profane-consent interstitial, keep heavy profanity push-only, and budget 2–3 review cycles.*

---

## 3. The de-risked "build / prove first" ordering

The current docs sequence the unprovable-value migration entirely before the core-validation work. That spends a month before learning anything. Invert it: **prove the core earns the open before you pay to scale it.** The mandate — "killer without the coach" — only becomes testable if the loop exists in isolation first.

1. **Prove D0 off-app.** Run the 15–20 person post-sensation calibration test by hand. Cheapest, highest-leverage, gates everything. If load doesn't move, stop.
2. **Build the naked loop on the existing single-user DB, behind a flag.** `GuidedRep` + post-sensation calibration + `getStrengthSignal`. Measure first-session completion (≥55%) and the day-7 strength signal (≥50%). No multi-tenancy yet.
3. **Commission form clips in parallel from day one** (D3). It is the true critical path; its delivery date is the date Phase 1 can ship, not a §5 footnote.
4. **Resolve the doc contradictions** (§2 items 1–4) so the build spec is unambiguous before anyone codes screens.
5. **Only now thread `userId` + RLS.** Don't trust `tsc` to catch leaks — the dangerous bug is `findMany` with no `where`, which the compiler never flags. RLS via a non-`BYPASSRLS` role is the real backstop; budget the Railway role split and the `$transaction`/GUC-wrapping latency hit as their own week (it silently breaks interactive-transaction and pooling assumptions).
6. **Add minimal durable per-user scheduling** before relying on any return-trigger (gap 7), and **gate SMS behind a verified, unique number** (D5).
7. **Then, and only then, layer viral loops, native, and paid spend** — against the D6 keeper threshold derived from real, IAP-adjusted unit economics (D4).

The through-line: **prove the loop retains with the coach deleted before you spend a month making it multi-tenant.** Everything expensive in this plan is a bet on a single unproven fact (D0). Settle that fact first, on the cheapest possible apparatus.
