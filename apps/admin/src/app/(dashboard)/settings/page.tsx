'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { LoadingSpinner, ErrorMessage, Input, Button } from '@comfytag/ui'
import { PageHeader } from '@comfytag/ui'
import api from '@/lib/api'
import type { AdminUser } from '@/types'

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

// ─── Fetch ───────────────────────────────────────────────
async function fetchAdminUser(userId: string, token: string): Promise<AdminUser> {
  const { data } = await api.get<AdminUser>(`/admin/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
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
  const token = session?.user?.token ?? ''
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery<AdminUser>({
    queryKey: ['admin', 'settings', userId],
    queryFn: () => fetchAdminUser(userId, token),
    enabled: !!userId,
  })

  const [name, setName] = useState<string>(data?.name ?? '')
  const [saving, setSaving] = useState<boolean>(false)
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
    setSaving(true)
    try {
      await api.put(
        `/admin/users/${userId}`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setSuccess(true)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'settings', userId] })
    } finally {
      setSaving(false)
    }
  }

  const lastLoginFormatted: string = data?.lastLoginAt
    ? new Date(data.lastLoginAt).toLocaleDateString('en-NG', {
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
            loading={saving}
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
          <InfoRow label="Role" value={data?.role ?? ''} />
          <div style={{ borderTop: '1px solid var(--color-border)' }}>
            <InfoRow label="Status" value={data?.isActive ? 'Active' : 'Inactive'} />
          </div>
          <div style={{ borderTop: '1px solid var(--color-border)' }}>
            <InfoRow label="Last login" value={lastLoginFormatted} />
          </div>
        </div>
      </div>
    </div>
  )
}
