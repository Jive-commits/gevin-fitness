/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  eslint: {
    // Don't block production builds on lint; CI/Railup should stay green.
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Prisma needs to be treated as an external in server components.
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
    // Don't serve a stale client-cached RSC when navigating back to a dynamic
    // page (e.g. Today): always refetch so an in-progress session shows its
    // already-saved sets instead of the pre-workout empty state.
    staleTimes: { dynamic: 0, static: 30 },
  },
};

module.exports = nextConfig;
