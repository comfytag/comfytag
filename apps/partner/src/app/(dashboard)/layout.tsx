import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import ShellClient from '@/components/dashboard/ShellClient'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()

  if (!session) redirect('/login')

  // Defense-in-depth: a valid NextAuth session exists but the account may be a
  // standard buyer account that somehow reached a partner route.  Reject early.
  if (!session.user.isPartner && !session.user.isAdmin) {
    redirect('/login?error=Unauthorized')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <ShellClient>{children}</ShellClient>
    </div>
  )
}
