import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('eventId') ?? ''
  const ref = searchParams.get('ref') ?? ''

  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'
  let eventName = 'ComfyTag Event'
  let coverImage: string | null = null

  try {
    const res = await fetch(`${API}/events/${eventId}`)
    if (res.ok) {
      const data = (await res.json()) as {
        name?: string
        coverImage?: string
        images?: string[]
      }
      eventName = data.name ?? eventName
      coverImage = data.coverImage ?? data.images?.[0] ?? null
    }
  } catch { /* silent */ }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: '#7C3AED',
          position: 'relative',
          alignItems: 'center',
          padding: '40px',
          gap: '32px',
        }}
      >
        {coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImage}
            width={160}
            height={160}
            style={{ borderRadius: 16, objectFit: 'cover', flexShrink: 0 }}
            alt=""
          />
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.3,
            }}
          >
            {eventName}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 8,
              padding: '8px 16px',
              width: 'fit-content',
            }}
          >
            <span style={{ fontSize: 24 }}>{'🎟️'}</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
              Just Got My Ticket!
            </span>
          </div>
          {ref && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              Ref: {ref}
            </div>
          )}
        </div>
      </div>
    ),
    { width: 800, height: 418 },
  )
}
