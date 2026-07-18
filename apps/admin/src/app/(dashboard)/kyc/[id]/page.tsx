'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { LoadingSpinner, ErrorMessage, Badge, InfoField, PageHeader } from '@comfytag/ui'
import { formatDate } from '@comfytag/utils'
import { ProfileCard } from '@/components/ui/ProfileCard'
import { KycActionPanel } from '@/components/kyc/KycActionPanel'
import { useKycDetails } from '@/hooks'

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function KycDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''

  const { data: user, isLoading, isError, refetch } = useKycDetails(id)

  if (isLoading) return <LoadingSpinner size="lg" centered />

  if (isError || !user) {
    return (
      <ErrorMessage
        message="Failed to load KYC profile"
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <div style={{ padding: '32px 24px' }}>
      {/* ─── Header ────────────────────────────────────────── */}
      <PageHeader
        title={user.name}
        subtitle="KYC Document Review"
        action={
          <Link
            href="/kyc"
            style={{
              color: 'var(--color-text-muted)',
              textDecoration: 'none',
              fontSize: 14,
            }}
          >
            ← Back to KYC Queue
          </Link>
        }
      />

      {/* ─── Organiser profile ─────────────────────────────── */}
      <ProfileCard
        name={user.name}
        email={user.email}
        phone={user.phone}
        username={user.username}
        joinedAt={user.createdAt}
        avatarUrl={user.image ?? undefined}
      >
        {/* KYC status pill inside the profile card */}
        <div style={{ marginTop: 8 }}>
          <Badge status={user.kycStatus ?? 'pending'} />
          {user.kycStatus === 'rejected' && user.kycRejectionReason && (
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                color: 'var(--color-error)',
              }}
            >
              Rejection reason: {user.kycRejectionReason}
              {user.kycRejectedAt && (
                <span style={{ color: 'var(--color-text-muted)', marginLeft: 6 }}>
                  ({formatDate(user.kycRejectedAt)})
                </span>
              )}
            </div>
          )}
        </div>
      </ProfileCard>

      {/* ─── Quick-stats row ───────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 20,
          marginBottom: 28,
        }}
      >
        <InfoField
          label="Email verified"
          value={<Badge status={user.isVerify?.email ? 'verified' : 'pending'} />}
        />
        <InfoField
          label="Document type"
          value={user.verify?.idType ?? '—'}
        />
        {user.businessName && (
          <InfoField label="Business" value={user.businessName} />
        )}
        {user.address && (
          <InfoField label="Location" value={user.address} />
        )}
      </div>

      {/* ─── Document viewer + action controls ─────────────── */}
      <KycActionPanel userId={user._id} user={user} />
    </div>
  )
}
