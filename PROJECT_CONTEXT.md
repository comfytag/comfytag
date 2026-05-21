Perfect. Then create this **single master file** in the repo root:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**FILE: `PROJECT_CONTEXT.md`** (at monorepo root)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```markdown
# ComfyTag — Complete Project Context

**Project Path:** `C:\Users\HOMEPC\Desktop\Web_Projects\Personal\comfytag`

**Last Updated:** May 2026

**Current Status:** Milestone 2 complete. Milestone 3 in progress (TASK-026 complete, TASK-027 next).

---

## PROJECT OVERVIEW

**What:** ComfyTag — Biometric-first event ticketing platform for Nigeria.
**Your Face is Your Ticket** — attendees enroll once, show face at entry (no QR needed). Organizers check-in via face recognition. Tickets can be transferred with instant face sync.

**Target:** Nigerian event organizers (solo first) + attendees aged 18–35 (Gen Z/millennials).

**Revenue Model:** 
- A+C+D: 4–5% success fee per ticket (0% on free events)
- Biometric check-in premium per event
- Promoted listings

**Differentiator:** Earnings dashboard + facial recognition (competitors: Tix Africa 8%, TixTango, Eventbrite, Selar 4%, Syticks 3.5%).

---

## MONOREPO STRUCTURE

```
comfytag/
├── apps/
│   ├── api/              Express.js + MongoDB (port 4002)
│   ├── web/              Next.js App Router (port 3000) — 23 routes
│   ├── partner/          Next.js Pages Router (port 3001) — 26 routes
│   ├── admin/            Next.js App Router (port 3002) — 30 routes
│   └── mobile/           Expo + React Native
├── packages/
│   ├── types/            18 shared TypeScript types
│   ├── utils/            15 shared utility functions + constants
│   └── ui/               Design tokens (v1.1) — no components yet
├── docker-compose.yml
├── design.md (v1.1)      LOCKED — colour validated by MKT + PSY
├── .env.example
├── package.json (turbo)
├── pnpm-workspace.yaml
└── turbo.json
```

**Package Manager:** pnpm 11.0.9  
**Build Tool:** Turborepo 2.9.12  
**Node:** 20 LTS  

---

## MILESTONE COMPLETION

### ✅ MILESTONE 0: Security & Cleanup
- Removed: `/good partner`, `/partner - Copy`, `/myclient`, `/client`, `/anchor`
- Fixed: 12 dead files, 4 undefined imports
- Git history: checked, old credentials marked for abandonment

### ✅ MILESTONE 1: Monorepo Foundation
- [x] TASK-006 | Turborepo + pnpm scaffold
- [x] TASK-007 | apps/api moved + Docker + backup script
- [x] TASK-008 | apps/partner moved
- [x] TASK-009 | apps/web scaffolded (23 routes)
- [x] TASK-010 | apps/admin scaffolded (30 routes)
- [x] TASK-011 | apps/mobile scaffolded (44 screens)
- [x] TASK-012 | packages/types (18 types)
- [x] TASK-013 | packages/utils (15 utilities)
- [x] TASK-014 | packages/ui (design tokens only)

### ✅ MILESTONE 2: Backend Stabilisation
- [x] TASK-015 | audience.js — User import added
- [x] TASK-016 | bank.js — wrong model refs fixed (Bank→Withdraw)
- [x] TASK-017 | verifyToken.js — undefined err removed
- [x] TASK-018 | CORS — wildcard replaced with origin whitelist
- [x] TASK-019 | dual check-email — consolidated to one endpoint
- [x] TASK-020 | QRCode.js — callback hell fixed, now async
- [x] TASK-021 | Concerts model — unused change stream removed
- [x] TASK-022 | User model — 4 face fields added
- [x] TASK-023 | Audience model — 11 face + transfer fields added
- [x] TASK-024 | 14 new API endpoints across 6 new files

### 📍 MILESTONE 3: Facial Recognition Core (IN PROGRESS)
- [x] TASK-025 | KBY-AI SDK adapter (mock-first)
- [x] TASK-026 | Face enrollment screen (525 lines, 5 states, animations)
- [ ] TASK-027 | Transfer acceptance screen (simplified — no re-enroll) ← NEXT
- [ ] TASK-028 | Organizer check-in screen (full-screen green/red)
- [ ] TASK-029 | SMS OTP fallback (Termii integration)
- [ ] TASK-030 | Offline ticket cache (AsyncStorage)

### ⏳ MILESTONE 4: Partner Dashboard
- [ ] TASK-031a–031o | Dashboard screens + API wiring
- [ ] TASK-034a–034m | Admin screens + role-based access
- [ ] TASK-035 | Analytics dashboards

### ⏳ MILESTONE 5: Web + Mobile UI
- [ ] TASK-036a–036m | Web app full screens
- [ ] TASK-037a–037o | Mobile attendee + organizer screens
- [ ] Reusable component library (packages/ui/src/components/)

---

## DESIGN SYSTEM (LOCKED v1.1)

### Brand Colour
**`#7C3AED`** — Deep violet-purple  
✅ Validated by MKT + PSY for Gen Z/millennials (51% choose brand by colour)  
✅ Consistent across all 4 apps  
✅ 80% brand recognition increase with colour consistency  

