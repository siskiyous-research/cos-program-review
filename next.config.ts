import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    strict: true,
  },
  reactStrictMode: true,
  env: {
    // GEMINI_API_KEY will be loaded from .env.local at runtime
  },
}

export default nextConfig
