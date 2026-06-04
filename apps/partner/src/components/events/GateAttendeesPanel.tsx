'use client'

import { useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Search } from 'lucide-react'
import { Button, Input } from '@comfytag/ui'
import { formatDate } from '@comfytag/utils'
import api, { authHeader } from '@/lib/api'

interface Attendee {
  _id: string
  name: string
  email: string
  numOfTicket: number
  type?: string
  checkedIn?: boolean
  checkedInAt?: string
  checkInDate?: string
  checkedInMethod?: 'face' | 'qr' | 'manual' | null
}

interface GateAttendeesPanelProps {
  eventId: string
}

const METHOD_LABELS: Record<string, string> = {
  face: 'Face',
  qr: 'QR',
  manual: 'Manual',
}

const METHOD_COLORS: Record<string, string> = {
  face: 'var(--color-brand)',
  qr: 'var(--color-success)',
  manual: '#F59E0B',
}

export function GateAttendeesPanel({ eventId }: GateAttendeesPanelProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const token = session?.user?.token as string | undefined
  const [searchQuery, setSearchQuery] = useState('')

  const { data: attendees = [], isLoading } = useQuery<Attendee[]>({
    queryKey: ['gateAttendees', eventId],
    queryFn: () =>
      api
        .get(`/audience/event/${eventId}?limit=200`, authHeader(token))
        .then((r) => {
          const body = r.data
          return Array.isArray(body) ? body : (body?.data ?? [])
        }),
    refetchInterval: 15000,
    enabled: !!token,
  })

  const filteredAttendees = useMemo(() => {
    if (!searchQuery) return attendees
    const q = searchQuery.toLowerCase()
    return attendees.filter(
      (a) => a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q)
    )
  }, [attendees, searchQuery])

  const checkInMutation = useMutation({
    mutationFn: ({ ticketId, checkedIn }: { ticketId: string; checkedIn: boolean }) =>
      api
        .post(`/audience/${ticketId}/checkin`, { checkedIn }, authHeader(token))
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateAttendees', eventId] })
      queryClient.invalidateQueries({ queryKey: ['checkInStats', eventId] })
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
        Attendees ({filteredAttendees.length}{attendees.length !== filteredAttendees.length ? ` of ${attendees.length}` : ''})
      </h3>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search
            size={16}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>
          Loading attendees…
        </p>
      ) : (
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
                  backgroundColor: attendee.checkedIn ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-surface-2, #111)',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-success)' }}>
                        ✓ Checked in {attendee.checkedInAt ? formatDate(attendee.checkedInAt) : attendee.checkInDate ? formatDate(attendee.checkInDate) : 'today'}
                      </span>
                      {attendee.checkedInMethod && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--color-surface)',
                            color: METHOD_COLORS[attendee.checkedInMethod] ?? 'var(--color-text-muted)',
                            border: `1px solid ${METHOD_COLORS[attendee.checkedInMethod] ?? 'var(--color-border)'}`,
                          }}
                        >
                          {METHOD_LABELS[attendee.checkedInMethod] ?? attendee.checkedInMethod}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text-muted)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {attendee.numOfTicket} {attendee.numOfTicket === 1 ? 'ticket' : 'tickets'}
                  </span>

                  {!attendee.checkedIn ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => checkInMutation.mutate({ ticketId: attendee._id, checkedIn: true })}
                      loading={checkInMutation.isPending}
                    >
                      Check In
                    </Button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => checkInMutation.mutate({ ticketId: attendee._id, checkedIn: false })}
                        loading={checkInMutation.isPending}
                      >
                        Undo
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
