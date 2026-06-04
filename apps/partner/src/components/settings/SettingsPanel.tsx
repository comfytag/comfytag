'use client'
import { ProfileSection } from './ProfileSection'
import { BankSection } from './BankSection'
import { NotificationsSection } from './NotificationsSection'
import { PrivacySection } from './PrivacySection'
import { SecuritySection } from './SecuritySection'
import type { User, BankAccount } from '@comfytag/types'

interface Props {
  user: User | null
  banks: BankAccount[]
}

export function SettingsPanel({ user, banks }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <ProfileSection user={user} />
      <BankSection banks={banks} />
      <NotificationsSection prefs={user?.notificationPreferences} />
      <PrivacySection settings={user?.privacySettings} />
      <SecuritySection />
    </div>
  )
}
