'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation } from '@tanstack/react-query'
import { Button, Input } from '@comfytag/ui'
import api from '@/lib/api'

// ─── Types / Fetch ─────────────────────────────────────
const ROLES = ['support', 'moderator', 'finance', 'kyc_reviewer', 'super_admin'] as const
type Role = (typeof ROLES)[number]

interface InviteForm {
  name: string
  username: string
  email: string
  password: string
  role: Role
}

const createAdmin = async (form: InviteForm): Promise<void> => {
  // The public /auth/register endpoint ignores isAdmin/role in the request
  // body by design (otherwise anyone could self-register as an admin) — staff
  // accounts must go through this dedicated, super_admin-only endpoint.
  await api.post('/api/admin/users/create-admin', form)
}

export default function TeamInvitePage() {
  const [form, setForm] = useState<InviteForm>({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'support',
  })

  const inviteMutation = useMutation({
    mutationFn: createAdmin,
    onSuccess: () => {
      setForm({ name: '', username: '', email: '', password: '', role: 'support' })
    },
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
          Invite Admin
        </h1>
        <Link
          href="/team"
          style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 14 }}
        >
          ← Back to Team
        </Link>
      </div>

      <div
        style={{
          maxWidth: 480,
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 32,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Full Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Username"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text)',
                fontSize: 14,
              }}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {inviteMutation.isError && (
          <div style={{ color: 'var(--color-error)', fontSize: 14, marginTop: 16 }}>
            {(inviteMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message
              ?? 'Failed to create admin account. Please try again.'}
          </div>
        )}

        {inviteMutation.isSuccess && (
          <div style={{ color: 'var(--color-success)', fontSize: 14, marginTop: 16 }}>
            Admin account created. A verification email has been sent.
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <Button
            variant="primary"
            fullWidth
            loading={inviteMutation.isPending}
            onClick={() => {
              if (!form.name || !form.email || !form.username || !form.password) return
              inviteMutation.mutate(form)
            }}
          >
            Create Admin Account
          </Button>
        </div>
      </div>
    </div>
  )
}
