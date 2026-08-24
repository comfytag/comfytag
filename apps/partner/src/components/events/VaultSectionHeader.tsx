'use client'

interface VaultSectionHeaderProps {
  label: string
  count: number
}

export function VaultSectionHeader({ label, count }: VaultSectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs font-bold text-zinc-500 tracking-widest uppercase whitespace-nowrap">
        · {label} ·
      </span>
      <div className="flex-1 h-px bg-zinc-800" />
      <span className="text-xs font-semibold text-zinc-400 tabular-nums">{count}</span>
    </div>
  )
}
