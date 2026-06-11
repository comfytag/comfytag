import { redirect } from 'next/navigation'
import { getServerSession } from '../../lib/auth'
import { ShellClient } from '../../components/dashboard/ShellClient'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  if (!session || !session.user?.role) redirect('/login')

  return (
    <ShellClient role={session.user.role} userName={session.user.name}>
      {children}
    </ShellClient>
  )
}
