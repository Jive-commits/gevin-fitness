# FORGE — a precision strength-training tracker

A dark, kinetic, data-forward training app for a single serious lifter. Runs a fixed
6-day push/pull/legs program, lets you **swap any exercise in two taps** from a library
of 150+ tagged movements, and makes **logging a set take two taps** on your phone.

Built as a single full-stack **Next.js 14** service backed by **Railway PostgreSQL** with
**Prisma**. Migrations + an idempotent seed run automatically on every deploy.

---

## Stack

- **Next.js 14** (App Router) + **TypeScript** — one deployable (UI + route handlers + server actions)
- **PostgreSQL** (Railway plugin) + **Prisma** (schema, migrations, seed)
- **Tailwind CSS** + Radix primitives + **lucide-react**
- **Framer Motion** (reduced-motion aware) · **Recharts**
- Single-user **passcode gate** (`APP_PASSCODE` → httpOnly cookie session)
- Units in **kg or lb** (stored canonically in kg)

## Feature tour

- **Today** — the live logger. Big mono steppers, last-session pre-fill, one-tap set
  completion, an auto-starting **rest-timer ring**, progression hints, and a finish
  summary (volume · PRs · time). **Auto-saves every change** — there is no Save button,
  so a session is never lost.
- **Program** — both 8-week blocks, every day and slot. Edit sets/reps/RPE/rest, swap,
  reorder, and see the "replaces / why" lineage on each movement.
- **Library** — searchable, filterable database of 150+ exercises with cues, muscles,
  equipment, and per-lift history. **Add / edit / delete your own custom exercises.**
- **Progress** — per-lift estimated-1RM trend (Epley) with a linear-regression trendline,
  ▲/▬/▼ status pill and kg/week slope, auto-detected PRs, weekly volume heat by muscle,
  average-session-RPE trend, consistency/streak, and bodyweight.
