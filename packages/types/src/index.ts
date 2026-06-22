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
  referralCode?: string
  createdAt: string
  updatedAt: string
}

// Session user extends User with auth-specific fields
export interface SessionUser extends User {
  token: string
  logo?: string
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
  secondaryCategory?: string
  description?: string
  headline?: string
  date: string
  event_date?: string
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
  likes?: number
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
  status: 'active' | 'used' | 'transferred' | 'refunded' | 'ended'
  transferredTo?: string
  transferredAt?: string
  // Backend-enriched event details:
  eventDate?: string                // Event start date (ISO 8601 string)
  eventTime?: string                // Event start time (HH:MM format)
  eventEndTime?: string             // Event end time (HH:MM format); may cross midnight
  eventVenue?: string               // Event venue name
  eventSlug?: string                // Event slug for routing
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
  // ── Partner / Attendee ──────────────────────────────
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
  | 'face_enrolled'
  | 'ticket_sold'
  // ── Admin ───────────────────────────────────────────
  | 'kyc_submitted'
  | 'payout_requested'
  | 'organizer_registered'

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
export type AdminRole =
  | 'super_admin'
  | 'finance'
  | 'kyc_reviewer'
  | 'support'
  | 'moderator'

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

// Full user view returned by /api/admin/users — includes KYC and suspension state
export interface UserAdminProfile {
  _id: string
  name: string
  username: string
  email: string
  phone?: string
  image?: string
  businessName?: string
  address?: string
  isAdmin: boolean
  isPartner: boolean
  role: AdminRole
  suspended: boolean
  kycStatus: 'pending' | 'verified' | 'rejected' | null
  kycRejectionReason?: string | null
  kycRejectedAt?: string | null
  isVerify: {
    email?: boolean
    photo?: boolean
    idCard?: boolean
    address?: boolean
  }
  verify?: {
    photo?: string
    idCard?: { front?: string; back?: string }
    address?: string
  }
  faceEnrolled?: boolean
  faceEnrolledAt?: string | null
  createdAt: string
  updatedAt: string
}

// POST /api/admin/kyc/approve
export interface KycApprovalPayload {
  userId: string
  kycType: 'photo' | 'idcard' | 'address'
}

// POST /api/admin/kyc/reject
export interface KycRejectPayload {
  userId: string
  rejectionReason?: string
}

// POST /api/admin/payouts/process
export interface PayoutProcessPayload {
  withdrawId: string
}

// POST /api/admin/payouts/reject
export interface PayoutRejectPayload {
  withdrawId: string
  reason?: string
}

// Paginated envelope returned by /api/admin/* list endpoints
export interface AdminPaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
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

// ─── CMS ───────────────────────────────────────────────
export interface SiteConfig {
  _id: string
  supportEmail: string
  heroHeadline: string
  heroSubtitle: string
  statAttendees: string
  statEvents: string
  statCities: string
  createdAt: string
  updatedAt: string
}

export interface MarqueeItem {
  _id: string
  text: string
  pulse: boolean
  dotColor: 'red' | 'violet'
  isActive: boolean
  cityTarget?: string
  sortOrder: number
  startsAt?: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface PromoBanner {
  /** Absent on GET /cms/banners — that endpoint excludes _id via .select('-_id') */
  _id?: string
  bannerKey: string
  title: string
  body: string
  isActive: boolean
  targetPage?: string
  targetAudience?: string
  startsAt?: string
  expiresAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface HowItWorksStep {
  /** Absent on GET /cms/how-it-works — that endpoint excludes _id via .select('-_id') */
  _id?: string
  stepNumber: number
  title: string
  description: string
  iconType: string
  isComingSoon: boolean
  isActive: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

/** CuratedSection — backed by /cms/curated-sections/:key */
export interface CuratedSection {
  _id?: string
  sectionKey: string
  title: string
  eyebrow: string
  isActive: boolean
  maxItems?: number
  createdAt?: string
  updatedAt?: string
}

export interface FaqItem {
  _id: string
  question: string
  answer: string
  category?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LegalSection {
  heading: string
  body: string
}

export interface LegalDocument {
  _id?: string
  docType: 'terms' | 'privacy'
  lastUpdated: string
  version?: string
  sections: LegalSection[]
  createdAt?: string
  updatedAt?: string
}

export interface PageSection {
  heading?: string
  body: string
}

export interface PageContent {
  _id?: string
  pageKey: 'about'
  title?: string
  sections: PageSection[]
  isPublished: boolean
  createdAt?: string
  updatedAt?: string
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
  userId?: string
  totalLifetimeRevenue: number
  totalEvents: number
  totalTicketsSold: number
  followers: number
  averageTicketPrice: number
  monthlyRevenue: Array<{ month: string; revenue: number }>
  topEvents: Array<{ eventId: string; eventName: string; revenue: number }>
  ticketTypes?: Array<{ name: string; sold: number; capacity: number; revenue: number }>
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
