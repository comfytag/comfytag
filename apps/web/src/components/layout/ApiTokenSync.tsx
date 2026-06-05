'use client'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { setApiToken } from '@/lib/api'

export function ApiTokenSync() {
  const { data: session } = useSession()
  useEffect(() => {
    setApiToken(session?.user?.token ?? null)
  }, [session?.user?.token])
  return null
}