### Colour Context Rules
**Public Apps (web, mobile attendee):**
- Background: `#FAFAF9` (warm off-white)
- Surface: `#FFFFFF`
- Text primary: `#1C1917`
- Success: `#10B981`
- Energy (FOMO): `#F59E0B` (amber — use for Trending, Tonight, Selling Fast badges ONLY)
- Error: `#EF4444`

**Dashboard Apps (partner, admin organizer):**
- Background: `#0F0F0F` (dark)
- Surface: `#1A1A1A`
- Text primary: `#F5F5F4`
- Success: `#10B981`
- Financial: `#D97706` (gold — revenue/payouts ONLY, never on public site)
- Warning: `#F59E0B` (amber)
- Error: `#EF4444`

### Badge Colour Map (12 types)
```
upcoming:    bg:#FEF3C7 text:#92400E
live:        bg:#D1FAE5 text:#065F46
ended:       bg:#F5F5F4 text:#78716C
soldOut:     bg:#FEE2E2 text:#991B1B
draft:       bg:#F5F3FF text:#5B21B6
trending:    bg:#FEF3C7 text:#92400E  (energy amber)
tonight:     bg:#FEF3C7 text:#92400E  (energy amber)
sellingFast: bg:#FEF2C7 text:#92400E  (energy amber)
verified:    bg:#7C3AED text:#FFFFFF
pending:     bg:#FEF3C7 text:#92400E
rejected:    bg:#FEE2E2 text:#991B1B
approved:    bg:#D1FAE5 text:#065F46
```

### Typography
- **Sans:** Inter Variable (UI text, all apps)
- **Mono:** JetBrains Mono (IDs, codes, OTPs, transaction amounts)

### Spacing (4pt grid)
1: 4px, 2: 8px, 3: 12px, 4: 16px, 5: 20px, 6: 24px, 8: 32px, 10: 40px, 12: 48px, 16: 64px, 20: 80px, 24: 96px

### Border Radius
sm: 6px, md: 12px, lg: 16px, xl: 20px, 2xl: 24px, full: 9999px

### Motion
- Duration: micro 100ms, fast 200ms, **default 250ms**, entrance 300ms
- Easing: entrance cubic-bezier(0, 0, 0.2, 1), standard cubic-bezier(0.4, 0, 0.2, 1)
- **Rule:** Purposeful motion only — no decorative animations

### Access All Tokens
```typescript
import { 
  colors, spacing, radius, shadows, motion, typography, layout 
} from '@comfytag/ui/tokens'
```

**See:** `design.md` (locked, read-only)

---

## FACE RECOGNITION ARCHITECTURE

