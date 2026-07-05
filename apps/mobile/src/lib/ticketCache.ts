import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Ticket } from '@comfytag/types'
import { STORAGE_KEYS } from '@comfytag/utils'

// ─── Constants ───────────────────────────────────────────────────────────────

const CACHE_KEY = STORAGE_KEYS.TICKETS
const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutes

// ─── Shape ───────────────────────────────────────────────────────────────────

export interface CachedTickets {
  tickets: Ticket[]
  cachedAt: number
  userId: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cacheKeyForUser(userId: string): string {
  return `${CACHE_KEY}:${userId}`
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Read cached tickets for a user.
 * Returns null if nothing is cached or if the read fails.
 */
export async function getCachedTickets(userId: string): Promise<CachedTickets | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKeyForUser(userId))
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      'tickets' in parsed &&
      'cachedAt' in parsed &&
      'userId' in parsed &&
      Array.isArray((parsed as CachedTickets).tickets)
    ) {
      return parsed as CachedTickets
    }
    return null
  } catch {
    return null
  }
}

/**
 * Write tickets to the cache for a given user.
 * Silently swallows write failures for offline graceful degradation.
 */
export async function setCachedTickets(userId: string, tickets: Ticket[]): Promise<void> {
  try {
    const payload: CachedTickets = {
      tickets,
      cachedAt: Date.now(),
      userId,
    }
    await AsyncStorage.setItem(cacheKeyForUser(userId), JSON.stringify(payload))
  } catch {
    // Swallow — offline write failures must not surface to caller
  }
}

/**
 * Remove the cache entry for a user (call on logout).
 */
export async function clearTicketCache(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(cacheKeyForUser(userId))
  } catch {
    // Swallow
  }
}

/**
 * Returns true if the cache timestamp is older than ttlMs (default 5 minutes).
 */
export function isCacheStale(cachedAt: number, ttlMs: number = DEFAULT_TTL_MS): boolean {
  return Date.now() - cachedAt > ttlMs
}
