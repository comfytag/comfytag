'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@comfytag/ui'
import { SectionCard } from './SectionCard'
import api, { authHeader } from '@/lib/api'
import type { User } from '@comfytag/types'

interface Props {
  settings?: User['privacySettings']
}

export function PrivacySection({ settings }: Props) {
  const { data: session } = useSession()
  const [publicProfile, setPublicProfile] = useState(settings?.publicProfile ?? true)
  const [showInSearch, setShowInSearch] = useState(settings?.showInSearch ?? true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (saved) {
      const timer = setTimeout(() => setSaved(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [saved])

  const handleSave = async () => {
    if (!session?.user?.id || !session?.user?.token) return
    setIsSaving(true)

    try {
      await api.put(
        `/users/${session.user.id}`,
        { privacySettings: { publicProfile, showInSearch } },
        authHeader(session.user.token)
      )
      setSaved(true)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SectionCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '16px', fontWeight: 600 }}>Privacy</h3>
        {saved && <span style={{ color: 'var(--color-success)', fontSize: '12px', fontWeight: 500 }}>✓ Saved</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={publicProfile}
            onChange={(e) => setPublicProfile(e.target.checked)}
            disabled={isSaving}
          />
          <span style={{ color: 'var(--color-text-primary)' }}>Public Profile</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showInSearch}
            onChange={(e) => setShowInSearch(e.target.checked)}
            disabled={isSaving}
          />
          <span style={{ color: 'var(--color-text-primary)' }}>Show in Search Results</span>
        </label>
        <div style={{ paddingTop: '8px' }}>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving || saved}>
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </SectionCard>
  )
}
