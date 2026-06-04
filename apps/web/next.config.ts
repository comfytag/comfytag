import type { NextConfig } from 'next'
import withPWAInit from 'next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'https' as const, hostname: '**' },
      { protocol: 'http' as const, hostname: 'localhost' },
    ],
  },
}

export default withPWA(nextConfig)