### SDK Strategy: KBY-AI (License TBD)

**Current Status:** Mock-first (no license yet)

**Adapter Pattern:**
```
apps/mobile/src/lib/faceSDK.ts
├── enrollFace()       — async, returns template + scores
├── verifyFace()       — async, compares two templates
├── checkLiveness()    — async, detects real face
└── getSDKStatus()     — sync, returns licensed status
```

**Import in screens:**
```typescript
import { enrollFace, verifyFace, checkLiveness } from '../../lib/faceSDK'
```

**Never import KBY-AI directly in screens — always go through faceSDK adapter.**

### Mock Implementation (current)
- enrollFace(): 2000ms delay, returns mock template
- verifyFace(): 800ms delay, matches if both templates non-empty
- checkLiveness(): 1500ms delay, always returns isLive: true
- IS_REAL_SDK flag: checks EXPO_PUBLIC_FACE_SDK_KEY length > 10

### Real SDK (on license arrival)
1. Install: `pnpm add kby-ai-face-recognition` (or actual package name)
2. Add: `EXPO_PUBLIC_FACE_SDK_KEY=your_license_key` to `apps/mobile/.env`
3. Replace mock implementations in faceSDK.ts only
4. **Zero changes to screens, routes, or other files**

### Data Security
- Face templates: **encrypted on-device, never sent raw**
- Server stores: encrypted base64 template only
- Transfer: template stays on device, synced via API
- Deletion: POST /face/remove removes server copy

---

## TICKET TRANSFER FLOW (CORRECTED)

### User Journey
1. **Sender** initiates transfer → POST /tickets/transfer/initiate
   - Recipient gets notification
   
2. **Recipient** opens notification → sees IncomingTransferScreen
   - Shows: event name, date, venue, ticket type, sender name
   - Alert: "Accept Ticket?" confirmation
   
3. **Recipient** accepts → **INSTANTLY synced to enrolled face**
   - ✅ NO camera, NO re-enrollment
   - API call: POST /tickets/transfer/accept { ticketId, transferToken }
   - Server: updates ticket ownership + face owner to recipient
   - Server: unlinks sender's face from ticket
   
4. **Recipient** can now check in
   - Priority: face (if enrolled) → QR (fallback) → manual (last resort)

### Check-in Methods (Priority)
```
1. Face recognition (fastest, no phone needed)
   → verifyFace(captured, storedTemplate)
   → if match: green screen + entry
   → if no match: red screen + deny

2. QR code scan (works for everyone)
   → manual verification by organizer
   → accept/reject

3. Manual search (name/email/phone)
   → organizer finds attendee in list
   → mark present
```

### Important: NO FRICTION for non-enrolled users
- Users CAN skip face enrollment during onboarding
- Can re-enroll anytime from Profile → "Set up face entry"
- QR always works — no gating
- Face is **convenience**, not requirement

---

## API ENDPOINTS (COMPLETE LIST)

### NEW ENDPOINTS (TASK-024)

**Auth:**
- `PUT /auth/register-organizer/:userId` (verifyUser)

**Face Recognition:**
- `POST /face/enroll/:userId` (verifyUser) — stores template
- `POST /face/verify` (verifyUser) — organizer check-in match
- `DELETE /face/remove/:userId` (verifyUser) — remove template

**Ticket Transfer:**
- `POST /tickets/transfer/initiate` (verifyUser) — send transfer
- `POST /tickets/transfer/accept` (verifyUser) — accept (no re-enroll)
- `POST /tickets/transfer/decline` (verifyUser) — reject transfer
- `GET /tickets/transfer/incoming` (verifyUser) — pending transfers

**Notifications:**
- `GET /notifications` (verifyUser) — paginated, ?unread=true filter
- `PUT /notifications/:id/read` (verifyUser) — mark single read
- `PUT /notifications/read-all` (verifyUser) — mark all read

**Push Tokens:**
- `POST /push-tokens` (verifyUser) — register device token
- `DELETE /push-tokens` (verifyUser) — deregister on logout

