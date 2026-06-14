'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { EventCard } from '@/components/ui'
import { LoadingSpinner, Skeleton } from '@comfytag/ui'
import { useSavedEvents } from '@/hooks/useProfile'

const PAGE_SIZE = 12

export default function SavedEventsClient() {
  const { data: session, status } = useSession()
  const { data: allEvents = [], isLoading, isError } = useSavedEvents()
  const [page, setPage] = useState(1)

  const events = allEvents.slice(0, page * PAGE_SIZE)
  const hasMore = page * PAGE_SIZE < allEvents.length
  const isLoadingMore = isLoading

  if (status === 'loading' || (isLoading && events.length === 0)) {
    return (
      <div className="w-full min-h-screen bg-zinc-50/30 pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-zinc-900">Saved Events</h1>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height="320px" borderRadius="24px" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="w-full min-h-screen bg-zinc-50/30 pt-28 pb-16 flex items-center justify-center">
        <p className="text-red-500 text-sm font-medium">Failed to load saved events. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-zinc-50/30 pt-28 pb-16">
      <div className="max-w-5xl mx-auto px-4 md:px-8">

        {/* Page header */}
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black text-zinc-900">Saved Events</h1>
          {allEvents.length > 0 && (
            <span className="px-2.5 py-0.5 bg-violet-100 text-violet-700 text-sm font-bold rounded-full">
              {allEvents.length}
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-500 mt-1">Events you've bookmarked for later</p>

        {events.length === 0 ? (
          <div className="mt-12 p-12 bg-white border-2 border-dashed border-zinc-200 rounded-3xl text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4 text-3xl select-none">
              🎟️
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">No saved events yet</h2>
            <p className="text-sm text-zinc-500 mb-6 max-w-xs">
              Start exploring and bookmark events you're excited about
            </p>
            <Link
              href="/events"
              className="px-6 py-3 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-zinc-700 transition-colors"
            >
              Discover Events
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8">
              {events.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  href={`/events/${event._id}`}
                />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isLoadingMore}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                >
                  {isLoadingMore ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
