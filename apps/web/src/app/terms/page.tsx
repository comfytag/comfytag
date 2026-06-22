import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BackLink } from '@/components/ui/BackLink'
import type { Metadata } from 'next'

const LAST_UPDATED = 'May 18, 2026'
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

interface LegalSection {
  heading: string
  body: string
}

interface LegalDocData {
  docType: string
  lastUpdated: string
  version?: string
  sections: LegalSection[]
}

async function fetchSupportEmail(): Promise<string> {
  try {
    const res = await fetch(`${API}/config/site`, { next: { revalidate: 3600 } })
    if (!res.ok) return 'support@comfytag.com'
    const json = (await res.json()) as { success: boolean; data: { supportEmail?: string } }
    return json.data?.supportEmail ?? 'support@comfytag.com'
  } catch {
    return 'support@comfytag.com'
  }
}

async function fetchLegalDocument(docType: 'terms' | 'privacy'): Promise<LegalDocData | null> {
  try {
    const res = await fetch(`${API}/cms/legal/${docType}`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const json = (await res.json()) as { success: boolean; data: LegalDocData | null }
    return json.data ?? null
  } catch {
    return null
  }
}

export const metadata: Metadata = {
  title: "Terms & Conditions | ComfyTag",
  description: "ComfyTag Terms & Conditions: Complete refund policy, platform rules, organizer guidelines, and attendee responsibilities detailed fully.",
  alternates: { canonical: 'https://comfytag.com/terms' },
  robots: { index: true, follow: false },
}

export default async function TermsPage() {
  const [supportEmail, legalDoc] = await Promise.all([
    fetchSupportEmail(),
    fetchLegalDocument('terms'),
  ])

  const displayDate = legalDoc?.lastUpdated ?? LAST_UPDATED
  const hasCmsSections = legalDoc && legalDoc.sections.length > 0

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
          Terms &amp; Conditions
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--color-text-muted)',
            margin: '0 0 40px',
          }}
        >
          Last updated: {displayDate}
        </p>

        {hasCmsSections ? (
          legalDoc.sections.map((sec) => (
            <Section key={sec.heading} title={sec.heading}>
              <p style={{ whiteSpace: 'pre-line' }}>{sec.body}</p>
            </Section>
          ))
        ) : (
          <>
            <Section title="1. Acceptance of Terms">
              <p>
                By accessing or using ComfyTag (the &quot;Platform&quot;) — including our website,
                mobile app, and any related services — you agree to be bound by these Terms
                &amp; Conditions. If you do not agree, please stop using the Platform
                immediately.
              </p>
              <p>
                We may update these terms from time to time. Continued use of the Platform
                after changes are posted constitutes acceptance of the updated terms.
              </p>
            </Section>

            <Section title="2. User Accounts">
              <ul>
                <li>
                  You must be at least <strong>18 years old</strong> to create an account
                  and purchase tickets.
                </li>
                <li>
                  You are responsible for keeping your account credentials confidential and
                  for all activity that occurs under your account.
                </li>
                <li>
                  Provide accurate, current, and complete information during registration.
                  Accounts with false information may be suspended.
                </li>
                <li>
                  Notify us immediately at{' '}
                  <a
                    href={`mailto:${supportEmail}`}
                    style={{ color: 'var(--color-brand)' }}
                  >
                    {supportEmail}
                  </a>{' '}
                  if you suspect unauthorised access to your account.
                </li>
              </ul>
            </Section>

            <Section title="3. Events &amp; Tickets">
              <ul>
                <li>
                  <strong>Refund policy</strong> — ticket refunds are governed by the
                  individual event organiser&apos;s policy, which is displayed on the event
                  page before purchase. ComfyTag does not guarantee refunds on behalf of
                  organisers.
                </li>
                <li>
                  <strong>Non-transferable by default</strong> — tickets are personal to
                  the purchaser unless the organiser enables ticket transfers.
                </li>
                <li>
                  <strong>Event changes</strong> — if an organiser cancels or postpones an
                  event, refund eligibility is determined by the organiser and Paystack&apos;s
                  dispute resolution process.
                </li>
                <li>
                  <strong>TOTP QR codes</strong> — your digital ticket refreshes its QR
                  code every 30 seconds. Do not screenshot the QR code, as it will expire.
                </li>
              </ul>
            </Section>

            <Section title="4. Hype Link Programme">
              <ul>
                <li>
                  Earn <strong>₦500</strong> for every friend you refer who signs up and
                  purchases their first ticket using your unique referral link.
                </li>
                <li>
                  Rewards are credited to your ComfyTag wallet and can be withdrawn to a
                  verified Nigerian bank account.
                </li>
                <li>
                  Self-referrals, fraudulent accounts, and bulk sign-up schemes will result
                  in forfeiture of all referral earnings and account suspension.
                </li>
                <li>
                  ComfyTag reserves the right to modify or discontinue the Hype Link
                  Programme at any time with reasonable notice.
                </li>
              </ul>
            </Section>

            <Section title="5. Prohibited Activity">
              <p>You agree not to:</p>
              <ul>
                <li>
                  Resell, transfer, or broker tickets outside the ComfyTag Platform without
                  organiser permission.
                </li>
                <li>
                  Scrape, crawl, or systematically extract data from the Platform via bots,
                  scripts, or automated tools.
                </li>
                <li>
                  Make fraudulent purchases, initiate false chargebacks, or impersonate
                  another person.
                </li>
                <li>
                  Attempt to bypass, reverse-engineer, or tamper with security features,
                  including the TOTP system or biometric check-in.
                </li>
                <li>
                  Use the Platform to distribute spam, malware, or any form of harassment.
                </li>
              </ul>
              <p>
                Violation of these rules will result in immediate account suspension and
                may be reported to law enforcement.
              </p>
            </Section>

            <Section title="6. Paystack Integration">
              <p>
                All payments on ComfyTag are processed by <strong>Paystack</strong>.
                Payment disputes and chargebacks are handled in accordance with{' '}
                <a
                  href="https://paystack.com/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--color-brand)' }}
                >
                  Paystack&apos;s Terms of Service
                </a>
                . By completing a purchase you also agree to Paystack&apos;s terms.
              </p>
            </Section>

            <Section title="7. Limitation of Liability">
              <p>
                To the maximum extent permitted by Nigerian law, ComfyTag shall not be
                liable for:
              </p>
              <ul>
                <li>
                  Events you missed due to travel delays, venue changes, or personal
                  circumstances.
                </li>
                <li>
                  Event cancellations, postponements, or quality issues caused by the
                  organiser.
                </li>
                <li>
                  Loss of data, device failure, or network issues affecting your ability to
                  display your ticket.
                </li>
                <li>
                  Indirect, incidental, or consequential damages arising from use of the
                  Platform.
                </li>
              </ul>
              <p>
                In any case, ComfyTag&apos;s total liability to you shall not exceed the
                amount you paid for the relevant ticket(s).
              </p>
            </Section>

            <Section title="8. Termination">
              <p>
                ComfyTag may suspend or permanently delete your account at its discretion
                if you:
              </p>
              <ul>
                <li>Violate any provision of these terms.</li>
                <li>Engage in fraudulent or abusive behaviour.</li>
                <li>Provide false information during registration or KYC.</li>
              </ul>
              <p>
                Upon termination, your right to use the Platform ceases immediately.
                Unused wallet balance will be refunded minus any outstanding fees within 14
                business days, except where fraud is suspected.
              </p>
            </Section>

            <Section title="9. Governing Law">
              <p>
                These Terms &amp; Conditions are governed by and construed in accordance
                with the laws of the <strong>Federal Republic of Nigeria</strong>. Any
                dispute arising from or related to these terms shall be subject to the
                exclusive jurisdiction of the courts of Lagos State, Nigeria.
              </p>
            </Section>
          </>
        )}

        <p
          style={{
            marginTop: 48,
            fontSize: 13,
            color: 'var(--color-text-muted)',
            borderTop: '1px solid var(--color-border)',
            paddingTop: 24,
          }}
        >
          Last updated: {displayDate}
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
