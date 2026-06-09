'use client'
import { useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { setApiToken, setupInterceptors } from '@/lib/api'

export function ApiTokenSync() {
  const { data: session, status } = useSession()

  useEffect(() => {
    setupInterceptors(() => signOut({ callbackUrl: '/login' }))
  }, [])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.token) {
      setApiToken(session.user.token)
    } else if (status === 'unauthenticated') {
      setApiToken(null)
    }
  }, [session?.user?.token, status])

  return null
}
