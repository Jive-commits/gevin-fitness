import 'server-only';
import { prisma } from '@/lib/prisma';
import type { CoachProfile } from '@prisma/client';
import type { CoachChannel, PersonaId } from './types';

export type { CoachProfile };

/** Read the single coach profile, lazily creating the default row (race-safe). */
export async function getCoachProfile(): Promise<CoachProfile> {
  const row = await prisma.coachProfile.findUnique({ where: { id: 'default' } });
  if (row) return row;
  try {
    return await prisma.coachProfile.create({ data: { id: 'default' } });
  } catch {
    // A concurrent request created it first — read the row that now exists.
    const created = await prisma.coachProfile.findUnique({ where: { id: 'default' } });
    if (created) return created;
    throw new Error('Failed to initialize coach profile');
  }
}

export function isOnboarded(p: CoachProfile): boolean {
  return p.onboardedAt != null || (!!p.primaryGoal && !!p.why);
}

/** A goal phrase the personas can speak naturally — prefers the lifter's own words. */
export function goalPhrase(p: CoachProfile): string | null {
  if (p.goalDetail && p.goalDetail.trim()) return p.goalDetail.trim();
  switch (p.primaryGoal) {
    case 'lose_fat':
      return 'lose fat';
    case 'build_muscle':
      return 'build muscle';
    case 'get_stronger':
      return 'get stronger';
    case 'stay_consistent':
      return 'stay consistent';
    case 'athletic':
      return 'get more athletic';
    case 'health':
      return 'get healthier';
    default:
      return null;
  }
}

export function personaOf(p: CoachProfile): PersonaId {
  const id = p.persona as PersonaId;
  return (['savage', 'hype', 'mentor', 'zen', 'analyst'] as PersonaId[]).includes(id) ? id : 'mentor';
}

export function channelOf(p: CoachProfile): CoachChannel {
  return (['in_app', 'sms', 'both'] as CoachChannel[]).includes(p.channel as CoachChannel)
    ? (p.channel as CoachChannel)
    : 'in_app';
}
