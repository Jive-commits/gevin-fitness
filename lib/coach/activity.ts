import 'server-only';
import { prisma } from '@/lib/prisma';
import { getRecentPRs } from '@/lib/analytics';

export type CoachActivity = {
  trainedToday: boolean;
  trainedYesterday: boolean;
  lastTrainedTs: number | null;
  /** Whole local days between the last training day and today (0 = trained today). */
  daysSinceLastTrained: number | null;
  /** Consecutive local days trained, ending today (if trained) or yesterday. */
  dailyStreak: number;
  streakIncludesToday: boolean;
  /** Gap (local days) between today and the previous session, when training resumed today. */
  comebackGap: number | null;
  weekSessions: number; // sessions this local week (Mon-anchored)
  totalSessions: number;
  /** A fresh all-time-best e1RM achieved on today's local day, if any. */
  newPRToday: { name: string; e1RM: number } | null;
};

const DAY = 86400000;

/** Local YYYY-MM-DD for a timestamp in the given IANA timezone. */
function localYmd(ts: number, tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(ts));
  } catch {
    return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ts));
  }
}

/** A day ordinal (days since epoch) for a local YYYY-MM-DD string — safe to subtract. */
function ymdOrdinal(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / DAY);
}

/** Local hour [0,23] for a timestamp in the given timezone. */
export function localHour(ts: number, tz: string): number {
  try {
    const h = Number(
      new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', hour12: false }).format(new Date(ts)),
    );
    return h % 24; // some platforms emit 24 at midnight
  } catch {
    return new Date(ts).getHours();
  }
}

export async function getCoachActivity(timezone: string, now = Date.now()): Promise<CoachActivity> {
  const sessions = await prisma.workoutSession.findMany({
    where: { completed: true },
    select: { date: true },
    orderBy: { date: 'desc' },
  });

  const todayOrd = ymdOrdinal(localYmd(now, timezone));
  const trainedOrds = new Set<number>();
  let lastTrainedTs: number | null = null;
  for (const s of sessions) {
    const ts = s.date.getTime();
    if (lastTrainedTs == null) lastTrainedTs = ts;
    trainedOrds.add(ymdOrdinal(localYmd(ts, timezone)));
  }

  const trainedToday = trainedOrds.has(todayOrd);
  const trainedYesterday = trainedOrds.has(todayOrd - 1);

  // Sorted distinct trained ordinals, newest first.
  const ords = [...trainedOrds].sort((a, b) => b - a);
  const lastTrainedOrd = ords[0] ?? null;
  const daysSinceLastTrained = lastTrainedOrd == null ? null : todayOrd - lastTrainedOrd;

  // Daily streak ending today (preferred) or yesterday.
  let dailyStreak = 0;
  let streakIncludesToday = false;
  let anchor: number | null = null;
  if (trainedToday) {
    anchor = todayOrd;
    streakIncludesToday = true;
  } else if (trainedYesterday) {
    anchor = todayOrd - 1;
  }
  if (anchor != null) {
    let cur = anchor;
    while (trainedOrds.has(cur)) {
      dailyStreak += 1;
      cur -= 1;
    }
  }

  // Comeback: trained today after a real layoff from the previous session.
  let comebackGap: number | null = null;
  if (trainedToday && ords.length >= 2) {
    const prev = ords.find((o) => o < todayOrd);
    if (prev != null) comebackGap = todayOrd - prev;
  }

  // Sessions this local week (Monday-anchored).
  const dowMon = (((todayOrd % 7) + 7) % 7 + 6) % 7; // ordinal 0 = Thu(1970-01-01); align so Monday=0
  // Simpler: derive weekday from a real date.
  const todayDate = new Date(todayOrd * DAY);
  const jsDow = todayDate.getUTCDay(); // 0=Sun
  const sinceMon = (jsDow + 6) % 7;
  const weekStartOrd = todayOrd - sinceMon;
  let weekSessions = 0;
  for (const o of trainedOrds) if (o >= weekStartOrd && o <= todayOrd) weekSessions += 1;
  void dowMon;

  // Fresh PR achieved today?
  let newPRToday: { name: string; e1RM: number } | null = null;
  const prs = await getRecentPRs(3);
  for (const pr of prs) {
    if (ymdOrdinal(localYmd(pr.ts, timezone)) === todayOrd) {
      newPRToday = { name: pr.name, e1RM: pr.e1RM };
      break;
    }
  }

  return {
    trainedToday,
    trainedYesterday,
    lastTrainedTs,
    daysSinceLastTrained,
    dailyStreak,
    streakIncludesToday,
    comebackGap,
    weekSessions,
    totalSessions: sessions.length,
    newPRToday,
  };
}
