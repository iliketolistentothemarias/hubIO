/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,

  // After `rm -rf .next` or dev restart, browsers often keep cached HTML/RSC that points at
  // old hashed chunks → 404 on layout.css / main-app.js / app-pages-internals.js on client nav.
  ...(process.env.NODE_ENV === 'development'
    ? {
        async headers() {
          const devNoStore = [
            { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
            { key: 'Pragma', value: 'no-cache' },
            { key: 'Expires', value: '0' },
          ]
          return [
            { source: '/:path*', headers: devNoStore },
            // Explicit: dev server sometimes only applies route headers to pages; chunks need the same
            { source: '/_next/static/:path*', headers: devNoStore },
            { source: '/_next/webpack/:path*', headers: devNoStore },
            { source: '/_next/:path*', headers: devNoStore },
          ]
        },
      }
    : {}),
  
  // Faster image loading
  images: {
    formats: ['image/webp'],
    minimumCacheTTL: 31536000,
    unoptimized: true, // Skip optimization for faster loads
  },
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  poweredByHeader: false,
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Aggressive package optimization
  // Note: framer-motion is omitted — optimized barrel imports can break dev HMR / chunk loading
  // on client navigations (white screen + 500s on webpack/main.js).
  experimental: {
    // Dev: disable client router cache staleness so navigations don't reuse old RSC HTML
    // that references deleted webpack chunks (404 on layout.js / main-app.js / page.js).
    ...(process.env.NODE_ENV === 'development'
      ? {
          staleTimes: {
            dynamic: 0,
            static: 0,
          },
        }
      : {}),
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-slot',
      '@supabase/supabase-js',
      'react-icons',
    ],
  },
  
  productionBrowserSourceMaps: false,
  compress: true,
}

module.exports = nextConfig
