import { useCallback, useEffect, useRef, useState } from 'react'
import type { ActivityItem } from '@/components/dashboard/ActivityFeed'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INITIAL_RETRY_DELAY_MS = 1_000
const MAX_RETRY_DELAY_MS = 30_000

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseSSEResult<T> {
  data: T[]
  connected: boolean
  error: Error | null
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Connects to a Server-Sent Events endpoint and returns a stateful list of
 * parsed JSON messages.
 *
 * - Auto-reconnects with exponential backoff (1 s → 2 s → 4 s → … → 30 s)
 * - Only activates when `enabled` is true
 * - Cleans up the EventSource on unmount or when `enabled` turns false
 *
 * @template T  Shape of each parsed SSE message. Defaults to ActivityItem.
 */
export function useSSE<T = ActivityItem>(
  url: string,
  enabled = true,
): UseSSEResult<T> {
  const [data, setData] = useState<T[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Refs for values that must not trigger re-creation of the effect
  const retryDelayRef = useRef(INITIAL_RETRY_DELAY_MS)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const esRef = useRef<EventSource | null>(null)

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
  }, [])

  const closeEventSource = useCallback(() => {
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      closeEventSource()
      clearRetryTimer()
      setConnected(false)
      return
    }

    function connect() {
      closeEventSource()
      clearRetryTimer()

      const es = new EventSource(url)
      esRef.current = es

      es.addEventListener('open', () => {
        setConnected(true)
        setError(null)
        // Reset backoff on successful connection
        retryDelayRef.current = INITIAL_RETRY_DELAY_MS
      })

      es.addEventListener('message', (event: MessageEvent<string>) => {
        try {
          const parsed = JSON.parse(event.data) as T
          setData((prev) => [parsed, ...prev])
        } catch (parseErr) {
          // Malformed message — surface as non-fatal error but keep connection
          setError(
            parseErr instanceof Error
              ? parseErr
              : new Error('Failed to parse SSE message'),
          )
        }
      })

      es.addEventListener('error', () => {
        setConnected(false)
        closeEventSource()

        const delay = retryDelayRef.current
        retryDelayRef.current = Math.min(delay * 2, MAX_RETRY_DELAY_MS)

        setError(new Error(`SSE disconnected — retrying in ${delay / 1000}s`))

        retryTimerRef.current = setTimeout(() => {
          connect()
        }, delay)
      })
    }

    connect()

    return () => {
      closeEventSource()
      clearRetryTimer()
      setConnected(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled])

  return { data, connected, error }
}
