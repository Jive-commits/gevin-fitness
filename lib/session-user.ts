import 'server-only';
import { prisma } from '@/lib/prisma';

/** The single tenant id for the current single-passcode app. */
export const DEFAULT_USER_ID = 'usr_default';

/**
 * The current tenant's user id. Today the app is single-tenant behind one
 * passcode, so this resolves to the one default user (creating it if a fresh
 * database hasn't been migrated/seeded yet). This is the seam real auth
 * (phone OTP → a per-session userId) plugs into without touching any caller.
 */
export async function getCurrentUserId(): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { id: DEFAULT_USER_ID }, select: { id: true } });
  if (existing) return existing.id;
  // Fresh DB before migrate/seed — create the default tenant idempotently.
  await prisma.user
    .create({ data: { id: DEFAULT_USER_ID, name: 'Default' } })
    .catch(() => {/* a concurrent create won the race */});
  return DEFAULT_USER_ID;
}
