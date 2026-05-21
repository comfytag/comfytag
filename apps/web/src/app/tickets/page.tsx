'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import type { Ticket } from '@comfytag/types'
import { LoadingSpinner, EmptyState } from '@comfytag/ui'
import { authHeader, isUpcoming } from '@comfytag/utils'
import { Navbar } from '@/components/layout/Navbar'
import { TicketListItem } from '@/components/tickets/TicketListItem'
import { TabBar } from '@/components/ui/TabBar'
import api from '@/lib/api'

type Tab = 'upcoming' | 'past'

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function TicketsPage() {
  const { data: session, status } = useSession()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('upcoming')

  useEffect(() => {
    if (!session) return
    api
      .get(`/audience/user/${session.user.id}`, authHeader(session.user.token))
      .then((r) => setTickets(Array.isArray(r.data) ? r.data : (r.data?.data ?? [])))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [session])

  if (status === 'loading') {
    return <LoadingSpinner size="lg" centered />
  }

  if (!session) {
    return (
      <EmptyState
        title="Sign in to view your tickets"
        action={{ label: 'Log In', href: '/login' }}
      />
    )
  }

  const upcoming = tickets.filter((t) => t.status === 'active' && isUpcoming(t.date))
  const past = tickets.filter((t) => t.status !== 'active' || !isUpcoming(t.date))

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px 80px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>My Tickets</h1>

        <TabBar
          tabs={[
            { label: 'Upcoming', value: 'upcoming' },
            { label: 'Past', value: 'past' },
          ]}
          activeTab={activeTab}
          onChange={(value) => setActiveTab(value as Tab)}
          variant="pill"
        />

        {isLoading ? (
          <LoadingSpinner size="lg" centered />
        ) : activeTab === 'upcoming' ? (
          upcoming.length === 0 ? (
            <EmptyState
              title="No upcoming tickets"
              subtitle="Browse events and get your first ticket."
              action={{ label: 'Browse events', href: '/' }}
            />
          ) : (
            upcoming.map((t) => <TicketListItem key={t._id} ticket={t} />)
          )
        ) : past.length === 0 ? (
          <EmptyState
            title="No past events yet"
            subtitle="Your attended events will appear here."
          />
        ) : (
          past.map((t) => <TicketListItem key={t._id} ticket={t} isPast />)
        )}
      </main>
    </>
  )
}
