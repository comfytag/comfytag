# ComfyTag — Master Implementation Reference

**Last Updated:** May 18, 2026  
**Status:** Complete audit of api + partner apps  
**Purpose:** Single authoritative reference for building admin, web, and mobile in sync  

---

## Quick Navigation

1. **[Part 1: API Reference](#part-1-api-reference)** — Every endpoint, auth level, request/response
2. **[Part 2: Shared Types](#part-2-shared-types)** — All TypeScript interfaces from `@comfytag/types`
3. **[Part 3: Shared Utilities](#part-3-shared-utilities)** — Functions from `@comfytag/utils`
4. **[Part 4: Design System](#part-4-design-system)** — UI components, tokens, colors
5. **[Part 5: Partner App Patterns](#part-5-partner-app-patterns)** — Auth, API client, React Query, shell
6. **[Part 6: Per-App Guide](#part-6-per-app-guide)** — What to build in admin/web/mobile
7. **[Part 7: Consistency Rules](#part-7-critical-consistency-rules)** — Non-negotiable constraints
8. **[Part 8: Verification Checklist](#part-8-verification-checklist)** — Pre-ship quality gates

---

## Part 1: API Reference

**Base URL:** `http://localhost:4002`  
**Auth methods:** Cookie `access_token` OR `Authorization: Bearer <token>`  
**Response envelope:** `{ success: boolean, data?: T, message?: string, error?: string }`  
**Paginated envelope:** `{ success, data: T[], total, page, limit, hasMore }`  

### Auth Middleware Tiers

| Middleware | Condition |
|---|---|
| `verifyToken` | Valid JWT in cookie or Bearer header |
| `verifyUser` | `verifyToken` + (owner OR `isPartner` OR `isAdmin`) |
| `verifyAdmin` | `verifyToken` + `isAdmin === true` |

### 1.1 Auth — `/auth` (also `/partner/auth`, `/admin/auth`)

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/auth/register` | none | `{ username, name, email, password }` | `{ user, token }` |
| POST | `/auth/login` | none | `{ email, password }` | `{ user, token }` |
| GET | `/auth/:id/verify/:token` | none | — | Verifies email |
| GET | `/auth/verify/:email` | verifyUser | — | Re-send verification email |
| PUT | `/auth/register-organizer/:userId` | verifyUser | — | Upgrade to organizer |
| POST | `/auth/forgot-password` | none | `{ identifier }` | Sends OTP |
| POST | `/auth/verify-otp` | none | `{ identifier, otp }` | `{ resetToken }` |
| POST | `/auth/reset-password` | none | `{ identifier, resetToken, newPassword }` | Success |
| POST | `/auth/change-password` | verifyUser | `{ currentPassword, newPassword }` | Success |
| PUT | `/auth/:id/verifykyc/:kyc` | verifyAdmin | — | Approve KYC |

### 1.2 Users — `/users` (also `/admin/users`, `/partner/users`)

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| GET | `/users/` | verifyAdmin | — | All users |
| GET | `/users/:id` | verifyUser | — | Single user |
| PUT/PATCH | `/users/:id` | verifyUser | Partial fields | Profile update |
| PUT | `/users/onboard/:id` | verifyUser | Onboarding answers | One-time setup |
| PUT | `/users/verify/:id` | verifyUser | — | Self-verify |
| PUT | `/users/isverify/:id` | verifyAdmin | — | Admin sets verified |
| PUT | `/users/:id/kyc` | verifyUser | `{ idPhotoUrl, facePhotoUrl }` | Upload KYC docs |
| DELETE | `/users/:id` | verifyUser | — | Delete account |

### 1.3 Events — `/events` + `/event` (both work)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/events/` | none | All events |
| GET | `/events/feed` | none | Curated home feed |
| GET | `/events/search` | none | `?q=` text search |
| GET | `/events/nearby` | none | `?state=` by location |
| GET | `/events/saved` | verifyToken | Current user's likes |
| GET | `/events/category/byCategory` | none | `?category=` |
| GET | `/events/filter/byType` | none | `?type=` |
| GET | `/events/filter/single` | none | Single filter |
| GET | `/events/pick/toppick` | none | Editor's picks |
| GET | `/events/pick/sold` | none | Best sellers |
| GET | `/events/state/byState` | none | `?state=` |
| GET | `/events/payment/byPayment` | none | Free vs paid |
| GET | `/events/user/:userId` | none | Organizer's events. `?page&limit` |
| GET | `/events/:id` | none | Single event |
| GET | `/events/:id/tiers/stats` | verifyToken | Per-tier stats |
| GET | `/events/:id/analytics` | verifyToken | Full analytics |
| GET | `/events/:id/checkin-stats` | verifyToken | Live check-in counts (poll 5s) |
| GET | `/events/:id/promos` | verifyToken | `{ eventId, promos[] }` |
| GET | `/events/:id/like/status` | none | `?userId=` — `{ liked }` |
| GET | `/events/:id/comments` | none | List comments |
| POST | `/event/:userId` | verifyToken | Create event |
| POST | `/events/:id/like` | verifyToken | Toggle like |
| POST | `/events/:id/comments` | verifyToken | `{ text }` |
| POST | `/events/:id/promos` | verifyToken | `{ code, discountType, discountValue, maxUses, expiresAt, eventId }` |
| PUT | `/events/:id` | verifyUser | Full update |
| PATCH | `/events/:id` | verifyUser | Partial update |
| PUT | `/events/:id/tiers/:tierId` | verifyToken | Update tier |
| DELETE | `/events/:id/tiers/:tierId` | verifyToken | Delete tier |
| PUT | `/events/:id/promos/:code` | verifyToken | Update promo |
| DELETE | `/events/:id/promos/:code` | verifyToken | Delete promo |
| DELETE | `/events/:id/:userId` | verifyAdmin | Admin delete |

### 1.4 Audience (Tickets) — `/audience`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/audience/` | verifyUser | All (admin) |
| GET | `/audience/:id` | verifyUser | Single ticket |
| GET | `/audience/user/:userId` | verifyUser | User's tickets. `?page&limit` |
| GET | `/audience/event/:eventId` | verifyUser | Event attendees. `?page&limit` |
| GET | `/audience/events/:eventId/audience/export` | verifyUser | CSV export — use `responseType: 'text'` |
| GET | `/audience/ref/:reference` | none | Lookup by payment ref |
| POST | `/audience/free/:eventId` | none | RSVP free event |
| POST | `/audience/:userId/:eventId` | verifyToken | Purchase ticket |
| POST | `/audience/:id/checkin` | verifyUser | Manual check-in |
| PUT | `/audience/:id` | verifyUser | Update ticket |
| DELETE | `/audience/:id/:userId` | verifyAdmin | Admin delete |

### 1.5 Categories — `/categories` + `/category`

| Method | Path | Auth |
|---|---|---|
| GET | `/categories/` | none |
| GET | `/categories/:id` | none |
| POST | `/category/` | verifyAdmin |
| PUT | `/category/:id` | verifyAdmin |
| DELETE | `/category/:id` | verifyAdmin |

### 1.6 Bank Accounts — `/bank`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/bank/` | verifyAdmin | All |
| GET | `/bank/:userId` | verifyUser | User's accounts |
| POST | `/bank/:userId` | verifyUser | `{ bankName, acctName, acctNumber }` |
| PUT | `/bank/edit/:id` | verifyUser | Update |
| PUT | `/bank/:userId/:bankId` | verifyUser | Set active |
| DELETE | `/bank/:id` | verifyUser | Delete |

### 1.7 Withdrawals — `/withdraw`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/withdraw/` | verifyAdmin | All |
| GET | `/withdraw/:userId` | verifyUser | User's withdrawals |
| GET | `/withdraw/show/:id` | verifyUser | Single |
| POST | `/withdraw/:userId` | verifyUser | `{ bankName, acctName, acctNumber, eventName, amount }` |
| PUT | `/withdraw/edit/:id` | verifyUser | Update (admin approves) |
| DELETE | `/withdraw/:id` | verifyUser | Delete |

### 1.8 Face Recognition — `/face`

| Method | Path | Auth |
|---|---|---|
| POST | `/face/enroll/:userId` | verifyUser |
| POST | `/face/verify` | verifyUser |
| DELETE | `/face/remove/:userId` | verifyUser |

### 1.9 Ticket Transfers — `/tickets/transfer`

| Method | Path | Auth |
|---|---|---|
| POST | `/tickets/transfer/initiate` | verifyUser |
| POST | `/tickets/transfer/accept` | verifyUser |
| POST | `/tickets/transfer/decline` | verifyUser |
| POST | `/tickets/transfer/claim` | verifyToken |
| GET | `/tickets/transfer/incoming` | verifyUser |

### 1.10 Notifications — `/notification` + `/notifications`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/notification` | verifyUser | List. `?page&limit`. **No 's'** |
| PUT | `/notifications/read-all` | verifyUser | Mark all read. **With 's'** |
| PUT | `/notifications/:id/read` | verifyUser | Mark one read |

### 1.11 Social — Likes, Comments, Follows

| Method | Path | Auth |
|---|---|---|
| GET | `/events/saved` | verifyToken |
| GET | `/events/:id/like/status` | none |
| POST | `/events/:id/like` | verifyToken |
| GET | `/events/:id/comments` | none |
| POST | `/events/:id/comments` | verifyToken |
| DELETE | `/comments/:id` | verifyToken |
| POST | `/comments/:id/pin` | verifyToken |
| POST | `/comments/:id/report` | verifyToken |
| GET | `/organizers/:id/follow/status` | none |
| GET | `/organizers/:id/stats` | none |
| POST | `/organizers/:id/follow` | verifyToken |

### 1.12 Search & Discovery

| Method | Path | Auth |
|---|---|---|
| GET | `/events/search` | none |
| GET | `/search/suggestions` | none |
| GET | `/search/trending` | none |

### 1.13 Commerce Utilities

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/wallet` | verifyToken | Balance + transactions |
| GET | `/tickets/:id/token` | verifyToken | Secure QR token |
| GET | `/tickets/:id/status` | verifyToken | **SSE stream** |
| POST | `/paystack/verify/:reference` | none | Verify payment |
| GET | `/config/seasonal` | none | Seasonal config |
| POST | `/alerts` | verifyToken | Set alert |
| GET | `/referral/:eventId` | verifyToken | Get code |
| POST | `/referral/apply` | verifyToken | Apply code |

### 1.14 Analytics

| Method | Path | Auth |
|---|---|---|
| GET | `/partner/:userId/revenue` | verifyToken |
| GET | `/partner/:userId/analytics` | verifyToken |
| GET | `/events/:id/analytics` | verifyToken |
| GET | `/events/:id/checkin-stats` | verifyToken |

### 1.15 Misc

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/upload` | verifyToken | Multipart `file`. Returns `{ url, publicId }` |
| POST | `/push-tokens` | verifyUser | `{ token, platform, deviceId }` |
| DELETE | `/push-tokens` | verifyUser | — |
| GET | `/testimonials` | none | — |
| GET | `/testimonials/:id` | none | — |
| POST | `/testimonials` | verifyAdmin | `{ name, text }` |
| DELETE | `/testimonials/:id` | verifyAdmin | — |
| POST | `/check-email` | none | `{ email }`. Returns `{ valid }` |

---

## Part 2: Shared Types

All from `@comfytag/types`. Never redeclare.

```ts
User {
  _id: string
  name: string
  username: string
  email: string
  phone?: string
  avatar?: string
  isPartner: boolean
  isAdmin: boolean
  isVerify: { email?, photo?, idCard?, address? }
  onboarding: { completed: boolean }
  faceEnrolled: boolean
  faceEnrolledAt?: string
  createdAt: string
  updatedAt: string
}

Event {
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

TicketTier {
  _id: string
  name: string
  price: number
  capacity: number
  sold: number
  saleStartDate?: string
  saleEndDate?: string
  description?: string
}

Ticket {
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

BankAccount {
  _id: string
  user_id: string
  bankName: string
  acctName: string
  acctNumber: string
  isActive: boolean
}

WithdrawRequest {
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

Category {
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

Notification {
  _id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  data?: Record<string, string>
  createdAt: string
}

PromoCode {
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

TierStats {
  _id: string
  name: string
  price: number
  capacity: number
  sold: number
  available: number
  soldPercentage: number
}

EventAnalytics {
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

PartnerRevenue {
  userId: string
  totalRevenue: number
  totalTicketsSold: number
  totalEvents: number
  pendingWithdrawals: number
  approvedWithdrawals: number
  sentWithdrawals: number
  availableBalance: number
}

PartnerAnalytics {
  userId: string
  totalLifetimeRevenue: number
  totalEvents: number
  totalTicketsSold: number
  followers: number
  averageTicketPrice: number
  monthlyRevenue: Array<{ month: string; revenue: number }>
  topEvents: Array<{ eventId: string; eventName: string; revenue: number }>
}

CheckInStats {
  eventId: string
  totalCapacity: number
  checkedIn: number
  remaining: number
  checkInRate: number
  byTier: Array<{ tierName: string; capacity: number; checkedIn: number }>
  byMethod: { face: number; qr: number; manual: number }
}

AudienceExportRow {
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

AdminUser {
  _id: string
  name: string
  email: string
  role: AdminRole
  isActive: boolean
  twoFactorEnabled: boolean
  lastLoginAt?: string
  createdAt: string
}

AuditLog {
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

FaceLog {
  _id: string
  event_id: string
  ticket_id: string
  user_id: string
  result: 'match' | 'no_match'
  timestamp: string
  organizer_id: string
}

ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

PaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Type aliases
NotificationType =
  'ticket_confirmed' | 'transfer_received' | 'transfer_accepted' |
  'transfer_declined' | 'event_reminder' | 'new_event_from_following' |
  'payout_approved' | 'payout_rejected' | 'kyc_approved' | 'kyc_rejected'

AdminRole = 'super_admin' | 'finance' | 'moderator'
```

---

## Part 3: Shared Utilities

All from `@comfytag/utils`. Never re-implement.

| Function | Signature | Notes |
|---|---|---|
| `formatNaira` | `(n: number) => string` | Intl.NumberFormat, no decimals |
| `formatDate` | `(s: string) => string` | "Mon, 18 May 2026" |
| `formatTime` | `(s: string) => string` | "HH:MM AM/PM" |
| `isToday` | `(s: string) => boolean` | Calendar day check |
| `isUpcoming` | `(s: string) => boolean` | Future date check |
| `timeUntil` | `(s: string) => string` | "2d 4h away" or "Starting soon" |
| `slugify` | `(t: string) => string` | URL-safe slug |
| `truncate` | `(t: string, n: number) => string` | Append "..." |
| `initials` | `(n: string) => string` | Up to 2 uppercase letters |
| `calculatePlatformFee` | `(a: number, pct=5) => number` | Default 5% |
| `calculatePaystackFee` | `(a: number) => number` | 1.5% + ₦100, cap ₦2,000 |
| `totalCharges` | `(a: number) => { platformFee, paystackFee, total }` | Full breakdown |
| `isValidEmail` | `(e: string) => boolean` | Regex check |
| `isValidNigerianPhone` | `(p: string) => boolean` | +234 or 0 prefix |
| `STORAGE_KEYS` | const object | `AUTH_TOKEN`, `USER`, `APP_MODE`, `PUSH_TOKEN`, `TICKETS` |

---

## Part 4: Design System

### 4.1 Universal UI Primitives (from `@comfytag/ui`)

| Component | Key Props |
|---|---|
| `Button` | `variant: 'primary'\|'ghost'\|'danger'`, `size: 'sm'\|'md'\|'lg'`, `loading`, `fullWidth` |
| `Input` | `value`, `onChange`, `label?`, `type?`, `error?`, `leftIcon?` — password auto-adds eye toggle |
| `Badge` | `status` — only 12 known statuses (see token map) |
| `Modal` | `isOpen`, `onClose`, `title`, `children`, `footer?` |
| `Skeleton` | `width?`, `height?`, `borderRadius?` |
| `EmptyState` | `title`, `subtitle?`, `action?: {label, href}` |
| `LoadingSpinner` | `size: 'sm'\|'md'\|'lg'`, `centered?` |
| `ErrorMessage` | `message`, `onRetry?` |

### 4.2 Badge Status Token Map

| Key | Use |
|---|---|
| `upcoming` | Event upcoming |
| `live` | Event live |
| `ended` | Event ended |
| `soldOut` | Tickets sold out |
| `draft` | Event draft |
| `trending` | FOMO public/mobile ONLY |
| `tonight` | FOMO public/mobile ONLY |
| `sellingFast` | FOMO public/mobile ONLY |
| `verified` | KYC verified |
| `pending` | Withdrawal/KYC pending |
| `rejected` | Withdrawal/KYC rejected |
| `approved` | Withdrawal/KYC approved |

### 4.3 Color Tokens (define as CSS variables in `:root`)

**Brand (all contexts)**
```
--color-brand: #7C3AED
--color-brand-dark: #5B21B6
--color-brand-light: #EDE9FE
```

**Public system (web + mobile attendee)**
```
bg: #FAFAF9
surface: #FFFFFF
border: #E8E5E0
text-primary: #1C1917
text-secondary: #78716C
```

**Dashboard system (partner + admin ONLY)**
```
bg: #0F0F0F
surface: #1A1A1A
surface-alt: #242424
surface-hover: #2E2E2E
border: #2E2E2E
text-primary: #F5F5F4
text-secondary: #A8A29E
```

**Semantic (all contexts)**
```
success: #10B981
error: #EF4444
info: #3B82F6
```

**Context-specific**
```
energy: #F59E0B (public + mobile ONLY — FOMO badges)
financial: #D97706 (dashboards ONLY — revenue/payouts)
```

### 4.4 Spacing (4pt grid)

`1=4px`, `2=8px`, `3=12px`, `4=16px`, `5=20px`, `6=24px`, `8=32px`, `10=40px`, `12=48px`, `16=64px`

### 4.5 Motion Tokens

- `micro=100ms`, `fast=200ms`, `default=250ms`, `entrance=300ms`
- Easing: `entrance=cubic-bezier(0,0,0.2,1)`, `exit=cubic-bezier(0.4,0,1,1)`, `standard=cubic-bezier(0.4,0,0.2,1)`

### 4.6 Layout Constants

- `navHeight=64px`, `sidebarWidth=240px`, `tabBarHeight=80px`, `mobileNavHeight=56px`

---

## Part 5: Partner App Patterns

Reference implementations for auth, API client, React Query, and dashboard shell.

### 5.1 NextAuth Setup

```ts
// lib/auth.ts
CredentialsProvider → POST /[app]/auth/login → returns { user, token }
JWT callback: persist { id, token, logo, isVerified }
Session callback: map onto session.user
```

**Session shape:**
```ts
session.user = {
  id: string
  name: string | null
  email: string | null
  token: string
  logo?: string | null
  isVerified: boolean
}
```

- Strategy: JWT (stateless)
- Protected by `src/middleware.ts` using `withAuth`
- Dashboard layout calls `getServerSession()` server-side
- Auth pages redirect to `/overview` when authenticated

### 5.2 API Client Pattern

```ts
// lib/api.ts
const api = axios.create({
  baseURL: NEXT_PUBLIC_API_URL,
  withCredentials: true
})

const authHeader = (token?: string) =>
  token ? { headers: { Authorization: `Bearer ${token}` } } : {}

// Usage:
api.get<ApiResponse<T>>(path, { ...authHeader(session?.user.token), params })
```

### 5.3 React Query Setup

```ts
new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } }
})
```

**Query key conventions:**
| Key | Data |
|---|---|
| `['events', userId, page]` | Paginated event list |
| `['event', eventId]` | Single event |
| `['events-overview', userId]` | All events (limit 100) for stats |
| `['partner-revenue', userId]` | PartnerRevenue |
| `['partnerAnalytics', userId]` | PartnerAnalytics |
| `['audience', eventId, page]` | Paginated attendees |
| `['tierStats', eventId]` | TierStats[] |
| `['checkInStats', eventId]` | CheckInStats (refetchInterval: 5000) |
| `['promos', eventId]` | PromoCode[] |
| `['notifications', userId]` | Notification list |
| `['banks', userId]` | BankAccount[] |
| `['withdrawals', userId]` | WithdrawRequest[] |

### 5.4 Dashboard Shell

```
ShellClient (manages sidebar state)
  ├── Sidebar (240px, nav links, sign out)
  ├── Topbar (page title, notifications, avatar)
  └── <main> (margin-left: 240px on tablet+)
```

### 5.5 Dashboard-Specific Components

Each dashboard owns its own in `src/components/ui/`:
- `StatCard` — icon, value, label
- `DataTable<T>` — columns, rows, loading/empty
- `EventCard` — image, name, date, badges
- `MediaUploader` — dropzone, thumbnails
- `PageHeader` — title, subtitle, action
- `Breadcrumb` — linked trail

### 5.6 Key Implementation Notes

1. **Notification GET** → `/notification` (no 's')
2. **Notification mutations** → `/notifications` (with 's')
3. **Gate page** → poll `checkInStats` every 5000ms via `refetchInterval`
4. **CSV export** → use `responseType: 'text'`
5. **Available balance** → use `PartnerRevenue.availableBalance`, never compute client-side
6. **Duplicate event** → strip `_id`, `createdAt`, `updatedAt`, post to `POST /events`
7. **Event owner** → `planner_id` field (not `user_id`)
8. **Ticket statuses visible** → `active`, `used`, `transferred` (not `refunded`)
9. **SSE stream** → `GET /tickets/:id/status` via `EventSource` or streaming fetch
10. **Face fields** → `faceTemplate`, `totpSecret`, `transferToken` are `select:false`, never returned

---

## Part 6: Per-App Guide

### 6.1 Admin (`apps/admin`)

**Auth:** NextAuth with POST `/admin/auth/login`

**Pages:**
| Route | Endpoints |
|---|---|
| `/login` | POST `/admin/auth/login` |
| `/overview` | Stats from `/users`, `/events`, `/withdraw`, `/audience` |
| `/users` | GET `/users/` + PUT `/users/isverify/:id` for verification |
| `/users/:id` | GET `/users/:id` + KYC management |
| `/organizers` | GET `/users/?isPartner=true` |
| `/events` | GET `/events/` + PATCH to toggle `featured` |
| `/payouts` | GET `/withdraw/` + PUT to approve |
| `/kyc` | KYC submissions + PUT `/auth/:id/verifykyc/:kyc` |
| `/analytics` | Aggregate platform-wide stats |
| `/settings` | PATCH `/users/:id` |

**Unique endpoints:**
- KYC approve: `PUT /auth/:id/verifykyc/:kyc`
- Admin verify: `PUT /users/isverify/:id`
- Delete event: `DELETE /events/:id/:userId`
- Manage categories: POST/PUT/DELETE `/category/`

### 6.2 Web (`apps/web`)

**Auth:** NextAuth CredentialsProvider

**Public pages (no auth):**
| Route | Endpoints |
|---|---|
| `/` | GET `/events/feed`, `/pick/toppick`, `/categories`, `/search/trending`, `/testimonials` |
| `/events` | GET `/filter/byType`, `/state/byState`, `/search` |
| `/events/:id` | GET `/events/:id`, `/like/status`, `/comments`, `/organizers/:id/stats` |
| `/search` | GET `/events/search?q=`, `/search/suggestions?q=` |

**Auth-required pages:**
| Route | Endpoints |
|---|---|
| `/checkout/:eventId` | POST `/audience/:userId/:eventId`, POST `/paystack/verify/:reference` |
| `/tickets` | GET `/audience/user/:userId` |
| `/tickets/:id` | GET `/tickets/:id/token`, SSE `/tickets/:id/status` |
| `/profile` | GET+PATCH `/users/:id`, POST `/face/enroll/:userId` |

**Color rules:**
- Use `public.*` tokens (warm off-white bg, white surface)
- Energy amber `#F59E0B` for FOMO badges (Trending, Tonight, Selling Fast)
- Never use financial gold or dashboard colors

**Patterns:**
- Like toggle: POST `/events/:id/like`, status: GET with `?userId=`
- Follow toggle: POST `/organizers/:id/follow`, status: GET with `?userId=`
- Free RSVP: POST `/audience/free/:eventId`
- Checkout fees: use `totalCharges(price)` from utils

### 6.3 Mobile (`apps/mobile`)

**Auth:** Direct API calls (no NextAuth). Store token in `STORAGE_KEYS.AUTH_TOKEN`

**Face SDK:** All calls via `apps/mobile/src/lib/faceSDK.ts` facade — never call KBY-AI directly

**Screens:**
| Screen | Endpoints |
|---|---|
| Auth | POST `/auth/login`, `/auth/register` |
| Event Feed | GET `/events/feed`, `/nearby?state=`, `/pick/toppick` |
| Event Detail | GET `/events/:id`, POST `/events/:id/like`, GET `/events/:id/comments` |
| Search | GET `/events/search?q=`, `/search/suggestions?q=` |
| Checkout | POST `/audience/:userId/:eventId`, POST `/paystack/verify/:reference` |
| My Tickets | GET `/audience/user/:userId` |
| Ticket Detail | GET `/tickets/:id/token`, SSE `/tickets/:id/status` |
| Face Enroll | POST `/face/enroll/:userId` via faceSDK |
| Transfer | POST `/transfer/initiate`, `/accept`, `/decline`, `/claim` |
| Notifications | GET `/notification`, PUT `/notifications/read-all` |
| Profile | GET+PATCH `/users/:id` |
| Push Tokens | POST `/push-tokens`, DELETE `/push-tokens` |

**Token storage:** `AsyncStorage` with `STORAGE_KEYS` constants  
**Avatar placeholders:** Use `initials(name)`  
**Price formatting:** Use `formatNaira()`  
**Gate/check-in:** Poll `checkInStats` every 5s  
**SSE for ticket status:** Use `EventSource` polyfill or streaming fetch  

---

## Part 7: Critical Consistency Rules

1. **Types** — always from `@comfytag/types`. Add missing types there, never define locally.
2. **Utilities** — always from `@comfytag/utils`. Never re-implement helpers.
3. **Colors** — always CSS variables or token imports. No hardcoded hex.
4. **Notification endpoint quirk** — GET uses `/notification` (no 's'), mutations use `/notifications` (with 's'). Match exactly.
5. **Available balance** — use `PartnerRevenue.availableBalance` from API, never compute.
6. **Face data** — `faceTemplate`, `totpSecret`, `transferToken` are `select:false`, never appear normally.
7. **Bearer token** — pass as both cookie and `Authorization: Bearer` header. Axios `withCredentials: true` handles cookies; add `authHeader(token)` for header.
8. **Dashboard dark theme** — only partner + admin. Web + mobile use public colors.
9. **STORAGE_KEYS** — mobile and web use exactly `STORAGE_KEYS.*` from `@comfytag/utils` for persistence.
10. **No `pnpm add`** — never run install. Write command, wait for user output.

---

## Part 8: Verification Checklist

Before shipping any new page/feature in admin/web/mobile:

- [ ] Endpoint path matches Part 1 (including singular/plural quirks)
- [ ] Types imported from `@comfytag/types`, not redeclared
- [ ] Utilities from `@comfytag/utils` (formatNaira, formatDate, etc.)
- [ ] Universal primitives from `@comfytag/ui` (Button, Input, Badge, Modal, etc.)
- [ ] Dashboard components in `apps/[app]/src/components/ui/` (StatCard, DataTable, PageHeader, etc.)
- [ ] Colors via CSS variables / token imports — no hardcoded hex
- [ ] Energy amber `#F59E0B` only on public/mobile FOMO badges, never in dashboards
- [ ] Financial gold `#D97706` only in dashboards (revenue/payouts), never public
- [ ] React Query keys follow Part 5.3 conventions
- [ ] Auth token via `authHeader()` utility as Bearer header
- [ ] Notification GET → `/notification` (no 's'), mutations → `/notifications` (with 's')
- [ ] Gate/checkin polls `checkInStats` with `refetchInterval: 5000`
- [ ] CSV export uses `responseType: 'text'`

---

**Maintained by:** Project Builder + AI Workforce  
**Last sync:** May 18, 2026  
**Next review:** After Milestone 5 completion
