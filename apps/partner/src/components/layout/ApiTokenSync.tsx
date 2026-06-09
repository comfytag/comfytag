'use client'
import { useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { setApiToken, setupInterceptors } from '@/lib/api'

export function ApiTokenSync() {
  const { data: session } = useSession()

  useEffect(() => {
    const eject = setupInterceptors(() => signOut({ callbackUrl: '/login' }))
    return eject
  }, [])

  useEffect(() => {
    setApiToken(session?.user?.token ?? null)
  }, [session?.user?.token])

  return null
}