**Events:**
- `GET /events/feed` — personalised feed (home screen)
- `GET /events/nearby` — events by Nigerian state

### EXISTING ENDPOINTS (Pre-TASK-024)
- Auth: register, login, verify-email, forgot-password, reset-password
- Events: CRUD + 8 filter endpoints
- Audience: CRUD + user/event queries
- Category, Bank, Withdraw, Users, Admin routes (all operational)

**See:** apps/api/routes/ for all implementations

---

## DATA MODELS

### User.js
```
Core:
  token, username, name, email, businessName, phone, password,
  events, isAdmin, isPartner, image, bgImg, address, verify, 
  isVerify, onboarding, premium

Face Recognition (TASK-022):
  faceEnrolled: boolean (default: false)
  faceTemplate: string (select: false) — encrypted, never in API responses
  faceEnrolledAt: Date (when enrolled)
  faceEnrollmentDevice: string (which device, select: false)
```

### Audience.js (Tickets)
```
Core:
  name, event_id, user_id, eventname, amount, numOfTicket,
  reference, type, date, phone, email

Face & Transfer (TASK-023):
  status: 'active' | 'used' | 'transferred' | 'refunded'
  qrCode: string (server-generated QR data URL)
  faceOwner: string (user_id of face owner, changes on transfer)
  faceLinkedAt: Date (when face linked)
  transferredTo: string (recipient user_id)
  transferredFrom: string (original owner user_id, audit trail)
  transferredAt: Date
  transferToken: string (one-time acceptance token, select: false)
  checkedIn: boolean
  checkedInAt: Date
  checkedInMethod: 'face' | 'qr' | 'manual'
```

### Notification.js (NEW, TASK-024)
```
user_id: string (index: true)
type: enum [
  'ticket_confirmed', 'transfer_received', 'transfer_accepted',
  'transfer_declined', 'event_reminder', 'new_event_from_following',
  'payout_approved', 'payout_rejected', 'kyc_approved', 'kyc_rejected'
]
title: string
message: string
read: boolean (default: false, index: true)
data: mixed (flexible payload for deep linking)

Indexes:
  - user_id (single)
  - read (single)
  - user_id + read + createdAt (compound, for efficient queries)
  - TTL: auto-delete at 90 days
```

### PushToken.js (NEW, TASK-024)
```
user_id: string (index: true)
token: string (unique)
platform: 'ios' | 'android'
deviceId: string (optional)
active: boolean (default: true, index: true)
```

### Event.js
- Schema: 80 lines, untouched in TASK-021
- Removed: Concerts model (unused change stream, 6 lines)

---

## MOBILE SCREENS (44 TOTAL)

### Onboarding (6 screens)
- ✅ **SplashScreen.tsx** — placeholder
- ✅ **WelcomeScreen.tsx** — placeholder
- ✅ **LoginScreen.tsx** — placeholder
- ✅ **RegisterScreen.tsx** — placeholder
- ✅ **ForgotPasswordScreen.tsx** — placeholder
- ✅ **FaceEnrollmentScreen.tsx** — 525 lines, COMPLETE
  - 5 states: idle | scanning | processing | success | error
  - Animated oval with pulse + border colour animation
  - Liveness check → enrollment → optional skip
  - Skip blocked in transfer mode
  - Trust footer: "encrypted on device, never shared"

### Attendee Discover (4 screens)
- HomeScreen.tsx — event feed
- EventDetailScreen.tsx — full event info + ticket purchase
- OrganizerProfileScreen.tsx — organizer public profile
- CategoryScreen.tsx — events filtered by category

### Attendee Search (1 screen)
- SearchScreen.tsx — search events by name/location

### Attendee Tickets (4 screens)
- MyTicketsScreen.tsx — ticket wallet + QR codes
- TicketDetailScreen.tsx — single ticket, transfer button
- TransferTicketScreen.tsx — initiate transfer form
- ✅ **IncomingTransferScreen.tsx** — 7 states, TO BUILD (TASK-027)
  - loading | review | confirming | success | declined | error
  - Ticket card, face notice, accept/decline buttons
  - Accept → API call only (NO re-enroll) ← REVISED

