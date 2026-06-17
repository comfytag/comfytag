import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/home/HeroSection'
import { FomoStrip } from '@/components/home/FomoStrip'
import { HomeClientShell } from '@/components/home/HomeClientShell'
import { HomeFeedClient } from '@/components/home/HomeFeedClient'
import { EditorPicksSection } from '@/components/home/EditorPicksSection'
import { HowItWorksSection, type CmsStep } from '@/components/home/HowItWorksSection'
import { CategoryGridSection, type CategoryGridItem } from '@/components/home/CategoryGridSection'
import { TestimonialsSection } from '@/components/home/TestimonialsSection'
import { JsonLd } from '@/components/seo/JsonLd'
import type { Event, Category } from '@comfytag/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

// ─── Site config (hero copy + stats) ─────────────────────────────────────────

interface SiteConfigData {
  heroHeadline?: string
  heroSubtitle?: string
  statAttendees?: string
  statEvents?: string
  statCities?: string
}

async function fetchSiteConfig(): Promise<SiteConfigData> {
  try {
    const res = await fetch(`${API}/config/site`, { next: { revalidate: 3600 } })
    if (!res.ok) return {}
    const json = (await res.json()) as { success: boolean; data: SiteConfigData }
    return json.data ?? {}
  } catch {
    return {}
  }
}

// ─── Marquee items (FomoStrip) ────────────────────────────────────────────────

interface MarqueeStripItem {
  text: string
  pulse?: boolean
  dotColor?: 'red' | 'violet'
}

async function fetchMarqueeItems(): Promise<MarqueeStripItem[]> {
  try {
    const res = await fetch(`${API}/cms/marquee`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const json = (await res.json()) as { success: boolean; data: MarqueeStripItem[] }
    return Array.isArray(json.data) ? json.data : []
  } catch {
    return []
  }
}

// ─── How It Works steps ───────────────────────────────────────────────────────

async function fetchHowItWorksSteps(): Promise<CmsStep[]> {
  try {
    const res = await fetch(`${API}/cms/how-it-works`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const json = (await res.json()) as { success: boolean; data: CmsStep[] }
    return Array.isArray(json.data) ? json.data : []
  } catch {
    return []
  }
}

// ─── Featured categories (CategoryGridSection) ────────────────────────────────

async function fetchFeaturedCategories(): Promise<CategoryGridItem[]> {
  try {
    const res = await fetch(`${API}/categories?featured=true`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data: unknown = await res.json()
    const raw = (
      Array.isArray(data)
        ? data
        : Array.isArray((data as Record<string, unknown>).data)
          ? (data as Record<string, unknown>).data
          : []
    ) as Array<{ title?: string; slug?: string; image?: string }>
    return raw
      .map((c) => ({ label: c.title ?? '', slug: c.slug ?? '', image: c.image ?? '' }))
      .filter((c) => c.label && c.slug)
  } catch {
    return []
  }
}

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

// ─── FAQ items (FAQPage JSON-LD) ─────────────────────────────────────────────

interface FaqItem {
  question: string
  answer: string
}

const FALLBACK_FAQS: FaqItem[] = [
  {
    question: 'How does ComfyTag work?',
    answer:
      "ComfyTag is Nigeria's face-powered event ticketing platform. You buy a ticket online, enroll your face once in the app, then show your face at the venue door — no QR code or printout needed.",
  },
  {
    question: 'How do I buy event tickets in Ilorin?',
    answer:
      'Browse events on ComfyTag, select your tickets, and pay securely with Paystack. Your ticket is stored in your account — just show your face at the gate.',
  },
  {
    question: 'Is ComfyTag available across Nigeria?',
    answer:
      'ComfyTag launched in Ilorin and is expanding to Lagos, Abuja, and Port Harcourt. Any event organizer in Nigeria can list on ComfyTag.',
  },
  {
    question: 'Is my face data safe on ComfyTag?',
    answer:
      "Yes. ComfyTag encrypts all face templates on your device. We never store raw biometric data on our servers. ComfyTag is fully compliant with Nigeria's NDPR.",
  },
]

async function fetchFaqs(): Promise<FaqItem[]> {
  try {
    const res = await fetch(`${API}/cms/faqs`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const json = (await res.json()) as { success: boolean; data: FaqItem[] }
    return Array.isArray(json.data) ? json.data : []
  } catch {
    return []
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
  const [
    events,
    categories,
    editorPicks,
    testimonials,
    siteConfig,
    marqueeItems,
    howItWorksSteps,
    featuredCategories,
    faqs,
  ] = await Promise.all([
    fetchEvents(),
    fetchCategories(),
    fetchEditorPicks(),
    fetchTestimonials(),
    fetchSiteConfig(),
    fetchMarqueeItems(),
    fetchHowItWorksSteps(),
    fetchFeaturedCategories(),
    fetchFaqs(),
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
          mainEntity: (faqs.length > 0 ? faqs : FALLBACK_FAQS).map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        }}
      />
      <HeroSection
        headline={siteConfig.heroHeadline || undefined}
        subtitle={siteConfig.heroSubtitle || undefined}
        statAttendees={siteConfig.statAttendees || undefined}
        statEvents={siteConfig.statEvents || undefined}
        statCities={siteConfig.statCities || undefined}
      />
      <FomoStrip items={marqueeItems.length > 0 ? marqueeItems : undefined} />
      <EditorPicksSection events={editorPicks} />
      <HowItWorksSection steps={howItWorksSteps.length > 0 ? howItWorksSteps : undefined} />
      <CategoryGridSection categories={featuredCategories.length > 0 ? featuredCategories : undefined} />
      {/* <HomeClientShell /> */}
      <main>
        <HomeFeedClient events={events} categories={categories} />
        <TestimonialsSection testimonials={testimonials} />
      </main>
      <Footer />
    </>
  )
}
