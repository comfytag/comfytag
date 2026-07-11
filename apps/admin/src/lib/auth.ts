import CredentialsProvider from 'next-auth/providers/credentials'
import { getServerSession as nextAuthGetServerSession } from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import type { AdminRole } from './roles'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      token: string
      role: AdminRole
    }
  }
  interface User {
    token: string
    role: AdminRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    token: string
    role: AdminRole
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

// web, partner, and admin all run on `localhost` in dev (different ports only).
// Browser cookies aren't port-scoped, so NextAuth's default cookie names would
// collide across apps — logging into one silently overwrites the others'
// session cookie, which then fails to decode (different NEXTAUTH_SECRET per
// app) and force-redirects to that app's login. Namespacing the cookie names
// keeps each app's session isolated regardless of host/port.
const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith('https://') ?? false
const cookiePrefix = useSecureCookies ? '__Secure-' : ''

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          const body: { email: string; password: string; otp?: string } = {
            email: credentials.email,
            password: credentials.password,
          }

          if (credentials.otp) {
            body.otp = credentials.otp
          }

          const res = await fetch(`${API_BASE}/admin/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })

          const data: {
            status: boolean
            user: { _id: string; name: string; email: string; isAdmin: boolean; role?: string }
            token: string
            error?: string
          } = await res.json()

          if (!res.ok) {
            if (data.error === 'TWO_FACTOR_REQUIRED') {
              throw new Error('TWO_FACTOR_REQUIRED')
            }
            return null
          }

          if (!data.user || !data.user.isAdmin) return null
          return {
            id: data.user._id,
            name: data.user.name,
            email: data.user.email,
            token: data.token,
            role: (data.user.role || 'viewer') as AdminRole,
          }
        } catch (error: any) {
          if (error.message === 'TWO_FACTOR_REQUIRED') {
            throw error
          }
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.token = user.token
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.token = token.token
      session.user.role = token.role || ('viewer' as AdminRole)
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token.admin`,
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: useSecureCookies },
    },
    callbackUrl: {
      name: `${cookiePrefix}next-auth.callback-url.admin`,
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: useSecureCookies },
    },
    csrfToken: {
      name: `${useSecureCookies ? '__Host-' : ''}next-auth.csrf-token.admin`,
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: useSecureCookies },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export const getServerSession = () => nextAuthGetServerSession(authOptions)
