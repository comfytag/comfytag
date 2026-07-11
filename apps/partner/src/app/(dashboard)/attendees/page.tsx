'use client'

import { useState, useMemo, useEffect } from 'react'
import { Download, Users } from 'lucide-react'
import { Skeleton, ErrorMessage } from '@comfytag/ui'
import type { Ticket } from '@comfytag/types'
import { EventSelectorBar } from '@/components/attendees/EventSelectorBar'
import { AttendeeSearchFilter } from '@/components/attendees/AttendeeSearchFilter'
import { AttendeeRow } from '@/components/attendees/AttendeeRow'
import { useMyEvents, useAttendees, useCheckin, useExportAttendees } from '@/hooks'

type StatusFilterValue = 'all' | 'active' | 'used' | 'transferred' | 'refunded'

export default function AttendeesPage() {
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all')

  const { data: events = [], isLoading: eventsLoading, isError: eventsError } = useMyEvents()

  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0]._id)
    }
  }, [events, selectedEventId])

  const { data: attendees = [], isLoading: attendeesLoading, isError: attendeesError } = useAttendees(selectedEventId)

  const checkInMutation = useCheckin()
  const exportMutation = useExportAttendees()

  const handleExport = () => {
    if (!selectedEventId) return
    exportMutation.mutate(selectedEventId, {
      onSuccess: (csv) => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `attendees-${selectedEventId}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      },
      onError: (err) => {
        console.error('Export failed:', err)
      },
    })
  }

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
        String(a.phone || '').toLowerCase().includes(q)
      )
    }

    return result
  }, [attendees, statusFilter, searchQuery])

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Attendees</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage your global guestlist</p>
        </div>
        <button
          onClick={handleExport}
          disabled={!selectedEventId || exportMutation.isPending}
          className="bg-white border border-zinc-200 text-zinc-900 font-semibold py-2.5 px-5 rounded-xl hover:bg-zinc-50 hover:border-zinc-300 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Download size={16} aria-hidden="true" />
          {exportMutation.isPending ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {/* Error states */}
      {eventsError && <ErrorMessage message="Failed to load events." />}
      {attendeesError && <ErrorMessage message="Failed to load attendees." />}

      {/* Event selector */}
      {eventsLoading ? (
        <Skeleton height={44} width={280} borderRadius={12} />
      ) : (
        <EventSelectorBar
          events={events}
          selectedEventId={selectedEventId}
          onSelectEvent={setSelectedEventId}
        />
      )}

      {/* Search + filter hub */}
      {selectedEventId && (
        <AttendeeSearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          attendeeCount={filtered.length}
        />
      )}

      {/* Directory */}
      {!selectedEventId ? (
        <div className="py-24 flex flex-col items-center justify-center text-center border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
            <Users size={28} className="text-zinc-400" aria-hidden="true" />
          </div>
          <h3 className="text-zinc-900 font-bold text-lg tracking-tight">No event selected</h3>
          <p className="mt-2 text-zinc-400 text-sm max-w-xs">
            Select an event above to view and manage its attendees.
          </p>
        </div>
      ) : attendeesLoading ? (
        <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden">
          <div className="divide-y divide-zinc-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-4">
                <Skeleton height={48} borderRadius={8} />
              </div>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
            <Users size={28} className="text-zinc-400" aria-hidden="true" />
          </div>
          <h3 className="text-zinc-900 font-bold text-lg tracking-tight">
            {searchQuery || statusFilter !== 'all' ? 'No attendees found' : 'No attendees yet'}
          </h3>
          <p className="mt-2 text-zinc-400 text-sm max-w-xs">
            {searchQuery || statusFilter !== 'all'
              ? 'No attendees match your filters. Try adjusting your search.'
              : 'Attendees will appear here once tickets are sold for this event.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden">
          <div className="max-h-[800px] overflow-y-auto">
            {filtered.map((attendee) => (
              <AttendeeRow
                key={attendee._id}
                attendee={attendee}
                onCheckInToggle={() =>
                  checkInMutation.mutate({ attendeeId: attendee._id, eventId: selectedEventId, payload: {} })
                }
                isCheckingIn={checkInMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
