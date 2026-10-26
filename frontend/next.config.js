/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development warnings
  reactStrictMode: true,

  // Images from local backend asset server
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/api/v1/assets/**',
      },
    ],
  },

  // Suppress noisy ESLint errors during builds (we run lint separately)
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Experimental features
  experimental: {
    // Typed routes will be enabled once all CRUD sub-routes are scaffolded
    typedRoutes: false,
  },
};

module.exports = nextConfig;
