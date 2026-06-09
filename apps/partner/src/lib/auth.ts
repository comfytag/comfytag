import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { getServerSession as nextAuthGetServerSession } from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import type { SessionUser } from '@comfytag/types'

declare module 'next-auth' {
  interface Session {
    user: SessionUser & {
      id: string
    }
  }
  interface User {
    id: string
    token: string
    name: string
    email: string
    username?: string
    image?: string
    avatar?: string
    phone?: string
    bgImg?: string
    isPartner: boolean
    isAdmin: boolean
    faceEnrolled?: boolean
    onboarding?: { completed: boolean }
    isVerify?: { email?: boolean; photo?: boolean; idCard?: boolean; address?: boolean }
    logo?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    token: string
    logo?: string | null
    isPartner: boolean
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        let data: {
          status: boolean
          user: {
            _id: string
            name: string
            email: string
            username?: string
            image?: string
            avatar?: string
            isPartner: boolean
            isAdmin: boolean
            isVerify?: { email?: boolean; photo?: boolean; idCard?: boolean; address?: boolean }
          }
          token: string
        }

        try {
          const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })
          if (!res.ok) return null
          data = await res.json()
        } catch {
          return null
        }

        if (!data.user) return null

        if (!data.user.isPartner && !data.user.isAdmin) {
          throw new Error('This account does not have partner access. Please register at /register.')
        }

        return {
          id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          token: data.token,
          username: data.user.username ?? data.user.name,
          image: data.user.image,
          avatar: data.user.avatar,
          phone: undefined,
          bgImg: undefined,
          isPartner: data.user.isPartner,
          isAdmin: data.user.isAdmin,
          faceEnrolled: false,
          onboarding: { completed: false },
          isVerify: data.user.isVerify ?? {
            email: false,
            photo: false,
            idCard: false,
            address: false,
          },
          logo: data.user.image ?? null,
        }
      },
    }),
    CredentialsProvider({
      id: 'token',
      name: 'Token',
      credentials: {
        backendToken: { label: 'Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.backendToken) return null
        try {
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${credentials.backendToken}` },
          })
          if (!res.ok) return null
          const { user, token: freshToken } = await res.json()
          if (!user.isPartner && !user.isAdmin) return null
          return {
            id: user._id,
            name: user.name,
            email: user.email,
            username: user.username ?? user.name,
            image: user.image,
            avatar: user.avatar,
            phone: user.phone,
            bgImg: user.bgImg,
            token: freshToken,
            isPartner: user.isPartner,
            isAdmin: user.isAdmin,
            faceEnrolled: user.faceEnrolled ?? false,
            onboarding: user.onboarding ?? { completed: false },
            isVerify: user.isVerify ?? {
              email: false,
              photo: false,
              idCard: false,
              address: false,
            },
            logo: user.image ?? null,
          }
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const res = await fetch(`${API_BASE}/auth/google-signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email }),
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            return `/login?error=${encodeURIComponent(err.message ?? 'GoogleSignInFailed')}`
          }
          const data = await res.json()
          user.id = data.user._id
          user.token = data.token
          user.isPartner = data.user.isPartner
          user.isAdmin = data.user.isAdmin
          user.logo = data.user.image ?? null
          return true
        } catch {
          return '/login?error=GoogleSignInFailed'
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.token = user.token
        token.logo = user.logo
        token.isPartner = user.isPartner
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.token = token.token
      if (token.logo) session.user.logo = token.logo
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
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret',
}

export const getServerSession = () => nextAuthGetServerSession(authOptions)
