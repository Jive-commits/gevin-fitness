import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json({
    name: 'FORGE — Strength Tracker',
    short_name: 'FORGE',
    description: 'A precision instrument for serious lifting.',
    start_url: '/home',
    display: 'standalone',
    background_color: '#0a0a0c',
    theme_color: '#0a0a0c',
    orientation: 'portrait',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  });
}
