import { NextRequest, NextResponse } from 'next/server'
import Redis from 'ioredis'

// WF-2: Inline HTML escaper — no external dep needed for 5 substitutions
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface ContactPayload {
  name: string
  email: string
  subject: string
  message: string
}

// WF-4: Single Redis client — reused across requests within the same process
const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379')

export async function POST(request: NextRequest) {
  // WF-4: Fixed-window rate limit — 5 requests per IP per hour
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      '127.0.0.1'
    const key = `ratelimit:contact:${ip}`
    const count = await redis.incr(key)
    if (count === 1) {
      // First hit in the window — set the 1-hour expiry
      await redis.expire(key, 3600)
    }
    if (count > 5) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      )
    }
  } catch {
    // Redis unavailable — fail-open so the contact form still works
  }

  let body: Partial<ContactPayload>
  try {
    body = (await request.json()) as Partial<ContactPayload>
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, email, subject, message } = body

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // WF-1: Destination address from env — never hardcode PII in source
  const contactEmail = process.env.CONTACT_EMAIL
  if (!contactEmail) {
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ success: true })
    }
    return NextResponse.json(
      { error: 'Contact email not configured' },
      { status: 503 },
    )
  }

  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ success: true })
    }
    return NextResponse.json(
      { error: 'Email service not configured' },
      { status: 503 },
    )
  }

  // WF-2: Escape all user-supplied fields before HTML interpolation — prevents stored XSS
  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeSubject = escapeHtml(subject)
  const safeMessage = escapeHtml(message)

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@comfytag.ng',
        to: contactEmail,
        subject: `ComfyTag Contact: ${safeSubject}`,
        html: `
          <p><strong>From:</strong> ${safeName} (${safeEmail})</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <hr />
          <p style="white-space: pre-wrap;">${safeMessage}</p>
        `,
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
