'use client'

import { useSession } from 'next-auth/react'
import { PageHeader, LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { KycWizard } from '@/components/kyc/KycWizard'
import { useKycStatus } from '@/hooks'

export default function KycPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  const { data: kycData, isLoading, isError, refetch } = useKycStatus()

  if (isLoading) {
    return (
      <div>
        <div style={{ padding: '32px 24px', textAlign: 'center' }}>
          <LoadingSpinner centered size="lg" />
        </div>
      </div>
    )
  }

  if (isError || !kycData) {
    return (
      <div style={{ padding: '32px 24px' }}>
        <ErrorMessage
          message="Failed to load KYC data."
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  return (
    <main style={{ flex: 1, padding: '24px' }}>
      {/* Page Header */}
      <PageHeader
        title="KYC Verification"
        subtitle="Complete your identity verification to unlock full account features"
      />

      {/* Wizard Container */}
      <div style={{ marginTop: '32px' }}>
        <KycWizard
          kycData={kycData}
          userId={userId || ''}
          token={session?.user?.token || ''}
        />
      </div>
    </main>
  )
}
