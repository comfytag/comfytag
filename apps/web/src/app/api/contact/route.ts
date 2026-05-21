import { NextRequest, NextResponse } from 'next/server'

interface ContactPayload {
  name: string
  email: string
  subject: string
  message: string
}

export async function POST(request: NextRequest) {
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

  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    // No email service configured — log and return success in dev
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ success: true })
    }
    return NextResponse.json(
      { error: 'Email service not configured' },
      { status: 503 },
    )
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@comfytag.ng',
        to: 'pixelgumstudio@gmail.com',
        subject: `ComfyTag Contact: ${subject}`,
        html: `
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr />
          <p style="white-space: pre-wrap;">${message}</p>
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
