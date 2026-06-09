'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

const TICKETS_PAGE_STYLES = `
  .__ct_tickets_heading {
    font-size: 24px;
    font-weight: 800;
    color: var(--color-text);
  }

  .__ct_tickets_wrap {
    max-width: 640px;
    margin: 0 auto;
    padding: 32px 24px 80px;
  }
`
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import type { Ticket, User } from '@comfytag/types'
import { LoadingSpinner, EmptyState } from '@comfytag/ui'
import { authHeader } from '@comfytag/utils'
import { api } from '@/lib/api'
import { Navbar } from '@/components/layout/Navbar'
import { TicketListItem } from '@/components/tickets/TicketListItem'
import { FaceEnrollmentBanner } from '@/components/tickets/FaceEnrollmentBanner'
import { TabBar } from '@/components/ui/TabBar'
import { useMyTickets } from '@/hooks/useTickets'

type Tab = 'upcoming' | 'past'

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function TicketsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { data: tickets = [], isLoading } = useMyTickets()
  const [activeTab, setActiveTab] = useState<Tab>('upcoming')

  const { data: profileData } = useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: () => api.get(`/users/${session!.user.id}`).then(r => r.data?.data ?? r.data),
    enabled: !!session?.user?.id,
    staleTime: 60_000,
  })

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

  // Categorize tickets by status only — the backend cron job transitions
  // expired tickets from 'active' to 'ended' each hour, so status is the
  // single source of truth for upcoming vs. past.
  const upcoming = tickets.filter((t) => t.status === 'active')
  const past = tickets.filter((t) => t.status !== 'active')

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
    faceEnrolled: profileData?.faceEnrolled ?? false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as User

  return (
    <>
      <style>{TICKETS_PAGE_STYLES}</style>
      <Navbar />
      <main className="__ct_tickets_wrap">
        <h1 className="__ct_tickets_heading" style={{ marginBottom: '24px' }}>My Tickets</h1>

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
