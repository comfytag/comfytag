'use client'

import { useSession } from 'next-auth/react'
import { PageHeader, LoadingSpinner, ErrorMessage } from '@comfytag/ui'
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
      <div style={{ padding: '32px 24px', textAlign: 'center' }}>
        <LoadingSpinner centered size="lg" />
      </div>
    )
  }

  if (userError || banksError) {
    return (
      <div style={{ padding: '32px 24px' }}>
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
    <div style={{ padding: '28px 16px' }}>
      <PageHeader title="Settings" subtitle="Manage your profile and payment details" />

      <div style={{ maxWidth: '720px' }}>
        <SettingsPanel user={user as any} banks={banks} />
      </div>
    </div>
  )
}

