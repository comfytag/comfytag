'use client'

import { Info } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { PageHeader, LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import { KycStatusHeader } from '@/components/kyc/KycStatusHeader'
import { KycDocSection } from '@/components/kyc/KycDocSection'
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

  const verifyData = kycData.isVerify || {}
  // Create a minimal user-like object for KycStatusHeader
  const user = { isVerify: kycData.isVerify } as any

  return (
    <main style={{ flex: 1, padding: '32px 24px' }}>
      {/* Max-width container */}
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Page Header */}
        <PageHeader
          title="KYC Verification"
          subtitle="Complete your identity verification to unlock full account features"
        />

        {/* Status Header */}
        <KycStatusHeader user={user} />

        {/* Documents Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Selfie / Photo */}
          <KycDocSection
            docType="photo"
            label="Selfie Photo"
            description="A clear photo of your face for identity verification"
            isVerified={verifyData.photo ?? false}
            userId={userId || ''}
            token={session?.user?.token || ''}
          />

          {/* ID Card Front */}
          <KycDocSection
            docType="idCard"
            label="ID Card (Front)"
            description="Front side of your national ID, passport, or driver's license"
            isVerified={verifyData.idCard ?? false}
            userId={userId || ''}
            token={session?.user?.token || ''}
          />

          {/* Address Proof */}
          <KycDocSection
            docType="address"
            label="Address Proof"
            description="Recent utility bill, bank statement, or government letter with your address"
            isVerified={verifyData.address ?? false}
            userId={userId || ''}
            token={session?.user?.token || ''}
          />
        </div>

        {/* Info Box */}
        <div
          style={{
            marginTop: '40px',
            padding: '16px',
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            fontSize: '13px',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
          }}
        >
          <p style={{ margin: 0, marginBottom: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info className="w-4 h-4" /> Why we need this information
          </p>
          <p style={{ margin: 0 }}>
            We require KYC (Know Your Customer) verification for all organizers to comply with Nigerian
            financial regulations and to protect your account. Your documents are encrypted and stored
            securely. We&rsquo;ll review your submission within 24 hours.
          </p>
        </div>
      </div>
    </main>
  )
}
