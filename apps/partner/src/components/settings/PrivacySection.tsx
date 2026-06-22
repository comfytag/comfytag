'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import type { User } from '@comfytag/types'

interface Props {
  settings?: User['privacySettings']
}

interface ToggleRow {
  key: 'publicProfile' | 'showInSearch'
  label: string
  desc: string
}

const ROWS: ToggleRow[] = [
  { key: 'publicProfile', label: 'Public Profile',        desc: 'Allow others to view your organizer profile' },
  { key: 'showInSearch',  label: 'Show in Search Results', desc: 'Let attendees find you via search' },
]

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
        { privacySettings: { publicProfile, showInSearch } }
      )
      setSaved(true)
    } finally {
      setIsSaving(false)
    }
  }

  const values = { publicProfile, showInSearch }
  const setters = { publicProfile: setPublicProfile, showInSearch: setShowInSearch }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900">Privacy</h2>
        {saved && <span className="text-sm font-medium text-emerald-600">✓ Saved</span>}
      </div>

      <div className="space-y-3">
        {ROWS.map(({ key, label, desc }) => (
          <label
            key={key}
            className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-100 transition-all"
          >
            <div>
              <p className="text-sm font-semibold text-zinc-900">{label}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
            </div>
            <input
              type="checkbox"
              checked={values[key]}
              onChange={(e) => setters[key](e.target.checked)}
              disabled={isSaving}
              className="w-4 h-4 accent-violet-600 cursor-pointer"
            />
          </label>
        ))}
      </div>

      <div className="pt-2">
        <button
          onClick={handleSave}
          disabled={isSaving || saved}
          className="bg-zinc-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-zinc-800 transition-all active:scale-95 w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}
