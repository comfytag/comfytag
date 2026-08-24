'use client'

import { useShellStore } from '@/hooks/useShellStore'

const VARIANT_CLASSES = {
  default: 'bg-zinc-800 text-zinc-300 border-white/10 hover:bg-zinc-700 hover:text-white',
  primary: 'bg-violet-950 text-violet-300 border-violet-500/30 hover:bg-violet-900 hover:text-violet-200',
  destructive: 'bg-red-950 text-red-400 border-red-500/20 hover:bg-red-900 hover:text-red-300',
} as const

export default function ContextRibbon() {
  const { ribbonActions } = useShellStore()

  if (ribbonActions.length === 0) return null

  return (
    <div
      aria-label="Context actions"
      className="hidden md:flex fixed top-20 left-1/2 -translate-x-1/2 z-40 items-center gap-2"
    >
      {ribbonActions.map((action, i) => (
        <button
          key={i}
          type="button"
          onClick={action.onClick}
          className={[
            'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
            VARIANT_CLASSES[action.variant ?? 'default'],
          ].join(' ')}
        >
          {action.icon != null && (
            <span aria-hidden="true" className="w-4 h-4 flex items-center justify-center shrink-0">
              {action.icon}
            </span>
          )}
          {action.label}
        </button>
      ))}
    </div>
  )
}
