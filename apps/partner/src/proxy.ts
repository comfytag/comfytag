import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password']

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    if (req.nextauth.token && AUTH_PATHS.includes(pathname)) {
      return NextResponse.redirect(new URL('/overview', req.url))
    }
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl
        if (AUTH_PATHS.includes(pathname) || pathname === '/') return true
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|json)).*)'],
}