### Attendee Inbox (1 screen)
- InboxScreen.tsx — notifications + deep linking

### Attendee Profile (4 screens)
- ProfileScreen.tsx — user info, stats, follow
- EditProfileScreen.tsx — edit name, avatar, bio
- FollowingScreen.tsx — organizers followed
- FaceEnrollmentStatusScreen.tsx — re-enroll from profile

### Organizer Dashboard (1 screen)
- DashboardScreen.tsx — quick stats, event list, payouts

### Organizer Events (7 screens)
- EventsListScreen.tsx — all created events
- EventDetailScreen.tsx — event analytics, edit, actions
- CreateEventScreen.tsx — 5-step wizard
- EditEventScreen.tsx — modify event
- TicketTiersScreen.tsx — manage ticket types
- PromoCodesScreen.tsx — discount codes
- AudienceScreen.tsx — attendee list, check-in status

### Organizer Check-in (3 screens)
- CheckInScreen.tsx — placeholder
- ✅ **FaceCheckInScreen.tsx** — TO BUILD (TASK-028)
  - Camera → liveness check → face capture → verifyFace()
  - Full-screen green (match) or red (no match) result
  - Manual fallback button
- ManualCheckInScreen.tsx — name/email search

### Organizer Payouts (1 screen)
- PayoutsScreen.tsx — earnings, withdrawal requests

### Organizer Account (3 screens)
- AccountScreen.tsx — organizer settings
- BankScreen.tsx — bank details for payouts
- KycScreen.tsx — KYC verification status

---

## SHARED PACKAGES

### packages/types/src/index.ts (18 exports)
```
Interfaces:
  User, AuthResponse, TicketTier, Performer, Event,
  Ticket, BankAccount, WithdrawRequest, Category,
  Notification, PromoCode, AdminUser, AuditLog,
  ApiResponse<T>, PaginatedResponse<T>, FaceLog

Types:
  NotificationType, AdminRole
```

**Usage:**
```typescript
import { User, Event, Ticket } from '@comfytag/types'
```

### packages/utils/src/index.ts (15 exports)
```
Functions:
  formatNaira(amount) — Nigerian Naira formatting
  formatDate(dateString) — date formatting
  formatTime(dateString) — time formatting
  isToday(dateString) — boolean
  isUpcoming(dateString) — boolean
  timeUntil(dateString) — "2d 4h away" string
  slugify(text) — URL-safe slug
  truncate(text, maxLength) — ellipsis
  initials(name) — "AB" from "Alice Bob"
  calculatePlatformFee(amount, feePercent) — 4–5%
  calculatePaystackFee(amount) — Paystack 1.5% + ₦100
  totalCharges(amount) — { platformFee, paystackFee, total }
  isValidEmail(email) — regex check
  isValidNigerianPhone(phone) — +234 or 0 format

Constants:
  STORAGE_KEYS — { AUTH_TOKEN, USER, APP_MODE, PUSH_TOKEN }
```

**Usage:**
```typescript
import { formatNaira, isValidNigerianPhone, STORAGE_KEYS } from '@comfytag/utils'
```

### packages/ui/src/tokens/index.ts
```
colors — brand, public, dashboard, text, semantic, badges, gradients, chart
spacing — 1–24
containers — narrow, standard, wide, full
radius — sm, md, lg, xl, 2xl, full
shadows — sm, md, lg, xl
motion — duration, easing
typography — fontFamily, fontSize (with weight), weight constants
layout — navHeight, sidebarWidth, tabBarHeight, mobileNavHeight
```

**Usage:**
```typescript
import { colors, spacing, typography } from '@comfytag/ui/tokens'

// In styles:
backgroundColor: colors.brand.DEFAULT,
fontSize: typography.fontSize.lg.size,
paddingHorizontal: spacing[4],
```

