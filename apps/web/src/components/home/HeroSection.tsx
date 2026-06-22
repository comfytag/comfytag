'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
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
  statEvents,
  statCities,
}: HeroSectionProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push('/events?q=' + encodeURIComponent(searchQuery.trim()));
    } else {
      router.push('/events');
    }
  };

  return (
    <section className="w-full px-4 md:px-8 pb-4 md:pb-4">
      {/*
        overflow-hidden is intentionally REMOVED from this container.
        It was clipping the absolutely-positioned dropdown at the card boundary.
        The background layer below carries its own overflow-hidden + rounded corners
        so the visual shape is preserved.
      */}
      <div className="relative w-full mt-6 lg:mt-10 rounded-[2.5rem] bg-zinc-950 min-h-[80svh] flex flex-col items-center justify-center text-center px-4 py-20 shadow-2xl">

        {/* Background layer — isolated overflow-hidden so bg image clips to rounded corners */}
        <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=2500&auto=format&fit=crop"
            alt="Concert Crowd"
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-linear-to-b from-zinc-950/40 via-zinc-950/20 to-zinc-950/90" />
        </div>

        {/*
          Content wrapper elevated to z-20.
          Stats are z-10 and come later in DOM — they would normally win by paint order.
          z-20 here ensures this entire stacking context outranks them.
        */}
        <div className="relative z-20 flex flex-col items-center w-full mt-auto">

          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/20 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-violet-100 uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
            </span>
            Nigeria&apos;s #1 Biometric Ticketing
          </div>

          {/* Headline — custom copy from CMS, or default with gradient accent */}
          <h1 className="max-w-4xl text-5xl md:text-7xl font-extrabold tracking-tighter text-white leading-[1.1] mb-6">
            {headline ?? (
              <>
                Your face is your{' '}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-400 to-violet-200">
                  ticket.
                </span>
              </>
            )}
          </h1>

          {/* Subtitle — custom copy from CMS, or default with badge */}
          <p className="max-w-2xl text-lg md:text-xl text-zinc-300 mb-10 font-medium">
            {subtitle ?? (
              <>
                No QR codes. No printouts. Just show up and walk in.{' '}
                <span className="inline-block ml-2 bg-white/10 text-zinc-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-white/20 align-middle tracking-widest">
                  Face Ticketing Coming Soon
                </span>
              </>
            )}
          </p>

          {/*
            Search wrapper at z-[120].
            Creates a new stacking context inside z-20 content wrapper so the
            dropdown (absolute, z-100 inside) clears every sibling within this context.
          */}
          <div className="relative z-[120] w-full max-w-3xl mx-auto">
            <form
              onSubmit={handleSearch}
              className="flex items-center bg-white rounded-full p-1.5 md:p-2 shadow-lg focus-within:ring-4 focus-within:ring-violet-500/30 transition-all"
            >
              <div className="flex items-center flex-1 min-w-0 pl-3 md:pl-4 pr-2">
                <Search className="h-5 w-5 text-zinc-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search events in Lagos, Abuja..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  spellCheck={false}
                  className="flex-1 min-w-0 w-full bg-transparent border-none outline-none! focus:outline-none! focus:ring-0! text-zinc-900 placeholder:text-zinc-400 px-2 md:px-4 py-2 md:py-3 text-sm md:text-base truncate"
                />
              </div>
              <button
                type="submit"
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-4 md:px-8 py-2.5 md:py-3 text-sm md:text-base font-semibold transition-colors shrink-0"
              >
                Find Events
              </button>
            </form>

            <SearchSuggestionsOverlay
              query={searchQuery}
              isOpen={searchFocused}
              onClose={() => {
                setSearchFocused(false);
                setSearchQuery('');
              }}
            />
          </div>
        </div>

        {/* Stats — z-10 keeps them visible above the bg layer but below the search module (z-20) */}
        <div className="relative z-10 w-full max-w-3xl mt-16 pt-8 border-t border-white/10 grid grid-cols-3 gap-4 md:gap-8 divide-x divide-white/10">
          <div className="flex flex-col items-center">
            <span className="text-2xl md:text-4xl font-bold text-white tracking-tight">{statAttendees ?? '14K+'}</span>
            <span className="text-[10px] md:text-xs text-zinc-400 uppercase tracking-widest mt-1">Attendees</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl md:text-4xl font-bold text-white tracking-tight">{statEvents ?? '200+'}</span>
            <span className="text-[10px] md:text-xs text-zinc-400 uppercase tracking-widest mt-1">Events</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl md:text-4xl font-bold text-white tracking-tight">{statCities ?? '3'}</span>
            <span className="text-[10px] md:text-xs text-zinc-400 uppercase tracking-widest mt-1">Cities</span>
          </div>
        </div>

      </div>
    </section>
  );
}
