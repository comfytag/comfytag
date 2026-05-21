'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/forgot-password')
  }, [router])

  return null
}
