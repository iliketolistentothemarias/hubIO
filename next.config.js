/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  
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
  experimental: {
    optimizePackageImports: [
      'lucide-react', 
      'framer-motion', 
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
