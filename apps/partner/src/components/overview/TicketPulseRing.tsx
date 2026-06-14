'use client'

interface TicketPulseRingProps {
  count: number
  label?: string
}

export function TicketPulseRing({ count, label = 'Tickets Today' }: TicketPulseRingProps) {
  const hasActivity = count > 0

  return (
    <div className="flex flex-col items-center justify-center gap-5 h-full py-4">
      <div className="relative w-52 h-52">
        {/* Concentric SVG rings */}
        <svg
          viewBox="0 0 200 200"
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        >
          {/* Outer ring — slowest, background track */}
          <circle
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke="rgba(24,24,27,0.04)"
            strokeWidth="1"
            strokeDasharray="6 10"
            className={hasActivity ? 'animate-spin' : 'animate-pulse'}
            style={{
              transformOrigin: '100px 100px',
              animationDuration: hasActivity ? '28s' : '3.5s',
            }}
          />
          {/* Mid ring — medium speed, reverse, background track */}
          <circle
            cx="100"
            cy="100"
            r="74"
            fill="none"
            stroke="rgba(24,24,27,0.04)"
            strokeWidth="1.5"
            strokeDasharray="5 7"
            className={hasActivity ? 'animate-spin' : 'animate-pulse'}
            style={{
              transformOrigin: '100px 100px',
              animationDuration: hasActivity ? '16s' : '2.8s',
              animationDirection: hasActivity ? 'reverse' : 'normal',
            }}
          />
          {/* Inner ring — fastest, vibrant solid active accent */}
          <circle
            cx="100"
            cy="100"
            r="55"
            fill="none"
            stroke="rgba(124,58,237,0.65)"
            strokeWidth="2"
            strokeDasharray="8 5"
            className={hasActivity ? 'animate-spin' : 'animate-pulse'}
            style={{
              transformOrigin: '100px 100px',
              animationDuration: hasActivity ? '9s' : '2s',
            }}
          />
          {/* Core fill disc */}
          <circle
            cx="100"
            cy="100"
            r="38"
            fill="rgba(124,58,237,0.05)"
          />
          {/* Core rim accent */}
          <circle
            cx="100"
            cy="100"
            r="38"
            fill="none"
            stroke="rgba(124,58,237,0.30)"
            strokeWidth="1.5"
          />
        </svg>

        {/* Center count */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-4xl font-black text-zinc-900 leading-none tabular-nums tracking-tight">
            {count.toLocaleString('en-NG')}
          </span>
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
            {label}
          </span>
        </div>
      </div>

      {/* Status line */}
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={[
            'w-1.5 h-1.5 rounded-full',
            hasActivity ? 'bg-violet-500 animate-pulse' : 'bg-zinc-300',
          ].join(' ')}
        />
        <span className="text-xs text-zinc-500 font-medium">
          {hasActivity ? 'Active sales velocity' : 'Idle heartbeat'}
        </span>
      </div>
    </div>
  )
}
