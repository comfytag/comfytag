import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/home/HeroSection'
import { FomoStrip } from '@/components/home/FomoStrip'
import { HomeClientShell } from '@/components/home/HomeClientShell'
import { HomeFeedClient } from '@/components/home/HomeFeedClient'
import { EditorPicksSection } from '@/components/home/EditorPicksSection'
import { HowItWorksSection } from '@/components/home/HowItWorksSection'
import { CategoryGridSection } from '@/components/home/CategoryGridSection'
import { TestimonialsSection } from '@/components/home/TestimonialsSection'
import { JsonLd } from '@/components/seo/JsonLd'
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
  const defaultTestimonials: TestimonialNormalized[] = [
    {
      _id: '1',
      userName: 'Zainab',
      quote: 'Finally a ticket app that gets it. No stress, no QR codes, just my face. Love it.',
      rating: 5,
    },
    {
      _id: '2',
      userName: 'Tunde',
      quote: 'The checkout is so fast I thought it didn\'t work. But my ticket was there. Insane.',
      rating: 5,
    },
    {
      _id: '3',
      userName: 'Amara',
      quote: 'No more digging for my ticket at the door. I just show up and boom — I\'m in.',
      rating: 5,
    },
  ]

  try {
    const res = await fetch(`${API}/testimonials`, { next: { revalidate: 3600 } })
    if (!res.ok) return defaultTestimonials
    const data: unknown = await res.json()
    const raw = (Array.isArray(data) ? data : Array.isArray((data as Record<string, unknown>).data) ? (data as Record<string, unknown>).data : []) as TestimonialRaw[]
    const fetched = raw.map(normalizeTestimonial)
    return fetched.length > 0 ? fetched : defaultTestimonials
  } catch {
    return defaultTestimonials
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
      <JsonLd
        schema={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'ComfyTag',
          url: 'https://comfytag.com',
          logo: 'https://comfytag.com/logo.png',
          description: "Nigeria's first face-powered event ticketing platform",
          sameAs: [
            'https://twitter.com/comfytag',
            'https://instagram.com/comfytag',
          ],
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'NG',
            addressLocality: 'Ilorin',
          },
        }}
      />
      <JsonLd
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'ComfyTag',
          url: 'https://comfytag.com',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate:
                'https://comfytag.com/search?q={search_term_string}',
            },
            'query-input': 'required name=search_term_string',
          },
        }}
      />
      <JsonLd
        schema={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'How does ComfyTag work?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: "ComfyTag is Nigeria's face-powered event ticketing platform. You buy a ticket online, enroll your face once in the app, then show your face at the venue door — no QR code or printout needed.",
              },
            },
            {
              '@type': 'Question',
              name: 'How do I buy event tickets in Ilorin?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Browse events on ComfyTag, select your tickets, and pay securely with Paystack. Your ticket is stored in your account — just show your face at the gate.',
              },
            },
            {
              '@type': 'Question',
              name: 'Is ComfyTag available across Nigeria?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'ComfyTag launched in Ilorin and is expanding to Lagos, Abuja, and Port Harcourt. Any event organizer in Nigeria can list on ComfyTag.',
              },
            },
            {
              '@type': 'Question',
              name: 'Is my face data safe on ComfyTag?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. ComfyTag encrypts all face templates on your device. We never store raw biometric data on our servers. ComfyTag is fully compliant with Nigeria\'s NDPR.',
              },
            },
          ],
        }}
      />
      <HeroSection />
      <FomoStrip />
      <EditorPicksSection />
      <HowItWorksSection />
      <CategoryGridSection />
      {/* <HomeClientShell /> */}
      <main 
      // style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
      >
        <HomeFeedClient events={events} categories={categories} />
        <TestimonialsSection testimonials={testimonials} />
      </main>
      <Footer />
    </>
  )
}
