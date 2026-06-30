// In-process accountability scheduler. On Railway (`next start`, long-running Node
// server) this fires the coach tick every 30 min with no external cron needed.
// Each tick is internally gated (coach must be enabled) and rate-limited, so an
// idle profile costs one cheap DB read. Set COACH_SCHEDULER=off to disable and
// drive nudges purely from /api/coach/cron instead.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const g = globalThis as unknown as { __forgeCoachScheduler?: boolean };
  if (g.__forgeCoachScheduler) return;

  const scheduler = process.env.COACH_SCHEDULER;
  const on = scheduler === 'on' || (scheduler !== 'off' && process.env.NODE_ENV === 'production');
  if (!on) return;
  g.__forgeCoachScheduler = true;

  const INTERVAL_MS = 30 * 60 * 1000;
  const tick = async () => {
    try {
      const { runCoachTick } = await import('./lib/coach/nudge');
      const r = await runCoachTick();
      if (r.sent) console.log(`[coach] nudge sent (${r.trigger} · ${r.channel} · ${r.source}).`);
    } catch (err) {
      console.error('[coach] scheduled tick failed:', err);
    }
  };

  setTimeout(tick, 90 * 1000); // first check shortly after boot
  setInterval(tick, INTERVAL_MS);
  console.log('[coach] in-process scheduler started (30m cadence).');
}
