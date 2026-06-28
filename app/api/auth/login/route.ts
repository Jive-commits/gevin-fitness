import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, expectedToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const passcode: string = body?.passcode ?? '';
  const configured = process.env.APP_PASSCODE ?? '';

  if (!configured) {
    return NextResponse.json(
      { ok: false, error: 'Server has no APP_PASSCODE configured.' },
      { status: 500 },
    );
  }

  if (passcode !== configured) {
    return NextResponse.json({ ok: false, error: 'Incorrect passcode.' }, { status: 401 });
  }

  const token = await expectedToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90, // 90 days
  });
  return res;
}
