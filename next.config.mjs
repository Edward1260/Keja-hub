/** @type {import('next').NextConfig} */
const nextConfig = {
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
