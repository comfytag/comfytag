'use client'

import { useSession } from 'next-auth/react'
import { LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { useBankAccount, usePartnerProfile } from '@/hooks'

export default function SettingsPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  const { data: user, isLoading: userLoading, isError: userError, refetch: refetchUser } = usePartnerProfile()
  const { data: banks = [], isLoading: banksLoading, isError: banksError, refetch: refetchBanks } = useBankAccount(userId || '')

  const isLoading = userLoading || banksLoading

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-8 flex items-center justify-center min-h-100">
        <LoadingSpinner centered size="lg" />
      </div>
    )
  }

  if (userError || banksError) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <ErrorMessage
          message="Failed to load settings."
          onRetry={() => {
            refetchUser()
            refetchBanks()
          }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-8 animate-in fade-in duration-300">
      <h1 className="text-3xl font-black text-(--color-text) tracking-tight mb-8">Settings</h1>
      <SettingsPanel user={user} banks={banks} />
    </div>
  )
}
