export * from './constants'
export * from './auth'
export * from './geo'

// ─── Currency formatting ───────────────────────────────
export function formatNaira(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '₦0'
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

// ─── Date formatting ───────────────────────────────────
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-NG', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const TIME_ONLY_RE = /^(\d{1,2}):(\d{2})(\s?(AM|PM))?$/i

export function formatTime(timeString: string | null | undefined): string {
  if (!timeString) return ''
  const trimmed = timeString.trim()
  if (TIME_ONLY_RE.test(trimmed)) {
    const d = new Date(`1970-01-01 ${trimmed}`)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
  }
  const d = new Date(trimmed)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
}

export function isToday(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

export function isUpcoming(dateString: string | null | undefined): boolean {
  if (!dateString) return false
  return new Date(dateString) > new Date()
}

export function timeUntil(dateString: string): string {
  const diff = new Date(dateString).getTime() - Date.now()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `${days}d ${hours}h away`
  if (hours > 0) return `${hours}h away`
  return 'Starting soon'
}

// ─── String utilities ──────────────────────────────────
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

export function initials(name: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function maskIdentifier(identifier: string): string {
  const trimmed = identifier.trim()
  if (trimmed.startsWith('0') || trimmed.startsWith('+')) {
    if (trimmed.length <= 7) return trimmed
    return trimmed.slice(0, 3) + '***' + trimmed.slice(-4)
  }
  const atIndex = trimmed.indexOf('@')
  if (atIndex < 0) return trimmed
  const local = trimmed.slice(0, atIndex)
  const domain = trimmed.slice(atIndex + 1)
  const visibleLocal = local.slice(0, Math.min(2, local.length))
  return visibleLocal + '***@' + domain
}

// ─── Ticket charge / fee split calculator ───────────────
//
// Fee model: the buyer pays the entire fee — 4.5% of the order subtotal,
// always, plus ₦100 more if the subtotal is >= ₦2,500. No cap. The organizer
// pays nothing; they receive the full ticket price.
export interface TicketChargeBreakdown {
  subtotal: number
  buyerFee: number
  organizerFee: number
  totalCharge: number  // what the buyer actually pays via Paystack
  organizerNet: number // what the organizer receives at payout (subtotal - organizerFee)
}

export function calculateTicketCharge(
  tierPrice: number,
  quantity: number
): TicketChargeBreakdown {
  const subtotal = tierPrice * quantity
  if (subtotal === 0) {
    return { subtotal: 0, buyerFee: 0, organizerFee: 0, totalCharge: 0, organizerNet: 0 }
  }

  const flatFeeApplies = subtotal >= 2_500
  const buyerFee = Math.round(subtotal * 0.045) + (flatFeeApplies ? 100 : 0)
  const organizerFee = 0

  return {
    subtotal,
    buyerFee,
    organizerFee,
    totalCharge: subtotal + buyerFee,
    organizerNet: subtotal - organizerFee,
  }
}

// ─── Validation helpers ────────────────────────────────
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidNigerianPhone(phone: string): boolean {
  return /^(\+234|0)[789][01]\d{8}$/.test(phone)
}

// ─── Token storage keys ────────────────────────────────
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'comfytag_auth_token',
  USER: 'comfytag_user',
  APP_MODE: 'comfytag_app_mode',
  PUSH_TOKEN: 'comfytag_push_token',
  TICKETS: 'comfytag_tickets',
  EVENT_DRAFT: 'comfytag_event_draft',
} as const
