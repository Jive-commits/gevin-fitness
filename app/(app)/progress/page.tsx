import Link from 'next/link';
import { Flame, CalendarCheck, Activity, Scale } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { E1RMChart } from '@/components/charts/e1rm-chart';
import { VolumeHeatChart } from '@/components/charts/volume-heat-chart';
import { Sparkline } from '@/components/charts/sparkline';
import { TrendPill } from '@/components/exercise/trend-pill';
import { BodyweightLogger } from '@/components/progress/bodyweight-logger';
import { ExercisePickerBar } from '@/components/progress/exercise-picker-bar';
import { getSettings } from '@/lib/settings';
import {
  getLoggedExercises,
  getExerciseSeries,
  computeTrend,
  getWeeklyVolumeByMuscle,
  getAvgSessionRpeTrend,
  getConsistency,
  getBodyweightSeries,
} from '@/lib/analytics';
import { kgToDisplay, roundDisplay, formatWeight } from '@/lib/units';

export const dynamic = 'force-dynamic';

export default async function ProgressPage({ searchParams }: { searchParams: { ex?: string } }) {
  const [settings, logged, weekly, rpeTrend, consistency, bw] = await Promise.all([
    getSettings(),
    getLoggedExercises(),
    getWeeklyVolumeByMuscle(8),
    getAvgSessionRpeTrend(),
    getConsistency(),
    getBodyweightSeries(),
  ]);
  const units = settings.units;

  const selected = logged.find((e) => e.slug === searchParams.ex) ?? logged[0] ?? null;
  const series = selected ? await getExerciseSeries(selected.id) : [];
  const trend = computeTrend(series);

  const hasAny = logged.length > 0;

  return (
    <>
      <PageHeader title="Progress" eyebrow="Trends · PRs · volume" />

      <div className="space-y-4 px-4 pb-6 pt-3">
        {/* Consistency strip */}
        <div className="grid grid-cols-3 gap-2">
          <MetricTile icon={<Flame size={16} className="text-ember-1" />} label="Streak" value={`${consistency.streakWeeks}`} unit="wk" />
          <MetricTile icon={<CalendarCheck size={16} className="text-mint" />} label="This week" value={`${consistency.thisWeek}`} unit="sessions" />
          <MetricTile icon={<Activity size={16} className="text-ice" />} label="All-time" value={`${consistency.sessions}`} unit="sessions" />
        </div>

        {!hasAny ? (
          <div className="rounded-card border border-border surface-2 px-5 py-14 text-center">
            <p className="font-display text-lg font-semibold">No data yet</p>
            <p className="mt-1 text-sm text-text-dim">Finish a session in Today and your trends, PRs, and volume will populate here.</p>
            <Link href="/today" className="mt-4 inline-flex rounded-pill bg-ember-grad px-5 py-2 text-sm font-semibold text-black">
              Go to Today
            </Link>
          </div>
        ) : (
          <>
            {/* e1RM trend with exercise picker */}
            <section className="rounded-card border border-border bg-surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-base font-semibold">Estimated 1RM</h2>
                {trend.current != null && (
                  <span className="num text-sm font-bold text-gradient-ember">
                    {formatWeight(trend.current, units)} {units}
                  </span>
                )}
              </div>

              <ExercisePickerBar exercises={logged} selectedSlug={selected?.slug} />

              {series.length > 0 ? (
                <>
                  <div className="mb-3">
                    <TrendPill trend={trend} units={units} />
                  </div>
                  <E1RMChart points={series} units={units} />
                </>
              ) : (
                <p className="py-8 text-center text-sm text-text-faint">Select a lift with logged sets.</p>
              )}
            </section>

            {/* Weekly volume heat */}
            <section className="rounded-card border border-border bg-surface p-4">
              <h2 className="mb-1 font-display text-base font-semibold">Weekly volume</h2>
              <VolumeHeatChart weeks={weekly} units={units} />
            </section>

            {/* Avg session RPE */}
            {rpeTrend.length > 0 && (
              <section className="rounded-card border border-border bg-surface p-4">
                <div className="mb-1 flex items-center justify-between">
                  <h2 className="font-display text-base font-semibold">Avg session RPE</h2>
                  <span className="num text-sm font-semibold text-ember-1">{rpeTrend[rpeTrend.length - 1].avgRpe.toFixed(1)}</span>
                </div>
                <Sparkline points={rpeTrend.map((p) => ({ ts: p.ts, value: p.avgRpe }))} color="#FF6A2C" suffix="" decimals={1} />
              </section>
            )}
          </>
        )}

        {/* Bodyweight */}
        <section className="rounded-card border border-border bg-surface p-4">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 font-display text-base font-semibold">
              <Scale size={16} className="text-ice" /> Bodyweight
            </h2>
            <div className="flex items-center gap-2">
              {bw.length > 0 && (
                <span className="num text-sm font-semibold">
                  {roundDisplay(kgToDisplay(bw[bw.length - 1].weightKg, units)!, units)} {units}
                </span>
              )}
              <BodyweightLogger units={units} />
            </div>
          </div>
          <Sparkline
            points={bw.map((p) => ({ ts: p.ts, value: roundDisplay(kgToDisplay(p.weightKg, units)!, units) }))}
            color="#5BA8FF"
            suffix={` ${units}`}
            decimals={1}
          />
        </section>
      </div>
    </>
  );
}

function MetricTile({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string; unit: string }) {
  return (
    <div className="rounded-card border border-border surface-2 px-2 py-3 text-center">
      <div className="mb-1 flex justify-center">{icon}</div>
      <div className="num text-2xl font-bold leading-none">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wide text-text-faint">{label}</div>
    </div>
  );
}
