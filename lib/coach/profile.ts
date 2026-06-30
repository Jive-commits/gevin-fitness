import 'server-only';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/session-user';
import type { CoachProfile } from '@prisma/client';
import type { CoachChannel, PersonaId } from './types';

export type { CoachProfile };

/** Read the current tenant's coach profile, lazily creating it (race-safe). */
export async function getCoachProfile(): Promise<CoachProfile> {
  const userId = await getCurrentUserId();
  const row = await prisma.coachProfile.findFirst({ where: { userId } });
  if (row) return row;
  // Adopt a pre-tenancy singleton row onto this user, if one exists.
  const legacy = await prisma.coachProfile.findUnique({ where: { id: 'default' } });
  if (legacy) {
    if (legacy.userId == null) return prisma.coachProfile.update({ where: { id: 'default' }, data: { userId } });
    if (legacy.userId === userId) return legacy;
  }
  try {
    return await prisma.coachProfile.create({ data: { userId } });
  } catch {
    // A concurrent request created it first — read the row that now exists.
    const created = await prisma.coachProfile.findFirst({ where: { userId } });
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

/** The five tiers of the aggression spectrum, gentle → unhinged. */
const SPECTRUM: PersonaId[] = ['corner', 'mentor', 'drill', 'savage', 'unhinged'];

/**
 * Map any legacy stored persona value onto the closest spectrum tier so rows
 * written before the spectrum still resolve (no DB migration). `mentor` and
 * `savage` already map to themselves and are handled by the valid-id check.
 */
export const LEGACY_PERSONA_MAP: Record<string, PersonaId> = {
  hype: 'mentor', // energetic-but-supportive → the firm-but-real middle
  zen: 'corner', // quiet & gentle → the supportive tier
  analyst: 'mentor', // clinical & firm → the firm-but-real middle
};

export function personaOf(p: CoachProfile): PersonaId {
  const id = p.persona as PersonaId;
  if (SPECTRUM.includes(id)) return id;
  return LEGACY_PERSONA_MAP[p.persona] ?? 'mentor';
}

export function channelOf(p: CoachProfile): CoachChannel {
  return (['in_app', 'sms', 'both'] as CoachChannel[]).includes(p.channel as CoachChannel)
    ? (p.channel as CoachChannel)
    : 'in_app';
}
