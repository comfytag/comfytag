export * from './constants'
export * from './auth'

// ─── Currency formatting ───────────────────────────────
export function formatNaira(amount: number): string {
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
    if (isNaN(d.getTime())) return trimmed
    return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
  }
  const d = new Date(trimmed)
  if (isNaN(d.getTime())) return trimmed
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

export function isUpcoming(dateString: string): boolean {
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
    .trim()
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

// ─── Platform fee calculator ───────────────────────────
export function calculatePlatformFee(
  amount: number,
  feePercent: number = 5
): number {
  if (amount === 0) return 0
  return Math.round(amount * (feePercent / 100))
}

export function calculatePaystackFee(amount: number): number {
  if (amount === 0) return 0
  const fee = amount * 0.015 + 100
  return Math.min(Math.round(fee), 2000)
}

export function totalCharges(amount: number): {
  platformFee: number
  paystackFee: number
  total: number
} {
  const platformFee = calculatePlatformFee(amount)
  const paystackFee = calculatePaystackFee(amount)
  return {
    platformFee,
    paystackFee,
    total: amount + platformFee + paystackFee,
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
} as const
