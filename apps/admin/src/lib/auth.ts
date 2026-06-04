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
  secret: process.env.NEXTAUTH_SECRET,
}

export const getServerSession = () => nextAuthGetServerSession(authOptions)