---

## ENVIRONMENT VARIABLES

### apps/api/.env.example
```
MONGO_ROOT_USER=admin
MONGO_ROOT_PASS=changeme
WEB_URL=http://localhost:3000
PARTNER_URL=http://localhost:3001
ADMIN_URL=http://localhost:3002
JWT_SECRET=your_secret_key
RESEND_API_KEY=your_resend_key
PAYSTACK_SECRET_KEY=sk_test_xxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxx
TERMII_API_KEY=your_termii_key
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
YCLOUD_API_KEY=your_ycloud_key
```

### apps/mobile/.env.example
```
EXPO_PUBLIC_FACE_SDK_KEY=
EXPO_PUBLIC_API_URL=http://localhost:4002
EXPO_PUBLIC_PAYSTACK_KEY=pk_test_xxxxxxxxxxxx
```

Leave `EXPO_PUBLIC_FACE_SDK_KEY` empty until KBY-AI license arrives.

### apps/web/.env.example
```
NEXT_PUBLIC_API_URL=http://localhost:4002
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
```

---

## DOCKER & LOCAL DEV

### docker-compose.yml
```
Services:
  mongodb:4002 → MongoDB with auth (admin:changeme)
  redis:6379 → Redis for caching
  api:4002 → Express API (depends on mongo, redis)

Volumes:
  mongodb_data, mongodb_config, redis_data (persisted between runs)

Networks:
  comfytag-network (bridge)
```

### Launch
```bash
docker-compose up -d
# MongoDB: localhost:27017
# Redis: localhost:6379
# API: http://localhost:4002
```

### MongoDB Backup
```bash
# Manual: apps/api/scripts/backup-mongo.sh
# Cron: 0 2 * * * /path/to/backup-mongo.sh
# Output: /backups/mongodb/
# TTL: keeps last 7 days
```

---

## ARCHITECTURAL DECISIONS (WHY)

### KBY-AI Adapter Pattern
- **Why:** SDK license might delay. Mock-first lets dev continue.
- **Benefit:** When license arrives, swap one file, everything else unchanged.
- **Never direct imports:** All screens import from faceSDK adapter, not KBY-AI.

### No Component Stubs
- **Why:** DRY principle. Build once, use everywhere.
- **Benefit:** FaceEnrollmentScreen built fully in TASK-026, reused in onboarding + profile.
- **When:** Milestone 4+, all components go into packages/ui/src/components/.

### Data Model Indexing
- **Why:** Performance at scale.
- **Compound indexes:** Notification (user_id + read + createdAt) for efficient pagination.
- **TTL indexes:** Auto-delete notifications after 90 days.

### CORS Whitelist
- **Why:** Security. Wildcard origin removed.
- **Fallback:** Mobile apps + curl + Postman work (no origin header).

### Face Template Encryption
- **Why:** Regulatory + trust.
- **Implementation:** Encrypted on-device, server never sees raw biometric.

### Ticket Transfer Sync (No Re-enroll)
- **Why:** UX. User already enrolled, don't friction them again.
- **Implementation:** POST /tickets/transfer/accept updates owner + face link server-side instantly.

---

## CRITICAL RULES FOR CONTINUATION

1. **Always import from @comfytag packages:**
   ```typescript
   import { User, Ticket } from '@comfytag/types'
   import { formatNaira, STORAGE_KEYS } from '@comfytag/utils'
   import { colors, spacing } from '@comfytag/ui/tokens'
   import { enrollFace } from '../../lib/faceSDK'  // screens only
   ```

2. **Never hardcode colours/spacing:**
   ```typescript
   // ✅ CORRECT
   backgroundColor: colors.brand.DEFAULT
   paddingHorizontal: spacing[4]

   // ❌ WRONG
   backgroundColor: '#7C3AED'
   paddingHorizontal: 16
   ```

