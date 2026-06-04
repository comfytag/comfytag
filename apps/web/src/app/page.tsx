import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/home/HeroSection'
import { HomeClientShell } from '@/components/home/HomeClientShell'
import { HomeFeedClient } from '@/components/home/HomeFeedClient'
import { EditorPicksSection } from '@/components/home/EditorPicksSection'
import { HowItWorksSection } from '@/components/home/HowItWorksSection'
import { CategoryGridSection } from '@/components/home/CategoryGridSection'
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
    const res = await fetch(`${API}/events/pick/toppick`, { next: { revalidate: 3600 } })
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
  name?: string
  userName?: string
  userImage?: string
  text?: string
  quote?: string
  rating?: number
}

interface TestimonialNormalized {
  _id: string
  userName: string
  userImage?: string
  quote: string
  rating?: number
}

function normalizeTestimonial(t: TestimonialRaw): TestimonialNormalized {
  return {
    _id: t._id,
    userName: t.userName ?? t.name ?? '',
    userImage: t.userImage,
    quote: t.quote ?? t.text ?? '',
    rating: t.rating,
  }
}

async function fetchTestimonials(): Promise<TestimonialNormalized[]> {
  try {
    const res = await fetch(`${API}/testimonials`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data: unknown = await res.json()
    const raw = (Array.isArray(data) ? data : Array.isArray((data as Record<string, unknown>).data) ? (data as Record<string, unknown>).data : []) as TestimonialRaw[]
    return raw.map(normalizeTestimonial)
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
      <HeroSection />
      <EditorPicksSection events={editorPicks} />
      <HowItWorksSection />
      <CategoryGridSection />
      <HomeClientShell />
      <main style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <HomeFeedClient events={events} categories={categories} />
        <TestimonialsSection testimonials={testimonials} />
      </main>
      <Footer />
    </>
  )
}
