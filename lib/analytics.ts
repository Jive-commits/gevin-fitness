import 'server-only';
import { prisma } from '@/lib/prisma';
import { epley1RM, isLowConfidence } from '@/lib/format';

const DAY = 86400000;
const WEEK = 7 * DAY;

export type SessionPoint = {
  sessionId: string;
  ts: number; // ms
  e1RM: number; // session-best Epley
  topWeightKg: number;
  topReps: number;
  lowConfidence: boolean;
  volumeKg: number;
  avgRpe: number | null;
  isPR: boolean; // new all-time-best e1RM at this session
};

export type TrendStatus = 'up' | 'flat' | 'down' | 'none';

export type ExerciseTrend = {
  points: SessionPoint[];
  slopePerWeekKg: number;
  status: TrendStatus;
  pctVs4wk: number | null;
  pctVsBest: number | null;
  best: { e1RM: number; ts: number } | null;
  current: number | null;
};

/** Session-best e1RM (Epley, weight×reps) timeline for a lift. */
export async function getExerciseSeries(exerciseId: string): Promise<SessionPoint[]> {
  const sets = await prisma.setLog.findMany({
    where: {
      exerciseId,
      completed: true,
      isWarmup: false,
      weightKg: { not: null },
      reps: { not: null },
    },
    select: { sessionId: true, weightKg: true, reps: true, rpe: true, session: { select: { date: true } } },
  });

  const bySession = new Map<string, { ts: number; e1RM: number; topWeightKg: number; topReps: number; lowConfidence: boolean; volumeKg: number; rpes: number[] }>();
  for (const s of sets) {
    const w = s.weightKg!;
    const r = s.reps!;
    const e = epley1RM(w, r);
    const ts = s.session.date.getTime();
    const cur = bySession.get(s.sessionId);
    if (!cur) {
      bySession.set(s.sessionId, {
        ts,
        e1RM: e,
        topWeightKg: w,
        topReps: r,
        lowConfidence: isLowConfidence(r),
        volumeKg: w * r,
        rpes: s.rpe != null ? [s.rpe] : [],
      });
    } else {
      cur.volumeKg += w * r;
      if (s.rpe != null) cur.rpes.push(s.rpe);
      if (e > cur.e1RM) {
        cur.e1RM = e;
        cur.topWeightKg = w;
        cur.topReps = r;
        cur.lowConfidence = isLowConfidence(r);
      } else if (w > cur.topWeightKg) {
        cur.topWeightKg = w;
      }
    }
  }

  const points = [...bySession.entries()]
    .map(([sessionId, v]) => ({
      sessionId,
      ts: v.ts,
      e1RM: v.e1RM,
      topWeightKg: v.topWeightKg,
      topReps: v.topReps,
      lowConfidence: v.lowConfidence,
      volumeKg: v.volumeKg,
      avgRpe: v.rpes.length ? v.rpes.reduce((a, b) => a + b, 0) / v.rpes.length : null,
      isPR: false,
    }))
    .sort((a, b) => a.ts - b.ts);

  // Mark all-time-best progressions as PRs.
  let best = 0;
  for (const p of points) {
    if (p.e1RM > best + 0.001) {
      p.isPR = true;
      best = p.e1RM;
    }
  }
  return points;
}

function linregSlopePerWeek(points: { ts: number; e1RM: number }[]): number {
  if (points.length < 2) return 0;
  const xs = points.map((p) => p.ts / DAY);
  const ys = points.map((p) => p.e1RM);
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  if (den === 0) return 0;
  return (num / den) * 7; // per week
}

export function computeTrend(points: SessionPoint[], windowWeeks = 5): ExerciseTrend {
  if (points.length === 0) {
    return { points, slopePerWeekKg: 0, status: 'none', pctVs4wk: null, pctVsBest: null, best: null, current: null };
  }
  const latest = points[points.length - 1];
  const cutoff = latest.ts - windowWeeks * WEEK;
  const recent = points.filter((p) => p.ts >= cutoff);
  const slope = linregSlopePerWeek((recent.length >= 2 ? recent : points).map((p) => ({ ts: p.ts, e1RM: p.e1RM })));

  let status: TrendStatus = 'flat';
  if (points.length < 2) status = 'none';
  else if (slope > 0.25) status = 'up';
  else if (slope < -0.25) status = 'down';

  // % vs ~4 weeks ago (nearest point at/older than 28 days back).
  const fourWeekTs = latest.ts - 4 * WEEK;
  const older = [...points].filter((p) => p.ts <= fourWeekTs).pop() ?? points[0];
  const pctVs4wk = older && older.e1RM > 0 && older.sessionId !== latest.sessionId
    ? ((latest.e1RM - older.e1RM) / older.e1RM) * 100
    : null;

  const best = points.reduce((b, p) => (p.e1RM > b.e1RM ? p : b));
  const pctVsBest = best.e1RM > 0 ? ((latest.e1RM - best.e1RM) / best.e1RM) * 100 : null;

  return {
    points,
    slopePerWeekKg: slope,
    status,
    pctVs4wk,
    pctVsBest,
    best: { e1RM: best.e1RM, ts: best.ts },
    current: latest.e1RM,
  };
}

