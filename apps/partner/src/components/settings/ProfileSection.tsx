'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ErrorMessage } from '@comfytag/ui'
import { ImageUploadInput } from '@/components/ui/ImageUploadInput'
import { api } from '@/lib/api'
import type { User } from '@comfytag/types'

interface Props {
  user: User | null | undefined
}

const INPUT_CLASS =
  'w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 text-sm focus:bg-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all placeholder:text-zinc-400 focus:outline-none disabled:opacity-50'
const LABEL_CLASS =
  'block text-[11px] font-mono font-semibold text-zinc-500 uppercase tracking-wider mb-2'

export function ProfileSection({ user }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', avatar: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEdit = () => {
    setForm({
      name: user?.name ?? '',
      phone: user?.phone ?? '',
      avatar: user?.avatar ?? user?.image ?? '',
    })
    setError(null)
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!session?.user?.id || !session?.user?.token) return
    setIsSubmitting(true)
    setError(null)

    try {
      await api.put(
        `/users/${session.user.id}`,
        { name: form.name, phone: form.phone, avatar: form.avatar, image: form.avatar }
      )
      setIsEditing(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900">Profile</h2>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      {!isEditing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className={LABEL_CLASS}>Name</p>
            <p className="text-sm text-zinc-900 font-medium">{user?.name || '—'}</p>
          </div>
          <div>
            <p className={LABEL_CLASS}>Email</p>
            <p className="text-sm text-zinc-900 font-medium">{user?.email || '—'}</p>
          </div>
          <div>
            <p className={LABEL_CLASS}>Phone</p>
            <p className="text-sm text-zinc-900 font-medium">{user?.phone || '—'}</p>
          </div>
          <div>
            <p className={LABEL_CLASS}>Avatar</p>
            {(user?.avatar ?? user?.image) ? (
              <img
                src={user.avatar ?? user.image}
                alt="Avatar"
                className="w-12 h-12 rounded-full object-cover border-2 border-zinc-100"
              />
            ) : (
              <p className="text-sm text-zinc-400">—</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <label className={LABEL_CLASS}>Name</label>
            <input
              className={INPUT_CLASS}
              value={form.name}
              onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Your name"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Phone</label>
            <input
              type="tel"
              className={INPUT_CLASS}
              value={form.phone}
              onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="Your phone number"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <ImageUploadInput
              label="Avatar"
              value={form.avatar}
              onChange={(url) => setForm(p => ({ ...p, avatar: url }))}
              previewShape="circle"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsEditing(false)}
              disabled={isSubmitting}
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 py-3 px-5 rounded-xl hover:bg-zinc-100 transition-all border border-zinc-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="bg-zinc-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-zinc-800 transition-all active:scale-95 w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
