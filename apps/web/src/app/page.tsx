import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/home/HeroSection'
import { StoryReel } from '@/components/home/StoryReel'
import { CategoryPillsBar } from '@/components/home/CategoryPillsBar'
import { FeaturedExperiencesSection } from '@/components/home/FeaturedExperiencesSection'
import { TrendingEventsSection } from '@/components/home/TrendingEventsSection'
import { NewsletterSection } from '@/components/home/NewsletterSection'
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

export default async function HomePage() {
  const [
    events,
    categories,
    editorPicks,
    siteConfig,
    faqs,
  ] = await Promise.all([
    fetchEvents(),
    fetchCategories(),
    fetchEditorPicks(),
    fetchSiteConfig(),
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
          mainEntity: (faqs.length > 0 ? faqs : FALLBACK_FAQS).map((faq: FaqItem) => ({
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
      <main>
        <StoryReel events={events} />
        <CategoryPillsBar categories={categories} />
        <FeaturedExperiencesSection events={editorPicks} />
        <TrendingEventsSection events={events} />
        <NewsletterSection />
      </main>
      <Footer />
    </>
  )
}
