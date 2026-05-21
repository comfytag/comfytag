'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function ShellClient({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <>
      <style>{`
        .shell-main { margin-left: 0; }
        @media (min-width: 768px) { .shell-main { margin-left: 240px; } }
      `}</style>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div
        className="shell-main"
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main
          style={{
            flex: 1,
            padding: 24,
            background: 'var(--color-bg)',
            overflowY: 'auto',
          }}
        >
          {children}
        </main>
      </div>
    </>
  )
}
