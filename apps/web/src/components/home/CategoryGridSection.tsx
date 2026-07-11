'use client'

import Image from 'next/image'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CategoryGridItem {
  label: string
  slug: string
  image: string
  count?: string
}

// ─── Hardcoded fallback ───────────────────────────────────────────────────────

const FALLBACK_CATEGORIES: CategoryGridItem[] = [
  {
    label: 'Nightlife',
    count: '38 Events',
    slug: 'nightlife',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
  },
  {
    label: 'Live Music',
    count: '52 Events',
    slug: 'music',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
  },
  {
    label: 'Comedy',
    count: '24 Events',
    slug: 'comedy',
    image: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800&q=80',
  },
  {
    label: 'Tech & Business',
    count: '17 Events',
    slug: 'tech',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
  },
]

// ─── Component ───────────────────────────────────────────────────────────────

export function CategoryGridSection({ categories }: { categories?: CategoryGridItem[] }) {
  const activeCategories =
    categories && categories.length > 0 ? categories : FALLBACK_CATEGORIES

  return (
    <section className="w-full py-16 md:py-24 bg-white px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-900 mb-10 md:mb-14">
          Explore by Vibe
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {activeCategories.map((cat) => (
            <Link key={cat.slug} href={`/events?category=${cat.slug}`}>
              <div className="relative group overflow-hidden rounded-2xl aspect-square md:aspect-4/3 cursor-pointer">
                <Image
                  src={cat.image}
                  alt={cat.label}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <h3 className="text-white text-xl md:text-2xl font-bold tracking-tight">
                    {cat.label}
                  </h3>
                  {cat.count && (
                    <p className="text-white/80 text-sm font-medium mt-1">{cat.count}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
