import { Ticket, ScanFace, CheckCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Step {
  icon: LucideIcon
  title: string
  description: string
  step: number
}

const STEPS: Step[] = [
  {
    icon: Ticket,
    title: 'Buy your ticket',
    description: 'Checkout in 60s. Pay securely via Paystack.',
    step: 1,
  },
  {
    icon: ScanFace,
    title: 'Enroll your face once',
    description: 'Takes 30 seconds in the app. Encrypted and NDPR compliant.',
    step: 2,
  },
  {
    icon: CheckCircle,
    title: 'Just show up',
    description: 'Your face is your pass. No phone, no QR codes. Walk straight in.',
    step: 3,
  },
]

export function HowItWorksSection() {
  return (
    <section
      className="w-full py-16 md:py-24 bg-zinc-950 relative overflow-hidden"
      aria-labelledby="how-it-works-heading"
    >
      {/* Violet ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <h2
            id="how-it-works-heading"
            className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4 text-center"
          >
            Biometric ticketing made simple.
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto text-center mb-16">
            Three steps stand between you and the best events in Nigeria — and one of them is just your face.
          </p>
        </div>

        {/* Step cards */}
        <div className="flex overflow-x-auto gap-4 pb-8 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:snap-none md:mx-0 md:px-0 md:pb-0">
          {STEPS.map((step) => {
            const Icon = step.icon
            return (
              <div
                key={step.title}
                className="relative overflow-hidden bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-800 flex flex-col hover:border-violet-500/50 transition-colors group shrink-0 w-[85vw] sm:w-85 snap-center md:w-auto md:shrink"
              >
                {/* Giant background step number */}
                <span className="absolute -bottom-8 -right-4 text-[12rem] font-black text-zinc-800/40 leading-none select-none group-hover:text-zinc-800/60 transition-colors">
                  {step.step}
                </span>

                {/* Glowing icon */}
                <div className="h-14 w-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-8 text-violet-400 relative z-10">
                  <Icon className="w-6 h-6" aria-hidden />
                </div>

                <h3 className="text-xl font-bold text-white mb-3 relative z-10">
                  {step.title}
                  {step.step === 2 && (
                    <span className="inline-flex items-center justify-center bg-violet-500/20 text-violet-300 text-[10px] tracking-widest uppercase font-bold px-2 py-0.5 rounded-full ml-3 border border-violet-500/30 align-middle">Coming Soon</span>
                  )}
                </h3>
                <p className="text-zinc-400 leading-relaxed relative z-10">
                  {step.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
