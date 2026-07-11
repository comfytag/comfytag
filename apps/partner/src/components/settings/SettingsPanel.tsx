'use client'
import { useState } from 'react'
import { User, CreditCard, Bell, Shield, Lock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ProfileSection } from './ProfileSection'
import { BankSection } from './BankSection'
import { NotificationsSection } from './NotificationsSection'
import { PrivacySection } from './PrivacySection'
import { SecuritySection } from './SecuritySection'
import type { User as UserType, BankAccount } from '@comfytag/types'

interface Props {
  user: UserType | undefined
  banks: BankAccount[]
}

type Section = 'profile' | 'bank' | 'notifications' | 'privacy' | 'security'

interface NavItem {
  id: Section
  label: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { id: 'profile',       label: 'Profile',       icon: User       },
  { id: 'bank',          label: 'Bank Details',  icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell       },
  { id: 'privacy',       label: 'Privacy',       icon: Shield     },
  { id: 'security',      label: 'Security',      icon: Lock       },
]

export function SettingsPanel({ user, banks }: Props) {
  const [activeSection, setActiveSection] = useState<Section>('profile')

  return (
    <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
      {/* Sidebar navigation */}
      <nav className="w-full md:w-64 shrink-0 space-y-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id
          return (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={[
                'flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 text-sm gap-3 border',
                isActive
                  ? 'bg-white border-zinc-200/80 text-zinc-900 font-bold'
                  : 'font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/80 border-transparent',
              ].join(' ')}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Content card */}
      <div className="flex-1 bg-white border border-zinc-200/80 rounded-xl p-6 sm:p-10">
        {activeSection === 'profile'       && <ProfileSection user={user} />}
        {activeSection === 'bank'          && <BankSection banks={banks} />}
        {activeSection === 'notifications' && <NotificationsSection prefs={user?.notificationPreferences} />}
        {activeSection === 'privacy'       && <PrivacySection settings={user?.privacySettings} />}
        {activeSection === 'security'      && <SecuritySection />}
      </div>
    </div>
  )
}
