import { withAuth } from 'next-auth/middleware'

const PROTECTED_PATHS = [
  '/checkout',
  '/handoff',
  '/tickets',
  '/my-following',
  '/notifications',
  '/profile',
  '/hype-link',
  '/saved',
]

export default withAuth({
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
