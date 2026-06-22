'use client'

interface MilestoneNode {
  label: string
  sublabel: string
  threshold: number
}

interface MilestoneTrackProps {
  ticketsSold: number
  totalCapacity?: number
}

export function MilestoneTrack({ ticketsSold, totalCapacity }: MilestoneTrackProps) {
  const sellout = Math.max(totalCapacity ?? 0, 501)

  const milestones: MilestoneNode[] = [
    { label: 'First Sale', sublabel: '1 ticket', threshold: 1 },
    { label: '100 Sold', sublabel: 'Momentum', threshold: 100 },
    { label: '500 Sold', sublabel: 'On fire', threshold: 500 },
    { label: 'Sellout', sublabel: `${sellout.toLocaleString('en-NG')} cap`, threshold: sellout },
  ]

  const maxThreshold = milestones[milestones.length - 1].threshold
  const progressPct = Math.min((ticketsSold / maxThreshold) * 100, 100)

  return (
    <div className="px-2">
      <div className="relative pt-4 pb-10">
        {/* Track background */}
        <div className="absolute top-[17px] left-[16px] right-[16px] h-0.5 bg-zinc-200 rounded-full" />

        {/* Track fill */}
        <div
          className="absolute top-[17px] left-[16px] h-0.5 bg-violet-600 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `calc(${progressPct}% * (100% - 32px) / 100)` }}
          aria-hidden="true"
        />

        {/* Nodes */}
        <div className="relative flex justify-between">
          {milestones.map((milestone, i) => {
            const completed = ticketsSold >= milestone.threshold
            const isNext =
              !completed &&
              (i === 0 || ticketsSold >= milestones[i - 1].threshold)

            return (
              <div key={milestone.label} className="flex flex-col items-center gap-2.5">
                {/* Node circle */}
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <div
                    className={[
                      'w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500',
                      completed
                        ? 'bg-amber-400 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                        : isNext
                        ? 'bg-white border-violet-500'
                        : 'bg-zinc-200 border-zinc-300',
                    ].join(' ')}
                  >
                    {completed && (
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#09090b"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {isNext && !completed && (
                      <span className="w-2 h-2 rounded-full bg-violet-500" aria-hidden="true" />
                    )}
                  </div>

                  {/* Ripple on active node */}
                  {isNext && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full border-2 border-violet-500 animate-ping opacity-40"
                    />
                  )}
                </div>

                {/* Label */}
                <div className="flex flex-col items-center text-center gap-0.5">
                  <span
                    className={[
                      'text-[11px] font-bold leading-none',
                      completed
                        ? 'text-amber-400'
                        : isNext
                        ? 'text-zinc-700'
                        : 'text-zinc-400',
                    ].join(' ')}
                  >
                    {milestone.label}
                  </span>
                  <span className="text-[10px] text-zinc-400 leading-none">
                    {milestone.sublabel}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
