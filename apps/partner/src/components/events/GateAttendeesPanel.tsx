'use client'

import { useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Search } from 'lucide-react'
import { Button, Input } from '@comfytag/ui'
import { formatDate } from '@comfytag/utils'
import api, { authHeader } from '@/lib/api'

interface Attendee {
  _id: string
  name: string
  email: string
  numOfTicket: number
  checkedIn?: boolean
  checkInDate?: string
}

interface GateAttendeesPanelProps {
  attendees: Attendee[]
  eventId: string
}

export function GateAttendeesPanel({ attendees, eventId }: GateAttendeesPanelProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredAttendees = useMemo(() => {
    if (!searchQuery) return attendees
    const q = searchQuery.toLowerCase()
    return attendees.filter(
      (a) => a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q)
    )
  }, [attendees, searchQuery])

  const manualCheckInMutation = useMutation({
    mutationFn: (ticketId: string) =>
      api.post(`/audience/${ticketId}/checkin`, {}, authHeader(session?.user.token)).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkInStats', eventId] })
      queryClient.invalidateQueries({ queryKey: ['gateAttendees', eventId] })
    },
  })

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '24px',
      }}
    >
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 16px 0' }}>
        Attendees ({filteredAttendees.length})
      </h3>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
        </div>
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
  )
}
