import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {},
  transpilePackages: ['@comfytag/ui', '@comfytag/utils', '@comfytag/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.unsplash.com' },
    ],
  },
}
export default nextConfig
