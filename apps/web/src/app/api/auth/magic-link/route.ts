/**
 * POST /api/auth/magic-link
 *
 * Generates a 15-minute magic link and sends it to the provided email via Resend.
 *
 * DEPENDENCY REQUIRED — run from apps/web before this route will send real emails:
 *   pnpm add resend
 *
 * Also add to apps/web/.env.local:
 *   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

// In-memory token store: token → { email, expiresAt }
// For production, swap with Redis or a DB-backed token model.
const tokenStore = new Map<string, { email: string; expiresAt: number }>()

// Purge expired tokens on each request (lightweight cleanup)
function purgeExpired() {
  const now = Date.now()
  for (const [key, value] of tokenStore) {
    if (value.expiresAt < now) tokenStore.delete(key)
  }
}

export async function POST(req: NextRequest) {
  try {
    purgeExpired()

    const body = (await req.json()) as { email?: string }
    const email = body.email?.trim().toLowerCase()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { message: 'A valid email is required.' },
        { status: 400 },
      )
    }

    // Generate a cryptographically secure random token (32 bytes = 64 hex chars)
    const token = randomBytes(32).toString('hex')
    const expiresAt = Date.now() + 15 * 60 * 1000 // 15 minutes

    tokenStore.set(token, { email, expiresAt })

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const magicLink = `${appUrl}/verify-email?token=${token}`

    // ── Send email via Resend ──────────────────────────────────────────────────
    // Install: pnpm add resend  (from apps/web/)
    // Then uncomment the block below:
    //
    // import { Resend } from 'resend'
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'noreply@comfytag.ng',
    //   to: email,
    //   subject: 'Complete your ComfyTag sign-up',
    //   html: `
    //     <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
    //       <h2 style="color:#7C3AED">Verify your email</h2>
    //       <p>Click the button below to complete your ComfyTag sign-up. This link expires in 15 minutes.</p>
    //       <a href="${magicLink}"
    //          style="display:inline-block;padding:12px 24px;background:#7C3AED;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
    //         Verify Email
    //       </a>
    //       <p style="margin-top:24px;font-size:12px;color:#78716C">
    //         If you didn't request this, ignore this email.
    //       </p>
    //     </div>
    //   `,
    // })
    // ─────────────────────────────────────────────────────────────────────────

    // DEV fallback: log the link so you can test without Resend installed
    if (process.env.NODE_ENV !== 'production') {
      console.log('[magic-link] verification link:', magicLink)
    }

    return NextResponse.json(
      { success: true, message: 'Check your email for a verification link.' },
      { status: 200 },
    )
  } catch {
    return NextResponse.json(
      { message: 'Something went wrong. Please try again.' },
      { status: 500 },
    )
  }
}

/**
 * GET /api/auth/magic-link?token=xxx
 *
 * Called by the verify-email page server-side to validate a token.
 * Returns the associated email on success so the page can create a session.
 */
export async function GET(req: NextRequest) {
  try {
    purgeExpired()

    const token = req.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.json({ message: 'Token is required.' }, { status: 400 })
    }

    const entry = tokenStore.get(token)
    if (!entry) {
      return NextResponse.json(
        { message: 'This link has expired or is invalid.' },
        { status: 400 },
      )
    }

    if (entry.expiresAt < Date.now()) {
      tokenStore.delete(token)
      return NextResponse.json(
        { message: 'This link has expired. Please request a new one.' },
        { status: 400 },
      )
    }

    // Consume the token (one-time use)
    tokenStore.delete(token)

    return NextResponse.json({ success: true, email: entry.email }, { status: 200 })
  } catch {
    return NextResponse.json(
      { message: 'Something went wrong. Please try again.' },
      { status: 500 },
    )
  }
}
