import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getCoachStatus } from '@/lib/coach/nudge';
import { getStrengthSignals } from '@/lib/analytics';
import { getSettings } from '@/lib/settings';
import { personaMeta } from '@/lib/coach/personas';
import { formatWeight } from '@/lib/units';
import { ShareView } from '@/components/share/share-view';
import type { ShareCardData } from '@/components/share/share-card';

export const dynamic = 'force-dynamic';

export default async function SharePage() {
  const settings = await getSettings();
  const [coach, signals] = await Promise.all([getCoachStatus(), getStrengthSignals(7)]);
  const units = settings.units;

  const persona = personaMeta(coach.persona);
  const roast: (ShareCardData & { kind: 'roast' }) | null = coach.latestNudge
    ? { kind: 'roast', quote: coach.latestNudge.body, coachName: persona.name, coachEmoji: persona.emoji }
    : null;

  const top = signals[0];
  const recap: (ShareCardData & { kind: 'recap' }) | null = top
    ? {
        kind: 'recap',
        headline: `+${formatWeight(top.deltaKg, units)} ${units}`,
        subject: `on ${top.name}`,
        detail: `this week · ${formatWeight(top.fromKg, units)} → ${formatWeight(top.toKg, units)} ${units}`,
      }
    : null;

  return (
    <div className="px-4 pb-8 pt-[calc(16px+var(--safe-top))]">
      <div className="mb-5 flex items-center gap-3">
        <Link href="/home" className="tap -ml-1 grid h-9 w-9 place-items-center rounded-xl surface-2 border border-border text-text-dim">
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold leading-tight">Make a share card</h1>
          <p className="text-[12px] text-text-dim">Screenshot it. Post it. Stop starting over.</p>
        </div>
      </div>

      <ShareView roast={roast} recap={recap} />
    </div>
  );
}
