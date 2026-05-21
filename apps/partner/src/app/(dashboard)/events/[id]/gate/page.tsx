'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, CheckCircle2, Users, Ticket, Activity } from 'lucide-react'
import { Button, Input, ErrorMessage, LoadingSpinner, PageHeader, StatCard } from '@comfytag/ui'
import { formatDate } from '@comfytag/utils'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import api, { authHeader } from '@/lib/api'

interface Attendee {
  _id: string
  name: string
  email: string
  numOfTicket: number
  checkedIn?: boolean
  checkInDate?: string
}

interface CheckInStats {
  eventId: string
  totalCapacity: number
  totalCheckedIn: number
  totalAttendees: number
}

export default function GatePage() {
  const params = useParams<{ id: string }>()
  const eventId = params.id
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState('')

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['checkInStats', eventId],
    queryFn: () =>
      api
        .get<CheckInStats>(`/events/${eventId}/checkin-stats`, authHeader(session?.user.token))
        .then((r) => r.data),
    enabled: !!eventId && eventId !== 'undefined',
    refetchInterval: 5000,
  })

  const { data: attendeesData, isLoading: attendeesLoading } = useQuery({
    queryKey: ['gateAttendees', eventId],
    queryFn: () =>
      api
        .get<Attendee[]>(`/audience/event/${eventId}`, { params: { limit: 200 }, ...authHeader(session?.user.token) })
        .then((r) => r.data),
    enabled: !!eventId && eventId !== 'undefined',
  })

  const manualCheckInMutation = useMutation({
    mutationFn: (ticketId: string) =>
      api.post(`/audience/${ticketId}/checkin`, {}, authHeader(session?.user.token)).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkInStats', eventId] })
      queryClient.invalidateQueries({ queryKey: ['gateAttendees', eventId] })
    },
  })

  const attendees = attendeesData ?? []
  const filteredAttendees = searchQuery
    ? attendees.filter(
        (a) =>
          a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : attendees

  const stats = statsData
  const checkInPercentage = stats ? Math.round((stats.totalCheckedIn / stats.totalAttendees) * 100) : 0

  if (statsLoading || attendeesLoading) {
    return (
      <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner centered size="lg" />
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <Breadcrumb
        items={[
          { label: 'Events', href: '/events' },
          { label: eventId ?? 'Event', href: `/events/${eventId}` },
          { label: 'Gate Management' },
        ]}
      />
      <PageHeader title="Gate Management" subtitle="Real-time check-in tracking and management" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatCard
          icon={Users}
          title="Checked In"
          value={`${stats?.totalCheckedIn ?? 0} / ${stats?.totalAttendees ?? 0}`}
          change={`${checkInPercentage}% checked in`}
        />
        <StatCard
          icon={Ticket}
          title="Pending Check-In"
          value={`${(stats?.totalAttendees ?? 0) - (stats?.totalCheckedIn ?? 0)}`}
          change={`${100 - checkInPercentage}% remaining`}
        />
        <StatCard
          icon={Activity}
          title="Total Capacity"
          value={`${stats?.totalCheckedIn ?? 0}/${stats?.totalCapacity ?? 0}`}
          change="Venue capacity"
        />
      </div>

      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 16px 0' }}>
          Attendees
        </h3>

        <div style={{ marginBottom: '20px' }}>
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search size={16} />}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto' }}>
          {filteredAttendees.length === 0 ? (
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>
              {searchQuery ? 'No attendees match your search.' : 'No attendees yet.'}
            </p>
          ) : (
            filteredAttendees.map((attendee) => (
              <div
                key={attendee._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: attendee.checkedIn ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-surface-2)',
                  borderRadius: '8px',
                  borderLeft: attendee.checkedIn ? '4px solid var(--color-success)' : '4px solid transparent',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--color-text)' }}>
                    {attendee.name}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {attendee.email}
                  </div>
                  {attendee.checkedIn && (
                    <div style={{ fontSize: '12px', color: 'var(--color-success)', marginTop: '4px' }}>
                      ✓ Checked in {attendee.checkInDate ? formatDate(attendee.checkInDate) : 'today'}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--color-surface-2)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {attendee.numOfTicket} {attendee.numOfTicket === 1 ? 'ticket' : 'tickets'}
                  </span>

                  {!attendee.checkedIn ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => manualCheckInMutation.mutate(attendee._id)}
                      loading={manualCheckInMutation.isPending}
                    >
                      Check In
                    </Button>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        color: 'var(--color-success)',
                      }}
                    >
                      <CheckCircle2 size={16} />
                      Checked
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
