// Shared types for the AI accountability coach. Pure — safe to import anywhere.

// The aggression spectrum — five ordered tiers, gentle → unhinged. `mentor` and
// `savage` are reused so existing stored values + the schema default stay valid
// with no DB migration.
export type PersonaId = 'corner' | 'mentor' | 'drill' | 'savage' | 'unhinged';

export type TriggerKind =
  | 'streak_risk' // active streak, today still empty, evening closing in
  | 'missed_day' // gap past the lifter's normal cadence
  | 'milestone' // streak milestone or fresh all-time PR — celebrate
  | 'comeback' // logged again after a real layoff — welcome back
  | 'checkin' // gentle scheduled touch
  | 'manual_test'; // "Test your coach" preview

export type CoachChannel = 'in_app' | 'sms' | 'both';

/** Structured facts a nudge is built from — fed to both the LLM and the templated fallback. */
export type NudgeFacts = {
  goal: string | null; // human goal phrase ("lose 20 lb")
  why: string | null; // the deep reason
  streak: number; // current daily streak (days)
  daysSince: number | null; // full days since last training day
  daysPerWeek: number; // target cadence
  milestoneKind?: 'streak' | 'pr' | null;
  prName?: string | null;
  prValue?: number | null; // e1RM, display units already applied
  units?: string;
};

export type NudgeIntent = {
  trigger: TriggerKind;
  urgency: 1 | 2 | 3; // 1 light · 2 firm · 3 hard
  headline: string; // short in-app status label, persona-neutral
  facts: NudgeFacts;
};
