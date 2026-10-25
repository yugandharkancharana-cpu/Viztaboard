import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        pathname: '/vizta-board-media/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
      },
    ],
  },
  // Strict mode helps catch issues early
  reactStrictMode: true,
  // Enables SWC-based minification (default in Next.js 14)
  swcMinify: true,
}

export default nextConfig
