import type { Event } from '@comfytag/types'

export type DateFilter = 'today' | 'week' | 'month' | null
export type PriceFilter = 'free' | null

export function applyEventFilters(
  events: Event[],
  dateFilter: DateFilter,
  priceFilter: PriceFilter
): Event[] {
  const now = new Date()
  let filtered = events

  if (dateFilter === 'today') {
    filtered = filtered.filter((e) => {
      const d = new Date(e.date)
      d.setHours(0, 0, 0, 0)
      const t = new Date(now)
      t.setHours(0, 0, 0, 0)
      return d.getTime() === t.getTime()
    })
  } else if (dateFilter === 'week') {
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    filtered = filtered.filter(
      (e) => new Date(e.date) <= weekEnd && new Date(e.date) >= now
    )
  } else if (dateFilter === 'month') {
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    filtered = filtered.filter((e) => {
      const d = new Date(e.date)
      return d >= now && d <= monthEnd
    })
  }

  if (priceFilter === 'free') {
    filtered = filtered.filter(
      (e) =>
        e.ticketType.length === 0 ||
        Math.min(...e.ticketType.map((t) => t.price)) === 0
    )
  }

  return filtered
}
