'use client'

import { type ReactNode } from 'react'
import PartnerNav from './PartnerNav'
import { PartnerBottomTabBar } from './PartnerBottomTabBar'

interface ShellClientProps {
  children: ReactNode
}

export default function ShellClient({ children }: ShellClientProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg)',
      }}
    >
      <PartnerNav />
      <main
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0px',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
          width: '100%',
          flex: 1,
        }}
      >
        {children}
      </main>
      <PartnerBottomTabBar />
    </div>
  )
}
