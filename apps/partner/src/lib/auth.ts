import CredentialsProvider from 'next-auth/providers/credentials'
import { getServerSession as nextAuthGetServerSession } from 'next-auth'
import type { NextAuthOptions } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      token: string
      logo?: string | null
      isVerified: boolean
    }
  }
  interface User {
    token: string
    logo?: string | null
    isVerified: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    token: string
    logo?: string | null
    isVerified: boolean
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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          const res = await fetch(`${API_BASE}/partner/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })
          if (!res.ok) return null
          const data: {
            status: boolean
            user: {
              _id: string
              name: string
              email: string
              isPartner: boolean
              isAdmin: boolean
              isVerify?: { email?: boolean }
            }
            token: string
          } = await res.json()
          if (!data.user) return null
          return {
            id: data.user._id,
            name: data.user.name,
            email: data.user.email,
            token: data.token,
            logo: null,
            isVerified: data.user.isVerify?.email ?? false,
          }
        } catch {
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
        token.logo = user.logo
        token.isVerified = user.isVerified
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.token = token.token
      session.user.logo = token.logo ?? null
      session.user.isVerified = token.isVerified
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
}

export const getServerSession = () => nextAuthGetServerSession(authOptions)
