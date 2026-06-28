import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Quote, Repeat, Youtube, Trophy } from 'lucide-react';
import { getExerciseBySlug } from '@/lib/queries';
import { getExerciseSeries, computeTrend, getExercisePRs, getExerciseHistory } from '@/lib/analytics';
import { getSettings } from '@/lib/settings';
import { E1RMChart } from '@/components/charts/e1rm-chart';
import { TrendPill } from '@/components/exercise/trend-pill';
import { CustomExerciseActions } from '@/components/library/custom-exercise-actions';
import { SpinalLoadMeter, BackSafeBadge, MusclePills, EquipmentChips } from '@/components/exercise/exercise-bits';
import { patternLabel, formatDate } from '@/lib/format';
import { formatWeight } from '@/lib/units';

export const dynamic = 'force-dynamic';

export default async function ExerciseDetailPage({ params }: { params: { slug: string } }) {
  const exercise = await getExerciseBySlug(params.slug);
  if (!exercise) notFound();

  const [settings, series, prs, history] = await Promise.all([
    getSettings(),
    getExerciseSeries(exercise.id),
    getExercisePRs(exercise.id),
    getExerciseHistory(exercise.id),
  ]);
  const trend = computeTrend(series);
  const units = settings.units;
  const hasData = series.length > 0;

  return (
    <div className="pb-8">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-bg/80 px-4 pb-3 pt-[calc(14px+var(--safe-top))] backdrop-blur-xl">
        <Link href="/library" className="tap grid h-9 w-9 place-items-center rounded-full surface-2 border border-border text-text-dim">
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-display text-xl font-bold">{exercise.name}</h1>
            {exercise.isCustom && <span className="rounded-pill bg-ice/12 px-1.5 py-0.5 text-[10px] font-medium text-ice">Custom</span>}
          </div>
        </div>
      </header>

      <div className="space-y-4 px-4 pt-4">
        {/* Tags */}
        <div className="space-y-2.5">
          <MusclePills primary={exercise.primaryMuscle} secondary={exercise.secondaryMuscles} max={5} />
          <div className="flex flex-wrap items-center gap-2">
            <EquipmentChips equipment={exercise.equipment} max={8} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-pill surface-2 border border-border px-2 py-0.5 text-text-dim">{patternLabel(exercise.movementPattern)}</span>
            <span className="rounded-pill surface-2 border border-border px-2 py-0.5 text-text-dim">{exercise.category === 'COMPOUND' ? 'Compound' : 'Isolation'}</span>
            {exercise.unilateral && <span className="rounded-pill surface-2 border border-border px-2 py-0.5 text-text-dim">Unilateral</span>}
            {exercise.defaultRepRange && <span className="num rounded-pill surface-2 border border-border px-2 py-0.5 text-text-dim">{exercise.defaultRepRange} reps</span>}
          </div>
          <div className="flex items-center gap-2">
            {exercise.isBackSafe ? <BackSafeBadge /> : <SpinalLoadMeter load={exercise.spinalLoad} />}
          </div>
        </div>

        {/* Cues */}
        {exercise.cues && (
          <div className="flex items-start gap-2 rounded-card border border-border surface-2 p-3.5">
            <Quote size={15} className="mt-0.5 shrink-0 text-ember-1" />
            <p className="text-sm leading-relaxed text-text-dim">{exercise.cues}</p>
          </div>
        )}
        {exercise.tempoNote && (
          <div className="flex items-center gap-2 text-sm text-text-dim">
            <Repeat size={14} className="text-text-faint" /> {exercise.tempoNote}
          </div>
        )}
        {exercise.videoUrl && (
          <a href={exercise.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-ice">
            <Youtube size={16} /> Watch demo
          </a>
        )}

        {exercise.isCustom && <CustomExerciseActions exercise={exercise} />}

        {/* Analytics */}
        <section className="rounded-card border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Estimated 1RM</h2>
            {trend.current != null && (
              <span className="num text-sm font-bold text-gradient-ember">
                {formatWeight(trend.current, units)} {units}
              </span>
            )}
          </div>
          {hasData ? (
            <>
              <div className="mb-3">
                <TrendPill trend={trend} units={units} />
              </div>
              <E1RMChart points={series} units={units} />
              <p className="mt-2 text-[11px] text-text-faint">
                Epley estimate (weight × reps). Dimmed dots are high-rep, lower-confidence. Hover for the Brzycki cross-check.
              </p>
            </>
          ) : (
            <p className="py-8 text-center text-sm text-text-faint">Log this lift to start its e1RM trend.</p>
          )}
        </section>

        {/* PRs */}
        {(prs.bestE1RM || prs.weightForReps.length > 0) && (
          <section className="rounded-card border border-border bg-surface p-4">
            <h2 className="mb-3 flex items-center gap-1.5 font-display text-base font-semibold">
              <Trophy size={16} className="text-ember-1" /> Personal records
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {prs.bestE1RM && (
                <PrStat label="Best e1RM" value={`${formatWeight(prs.bestE1RM.value, units)} ${units}`} sub={formatDate(prs.bestE1RM.ts)} />
              )}
              {prs.bestVolumeSet && (
                <PrStat label="Best set volume" value={`${formatWeight(prs.bestVolumeSet.value, units)} ${units}`} sub={formatDate(prs.bestVolumeSet.ts)} />
              )}
            </div>
            {prs.weightForReps.length > 0 && (
              <div className="mt-3">
                <div className="mb-1.5 text-[11px] uppercase tracking-wide text-text-faint">Heaviest per rep</div>
                <div className="flex flex-wrap gap-1.5">
                  {prs.weightForReps.map((w) => (
                    <span key={w.reps} className="num rounded-lg surface-2 border border-border px-2 py-1 text-xs">
                      <span className="text-ember-1">{formatWeight(w.weightKg, units)}</span>
                      <span className="text-text-faint"> × {w.reps}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* History */}
        {history.length > 0 && (
          <section className="rounded-card border border-border bg-surface p-4">
            <h2 className="mb-3 font-display text-base font-semibold">History</h2>
            <ul className="space-y-2.5">
              {history.map((h, i) => (
                <li key={i} className="flex items-start justify-between gap-3 border-b border-border pb-2.5 last:border-0 last:pb-0">
                  <span className="num shrink-0 text-xs text-text-faint">{formatDate(h.ts)}</span>
                  <div className="flex flex-1 flex-wrap justify-end gap-1.5">
                    {h.sets.map((s, j) => (
                      <span key={j} className="num rounded-md surface-2 px-1.5 py-0.5 text-[11px] text-text-dim">
                        {formatWeight(s.weightKg, units)}×{s.reps}
                        {s.rpe != null && <span className="text-ember-1">@{s.rpe}</span>}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function PrStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border surface-2 px-3 py-2.5">
      <div className="num text-base font-bold">{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-text-faint">{label}</div>
      <div className="num mt-0.5 text-[10px] text-text-faint">{sub}</div>
    </div>
  );
}
