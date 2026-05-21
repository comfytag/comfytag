'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@comfytag/ui'
import type { BankAccount, User } from '@comfytag/types'
import { SectionCard } from './SectionCard'

interface SettingsPanelProps {
  user: User | null
  banks: BankAccount[]
}

export function SettingsPanel({ user, banks }: SettingsPanelProps) {
  const { data: session } = useSession()
  const [editingSection, setEditingSection] = useState<string | null>(null)

  if (!user) {
    return (
      <div style={{ color: 'var(--color-text-muted)' }}>
        Failed to load settings
      </div>
    )
  }

  return (
    <>
      {/* Profile Section */}
      <SectionCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
              Profile
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Manage your basic profile information
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingSection(editingSection === 'profile' ? null : 'profile')}
          >
            Edit
          </Button>
        </div>

        {editingSection !== 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
            <div>
              <div style={{ color: 'var(--color-text-muted)', marginBottom: '4px' }}>Name</div>
              <div style={{ color: 'var(--color-text)', fontWeight: 500 }}>{user.name}</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-muted)', marginBottom: '4px' }}>Email</div>
              <div style={{ color: 'var(--color-text)', fontWeight: 500 }}>{user.email}</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-muted)', marginBottom: '4px' }}>Phone</div>
              <div style={{ color: 'var(--color-text)', fontWeight: 500 }}>{user.phone || 'Not set'}</div>
            </div>
          </div>
        )}

        {editingSection === 'profile' && (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
            Profile editing coming soon
          </div>
        )}
      </SectionCard>

      {/* Bank Details Section */}
      <SectionCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
              Bank Details
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Manage your payout accounts
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingSection(editingSection === 'bank' ? null : 'bank')}
          >
            {banks.length > 0 ? 'Edit' : 'Add'}
          </Button>
        </div>

        {banks.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            No bank accounts linked. Add one to receive payouts.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {banks.map((bank) => (
              <div
                key={bank._id}
                style={{
                  padding: '12px',
                  background: 'var(--color-surface-2)',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              >
                <div style={{ color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  {bank.bankName || 'Bank Account'}
                </div>
                <div style={{ color: 'var(--color-text)', fontWeight: 500 }}>
                  •••• {bank.acctNumber?.slice(-4)}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Notifications Section */}
      <SectionCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
              Notifications
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Control notification preferences
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingSection(editingSection === 'notif' ? null : 'notif')}
          >
            Edit
          </Button>
        </div>

        {editingSection !== 'notif' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Email notifications</span>
              <span style={{ color: 'var(--color-success)' }}>Enabled</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>SMS notifications</span>
              <span style={{ color: 'var(--color-success)' }}>Enabled</span>
            </div>
          </div>
        )}

        {editingSection === 'notif' && (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
            Notification settings coming soon
          </div>
        )}
      </SectionCard>

      {/* Privacy Section */}
      <SectionCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
              Privacy
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Manage visibility and account access
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ cursor: 'pointer' }} />
            <span style={{ color: 'var(--color-text)' }}>Profile visible to attendees</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ cursor: 'pointer' }} />
            <span style={{ color: 'var(--color-text)' }}>Allow user messages</span>
          </label>
        </div>
      </SectionCard>

      {/* Danger Zone */}
      <SectionCard style={{ borderColor: 'var(--color-error)', background: 'rgba(239, 68, 68, 0.04)' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: 'var(--color-error)' }}>
          Danger Zone
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
              Change Password
            </h4>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Update your password to keep your account secure
            </p>
            <Button variant="ghost" size="sm">
              Update Password
            </Button>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
              Deactivate Account
            </h4>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Temporarily disable your account without losing data
            </p>
            <Button variant="ghost" size="sm">
              Deactivate
            </Button>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--color-error)', fontWeight: 600 }}>
              Delete Account
            </h4>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Permanently delete your account and all associated data
            </p>
            <Button variant="danger" size="sm">
              Delete Account
            </Button>
          </div>
        </div>
      </SectionCard>
    </>
  )
}
