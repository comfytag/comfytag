'use client'

import { useState, useMemo, useEffect } from 'react'
import { Download } from 'lucide-react'
import { Skeleton, EmptyState, ErrorMessage } from '@comfytag/ui'
import type { Ticket } from '@comfytag/types'
import { EventSelectorBar } from '@/components/attendees/EventSelectorBar'
import { AttendeeSearchFilter } from '@/components/attendees/AttendeeSearchFilter'
import { AttendeeRow } from '@/components/attendees/AttendeeRow'
import { useMyEvents, useAttendees, useCheckin } from '@/hooks'
import { api } from '@/lib/api'

type StatusFilterValue = 'all' | 'active' | 'used' | 'transferred' | 'refunded'

export default function AttendeesPage() {
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all')

  // Fetch organizer's events
  const { data: events = [], isLoading: eventsLoading, isError: eventsError } = useMyEvents()

  // Set first event as default when events load
  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0]._id)
    }
  }, [events, selectedEventId])

  // Fetch attendees for selected event
  const { data: attendees = [], isLoading: attendeesLoading, isError: attendeesError } = useAttendees(selectedEventId)

  // Check-in mutation
  const checkInMutation = useCheckin()

  // CSV export handler
  const handleExport = async () => {
    if (!selectedEventId) return
    try {
      const res = await api.get(
        `/audience/events/${selectedEventId}/audience/export`,
        {
          responseType: 'blob',
        }
      )
      const blob = res.data
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendees-${selectedEventId}.csv`
      a.click()
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  // Filter attendees
  const filtered = useMemo(() => {
    let result = (attendees as Ticket[])

    if (statusFilter !== 'all') {
      result = result.filter(a => a.status === statusFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(a =>
        a.name?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.phone?.toLowerCase().includes(q)
      )
    }

    return result
  }, [attendees, statusFilter, searchQuery])

  return (
    <div>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', paddingTop: '32px', paddingBottom: '32px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0, marginBottom: '4px' }}>
            ATTENDEES
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
            Manage attendees across all your events
          </p>
        </div>

        {/* Error states */}
        {eventsError && (
          <div style={{ marginBottom: '20px' }}>
            <ErrorMessage message="Failed to load events." />
          </div>
        )}
        {attendeesError && (
          <div style={{ marginBottom: '20px' }}>
            <ErrorMessage message="Failed to load attendees." />
          </div>
        )}

        {/* Event selector */}
        {eventsLoading ? (
          <div style={{ marginBottom: '24px' }}>
            <Skeleton height={40} width={280} borderRadius={8} />
          </div>
        ) : (
          <div style={{ marginBottom: '24px' }}>
            <EventSelectorBar
              events={events}
              selectedEventId={selectedEventId}
              onSelectEvent={setSelectedEventId}
            />
          </div>
        )}

        {/* Search + Filter + Export */}
        {selectedEventId && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <AttendeeSearchFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                attendeeCount={filtered.length}
              />
            </div>
            <button
              onClick={handleExport}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background var(--duration-fast) ease',
              }}
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        )}

        {/* Attendees table */}
        {!selectedEventId ? (
          <div style={{ padding: '32px' }}>
            <EmptyState
              title="No event selected"
              subtitle="Select an event above to view attendees"
            />
          </div>
        ) : attendeesLoading ? (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height={56} />
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '32px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
            <EmptyState
              title={searchQuery || statusFilter !== 'all' ? 'No attendees found' : 'No attendees yet'}
              subtitle={searchQuery ? 'Try adjusting your search' : 'Attendees will appear once tickets are sold'}
            />
          </div>
        ) : (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ maxHeight: '800px', overflowY: 'auto' }}>
              {filtered.map((attendee) => (
                <AttendeeRow
                  key={attendee._id}
                  attendee={attendee}
                  onCheckInToggle={() => checkInMutation.mutate({ attendeeId: attendee._id, eventId: selectedEventId, payload: {} })}
                  isCheckingIn={checkInMutation.isPending}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

