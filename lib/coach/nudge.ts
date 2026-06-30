import 'server-only';
import { prisma } from '@/lib/prisma';
import { getSettings } from '@/lib/settings';
import { roundDisplay, kgToDisplay } from '@/lib/units';
import { getCoachProfile, goalPhrase, personaOf, channelOf } from './profile';
import { getCoachActivity, localHour, type CoachActivity } from './activity';
import { evaluateTrigger, sampleIntent } from './triggers';
import { generateNudgeBody } from './voice';
import { smsConfigured, sendSms } from './sms';
import type { NudgeIntent, TriggerKind } from './types';

const COOLDOWN_MS = 16 * 3600 * 1000; // min gap between auto nudges
const SAME_TRIGGER_MS = 20 * 3600 * 1000; // don't repeat the same trigger within this window

export function inQuietHours(quietStart: number, quietEnd: number, hour: number): boolean {
  if (quietStart === quietEnd) return false;
  if (quietStart < quietEnd) return hour >= quietStart && hour < quietEnd;
  return hour >= quietStart || hour < quietEnd; // wraps past midnight (e.g. 21 → 8)
}

export type TickResult = {
  sent: boolean;
  reason?: string;
  trigger?: TriggerKind;
  body?: string;
  source?: 'ai' | 'template';
  channel?: 'sms' | 'in_app';
  smsError?: string;
};

type TickOpts = {
  force?: boolean; // bypass cooldown/dedup (Test your coach)
  inAppOnly?: boolean; // never text (page-load surfacing)
  intent?: NudgeIntent; // explicit intent (Test your coach)
  test?: boolean; // use a representative sample intent (Test your coach)
};

/** Convert any kg PR value carried in the intent to the lifter's display units. */
function localizeIntent(intent: NudgeIntent, units: 'kg' | 'lb'): NudgeIntent {
  if (intent.facts.prValue == null) return { ...intent, facts: { ...intent.facts, units } };
  return {
    ...intent,
    facts: {
      ...intent.facts,
      units,
      prValue: roundDisplay(kgToDisplay(intent.facts.prValue, units) ?? intent.facts.prValue, units),
    },
  };
}

/** Evaluate + (maybe) deliver one nudge. The single entry point for cron, test, and page-load. */
export async function runCoachTick(opts: TickOpts = {}): Promise<TickResult> {
  const profile = await getCoachProfile();
  if (!opts.force && !profile.enabled) return { sent: false, reason: 'disabled' };

  const now = Date.now();
  const hour = localHour(now, profile.timezone);
  const settings = await getSettings();
  const units = settings.units;
  const activity = await getCoachActivity(profile.timezone, now);

  const rawIntent =
    opts.intent ??
    (opts.test
      ? sampleIntent({ goal: goalPhrase(profile), why: profile.why, units, daysPerWeek: profile.trainingDaysPerWeek })
      : evaluateTrigger({
          daysPerWeek: profile.trainingDaysPerWeek,
          goal: goalPhrase(profile),
          why: profile.why,
          units,
          activity,
          localHour: hour,
        }));
  if (!rawIntent) return { sent: false, reason: 'no_trigger' };
  const intent = localizeIntent(rawIntent, units);

  if (!opts.force) {
    if (profile.lastNudgeAt && now - profile.lastNudgeAt.getTime() < COOLDOWN_MS)
      return { sent: false, reason: 'cooldown', trigger: intent.trigger };
    const dupe = await prisma.nudgeLog.findFirst({
      where: { direction: 'outbound', trigger: intent.trigger, createdAt: { gt: new Date(now - SAME_TRIGGER_MS) } },
      select: { id: true },
    });
    if (dupe) return { sent: false, reason: 'already_sent', trigger: intent.trigger };
  }

  const persona = personaOf(profile);
  const { body, source } = await generateNudgeBody(persona, profile.intensity, intent);

  // Channel resolution. Page-load surfacing never texts; cron/test may.
  const wantChannel = opts.inAppOnly ? 'in_app' : channelOf(profile);
  const smsEligible =
    wantChannel !== 'in_app' &&
    profile.smsConsent &&
    !profile.smsStopped &&
    !!profile.phoneNumber &&
    smsConfigured() &&
    !inQuietHours(profile.quietStartHour, profile.quietEndHour, hour);

  let usedChannel: 'sms' | 'in_app' = 'in_app';
  let twilioSid: string | undefined;
  let smsError: string | undefined;
  let status = 'created';
  if (smsEligible && profile.phoneNumber) {
    const r = await sendSms(profile.phoneNumber, body);
    if (r.ok) {
      usedChannel = 'sms';
      twilioSid = r.sid;
      status = 'sent';
    } else {
      smsError = r.error; // record but still surface in-app
    }
  }

  await prisma.nudgeLog.create({
    data: {
      profileId: profile.id,
      direction: 'outbound',
      channel: usedChannel,
      trigger: intent.trigger,
      persona,
      body,
      status,
      twilioSid,
      meta: { urgency: intent.urgency, headline: intent.headline, source, ...(smsError ? { smsError } : {}) },
    },
  });
  await prisma.coachProfile.update({ where: { id: profile.id }, data: { lastNudgeAt: new Date(now) } });

  return { sent: true, trigger: intent.trigger, body, source, channel: usedChannel, smsError };
}

