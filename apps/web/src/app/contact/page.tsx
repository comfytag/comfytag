import React from 'react'
import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: "Contact ComfyTag — Help, Support & Feedback",
  description: 'Contact ComfyTag for support, partnerships, or questions about events and tickets. Email, WhatsApp available. We\'re ready to help.',
  alternates: { canonical: 'https://comfytag.com/contact' },
}

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main
        style={{
          background: 'var(--color-bg-public)',
          minHeight: '100vh',
          padding: '64px 16px',
        }}
      >
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h1
            style={{
              fontSize: '36px',
              fontWeight: 800,
              color: 'var(--color-text)',
              textAlign: 'center',
              marginBottom: '8px',
            }}
          >
            Contact Us
          </h1>
          <p
            style={{
              color: 'var(--color-text-muted)',
              textAlign: 'center',
              fontSize: '16px',
              marginBottom: '48px',
            }}
          >
            We're here to help. Reach out however works best for you.
          </p>

          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
              padding: '32px',
              marginBottom: '48px',
            }}
          >
            <ContactForm />
          </div>

          {/* Contact info */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '24px',
              textAlign: 'center',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '32px',
                  marginBottom: '12px',
                  color: 'var(--color-brand)',
                }}
                aria-hidden="true"
              >
                ✉
              </div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  marginBottom: '8px',
                }}
              >
                Email
              </h3>
              <a
                href="mailto:pixelgumstudio@gmail.com"
                style={{
                  color: 'var(--color-text-muted)',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}
              >
                pixelgumstudio@gmail.com
              </a>
            </div>

            <div>
              <div
                style={{
                  fontSize: '32px',
                  marginBottom: '12px',
                  color: 'var(--color-brand)',
                }}
                aria-hidden="true"
              >
                ◉
              </div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  marginBottom: '8px',
                }}
              >
                Location
              </h3>
              <p
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: '14px',
                }}
              >
                Nigeria
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
