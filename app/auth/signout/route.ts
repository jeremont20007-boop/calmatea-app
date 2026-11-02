import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Closes the session on the server (clears the Supabase auth cookies) and
// sends the user back to the login page. POST only, so a link or image on
// another site can't log people out.
export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/auth/login', request.url), 303)
}
