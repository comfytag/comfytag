'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button, Input, ErrorMessage } from '@comfytag/ui'
import { SectionCard } from './SectionCard'
import { ImageUploadInput } from '@/components/ui/ImageUploadInput'
import { api } from '@/lib/api'
import type { User } from '@comfytag/types'

interface Props {
  user: User | null
}

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
    <SectionCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '16px', fontWeight: 600 }}>Profile</h3>
        {!isEditing && <Button variant="ghost" size="sm" onClick={handleEdit}>Edit</Button>}
      </div>

      {error && <ErrorMessage message={error} />}

      {!isEditing ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Name</div>
            <div style={{ color: 'var(--color-text-primary)' }}>{user?.name || 'â€”'}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Email</div>
            <div style={{ color: 'var(--color-text-primary)' }}>{user?.email || 'â€”'}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Phone</div>
            <div style={{ color: 'var(--color-text-primary)' }}>{user?.phone || 'â€”'}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Avatar</div>
            {(user?.avatar ?? user?.image) ? (
              <img
                src={user.avatar ?? user.image}
                alt="Avatar"
                style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ color: 'var(--color-text-primary)' }}>â€”</div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'block', marginBottom: '4px' }}>Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Your name"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'block', marginBottom: '4px' }}>Phone</label>
            <Input
              type="tel"
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
          <div style={{ display: 'flex', gap: '8px', paddingTop: '8px' }}>
            <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSubmitting} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={isSubmitting} className="flex-1">{isSubmitting ? 'Saving...' : 'Save'}</Button>
          </div>
        </div>
      )}
    </SectionCard>
  )
}

