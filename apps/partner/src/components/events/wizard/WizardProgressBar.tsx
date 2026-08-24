'use client'

interface WizardProgressBarProps {
  currentStep: number
  totalSteps: number
  onStepClick: (step: 1 | 2 | 3 | 4 | 5) => void
}

interface WizardStep {
  num: 1 | 2 | 3 | 4 | 5
  label: string
  rocket?: true
}

const STEPS: WizardStep[] = [
  { num: 1, label: 'Basics' },
  { num: 2, label: 'Media' },
  { num: 3, label: 'Tiers' },
  { num: 4, label: 'Details' },
  { num: 5, label: 'Launch', rocket: true },
]

export function WizardProgressBar({ currentStep, onStepClick }: WizardProgressBarProps) {
  return (
    <div className="flex items-start w-full mb-8">
      {STEPS.map((step, idx) => {
        const completed = step.num < currentStep
        const active = step.num === currentStep
        const canClick = completed

        return (
          <div key={step.num} className="flex items-start min-w-0" style={{ flex: idx < STEPS.length - 1 ? '1' : '0 0 auto' }}>
            {/* Node + label */}
            <div className="flex flex-col items-center shrink-0">
              <button
                type="button"
                onClick={() => canClick && onStepClick(step.num as 1 | 2 | 3 | 4 | 5)}
                aria-current={active ? 'step' : undefined}
                aria-label={`Step ${step.num}: ${step.label}`}
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
                  active
                    ? 'bg-violet-600 text-white ring-4 ring-violet-950/50 scale-110'
                    : completed
                      ? 'bg-violet-600 text-white cursor-pointer hover:bg-violet-700'
                      : 'bg-zinc-800 text-zinc-500 cursor-default',
                ].join(' ')}
              >
                {completed ? (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : step.rocket ? (
                  <span aria-hidden="true">🚀</span>
                ) : (
                  step.num
                )}
              </button>

              <span
                className={[
                  'text-[9px] font-bold tracking-widest uppercase mt-1.5 whitespace-nowrap',
                  active ? 'text-violet-400' : completed ? 'text-(--color-text)' : 'text-zinc-500',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting line — between nodes */}
            {idx < STEPS.length - 1 && (
              <div
                className={[
                  'flex-1 h-0.5 mt-4 mx-2 rounded-full transition-colors duration-300',
                  completed ? 'bg-violet-400' : 'bg-zinc-800',
                ].join(' ')}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
