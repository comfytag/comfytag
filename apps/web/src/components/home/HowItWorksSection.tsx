'use client'

import { isUpcoming } from '@comfytag/utils'

interface Step {
  title: string
  description: string
  icon: React.ReactNode
}

const steps: Step[] = [
  {
    title: 'Discover',
    description: 'Find events in your city by category, date, or name',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Buy',
    description: 'Secure checkout via Paystack or Stripe (your choice)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M2 9h20" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: 'Show Face',
    description: 'Skip the queue. Your face IS your ticket.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
        <path d="M19 12c0-3.866-3.134-7-7-7S5 8.134 5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M7 18c.5.667 2.5 2 5 2s4.5-1.333 5-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
]

export function HowItWorksSection() {
  return (
    <>
      <style>{`
        .__ct_how_section {
          padding: 64px 16px;
          background: var(--color-bg);
        }

        .__ct_how_wrapper {
          max-width: 1280px;
          margin: 0 auto;
        }

        .__ct_how_header {
          margin-bottom: 48px;
          text-align: center;
        }

        .__ct_how_eyebrow {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--color-brand);
          margin-bottom: 12px;
          display: block;
        }

        .__ct_how_h2 {
          font-size: 24px;
          font-weight: 700;
          color: var(--color-text);
          margin: 0;
          letter-spacing: -0.01em;
        }

        .__ct_how_grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 32px;
        }

        .__ct_how_card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;
        }

        .__ct_how_icon_badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: var(--color-brand-light);
          color: var(--color-brand-dark);
          flex-shrink: 0;
        }

        .__ct_how_title {
          font-size: 16px;
          font-weight: 700;
          color: var(--color-text);
          margin: 0;
          letter-spacing: -0.01em;
        }

        .__ct_how_description {
          font-size: 14px;
          color: var(--color-text-muted);
          margin: 0;
          line-height: 1.6;
        }

        /* Mobile: stacked on smaller screens */
        @media (max-width: 767px) {
          .__ct_how_section {
            padding: 48px 16px;
          }

          .__ct_how_header {
            margin-bottom: 36px;
          }

          .__ct_how_h2 {
            font-size: 20px;
          }

          .__ct_how_grid {
            gap: 24px;
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <section className="__ct_how_section" aria-label="How it works">
        <div className="__ct_how_wrapper">
          {/* Header */}
          <div className="__ct_how_header">
            <span className="__ct_how_eyebrow">How ComfyTag Works</span>
            <h2 className="__ct_how_h2">Biometric ticketing made simple</h2>
          </div>

          {/* 3-column grid */}
          <div className="__ct_how_grid">
            {steps.map((step, index) => (
              <div key={index} className="__ct_how_card">
                <div className="__ct_how_icon_badge">{step.icon}</div>
                <h3 className="__ct_how_title">{step.title}</h3>
                <p className="__ct_how_description">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
