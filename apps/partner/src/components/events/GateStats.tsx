'use client'

import { Users, Ticket, Activity } from 'lucide-react'

interface CheckInStats {
  eventId: string
  totalCapacity: number
  totalCheckedIn: number
  totalAttendees: number
}

interface GateStatsProps {
  stats: CheckInStats
}

export function GateStats({ stats }: GateStatsProps) {
  const checkInPercentage = stats ? Math.round((stats.totalCheckedIn / stats.totalAttendees) * 100) : 0
  const pendingCheckIn = (stats?.totalAttendees ?? 0) - (stats?.totalCheckedIn ?? 0)

  const StatCardItem = ({ icon: Icon, title, value, change }: { icon: any; title: string; value: string; change: string }) => (
    <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)', borderLeft: '4px solid var(--color-brand)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Icon size={18} color="var(--color-brand)" />
        <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{title}</div>
      </div>
      <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{change}</div>
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
      <StatCardItem
        icon={Users}
        title="Checked In"
        value={`${stats.totalCheckedIn} / ${stats.totalAttendees}`}
        change={`${checkInPercentage}% checked in`}
      />
      <StatCardItem
        icon={Ticket}
        title="Pending Check-In"
        value={pendingCheckIn.toString()}
        change={`${100 - checkInPercentage}% remaining`}
      />
      <StatCardItem
        icon={Activity}
        title="Total Capacity"
        value={`${stats.totalCheckedIn}/${stats.totalCapacity}`}
        change="Venue capacity"
      />
    </div>
  )
}
