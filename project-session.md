╔══════════════════════════════════════════════════════════════╗
║  PROJECT BUILDER — SESSION STATE                             ║
║  Project: ComfyTag                                           ║
║  Saved: May 2026                                             ║
║  Status: ✅ MILESTONE 4 COMPLETE — MILESTONE 5 next           ║
╚══════════════════════════════════════════════════════════════╝

## PROJECT SNAPSHOT
Name: ComfyTag
Type: New (Greenfield)
Stack: Express.js + MongoDB (API, port 4002) | Next.js 16.2.6 App Router (web port 3000, admin port 3002, partner port 3001) | Expo + React Native 0.81.5 (mobile) | pnpm 11.0.9 + Turborepo 2.9.12 | Node 20 LTS | TypeScript 5.9.2
Deployment: TBD (Nigeria-first)
Business Model: 4–5% success fee per ticket + biometric check-in premium + promoted listings
Absolute Path: C:\Users\HOMEPC\Desktop\Web_Projects\Personal\comfytag
V2 Migrated: true
Discussion Path: C:\Users\HOMEPC\Desktop\Web_Projects\Personal\comfytag\discussion\
TESTING: playwright: true
Playwright scaffold: pending (generate tests/milestone-5.spec.ts at M5 Kanban confirmation in fresh session)

---

## COUNCIL DECISIONS LOG

### Architecture
- RESEARCHER: KBY-AI selected for face recognition SDK — mock-first until license arrives; adapter isolates all screens from SDK changes
- CTO: Adapter pattern — apps/mobile/src/lib/faceSDK.ts is the ONLY file that touches KBY-AI; all screens import from adapter, never directly
- CTO: Monorepo via Turborepo + pnpm workspaces — shared packages: @comfytag/types, @comfytag/utils, @comfytag/ui
- CTO: Express.js + MongoDB for API (existing, fully stabilised in Milestone 2)
- CTO: Partner app fully rebuilt from Pages Router (Next.js 12) → App Router (Next.js 16.2.6) in TASK-031a. Stack now matches admin exactly.
- CTO: Universal UI primitives (Button, Input, Badge, Skeleton, Modal, EmptyState, LoadingSpinner, ErrorMessage) go into packages/ui/src/components/ — shared across partner, admin, and web. NOT deferred to M5 anymore — implemented in TASK-031d.
- CTO: Dashboard-specific components (StatCard, DataTable, EventCard, PageHeader) go into apps/[app]/src/components/ui/ — not shared across apps.

