/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: false
  },
  webpack: (config, { isServer }) => {
    // Add any webpack configurations if needed
    return config;
  },
  // Disable static optimization for these pages
  unstable_runtimeJS: true,
  unstable_JsPreload: false
}

module.exports = nextConfig