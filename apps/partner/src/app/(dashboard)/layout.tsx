import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import ShellClient from '@/components/dashboard/ShellClient'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session || !session.user?.isPartner) redirect('/login')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <ShellClient>{children}</ShellClient>
    </div>
  )
}
