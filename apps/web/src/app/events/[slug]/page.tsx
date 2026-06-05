import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { EventInteractiveSection } from '@/components/event/EventInteractiveSection'
import { EventLineup } from '@/components/event/EventLineup'
import { EventLocation } from '@/components/event/EventLocation'
import { EventMediaGallery } from '@/components/event/EventMediaGallery'
import { EventRelatedSection } from '@/components/event/EventRelatedSection'
import { Divider } from '@/components/events/EventIcons'
import { JsonLd } from '@/components/seo/JsonLd'
import type { Event as EventType } from '@comfytag/types'
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
  const [relatedEvents, { comments, hasMore }] = await Promise.all([
    getRelatedEvents(event.category, event._id),
    getInitialComments(event._id),
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
      <EventRelatedSection events={relatedEvents} />
    </EventInteractiveSection>
    </>
  )
}
