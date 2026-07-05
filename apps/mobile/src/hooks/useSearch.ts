import { useQuery } from '@tanstack/react-query'
import { get } from '../lib/api'
import { searchKeys, eventKeys } from './queryKeys'
import type { PaginatedResponse, Event } from '@comfytag/types'

// ─── Trending search terms ─────────────────────────────────────────────────────

export function useTrendingSearch() {
  return useQuery({
    queryKey: searchKeys.trending,
    queryFn: () =>
      get<{ trending?: string[] }>('/search/trending').then(
        (r) => r.data.trending ?? []
      ),
    staleTime: 300_000,
  })
}

// ─── Search events ─────────────────────────────────────────────────────────────

interface SearchFilters {
  category?: string
  state?: string
  page?: number
  limit?: number
}

export function useSearchEvents(query: string, filters: SearchFilters = {}) {
  const params = new URLSearchParams({ q: query })
  if (filters.category) params.set('category', filters.category)
  if (filters.state) params.set('state', filters.state)
  params.set('page', String(filters.page ?? 1))
  params.set('limit', String(filters.limit ?? 12))

  return useQuery({
    queryKey: searchKeys.results(query, filters),
    queryFn: () =>
      get<PaginatedResponse<Event>>(
        `/events?${params.toString()}`
      ).then((r) => r.data),
    staleTime: 60_000,
    enabled: query.trim().length > 0,
  })
}
