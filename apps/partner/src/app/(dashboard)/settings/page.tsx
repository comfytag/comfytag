import { PageHeader } from '@comfytag/ui'
import { SectionCard } from '@/components/settings/SectionCard'
import type { BankAccount, User } from '@comfytag/types'
import { getServerSession } from 'next-auth'
import api, { authHeader } from '@/lib/api'
import { SettingsPanel } from '@/components/settings/SettingsPanel'

interface SettingsPageProps {}

export default async function SettingsPage({}: SettingsPageProps) {
  const session = await getServerSession()

  let banks: BankAccount[] = []
  let user: User | null = null

  try {
    const banksRes = await api.get<BankAccount[]>(
      '/bank/' + session?.user?.id,
      authHeader(session?.user?.token as string)
    )
    banks = banksRes.data ?? []
  } catch {
    banks = []
  }

  try {
    const userRes = await api.get<User>(
      '/users/' + session?.user?.id,
      authHeader(session?.user?.token as string)
    )
    user = userRes.data
  } catch {
    user = null
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <PageHeader title="Settings" subtitle="Manage your profile and payment details" />

      <div style={{ maxWidth: '720px' }}>
        <SettingsPanel user={user} banks={banks} />
      </div>
    </div>
  )
}
