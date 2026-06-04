'use client'

import { use, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { GateStats } from '@/components/events/GateStats'
import { GateScannerPanel } from '@/components/events/GateScannerPanel'
import { GateAttendeesPanel } from '@/components/events/GateAttendeesPanel'
import { PageHeader, LoadingSpinner, ErrorMessage } from '@comfytag/ui'
import api, { authHeader } from '@/lib/api'

interface CheckInStats {
  eventId: string
  totalCapacity: number
  checkedIn: number
  remaining: number
  checkInRate: number
  byTier: Record<string, number>
  byMethod: Record<string, number>
}

type TabId = 'scanner' | 'attendees'

interface GatePageProps {
  params: Promise<{ id: string }>
}

export default function GatePage({ params }: GatePageProps) {
  const { id: eventId } = use(params)
  const { data: session } = useSession()
  const token = session?.user?.token as string | undefined
  const [activeTab, setActiveTab] = useState<TabId>('scanner')

  const {
    data: rawStats,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuery({
    queryKey: ['checkInStats', eventId],
    queryFn: () =>
      api
        .get<CheckInStats>(`/events/${eventId}/checkin-stats`, authHeader(token))
        .then((r) => r.data),
    refetchInterval: 5000,
    enabled: !!token,
  })

  // Map API shape → GateStats component shape
  const stats = rawStats
    ? {
        eventId,
        totalCapacity: rawStats.totalCapacity,
        totalCheckedIn: rawStats.checkedIn,
        totalAttendees: rawStats.checkedIn + rawStats.remaining,
      }
    : null

  const tabs: { id: TabId; label: string }[] = [
    { id: 'scanner', label: 'Scanner' },
    { id: 'attendees', label: 'Attendees' },
  ]

  return (
    <div style={{ padding: '28px 32px' }}>
      <Breadcrumb
        items={[
          { label: 'Events', href: '/events' },
          { label: 'Event', href: `/events/${eventId}` },
          { label: 'Gate Management' },
        ]}
      />

      <PageHeader
        title="Gate Management"
        subtitle="Real-time check-in tracking and management"
      />

      {/* Stats strip — always visible */}
      {statsLoading && !stats && (
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '14px' }}>
          <LoadingSpinner size="sm" />
          Loading stats…
        </div>
      )}
      {statsError && (
        <div style={{ marginBottom: '32px' }}>
          <ErrorMessage message="Failed to load check-in stats." />
        </div>
      )}
      {stats && <GateStats stats={stats} />}

      {/* Tab switcher */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '24px',
          backgroundColor: 'var(--color-surface)',
          borderRadius: '10px',
          padding: '4px',
          width: 'fit-content',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? '#ffffff' : 'var(--color-text-muted)',
              backgroundColor: activeTab === tab.id ? 'var(--color-brand)' : 'transparent',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'scanner' && <GateScannerPanel eventId={eventId} />}
      {activeTab === 'attendees' && <GateAttendeesPanel eventId={eventId} />}
    </div>
  )
}
