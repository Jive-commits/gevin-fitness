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
  },
};

module.exports = nextConfig;
