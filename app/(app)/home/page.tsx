import Link from 'next/link';
import { Flame, CalendarCheck, Dumbbell, Trophy, ChevronRight, Plus, Layers, TrendingUp, Activity, ArrowUpRight, Share2 } from 'lucide-react';
import { HomeCalendar } from '@/components/home/home-calendar';
import { CoachCard } from '@/components/home/coach-card';
import { getSettings } from '@/lib/settings';
import { getActiveDay } from '@/lib/queries';
import { getCoachStatus } from '@/lib/coach/nudge';
import { getDailyActivity, getTotals, getRecentPRs, getConsistency, getStrengthSignals } from '@/lib/analytics';
import { kgToDisplay, formatWeight } from '@/lib/units';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const SPLIT_TONE: Record<string, string> = { LEGS: 'text-ember-1', PUSH: 'text-ice', PULL: 'text-mint' };

export default async function HomePage() {
  const settings = await getSettings();
  const [day, daily, totals, recentPRs, consistency, coach, strengthSignals] = await Promise.all([
    getActiveDay(settings.activeBlockSlug, settings.currentDayOrder),
    getDailyActivity(35),
    getTotals(),
    getRecentPRs(4),
    getConsistency(),
    getCoachStatus(),
    getStrengthSignals(7),
  ]);
  const units = settings.units;
  const topSignals = strengthSignals.slice(0, 3);
  const tonnageDisplay = Math.round(kgToDisplay(totals.tonnageKg, units) ?? 0);

  return (
    <div className="px-4 pb-6 pt-[calc(16px+var(--safe-top))]">
      {/* Hero */}
      <div className="mb-4">
        <div className="mb-1 flex items-center gap-2">
          <span className="block h-2 w-2 animate-pulse-ember rounded-full bg-ember-2" />
          <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-text-faint">Forge</span>
        </div>
        <h1 className="font-display text-3xl font-bold leading-tight">
          {consistency.streakWeeks > 0 ? (
            <>
              <span className="text-gradient-ember">{consistency.streakWeeks}-week</span> streak
            </>
          ) : (
            <>Let’s build.</>
          )}
        </h1>
        <p className="mt-1 text-sm text-text-dim">
          {consistency.thisWeek > 0
            ? `${consistency.thisWeek} session${consistency.thisWeek > 1 ? 's' : ''} logged this week. Keep the fire going.`
            : 'No sessions yet this week — time to train.'}
        </p>
      </div>

      {/* AI accountability coach */}
      <CoachCard
        data={{
          onboarded: coach.onboarded,
          enabled: coach.enabled,
          persona: coach.persona,
          liveHeadline: coach.liveHeadline,
          liveTone: coach.liveTone,
          latestNudge: coach.latestNudge,
        }}
      />

      {/* Share affordance — turn the coach roast / strength win into a screenshot */}
      {(coach.latestNudge || topSignals.length > 0) && (
        <Link
          href="/share"
          className="tap mb-4 -mt-1 flex items-center justify-center gap-1.5 text-[12px] font-medium text-ember-1"
        >
          <Share2 size={13} /> Make a share card
        </Link>
      )}

      {/* You're getting stronger — load on the bar, NOT e1RM */}
      {topSignals.length > 0 && (
        <section className="mb-4 overflow-hidden rounded-card border border-mint/25 bg-surface p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <ArrowUpRight size={16} className="text-mint" />
            <h2 className="font-display text-base font-semibold">You’re getting stronger</h2>
          </div>
          <ul className="space-y-1.5">
            {topSignals.map((s) => (
              <li
                key={s.slug}
                className="flex items-center gap-3 rounded-xl border border-border surface-2 px-3.5 py-2.5"
              >
                <span className="num shrink-0 text-base font-bold text-mint">
                  +{formatWeight(s.deltaKg, units)} {units}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">on {s.name}</span>
                <span className="num shrink-0 text-[11px] text-text-faint">
                  {formatWeight(s.fromKg, units)} → {formatWeight(s.toKg, units)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2.5 text-[11px] text-text-faint">More load on the bar this week. That’s real.</p>
        </section>
      )}

      {/* Next session CTA */}
      {day && (
        <div className="mb-4 overflow-hidden rounded-card border border-ember-2/25 bg-ember-grad-soft">
          <div className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wide text-text-faint">Next up</div>
              <div className="flex items-center gap-2">
                <span className="truncate font-display text-lg font-bold">{day.name}</span>
                <span className={cn('text-[11px] font-semibold uppercase', SPLIT_TONE[day.splitType])}>{day.splitType}</span>
              </div>
              <div className="num mt-0.5 text-xs text-text-faint">{day.slots.length} exercises · {day.blockName.replace(/—.*/, '').trim()}</div>
            </div>
            <Link href="/today/guided" className="tap shrink-0 rounded-pill bg-ember-grad px-5 py-2.5 text-sm font-semibold text-black shadow-ember-sm">
              Start
            </Link>
          </div>
          <div className="grid grid-cols-2 border-t border-ember-2/20 text-xs font-medium text-text-dim">
            <Link href="/today" className="tap flex items-center justify-center gap-1.5 py-2.5">
              Open full logger
            </Link>
            <Link href="/today/custom" className="tap flex items-center justify-center gap-1.5 border-l border-ember-2/20 py-2.5">
              <Plus size={14} /> Freestyle
            </Link>
          </div>
        </div>
      )}

      {/* Activity calendar */}
      <section className="mb-4 rounded-card border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Training activity</h2>
          <div className="flex items-center gap-2">
            <span className="num inline-flex items-center gap-1 rounded-pill bg-ember-2/12 px-2 py-0.5 text-[11px] font-medium text-ember-1">
              <Flame size={11} /> {consistency.streakWeeks} wk
            </span>
            <Link href="/history" className="tap inline-flex items-center gap-0.5 text-[11px] font-medium text-ice">
              History <ChevronRight size={12} />
            </Link>
          </div>
        </div>
        <HomeCalendar days={daily} units={units} />
        <p className="mt-2.5 text-[11px] text-text-faint">Tap a 🔥 day to see that workout.</p>
      </section>

      {/* Stats grid */}
      <section className="mb-4 grid grid-cols-2 gap-2">
        <StatTile icon={<Layers size={15} className="text-ember-1" />} label="Total volume" value={tonnageDisplay.toLocaleString()} unit={units} />
        <StatTile icon={<CalendarCheck size={15} className="text-mint" />} label="Sessions" value={`${totals.sessions}`} />
        <StatTile icon={<Activity size={15} className="text-ice" />} label="Days trained" value={`${totals.daysTrained}`} />
        <StatTile icon={<Dumbbell size={15} className="text-ember-2" />} label="Working sets" value={totals.sets.toLocaleString()} />
      </section>

      {/* Recent PRs */}
      <section className="rounded-card border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 font-display text-base font-semibold">
            <Trophy size={16} className="text-ember-1" /> Recent PRs
          </h2>
          <Link href="/progress" className="tap inline-flex items-center gap-0.5 text-xs font-medium text-ice">
            All progress <ChevronRight size={13} />
          </Link>
        </div>
        {recentPRs.length > 0 ? (
          <ul className="space-y-1.5">
            {recentPRs.map((pr) => (
              <li key={pr.exerciseId}>
                <Link href={`/library/${pr.slug}`} className="tap flex items-center gap-3 rounded-xl border border-border surface-2 px-3.5 py-2.5">
                  <TrendingUp size={15} className="shrink-0 text-mint" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{pr.name}</span>
                  <span className="num shrink-0 text-sm font-semibold text-ember-1">
                    {formatWeight(pr.e1RM, units)} {units}
                  </span>
                  <span className="num shrink-0 text-[11px] text-text-faint">{formatDate(pr.ts)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-text-faint">Log a few sessions and your records will show up here.</p>
        )}
      </section>
    </div>
  );
}

function StatTile({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-card border border-border surface-2 p-3.5">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-text-faint">
        {icon} {label}
      </div>
      <div className="num text-2xl font-bold leading-none">
        {value}
        {unit && <span className="ml-1 text-sm text-text-faint">{unit}</span>}
      </div>
    </div>
  );
}
