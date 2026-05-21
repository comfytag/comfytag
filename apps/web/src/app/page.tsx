import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CategoryPillsBar } from '@/components/home/CategoryPillsBar'
import { EventFeedSection } from '@/components/home/EventFeedSection'
import { EditorPicksSection } from '@/components/home/EditorPicksSection'
import { TestimonialsSection } from '@/components/home/TestimonialsSection'
import type { Event, Category } from '@comfytag/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

async function fetchEvents(): Promise<Event[]> {
  try {
    const res = await fetch(`${API}/events`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const data: unknown = await res.json()
    if (Array.isArray(data)) return data as Event[]
    const obj = data as Record<string, unknown>
    return (Array.isArray(obj.events) ? obj.events : Array.isArray(obj.data) ? obj.data : []) as Event[]
  } catch {
    return []
  }
}

async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API}/categories`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data: unknown = await res.json()
    if (Array.isArray(data)) return data as Category[]
    const obj = data as Record<string, unknown>
    const list = (Array.isArray(obj.categories) ? obj.categories : Array.isArray(obj.data) ? obj.data : []) as Category[]
    return list.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
  } catch {
    return []
  }
}

async function fetchEditorPicks(): Promise<Event[]> {
  try {
    const res = await fetch(`${API}/events/pick/toppick`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data: unknown = await res.json()
    if (Array.isArray(data)) return data as Event[]
    const obj = data as Record<string, unknown>
    return (Array.isArray(obj.data) ? obj.data : Array.isArray(obj.events) ? obj.events : []) as Event[]
  } catch {
    return []
  }
}

interface TestimonialRaw {
  _id: string
  userName: string
  userImage?: string
  quote: string
  rating?: number
}

async function fetchTestimonials(): Promise<TestimonialRaw[]> {
  try {
    const res = await fetch(`${API}/testimonials`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data: unknown = await res.json()
    if (Array.isArray(data)) return data as TestimonialRaw[]
    const obj = data as Record<string, unknown>
    return (Array.isArray(obj.data) ? obj.data : []) as TestimonialRaw[]
  } catch {
    return []
  }
}

export default async function HomePage() {
  const [events, categories, editorPicks, testimonials] = await Promise.all([
    fetchEvents(),
    fetchCategories(),
    fetchEditorPicks(),
    fetchTestimonials(),
  ])

  return (
    <>
      <Navbar />
      <CategoryPillsBar categories={categories} />
      <EditorPicksSection events={editorPicks} />
      <main>
        <EventFeedSection initialEvents={events} />
      </main>
      <TestimonialsSection testimonials={testimonials} />
      <Footer />
    </>
  )
}
