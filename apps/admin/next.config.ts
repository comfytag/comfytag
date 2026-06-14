import type { NextConfig } from 'next'
import fs from 'fs'
import path from 'path'

// When MOBILE_DEV=true (set by scripts/dev-mobile.ps1), load .env.mobile.local
// overrides. This runs after Next.js's own env loading, so it wins over .env.local,
// giving the mobile dev server the correct LAN IP without touching .env.local.
if (process.env.MOBILE_DEV === 'true') {
  const mobileEnvPath = path.join(process.cwd(), '.env.mobile.local')
  if (fs.existsSync(mobileEnvPath)) {
    const lines = fs.readFileSync(mobileEnvPath, 'utf-8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const value = trimmed.slice(eqIdx + 1).trim()
      if (key) process.env[key] = value
    }
  }
}

const nextConfig: NextConfig = {
  output: 'standalone',
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