### packages/ — Purpose (LOCKED)
- packages/types  (@comfytag/types)  — single source of truth for ALL TypeScript interfaces. No type duplicated across apps.
- packages/utils  (@comfytag/utils)  — shared utility functions. 15 exports used by all 4 apps.
- packages/ui     (@comfytag/ui)     — design tokens (tokens/index.ts) + universal UI primitives in src/components/. Partner, admin, web all import from here. Mobile uses tokens only (RN can't use web components).

### Code Standards (enforced on EVERY task — non-negotiable)
- SWE: Pages are thin composers — useQuery + useSession + data derivation + component JSX only. No inline reusable UI in page files.
- SWE: Every reusable UI piece lives in its own component file with a fully typed props interface. Extract before first use.
- SWE: SWE pre-check must confirm every component a page needs already exists before generating the subagent prompt. If it doesn't exist, build it first.
- SWE: Universal primitives → packages/ui/src/components/. Dashboard-specific → apps/[app]/src/components/ui/.
- SWE: All shared types from @comfytag/types, utils from @comfytag/utils, tokens/primitives from @comfytag/ui
- SWE: No hardcoded colors or spacing — use CSS custom properties (var(--color-*)) in web/partner/admin
- SWE: All types explicit — no 'any'. No console.log in production code.
- SWE: Token values in @comfytag/ui/tokens are CSS px-strings — RN StyleSheet requires numeric values; use local sp/rd/fs numeric helper objects
- SWE: @react-navigation/stack (installed) used for navigation types — NOT @react-navigation/native-stack (NOT installed)

### Design System (LOCKED v1.1)
- UI/UX: Brand color #7C3AED (deep violet-purple) — consistent across all 4 apps
- UI/UX: Public apps (web, mobile attendee) — bg #FAFAF9, surface #FFFFFF, text #1C1917
- UI/UX: Dashboard apps (partner, admin, mobile organizer screens) — bg #0F0F0F, surface #1A1A1A, text #F5F5F4
- UI/UX: Success #10B981, Error #EF4444, Energy amber #F59E0B (FOMO badges ONLY), Gold #D97706 (financial in dashboard ONLY)
- MKT: Energy amber (#F59E0B) for Trending/Tonight/Selling Fast badges ONLY — never elsewhere
- MKT: Gold (#D97706) for revenue/payouts in dashboard ONLY — never on public site

### Dashboard CSS custom properties (in partner + admin globals.css)
  --color-brand: #7C3AED | --color-brand-light: #8B5CF6
  --color-bg: #0F0F0F | --color-surface: #1A1A1A | --color-surface-2: #242424
  --color-text: #F5F5F4 | --color-text-muted: #A8A29E | --color-border: #2A2A2A
  --color-success: #10B981 | --color-error: #EF4444 | --color-warning: #F59E0B | --color-gold: #D97706

### URL Structure (LOCKED — both apps use short URLs)
- CTO/PM: Both partner and admin apps use short URLs — (dashboard) and (auth) are route group organisers only and do NOT appear in URLs
- Partner URLs: /login, /forgot-password, /reset-password, /overview, /events, /events/create, /events/[id], /settings, /settings/withdraw, /notifications
- Admin URLs: /login, /overview, /users, /users/[id], /organizers, /organizers/[id], /events, /events/[id], /payouts, /payouts/[id], /kyc, /kyc/[id], /face-logs, /face-logs/[id], /promoted, /promoted/[id], /promoted/create, /analytics, /audit, /team, /team/[id], /team/invite, /settings
- RULE: NEVER use /dashboard/* prefixes in hrefs, redirects, or middleware matchers for either app

### Face Recognition & Biometrics
- SECURITY: Face templates encrypted on-device — server never stores raw biometric data
- PM: Transfer accept = API call only, NO camera re-enrollment (user already enrolled; synced server-side)
- PM: Organizer check-in = full-screen green (#10B981) or red (#EF4444) result, 4s auto-dismiss, manual fallback always visible

### Security
- SECURITY: CORS wildcard replaced with origin whitelist (TASK-018)
- SECURITY: Auth tokens stored in next-auth JWT (httpOnly cookie) for web apps — never localStorage, never hardcoded, never logged

### Infrastructure
- CTO: @comfytag/types, @comfytag/utils, @comfytag/ui declared as workspace:* deps in both apps/mobile and apps/partner
- DATA: Notification TTL 90 days, compound index (user_id + read + createdAt) for efficient pagination
- Partner .env.local: NEXTAUTH_SECRET=comfytag_partner_secret_dev_2026 | NEXTAUTH_URL=http://localhost:3001 | NEXT_PUBLIC_API_URL=http://localhost:4002

### API endpoints confirmed (for partner dashboard use)
- GET  /events/user/:userId       → Event[] for this planner (planner_id match)
- GET  /audience/event/:eventId   → Audience[] for one event
- GET  /audience/user/:userId     → Audience[] where user_id = userId (tickets bought BY user, NOT partner revenue)
- GET  /withdraw/:userId          → WithdrawRequest[] for this user
- POST /withdraw/:userId          → create withdrawal request
- GET  /bank/:userId              → bank accounts for this user
- POST /bank/:userId              → add bank account
- GET  /notification (paginated)  → notifications for current user
- Revenue has NO dedicated endpoint yet — derive from events[].sold × ticket price client-side. Flag for M5.

### OVERRIDE LOG
- None

---

## COMPONENT REGISTRY (DRY Reference)
SWE checks this before every task. Never recreate anything listed here.

### packages/ui — Universal primitives (TASK-031d — BUILT ✅)
All 8 exported from packages/ui/src/index.ts. Import from '@comfytag/ui'.
- packages/ui/src/components/Button.tsx      — variant: primary|ghost|danger, size: sm|md|lg, loading (inline spinner), fullWidth, focus-visible ring
- packages/ui/src/components/Input.tsx       — label, type, value, onChange, error, leftIcon slot; password toggle via inline SVG (no lucide dep); 'use client'
- packages/ui/src/components/Badge.tsx       — status string → colors.badges token map, pill style, fallback for unknown status
- packages/ui/src/components/Skeleton.tsx    — width, height, borderRadius, __ct_pulse CSS keyframe injected via <style>
- packages/ui/src/components/Modal.tsx       — isOpen, onClose, title, children, footer slot; Escape key + scroll lock; 'use client'
- packages/ui/src/components/EmptyState.tsx  — title, subtitle, optional action {label, href}; centered with SVG icon
- packages/ui/src/components/LoadingSpinner.tsx — size: sm|md|lg (16/24/40px), centered prop, __ct_spin CSS keyframe
- packages/ui/src/components/ErrorMessage.tsx   — message, optional onRetry callback; red alert box with 10% opacity bg

### Partner — Auth (TASK-031b + TASK-031d — BUILT ✅)
- apps/partner/src/app/(auth)/login/page.tsx
  Uses Input + Button + ErrorMessage from @comfytag/ui. Logic: signIn('credentials') → /dashboard/overview
  Route URL: /login (App Router group (auth) — NOT /auth/login)
- apps/partner/src/app/(auth)/forgot-password/page.tsx
  Uses Button + ErrorMessage from @comfytag/ui. OTP 6-box inputs remain raw (custom behavior).
  Flow: 3-step (identifier → OTP 6-box useRef → new password), 60s resend cooldown, sendOtp() extracted
  Route URL: /forgot-password
- apps/partner/src/app/(auth)/reset-password/page.tsx
  Redirects to /forgot-password on mount. Route URL: /reset-password

### Partner — Dashboard shell (TASK-031c — BUILT ✅)
- apps/partner/src/components/dashboard/Sidebar.tsx
  Fixed 240px, 6 nav items, startsWith active state, mobile slide-in + overlay, sign-out red hover
  Nav: Overview | Events | Create Event | Notifications | Settings | Withdraw
- apps/partner/src/components/dashboard/Topbar.tsx
  Sticky 60px, pathname-derived page title, initials avatar (useSession), click-outside dropdown
- apps/partner/src/components/dashboard/ShellClient.tsx
  'use client', owns isSidebarOpen state, wires Sidebar + Topbar, margin-left 240px desktop via injected media query
- apps/partner/src/app/(dashboard)/layout.tsx
  Async server component, getServerSession() guard, redirects to //login if no session

### Partner — Lib (TASK-031a/031b — BUILT ✅)
- apps/partner/src/lib/api.ts     — axios instance, baseURL from NEXT_PUBLIC_API_URL
- apps/partner/src/lib/auth.ts    — NextAuth authOptions (CredentialsProvider, JWT/session callbacks, module augmentation)
- apps/partner/src/middleware.ts  — withAuth: guards all routes, public paths = ['/', '/login', '/forgot-password', '/reset-password']. Authenticated users redirected /login→/overview. Matcher: broad negative-lookahead (all routes except api/_next/static/image/favicon)
- apps/partner/src/app/providers.tsx — SessionProvider + stable QueryClient (useState initialiser, staleTime 60s, retry 1)
- apps/partner/src/types/index.ts — re-exports from @comfytag/types

### Partner — Dashboard-specific components (TASK-031d — BUILT ✅)
All in apps/partner/src/components/ui/:
- StatCard.tsx   — icon (LucideIcon), value, label, isLoading (uses Skeleton from @comfytag/ui)
- DataTable.tsx  — generic typed ColumnDef<T> + data, skeleton rows (5) when loading, EmptyState when empty. TableRow extracted as subcomponent for hover state. No @tanstack/react-table hooks — simple map.
- EventCard.tsx  — Event type, href; next/image + Badge from @comfytag/ui; Intl.DateTimeFormat for date
- PageHeader.tsx — title, subtitle?, action ReactNode slot; flex justify-between

### Web — Layout + Home + Search components (TASK-036c/036e — BUILT ✅)
- apps/web/src/components/layout/Navbar.tsx — sticky top nav, logged-in/out states, avatar dropdown, bell icon
- apps/web/src/components/home/HeroSection.tsx — animated gradient, city detection (Nominatim), trending tag pills
- apps/web/src/components/home/CategoryPillsBar.tsx — sticky category pills, horizontal scroll
- apps/web/src/components/home/EventFeedSection.tsx — trending row + date-grouped grid + like + load more

### Web — Auth components (TASK-036b — BUILT ✅)
- apps/web/src/components/auth/AuthLayout.tsx — 40/60 desktop split (animated gradient left panel) + mobile glassmorphism; wraps all auth pages

### Web — Event detail components (TASK-036d — BUILT ✅)
- apps/web/src/components/event/EventHeroCarousel.tsx — props: {images, name}; 5s auto-advance, hover-pause, max-5 sliding dots, /placeholder.jpg fallback
- apps/web/src/components/event/TicketTierSheet.tsx — wraps BottomSheet; capacity bar (error color >85%); qty clamp; fee breakdown (4% platform + 1.5%+₦100 processing); onCheckout(tierId, qty)
- apps/web/src/components/event/CommentSection.tsx — exports Comment interface; pinned first; optimistic insert; load more pagination; AuthGateSheet trigger="comment" for guests

### Web — Hype Link + SEO (TASK-036k/036m — BUILT ✅)
- apps/web/src/app/hype-link/page.tsx — copy link, native share, wallet balance, +/− transaction history
- apps/web/src/app/layout.tsx — full OG/Twitter metadata, metadataBase https://comfytag.com
- apps/web/src/app/loading.tsx — root loading state (LoadingSpinner)
- apps/web/src/app/error.tsx — root error boundary ('use client', Button, reset)
- apps/web/src/app/not-found.tsx — 404 page (Button + Link home)
- apps/web/src/app/events/[slug]/loading.tsx — event page loading state

### Web — Checkout + OG + Ticket Wallet (TASK-036f/036g — BUILT ✅)
- apps/web/src/app/checkout/page.tsx — 5-state machine; Paystack dynamic script; guest form + validation; promo code; fee breakdown; CSS confetti + OG card + WhatsApp share on success; 3 failure types
- apps/web/src/app/api/og/route.tsx — edge runtime; ImageResponse 800×418; event cover + "Just Got My Ticket!" badge; ref number
- apps/web/src/app/tickets/page.tsx — Upcoming/Past tabs; auth guard; TicketListItem (accent strip, status badges)
- apps/web/src/app/tickets/[id]/page.tsx — DigitalStub wrapper; TOTP 30s rotation + countdown; SSE scan state; Wake Lock; QR via qrserver.com; Send to Friend; offline ref code fallback

### Mobile — lib
- apps/mobile/src/lib/faceSDK.ts — enrollFace(), verifyFace(), checkLiveness(), getSDKStatus(). Mock mode active. Created: TASK-025
- apps/mobile/src/lib/ticketCache.ts — getCachedTickets, setCachedTickets, clearTicketCache, isCacheStale. Created: TASK-030

### Mobile — Screens (all TASK-026 to TASK-030)
- apps/mobile/src/screens/onboarding/FaceEnrollmentScreen.tsx — 525 lines, 5 states, animated oval
- apps/mobile/src/screens/attendee/tickets/IncomingTransferScreen.tsx — 717 lines, 6 states, NO re-enroll
- apps/mobile/src/screens/organizer/checkin/FaceCheckInScreen.tsx — 675 lines, 7 states, full-screen result
- apps/mobile/src/screens/onboarding/ForgotPasswordScreen.tsx — 782 lines, 3-step OTP flow, Termii server-side
- apps/mobile/src/screens/attendee/tickets/MyTicketsScreen.tsx — stale-while-revalidate, skeleton cards

### Shared packages
- packages/types/src/index.ts — 18 exports: User, AuthResponse, TicketTier, Performer, Event, Ticket, BankAccount, WithdrawRequest, Category, Notification, PromoCode, AdminUser, AuditLog, ApiResponse<T>, PaginatedResponse<T>, FaceLog, NotificationType, AdminRole
- packages/utils/src/index.ts — 15 exports: formatNaira, formatDate, formatTime, isToday, isUpcoming, timeUntil, slugify, truncate, initials, calculatePlatformFee, calculatePaystackFee, totalCharges, isValidEmail, isValidNigerianPhone, STORAGE_KEYS
- packages/ui/src/tokens/index.ts — colors, spacing, containers, radius, shadows, motion, typography, layout

---

## KANBAN STATUS

### ✅ MILESTONE 0: Security & Cleanup — COMPLETE
[x] Removed: /good partner, /partner - Copy, /myclient, /client, /anchor
[x] Fixed: 12 dead files, 4 undefined imports

### ✅ MILESTONE 1: Monorepo Foundation — COMPLETE
[x] TASK-006 | Turborepo + pnpm scaffold | ✅
[x] TASK-007 | apps/api moved + Docker + backup script | ✅
[x] TASK-008 | apps/partner moved | ✅
[x] TASK-009 | apps/web scaffolded (23 routes) | ✅
[x] TASK-010 | apps/admin scaffolded (30 routes) | ✅
[x] TASK-011 | apps/mobile scaffolded (44 screens) | ✅
[x] TASK-012 | packages/types (18 types) | ✅
[x] TASK-013 | packages/utils (15 utilities) | ✅
[x] TASK-014 | packages/ui (design tokens only) | ✅

### ✅ MILESTONE 2: Backend Stabilisation — COMPLETE
[x] TASK-015 through TASK-024 — all complete ✅

### ✅ MILESTONE 3: Facial Recognition Core — COMPLETE (6/6)
[x] TASK-025 | faceSDK.ts (mock adapter) | ✅
[x] TASK-026 | FaceEnrollmentScreen | ✅
[x] TASK-027 | IncomingTransferScreen | ✅
[x] TASK-028 | FaceCheckInScreen | ✅
[x] TASK-029 | ForgotPasswordScreen + Termii OTP | ✅
[x] TASK-030 | ticketCache.ts + MyTicketsScreen | ✅

### 🔄 MILESTONE 4: Partner + Admin Dashboard — IN PROGRESS

#### Partner Dashboard — Full App Router Rebuild
[x] TASK-031a | Partner: App Router scaffold + dependency migration | ✅ APPROVED
              Next.js 16.2.6 | React 19 | Tailwind v4 | TanStack Query v5 | next-auth ^4
              19 files created, old Pages Router codebase deleted
[x] TASK-031b | Partner: Auth infrastructure | ✅ APPROVED
              NextAuth CredentialsProvider, middleware, providers.tsx
              login/page.tsx + forgot-password/page.tsx (inline styles — refactor in TASK-031d)
              tsc: 0 errors
[x] TASK-031c | Partner: Dashboard shell layout | ✅ APPROVED
              Sidebar.tsx, Topbar.tsx, ShellClient.tsx, (dashboard)/layout.tsx
[x] TASK-031d | Partner: Universal UI primitives (packages/ui) + partner-specific components + refactor auth pages | ✅ APPROVED
              PART A: 8 components in packages/ui/src/components/ — all exported from packages/ui/src/index.ts
              PART B: StatCard, DataTable, EventCard, PageHeader in apps/partner/src/components/ui/
              PART C: login/page.tsx + forgot-password/page.tsx refactored to use @comfytag/ui components
              tsc --noEmit (@comfytag/partner): PASS — 0 errors
[x] TASK-031e | Partner: Overview/home page | ✅ APPROVED
              4 StatCards (totalEvents, totalSold, estRevenue, publishedCount), DataTable recent 5 events
              Revenue: e.sold × avg(ticketType[].price) — client-side derivation. Badge: published→approved, cancelled→rejected
              tsc: 0 errors
[x] TASK-031f | Partner: Events list page | ✅ APPROVED
              Filter pills (All/Published/Draft/Ended/Cancelled with live counts), table/grid toggle (List/LayoutGrid icons)
              Grid view: EventCard + 6 skeleton cards while loading. Table: DataTable + card wrapper. EmptyState per filter context.
              dateFmt + columns at module level. tsc: 0 errors
[x] TASK-031g | Partner: Create event page | ✅ APPROVED
              2-step form: Step1 (9 fields incl. raw select/textarea/date/time) → Step2 (tier list + Add Tier Modal)
              useMutation POST /events, Save as Draft + Publish buttons. NIGERIAN_STATES + EVENT_CATEGORIES module-level.
              Validation lists missing fields by name. tsc: 0 errors
[x] TASK-031h | Partner: Event detail page | ✅ APPROVED
              useParams<{id}>, two queries (GET /events/:id + GET /audience/event/:id → Ticket[])
              4 StatCards (sold/available/revenue/capacity), attendeeColumns at module level, Cancel Event Modal + PATCH mutation
              Ticket aliased as TicketType to avoid lucide icon clash. tsc: 0 errors
[x] TASK-031i | Partner: Settings — profile + bank account | ✅ APPROVED
              Profile section: name Input (useEffect session sync) + disabled email + PATCH /users/:userId + 3s success flash
              Bank section: GET/POST /bank/:userId, skeleton loading, Add Bank Modal (3 Inputs), isActive badge
              sectionCard + sectionHeaderBase extracted at module level. tsc: 0 errors
[x] TASK-031j | Partner: Settings — withdraw page | ✅ APPROVED
              withdrawColumns at module level (sent→verified badge mapping, gold amount)
              Two queries: GET /withdraw/:userId + GET /bank/:userId. POST /withdraw/:userId mutation.
              Modal: bank <select> (spinner while loading / empty-state link / options), eventName + amount Inputs. tsc: 0 errors
[x] TASK-031k | Partner: Notifications page | ✅ APPROVED
              GET /notification?page=1&limit=50 with Bearer token header. notifTypeInfo + columns at module level.
              Unread dot (brand color) + title weight/color change. Type pill with semantic colors.
              Three-state render: loading spinner → EmptyState → DataTable card. tsc: 0 errors

#### Admin Dashboard — Implementation (stubs → functional)
[x] TASK-034a | Admin: Shared lib layer (api client, NextAuth full config, RBAC role guard) | ✅ APPROVED
              api.ts (axios, baseURL from NEXT_PUBLIC_API_URL), auth.ts (CredentialsProvider → POST /admin/login + POST /admin/verify-2fa for 2FA), roleGuard.ts, roles.ts (AdminRole type), middleware.ts (guards /dashboard/*, redirects /login), providers.tsx, types/index.ts
              Module augmentation: session.user = { id, name, email, token, role: AdminRole }
[x] TASK-034b | Admin: Auth pages — login + 2FA (imports Button + Input from @comfytag/ui) | ✅ APPROVED
              login/page.tsx — 2-step inline (credentials → 2FA OTP), uses Input + Button + ErrorMessage from @comfytag/ui, ShieldCheck Lucide icon
              2fa/page.tsx — standalone 2FA page (separate fallback route)
              Both use CSS custom properties (var(--color-bg) etc.) — globals.css must be updated in 034c
[x] TASK-034c | Admin: Dashboard shell layout (sidebar, topbar, role-filtered nav) + admin UI components | ✅ APPROVED
              Sidebar.tsx (12 role-filtered nav items, AdminRole-based hasRole filter), Topbar.tsx, ShellClient.tsx, DashboardLayout
              StatCard, DataTable, PageHeader in apps/admin/src/components/ui/
              globals.css with dark dashboard CSS custom properties
[x] TASK-034d | Admin: Overview page | ✅ APPROVED
              4 StatCards (Users/Calendar/TrendingUp/Banknote), 3 useQuery hooks, recent events DataTable
              Gold color via CSS custom property trick. Event.ticketType uses .price + .capacity
[x] DEV-001   | API auth bug fixes | ✅ APPROVED
              Fixed: login searched by username field (forms send email) → use email field
              Fixed: missing await on bcrypt.compare (any password was accepted)
              Fixed: duplicate body parser (bodyParser.json + express.json) — removed express.json, fixed "stream is not readable" 500 error
              Fixed: removed debug console.log statements from controllers/auth.js
[x] DEV-002   | Auth integration fixes | ✅ APPROVED
              Partner auth.ts: fixed API URL /login → /partner/auth/login, fixed data.partner → data.user
              Admin auth.ts: fixed API URL /admin/login → /admin/auth/login, fixed data.admin → data.user, removed 2FA handling
              Created apps/admin/src/app/api/auth/[...nextauth]/route.ts (was missing — caused all /api/auth/* to 404)
[x] URL-FIX-PARTNER | Partner: Fix middleware to protect short URLs + fix //login signOut bug | ✅ APPROVED
              middleware.ts: now protects all routes except /, /login, /forgot-password, /reset-password
              Redirect on login now goes to /overview (was /dashboard/overview)
              signOut callbackUrl fixed: '//login' → '/login'
[x] URL-FIX-ADMIN   | Admin: Move pages from (dashboard)/dashboard/* to (dashboard)/* for short URLs | ✅ APPROVED
              Moved all 22 page files up one level — removed the extra dashboard/ folder
              Sidebar.tsx: updated all hrefs from /dashboard/X → /X
              middleware.ts: now protects all routes except / and /login, redirects to /overview
[x] TASK-034e | Admin: Users list + detail | ✅ APPROVED
              users/page.tsx: DataTable, badge helper, session guard, GET /admin/users
              users/[id]/page.tsx: profile card, 4 StatCards, optional chaining throughout. tsc: 0 errors
[x] TASK-034f | Admin: Organizers list + detail | ✅ APPROVED
              organizers/page.tsx: filter isPartner client-side from GET /admin/users
              organizers/[id]/page.tsx: profile + 3 StatCards + events DataTable (filter by planner_id)
              Event.planner_id fully typed — no any needed. tsc: 0 errors
[x] TASK-034g | Admin: Events list + detail | ✅ APPROVED
              events/page.tsx: DataTable, Badge status, sold/capacity ratio, gold revenue
              events/[id]/page.tsx: InfoField helper, TicketTier DataTable, 4 StatCards. tsc: 0 errors
[x] TASK-034h | Admin: Payouts list + detail | ✅ APPROVED
              payouts/page.tsx: Bearer token pattern (same as overview), WithdrawRequest DataTable
              payouts/[id]/page.tsx: useMutation approve/reject, pending-only action buttons. tsc: 0 errors
[x] TASK-034i | Admin: KYC list + detail | ✅ APPROVED
              Fixed User.isVerify type: email/photo/idCard/address all optional booleans
              kyc/page.tsx: filter organizers, 6-col DataTable with vBadge helper
              kyc/[id]/page.tsx: single verifyMutation({ field }), GET /admin/auth/:id/verifykyc/:field. tsc: 0 errors
[x] TASK-034j | Admin: Face Enrollments list + detail | ✅ APPROVED
              face-logs/page.tsx: filter faceEnrolled:true, 5-col DataTable
              face-logs/[id]/page.tsx: DELETE /face/remove/:id with Bearer token, invalidates on success. tsc: 0 errors
[x] TASK-034k | Admin: Promoted events | ✅ APPROVED
              promoted/page.tsx: filter featured:true, + Feature an Event link
              promoted/[id]/page.tsx: toggleFeatured mutation, InfoField+tierColumns reused from events/[id]
              promoted/create/page.tsx: per-row feature mutation, featuringId state, createColumns inside component. tsc: 0 errors
[x] TASK-034l | Admin: Team management | ✅ APPROVED
              team/page.tsx: filter isAdmin:true, Invite Admin link
              team/[id]/page.tsx: removeAdmin via PUT with Bearer token, danger zone UI
              team/invite/page.tsx: POST /admin/auth/register {isAdmin:true}, uses @comfytag/ui Input + Button. tsc: 0 errors
[x] TASK-034m | Admin: Audit log + settings | ✅ APPROVED
              audit/page.tsx: static EmptyState + PageHeader — no API
              settings/page.tsx: GET/PUT /admin/users/:id, InfoRow helper at module level, name editable, email disabled, 3s success flash, AccountInfo card. tsc: 0 errors

#### Analytics
[x] TASK-035  | Admin: Analytics page (recharts + CSV export) | ✅ APPROVED
              7 module-level helpers (revenue/users/payouts by month, events by status, CSV export).
              AreaChart (revenue) + PieChart (status) + 2×BarChart (registrations, payouts).
              Tooltip typed via recharts ValueType. tsc: 0 errors

### ⏳ MILESTONE 5: Web + Mobile UI — IN PROGRESS

#### M5 Design Decisions (LOCKED — May 2026 design session)
See full decisions below. All 9 web sections designed and confirmed.

#### Backend Prerequisites (must complete before web pages)
[x] DEV-003a | Social models + endpoints (Comment, Like, Follow, notification triggers) | ✅ APPROVED
              Comment.js, EventLike.js, Follow.js models. 11 endpoints across like.js, comment.js,
              commentActions.js, follow.js routes. Event.js updated (recapPhotos, gateRules, featured).
              event.js trigger: notify followers on publish. app.js registered.
[x] TASK-034n | Admin: Category management + Area filter config + Seasonal config | ✅ APPROVED
              Category.js updated (slug, icon, gradient, isActive, sortOrder). types/index.ts Category
              interface updated. categories/page.tsx built (list, add/edit modal, live gradient preview,
              inline toggle). Sidebar.tsx: Categories nav item added.
[x] DEV-003b  | Commerce models + endpoints (Referral, Wallet, Alert/NotifyMe, TOTP, Search, SSE, Paystack verify) | ✅ APPROVED
              Referral.js, Wallet.js, Alert.js models. commerce.js: 12 controllers. 8 route files.
              Audience.js: totpSecret. Event.js: text index. audience.js: TOTP secret on create.
              app.js: all 8 routers registered (eventSearch before :id routes to prevent shadowing).

#### 5A: Web App Foundation
[x] TASK-036a | Web: Next.js scaffold + PWA + NextAuth (Credentials+Google+Apple conditional) + globals.css + middleware | ✅ APPROVED
              globals.css: ComfyTag light theme CSS vars. layout.tsx: Inter+JBMono+metadata+Providers.
              providers.tsx, next.config.ts (PWA), manifest.json, lib/api.ts, lib/auth.ts,
              api/auth/[...nextauth]/route.ts, middleware.ts, types/index.ts, .env.local.
              tsc: PASS
[x] TASK-036l | Web: UI component library (EventCard, CategoryCard, BottomSheet, AuthGateSheet, DigitalStub, OrganizerCard, StickyBottomBar, SearchInput) | ✅ APPROVED
              All 8 in apps/web/src/components/ui/ + barrel index.ts. tsc: 0 errors.

#### 5A: Web Auth
[x] TASK-036b | Web: Auth pages — login/register/forgot-password | ✅ APPROVED
              AuthLayout: 40/60 desktop split (animated gradient left panel) + mobile glassmorphism card
              login/page.tsx: credentials + Google + Apple SSO + magic-link toggle + forgot-password link
              register/page.tsx: name/email/password + Google + Apple SSO + terms links
              forgot-password/page.tsx: 3-step (identifier → OTP 6-box → new password), step indicator dots
              api/auth/magic-link/route.ts: stub (TODO: wire Resend). tsc: 0 errors.

#### 5A: Web Core Pages (dispatch in pairs)
[x] TASK-036c | Web: Home/Landing | ✅ APPROVED
              Navbar (sticky, logged-in/out states, avatar dropdown, bell), HeroSection (animated gradient, city detection via Nominatim, trending tags),
              CategoryPillsBar (sticky, horizontal scroll), EventFeedSection (trending row, date-grouped 2-col grid, like + AuthGateSheet, load more).
              app/page.tsx: server component fetches events + categories, MiniFooter. tsc: 0 errors.
[x] TASK-036e | Web: Search & Category | ✅ APPROVED
              search/page.tsx: 3 states (empty billboard w/ trending hashtags + category grid | predictive dropdown 300ms debounce grouped | results + date+price filters).
              Zero results: Notify Me form (POST /alerts). category/[slug]/page.tsx: gradient header + events grid.
              tsc: 0 errors.
[x] TASK-036d | Web: Event detail — swipeable hero, social proof bar, lineup, comments, location+Bolt/Uber, organizer card, sticky CTA, tier sheet | ✅ APPROVED
              EventHeroCarousel (5s auto-advance, 5 dot max, hover-pause), TicketTierSheet (BottomSheet wrapper, capacity bar, fee breakdown),
              CommentSection (pinned first, optimistic insert, load more, AuthGate for guests), events/[slug]/page.tsx (577 lines,
              IntersectionObserver hero → StickyBottomBar, Promise.allSettled secondary fetches). tsc: 0 errors.
[x] TASK-036i | Web: Organizer public profile — Spotify header, follow, stats, upcoming/past tabs | ✅ APPROVED
              organizer/[slug]/page.tsx: slug = organizer _id, derives name from events[0].planner,
              OrganizerCard variant="profile", live followerCount, tab bar (Upcoming asc / Past desc),
              unfollow confirm BottomSheet (danger + ghost buttons). tsc: 0 errors.
[x] TASK-036f | Web: Checkout — Paystack inline, guest form, fee breakdown, success confetti + OG shareable card + WhatsApp share, 3 failure states | ✅ APPROVED
              checkout/page.tsx: useSearchParams() in Suspense, 5-state machine (loading/ready/processing/success/failed),
              Paystack dynamic script, calculatePlatformFee(4%) + calculatePaystackFee, promo code (TODO endpoint).
              api/og/route.tsx: edge runtime, ImageResponse, event cover + "Just Got My Ticket!" badge. tsc: 0 errors.
[x] TASK-036g | Web: Ticket wallet — TOTP 30s QR, SSE scan state, Wake Lock, Send to Friend, Upcoming/Past tabs | ✅ APPROVED
              tickets/page.tsx: auth guard, Upcoming/Past tabs, TicketListItem (accent strip, status badges).
              tickets/[id]/page.tsx: DigitalStub reused, TOTP rotation + countdown, SSE scan state → promotes to ticket.status,
              Wake Lock, QR via external API URL, offline reference code fallback. tsc: 0 errors.

#### 5A: Web Supporting Pages
[x] TASK-036h | Web: Notifications page + bell inline panel | ✅ APPROVED
              Navbar.tsx updated: bell → button+panel (lazy fetch, unread dot, click-outside).
              notifications/page.tsx: TYPE_ICON map, relativeTime helper, NotifRow (keyboard a11y),
              optimistic read flip, load-more pagination. tsc: 0 errors.
[x] TASK-036j | Web: User profile + edit profile | ✅ APPROVED
              profile/page.tsx: avatar (image/initials fallback), name edit + PATCH /users/:id,
              3s success flash, disabled email, account type + Log Out. tsc: 0 errors.
[x] TASK-036k | Web: Hype Link hub — share link, copy, wallet balance + transactions | ✅ APPROVED
              hype-link/page.tsx: local WalletTransaction/WalletData interfaces, GET /wallet,
              copy with 2s feedback, conditional native share, +/− transaction rows. tsc: 0 errors.
[x] TASK-036m | Web: SEO metadata, OG, loading/error boundaries, 404 page | ✅ APPROVED
              layout.tsx: full OG/Twitter metadata, metadataBase. loading.tsx, error.tsx,
              not-found.tsx, events/[slug]/loading.tsx created. tsc: 0 errors.

#### 5B: Mobile Attendee Screens
[ ] TASK-037a | Mobile: Onboarding — Splash, Welcome, Login, Register | Est: L
[ ] TASK-037b | Mobile: HomeScreen + CategoryScreen | Est: M
[ ] TASK-037c | Mobile: EventDetailScreen + OrganizerProfileScreen | Est: M
[ ] TASK-037d | Mobile: SearchScreen | Est: S
[ ] TASK-037e | Mobile: Checkout — tier select → Paystack → confirmation | Est: L
[ ] TASK-037f | Mobile: TicketDetailScreen + TransferTicketScreen | Est: M
[ ] TASK-037g | Mobile: InboxScreen (notifications + deep linking) | Est: M
[ ] TASK-037h | Mobile: ProfileScreen + EditProfileScreen | Est: M
[ ] TASK-037i | Mobile: FollowingScreen + FaceEnrollmentStatusScreen | Est: S

#### 5C: Mobile Organizer Screens
[ ] TASK-037j | Mobile: Organizer DashboardScreen | Est: M
[ ] TASK-037k | Mobile: EventsListScreen + EventDetailScreen (organizer view) | Est: M
[ ] TASK-037l | Mobile: CreateEventScreen (5-step wizard) + EditEventScreen | Est: L
[ ] TASK-037m | Mobile: TicketTiersScreen + PromoCodesScreen + AudienceScreen | Est: M
[ ] TASK-037n | Mobile: CheckInScreen + ManualCheckInScreen | Est: M
[ ] TASK-037o | Mobile: PayoutsScreen + AccountScreen + BankScreen + KycScreen | Est: L

#### 5D: Polish Pass
[ ] TASK-038a | Polish: FaceEnrollmentScreen emoji → lucide-react-native Eye/EyeOff | Est: S
[ ] TASK-038b | Polish: Fix @react-navigation/native-stack TSC error | Est: S
[ ] TASK-038c | Polish: Token rgba opacity variants for mobile | Est: S
[ ] TASK-038d | Polish: Partner revenue endpoint + partner overview rewire | Est: M
[ ] TASK-038e | Polish: packages/ui deduplicate <style> injections | Est: S

---

## M5 DESIGN DECISIONS LOG (LOCKED)

### Hero Section
- Dark overlay hero → light #FAFAF9 content below (Option A)
- Animated WebP/GIF fallback for video background (progressive load)
- Geolocation → fallback to Ilorin, Kwara State (launch city)
- Category tags API-driven from admin panel (never hardcoded)
- Logged-in hero: personalized greeting + city-specific feed
- Hero copy: "Don't hear about it, be there."
- Sub-copy: "Find your next vibe in [City]."
- PWA: confirmed (next-pwa, installable, offline-capable)
- PWA install prompt: surfaces after first ticket purchase

### Event Feed
- Layout: Trending horizontal row → date-grouped 2-col grid → infinite scroll
- Card: image dominant, gradient overlay, title + date + location + price + 1 badge
- Badge priority: Almost Sold Out → Fast Selling → Free → VIP Left → New
- Capacity bar: visible only >50% sold; "Be the first" copy at 0%
- Like = Save (one ♥ = public like + private save)
- Like count + comment count on feed card
- Promoted listing card every ~15 cards
- Area filter: admin-configurable per city (Ilorin areas for launch)
- Social layer: flat comments Phase 1, threading Phase 2
- Empty comment state: "Who's going?" · "What to wear?" · "Sharing a ride?"
- Comment deletion: owner + organizer + admin
- Organizer can pin one comment

### Event Detail Page
- Hero: swipeable carousel (photos + video), paginated dots
- Transparent nav: Back + Share only
- Sticky CTA: appears when hero scrolls out of view (IntersectionObserver)
- Social proof bar: generic attending count (friend avatars Phase 2)
- Bottom sheet: tiers + capacity bars + qty selector + full fee breakdown
- Fee transparency: platform fee (4%) + processing fee shown
- Lineup: horizontal scroll, visual artist cards, tap → filtered events
- Location: address + Open in Maps + Bolt first, Uber second
- Share: native OS share sheet, pre-filled WhatsApp Pidgin copy
- Related Events row after organizer section
- Hype Links: full launch — Referral + Wallet + ₦500 credit on conversion
  Share copy: "Omo, you dey go [Event]? 🔥 Use my link: [url]"
- Comments: flat, logged-in to post, read-only for guests
- Empty comment: suggested prompts ("Who's pulling up to this?")

### Checkout Flow
- Paystack inline modal (zero redirects)
- Guest checkout: Name + Email + Phone only
- Phone field hint: "We'll send your ticket to this number via WhatsApp"
- Existing account detection on email entry
- Post-purchase: magic link to email (set password, 24h expiry)
- Success: confetti + haptic (Android) + "Ticket Secured!"
- Shareable card: @vercel/og server-generated (/api/og?eventId=xxx)
  Card includes: event poster + "Just Got My Ticket 🎟️" badge + Hype Link QR
- Share targets: WhatsApp (pre-filled Pidgin) + IG Stories
- Ticket delivery: WhatsApp via YCloud (primary) → Termii SMS → Resend email
- Payment failure: 3 distinct states by failure type
- "Debited but no ticket?" → POST /paystack/verify/:reference
- Saved cards: Paystack authorization_code on User.paymentMethods[]

### Ticket Wallet
- Digital stub with CSS perforation tear line + notch circles
- Rotating TOTP QR: 30s refresh, countdown timer, smooth fade transition
- Live pulsing dot indicator (● LIVE)
- Used state: greyscale card + diagonal "Entry Granted ✅" stamp + scan timestamp
- SSE stream for real-time scan state: GET /tickets/:id/status
- Wake Lock API + white QR background + brightness toast
- PWA offline cache: static QR + ref code fallback banner
- Two tabs: Upcoming + Past Events (moves T+24h after event)
- Send to Friend: WhatsApp claim link → forced signup → auto-return after 48h
- Post-event: T+24h email + WhatsApp trigger
- Apple/Google Wallet: deferred Phase 2 ("Save to Wallet — coming soon")
- Gate rules: organizer-managed per event (gateRules: string[])

### Navigation & Layout
- Mobile bottom nav: 4 tabs (Home, Explore, Tickets, Profile)
  Glassmorphism dark bg, brand purple active, hidden on ticket stub page only
- Ticket tab: red dot when today's event ticket exists
- Logged-out top nav: logo + search + Log In text + Sign Up pill
- Logged-in top nav: logo + search + bell (unread dot) + avatar
- Bell tap: inline notification panel slides down (5 items + see all)
- Avatar tap: right-side drawer
  Drawer contents: Hype Credits balance, My Tickets, Saved Events, My Hype Link, Settings, Log Out
- "List Your Event" → desktop nav + desktop mini-footer
- Mobile: no footer
- Desktop: single-band mini-footer (Paystack badge + socials + legal)

### Auth Pages
- Google Sign-In: mandatory, "Continue with Google" pill
- Apple Sign-In: included (free Apple developer enrollment)
- Register: Name + Email + Password only (phone at checkout only)
- Magic link: offered alongside password, recommended path
- Desktop: 60/40 split (rotating featured event image / auth form)
- Mobile: glassmorphism card on blurred event background
- Auth gate bottom sheet: Heart + Comment + Hype Link taps → SSO or magic link
- Error states: empathetic, action-oriented copy
- SSO: auto-create account if email new; auto-link if exists

### Organizer Public Profile
- Spotify-style header: cover photo + overlapping avatar (-20px)
- Verified badge: isPartner + all KYC fields = auto-derived (no DB change)
- Stats row: Events · Followers · Tickets Sold
- Social links: IG + TikTok + X
- Contact: WhatsApp deep link (pre-filled context)
- Two tabs: Upcoming (feed cards) + Past Events (poster + attended + recap photos)
- Recap photos: organizer uploads post-event (Event.recapPhotos: string[])
- Follow toggle: inline on event detail card + profile page
- Unfollow: confirm bottom sheet
- Follow → new event published → push + email all followers

### Search & Category
- Three states: empty billboard, predictive dropdown, results page
- Empty: trending hashtags + Spotify-style category grid
- Category card colors: admin-set gradient per category
- Predictive: 300ms debounce, grouped (events / artists / organizers), max 3 per group
- Date pills: Today · Tomorrow · This Weekend + custom
- Price filters: Free · Under ₦5k · Under ₦10k
- Map view: city-level Mapbox pins (launch); exact venue pins Phase 2
- Zero results: Notify Me button + trending fallback
- Notify Me count shown publicly on zero-results page
- Sponsored search: existing featured flag, "Sponsored" badge
- Detty December takeover: Nov 1 – Jan 5, admin-overridable via GET /config/seasonal
- MongoDB $text index on event name + description + address

### New API Endpoints (DEV-003a + DEV-003b)
Social (DEV-003a):
  POST   /events/:id/like              toggle like/save
  GET    /events/:id/like/status
  GET    /events/saved
  POST   /events/:id/comments
  GET    /events/:id/comments          paginated, pinned first
  DELETE /comments/:id                 owner/organizer/admin
  POST   /comments/:id/pin             organizer only
  POST   /comments/:id/report
  POST   /organizers/:id/follow        toggle follow/unfollow
  GET    /organizers/:id/follow/status
  GET    /organizers/:id/stats         followerCount, eventCount, totalSold

Commerce/Search (DEV-003b):
  GET    /events/search                full-text + filters
  GET    /search/suggestions           predictive dropdown
  POST   /alerts                       Notify Me (artist/organizer)
  GET    /search/trending              top 6 this week
  GET    /referral/:eventId            get/create hype link
  POST   /referral/apply               apply on purchase
  GET    /wallet                       user balance + transactions
  GET    /events/:id/token             TOTP 30s token
  GET    /tickets/:id/status           SSE stream (scan state)
  GET    /config/seasonal              seasonal takeover config
  POST   /paystack/verify/:reference   verify charge manually

New Models: Comment, Referral, Wallet, Alert
New Event fields: recapPhotos: string[], gateRules: string[]
New User fields: paymentMethods: PaymentMethod[]
Paystack webhook: on success → check referral → credit ₦500 wallet

---

## DEV-FIXES MILESTONE — COMPLETE ✅

**All 20 bugs diagnosed and fixed (May 15–16, 2026):**

### 🔴 CRITICAL (5 fixed)
- ✅ DEV-004 | API: Added forgot-password / verify-otp / reset-password endpoints
- ✅ DEV-005 | API: Fixed transfer ObjectId vs string ownership checks
- ✅ DEV-006 | Partner: Added auth tokens to overview/events/event-detail pages
- ✅ DEV-007 | Partner: Added auth tokens to withdraw page
- ✅ DEV-008 | Admin: Fixed 2FA OTP forwarding + backend validation

### 🟠 HIGH (4 fixed)
- ✅ DEV-009 | API: Fixed comment pin ObjectId vs string comparison
- ✅ DEV-010 | API: Restored auth middleware on all event write routes
- ✅ DEV-011 | API: Auth-gated 5 previously unauthenticated endpoints
- ✅ DEV-012 | Admin: Changed role fallback from super_admin to VIEWER

### 🟡 MEDIUM (5 fixed)
- ✅ DEV-013 | API: Whitelist query params in getAllEvents (fix NoSQL injection)
- ✅ DEV-014 | API: Removed verifyUser from email verification route
- ✅ DEV-015 | API: Mounted testimonialRouter in app.js
- ✅ DEV-016 | Partner: Fixed forgot-password route prefix (/partner/auth/*)
- ✅ DEV-017 | Admin+API: Changed KYC verify from GET to PUT

### 🔵 LOW (6 fixed)
- ✅ DEV-018 | API: Fixed verifyAdmin status code (404 → 403)
- ✅ DEV-019 | Partner: Session refresh after profile name save
- ✅ DEV-020 | API: Removed duplicate verifyUser on withdraw DELETE
- Plus 3 others covered in above batches

**Verification Required Before Milestone 5:**
1. Partner password reset flow (forgot-password endpoint works)
2. Ticket transfers (ownership checks pass)
3. Partner cancel event (PATCH succeeds with auth)
4. Partner withdraw history (loads without 401)
5. Admin KYC verification (PUT saves correctly)
6. Admin 2FA (OTP flow works end-to-end)
7. Event create/update/delete secured (requires auth)
8. Email verification (works without login)
9. Ticket creation secured (requires auth)
10. All sensitive endpoints gated

---

## NEXT ACTION
✅ COMPLETE VERIFICATION OF ALL 20 FIXES, THEN RESUME MILESTONE 5

NEXT: Run manual smoke tests on the 10 verification points above
Then: TASK-037a (Mobile onboarding) + TASK-037b (Mobile HomeScreen + CategoryScreen) — dispatch in parallel
Then: Mobile screens 037a–037o
Then: Polish pass 038a–038e

---

## ENVIRONMENT & CONFIG NOTES
- EXPO_PUBLIC_FACE_SDK_KEY: empty string (mock mode active) — real SDK pending KBY-AI license
- EXPO_PUBLIC_API_URL: http://localhost:4002
- EXPO_PUBLIC_PAYSTACK_KEY: pk_test_xxxxxxxxxxxx
- Docker services: mongodb (local port 27018→container 27017), redis (local port 6380→container 6379), api (4002)
- MongoDB connection: MONGO=mongodb://admin:changeme@localhost:27018/comfytag?authSource=admin
- Partner: NEXT_PUBLIC_API_URL=http://localhost:4002 | NEXTAUTH_URL=http://localhost:3001
- apps/partner runs on port 3001, apps/admin on port 3002, apps/web on port 3000

---

## KNOWN TECHNICAL DEBT
- ~~TASK-031b: double-slash in API call~~ — FIXED (DEV-002)
- TASK-031d: packages/ui Button/Skeleton/LoadingSpinner inject <style> tags on every render — no deduplication. Acceptable now; refactor to CSS modules in M5 polish pass.
- TASK-026: FaceEnrollmentScreen.tsx imports @react-navigation/native-stack (not installed) — 1 pre-existing TSC error. Fix in M5.
- Mobile ForgotPasswordScreen: emoji eye-toggles (🙈 👁) — switch to lucide-react-native Eye/EyeOff in M5
- Token rgba opacity variants missing in mobile — inline rgba() used in face screens. Fix in M5.
- Revenue stat on partner overview: no dedicated API endpoint — client-side derivation only. Build endpoint in M5.

---

## OPEN QUESTIONS / DEFERRED DECISIONS
[ ] KBY-AI SDK license — no action until received; faceSDK.ts is the only file to update
[ ] Token rgba opacity variants — deferred to M5
[ ] Partner overview revenue endpoint — deferred to M5

---

## SESSION NOTES
- Partner app is now fully on App Router. Pages Router codebase completely deleted.
- All mobile face screens use sp/rd/fs numeric helper pattern — copy from IncomingTransferScreen.tsx for any new RN screen.
- Transfer accept is intentionally frictionless (PM decision): no camera, no re-enrollment. Server updates faceOwner on POST /tickets/transfer/accept.
- FaceCheckInScreen camera only mounted in idle/liveness/capturing — unmounted in verifying/matched/noMatch/error states.
- @react-navigation/stack is installed; @react-navigation/native-stack is NOT — always use StackNavigationProp from @react-navigation/stack.
- getUserAudience (/audience/user/:userId) returns tickets bought BY a user — NOT tickets sold for their events. Do not use for partner revenue stats.
- getPlannerEvents (/events/user/:userId) returns Event[] where planner_id matches. Event has: _id, name, planner_id, planner, date, event_date, status, images[], table ([{ticket_title, ticket_price}]), sold (number), address, state, ticketType.



## PARTNER AND ADMIN ACCESS
 Partner  email=partner@comfytag.dev  password=TestPass123!
  Admin    email=admin@comfytag.dev    password=Admin123!

---

## PENDING USER ACTIONS (do before build starts)

### 1. WhatsApp Message Templates (Meta approval — 24–72h wait)
Submit via YCloud dashboard. Required before launch.
  Template 1 — ticket_confirmed:
    "Your ticket for {{1}} is confirmed 🎟️ Ref: {{2}} Venue: {{3}} View: {{4}}"
  Template 2 — event_reminder:
    "{{1}} is tomorrow! 🔥 Your ComfyTag ticket is ready. View it here: {{2}}"
  Template 3 — transfer_received:
    "{{1}} sent you a ticket for {{2}} on ComfyTag. Accept it here: {{3}}"

### 2. Google OAuth Credentials
  → console.cloud.google.com → APIs & Services → Credentials → Create OAuth 2.0 Client ID
  → Authorised redirect URI: http://localhost:3000/api/auth/callback/google
  → Add to apps/web/.env.local: GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET

### 3. Apple Sign-In Setup (free Apple Developer enrollment)
  → developer.apple.com → Certificates → Sign In with Apple
  → Add to apps/web/.env.local: APPLE_ID + APPLE_TEAM_ID + APPLE_PRIVATE_KEY






  