export type ExercisePRs = {
  bestE1RM: { value: number; ts: number } | null;
  bestVolumeSet: { value: number; ts: number } | null;
  weightForReps: { reps: number; weightKg: number; ts: number }[];
};

export async function getExercisePRs(exerciseId: string): Promise<ExercisePRs> {
  const sets = await prisma.setLog.findMany({
    where: { exerciseId, completed: true, isWarmup: false, weightKg: { not: null }, reps: { not: null } },
    select: { weightKg: true, reps: true, session: { select: { date: true } } },
  });
  if (sets.length === 0) return { bestE1RM: null, bestVolumeSet: null, weightForReps: [] };

  let bestE1RM = { value: 0, ts: 0 };
  let bestVol = { value: 0, ts: 0 };
  const wfr = new Map<number, { weightKg: number; ts: number }>();
  for (const s of sets) {
    const w = s.weightKg!;
    const r = s.reps!;
    const ts = s.session.date.getTime();
    const e = epley1RM(w, r);
    if (e > bestE1RM.value) bestE1RM = { value: e, ts };
    const vol = w * r;
    if (vol > bestVol.value) bestVol = { value: vol, ts };
    const cur = wfr.get(r);
    if (!cur || w > cur.weightKg) wfr.set(r, { weightKg: w, ts });
  }
  return {
    bestE1RM: bestE1RM.value > 0 ? bestE1RM : null,
    bestVolumeSet: bestVol.value > 0 ? bestVol : null,
    weightForReps: [...wfr.entries()]
      .map(([reps, v]) => ({ reps, weightKg: v.weightKg, ts: v.ts }))
      .sort((a, b) => a.reps - b.reps),
  };
}

/** Recent logged sessions (with sets) for an exercise — for the detail history list. */
export async function getExerciseHistory(exerciseId: string, limit = 8) {
  const sets = await prisma.setLog.findMany({
    where: { exerciseId, isWarmup: false, weightKg: { not: null }, reps: { not: null } },
    orderBy: { createdAt: 'desc' },
    select: { sessionId: true, setNumber: true, weightKg: true, reps: true, rpe: true, completed: true, session: { select: { date: true } } },
    take: 200,
  });
  const bySession = new Map<string, { ts: number; sets: { setNumber: number; weightKg: number; reps: number; rpe: number | null }[] }>();
  for (const s of sets) {
    if (!s.completed) continue;
    const g = bySession.get(s.sessionId) ?? { ts: s.session.date.getTime(), sets: [] };
    g.sets.push({ setNumber: s.setNumber, weightKg: s.weightKg!, reps: s.reps!, rpe: s.rpe });
    bySession.set(s.sessionId, g);
  }
  return [...bySession.values()]
    .map((g) => ({ ts: g.ts, sets: g.sets.sort((a, b) => a.setNumber - b.setNumber) }))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, limit);
}

// ---------- Program-wide progress (Progress tab) ----------

export type WeeklyMuscleVolume = {
  weekStart: number;
  byMuscle: Record<string, { sets: number; tonnageKg: number }>;
  totalSets: number;
  totalTonnageKg: number;
};

function weekStartTs(ts: number): number {
  const d = new Date(ts);
  const day = (d.getUTCDay() + 6) % 7; // Monday=0
  const monday = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day);
  return monday;
}

