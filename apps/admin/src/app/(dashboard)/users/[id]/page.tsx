'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Mail, ShieldCheck, ScanFace, Building2, Shield } from 'lucide-react'
import { LoadingSpinner, ErrorMessage, Badge, StatCard, InfoField, PageHeader } from '@comfytag/ui'
import { formatDate } from '@comfytag/utils'
import { ProfileCard } from '@/components/ui/ProfileCard'
import { IamActionPanel } from '@/components/iam/IamActionPanel'
import { useAdminUserDetail } from '@/hooks'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''

  const { data: user, isLoading, isError, refetch } = useAdminUserDetail(id)

  if (isLoading) return <LoadingSpinner size="lg" centered />

  if (isError || !user) {
    return (
      <ErrorMessage
        message="Failed to load user profile"
        onRetry={() => void refetch()}
      />
    )
  }

  const hasExtraInfo = !!(user.businessName || user.address || user.faceEnrolledAt)

  return (
    <div style={{ padding: '32px 24px' }}>
      {/* ─── Header ────────────────────────────────────────── */}
      <PageHeader
        title={user.name}
        subtitle="User Management"
        action={
          <Link
            href="/users"
            style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 14 }}
          >
            ← Back to Users
          </Link>
        }
      />

      {/* ─── Profile card ──────────────────────────────────── */}
      <ProfileCard
        name={user.name}
        email={user.email}
        phone={user.phone}
        username={user.username}
        joinedAt={user.createdAt}
        avatarUrl={user.image ?? undefined}
      >
        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Badge status={user.suspended ? 'suspended' : 'active'} />
          {user.kycStatus && <Badge status={user.kycStatus} />}
        </div>
      </ProfileCard>

      {/* ─── Stats row ─────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          icon={Mail}
          label="Email"
          value={user.isVerify?.email ? 'Verified' : 'Unverified'}
        />
        <StatCard
          icon={ShieldCheck}
          label="KYC Status"
          value={
            user.kycStatus
              ? user.kycStatus.charAt(0).toUpperCase() + user.kycStatus.slice(1)
              : 'None'
          }
        />
        <StatCard
          icon={ScanFace}
          label="Face Biometric"
          value={user.faceEnrolled ? 'Enrolled' : 'Not enrolled'}
        />
        <StatCard
          icon={Building2}
          label="Account Type"
          value={user.isPartner ? 'Organizer' : 'Attendee'}
        />
        <StatCard
          icon={Shield}
          label="Admin Access"
          value={
            user.isAdmin
              ? (user.role?.replace(/_/g, ' ') ?? 'Admin')
              : 'None'
          }
        />
      </div>

      {/* ─── Extra info grid (only shown when fields are present) ── */}
      {hasExtraInfo && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 12,
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            padding: 20,
            marginBottom: 28,
          }}
        >
          {user.businessName && (
            <InfoField label="Business" value={user.businessName} />
          )}
          {user.address && (
            <InfoField label="Location" value={user.address} />
          )}
          {user.faceEnrolledAt && (
            <InfoField label="Face enrolled" value={formatDate(user.faceEnrolledAt)} />
          )}
        </div>
      )}

      {/* ─── IAM controls ──────────────────────────────────── */}
      <IamActionPanel userId={user._id} user={user} />
    </div>
  )
}
