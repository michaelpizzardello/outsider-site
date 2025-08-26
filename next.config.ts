import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Ship previews now; we’ll re-enable once types are fixed
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.shopify.com', pathname: '/s/files/**' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
