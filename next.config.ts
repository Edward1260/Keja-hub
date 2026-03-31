import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    turbopack: true,
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  swcMinify: true,
  output: 'standalone',
};

export default nextConfig;
