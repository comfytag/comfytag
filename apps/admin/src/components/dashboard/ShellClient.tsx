'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { AdminRole } from '../../lib/roles'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useNotificationSocket } from '../../hooks/useNotificationSocket'

interface ShellClientProps {
  children: ReactNode
  role: AdminRole
  userName: string | null | undefined
}

export function ShellClient({ children, role, userName }: ShellClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  useNotificationSocket()

  return (
    <>
      <style>{`@media (max-width: 768px) { .admin-content { margin-left: 0 !important; } }`}</style>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        role={role}
      />

      <div
        className="admin-content"
        style={{ marginLeft: '240px' }}
      >
        <Topbar
          onMenuClick={() => setIsSidebarOpen((prev) => !prev)}
          role={role}
          userName={userName}
        />
        <main style={{ padding: '24px' }}>
          {children}
        </main>
      </div>
    </>
  )
}
