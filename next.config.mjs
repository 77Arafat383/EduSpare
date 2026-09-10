/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    // Tree-shake icon/animation barrels so pages only ship the icons they use.
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  // Skip source maps + emit smaller client bundles in production.
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        // Next static chunks are content-hashed.
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Static assets never change without a new filename → cache aggressively.
        source: '/assets/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
