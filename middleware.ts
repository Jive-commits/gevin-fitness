import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, isValidToken } from '@/lib/auth';

// Paths that never require auth.
const PUBLIC_PREFIXES = ['/login', '/api/auth', '/api/health'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const ok = await isValidToken(token);

  if (!ok) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals & static files.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.svg|robots.txt).*)'],
};