3. **All face operations through adapter:**
   ```typescript
   // ✅ CORRECT
   const result = await enrollFace()

   // ❌ WRONG (never):
   import KBYFace from 'kby-ai-face-recognition'
   ```

4. **Reuse components — no duplicates:**
   - FaceEnrollmentScreen used in 2 places (onboarding + profile)
   - Future UI components built once in packages/ui, imported everywhere

5. **Test transfer flow end-to-end:**
   - No re-enrollment, just API sync
   - Verify ticket ownership updates in DB
   - Verify face owner updates in DB
   - Verify sender's face unlinks

6. **Organizer check-in is full-screen result:**
   - Green screen (3–5s) if match
   - Red screen (3–5s) if no match
   - Manual override button (always available)

---

## NEXT 3 TASKS (Immediate)

### TASK-027: IncomingTransferScreen (REVISED)
- **File:** apps/mobile/src/screens/attendee/tickets/IncomingTransferScreen.tsx
- **States:** loading | review | enrolling (remove) | confirming | success | declined | error
- **Change:** Remove face enrollment. Accept button → confirmation alert → API call only.
- **API:** POST /tickets/transfer/accept { ticketId, transferToken }
- **Result:** Ticket ownership + face owner synced server-side instantly.
- **Estimate:** 300 lines, 2–3 hours

### TASK-028: FaceCheckInScreen (Organizer)
- **File:** apps/mobile/src/screens/organizer/checkin/FaceCheckInScreen.tsx
- **Flow:** Camera → liveness check → face capture → verifyFace(captured, stored) → POST /face/verify
- **Result:** Full-screen green (match) or red (no match), 3–5s display
- **Manual button:** Always available to bypass face and search name
- **API:** POST /face/verify { faceTemplate, ticketId, matchResult, matchScore }
- **Estimate:** 400 lines, 3–4 hours

### TASK-029: SMS OTP Fallback (Termii)
- **File:** apps/mobile/src/screens/onboarding/ForgotPasswordScreen.tsx (wire Termii)
- **Flow:** User enters phone → Termii sends OTP → app verifies → reset password link
- **API Integration:** POST /auth/forgot-password → Termii sends SMS
- **Estimate:** 200 lines, 2 hours

---

## IMPORTANT NOTES

- **No license yet:** KBY-AI SDK still mocked. Everything else is real and testable.
- **All routes scaffold:** Web, admin, partner all have placeholder routes. Milestone 4+ wires them.
- **Partner/admin rebuild:** Will use new Next.js App Router in Milestone 4 (not migrations yet).
- **Mobile is priority:** Face recognition, check-in, transfer are all mobile-first.
- **QR fallback always:** Every ticket has QR — face is convenience, not requirement.

---

## FILES TO READ BEFORE CODING

When Claude Code opens, read in this order:
1. **design.md** — all tokens, colours, badge rules
2. **apps/api/models/User.js + Audience.js** — data shape
3. **apps/api/controllers/transfer.js + face.js** — API logic
4. **apps/mobile/src/lib/faceSDK.ts** — SDK interface
5. **apps/mobile/src/screens/onboarding/FaceEnrollmentScreen.tsx** — UI pattern

Then proceed to the task prompt.

---

## Quick Command Reference

```bash
# Start local dev
docker-compose up -d

# Install deps
pnpm install

# Run API
cd apps/api && npm run dev

# Run mobile
cd apps/mobile && npx expo start

# Run web
cd apps/web && npm run dev

# Turborepo build all
pnpm build

# Clean
rm -rf node_modules && pnpm install
```

---

## Contact / Questions

- **Repo path:** C:\Users\HOMEPC\Desktop\Web_Projects\Personal\comfytag
- **Primary concern:** Face SDK (mock until licensed)
- **Next bottleneck:** Milestone 4 (partner dashboard rebuild)
- **Success metric:** TASK-030 (offline cache) = Milestone 3 complete

**Last session:** May 2026, Full Milestone 2 + Milestone 3 foundation

```