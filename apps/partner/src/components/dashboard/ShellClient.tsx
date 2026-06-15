'use client'

import { type ReactNode } from 'react'
import { ShellStoreProvider } from '@/hooks/useShellStore'
import FloatingIslandNav from '@/components/layout/FloatingIslandNav'
import ContextRibbon from '@/components/layout/ContextRibbon'
import BottomPillNav from '@/components/layout/BottomPillNav'
import { useNotificationSocket } from '@/hooks/useNotificationSocket'

function ShellInner({ children }: { children: ReactNode }) {
  // Single mount point for real-time notification listener
  useNotificationSocket()

  return (
    <div className="min-h-screen bg-slate-50">
      <FloatingIslandNav />
      <ContextRibbon />
      <main className="min-h-screen bg-slate-50 pt-16 md:pt-32 pb-28 md:pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <BottomPillNav />
    </div>
  )
}

export default function ShellClient({ children }: { children: ReactNode }) {
  return (
    <ShellStoreProvider>
      <ShellInner>{children}</ShellInner>
    </ShellStoreProvider>
  )
}
