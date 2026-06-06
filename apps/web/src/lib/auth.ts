import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import AppleProvider from 'next-auth/providers/apple'
import { getServerSession as nextAuthGetServerSession } from 'next-auth'
import type { NextAuthOptions } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      token: string
      isPartner: boolean
      isAdmin: boolean
      image?: string
      username?: string
      createdAt?: string
    }
  }
  interface User {
    id: string
    name: string
    email: string
    token: string
    isPartner: boolean
    isAdmin: boolean
    image?: string
    username?: string
    createdAt?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    token: string
    isPartner: boolean
    isAdmin: boolean
    image?: string
    username?: string
    createdAt?: string
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
          const res = await fetch(`${API_BASE}/auth/login`, {
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
              username?: string
              createdAt?: string
              isPartner: boolean
              isAdmin: boolean
              image?: string
            }
            token: string
          } = await res.json()
          if (!data.user) return null
          return {
            id: data.user._id,
            name: data.user.name,
            email: data.user.email,
            token: data.token,
            isPartner: data.user.isPartner,
            isAdmin: data.user.isAdmin,
            image: data.user.image,
            username: data.user.username,
            createdAt: data.user.createdAt,
          }
        } catch {
          return null
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
          const { user } = await res.json()
          return {
            id: user._id,
            name: user.name,
            email: user.email,
            token: credentials.backendToken,
            isPartner: user.isPartner,
            isAdmin: user.isAdmin,
            image: user.image ?? null,
            username: user.username,
            createdAt: user.createdAt,
          }
        } catch {
          return null
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    ...(process.env.APPLE_ID && process.env.APPLE_TEAM_ID
      ? [
          AppleProvider({
            clientId: process.env.APPLE_ID!,
            clientSecret: process.env.APPLE_PRIVATE_KEY ?? '',
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.token = user.token
        token.isPartner = user.isPartner
        token.isAdmin = user.isAdmin
        token.image = user.image
        token.username = user.username
        token.createdAt = user.createdAt
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.token = token.token
      session.user.isPartner = token.isPartner
      session.user.isAdmin = token.isAdmin
      session.user.image = token.image
      session.user.username = token.username
      session.user.createdAt = token.createdAt
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export const getServerSession = () => nextAuthGetServerSession(authOptions)
