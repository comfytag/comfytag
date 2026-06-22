// FomoStrip — single-line horizontal ticker with urgency signals.
// aria-hidden: auto-scrolling content is decorative/supplementary;
// screen readers don't need a live-scrolling strip.
// Pauses on hover so mouse users can read before it scrolls away.

export interface StripItem {
  text: string
  pulse?: boolean   // show live/urgency pulsing dot
  dotColor?: 'red' | 'violet'
}

const ITEMS: StripItem[] = [
  { text: 'LIVE: Afrobeats Night Lagos — 47 tickets left', pulse: true, dotColor: 'red' },
  { text: '2,400 tickets sold today' },
  { text: 'Comedy Hangout — TONIGHT', pulse: true, dotColor: 'violet' },
  { text: 'Sold Out: Club Elixir Saturday' },
  { text: 'New: Lagos Fashion Week listed' },
  { text: 'Ilorin Social Mixer — Selling Fast', pulse: true, dotColor: 'red' },
  { text: 'Face check-in live at Eko Hotel tonight' },
]

function Bullet() {
  return (
    <span className="mx-4 text-violet-300 text-sm leading-none select-none" aria-hidden>
      ·
    </span>
  )
}

function PulseDot({ color }: { color: 'red' | 'violet' }) {
  const ring = color === 'red' ? 'bg-red-400' : 'bg-violet-400'
  const dot  = color === 'red' ? 'bg-red-500' : 'bg-violet-500'
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${ring} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${dot}`} />
    </span>
  )
}

export function FomoStrip({ items }: { items?: StripItem[] }) {
  const activeItems = items && items.length > 0 ? items : ITEMS

  return (
    <div
      className="w-full overflow-hidden bg-violet-50/50 border-y border-violet-100 py-2.5 flex items-center select-none"
      aria-hidden="true"
    >
      <div className="group flex items-center w-full overflow-hidden">
        <div
          className="flex items-center shrink-0 whitespace-nowrap
                     animate-marquee group-hover:paused"
        >
          {[...activeItems, ...activeItems].map((item, i) => (
            <span key={i} className="inline-flex items-center">
              {item.pulse ? (
                <span className="flex items-center gap-2 text-sm font-medium text-violet-900 tracking-wide">
                  <PulseDot color={item.dotColor ?? 'violet'} />
                  {item.text}
                </span>
              ) : (
                <span className="text-sm font-medium text-violet-900 tracking-wide">
                  {item.text}
                </span>
              )}
              <Bullet />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
