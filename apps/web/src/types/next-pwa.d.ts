declare module 'next-pwa' {
  import type { NextConfig } from 'next'

  interface PWAConfig {
    dest?: string
    register?: boolean
    skipWaiting?: boolean
    disable?: boolean
    scope?: string
    sw?: string
    runtimeCaching?: unknown[]
    buildExcludes?: (string | RegExp)[]
    fallbacks?: {
      document?: string
      image?: string
      audio?: string
      video?: string
      font?: string
    }
    cacheOnFrontEndNav?: boolean
    reloadOnOnline?: boolean
    customWorkerSrc?: string
    customWorkerDest?: string
    customWorkerPrefix?: string
  }

  function withPWAInit(config?: PWAConfig): (nextConfig: NextConfig) => NextConfig
  export = withPWAInit
}
