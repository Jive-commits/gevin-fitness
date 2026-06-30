// Pure trigger engine — given the lifter's cadence + activity + local hour,
// decide whether (and how urgently) the coach should reach out. No I/O.
import type { CoachActivity } from './activity';
import type { NudgeFacts, NudgeIntent } from './types';

const STREAK_MILESTONES = new Set([3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 250, 300, 365]);

/** Days of silence before a missed-day nudge, scaled to target cadence. */
export function gapThreshold(daysPerWeek: number): number {
  if (daysPerWeek >= 5) return 2;
  if (daysPerWeek >= 3) return 3;
  return 4;
}

export type EvalInput = {
  daysPerWeek: number;
  goal: string | null;
  why: string | null;
  units: string;
  activity: CoachActivity;
  localHour: number;
};

export function evaluateTrigger(input: EvalInput): NudgeIntent | null {
  const { daysPerWeek, goal, why, units, activity: a, localHour } = input;
  const baseFacts: NudgeFacts = {
    goal,
    why,
    streak: a.dailyStreak,
    daysSince: a.daysSinceLastTrained,
    daysPerWeek,
    units,
  };

  // 1) Fresh all-time PR today — celebrate (highest priority good news).
  if (a.newPRToday) {
    return {
      trigger: 'milestone',
      urgency: 1,
      headline: 'New personal record',
      facts: { ...baseFacts, milestoneKind: 'pr', prName: a.newPRToday.name, prValue: a.newPRToday.e1RM },
    };
  }

  // 2) Streak milestone reached today.
  if (a.streakIncludesToday && STREAK_MILESTONES.has(a.dailyStreak)) {
    return {
      trigger: 'milestone',
      urgency: 1,
      headline: `${a.dailyStreak}-day streak`,
      facts: { ...baseFacts, milestoneKind: 'streak' },
    };
  }

  // 3) Comeback — trained today after a real layoff.
  if (a.trainedToday && a.comebackGap != null && a.comebackGap >= 4) {
    return {
      trigger: 'comeback',
      urgency: 1,
      headline: 'Back in it',
      facts: { ...baseFacts, daysSince: 0 },
    };
  }

  // Nothing else fires once you've already trained today.
  if (a.trainedToday) return null;

  // 4) Streak at risk — momentum going, today still empty, afternoon/evening.
  if (a.dailyStreak >= 2 && localHour >= 16) {
    return {
      trigger: 'streak_risk',
      urgency: a.dailyStreak >= 7 ? 3 : 2,
      headline: `${a.dailyStreak}-day streak at risk`,
      facts: baseFacts,
    };
  }

  // 5) Missed day(s) past your normal cadence — don't nag at dawn.
  const gap = a.daysSinceLastTrained;
  if (gap != null && gap >= gapThreshold(daysPerWeek) && localHour >= 11) {
    const over = gap - gapThreshold(daysPerWeek);
    return {
      trigger: 'missed_day',
      urgency: over >= 3 ? 3 : over >= 1 ? 2 : 1,
      headline: `${gap} days since training`,
      facts: baseFacts,
    };
  }

  return null;
}

/** A representative intent for previewing a persona ("Test your coach"). */
export function sampleIntent(input: Pick<EvalInput, 'goal' | 'why' | 'units' | 'daysPerWeek'>): NudgeIntent {
  return {
    trigger: 'manual_test',
    urgency: 2,
    headline: 'Streak at risk',
    facts: {
      goal: input.goal,
      why: input.why,
      streak: 4,
      daysSince: 1,
      daysPerWeek: input.daysPerWeek,
      units: input.units,
    },
  };
}
