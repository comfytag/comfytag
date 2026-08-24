'use client'

import type { CoOrganizerMember, TeamPermission } from '@/hooks/useTeam'

interface CrewMemberCardProps {
  member: CoOrganizerMember
  eventId: string
  isRemoving: boolean
  onRemove: (payload: { eventId: string; userId: string }) => void
}

const ALL_PERMISSIONS: { value: TeamPermission; label: string }[] = [
  { value: 'checkin', label: 'Check-in' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'edit', label: 'Edit Event' },
  { value: 'manage_tickets', label: 'Tickets' },
]

const STATUS_PILL: Record<string, string> = {
  active: 'bg-emerald-950/40 text-emerald-400',
  pending: 'bg-amber-950/40 text-amber-400',
  removed: 'bg-zinc-800 text-zinc-500',
}

function GrantedIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function DeniedIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

export function CrewMemberCard({
  member,
  eventId,
  isRemoving,
  onRemove,
}: CrewMemberCardProps) {
  const displayName = member.user_id?.name ?? member.email
  const initial = displayName.charAt(0).toUpperCase()
  const logo = member.user_id?.logo ?? null
  const canRemove = !!member.user_id

  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-xl p-5 flex flex-col gap-4 transition-colors duration-200 hover:border-zinc-700">
      {/* Avatar + name row */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-black shrink-0 overflow-hidden">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-(--color-text) text-sm leading-tight truncate">{displayName}</p>
          {member.user_id && (
            <p className="text-[11px] text-zinc-500 truncate mt-0.5">{member.email}</p>
          )}
        </div>

        <span
          className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 ${
            STATUS_PILL[member.status] ?? 'bg-zinc-800 text-zinc-400'
          }`}
        >
          {member.status}
        </span>
      </div>

      {/* Permission pills — all 4 shown, granted vs denied */}
      <div>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
          Permissions
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_PERMISSIONS.map(({ value, label }) => {
            const granted = member.permissions.includes(value)
            return (
              <span
                key={value}
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                  granted
                    ? 'bg-violet-950/40 text-violet-400'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {granted ? <GrantedIcon /> : <DeniedIcon />}
                {label}
              </span>
            )
          })}
        </div>
      </div>

      {/* Remove — only if member has resolved user (active, not just pending email) */}
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove({ eventId, userId: member.user_id!._id })}
          disabled={isRemoving}
          aria-label={`Remove ${displayName} from crew`}
          className="w-full text-xs font-semibold text-red-400 py-2 rounded-xl border border-red-900/50 hover:bg-red-950/40 active:bg-red-950/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1"
        >
          Remove from Crew
        </button>
      )}
    </div>
  )
}
