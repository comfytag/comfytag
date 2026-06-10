'use client'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { setApiToken } from '@/lib/api'

export function ApiTokenSync() {
  const { data: session } = useSession()

  // Re-apply on mount (recovers after HMR module re-evaluation)
  useEffect(() => {
    setApiToken(session?.user?.token ?? null)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Track live session changes
  useEffect(() => {
    setApiToken(session?.user?.token ?? null)
  }, [session?.user?.token])

  return null
}
