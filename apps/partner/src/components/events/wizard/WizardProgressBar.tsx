'use client'

import React from 'react'

interface WizardProgressBarProps {
  currentStep: number
  totalSteps: number
  onStepClick: (step: 1 | 2 | 3 | 4 | 5) => void
}

const stepLabels = ['Basic', 'Cover', 'Tickets', 'Details', 'Review']

export function WizardProgressBar({ currentStep, totalSteps, onStepClick }: WizardProgressBarProps) {
  return (
    <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', maxWidth: '600px' }}>
      {stepLabels.map((label, idx) => {
        const num = idx + 1
        const isActive = num === currentStep
        const isComplete = num < currentStep
        return (
          <div
            key={num}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <button
              type="button"
              onClick={() => onStepClick(num as 1 | 2 | 3 | 4 | 5)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: 'none',
                cursor: num < currentStep ? 'pointer' : isActive ? 'default' : 'not-allowed',
                background: isActive
                  ? 'var(--color-brand)'
                  : isComplete
                    ? 'var(--color-success)'
                    : 'var(--color-surface)',
                color: isActive || isComplete ? '#fff' : 'var(--color-text)',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all var(--duration-fast) ease',
              }}
            >
              {isComplete ? '✓' : num}
            </button>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
