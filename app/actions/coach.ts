'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCoachProfile } from '@/lib/coach/profile';
import { runCoachTick, composeNudge } from '@/lib/coach/nudge';
import { intakeReply, extractProfile } from '@/lib/coach/intake';
import type { ChatMessage } from '@/lib/coach/voice';
import type { PersonaId, CoachChannel } from '@/lib/coach/types';

const PERSONAS: PersonaId[] = ['savage', 'hype', 'mentor', 'zen', 'analyst'];
const CHANNELS: CoachChannel[] = ['in_app', 'sms', 'both'];
const GOALS = ['lose_fat', 'build_muscle', 'get_stronger', 'stay_consistent', 'athletic', 'health'];

function clampStr(s: unknown, max: number): string | undefined {
  if (typeof s !== 'string') return undefined;
  const t = s.trim();
  return t ? t.slice(0, max) : undefined;
}

/** Save the onboarding questionnaire (goals + why). Marks the profile onboarded. */
export async function saveOnboarding(data: {
  primaryGoal?: string;
  goalDetail?: string;
  why?: string;
  whyDeeper?: string;
  identity?: string;
  obstacles?: string;
  trainingDaysPerWeek?: number;
}) {
  await getCoachProfile(); // ensure row exists
  const clean: Record<string, unknown> = {};
  if (data.primaryGoal && GOALS.includes(data.primaryGoal)) clean.primaryGoal = data.primaryGoal;
  clean.goalDetail = clampStr(data.goalDetail, 280) ?? null;
  clean.why = clampStr(data.why, 600) ?? null;
  clean.whyDeeper = clampStr(data.whyDeeper, 600) ?? null;
  clean.identity = clampStr(data.identity, 280) ?? null;
  clean.obstacles = clampStr(data.obstacles, 600) ?? null;
  if (typeof data.trainingDaysPerWeek === 'number')
    clean.trainingDaysPerWeek = Math.max(1, Math.min(7, Math.round(data.trainingDaysPerWeek)));
  clean.onboardedAt = new Date();

  await prisma.coachProfile.update({ where: { id: 'default' }, data: clean });
  revalidatePath('/settings');
  revalidatePath('/home');
  return { ok: true };
}

/** Save coach delivery config (persona, intensity, channel, enable, timezone, quiet hours). */
export async function saveCoachConfig(data: {
  enabled?: boolean;
  persona?: string;
  intensity?: number;
  channel?: string;
  timezone?: string;
  quietStartHour?: number;
  quietEndHour?: number;
}) {
  await getCoachProfile();
  const clean: Record<string, unknown> = {};
  if (typeof data.enabled === 'boolean') clean.enabled = data.enabled;
  if (data.persona && PERSONAS.includes(data.persona as PersonaId)) clean.persona = data.persona;
  if (typeof data.intensity === 'number') clean.intensity = Math.max(1, Math.min(3, Math.round(data.intensity)));
  if (data.channel && CHANNELS.includes(data.channel as CoachChannel)) clean.channel = data.channel;
  if (typeof data.timezone === 'string' && data.timezone.length <= 64) clean.timezone = data.timezone;
  if (typeof data.quietStartHour === 'number') clean.quietStartHour = Math.max(0, Math.min(23, Math.round(data.quietStartHour)));
  if (typeof data.quietEndHour === 'number') clean.quietEndHour = Math.max(0, Math.min(23, Math.round(data.quietEndHour)));

  await prisma.coachProfile.update({ where: { id: 'default' }, data: clean });
  revalidatePath('/settings');
  revalidatePath('/home');
  return { ok: true };
}

const E164 = /^\+[1-9]\d{6,14}$/;

/** Save the SMS number + explicit opt-in consent (TCPA). */
export async function savePhone(data: { phoneNumber?: string; smsConsent?: boolean }) {
  await getCoachProfile();
  const clean: Record<string, unknown> = {};
  if (typeof data.phoneNumber === 'string') {
    const raw = data.phoneNumber.trim();
    if (raw === '') {
      clean.phoneNumber = null;
    } else {
      const normalized = raw.replace(/[^\d+]/g, '');
      if (!E164.test(normalized)) return { ok: false, error: 'Enter a number in international format, e.g. +14155551234.' };
      clean.phoneNumber = normalized;
    }
  }
  if (typeof data.smsConsent === 'boolean') {
    clean.smsConsent = data.smsConsent;
    clean.smsConsentAt = data.smsConsent ? new Date() : null;
    if (data.smsConsent) clean.smsStopped = false; // re-opting in clears a prior STOP
  }
  await prisma.coachProfile.update({ where: { id: 'default' }, data: clean });
  revalidatePath('/settings');
  return { ok: true };
}

/** Send a representative sample from the chosen persona (texts too, if SMS is set up). */
export async function testCoach() {
  const result = await runCoachTick({ force: true, test: true });
  revalidatePath('/settings');
  revalidatePath('/home');
  return result;
}

/** A fresh, on-demand pep talk for the Home card — generated, never delivered or logged. */
export async function coachPepTalk() {
  return composeNudge();
}

function cleanHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-24)
    .map((m: any) => ({
      role: m?.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: String(m?.content ?? '').slice(0, 2000),
    }))
    .filter((m) => m.content.trim());
}

/** One turn of the conversational onboarding — returns the coach's next question. */
export async function coachChatTurn(history: ChatMessage[]) {
  const res = await intakeReply(cleanHistory(history));
  if (!res) return { ok: false as const, error: 'ai_unavailable' };
  return { ok: true as const, reply: res.reply, done: res.done };
}

/** Distill the onboarding chat into the structured profile and save it. */
export async function coachFinishChat(history: ChatMessage[]) {
  const profile = await extractProfile(cleanHistory(history));
  if (!profile) return { ok: false as const, error: 'ai_unavailable' };
  await saveOnboarding({
    primaryGoal: profile.primaryGoal,
    goalDetail: profile.goalDetail,
    why: profile.why,
    whyDeeper: profile.whyDeeper,
    identity: profile.identity,
    obstacles: profile.obstacles,
    trainingDaysPerWeek: profile.trainingDaysPerWeek,
  });
  return { ok: true as const, profile };
}

/** Mark a surfaced nudge as read/dismissed. */
export async function dismissNudge(id: string) {
  if (typeof id !== 'string' || !id) return { ok: false };
  await prisma.nudgeLog.update({ where: { id }, data: { status: 'read', readAt: new Date() } }).catch(() => {});
  revalidatePath('/home');
  return { ok: true };
}
