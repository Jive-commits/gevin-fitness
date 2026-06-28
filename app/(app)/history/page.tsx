import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { HistoryView } from '@/components/history/history-view';
import { getSettings } from '@/lib/settings';
import { getDailyActivity, getRecentSessions } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const [settings, days, sessions] = await Promise.all([
    getSettings(),
    getDailyActivity(63),
    getRecentSessions(60),
  ]);

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-bg/80 px-4 pb-3 pt-[calc(14px+var(--safe-top))] backdrop-blur-xl">
        <Link href="/home" className="tap grid h-9 w-9 place-items-center rounded-full surface-2 border border-border text-text-dim">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-text-faint">Training log</div>
          <h1 className="font-display text-2xl font-bold leading-tight">History</h1>
        </div>
      </header>
      <HistoryView days={days} sessions={sessions} units={settings.units} />
    </>
  );
}
