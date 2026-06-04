'use client'
import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Button, Input, Modal, ErrorMessage } from '@comfytag/ui'
import { SectionCard } from './SectionCard'
import api, { authHeader } from '@/lib/api'

export function SecuritySection() {
  const { data: session } = useSession()

  // Change Password state
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwIsSubmitting, setPwIsSubmitting] = useState(false)

  // Delete Account state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteIsSubmitting, setDeleteIsSubmitting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Deactivate state
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('Passwords do not match')
      return
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('Password must be at least 6 characters')
      return
    }
    if (!session?.user?.token) return

    setPwIsSubmitting(true)
    setPwError(null)

    try {
      await api.post(
        '/auth/change-password',
        { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword },
        authHeader(session.user.token)
      )
      setPwSuccess(true)
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordForm(false)
      setTimeout(() => setPwSuccess(false), 2000)
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setPwIsSubmitting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('You must type DELETE to confirm')
      return
    }
    if (!session?.user?.id || !session?.user?.token) return

    setDeleteIsSubmitting(true)
    setDeleteError(null)

    try {
      await api.delete(`/users/${session.user.id}`, authHeader(session.user.token))
      await signOut({ callbackUrl: '/login' })
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account')
      setDeleteIsSubmitting(false)
    }
  }

  return (
    <SectionCard style={{ borderColor: 'var(--color-error)', borderWidth: '1px' }}>
      <h3 style={{ margin: 0, marginBottom: '16px', color: 'var(--color-error)', fontSize: '16px', fontWeight: 600 }}>Danger Zone</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Change Password */}
        <div>
          {!showPasswordForm ? (
            <Button variant="ghost" size="sm" onClick={() => setShowPasswordForm(true)}>
              Change Password
            </Button>
          ) : (
            <div style={{ padding: '12px', background: 'var(--color-surface-2)', borderRadius: '6px' }}>
              {pwError && <ErrorMessage message={pwError} />}
              {pwSuccess && <div style={{ color: 'var(--color-success)', fontSize: '12px', marginBottom: '12px' }}>✓ Password changed successfully</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Input
                  type="password"
                  placeholder="Current password"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                  disabled={pwIsSubmitting}
                />
                <Input
                  type="password"
                  placeholder="New password"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                  disabled={pwIsSubmitting}
                />
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  disabled={pwIsSubmitting}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="ghost" size="sm" onClick={() => setShowPasswordForm(false)} disabled={pwIsSubmitting}>Cancel</Button>
                  <Button variant="primary" size="sm" onClick={handleChangePassword} disabled={pwIsSubmitting}>{pwIsSubmitting ? 'Saving...' : 'Change'}</Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delete Account */}
        <div style={{ textAlign: 'left' }}>
          <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(true)}>
            Delete Account
          </Button>
        </div>

        {/* Deactivate Account */}
        <div style={{ textAlign: 'left' }}>
          <Button variant="ghost" size="sm" onClick={() => setShowDeactivateModal(true)}>
            Deactivate Account
          </Button>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Account">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ color: 'var(--color-error)', margin: 0 }}>This action is permanent and cannot be undone. All your data will be deleted.</p>
          {deleteError && <ErrorMessage message={deleteError} />}
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '12px' }}>Type <strong>DELETE</strong> to confirm:</p>
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE"
            disabled={deleteIsSubmitting}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)} disabled={deleteIsSubmitting} className="flex-1">Cancel</Button>
            <Button
              variant="primary"
              onClick={handleDeleteAccount}
              disabled={deleteIsSubmitting || deleteConfirmText !== 'DELETE'}
              className="flex-1"
            >
              {deleteIsSubmitting ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Deactivate Modal */}
      <Modal isOpen={showDeactivateModal} onClose={() => setShowDeactivateModal(false)} title="Deactivate Account">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Account deactivation is coming soon. For now, please contact support if you'd like to deactivate your account.</p>
          <Button variant="primary" onClick={() => setShowDeactivateModal(false)}>Got it</Button>
        </div>
      </Modal>
    </SectionCard>
  )
}
