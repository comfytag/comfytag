'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import type { User } from '@comfytag/types'

interface Props {
  prefs?: User['notificationPreferences']
}

interface ToggleRow {
  key: 'email' | 'sms'
  label: string
  desc: string
}

const ROWS: ToggleRow[] = [
  { key: 'email', label: 'Email Notifications', desc: 'Receive event updates and alerts via email' },
  { key: 'sms',   label: 'SMS Notifications',   desc: 'Receive time-sensitive alerts via text message' },
]

export function NotificationsSection({ prefs }: Props) {
  const { data: session } = useSession()
  const [email, setEmail] = useState(prefs?.email ?? true)
  const [sms, setSms] = useState(prefs?.sms ?? true)
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
        { notificationPreferences: { email, sms } }
      )
      setSaved(true)
    } finally {
      setIsSaving(false)
    }
  }

  const values = { email, sms }
  const setters = { email: setEmail, sms: setSms }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900">Notifications</h2>
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
