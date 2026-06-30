# Build Status — Executing the Playbooks

Live execution of the roadmap on branch **`claude/forge-viral-redesign`**. Everything below is real, committed, building-green code — **not** merged to `main`, so your live app is untouched. Each slice was built additively, type-checked (`tsc`), production-built (`next build`), and the consumer surface was Playwright-verified in a real browser.

> Run it: `APP_PASSCODE=… XAI_API_KEY=… npm start` (Postgres via `DATABASE_URL`). The new consumer experience is the default; **Lifter Mode** (Settings/You) restores your original power-user app.

## What shipped (7 slices)

| # | Slice | What it does | Status |
| --- | --- | --- | --- |
| 1 | **Aggressive coach mode-spectrum** | 5 tiers gentle→unhinged (THE CORNER → MENTOR → DRILL SERGEANT → SAVAGE → UNHINGED) with a "Choose your coach" picker, live in-voice samples, and a one-time consent gate on the explicit tiers. No DB migration (reuses persona ids). | ✅ verified live |
| 2 | **Guided-rep core loop** | Full-screen, one move at a time, plain-language targets, one *Log set*, post-set **Too easy / Just right / Too hard** calibration that moves the next weight (persisted as an RPE proxy), "You got stronger" finish. New `/today/guided`. Existing logger untouched. | ✅ verified live |
| 3 | **2-tab IA + Lifter Mode** | 6 tabs → **Today / You**; Lifter Mode (client pref) restores all six. New `/you` hub. Every route still works. | ✅ verified live |
| 4 | **Day-7 strength signal** | `getStrengthSignals()` = legible load-on-the-bar deltas ("+15 lb on Squat this week"); a "You're getting stronger" card on Home. | ✅ verified live |
| 5 | **Viral share card** | Portrait, screenshot-ready, ember-branded card toggling **Roast** (the coach's line + tier) vs **Recap** (the week's gain). New `/share` with Web Share API + clipboard fallback. | ✅ verified live |
| 6 | **Coach safety hardening** | Deterministic output filter (blocks slurs / sexual / real-violence; **keeps** the allowed profanity), crisis circuit-breaker on inbound → drops the roast, points to 988; scheduler in-flight guard. | ✅ build-green + unit-checked |
| 7 | **Multi-tenant foundation** | `User` model + nullable `userId` tenancy columns + FKs; migration creates one default tenant and backfills all rows (315 sessions, 0 orphans). `getCurrentUserId()` seam; `getSettings`/`getCoachProfile` resolve by user. | ✅ verified live (single tenant) |

## Verified in a real browser
Login → 2-tab nav → guided rep + post-set calibration → "You got stronger" → You hub + Lifter Mode → coach spectrum (Savage selected, Unhinged gated) → share card (roast) → settings read/write → tenant data intact. **Zero page errors** after fixing one hydration bug (a `<button>` nested in a `<button>` in the coach picker).

## Stubbed / partial — needs your call before it's production-real
1. **Multi-tenant is groundwork, not the full cutover.** Tenancy columns + the user seam are in and the app runs tenant-scoped, but the **bulk session/metric/analytics queries are still global** (correct for one user, must be scoped per `userId` before user #2), new settings/coach rows still default the `id="default"` key (fine for one tenant; needs `cuid()` for many), and **auth is still the single `APP_PASSCODE` gate** — the real **phone-OTP** login is the deliberate next step (I did not rip out the working gate autonomously, to avoid lockout). This is the one place I stayed conservative on purpose.
2. **Share = copy/Web-Share, not image export.** The card copies text / uses the native share sheet; rendering it to a PNG for one-tap posting (html-to-image) is a fast follow.
3. **Visceral coach media (AI voice/video, lock-screen takeovers)** from doc 19 are specّd, not built — they need native (Capacitor) + media generation.
4. **The coach mode tiers** map onto the existing 5 persona strings; the savage/unhinged voice prompts are written but only *fully* shine with `XAI_API_KEY` set (otherwise the templated fallback voice is used).

## To light it up
Set on the server: `XAI_API_KEY` (Grok coach + chat onboarding), optionally `TWILIO_*` (real SMS) and `CRON_SECRET`. Migrations auto-apply on `npm start` (`prisma migrate deploy`).

## Suggested next move
Per doc 18's "build/prove first": (a) finish the multi-tenant cutover + phone-OTP auth (human-reviewed), and (b) commission the ~10 compound **form clips** — the guided rep is the killer feature and it deserves real demos, not the placeholder media. Then this branch is a mergeable v2.
