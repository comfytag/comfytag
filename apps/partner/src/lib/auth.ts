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
      isPartner: boolean
    }
  }
  interface User {
    token: string
    logo?: string | null
    isVerified: boolean
    isPartner: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    token: string
    logo?: string | null
    isVerified: boolean
    isPartner: boolean
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
              image?: string
              isPartner: boolean
              isAdmin: boolean
              isVerify?: { email?: boolean }
            }
            token: string
          } = await res.json()
          if (!data.user) return null
          if (!data.user.isPartner && !data.user.isAdmin) {
            throw new Error('This account does not have partner access. Please register at /register.')
          }
          return {
            id: data.user._id,
            name: data.user.name,
            email: data.user.email,
            token: data.token,
            logo: data.user.image ?? null,
            isVerified: data.user.isVerify?.email ?? false,
            isPartner: data.user.isPartner,
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
        token.isPartner = user.isPartner
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.token = token.token
      session.user.logo = token.logo ?? null
      session.user.isVerified = token.isVerified
      session.user.isPartner = token.isPartner
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,   // 7 days
    updateAge: 24 * 60 * 60,    // refresh cookie daily (sliding window)
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export const getServerSession = () => nextAuthGetServerSession(authOptions)
