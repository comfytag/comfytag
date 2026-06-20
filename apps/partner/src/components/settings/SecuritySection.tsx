'use client'
import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Modal, ErrorMessage } from '@comfytag/ui'
import { api } from '@/lib/api'

const INPUT_CLASS =
  'w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 text-sm focus:bg-white focus:border-violet-500 transition-all placeholder:text-zinc-400 focus:outline-none focus-visible:outline-none disabled:opacity-50'
const LABEL_CLASS =
  'block text-[11px] font-mono font-semibold text-zinc-500 uppercase tracking-wider mb-2'

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
        { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }
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
      await api.delete(`/users/${session.user.id}`)
      await signOut({ callbackUrl: '/login' })
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account')
      setDeleteIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-zinc-900">Security</h2>

      {/* Change Password */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Password</p>
            <p className="text-xs text-zinc-400 mt-0.5">Update your account password</p>
          </div>
          {!showPasswordForm && (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors"
            >
              Change
            </button>
          )}
        </div>

        {pwSuccess && (
          <p className="text-sm font-medium text-emerald-600">✓ Password changed successfully</p>
        )}

        {showPasswordForm && (
          <div className="space-y-4 p-6 bg-zinc-50 border border-zinc-200 rounded-2xl">
            {pwError && <ErrorMessage message={pwError} />}
            <div>
              <label className={LABEL_CLASS}>Current Password</label>
              <input
                type="password"
                className={INPUT_CLASS}
                placeholder="Current password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                disabled={pwIsSubmitting}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>New Password</label>
              <input
                type="password"
                className={INPUT_CLASS}
                placeholder="New password (min. 6 characters)"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                disabled={pwIsSubmitting}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Confirm New Password</label>
              <input
                type="password"
                className={INPUT_CLASS}
                placeholder="Confirm new password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                disabled={pwIsSubmitting}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowPasswordForm(false)}
                disabled={pwIsSubmitting}
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 py-3 px-5 rounded-xl hover:bg-zinc-100 transition-all border border-zinc-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={pwIsSubmitting}
                className="bg-zinc-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {pwIsSubmitting ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="space-y-4 p-6 bg-red-50 border border-red-100 rounded-2xl">
        <div>
          <p className="text-[11px] font-mono font-semibold text-red-600 uppercase tracking-wider mb-1">
            Danger Zone
          </p>
          <p className="text-xs text-red-400">These actions are irreversible. Proceed with caution.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowDeactivateModal(true)}
            className="bg-red-50 text-red-600 border border-red-100 font-bold py-3 px-6 rounded-xl hover:bg-red-100 transition-all active:scale-95 text-sm"
          >
            Deactivate Account
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-50 text-red-600 border border-red-100 font-bold py-3 px-6 rounded-xl hover:bg-red-100 transition-all active:scale-95 text-sm"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Account">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: 'var(--color-error)', margin: 0, fontSize: '14px', fontWeight: 500 }}>
            This action is permanent and cannot be undone. All your data will be deleted.
          </p>
          {deleteError && <ErrorMessage message={deleteError} />}
          <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '13px' }}>
            Type <strong>DELETE</strong> to confirm:
          </p>
          <input
            className={INPUT_CLASS}
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE"
            disabled={deleteIsSubmitting}
          />
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteIsSubmitting}
              className="flex-1 text-sm font-medium text-zinc-500 hover:text-zinc-900 py-3 px-5 rounded-xl hover:bg-zinc-100 transition-all border border-zinc-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteIsSubmitting || deleteConfirmText !== 'DELETE'}
              className="flex-1 bg-red-50 text-red-600 border border-red-100 font-bold py-3 px-6 rounded-xl hover:bg-red-100 transition-all active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteIsSubmitting ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Deactivate Modal */}
      <Modal isOpen={showDeactivateModal} onClose={() => setShowDeactivateModal(false)} title="Deactivate Account">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '14px' }}>
            Account deactivation is coming soon. For now, please contact support if you&apos;d like to deactivate your account.
          </p>
          <button
            onClick={() => setShowDeactivateModal(false)}
            className="bg-zinc-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-zinc-800 transition-all active:scale-95 text-sm"
          >
            Got it
          </button>
        </div>
      </Modal>
    </div>
  )
}
