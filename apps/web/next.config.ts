import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}

export default nextConfig
