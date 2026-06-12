'use client'

import { useState } from 'react'
import { Modal, Button, Badge } from '@comfytag/ui'
import type { UserAdminProfile, AdminRole } from '@comfytag/types'
import { useSuspendUser, useRestoreUser, useChangeUserRole } from '@/hooks'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface IamActionPanelProps {
  userId: string
  user: UserAdminProfile
}

type AllRoles = AdminRole | 'viewer'

const ROLE_OPTIONS: Array<{ value: AllRoles; label: string; description: string }> = [
  { value: 'super_admin',  label: 'Super Admin',   description: 'Full platform access' },
  { value: 'finance',      label: 'Finance',        description: 'Financial operations & payouts' },
  { value: 'kyc_reviewer', label: 'KYC Reviewer',   description: 'Review & approve documents' },
  { value: 'support',      label: 'Support',        description: 'Read access + user support actions' },
  { value: 'moderator',    label: 'Moderator',      description: 'Content & event moderation' },
  { value: 'viewer',       label: 'Regular User',   description: 'No admin access (demotes to attendee)' },
]

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, subtitle, children }: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: 20,
      }}
    >
      <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 4px' }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
          {subtitle}
        </p>
      )}
      {!subtitle && <div style={{ marginBottom: 16 }} />}
      {children}
    </div>
  )
}

// ─── Feedback line ─────────────────────────────────────────────────────────────

function Feedback({ ok, error }: { ok?: boolean; error?: boolean }) {
  if (ok) return (
    <div style={{ marginTop: 12, fontSize: 13, color: 'var(--color-success)' }}>
      Done — changes are live.
    </div>
  )
  if (error) return (
    <div style={{ marginTop: 12, fontSize: 13, color: 'var(--color-error)' }}>
      Action failed — please try again.
    </div>
  )
  return null
}

// ─── IamActionPanel ────────────────────────────────────────────────────────────

export function IamActionPanel({ userId, user }: IamActionPanelProps) {
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<AllRoles>(user.role ?? 'viewer')

  const suspendUser  = useSuspendUser()
  const restoreUser  = useRestoreUser()
  const changeRole   = useChangeUserRole()

  const isBusy      = suspendUser.isPending || restoreUser.isPending || changeRole.isPending
  const roleChanged = selectedRole !== (user.role ?? 'viewer')

  function handleSuspend() {
    suspendUser.mutate(userId, { onSuccess: () => setSuspendOpen(false) })
  }

  function handleRestore() {
    restoreUser.mutate(userId)
  }

  function handleRoleSave() {
    changeRole.mutate({ id: userId, role: selectedRole as AdminRole })
  }

  function closeSuspendModal() {
    if (suspendUser.isPending) return
    setSuspendOpen(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ─── Account Security ──────────────────────────────── */}
      <Section
        title="Account Security"
        subtitle={
          user.suspended
            ? 'This account is suspended. Restoring re-enables login and API access immediately.'
            : "Suspending immediately revokes the user's login and blocks all API access."
        }
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
              Current status
            </div>
            <Badge status={user.suspended ? 'suspended' : 'active'} />
          </div>

          {user.suspended ? (
            <Button
              size="sm"
              onClick={handleRestore}
              loading={restoreUser.isPending}
              disabled={isBusy}
            >
              {restoreUser.isPending ? 'Restoring…' : 'Restore Account'}
            </Button>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setSuspendOpen(true)}
              disabled={isBusy}
            >
              Suspend Account
            </Button>
          )}
        </div>

        <Feedback ok={restoreUser.isSuccess} error={restoreUser.isError || (suspendUser.isError && !suspendOpen)} />
      </Section>

      {/* ─── Role & Permissions ────────────────────────────── */}
      <Section
        title="Role & Permissions"
        subtitle="Role changes apply immediately — the user's next request will reflect new permissions."
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label
              htmlFor="iam-role-select"
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--color-text-muted)',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Select Role
            </label>
            <select
              id="iam-role-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as AllRoles)}
              disabled={changeRole.isPending}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface-2)',
                color: 'var(--color-text)',
                fontSize: 14,
                cursor: changeRole.isPending ? 'not-allowed' : 'pointer',
                opacity: changeRole.isPending ? 0.6 : 1,
                outline: 'none',
              }}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.description}
                </option>
              ))}
            </select>
          </div>

          <Button
            size="sm"
            onClick={handleRoleSave}
            disabled={!roleChanged || changeRole.isPending}
            loading={changeRole.isPending}
          >
            {changeRole.isPending ? 'Saving…' : 'Save Role'}
          </Button>
        </div>

        <Feedback ok={changeRole.isSuccess} error={changeRole.isError} />
      </Section>

      {/* ─── Suspend confirmation modal ────────────────────── */}
      <Modal
        isOpen={suspendOpen}
        onClose={closeSuspendModal}
        title="Suspend User Account"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeSuspendModal}
              disabled={suspendUser.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleSuspend}
              loading={suspendUser.isPending}
              disabled={suspendUser.isPending}
            >
              {suspendUser.isPending ? 'Suspending…' : 'Confirm Suspension'}
            </Button>
          </>
        }
      >
        <p
          style={{
            fontSize: 14,
            color: 'var(--color-text-muted)',
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          This will immediately revoke{' '}
          <strong style={{ color: 'var(--color-text)' }}>{user.name}</strong>
          {"'"}s login access and block all API requests. They will not be notified.
          You can restore the account at any time.
        </p>
      </Modal>
    </div>
  )
}
