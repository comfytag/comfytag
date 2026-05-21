import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  transpilePackages: ['@comfytag/ui', '@comfytag/utils', '@comfytag/types'],
}
export default nextConfig
