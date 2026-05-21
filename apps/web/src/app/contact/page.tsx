import React from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import ContactForm from './ContactForm'

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
            Have a question or feedback? We&apos;d love to hear from you.
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
