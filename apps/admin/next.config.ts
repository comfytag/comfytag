import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {},
  transpilePackages: ['@comfytag/ui', '@comfytag/utils', '@comfytag/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
}

export default nextConfig
