// Re-export shared utilities for mobile use
export {
  formatNaira,
  formatDate,
  formatTime,
  isToday,
  isUpcoming,
  timeUntil,
  slugify,
  truncate,
  initials,
  maskIdentifier,
  calculateTicketCharge,
  isValidEmail,
  isValidNigerianPhone,
  STORAGE_KEYS,
} from '@comfytag/utils'

// ─── Mobile-specific helpers ───────────────────────────────────────────────────

/** Format a short event date: "Sat, 14 Jun" */
export function shortDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

/** Returns the first truthy image URL from an event's image arrays */
export function getEventImageUri(
  images: string[],
  coverImage?: string
): string | null {
  const uri = images[0] ?? coverImage
  return uri !== undefined && uri.length > 0 ? uri : null
}

/** Minimum ticket price for display */
export function getMinPrice(tiers: Array<{ price: number }>): number {
  if (tiers.length === 0) return 0
  return Math.min(...tiers.map((t) => t.price))
}

/** Minimum ticket price as formatted string */
export function formatMinPrice(tiers: Array<{ price: number }>): string {
  const min = getMinPrice(tiers)
  return min === 0 ? 'Free' : `₦${min.toLocaleString()}`
}

/** Sold-out ratio 0–1 */
export function soldRatio(sold: number, totalCapacity: number): number {
  if (totalCapacity === 0) return 0
  return Math.min(sold / totalCapacity, 1)
}

/** Whether a URL is a ComfyTag deep link */
export function isComfytagLink(url: string): boolean {
  return url.startsWith('comfytag://') || url.includes('comfytag.com')
}

/** Extract transfer reference from a deep link or URL */
export function extractTransferRef(url: string): string | null {
  const match = url.match(/\/claim-ticket\?ref=([^&]+)/)
  if (match) return decodeURIComponent(match[1])
  const match2 = url.match(/comfytag:\/\/claim\?ref=([^&]+)/)
  if (match2) return decodeURIComponent(match2[1])
  return null
}
