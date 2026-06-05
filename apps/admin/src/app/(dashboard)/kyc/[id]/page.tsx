'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { LoadingSpinner, ErrorMessage, Badge } from '@comfytag/ui'
import type { User } from '@comfytag/types'
import { PageHeader } from '@comfytag/ui'
import { ProfileCard } from '@/components/ui/ProfileCard'
import { useUserById, useVerifyKyc } from '@/hooks'

// ─── Page ──────────────────────────────────────────────
export default function KycDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''

  const { data: user, isLoading, isError } = useUserById(id)
  const verifyMutation = useVerifyKyc()

  if (isLoading) return <LoadingSpinner size="lg" centered />

  if (isError || !user) {
    return <ErrorMessage message="Failed to load user" />
  }

  return (
    <div>
      <PageHeader
        title={user.name}
        action={
          <Link
            href="/kyc"
            style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 14 }}
          >
            ← Back to KYC
          </Link>
        }
      />

      {/* Profile card */}
      <ProfileCard
        name={user.name}
        email={user.email}
        phone={user.phone}
        username={user.username}
        joinedAt={user.createdAt}
      />

      {/* Verification status grid */}
      <h2
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--color-text)',
          marginTop: 24,
          marginBottom: 16,
        }}
      >
        Verification Status
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {[
          { label: 'Email', field: 'email', verified: user.isVerify?.email },
          { label: 'Photo', field: 'photo', verified: user.isVerify?.photo },
          { label: 'ID Card', field: 'idcard', verified: user.isVerify?.idCard },
          { label: 'Address', field: 'address', verified: user.isVerify?.address },
        ].map(({ label, field, verified }) => (
          <div
            key={field}
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 8,
              }}
            >
              {label}
            </div>
            <div style={{ marginBottom: 12 }}><Badge status={verified ? 'verified' : 'pending'} /></div>
            {!verified && field !== 'email' && (
              <button
                onClick={() => verifyMutation.mutate({ id, field })}
                disabled={verifyMutation.isPending}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: 'var(--color-brand)',
                  color: '#fff',
                  opacity: verifyMutation.isPending ? 0.6 : 1,
                }}
              >
                Verify
              </button>
            )}
          </div>
        ))}
      </div>

      {verifyMutation.isSuccess && (
        <div style={{ color: 'var(--color-success)', fontSize: 14, marginTop: 8 }}>
          Verification updated.
        </div>
      )}
      {verifyMutation.isError && (
        <div style={{ color: 'var(--color-error)', fontSize: 14, marginTop: 8 }}>
          Failed to update verification.
        </div>
      )}
    </div>
  )
}
