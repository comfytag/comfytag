'use client'

import React from 'react'
import { AvatarInitials } from '@comfytag/ui'

interface Testimonial {
  _id: string
  userName: string
  userImage?: string
  quote: string
  rating?: number
  dateAttended?: string
}

interface TestimonialsSectionProps {
  testimonials: Testimonial[]
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  if (!testimonials || testimonials.length === 0) return null

  return (
    <section
      style={{
        background: 'var(--color-bg)',
        padding: '80px 16px',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: 'var(--color-text)',
              marginBottom: '12px',
              letterSpacing: '-0.01em',
            }}
          >
            What People Say
          </h2>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '16px',
              lineHeight: 1.6,
            }}
          >
            Join thousands of happy attendees and organizers using ComfyTag.
          </p>
        </div>

        {/* Testimonial cards — scrollable on mobile, grid on desktop */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px',
          }}
        >
          {testimonials.map((testimonial) => (
            <div
              key={testimonial._id}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                transition: 'transform 200ms ease, box-shadow 200ms ease',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement
                el.style.transform = 'translateY(-4px)'
                el.style.boxShadow = 'var(--shadow-md)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement
                el.style.transform = 'translateY(0)'
                el.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              {/* Star rating */}
              {typeof testimonial.rating === 'number' && testimonial.rating > 0 && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '18px',
                        color: i < testimonial.rating! ? 'var(--color-energy)' : 'var(--color-border)',
                      }}
                      aria-hidden="true"
                    >
                      ★
                    </span>
                  ))}
                </div>
              )}

              {/* Quote */}
              <p
                style={{
                  fontSize: '15px',
                  color: 'var(--color-text)',
                  lineHeight: 1.7,
                  fontStyle: 'italic',
                  flex: 1,
                  margin: '0',
                }}
              >
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* User info + date attended */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
                <AvatarInitials name={testimonial.userName} src={testimonial.userImage} size={40} />
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      margin: '0',
                    }}
                  >
                    {testimonial.userName}
                  </p>
                  {testimonial.dateAttended && (
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--color-text-muted)',
                        margin: '2px 0 0',
                      }}
                    >
                      Attended: {new Date(testimonial.dateAttended).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