/** Generate a preview for the chosen persona without touching delivery (Test your coach). */
export async function previewNudge(): Promise<{ body: string; source: 'ai' | 'template' }> {
  const profile = await getCoachProfile();
  const settings = await getSettings();
  const intent = sampleIntent({
    goal: goalPhrase(profile),
    why: profile.why,
    units: settings.units,
    daysPerWeek: profile.trainingDaysPerWeek,
  });
  const persona = personaOf(profile);
  return generateNudgeBody(persona, profile.intensity, intent);
}

/**
 * Compose a nudge based on the lifter's CURRENT real situation, with no delivery
 * and no DB write — for the Home "pep talk" button. Falls back to a motivating
 * sample when nothing is actively triggering.
 */
export async function composeNudge(): Promise<{ body: string; source: 'ai' | 'template'; trigger: TriggerKind }> {
  const profile = await getCoachProfile();
  const settings = await getSettings();
  const activity = await getCoachActivity(profile.timezone);
  const hour = localHour(Date.now(), profile.timezone);
  let intent =
    evaluateTrigger({
      daysPerWeek: profile.trainingDaysPerWeek,
      goal: goalPhrase(profile),
      why: profile.why,
      units: settings.units,
      activity,
      localHour: hour,
    }) ?? sampleIntent({ goal: goalPhrase(profile), why: profile.why, units: settings.units, daysPerWeek: profile.trainingDaysPerWeek });
  intent = localizeIntent(intent, settings.units);
  const persona = personaOf(profile);
  const { body, source } = await generateNudgeBody(persona, profile.intensity, intent);
  return { body, source, trigger: intent.trigger };
}

// ---------- Read models for the UI ----------

export type CoachStatus = {
  onboarded: boolean;
  enabled: boolean;
  persona: string;
  activity: CoachActivity;
  liveHeadline: string;
  liveTone: 'good' | 'warn' | 'idle';
  latestNudge: { id: string; body: string; trigger: string; channel: string; createdAt: number } | null;
};

/** Snapshot for the Home coach card — pure read, no writes. */
export async function getCoachStatus(): Promise<CoachStatus> {
  const profile = await getCoachProfile();
  const onboarded = profile.onboardedAt != null || (!!profile.primaryGoal && !!profile.why);
  const activity = await getCoachActivity(profile.timezone);
  const hour = localHour(Date.now(), profile.timezone);

  let liveHeadline = 'Ready when you are.';
  let liveTone: 'good' | 'warn' | 'idle' = 'idle';
  if (activity.trainedToday) {
    liveHeadline = activity.dailyStreak > 1 ? `${activity.dailyStreak}-day streak — locked in today.` : 'Logged today. That’s the standard.';
    liveTone = 'good';
  } else if (activity.dailyStreak >= 2 && hour >= 16) {
    liveHeadline = `${activity.dailyStreak}-day streak on the line — train today to keep it.`;
    liveTone = 'warn';
  } else if (activity.daysSinceLastTrained != null && activity.daysSinceLastTrained >= 2) {
    liveHeadline = `${activity.daysSinceLastTrained} days since your last session. Time to move.`;
    liveTone = 'warn';
  } else if (activity.daysSinceLastTrained === 1) {
    liveHeadline = 'Fresh off yesterday — keep the momentum.';
    liveTone = 'idle';
  }

  const latest = await prisma.nudgeLog.findFirst({
    where: { direction: 'outbound' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, body: true, trigger: true, channel: true, createdAt: true },
  });

  return {
    onboarded,
    enabled: profile.enabled,
    persona: personaOf(profile),
    activity,
    liveHeadline,
    liveTone,
    latestNudge: latest
      ? { id: latest.id, body: latest.body, trigger: latest.trigger, channel: latest.channel, createdAt: latest.createdAt.getTime() }
      : null,
  };
}

export async function getRecentNudges(limit = 12) {
  const rows = await prisma.nudgeLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    direction: r.direction,
    channel: r.channel,
    trigger: r.trigger,
    persona: r.persona,
    body: r.body,
    status: r.status,
    createdAt: r.createdAt.getTime(),
  }));
}
