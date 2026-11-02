const SUPABASE_PUBLIC_STORAGE = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/`
  : null

/**
 * True when the image lives in our own Supabase public storage, which is the
 * only remote origin allowed in `images.remotePatterns` (next.config.ts).
 * Any other URL is rendered as-is (`unoptimized`) instead of failing.
 */
export function canOptimizeImage(src: string): boolean {
  return !!SUPABASE_PUBLIC_STORAGE && src.startsWith(SUPABASE_PUBLIC_STORAGE)
}
