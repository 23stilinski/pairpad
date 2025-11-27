import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname
  const { pathname } = request.nextUrl

  // Define public paths that don't require authentication
  const publicPaths = ['/', '/login', '/register', '/personality/assessment']

  // Define auth-only paths (already logged in users should skip these)
  const authOnlyPaths = ['/login', '/register']

  // Check if the path is public
  const isPublicPath = publicPaths.includes(pathname)

  // Get auth token from cookies (this is a simple implementation)
  const token = request.cookies.get('auth-token')?.value

  // If user is on an auth-only path (login/register) and has a token, redirect to dashboard
  if (authOnlyPaths.includes(pathname) && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If user is on a protected path and has no token, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}