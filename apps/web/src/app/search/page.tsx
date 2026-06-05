import type { Metadata } from 'next'
import { SearchClient } from './SearchClient'
import type { Category } from '@comfytag/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

async function loadInitialData(): Promise<{ categories: Category[]; trending: string[] }> {
  try {
    const [catRes, trendRes] = await Promise.all([
      fetch(`${API}/categories`, { cache: 'force-cache' }),
      fetch(`${API}/search/trending`, { next: { revalidate: 3600 } }),
    ])
    const cats: unknown = catRes.ok ? await catRes.json() : []
    const trend: unknown = trendRes.ok ? await trendRes.json() : []
    const catList = (Array.isArray(cats)
      ? cats
      : (cats as Record<string, unknown>).data ?? []) as Category[]
    const trendList = (Array.isArray(trend)
      ? trend
      : (trend as Record<string, unknown>).data ?? []) as {
      name?: string
      keyword?: string
    }[]
    return {
      categories: catList
        .filter((c) => c.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .slice(0, 8),
      trending: trendList
        .slice(0, 6)
        .map((t) => t.name ?? t.keyword ?? '')
        .filter(Boolean),
    }
  } catch {
    return { categories: [], trending: [] }
  }
}

async function getSeasonalConfig() {
  try {
    const res = await fetch(`${API}/config/seasonal`, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    const data = await res.json()
    if (data && typeof data === 'object' && 'title' in data) {
      return data as { title: string; subtitle: string; cta: string; ctaHref: string }
    }
    return null
  } catch {
    return null
  }
}

export const metadata: Metadata = {
  title: 'Search Events, Artists & Organizers in Nigeria | ComfyTag',
  description:
    'Search events in Nigeria by category, date, vibe, or organizer on ComfyTag. Find your next big night. Your face is your ticket entry.',
  alternates: { canonical: 'https://comfytag.com/search' },
}

export default async function SearchPage() {
  const [{ categories, trending }, seasonal] = await Promise.all([
    loadInitialData(),
    getSeasonalConfig(),
  ])

  return (
    <>
      <h1 style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
        Search Events in Nigeria
      </h1>
      <SearchClient initialCategories={categories} initialTrending={trending} seasonal={seasonal} />
    </>
  )
}
