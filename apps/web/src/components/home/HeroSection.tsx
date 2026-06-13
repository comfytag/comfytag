import { Search } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="w-full px-4 md:px-8 pb-4 md:pb-4">
      {/* Main Immersive Container — mt clears the sticky nav */}
      <div className="relative w-full mt-6 lg:mt-10 rounded-[2.5rem] bg-zinc-950 min-h-[80svh] flex flex-col items-center justify-center text-center px-4 py-20 overflow-hidden shadow-2xl">

        {/* Background Image */}
        <img
          src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=2500&auto=format&fit=crop"
          alt="Concert Crowd"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-zinc-950/40 via-zinc-950/20 to-zinc-950/90 pointer-events-none" />

        {/* Content Wrapper */}
        <div className="relative z-10 flex flex-col items-center w-full mt-auto">

          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/20 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-violet-100 uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
            </span>
            Nigeria&apos;s #1 Biometric Ticketing
          </div>

          {/* Headline */}
          <h1 className="max-w-4xl text-5xl md:text-7xl font-extrabold tracking-tighter text-white leading-[1.1] mb-6">
            Your face is your{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-400 to-violet-200">
              ticket.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl text-lg md:text-xl text-zinc-300 mb-10 font-medium">
            No QR codes. No printouts. Just show up and walk in. <span className="inline-block ml-2 bg-white/10 text-zinc-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-white/20 align-middle tracking-widest">Face Ticketing Coming Soon</span>
          </p>

          {/* Search Bar */}
          <div className="w-full max-w-2xl bg-white p-2.5 rounded-2xl md:rounded-full flex flex-col md:flex-row items-center gap-3 shadow-xl">
            <div className="flex w-full items-center flex-1 pl-4 pr-2">
              <Search className="h-5 w-5 text-zinc-400 shrink-0" />
              <input
                type="text"
                placeholder="Search events in Lagos, Abuja..."
                className="flex-1 border-0 outline-none text-base bg-transparent text-zinc-900 placeholder:text-zinc-400 px-3 py-3"
              />
            </div>
            <button className="w-full md:w-auto shrink-0 rounded-xl md:rounded-full py-3.5 px-8 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-base cursor-pointer transition-colors whitespace-nowrap">
              Find Events
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 w-full max-w-3xl mt-16 pt-8 border-t border-white/10 grid grid-cols-3 gap-4 md:gap-8 divide-x divide-white/10">
          <div className="flex flex-col items-center">
            <span className="text-2xl md:text-4xl font-bold text-white tracking-tight">14K+</span>
            <span className="text-[10px] md:text-xs text-zinc-400 uppercase tracking-widest mt-1">Attendees</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl md:text-4xl font-bold text-white tracking-tight">200+</span>
            <span className="text-[10px] md:text-xs text-zinc-400 uppercase tracking-widest mt-1">Events</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl md:text-4xl font-bold text-white tracking-tight">3</span>
            <span className="text-[10px] md:text-xs text-zinc-400 uppercase tracking-widest mt-1">Cities</span>
          </div>
        </div>

      </div>
    </section>
  );
}
