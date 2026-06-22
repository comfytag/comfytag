import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as { email?: string }
    const email = body.email?.trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ message: 'Email is required.' }, { status: 400 })
    }

    const res = await fetch(`${API_BASE}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = await res.json().catch(() => ({})) as { message?: string }

    return NextResponse.json(
      { message: data.message ?? (res.ok ? 'Verification email sent.' : 'Failed to resend.') },
      { status: res.ok ? 200 : res.status },
    )
  } catch {
    return NextResponse.json({ message: 'Internal error. Please try again.' }, { status: 500 })
  }
}
