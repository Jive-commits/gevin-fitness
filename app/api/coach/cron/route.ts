import { NextRequest, NextResponse } from 'next/server';
import { runCoachTick } from '@/lib/coach/nudge';

export const dynamic = 'force-dynamic';

// Scheduler endpoint. Point any cron (Railway Cron, GitHub Action, cron-job.org)
// at this URL on a 20–60 min cadence with the CRON_SECRET. Each hit evaluates the
// lifter's activity and sends at most one nudge (cooldown + dedup enforced inside).
function authorized(req: NextRequest, secret: string): boolean {
  const header =
    req.headers.get('x-cron-secret') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    '';
  const query = req.nextUrl.searchParams.get('secret') || '';
  return header === secret || query === secret;
}

async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, skipped: 'CRON_SECRET not configured' }, { status: 200 });
  }
  if (!authorized(req, secret)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  try {
    const result = await runCoachTick();
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error('[coach/cron] tick failed:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'tick_failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
