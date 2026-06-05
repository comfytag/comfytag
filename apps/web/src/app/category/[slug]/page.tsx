import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { CategoryClient } from './CategoryClient'
import { JsonLd } from '@/components/seo/JsonLd'
import type { Event, Category } from '@comfytag/types'
import { isUpcoming } from '@comfytag/utils'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

async function getCategory(slug: string): Promise<Category | null> {
  try {
    const res = await fetch(`${API}/categories`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const data = await res.json()
    const catList = (Array.isArray(data) ? data : (data as Record<string, unknown>).data ?? []) as Category[]
    return catList.find((c) => c.slug === slug || c._id === slug) ?? null
  } catch {
    return null
  }
}

async function getCategoryEvents(slug: string, categoryId?: string): Promise<Event[]> {
  try {
    const res = await fetch(
      `${API}/events?category=${encodeURIComponent(slug)}&status=published`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    const evtList = (Array.isArray(data) ? data : (data as Record<string, unknown>).data ?? []) as Event[]
    return evtList.filter(
      (e) => e.status === 'published' && isUpcoming(e.date) && (e.category === slug || e.category === categoryId || e.category)
    )
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategory(slug)
  return {
    title: category
      ? `${category.title} Events in Nigeria | ComfyTag`
      : 'Events | ComfyTag',
    description: category
      ? `Discover ${category.title} events across Nigeria on ComfyTag. Buy tickets instantly. Your face is your ticket. No QR codes, zero stress.`
      : 'Browse events across Nigeria on ComfyTag.',
    alternates: { canonical: `https://comfytag.com/category/${slug}` },
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const category = await getCategory(slug)

  if (!category) {
    notFound()
  }

  const events = await getCategoryEvents(slug, category._id)

  const itemListElements = events.slice(0, 12).map((event, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `https://comfytag.com/events/${event.slug || event._id}`,
    name: event.name,
  }))

  return (
    <>
      {itemListElements.length > 0 && (
        <JsonLd
          schema={{
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: `${category.title} Events in Nigeria`,
            itemListElement: itemListElements,
          }}
        />
      )}
      <CategoryClient category={category} initialEvents={events} />
    </>
  )
}
