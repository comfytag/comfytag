'use client'

import { use } from 'react'
import { useSession } from 'next-auth/react'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { PageHeader } from '@comfytag/ui'
import { GateScannerPanel } from '@/components/events/GateScannerPanel'
import { GateAttendeesPanel } from '@/components/events/GateAttendeesPanel'
import { GateStats } from '@/components/events/GateStats'
import { useEventCheckinStats } from '@/hooks'

interface GatePageProps {
  params: Promise<{ id: string }>
}

export default function GatePage({ params }: GatePageProps) {
  const { id: eventId } = use(params)
  const { data: session } = useSession()
  const token = session?.user?.token as string | undefined
  const { data: stats } = useEventCheckinStats(eventId, token)

  return (
    <div style={{ padding: '28px 32px' }}>
      <Breadcrumb
        items={[
          { label: 'Events', href: '/events' },
          { label: 'Gate Scanner', href: `/events/${eventId}/gate` },
        ]}
      />

      <PageHeader
        title="Gate Scanner Activation"
        subtitle="Real-time check-in with QR codes and facial verification"
      />

      {stats && (
        <GateStats
          stats={{
            eventId,
            totalCapacity: stats.totalCapacity ?? 0,
            totalCheckedIn: stats.checkedIn ?? 0,
            totalAttendees: (stats.remaining ?? 0) + (stats.checkedIn ?? 0),
          }}
        />
      )}

      <div style={{ marginBottom: '32px' }}>
        <GateScannerPanel eventId={eventId} />
      </div>

      <div style={{ marginBottom: '32px' }}>
        <GateAttendeesPanel eventId={eventId} />
      </div>
    </div>
  )
}