export async function getWeeklyVolumeByMuscle(weeks = 8): Promise<WeeklyMuscleVolume[]> {
  // Anchor on the most recent session, not "now", so imported/older history still shows.
  const latest = await prisma.workoutSession.findFirst({
    where: { completed: true },
    orderBy: { date: 'desc' },
    select: { date: true },
  });
  if (!latest) return [];
  const since = latest.date.getTime() - weeks * WEEK;
  const sets = await prisma.setLog.findMany({
    where: { completed: true, isWarmup: false, weightKg: { not: null }, reps: { not: null }, session: { date: { gte: new Date(since) } } },
    select: { weightKg: true, reps: true, session: { select: { date: true } }, exercise: { select: { primaryMuscle: true } } },
  });
  const byWeek = new Map<number, WeeklyMuscleVolume>();
  for (const s of sets) {
    const wk = weekStartTs(s.session.date.getTime());
    const muscle = s.exercise.primaryMuscle;
    const entry = byWeek.get(wk) ?? { weekStart: wk, byMuscle: {}, totalSets: 0, totalTonnageKg: 0 };
    const m = (entry.byMuscle[muscle] ??= { sets: 0, tonnageKg: 0 });
    m.sets += 1;
    m.tonnageKg += s.weightKg! * s.reps!;
    entry.totalSets += 1;
    entry.totalTonnageKg += s.weightKg! * s.reps!;
    byWeek.set(wk, entry);
  }
  return [...byWeek.values()].sort((a, b) => a.weekStart - b.weekStart);
}

export type SessionRpePoint = { ts: number; avgRpe: number; setCount: number };

export async function getAvgSessionRpeTrend(): Promise<SessionRpePoint[]> {
  const sessions = await prisma.workoutSession.findMany({
    where: { completed: true },
    orderBy: { date: 'asc' },
    select: { date: true, sets: { where: { isWarmup: false, rpe: { not: null } }, select: { rpe: true } } },
  });
  return sessions
    .filter((s) => s.sets.length > 0)
    .map((s) => ({
      ts: s.date.getTime(),
      avgRpe: s.sets.reduce((a, b) => a + (b.rpe ?? 0), 0) / s.sets.length,
      setCount: s.sets.length,
    }));
}

export async function getConsistency(): Promise<{ sessions: number; thisWeek: number; streakWeeks: number; perWeek: { weekStart: number; count: number }[] }> {
  const sessions = await prisma.workoutSession.findMany({
    where: { completed: true },
    select: { date: true },
    orderBy: { date: 'asc' },
  });
  const perWeekMap = new Map<number, number>();
  for (const s of sessions) {
    const wk = weekStartTs(s.date.getTime());
    perWeekMap.set(wk, (perWeekMap.get(wk) ?? 0) + 1);
  }
  const perWeek = [...perWeekMap.entries()].map(([weekStart, count]) => ({ weekStart, count })).sort((a, b) => a.weekStart - b.weekStart);
  const thisWk = weekStartTs(Date.now());
  const thisWeek = perWeekMap.get(thisWk) ?? 0;

  // Streak: consecutive weeks (ending this or last week) with >=1 session.
  let streak = 0;
  let cursor = thisWeek > 0 ? thisWk : thisWk - WEEK;
  while ((perWeekMap.get(cursor) ?? 0) > 0) {
    streak += 1;
    cursor -= WEEK;
  }
  return { sessions: sessions.length, thisWeek, streakWeeks: streak, perWeek };
}

export async function getBodyweightSeries(): Promise<{ ts: number; weightKg: number }[]> {
  const rows = await prisma.bodyMetric.findMany({ orderBy: { date: 'asc' }, select: { date: true, weightKg: true } });
  return rows.map((r) => ({ ts: r.date.getTime(), weightKg: r.weightKg }));
}

// ---------- Home dashboard ----------

