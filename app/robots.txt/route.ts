export function GET() {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return new Response(
    `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /auth/\nSitemap: ${base}/sitemap.xml`,
    { headers: { 'Content-Type': 'text/plain' } }
  )
}
