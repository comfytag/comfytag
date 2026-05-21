import React from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: 'var(--color-bg-public)' }}>

        {/* Hero */}
        <section
          style={{
            background:
              'linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-dark) 100%)',
            color: '#ffffff',
            padding: '64px 16px',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '16px', lineHeight: 1.2 }}>
              Your Face Is Your Ticket
            </h1>
            <p style={{ fontSize: '20px', opacity: 0.9, lineHeight: 1.6 }}>
              ComfyTag is revolutionising event ticketing in Nigeria with
              frictionless, face-powered entry.
            </p>
          </div>
        </section>

        {/* Content sections */}
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '64px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '48px',
          }}
        >

          {/* Mission */}
          <div>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--color-text)',
                marginBottom: '16px',
              }}
            >
              Our Mission
            </h2>
            <p
              style={{
                fontSize: '16px',
                color: 'var(--color-text-muted)',
                lineHeight: 1.8,
              }}
            >
              We believe events are about people, not logistics. ComfyTag removes
              friction from event check-in by letting attendees show their face
              instead of fumbling for QR codes. Organizers get real-time
              analytics. Attendees get a seamless, secure experience.
            </p>
          </div>

          {/* Nigerian-First */}
          <div>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--color-text)',
                marginBottom: '16px',
              }}
            >
              Built for Nigeria
            </h2>
            <p
              style={{
                fontSize: '16px',
                color: 'var(--color-text-muted)',
                lineHeight: 1.8,
              }}
            >
              ComfyTag is founded and built in Nigeria, for Nigerians. We
              integrate Paystack and Termii, support Nigerian bank transfers,
              honor Nigerian privacy law (NDPR), and design for Gen Z event
              culture in Lagos, Abuja, Port Harcourt, and beyond.
            </p>
          </div>

          {/* What We Do */}
          <div>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--color-text)',
                marginBottom: '20px',
              }}
            >
              What We Do
            </h2>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {[
                {
                  title: 'Biometric Check-In',
                  body: 'Enroll your face once, show it at any venue for instant entry — no QR code, no delays.',
                },
                {
                  title: 'Organizer Dashboard',
                  body: 'Real-time attendee tracking, revenue analytics, and full event management tools.',
                },
                {
                  title: 'Hype Link Referral',
                  body: 'Earn ₦500 for every friend who buys a ticket through your personal link.',
                },
                {
                  title: 'Secure Payments',
                  body: 'Paystack integration for safe transactions with instant settlements.',
                },
              ].map(({ title, body }) => (
                <li
                  key={title}
                  style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}
                >
                  <span
                    style={{
                      color: 'var(--color-brand)',
                      fontWeight: 700,
                      fontSize: '16px',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    ✓
                  </span>
                  <span style={{ fontSize: '16px', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                    <strong style={{ color: 'var(--color-text)' }}>{title}:</strong> {body}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Team */}
          <div>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--color-text)',
                marginBottom: '16px',
              }}
            >
              Our Team
            </h2>
            <p
              style={{
                fontSize: '16px',
                color: 'var(--color-text-muted)',
                lineHeight: 1.8,
              }}
            >
              ComfyTag is built by a passionate team of engineers, designers, and
              product leaders obsessed with making events frictionless. We are Gen
              Z and millennial technologists who grew up in Nigeria and understand
              what the market needs.
            </p>
          </div>

          {/* Contact CTA */}
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
              padding: '32px',
            }}
          >
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--color-text)',
                marginBottom: '12px',
              }}
            >
              Get In Touch
            </h2>
            <p
              style={{
                fontSize: '15px',
                color: 'var(--color-text-muted)',
                marginBottom: '20px',
              }}
            >
              Have questions or want to partner with us? We would love to hear
              from you.
            </p>
            <Link
              href="/contact"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: 'var(--color-brand)',
                color: '#ffffff',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '15px',
                textDecoration: 'none',
              }}
            >
              Contact Us
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
