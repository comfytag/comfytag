'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, X } from 'lucide-react'
import { Skeleton, EmptyState, ErrorMessage } from '@comfytag/ui'
import type { Event } from '@comfytag/types'
import { VaultSectionHeader } from '@/components/events/VaultSectionHeader'
import { VaultTicketCard } from '@/components/events/VaultTicketCard'
import { VaultLiveCard } from '@/components/events/VaultLiveCard'
import { useMyEvents, useDeleteEvent, useDuplicateEvent } from '@/hooks'

export default function EventsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  const { data: events = [], isLoading, isError } = useMyEvents()
  const duplicateMutation = useDuplicateEvent()
  const deleteEventMutation = useDeleteEvent()

  const searched = useMemo<Event[]>(() => {
    if (!searchQuery.trim()) return events
    const q = searchQuery.toLowerCase()
    return events.filter((e) => e.name.toLowerCase().includes(q))
  }, [events, searchQuery])

  const { liveNow, upcoming, past } = useMemo(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(todayStart.getTime() + 86_400_000)

    const liveNow: Event[] = []
    const upcoming: Event[] = []
    const past: Event[] = []

    for (const event of searched) {
      const eventDate = event.date ? new Date(event.date) : null

      if (
        event.status === 'published' &&
        eventDate !== null &&
        eventDate >= todayStart &&
        eventDate < todayEnd
      ) {
        liveNow.push(event)
      } else if (
        event.status === 'draft' ||
        (event.status === 'published' && (eventDate === null || eventDate >= todayEnd))
      ) {
        upcoming.push(event)
      } else {
        past.push(event)
      }
    }

    upcoming.sort((a, b) => {
      const dA = a.date ? new Date(a.date).getTime() : Infinity
      const dB = b.date ? new Date(b.date).getTime() : Infinity
      return dA - dB
    })

    past.sort((a, b) => {
      const dA = a.date ? new Date(a.date).getTime() : 0
      const dB = b.date ? new Date(b.date).getTime() : 0
      return dB - dA
    })

    return { liveNow, upcoming, past }
  }, [searched])

  function handleDuplicate(event: Event) {
    setDuplicatingId(event._id)
    duplicateMutation.mutate(event._id, {
      onSuccess: (newEvent: { _id: string }) => router.push(`/events/${newEvent._id}/edit`),
      onSettled: () => setDuplicatingId(null),
    })
  }

  function handleDelete(event: Event) {
    if (confirm(`Delete "${event.name}"?`)) {
      deleteEventMutation.mutate(event._id)
    }
  }

  function handleEdit(event: Event) {
    router.push(`/events/${event._id}/edit`)
  }

  const isEmpty = !isLoading && liveNow.length === 0 && upcoming.length === 0 && past.length === 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Events Vault</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage and track all your events</p>
        </div>
        <Link
          href="/events/create"
          className="flex items-center gap-2 bg-violet-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-violet-700 active:bg-violet-800 transition-colors duration-150 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
        >
          <Plus size={16} aria-hidden="true" />
          Create Event
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
          size={15}
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Search events…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-zinc-200 rounded-full pl-10 pr-10 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Error */}
      {isError && <ErrorMessage message="Failed to load events." />}
      {deleteEventMutation.isError && (
        <ErrorMessage
          message={
            (deleteEventMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Failed to delete event. Please try again.'
          }
        />
      )}
      {duplicateMutation.isError && (
        <ErrorMessage
          message={
            (duplicateMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Failed to duplicate event. Please try again.'
          }
        />
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-10">
          {[0, 1].map((s) => (
            <div key={s} className="space-y-4">
              <Skeleton height={16} width={120} />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} height={120} borderRadius={16} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vault sections */}
      {!isLoading && (
        <>
          {/* ── LIVE NOW ── */}
          {liveNow.length > 0 && (
            <section aria-label="Live now">
              <VaultSectionHeader label="Live Now" count={liveNow.length} />
              <div className="space-y-4">
                {liveNow.map((event) => (
                  <VaultLiveCard
                    key={event._id}
                    event={event}
                    isDuplicating={duplicatingId === event._id}
                    onEdit={() => handleEdit(event)}
                    onDuplicate={() => handleDuplicate(event)}
                    onDelete={() => handleDelete(event)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── UPCOMING ── */}
          {upcoming.length > 0 && (
            <section aria-label="Upcoming events">
              <VaultSectionHeader label="Upcoming" count={upcoming.length} />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {upcoming.map((event) => (
                  <VaultTicketCard
                    key={event._id}
                    event={event}
                    isDuplicating={duplicatingId === event._id}
                    onEdit={() => handleEdit(event)}
                    onDuplicate={() => handleDuplicate(event)}
                    onDelete={() => handleDelete(event)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── PAST ── */}
          {past.length > 0 && (
            <section aria-label="Past events">
              <VaultSectionHeader label="Past" count={past.length} />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {past.map((event) => (
                  <VaultTicketCard
                    key={event._id}
                    event={event}
                    isDuplicating={duplicatingId === event._id}
                    onEdit={() => handleEdit(event)}
                    onDuplicate={() => handleDuplicate(event)}
                    onDelete={() => handleDelete(event)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {isEmpty && (
            <EmptyState
              title="No events found"
              subtitle={
                searchQuery
                  ? `No events match "${searchQuery}"`
                  : 'Create your first event to get started'
              }
              action={{ label: '+ Create Event', href: '/events/create' }}
            />
          )}
        </>
      )}
    </div>
  )
}
