'use client'

import { useState, useCallback } from 'react'
import type { TeamPermission } from '@/hooks/useTeam'

interface CrewInviteSectionProps {
  eventId: string
  eventName: string
  onInvite: (email: string, permissions: TeamPermission[]) => void
  isInviting: boolean
  inviteError: string | null
}

const ALL_PERMISSIONS: { value: TeamPermission; label: string }[] = [
  { value: 'checkin', label: 'Check-in' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'edit', label: 'Edit Event' },
  { value: 'manage_tickets', label: 'Manage Tickets' },
]

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  )
}

export function CrewInviteSection({
  eventId,
  eventName,
  onInvite,
  isInviting,
  inviteError,
}: CrewInviteSectionProps) {
  const [email, setEmail] = useState('')
  const [permissions, setPermissions] = useState<TeamPermission[]>(['checkin'])
  const [copied, setCopied] = useState(false)

  const inviteUrl = `https://partner.comfytag.com/invite/${eventId}`

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `You've been invited to co-manage "${eventName}" on ComfyTag!\n\nJoin via: ${inviteUrl}`
  )}`

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — silently fail
    }
  }, [inviteUrl])

  function togglePermission(perm: TeamPermission) {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )
  }

  function handleSubmit() {
    if (!email.trim() || permissions.length === 0) return
    onInvite(email.trim(), permissions)
    setEmail('')
    setPermissions(['checkin'])
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-base font-black text-zinc-900">Invite to Crew</h3>
        <p className="text-sm text-zinc-500 mt-0.5">
          Share a magic link or send a direct email invite.
        </p>
      </div>

      {/* ── Magic Link ── */}
      <div>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
          Magic Link
        </p>
        <div className="bg-zinc-100 rounded-xl p-4">
          <p className="font-mono text-sm text-zinc-500 break-all leading-relaxed">
            {inviteUrl}
          </p>
        </div>

        {/* Share actions */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 ${
              copied
                ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
                : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
            }`}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl bg-[#25D366] text-white hover:bg-[#1ebe5d] active:bg-[#18a852] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-1"
          >
            <WhatsAppIcon />
            Share via WhatsApp
          </a>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-zinc-100" />
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">
          or invite by email
        </span>
        <div className="flex-1 h-px bg-zinc-100" />
      </div>

      {/* ── Email invite form ── */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="crew-invite-email"
            className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2"
          >
            Email Address
          </label>
          <input
            id="crew-invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="teammate@example.com"
            className="w-full bg-white border-2 border-zinc-200 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none transition-colors"
          />
        </div>

        {/* Permission selector — visual toggle grid */}
        <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
            Permissions
          </p>
          <div className="grid grid-cols-2 gap-2">
            {ALL_PERMISSIONS.map(({ value, label }) => {
              const active = permissions.includes(value)
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => togglePermission(value)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                    active
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  {/* Checkbox swatch */}
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                      active ? 'bg-violet-600' : 'bg-zinc-200'
                    }`}
                  >
                    {active && (
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Mutation error */}
        {inviteError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-600 font-medium">{inviteError}</p>
          </div>
        )}

        {/* CTA */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isInviting || !email.trim() || permissions.length === 0}
          className="w-full bg-violet-600 text-white text-sm font-bold py-3 rounded-xl hover:bg-violet-700 active:bg-violet-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
        >
          {isInviting ? 'Sending Invite…' : 'Send Invite'}
        </button>
      </div>
    </div>
  )
}
