/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    // Production backend URL - used during build if env var not set
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://erp-backend-fb7fdd6n4a-uc.a.run.app/api/v1',
  },
}

module.exports = nextConfig
