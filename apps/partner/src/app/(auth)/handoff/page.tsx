'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { LoadingSpinner } from '@comfytag/ui'

export const dynamic = 'force-dynamic'

function HandoffContent() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const t = params.get('t')
    if (!t) {
      router.replace('/login')
      return
    }

    signIn('token', { backendToken: t, redirect: false }).then((result) => {
      if (result?.ok) {
        router.replace('/overview')
      } else {
        router.replace('/login')
      }
    })
  }, [params, router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingSpinner size="lg" />
    </div>
  )
}

export default function HandoffPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoadingSpinner size="lg" /></div>}>
      <HandoffContent />
    </Suspense>
  )
}
