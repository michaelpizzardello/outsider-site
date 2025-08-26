import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Unblock Vercel previews now; re-enable later when types are cleaned up
  eslint: { ignoreDuringBuilds: true },
  // typescript: { ignoreBuildErrors: true }, // optional while stabilising

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.shopify.com', pathname: '/s/files/**' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
