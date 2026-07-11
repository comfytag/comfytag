import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Must match the sessionToken cookie name in lib/auth.ts — withAuth() does its
// own getToken() call and does not read authOptions, so the name has to be
// duplicated here. See lib/auth.ts for why this is namespaced per app.
const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith('https://') ?? false
const sessionCookieName = `${useSecureCookies ? '__Secure-' : ''}next-auth.session-token.admin`

const PUBLIC_PATHS = ['/', '/login']

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    if (req.nextauth.token && pathname === '/login') {
      return NextResponse.redirect(new URL('/overview', req.url))
    }
    return NextResponse.next()
  },
  {
    cookies: {
      sessionToken: { name: sessionCookieName },
    },
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl
        if (PUBLIC_PATHS.includes(pathname)) return true
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|json)).*)'],
}
