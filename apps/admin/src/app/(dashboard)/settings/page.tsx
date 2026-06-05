'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { LoadingSpinner, ErrorMessage, Input, Button } from '@comfytag/ui'
import { PageHeader } from '@comfytag/ui'
import type { User } from '@comfytag/types'
import { useUserById, useUpdateUser } from '@/hooks'

// ─── InfoRow ────────────────────────────────────────────
interface InfoRowProps {
  label: string
  value: string
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
      }}
    >
      <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={{ fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

// ─── Card style ──────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
}

const cardHeadingStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--color-text)',
  marginBottom: '20px',
}

// ─── Page ────────────────────────────────────────────────
export default function SettingsPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id ?? ''

  const { data, isLoading, isError } = useUserById(userId)
  const updateMutation = useUpdateUser()

  const [name, setName] = useState<string>(data?.name ?? '')
  const [success, setSuccess] = useState<boolean>(false)

  // Sync name when remote data loads / changes
  useEffect(() => {
    if (data?.name !== undefined) {
      setName(data.name)
    }
  }, [data?.name])

  // Auto-dismiss success flash after 3s
  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => setSuccess(false), 3000)
    return () => clearTimeout(timer)
  }, [success])

  async function handleSave() {
    updateMutation.mutate(
      { id: userId, payload: { name } },
      {
        onSuccess: () => {
          setSuccess(true)
        },
      },
    )
  }

  const lastLoginFormatted: string = (data as any)?.lastLoginAt
    ? new Date((data as any).lastLoginAt).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Never'

  if (isLoading) {
    return <LoadingSpinner size="lg" centered />
  }

  if (isError) {
    return <ErrorMessage message="Failed to load settings" />
  }

  return (
    <div
      style={{
        minHeight: '100%',
        backgroundColor: 'var(--color-bg)',
        padding: '24px',
        maxWidth: '600px',
      }}
    >
      <PageHeader title="Settings" />

      {/* ── Profile card ─────────────────────────────── */}
      <div style={cardStyle}>
        <div style={cardHeadingStyle}>Profile</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            id="settings-name"
            label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            id="settings-email"
            label="Email address"
            value={data?.email ?? ''}
            onChange={() => undefined}
            disabled
          />
        </div>

        <div style={{ marginTop: '20px' }}>
          {success && (
            <div
              style={{
                fontSize: '14px',
                color: 'var(--color-success)',
                marginBottom: '12px',
              }}
            >
              Profile updated successfully
            </div>
          )}
          <Button
            variant="primary"
            loading={updateMutation.isPending}
            onClick={() => void handleSave()}
          >
            Save changes
          </Button>
        </div>
      </div>

      {/* ── Account info card ────────────────────────── */}
      <div style={cardStyle}>
        <div style={cardHeadingStyle}>Account Info</div>
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <InfoRow label="Role" value={(data as any)?.role ?? ''} />
          <div style={{ borderTop: '1px solid var(--color-border)' }}>
            <InfoRow label="Status" value={(data as any)?.isActive ? 'Active' : 'Inactive'} />
          </div>
          <div style={{ borderTop: '1px solid var(--color-border)' }}>
            <InfoRow label="Last login" value={lastLoginFormatted} />
          </div>
        </div>
      </div>
    </div>
  )
}
