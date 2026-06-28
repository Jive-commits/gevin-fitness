'use server';

import { getExerciseSeries, computeTrend, getExerciseHistory, getExercisePRs } from '@/lib/analytics';

/** On-demand progress payload for a single lift — used by the in-logger peek. */
export async function getExerciseProgress(exerciseId: string) {
  const [series, history, prs] = await Promise.all([
    getExerciseSeries(exerciseId),
    getExerciseHistory(exerciseId, 5),
    getExercisePRs(exerciseId),
  ]);
  const trend = computeTrend(series);
  return { series, trend, history, prs };
}
