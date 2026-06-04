'use client'

import { useState, useMemo } from 'react'
import { CategoryPillsBar } from '@/components/home/CategoryPillsBar'
import { EventFeedSection } from '@/components/home/EventFeedSection'
import { isUpcoming } from '@comfytag/utils'
import type { Event, Category } from '@comfytag/types'

interface HomeFeedClientProps {
  events: Event[]
  categories: Category[]
}

export function HomeFeedClient({ events, categories }: HomeFeedClientProps) {
  const [activeCategory, setActiveCategory] = useState('')

  const filtered = useMemo(() => {
    if (!activeCategory) return events
    const result = events.filter((e) => e.category.toLowerCase() === activeCategory.toLowerCase())
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[CategoryFilter] activeCategory="${activeCategory}" matched ${result.length}/${events.length} events`)
    }
    return result
  }, [events, activeCategory])

  const visibleCategories = useMemo(() => {
    return categories.filter((cat) => {
      const key = (cat.slug ?? cat.title).toLowerCase()
      return events.some(
        (e) => e.status === 'published' && isUpcoming(e.date) && e.category.toLowerCase() === key
      )
    })
  }, [events, categories])

  return (
    <>
      <CategoryPillsBar categories={visibleCategories} active={activeCategory} onSelect={setActiveCategory} />
      <EventFeedSection initialEvents={filtered} activeCategory={activeCategory} />
    </>
  )
}
