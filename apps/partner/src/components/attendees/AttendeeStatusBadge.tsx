'use client'

interface AttendeeStatusBadgeProps {
  status: 'active' | 'used' | 'transferred' | 'refunded' | 'ended'
}

const STATUS_CONFIG: Record<AttendeeStatusBadgeProps['status'], { classes: string; label: string }> = {
  active:      { classes: 'bg-emerald-950/40 text-emerald-400', label: 'Active' },
  used:        { classes: 'bg-violet-950/40 text-violet-400',   label: 'Used' },
  transferred: { classes: 'bg-zinc-800 text-zinc-400',          label: 'Transferred' },
  refunded:    { classes: 'bg-red-950/40 text-red-400',         label: 'Refunded' },
  ended:       { classes: 'bg-zinc-800 text-zinc-500',          label: 'Ended' },
}

export function AttendeeStatusBadge({ status }: AttendeeStatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={`inline-block font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wide ${config.classes}`}
    >
      {config.label}
    </span>
  )
}
