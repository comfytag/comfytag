'use client'

interface AttendeeStatusBadgeProps {
  status: 'active' | 'used' | 'transferred' | 'refunded' | 'ended'
}

const STATUS_CONFIG: Record<AttendeeStatusBadgeProps['status'], { classes: string; label: string }> = {
  active:      { classes: 'bg-emerald-100 text-emerald-700', label: 'Active' },
  used:        { classes: 'bg-violet-100 text-violet-700',   label: 'Used' },
  transferred: { classes: 'bg-zinc-100 text-zinc-500',       label: 'Transferred' },
  refunded:    { classes: 'bg-red-100 text-red-600',         label: 'Refunded' },
  ended:       { classes: 'bg-zinc-100 text-zinc-400',       label: 'Ended' },
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
