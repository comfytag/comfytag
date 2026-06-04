'use client'

import { useState, useMemo } from 'react'
import { CategoryPillsBar } from '@/components/home/CategoryPillsBar'
import { EventFeedSection } from '@/components/home/EventFeedSection'
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

  return (
    <>
      <CategoryPillsBar categories={categories} active={activeCategory} onSelect={setActiveCategory} />
      <EventFeedSection initialEvents={filtered} activeCategory={activeCategory} />
    </>
  )
}
