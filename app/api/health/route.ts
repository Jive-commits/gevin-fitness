import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Railway healthcheck. Confirms the process is up and the DB is reachable.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', db: 'connected' });
  } catch (e) {
    return NextResponse.json(
      { status: 'degraded', db: 'unreachable' },
      { status: 200 },
    );
  }
}
