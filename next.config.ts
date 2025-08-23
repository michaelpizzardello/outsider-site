import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // reactStrictMode: true, // optional
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.shopify.com', pathname: '/s/files/**' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
