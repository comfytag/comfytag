import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { EventInteractiveSection } from '@/components/event/EventInteractiveSection'
import { EventLineup } from '@/components/event/EventLineup'
import { EventLocation } from '@/components/event/EventLocation'
import { EventMediaGallery } from '@/components/event/EventMediaGallery'
import { EventRelatedSection } from '@/components/event/EventRelatedSection'
import { OrganizerCard } from '@/components/ui/OrganizerCard'
import { Divider } from '@/components/events/EventIcons'
import { JsonLd } from '@/components/seo/JsonLd'
import type { Event as EventType, User } from '@comfytag/types'
import type { Comment } from '@/components/event/CommentSection'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

async function getEvent(slug: string): Promise<EventType | null> {
  let res: Response
  try {
    res = await fetch(`${API}/events/${slug}`, {
      next: { revalidate: 60 },
    })
  } catch {
    throw new Error('Unable to connect to event service. Please try again.')
  }
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Event service error (${res.status})`)
  const data = (await res.json()) as unknown
  const obj = data as Record<string, unknown>
  // Handle both direct Event and wrapped { success, data } shapes
  if (obj.success !== undefined && obj.data) return obj.data as EventType
  return data as EventType
}

async function getRelatedEvents(category: string, excludeId: string): Promise<EventType[]> {
  try {
    const res = await fetch(
      `${API}/events?category=${encodeURIComponent(category)}&status=published`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) return []
    const data = (await res.json()) as unknown
    const obj = data as Record<string, unknown>
    const list = (Array.isArray(data)
      ? data
      : Array.isArray(obj.data)
        ? obj.data
        : Array.isArray(obj.events)
          ? obj.events
          : []) as EventType[]
    return list
      .filter((e) => e._id !== excludeId && e.status === 'published')
      .slice(0, 4)
  } catch {
    return []
  }
}

async function getOrganizer(organizerId: string): Promise<User | null> {
  try {
    const res = await fetch(`${API}/users/${organizerId}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = (await res.json()) as unknown
    const obj = data as Record<string, unknown>
    if (obj.success !== undefined && obj.data) return obj.data as User
    return data as User
  } catch {
    return null
  }
}

async function getOrganizerStats(organizerId: string): Promise<{ followers: number; upcomingEvents: number } | null> {
  try {
    const res = await fetch(`${API}/users/${organizerId}/stats`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data = (await res.json()) as unknown
    const obj = data as Record<string, unknown>
    if (obj.success !== undefined && obj.data) {
      const statsData = obj.data as Record<string, unknown>
      return {
        followers: (statsData.followers as number) || 0,
        upcomingEvents: (statsData.upcomingEvents as number) || 0,
      }
    }
    return data as { followers: number; upcomingEvents: number }
  } catch {
    return null
  }
}

async function getInitialComments(eventId: string): Promise<{ comments: Comment[]; hasMore: boolean }> {
  try {
    const res = await fetch(
      `${API}/events/${eventId}/comments?page=1&limit=20`,
      { cache: 'no-store' }
    )
    if (!res.ok) return { comments: [], hasMore: false }
    const data = (await res.json()) as { comments: Comment[]; hasMore: boolean }
    return { comments: data.comments ?? [], hasMore: data.hasMore ?? false }
  } catch {
    return { comments: [], hasMore: false }
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const event = await getEvent(slug)
  if (!event) {
    return { title: 'Event Not Found' }
  }
  const coverImage = event.coverImage ?? event.images[0]
  return {
    title: event.name,
    description: event.description
      ? event.description.slice(0, 155)
      : `Buy tickets for ${event.name} on ComfyTag. ${event.venue}, ${event.state}. Your face is your ticket. Instant checkout via Paystack.`,
    alternates: { canonical: `https://comfytag.com/events/${slug}` },
    openGraph: {
      title: event.name,
      description: event.description?.slice(0, 160) ?? `Get tickets for ${event.name}`,
      images: coverImage
        ? [{ url: coverImage, width: 1200, height: 630, alt: event.name }]
        : [],
      type: 'website',
      url: `https://comfytag.com/events/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: event.name,
      description: event.description?.slice(0, 160) ?? `Get tickets for ${event.name}`,
      images: coverImage ? [coverImage] : [],
    },
  }
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = await getEvent(slug)

  if (!event) {
    notFound()
  }

  // Parallel fetch of secondary data
  const [relatedEvents, { comments, hasMore }, organizer, organizerStats] = await Promise.all([
    getRelatedEvents(event.category, event._id),
    getInitialComments(event._id),
    event.planner_id ? getOrganizer(event.planner_id) : Promise.resolve(null),
    event.planner_id ? getOrganizerStats(event.planner_id) : Promise.resolve(null),
  ])


  const lowestPrice = Math.min(...(event.ticketType ?? []).map((t: { price?: number }) => t.price ?? 0))

  return (
    <>
      <JsonLd
        schema={{
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: event.name,
          startDate: event.date,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: {
            '@type': 'Place',
            name: event.venue,
            address: {
              '@type': 'PostalAddress',
              addressLocality: event.state,
              addressCountry: 'NG',
            },
          },
          image: event.coverImage || (event.images && event.images[0]),
          description: event.description || `${event.name} event on ComfyTag`,
          offers: {
            '@type': 'Offer',
            url: `https://comfytag.com/events/${event.slug}`,
            priceCurrency: 'NGN',
            price: lowestPrice,
            availability: 'https://schema.org/InStock',
          },
        }}
      />
      <EventInteractiveSection
      event={event}
      relatedEvents={relatedEvents}
      initialComments={comments}
      initialHasMore={hasMore}
    >
      <EventLineup performers={event.performers ?? []} />
      <Divider />
      {event.description ? (
        <p
          style={{
            fontSize: '15px',
            color: 'var(--color-text)',
            lineHeight: 1.7,
            marginBottom: '24px',
            whiteSpace: 'pre-wrap',
          }}
        >
          {event.description}
        </p>
      ) : null}
      <EventMediaGallery event={event} />
      <EventLocation event={event} />

      {/* Organizer Profile */}
      {event.planner_id && (
        <>
          <Divider />
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px' }}>
              About the Organizer
            </h3>
            {organizer ? (
              <>
                <OrganizerCard
                  organizer={{
                    _id: organizer._id,
                    name: organizer.name,
                    image: organizer.avatar,
                    isPartner: organizer.isPartner || false,
                    isVerify: organizer.isVerify || { email: false, photo: false, idCard: false, address: false },
                  }}
                  followerCount={organizerStats?.followers ?? 0}
                  upcomingEventCount={organizerStats?.upcomingEvents ?? 0}
                />
                <div style={{ marginTop: '16px' }}>
                  <a
                    href={`/organizer/${organizer.username && !organizer.username.includes('@') ? organizer.username : organizer._id}`}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: 'var(--color-brand)',
                      color: 'var(--color-text-on-brand)',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      textDecoration: 'none',
                      transition: 'background-color var(--duration-fast)',
                    }}
                    className="organizer-profile-button"
                  >
                    View Profile
                  </a>
                </div>
              </>
            ) : (
              <div style={{ padding: '16px', background: 'var(--color-surface)', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Organizer profile</p>
                {organizerStats && (
                  <p style={{ color: 'var(--color-text)', margin: '8px 0 0', fontWeight: 600 }}>
                    {organizerStats.followers} followers • {organizerStats.upcomingEvents} upcoming events
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <EventRelatedSection events={relatedEvents} />
    </EventInteractiveSection>

    <style>{`
      .organizer-profile-button:hover {
        background-color: var(--color-brand-dark);
      }
    `}</style>
    </>
  )
}
