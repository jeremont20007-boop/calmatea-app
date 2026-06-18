export function GET() {
  return new Response(
    `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /auth/\nSitemap: ${process.env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
    { headers: { 'Content-Type': 'text/plain' } }
  )
}
