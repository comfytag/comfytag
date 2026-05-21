import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BackLink } from '@/components/ui/BackLink'

const LAST_UPDATED = 'May 18, 2026'

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '32px 24px 80px',
        }}
      >
        <BackLink href="/" marginBottom={24}>
          Back to Home
        </BackLink>

        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: 'var(--color-brand)',
            margin: '0 0 8px',
            lineHeight: 1.2,
          }}
        >
          Privacy Policy
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--color-text-muted)',
            margin: '0 0 40px',
          }}
        >
          Last updated: {LAST_UPDATED}
        </p>

        <Section title="1. Data We Collect">
          <p>
            When you use ComfyTag, we collect information needed to provide our services:
          </p>
          <ul>
            <li>
              <strong>Account information</strong> — email address and phone number
              used to create and identify your account.
            </li>
            <li>
              <strong>Face biometric template</strong> — an encrypted mathematical
              representation of your face, generated on your device. We never store raw
              face images (see Face Data Protection below).
            </li>
            <li>
              <strong>Payment information</strong> — card details and bank account
              numbers, processed securely by Paystack. ComfyTag does not store raw card
              numbers.
            </li>
            <li>
              <strong>Event preferences</strong> — events you view, follow, or purchase
              tickets for, used to personalise your experience.
            </li>
            <li>
              <strong>Device and usage data</strong> — browser type, IP address, and
              in-app actions used for security and analytics.
            </li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Data">
          <ul>
            <li>
              <strong>Event ticketing</strong> — to issue, validate, and transfer
              tickets to events.
            </li>
            <li>
              <strong>Face check-in</strong> — to match your face template at venue
              gates so entry is frictionless and secure.
            </li>
            <li>
              <strong>Notifications</strong> — event reminders, ticket confirmations,
              and platform updates sent via push notification, email, or SMS.
            </li>
            <li>
              <strong>Platform improvement</strong> — aggregate, anonymised usage
              analytics that help us improve the app and discover new features.
            </li>
            <li>
              <strong>Legal compliance</strong> — fraud prevention, identity
              verification, and regulatory requirements under Nigerian law.
            </li>
          </ul>
        </Section>

        <Section title="3. Face Data Protection">
          <p>
            Your privacy is our highest priority when it comes to biometric data:
          </p>
          <ul>
            <li>
              We <strong>never</strong> store raw face photographs on our servers.
            </li>
            <li>
              Face templates are encrypted on your device before any data leaves it.
              The server receives only the encrypted template — never the underlying
              image.
            </li>
            <li>
              Encrypted templates are stored solely for the purpose of event check-in
              and are deleted when you close your account or withdraw consent.
            </li>
            <li>
              Face data is never sold, shared with third parties, or used for
              advertising.
            </li>
            <li>
              You may delete your biometric data at any time from Account Settings →
              Face ID.
            </li>
          </ul>
        </Section>

        <Section title="4. Paystack">
          <p>
            ComfyTag uses <strong>Paystack</strong> to process all ticket payments.
            When you pay for a ticket, your card and bank details are handled entirely
            by Paystack under their own{' '}
            <a
              href="https://paystack.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-brand)' }}
            >
              Privacy Policy
            </a>
            . ComfyTag only receives confirmation of a successful charge and the last
            four digits of your card for display purposes.
          </p>
        </Section>

        <Section title="5. Your Rights">
          <p>
            Under the Nigeria Data Protection Regulation (NDPR) and applicable law, you
            have the right to:
          </p>
          <ul>
            <li>
              <strong>Access</strong> — request a copy of all personal data we hold
              about you.
            </li>
            <li>
              <strong>Correction</strong> — ask us to correct inaccurate data.
            </li>
            <li>
              <strong>Deletion</strong> — request deletion of your account and all
              associated data, including biometric templates.
            </li>
            <li>
              <strong>Portability</strong> — receive your data in a machine-readable
              format.
            </li>
            <li>
              <strong>Withdraw consent</strong> — opt out of face recognition at any
              time; QR tickets remain available.
            </li>
          </ul>
          <p>
            To exercise any of these rights, contact us at the address below.
          </p>
        </Section>

        <Section title="6. Contact">
          <p>
            For privacy questions, data requests, or to report a concern, email us at{' '}
            <a
              href="mailto:pixelgumstudio@gmail.com"
              style={{ color: 'var(--color-brand)' }}
            >
              pixelgumstudio@gmail.com
            </a>
            . We aim to respond within 5 business days.
          </p>
        </Section>

        <p
          style={{
            marginTop: 48,
            fontSize: 13,
            color: 'var(--color-text-muted)',
            borderTop: '1px solid var(--color-border)',
            paddingTop: 24,
          }}
        >
          Last updated: {LAST_UPDATED}
        </p>
      </main>
      <Footer />
    </>
  )
}

// ─── Local section component ──────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--color-text)',
          margin: '0 0 12px',
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontSize: 15,
          color: 'var(--color-text-muted)',
          lineHeight: 1.7,
        }}
      >
        {children}
      </div>
    </section>
  )
}
