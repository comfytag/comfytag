import { withAuth } from 'next-auth/middleware'

// Must match the sessionToken cookie name in lib/auth.ts — withAuth() does its
// own getToken() call and does not read authOptions, so the name has to be
// duplicated here. See lib/auth.ts for why this is namespaced per app.
const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith('https://') ?? false
const sessionCookieName = `${useSecureCookies ? '__Secure-' : ''}next-auth.session-token.web`

const PROTECTED_PATHS = [
  '/checkout',
  '/tickets',
  '/my-following',
  '/notifications',
  '/profile',
  '/hype-link',
  '/saved',
]

export default withAuth({
  cookies: {
    sessionToken: { name: sessionCookieName },
  },
  callbacks: {
    authorized({ token, req }) {
      const { pathname } = req.nextUrl
      const isProtected = PROTECTED_PATHS.some(
        (path) => pathname === path || pathname.startsWith(path + '/')
      )
      if (isProtected) return !!token
      return true
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json).*)'],
}
