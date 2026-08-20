'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, ScanFace, ArrowRight } from 'lucide-react';
import { SearchSuggestionsOverlay } from '@/components/ui/SearchSuggestionsOverlay';

interface HeroSectionProps {
  headline?: string
  subtitle?: string
  statAttendees?: string
  statEvents?: string
  statCities?: string
}

export function HeroSection({
  headline,
  subtitle,
  statAttendees,
}: HeroSectionProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(searchQuery.trim() ? '/events?q=' + encodeURIComponent(searchQuery.trim()) : '/events');
  };

  return (
    <section
      className="relative overflow-hidden flex items-center min-h-[560px] md:min-h-[760px]"
      style={{ background: 'radial-gradient(circle at 70% 30%, var(--color-brand-light) 0%, var(--color-bg) 60%)' }}
    >
      <div className="w-full max-w-7xl mx-auto px-4 md:px-10 py-16 md:py-0 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 items-center">

        {/* ── Left: copy + CTAs (desktop) / single column (mobile) ── */}
        <div className="md:col-span-6 z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-(--color-brand-alpha-8) text-brand font-bold text-xs uppercase tracking-wider mb-6">
            <ScanFace className="w-[18px] h-[18px]" aria-hidden="true" />
            Biometric Ticketing 2.0
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-(--color-text) leading-[1.1] mb-6">
            {headline ?? (
              <>
                Your face is<br />
                <span className="text-brand">your ticket</span>
              </>
            )}
          </h1>

          <p className="text-lg text-(--color-text-muted) mb-8 md:mb-10 max-w-lg">
            {subtitle ?? "The world's first seamless entry experience. No codes, no paper, no waiting. Just show up and enjoy the moment."}
          </p>

          {/* Search (matches mockup's inline nav search intent, surfaced here for mobile-first discovery) */}
          <form onSubmit={handleSearch} className="relative mb-8 md:hidden">
            <div className="flex items-center bg-(--color-surface) rounded-full border border-(--color-border) focus-within:border-brand transition-colors">
              <Search className="w-5 h-5 text-(--color-text-muted) ml-4 shrink-0" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search events…"
                className="flex-1 min-w-0 bg-transparent border-none outline-none px-3 py-3.5 text-sm text-(--color-text) placeholder:text-(--color-text-muted)"
              />
            </div>
            <SearchSuggestionsOverlay
              query={searchQuery}
              isOpen={searchFocused}
              onClose={() => { setSearchFocused(false); setSearchQuery(''); }}
            />
          </form>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand text-white rounded-xl font-bold hover:bg-brand-dark transition-colors"
            >
              Explore Events
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 bg-(--color-surface) border-2 border-brand/20 text-brand rounded-xl font-bold hover:bg-(--color-brand-alpha-4) transition-colors"
            >
              How it Works
            </Link>
          </div>
        </div>

        {/* ── Right: tilted image card + live-status badge (desktop only) ── */}
        <div className="hidden md:block md:col-span-6 relative h-full min-h-[420px]">
          <div className="relative bg-(--color-surface) border border-(--color-border) p-4 rounded-[2rem] rotate-3 hover:rotate-0 transition-transform duration-700">
            <div className="relative rounded-[1.5rem] w-full h-[480px] overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=1200&auto=format&fit=crop"
                alt="Attendees entering an event with face-scan entry"
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="absolute -bottom-6 -left-6 bg-(--color-surface) border border-(--color-border) p-6 rounded-2xl max-w-[200px]">
              <p className="text-xs font-bold text-brand mb-1">Live Status</p>
              <p className="text-lg font-bold text-(--color-text)">{statAttendees ?? '14K+'} Entered</p>
              <div className="flex mt-2 -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-(--color-surface) bg-zinc-300" aria-hidden="true" />
                <div className="w-8 h-8 rounded-full border-2 border-(--color-surface) bg-zinc-400" aria-hidden="true" />
                <div className="w-8 h-8 rounded-full border-2 border-(--color-surface) bg-zinc-500" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
