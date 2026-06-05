'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, AlertCircle, AlertTriangle, Scan } from 'lucide-react'
import { api } from '@/lib/api'

interface ScanResult {
  status: 'success' | 'already' | 'error'
  attendeeName?: string
  ticketType?: string
  numOfTicket?: number
  checkedInAt?: string
  message?: string
  reference: string
  timestamp: Date
}

interface CheckInByRefResponse {
  success: boolean
  alreadyCheckedIn?: boolean
  attendeeName?: string
  email?: string
  ticketType?: string
  numOfTicket?: number
  checkedInAt?: string
  message?: string
}

interface GateScannerPanelProps {
  eventId: string
}

const MAX_RECENT = 10

function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

export function GateScannerPanel({ eventId }: GateScannerPanelProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const token = session?.user?.token as string | undefined

  const [inputValue, setInputValue] = useState('')
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const [recentScans, setRecentScans] = useState<ScanResult[]>([])
  const [isPending, setIsPending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const refocusInput = useCallback(() => {
    setTimeout(() => {
      inputRef.current?.focus()
    }, 300)
  }, [])

  const clearResultAfterDelay = useCallback(() => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
    clearTimerRef.current = setTimeout(() => {
      setLastResult(null)
      refocusInput()
    }, 8000)
  }, [refocusInput])

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
    }
  }, [])

  const handleScan = useCallback(async (rawValue: string) => {
    const reference = rawValue.trim().toUpperCase()
    if (!reference) return

    setIsPending(true)
    setInputValue('')

    let result: ScanResult

    try {
      const res = await api.post<CheckInByRefResponse>(
        '/audience/checkin-by-ref',
        { reference }
      )
      const body = res.data

      if (body.success) {
        result = {
          status: 'success',
          attendeeName: body.attendeeName,
          ticketType: body.ticketType,
          numOfTicket: body.numOfTicket,
          checkedInAt: body.checkedInAt,
          reference,
          timestamp: new Date(),
        }
        // Invalidate attendees + stats so both panels refresh
        queryClient.invalidateQueries({ queryKey: ['gateAttendees', eventId] })
        queryClient.invalidateQueries({ queryKey: ['checkInStats', eventId] })
      } else if (body.alreadyCheckedIn) {
        result = {
          status: 'already',
          attendeeName: body.attendeeName,
          ticketType: body.ticketType,
          checkedInAt: body.checkedInAt,
          reference,
          timestamp: new Date(),
        }
      } else {
        result = {
          status: 'error',
          message: body.message ?? 'Check-in failed',
          reference,
          timestamp: new Date(),
        }
      }
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data
          ? String((err.response.data as { message: string }).message)
          : 'Ticket not found or invalid reference'

      result = {
        status: 'error',
        message,
        reference,
        timestamp: new Date(),
      }
    } finally {
      setIsPending(false)
    }

    setLastResult(result)
    setRecentScans((prev) => [result, ...prev].slice(0, MAX_RECENT))
    clearResultAfterDelay()
    refocusInput()
  }, [token, eventId, queryClient, clearResultAfterDelay, refocusInput])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleScan(inputValue)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleScan(inputValue)
  }

  // Last result card colors
  const resultColors: Record<ScanResult['status'], { bg: string; border: string; icon: React.ReactNode; label: string }> = {
    success: {
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'var(--color-success)',
      icon: <CheckCircle2 size={28} color="var(--color-success)" />,
      label: 'Checked In',
    },
    already: {
      bg: 'rgba(245, 158, 11, 0.12)',
      border: '#F59E0B',
      icon: <AlertTriangle size={28} color="#F59E0B" />,
      label: 'Already Checked In',
    },
    error: {
      bg: 'rgba(239, 68, 68, 0.12)',
      border: 'var(--color-error)',
      icon: <AlertCircle size={28} color="var(--color-error)" />,
      label: 'Not Found',
    },
  }

  const statusDot: Record<ScanResult['status'], string> = {
    success: 'var(--color-success)',
    already: '#F59E0B',
    error: 'var(--color-error)',
  }

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* Left: Scanner input + result card */}
      <div style={{ flex: '1 1 360px', minWidth: 0 }}>
        {/* Input panel */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '28px 24px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Scan size={20} color="var(--color-brand)" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
              Scan or Enter Reference
            </h3>
          </div>

          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Aim a barcode scanner at the ticket QR code, or type the reference manually and press Enter.
          </p>

          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="e.g. TKT-A1B2C3 or scan QRâ€¦"
              disabled={isPending}
              autoComplete="off"
              spellCheck={false}
              style={{
                width: '100%',
                fontSize: '22px',
                fontFamily: 'monospace',
                letterSpacing: '0.05em',
                padding: '14px 16px',
                borderRadius: '8px',
                border: '2px solid var(--color-border)',
                background: 'var(--color-surface-2, #111)',
                color: 'var(--color-text)',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-brand)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
            />

            <button
              type="submit"
              disabled={isPending || !inputValue.trim()}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                cursor: isPending || !inputValue.trim() ? 'not-allowed' : 'pointer',
                backgroundColor: isPending || !inputValue.trim() ? 'var(--color-border)' : 'var(--color-brand)',
                color: '#fff',
                transition: 'background-color 0.15s ease',
              }}
            >
              {isPending ? 'Checking inâ€¦' : 'Check In'}
            </button>
          </form>
        </div>

        {/* Last result card */}
        {lastResult && (
          <div
            style={{
              background: resultColors[lastResult.status].bg,
              border: `2px solid ${resultColors[lastResult.status].border}`,
              borderRadius: '12px',
              padding: '20px',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              {resultColors[lastResult.status].icon}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', color: resultColors[lastResult.status].border }}>
                  {resultColors[lastResult.status].label}
                </div>

                {lastResult.attendeeName && (
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '4px' }}>
                    {lastResult.attendeeName}
                  </div>
                )}

                {lastResult.ticketType && (
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '2px' }}>
                    {lastResult.ticketType}
                    {lastResult.numOfTicket != null && lastResult.numOfTicket > 1 && ` Ã— ${lastResult.numOfTicket}`}
                  </div>
                )}

                {lastResult.status === 'success' && lastResult.checkedInAt && (
                  <div style={{ fontSize: '13px', color: 'var(--color-success)', marginTop: '4px' }}>
                    Checked in at {formatTime(lastResult.checkedInAt)}
                  </div>
                )}

                {lastResult.status === 'already' && lastResult.checkedInAt && (
                  <div style={{ fontSize: '13px', color: '#F59E0B', marginTop: '4px' }}>
                    Originally checked in at {formatTime(lastResult.checkedInAt)}
                  </div>
                )}

                {lastResult.status === 'error' && lastResult.message && (
                  <div style={{ fontSize: '13px', color: 'var(--color-error)', marginTop: '4px' }}>
                    {lastResult.message}
                  </div>
                )}

                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '8px', fontFamily: 'monospace' }}>
                  REF: {lastResult.reference}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: Recent scans log */}
      <div
        style={{
          flex: '0 1 320px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
          Recent Scans ({recentScans.length})
        </h3>

        {recentScans.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px 0' }}>
            No scans yet. Start scanning tickets.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '480px', overflowY: 'auto' }}>
            {recentScans.map((scan, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-surface-2, #111)',
                  borderLeft: `3px solid ${statusDot[scan.status]}`,
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: statusDot[scan.status],
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {scan.attendeeName ?? scan.reference}
                  </div>
                  {scan.ticketType && (
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {scan.ticketType}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                  {formatTime(scan.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

