'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import type { Ticket, User } from '@comfytag/types'
import { LoadingSpinner, EmptyState } from '@comfytag/ui'
import { authHeader, isUpcoming } from '@comfytag/utils'
import { Navbar } from '@/components/layout/Navbar'
import { TicketListItem } from '@/components/tickets/TicketListItem'
import { FaceEnrollmentBanner } from '@/components/tickets/FaceEnrollmentBanner'
import { TabBar } from '@/components/ui/TabBar'
import api from '@/lib/api'

type Tab = 'upcoming' | 'past'

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function TicketsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
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

  // Adapter: build a User-compatible object for FaceEnrollmentBanner.
  // faceEnrolled is not stored in the JWT session, so we default to false —
  // the banner handles its own localStorage dismiss state internally.
  const bannerUser = {
    _id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    username: session.user.name,
    token: session.user.token,
    isPartner: session.user.isPartner,
    isAdmin: session.user.isAdmin,
    avatar: session.user.image,
    isVerify: { email: false, photo: false, idCard: false, address: false },
    onboarding: { completed: false },
    faceEnrolled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as User

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px 80px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>My Tickets</h1>

        {!bannerUser.faceEnrolled && (
          <FaceEnrollmentBanner
            user={bannerUser}
            onDismiss={() => {}}
            onSetup={() => router.push('/profile/face-enrollment')}
          />
        )}

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
