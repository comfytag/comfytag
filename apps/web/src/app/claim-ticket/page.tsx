'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LoadingSpinner } from '@comfytag/ui'
import { authHeader } from '@comfytag/utils'
import { Navbar } from '@/components/layout/Navbar'
import { api } from '@/lib/api'

type TicketPreview = {
  _id: string
  eventname: string
  type: string
  date: string
  status: string
  user_id: string
}

type FetchState = 'loading' | 'found' | 'not-found' | 'unavailable' | 'error'

function ClaimTicketContent() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')

  const [preview, setPreview] = useState<TicketPreview | null>(null)
  const [fetchState, setFetchState] = useState<FetchState>('loading')
  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)

  useEffect(() => {
    if (!ref) {
      setFetchState('not-found')
      return
    }
    api
      .get(`/audience/ref/${encodeURIComponent(ref)}`)
      .then((r) => {
        const data: TicketPreview = r.data
        setPreview(data)
        setFetchState(data.status === 'active' ? 'found' : 'unavailable')
      })
      .catch((err) => {
        if (err.response?.status === 404) setFetchState('not-found')
        else setFetchState('error')
      })
  }, [ref])

  async function handleClaim() {
    if (!session || !ref) return
    setClaiming(true)
    setClaimError(null)
    try {
      await api.post(
        '/tickets/transfer/claim',
        { reference: ref },
      )
      router.push('/tickets')
    } catch (err) {
      setClaimError(
        err instanceof Error ? err.message : 'Failed to claim ticket. Please try again.'
      )
      setClaiming(false)
    }
  }

  if (fetchState === 'loading' || authStatus === 'loading') {
    return <LoadingSpinner size="lg" centered />
  }

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 480, margin: '0 auto', padding: '40px 16px 80px' }}>
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 20,
            padding: '32px 24px',
            textAlign: 'center',
          }}
        >
          {fetchState === 'not-found' && (
            <>
              <div style={{ fontSize: 40, marginBottom: 16 }} aria-hidden="true">
                🎟
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px' }}>
                Ticket not found
              </h1>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>
                This link may have expired or already been claimed.
              </p>
            </>
          )}

          {fetchState === 'unavailable' && (
            <>
              <div style={{ fontSize: 40, marginBottom: 16 }} aria-hidden="true">
                🚫
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px' }}>
                Ticket unavailable
              </h1>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>
                This ticket has already been used or is no longer available.
              </p>
            </>
          )}

          {fetchState === 'error' && (
            <>
              <div style={{ fontSize: 40, marginBottom: 16 }} aria-hidden="true">
                ⚠️
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px' }}>
                Something went wrong
              </h1>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>
                Please try the link again or ask the sender to share it once more.
              </p>
            </>
          )}

          {fetchState === 'found' && preview && (
            <>
              <div style={{ fontSize: 40, marginBottom: 16 }} aria-hidden="true">
                🎟
              </div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  margin: '0 0 6px',
                }}
              >
                You've been sent a ticket
              </p>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px' }}>
                {preview.eventname}
              </h1>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: '0 0 28px' }}>
                {preview.type}
                {preview.date
                  ? ` · ${new Date(preview.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : ''}
              </p>

              {claimError && (
                <div
                  style={{
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontSize: 13,
                    color: 'var(--color-error, #ef4444)',
                    marginBottom: 16,
                  }}
                >
                  {claimError}
                </div>
              )}

              {!session ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      signIn(undefined, { callbackUrl: `/claim-ticket?ref=${ref}` })
                    }
                    style={{
                      width: '100%',
                      padding: '13px',
                      borderRadius: 10,
                      border: 'none',
                      background: 'var(--color-brand)',
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    Sign in to claim
                  </button>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 10 }}>
                    You need a ComfyTag account to receive this ticket.
                  </p>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleClaim}
                    disabled={claiming}
                    style={{
                      width: '100%',
                      padding: '13px',
                      borderRadius: 10,
                      border: 'none',
                      background: claiming ? 'var(--color-border)' : 'var(--color-brand)',
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#ffffff',
                      cursor: claiming ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {claiming ? 'Claiming…' : 'Claim Ticket'}
                  </button>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 10 }}>
                    This ticket will be removed from the sender's account.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </>
  )
}

export default function ClaimTicketPage() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" centered />}>
      <ClaimTicketContent />
    </Suspense>
  )
}
