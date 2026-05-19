import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip auth check if Supabase is not configured (local dev without credentials)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl.includes('your_supabase') || !supabaseUrl.startsWith('http')) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Use getSession() for fast local JWT check instead of getUser() which hits Supabase servers.
  // Middleware runs on every navigation — getUser() adds 100-500ms per page transition.
  // getSession() validates the JWT locally (no network call). Auth is still verified
  // server-side in API routes and server components where it matters.
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user ?? null

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/signup', '/verify-email', '/reset-password', '/api/auth/']
  const isLanding = request.nextUrl.pathname === '/'
  const isAuthPage = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  const isPublicRoute = isLanding || isAuthPage

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from auth pages and landing to dashboard
  if (user && isPublicRoute) {
    // Avoid redirect loop - only redirect if not already going to dashboard
    if (request.nextUrl.pathname !== '/dashboard') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