- **Coach** — an **AI accountability coach** that learns your goal and your *why*, watches
  your training streak, and reaches out when you’re slipping. Pick a voice from **gentle
  (Mentor, Stoic, Analyst) to viral-savage** (with an intensity dial), set quiet hours, and
  it nudges you in-app and over **SMS**. See [The AI coach](#the-ai-coach) below.
- **Settings** — set up the coach, units, available equipment (drives swap filtering),
  swap defaults, default rest, load increments, logout.

The **swap engine** ranks alternatives by muscle match, movement pattern, equipment, and
back-safety, with a default "back-safe only" + "my equipment only" filter. Swaps are
always reversible ("reset to program default") and preserve lineage.

---

## One-time Railway setup

1. **Create a project** on [Railway](https://railway.app) and **Deploy from GitHub repo**
   (this repository).
2. In the same project, **add the PostgreSQL plugin** (New → Database → PostgreSQL).
   Railway injects `DATABASE_URL` into the service automatically — **do not set it manually.**
3. On the app service, set the variable:
   - `APP_PASSCODE` — the passcode that gates the app (required).
   - `DEFAULT_UNITS` — optional, `kg` (default) or `lb`, used only for a brand-new database.
4. Deploy. On every deploy the start command runs:
   ```
   prisma migrate deploy   # apply migrations
   node prisma/seed.js     # idempotent seed (upserts by slug)
   next start              # bind to Railway's $PORT
   ```
5. Open the service URL → enter your passcode → today's session is there, fully seeded.
   You can log a set and swap an exercise with **zero manual database steps.**

`output: 'standalone'` is set and the server binds to `process.env.PORT`. Build/run config
lives in [`railway.json`](./railway.json).

## Environment variables

| Variable        | Required | Notes                                                        |
| --------------- | -------- | ------------------------------------------------------------ |
| `DATABASE_URL`  | yes      | Injected automatically by the Railway Postgres plugin        |
| `APP_PASSCODE`  | yes      | Single-user passcode for the cookie session                  |
| `NODE_ENV`      | no       | `production` on Railway                                       |
| `DEFAULT_UNITS` | no       | `kg` (default) or `lb`; only applied when seeding a fresh DB  |
| `ANTHROPIC_API_KEY` | no   | Turns on AI-written coach messages (Claude Haiku). Without it, the coach uses on-brand templated copy. |
| `TWILIO_ACCOUNT_SID` | no  | Twilio SID — enables outgoing **SMS** nudges + two-way replies. |
| `TWILIO_AUTH_TOKEN`  | no  | Twilio auth token (also validates inbound webhook signatures). |
| `TWILIO_FROM_NUMBER` | no  | Your Twilio number in E.164 (e.g. `+14155551234`). Or set `TWILIO_MESSAGING_SERVICE_SID`. |
| `TWILIO_MESSAGING_SERVICE_SID` | no | Alternative to `TWILIO_FROM_NUMBER` — a Messaging Service. |
| `CRON_SECRET`   | no       | Shared secret that protects `POST /api/coach/cron` (external schedulers). |
| `COACH_SCHEDULER` | no     | `on`/`off`. The in-process scheduler runs by default in production; set `off` to rely solely on external cron. |

The coach degrades gracefully: with **no** keys it still works fully **in-app** (live status,
templated nudges, “pep talk”, “Test your coach”). Add `ANTHROPIC_API_KEY` for AI-written copy,
and Twilio for real texts.

## The AI coach

A best-effort accountability system built around your *why*.

- **Onboarding** (Settings → Accountability Coach): your goal, the real reason behind it, who
  you’re becoming, what’s derailed you, and your weekly cadence. Optional **voice dictation**
  (browser Web Speech API — no setup). This is the fuel the personas draw on.
- **Personas**: `savage` (viral tough-love, 3-step intensity dial), `hype`, `mentor`, `zen`,
  `analyst`. Each has hard safety rails — the heat is aimed at excuses, never the person.
- **Triggers** (local-time + cadence aware): streak-at-risk, missed days, comebacks, streak
  milestones, and fresh PRs. Cooldown + de-dupe keep it from nagging.
- **Delivery**: in-app coach card + optional SMS. Quiet hours, explicit opt-in consent, and
  `STOP`/`START`/`HELP` keyword handling are built in.

**Scheduling** — automatic nudges fire from an in-process scheduler (`instrumentation.ts`,
30-min cadence) with no extra setup on Railway. You can also/instead point any external cron at:

```
POST https://<your-app>/api/coach/cron        header  x-cron-secret: $CRON_SECRET
```

**Two-way SMS** — set your Twilio number’s inbound webhook to:

```
POST https://<your-app>/api/coach/sms
```

Requests are verified with Twilio’s signature; the lifter’s replies get an in-persona response,
and `STOP` opts them out instantly.

## How seeding works

`prisma/seed.js` is **fully idempotent** — every row is keyed by a stable `slug`:

- The **150+ exercise library** (`prisma/seed-data/exercises.js`) is upserted; metadata is
  refreshed in place, never duplicated.
- The **program** "Home PPL — Back-Safe Build" (`prisma/seed-data/program.js`) is created
  once; on re-deploy only canonical template fields refresh — **your swaps and slot edits
  are preserved.**
- **Custom exercises** you create get app-generated `custom-…` slugs, so re-seeding never
  touches or duplicates them.
- Re-running the seed any number of times yields identical row counts.

## Local development

```bash
# 1. Start Postgres (Docker)
docker compose up -d            # postgres on localhost:5432 (forge/forge)

# 2. Env
cp .env.example .env            # DATABASE_URL points at the docker DB; set APP_PASSCODE

# 3. Install + migrate + seed
npm install
npx prisma migrate dev          # create/apply the schema
npm run db:seed                 # seed library + program

# 4. Run
npm run dev                     # http://localhost:3000
```

No Docker? Point `DATABASE_URL` at any local Postgres and run the same migrate/seed steps.

### Useful scripts

| Script             | Does                                                          |
| ------------------ | ------------------------------------------------------------ |
| `npm run dev`      | Next dev server                                              |
| `npm run build`    | `prisma generate && next build`                              |
| `npm run start`    | `prisma migrate deploy && node prisma/seed.js && next start` |
| `npm run db:seed`  | Run the idempotent seed against `DATABASE_URL`               |
| `npm run db:reset` | **Drops and recreates** the DB, re-applies migrations + seed |

## Importing history from another app

> **Bundled one-time import:** `prisma/seed-data/history-import.csv` ships in this repo
> and the deploy `start` command runs it **once** automatically
> (`… --skip-if-imported --soft-fail`): it imports on the first deploy that finds an
> empty history, skips on every deploy after, and never fails the boot. Set
> `IMPORT_UNITS=kg` on the service if that CSV's weights are in kg (default `lb`).
> To re-import an updated CSV, replace the file and clear the prior import
> (`DELETE FROM "WorkoutSession" WHERE notes='csv-import'`) or run the command below.


`scripts/import-history.js` imports a per-set CSV export from another tracker
(columns: `Workout Start, Workout End, Exercise, Weight, Reps, …, Category, Name`).
It groups rows into sessions, **matches each exercise to a seeded FORGE lift**
(curated aliases → exact → fuzzy token overlap), **creates custom exercises for
anything without a close match**, and handles **weightless movements** (push-ups,
dips, planks — logged with reps only) and assisted/negative-weight machines.

```bash
# local DB
npm run import:history -- /path/to/export.csv --units lb

# straight into your Railway database (grab DATABASE_URL from the Railway dashboard)
DATABASE_URL="postgres://…railway…" npm run import:history -- export.csv --units lb

# preview the matching without writing anything
npm run import:history -- export.csv --units lb --dry-run
```

- `--units lb|kg` tells the importer what unit the CSV weights are in (default `lb`);
  everything is stored canonically in kg.
- **Idempotent:** re-running deletes prior CSV-imported sessions (marked
  `notes='csv-import'`) and reuses custom exercises by slug — your manually-logged
  sessions are never touched and nothing is duplicated.
- Imported sets feed e1RM trends, PRs, volume, and history exactly like sets you log
  in the app.

## Resetting the database

- **Local:** `npm run db:reset` (destructive — wipes all data, re-migrates, re-seeds).
- **Railway:** delete and re-add the Postgres plugin, or run
  `npx prisma migrate reset --force` against the Railway `DATABASE_URL` from your machine.
  The next deploy re-seeds automatically.

## Data model

See `prisma/schema.prisma`. Single-user today, but every logging row keeps a clean path to
a future `userId` migration. Estimated 1RM is **Epley** (`weight × (1 + reps/30)`),
computed per completed working set; a session's e1RM is the best set; estimates from
>12 reps are flagged low-confidence.
