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
- **Settings** — units, available equipment (drives swap filtering), swap defaults,
  default rest, load increments, logout.

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
