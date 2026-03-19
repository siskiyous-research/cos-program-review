import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    '/api/**': ['./data/**/*.json'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
}

export default nextConfig
