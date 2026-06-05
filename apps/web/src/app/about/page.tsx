import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: "About ComfyTag — Nigeria's Face-Powered Event Ticketing Platform",
  description: "ComfyTag is Nigeria's first face-powered event ticketing platform. Show your face for instant entry—no QR codes, pure frictionless experience.",
  alternates: { canonical: 'https://comfytag.com/about' },
  openGraph: {
    title: "About ComfyTag",
    description: "Nigeria's first face-powered event ticketing. Your face is your ticket.™",
    url: 'https://comfytag.com/about',
  },
}

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
              We believe events are about vibes, not logistics. ComfyTag removes the friction — no more fumbling for QR codes, no more checking bags at entry. Organizers get instant analytics. Attendees get a seamless, secure experience.
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
              Built for Nigerian Gen Z
            </h2>
            <p
              style={{
                fontSize: '16px',
                color: 'var(--color-text-muted)',
                lineHeight: 1.8,
              }}
            >
              We get it: you don't have time for nonsense. You want to buy event tickets in Ilorin, roll up to the venue, and get straight to the party. That's what we built. Nigeria-native, Gen Z-first, zero gatekeeping.
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
              Security & Privacy
            </h2>
            <p
              style={{
                fontSize: '16px',
                color: 'var(--color-text-muted)',
                lineHeight: 1.8,
              }}
            >
              Your biometric data is yours. We're fully NDPR-compliant. Face templates are encrypted on-device and never sent to servers. We don't sell, share, or log-crawl your data. Period.
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
              Join the Movement
            </h2>
            <p
              style={{
                fontSize: '15px',
                color: 'var(--color-text-muted)',
                marginBottom: '20px',
              }}
            >
              Thousands of attendees and organizers are already using ComfyTag. Join them. Browse events in your city right now and see what you're missing.
            </p>
            <Link
              href="/events"
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
              Browse Events in Ilorin →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
