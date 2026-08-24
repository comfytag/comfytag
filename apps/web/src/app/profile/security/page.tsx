'use client'

import React, { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Navbar } from '@/components/layout/Navbar'
import { BackLink } from '@/components/ui'
import {
  Input,
  Button,
  Modal,
  ErrorMessage,
  InfoField,
  LoadingSpinner,
} from '@comfytag/ui'
import { api } from '@/lib/api'
import { authHeader } from '@comfytag/utils'
import { useProfile } from '@/hooks/useProfile'

export default function SecurityPage() {
  const { data: session, status } = useSession()
  const { data: user } = useProfile()

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changeError, setChangeError] = useState<string | null>(null)
  const [changeSuccess, setChangeSuccess] = useState(false)
  const [isChanging, setIsChanging] = useState(false)

  // Email verification state
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

  // Delete account state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  if (status === 'loading') {
    return (
      <>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 24px' }}>
          <LoadingSpinner size="lg" centered />
        </div>
      </>
    )
  }

  if (!session) return null

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setChangeError(null)
    setChangeSuccess(false)

    if (newPassword !== confirmPassword) {
      setChangeError('New passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setChangeError('Password must be at least 8 characters')
      return
    }

    setIsChanging(true)
    try {
      await api.post(
        `/auth/change-password`,
        { currentPassword, newPassword },
      )
      setChangeSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setChangeSuccess(false), 3000)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to change password'
      setChangeError(msg)
    } finally {
      setIsChanging(false)
    }
  }

  const handleResendVerification = async () => {
    setResendError(null)
    setIsResending(true)
    try {
      await api.post(
        `/auth/resend-verification`,
        { email: session.user.email },
      )
      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 4000)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to resend verification email'
      setResendError(msg)
    } finally {
      setIsResending(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await api.delete(`/users/${session.user.id}`, {
        data: { password: deletePassword },
        ...authHeader(session.user.token),
      })
      await signOut({ callbackUrl: '/' })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to delete account'
      setDeleteError(msg)
      setIsDeleting(false)
    }
  }

  const closeDeleteModal = () => {
    setDeleteOpen(false)
    setDeletePassword('')
    setDeleteError(null)
  }

  return (
    <>
      <Navbar />
      <main
        style={{
          minHeight: '100vh',
          background: 'var(--color-bg-public)',
          padding: '32px 16px',
        }}
      >
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <BackLink href="/profile">Back to Profile</BackLink>

          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--color-text)',
              marginTop: '24px',
              marginBottom: '32px',
            }}
          >
            Account Security
          </h1>

          {/* Change Password */}
          <section
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
            }}
          >
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-text)',
                marginBottom: '20px',
              }}
            >
              Change Password
            </h2>
            <form
              onSubmit={handleChangePassword}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <Input
                type="password"
                label="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {changeError && <ErrorMessage message={changeError} />}
              {changeSuccess && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'var(--color-success)',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  Password changed successfully!
                </div>
              )}
              <Button
                type="submit"
                loading={isChanging}
                disabled={!currentPassword || !newPassword || !confirmPassword}
              >
                Update Password
              </Button>
            </form>
          </section>

          {/* Email Verification */}
          <section
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
            }}
          >
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-text)',
                marginBottom: '20px',
              }}
            >
              Email Verification
            </h2>
            <InfoField label="Email" value={session.user.email} className="mb-3" />
            {resendError && (
              <div style={{ marginTop: '12px' }}>
                <ErrorMessage message={resendError} />
              </div>
            )}
            {resendSuccess ? (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'var(--color-success)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Verification email sent! Check your inbox.
              </div>
            ) : (
              <div style={{ marginTop: '16px' }}>
                <Button
                  variant="ghost"
                  onClick={handleResendVerification}
                  loading={isResending}
                >
                  Re-send Verification Email
                </Button>
              </div>
            )}
          </section>

          {/* Face Enrollment */}
          <section
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  margin: 0,
                }}
              >
                Face Enrollment
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--color-brand)',
                  background: 'var(--color-brand-light)',
                  padding: '3px 10px',
                  borderRadius: '999px',
                }}
              >
                Coming Soon
              </span>
            </div>
            <InfoField
              label="Biometric Check-In"
              value={
                <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                  Not yet available
                </span>
              }
            />
            <p
              style={{
                marginTop: '12px',
                fontSize: '13px',
                color: 'var(--color-text-muted)',
                lineHeight: 1.6,
              }}
            >
              We&apos;re building frictionless, biometric check-in — enroll your face
              once and skip the line at the gate. No action needed for now; use
              your QR ticket to check in.
            </p>
          </section>

          {/* Delete Account */}
          <section
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-error)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-error)',
                marginBottom: '12px',
              }}
            >
              Delete Account
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--color-text-muted)',
                lineHeight: 1.6,
                marginBottom: '16px',
              }}
            >
              Once you delete your account, there is no going back. All your
              tickets, hype link balance, and saved events will be permanently
              removed.
            </p>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              Delete Account
            </Button>
          </section>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteOpen}
        onClose={closeDeleteModal}
        title="Delete your account?"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p
            style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.6 }}
          >
            This action is permanent and cannot be undone. All your data,
            tickets, and hype link balance will be deleted immediately.
          </p>
          <Input
            type="password"
            label="Enter your password to confirm"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
          />
          {deleteError && <ErrorMessage message={deleteError} />}
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="ghost" onClick={closeDeleteModal} fullWidth>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              loading={isDeleting}
              disabled={!deletePassword}
              fullWidth
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
