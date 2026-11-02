import type { NextConfig } from 'next'

// Ad images are uploaded to Supabase Storage. Allowing that host lets
// next/image resize them and serve WebP, so phones don't download multi-MB files.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseStoragePattern: URL | null = null
try {
  if (supabaseUrl) supabaseStoragePattern = new URL('/storage/v1/object/public/**', supabaseUrl)
} catch {
  supabaseStoragePattern = null
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseStoragePattern ? [supabaseStoragePattern] : [],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
    {
      // Always check for a new service worker so updates reach phones quickly.
      source: '/sw.js',
      headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
    },
  ],
}

export default nextConfig
