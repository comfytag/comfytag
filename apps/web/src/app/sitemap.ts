import type { MetadataRoute } from 'next'

const BASE = 'https://comfytag.com'
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002/api'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static public pages
  const static_pages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/events`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${BASE}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Dynamic: published events
  let event_pages: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API}/events?status=published&limit=500`, { next: { revalidate: 3600 } })
    const data = await res.json()
    event_pages = (data.data?.events ?? []).map((e: { slug: string; updatedAt: string }) => ({
      url: `${BASE}/events/${e.slug}`,
      lastModified: new Date(e.updatedAt),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }))
  } catch {
    /* silently skip if API unreachable at build time */
  }

  // Dynamic: categories
  let category_pages: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API}/categories`, { next: { revalidate: 86400 } })
    const data = await res.json()
    category_pages = (data.data ?? []).map((c: { slug: string }) => ({
      url: `${BASE}/category/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))
  } catch {
    /* skip */
  }

  // Dynamic: organizer profiles
  let organizer_pages: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API}/organizers?verified=true&limit=200`, { next: { revalidate: 86400 } })
    const data = await res.json()
    organizer_pages = (data.data ?? []).map((o: { slug: string; updatedAt: string }) => ({
      url: `${BASE}/organizer/${o.slug}`,
      lastModified: new Date(o.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch {
    /* skip */
  }

  return [...static_pages, ...event_pages, ...category_pages, ...organizer_pages]
}
