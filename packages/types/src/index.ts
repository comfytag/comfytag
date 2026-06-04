// ─── User & Auth ───────────────────────────────────────
export interface User {
  _id: string
  name: string
  username: string
  email: string
  phone?: string
  image?: string
  avatar?: string
  bgImg?: string
  isPartner: boolean
  isAdmin: boolean
  isVerify: {
    email?: boolean
    photo?: boolean
    idCard?: boolean
    address?: boolean
  }
  onboarding: {
    completed: boolean
  }
  faceEnrolled: boolean
  faceEnrolledAt?: string
  notificationPreferences?: {
    email: boolean
    sms: boolean
  }
  privacySettings?: {
    publicProfile: boolean
    showInSearch: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  token: string
}

// ─── Event ─────────────────────────────────────────────
export interface TicketTier {
  _id: string
  name: string
  price: number
  capacity: number
  sold: number
  saleStartDate?: string
  saleEndDate?: string
  description?: string
}

export interface Performer {
  name: string
  photo?: string
}

export interface Event {
  _id: string
  name: string
  slug: string
  planner_id: string
  planner: string
  category: string
  description?: string
  date: string
  startTime: string
  endTime: string
  venue: string
  address: string
  state: string
  location?: string
  images: string[]
  coverImage?: string
  ticketType: TicketTier[]
  performers?: Performer[]
  sponsorLogos?: string[]
  recapPhotos?: string[]
  gateRules?: string[]
  status: 'draft' | 'published' | 'ended' | 'cancelled'
  sold: number
  featured: boolean
  createdAt: string
  updatedAt: string
}

// ─── Ticket / Audience ─────────────────────────────────
export interface Ticket {
  _id: string
  event_id: string
  user_id: string
  eventname: string
  amount: number
  numOfTicket: number
  reference: string
  type: string
  date: string
  phone: string
  email: string
  name: string
  qrCode?: string
  faceOwner?: string
  faceLinkedAt?: string
  status: 'active' | 'used' | 'transferred' | 'refunded'
  transferredTo?: string
  transferredAt?: string
}

// ─── Bank & Payouts ────────────────────────────────────
export interface BankAccount {
  _id: string
  user_id: string
  bankName: string
  acctName: string
  acctNumber: string
  isActive: boolean
}

export interface WithdrawRequest {
  _id: string
  user_id: string
  bankName: string
  acctName: string
  acctNumber: string
  eventName: string
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'sent'
  createdAt: string
  updatedAt: string
}

// ─── Category ──────────────────────────────────────────
export interface Category {
  _id: string
  title: string
  slug?: string
  icon?: string
  gradient?: string
  image?: string
  description?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// ─── Notification ──────────────────────────────────────
export type NotificationType =
  | 'ticket_confirmed'
  | 'transfer_received'
  | 'transfer_accepted'
  | 'transfer_declined'
  | 'event_reminder'
  | 'new_event_from_following'
  | 'payout_approved'
  | 'payout_rejected'
  | 'kyc_approved'
  | 'kyc_rejected'

export interface Notification {
  _id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  data?: Record<string, string>
  createdAt: string
}

// ─── Promo Codes ───────────────────────────────────────
export interface PromoCode {
  _id: string
  event_id: string
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  maxUses?: number
  usedCount: number
  expiresAt?: string
  isActive: boolean
}

// ─── Admin ─────────────────────────────────────────────
export type AdminRole = 'super_admin' | 'finance' | 'moderator'

export interface AdminUser {
  _id: string
  name: string
  email: string
  role: AdminRole
  isActive: boolean
  twoFactorEnabled: boolean
  lastLoginAt?: string
  createdAt: string
}

export interface AuditLog {
  _id: string
  adminId: string
  adminName: string
  role: AdminRole
  action: string
  targetModel: string
  targetId: string
  timestamp: string
  ip: string
}

// ─── API Response wrapper ──────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// ─── Face ──────────────────────────────────────────────
export interface FaceLog {
  _id: string
  event_id: string
  ticket_id: string
  user_id: string
  result: 'match' | 'no_match'
  timestamp: string
  organizer_id: string
}

// ─── Partner Analytics & Stats ─────────────────────────
export interface TierStats {
  _id: string
  name: string
  price: number
  capacity: number
  sold: number
  available: number
  soldPercentage: number
}

export interface EventAnalytics {
  eventId: string
  eventName: string
  totalRevenue: number
  totalTicketsSold: number
  totalCapacity: number
  checkInCount: number
  checkInRate: number
  dailySales: Array<{ date: string; sold: number; revenue: number }>
  tierStats: TierStats[]
}

export interface PartnerRevenue {
  userId: string
  totalRevenue: number
  totalTicketsSold: number
  totalEvents: number
  pendingWithdrawals: number
  approvedWithdrawals: number
  sentWithdrawals: number
  availableBalance: number
}

export interface PartnerAnalytics {
  userId: string
  totalLifetimeRevenue: number
  totalEvents: number
  totalTicketsSold: number
  followers: number
  averageTicketPrice: number
  monthlyRevenue: Array<{ month: string; revenue: number }>
  topEvents: Array<{ eventId: string; eventName: string; revenue: number }>
}

export interface CheckInStats {
  eventId: string
  totalCapacity: number
  checkedIn: number
  remaining: number
  checkInRate: number
  byTier: Array<{ tierName: string; capacity: number; checkedIn: number }>
  byMethod: {
    face: number
    qr: number
    manual: number
  }
}

export interface AudienceExportRow {
  name: string
  email: string
  phone: string
  numOfTicket: number
  amount: number
  ticketType: string
  purchaseDate: string
  status: string
  checkedIn: boolean
  checkedInAt?: string
  checkedInMethod?: string
}
