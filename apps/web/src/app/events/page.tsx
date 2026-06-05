import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { EventsBrowseClient } from './EventsBrowseClient'
import type { Event } from '@comfytag/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Events in Ilorin This Weekend | Buy Tickets — ComfyTag",
  description: 'Discover amazing events in Ilorin and across Nigeria. Music, comedy, tech, culture. Buy tickets instantly. Your face is your ticket entry.',
  alternates: { canonical: 'https://comfytag.com/events' },
  openGraph: {
    title: "Events in Ilorin This Weekend",
    description: "Find what's happening near you. Buy tickets in seconds on ComfyTag.",
    url: 'https://comfytag.com/events',
  },
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

async function fetchInitialEvents(): Promise<Event[]> {
  try {
    const res = await fetch(`${API}/events?limit=12&page=1`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const data = (await res.json()) as unknown
    if (Array.isArray(data)) return data as Event[]
    const obj = data as Record<string, unknown>
    return (Array.isArray(obj.data) ? obj.data : Array.isArray(obj.events) ? obj.events : []) as Event[]
  } catch { return [] }
}

async function fetchEventTypes(): Promise<string[]> {
  try {
    const res = await fetch(`${API}/filter/byType`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = (await res.json()) as unknown
    if (Array.isArray(data)) return data as string[]
    const obj = data as Record<string, unknown>
    return (Array.isArray(obj.data) ? obj.data : []) as string[]
  } catch { return [] }
}

async function fetchStates(): Promise<string[]> {
  try {
    const res = await fetch(`${API}/state/byState`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = (await res.json()) as unknown
    if (Array.isArray(data)) return data as string[]
    const obj = data as Record<string, unknown>
    return (Array.isArray(obj.data) ? obj.data : []) as string[]
  } catch { return [] }
}

export default async function EventsPage() {
  const [initialEvents, eventTypes, states] = await Promise.all([
    fetchInitialEvents(),
    fetchEventTypes(),
    fetchStates(),
  ])

  return (
    <>
      <Navbar />
      <EventsBrowseClient initialEvents={initialEvents} eventTypes={eventTypes} states={states} />
      <Footer />
    </>
  )
}