function utcDayStart(ts: number): number {
  const d = new Date(ts);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export type DayActivity = { ts: number; sessions: number; sets: number; volumeKg: number };

/** Per-day training activity for the last `days` days (zero-filled), for the heatmap. */
export async function getDailyActivity(days = 35): Promise<DayActivity[]> {
  const todayStart = utcDayStart(Date.now());
  const since = todayStart - (days - 1) * DAY;
  const sets = await prisma.setLog.findMany({
    where: {
      completed: true,
      isWarmup: false,
      weightKg: { not: null },
      reps: { not: null },
      session: { date: { gte: new Date(since) } },
    },
    select: { sessionId: true, weightKg: true, reps: true, session: { select: { date: true } } },
  });

  const byDay = new Map<number, { sessions: Set<string>; sets: number; volumeKg: number }>();
  for (const s of sets) {
    const day = utcDayStart(s.session.date.getTime());
    const e = byDay.get(day) ?? { sessions: new Set(), sets: 0, volumeKg: 0 };
    e.sessions.add(s.sessionId);
    e.sets += 1;
    e.volumeKg += s.weightKg! * s.reps!;
    byDay.set(day, e);
  }

  const out: DayActivity[] = [];
  for (let ts = since; ts <= todayStart; ts += DAY) {
    const e = byDay.get(ts);
    out.push({ ts, sessions: e?.sessions.size ?? 0, sets: e?.sets ?? 0, volumeKg: e?.volumeKg ?? 0 });
  }
  return out;
}

export type Totals = { sessions: number; sets: number; tonnageKg: number; exercises: number; daysTrained: number };

export async function getTotals(): Promise<Totals> {
  const [sessions, sets] = await Promise.all([
    prisma.workoutSession.count({ where: { completed: true } }),
    prisma.setLog.findMany({
      where: { completed: true, isWarmup: false, weightKg: { not: null }, reps: { not: null } },
      select: { weightKg: true, reps: true, exerciseId: true, session: { select: { date: true } } },
    }),
  ]);
  const tonnageKg = sets.reduce((sum, s) => sum + s.weightKg! * s.reps!, 0);
  const exercises = new Set(sets.map((s) => s.exerciseId)).size;
  const daysTrained = new Set(sets.map((s) => utcDayStart(s.session.date.getTime()))).size;
  return { sessions, sets: sets.length, tonnageKg, exercises, daysTrained };
}

/** Most recently-achieved all-time-best e1RMs, across all lifts. */
export async function getRecentPRs(limit = 4): Promise<{ exerciseId: string; slug: string; name: string; e1RM: number; ts: number }[]> {
  const sets = await prisma.setLog.findMany({
    where: { completed: true, isWarmup: false, weightKg: { not: null }, reps: { not: null } },
    select: { exerciseId: true, weightKg: true, reps: true, session: { select: { date: true } }, exercise: { select: { slug: true, name: true } } },
  });
  const best = new Map<string, { e1RM: number; ts: number; slug: string; name: string }>();
  for (const s of sets) {
    const e = epley1RM(s.weightKg!, s.reps!);
    const ts = s.session.date.getTime();
    const cur = best.get(s.exerciseId);
    if (!cur || e > cur.e1RM + 0.001) best.set(s.exerciseId, { e1RM: e, ts, slug: s.exercise.slug, name: s.exercise.name });
  }
  return [...best.entries()]
    .map(([exerciseId, v]) => ({ exerciseId, ...v }))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, limit);
}

export type SessionSummary = {
  id: string;
  ts: number;
  dayTs: number;
  name: string;
  exercises: number;
  sets: number;
  volumeKg: number;
  durationSec: number | null;
};

/** Recent completed sessions (newest first) for the History list. */
export async function getRecentSessions(limit = 60): Promise<SessionSummary[]> {
  const sessions = await prisma.workoutSession.findMany({
    where: { completed: true },
    orderBy: { date: 'desc' },
    take: limit,
    include: {
      day: { select: { name: true } },
      sets: { select: { exerciseId: true, weightKg: true, reps: true, isWarmup: true, completed: true } },
    },
  });
  return sessions.map((s) => {
    const exs = new Set<string>();
    let sets = 0;
    let volumeKg = 0;
    for (const set of s.sets) {
      if (set.completed && !set.isWarmup) {
        exs.add(set.exerciseId);
        sets++;
        if (set.weightKg && set.reps) volumeKg += set.weightKg * set.reps;
      }
    }
    return {
      id: s.id,
      ts: s.date.getTime(),
      dayTs: utcDayStart(s.date.getTime()),
      name: s.name ?? s.day?.name ?? 'Workout',
      exercises: exs.size,
      sets,
      volumeKg,
      durationSec: s.durationSec,
    };
  });
}

/** Exercises that actually have logged data — for the Progress exercise picker. */
export async function getLoggedExercises(): Promise<{ id: string; slug: string; name: string; isCustom: boolean }[]> {
  const rows = await prisma.setLog.findMany({
    where: { completed: true, isWarmup: false },
    distinct: ['exerciseId'],
    select: { exercise: { select: { id: true, slug: true, name: true, isCustom: true } } },
  });
  return rows.map((r) => r.exercise).sort((a, b) => a.name.localeCompare(b.name));
}
