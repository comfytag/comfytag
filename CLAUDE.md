# ComfyTag — Project Instructions & AI Workforce Guide

**Last Updated:** May 17, 2026  
**Project Status:** ✅ Milestones 0–4 COMPLETE | 🚧 Milestone 5 IN PROGRESS  
**Platform:** Biometric-first event ticketing for Nigeria  

---

## 🎯 PROJECT OVERVIEW

**ComfyTag** is "Your face is your ticket" — a Nigerian event ticketing platform that uses facial biometrics for secure, frictionless check-in.

**Core Value Proposition:**
- Attendees enroll face once, show face at venue (no QR needed)
- Event organizers get powerful dashboard with real-time check-ins + analytics
- Platform takes 4–5% transaction fee per ticket
- Nigerian-first UX, Paystack + Stripe integration, mobile-native

**Market Position:**
- Competitor to Tix Africa, TixTango, Eventbrite, Selar
- Differentiator: Face recognition + premium organizer tools + Gen Z UX
- Target: Nigerian Gen Z/millennial event-goers (18–35) + solo/pro organizers

---

## 📁 CODEBASE STRUCTURE

```
c:\Users\HOMEPC\Desktop\Web_Projects\Personal\comfytag/
├── .claude/
│   └── settings.local.json         [Extended permissions for dev]
├── apps/
│   ├── api/                        [Express.js REST API, port 4002]
│   │   ├── routes/                 [18 route files: auth, events, tickets, etc.]
│   │   ├── controllers/            [14 business logic controllers]
│   │   ├── models/                 [14 Mongoose schemas]
│   │   ├── middleware/             [auth, upload, validation]
│   │   └── utils/                  [email, QR, token helpers]
│   ├── web/                        [Next.js 16.2.6 attendee app, port 3000]
│   │   └── src/
│   │       ├── app/                [Routes: /, /login, /events, /checkout, /tickets, /api/*]
│   │       ├── components/         [Auth, home, event, search, layout]
│   │       └── lib/                [API, auth, middleware]
│   ├── partner/                    [Next.js 16.2.6 organizer dashboard, port 3001]
│   │   └── src/
│   │       ├── app/                [Routes: /login, /overview, /events, /settings, /withdraw]
│   │       ├── components/         [Auth, dashboard shell, cards, tables]
│   │       └── lib/                [API, NextAuth, middleware]
│   ├── admin/                      [Next.js 16.2.6 admin dashboard, port 3002]
│   │   └── src/
│   │       ├── app/                [Routes: /login, /overview, /users, /kyc, /payouts, /analytics]
│   │       ├── components/         [Auth, dashboard, admin-specific widgets]
│   │       └── lib/                [API, NextAuth, middleware]
│   └── mobile/                     [Expo + React Native mobile app]
│       └── src/
│           ├── lib/                [faceSDK.ts adapter, ticketCache.ts]
│           ├── screens/            [Auth, attendee, organizer flows]
│           ├── navigation/         [React Navigation setup]
│           └── store/              [State management]
├── packages/
│   ├── types/                      [@comfytag/types — shared TS interfaces]
│   │   └── src/index.ts            [18 exports: User, Event, Ticket, etc.]
│   ├── ui/                         [@comfytag/ui — design system + components]
│   │   ├── src/components/         [8 universal primitives: Button, Input, Badge, Modal, etc.]
│   │   ├── src/tokens/             [colors, spacing, typography, motion]
│   │   └── tailwind.config.js      [Tailwind CSS 4]
│   └── utils/                      [@comfytag/utils — shared utilities]
│       └── src/index.ts            [15 exports: formatNaira, formatDate, calculateFees, etc.]
├── discussion/
│   ├── milestone-decisions/        [Milestone 4 & 5 decisions]
│   ├── role-decisions/             [CTO, SWE, PM, UI/UX, security, etc.]
│   ├── bug-reports.md              [Issue log]
│   └── escalations.md              [Escalation notes]
├── tests/
│   ├── e2e/                        [Playwright E2E tests]
│   └── test_*.log                  [Test output]
├── PROJECT_CONTEXT.md              [25 KB — design + business context]
├── design.md                       [15 KB — design system v1.1 (LOCKED)]
├── project-session.md              [49 KB — milestone state + kanban]
├── system_overview.md              [Auto-generated audit]
├── docker-compose.yml              [Dev infrastructure]
├── pnpm-workspace.yaml             [Monorepo config]
├── turbo.json                      [Turborepo pipeline]
└── package.json (root)             [Workspace setup]
```

---

## 🛠️ TECH STACK

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| **Frontend** | Next.js | 16.2.6 (App Router) | web, partner, admin apps |
| | React | 19.2.4 | Server + Client components |
| | React Native | 0.81.5 | mobile app via Expo |
| | TypeScript | 5.9.2 | strict mode, no `any` |
| | Tailwind CSS | 4.0.0 | public + dashboard dark mode |
| **Backend** | Express.js | 4.18.x | REST API, ES modules |
| | Node.js | 20 LTS | runtime |
| | MongoDB | 7.0 | 14 collections (schemas) |
| **Build** | pnpm | 11.0.9 | fast, monorepo-aware |
| | Turborepo | 2.9.12 | build pipeline orchestration |
| **Auth** | NextAuth.js | 4.24.14 | JWT + session callbacks |
| **HTTP** | Axios | 1.6.5 | API client |
| **Data Fetching** | TanStack React Query | 5.0.0 | caching, background sync |
| **Face Recognition** | KBY-AI SDK | [pending license] | mock adapter pattern |
| **Payments** | Paystack | SDK v3.x | primary processor |
| | Stripe Connect | SDK v15.x | future, not yet integrated |
| **Push Notifications** | Firebase Cloud Messaging | SDK 9.x | iOS/Android push |
| | Termii SMS | API v3 | SMS OTP fallback |
| **Database Driver** | Mongoose | 8.0.x | MongoDB ODM |
| **Testing** | Playwright | 1.46+ | E2E tests (scaffold pending) |
| **Table Rendering** | TanStack React Table | 8.0.0 | dashboard data tables |
| **Deployment** | Docker | latest | containerization |
| | Railway | N/A | planned backend |
| | Vercel | N/A | planned Next.js apps |

---

## 🏗️ ARCHITECTURE (LOCKED)

### Core Principles

**1. Monorepo with Shared Packages**
- **@comfytag/types** — Single source of truth for all TypeScript interfaces
- **@comfytag/utils** — Shared utilities (all 4 apps import these)
- **@comfytag/ui** — Design tokens + universal UI primitives (Button, Input, Badge, Modal, Skeleton, EmptyState, LoadingSpinner, ErrorMessage)

**2. Page Architecture (Pages are thin composers)**
- Pages use `useQuery` + `useSession` for data fetching
- Pages derive UI state from data
- Pages render only JSX (no inline reusable components)
- All reusable UI lives in separate component files

**3. Component Organization**
- **Universal Primitives** → `packages/ui/src/components/` (shared across all 4 apps)
- **Dashboard-specific UI** → `apps/[app]/src/components/ui/` (NOT shared; dashboard-specific behavior)
- **Feature components** → `apps/[app]/src/components/[feature]/` (screen-specific)

**4. Face Recognition (KBY-AI)**
- **Adapter pattern:** `apps/mobile/src/lib/faceSDK.ts` is the ONLY file that imports KBY-AI
- All screens import facade functions: `enrollFace()`, `verifyFace()`, `checkLiveness()`, `getSDKStatus()`
- Mock mode active until license arrives
- Face templates encrypted on-device (server never stores raw biometrics)

**5. API Structure**
- Express.js REST endpoints: `/api/[resource]/[action]`
- Request/response format: `{ success, data/message }`
- All endpoints protected by `verifyUser` middleware (JWT check)
- Error handling: specific error messages, no stack traces to client

**6. URL Structure (No `/dashboard/` prefixes)**
- Partner: `/login`, `/overview`, `/events`, `/events/[id]`, `/events/create`, `/settings`, `/withdraw`, `/notifications`
- Admin: `/login`, `/overview`, `/users`, `/organizers`, `/events`, `/payouts`, `/kyc`, `/face-logs`, `/promoted`, `/analytics`, `/audit`, `/team`, `/settings`
- (auth) and (dashboard) are route groups only; they don't appear in URLs

---

## 🎨 DESIGN SYSTEM (v1.1 — LOCKED)

### Brand Colour
- **Primary:** `#7C3AED` (deep violet-purple) — actions, CTAs, primary elements
- **Dark:** `#5B21B6` (hover, pressed, focus ring)
- **Light:** `#EDE9FE` (tinted backgrounds, selected states)

### Public System (web + mobile attendee)
- Background: `#FAFAF9` (warm off-white)
- Surface: `#FFFFFF` (cards, inputs)
- Text Primary: `#1C1917` (warm near-black)
- Text Secondary: `#78716C` (supporting text)
- Success: `#10B981` | Error: `#EF4444`
- Energy Amber: `#F59E0B` (FOMO badges ONLY: Trending, Tonight, Selling Fast)

### Dashboard System (partner + admin)
- Background: `#0F0F0F` (warm near-black)
- Surface: `#1A1A1A` (cards, panels)
- Text Primary: `#F5F5F4` (warm near-white)
- Text Secondary: `#A8A29E` (supporting text)
- Success: `#10B981` | Error: `#EF4444`
- Financial Gold: `#D97706` (revenue/payouts ONLY, never on public site)

### Token Usage Rules (ENFORCED)
- ✅ All color references use CSS custom properties: `var(--color-brand)`, `var(--color-success)`, etc.
- ✅ All spacing uses tokens from `@comfytag/ui/tokens`: `spacing[4]`, `spacing[6]`, etc.
- ✅ Never hardcode hex values or pixel spacing in components
- ✅ No `!important` (indicates CSS bug)
- ✅ Focus rings always visible (WCAG AA requirement)

---

## 📋 CODE STANDARDS (NON-NEGOTIABLE)

**TypeScript:**
- `"strict": true` in all tsconfigs
- No `any` types
- All function parameters typed
- All component props have fully-typed interfaces

**Components:**
- Extract before first reuse (don't inline)
- Verify component exists before task starts (avoid duplication)
- Universal primitives in `packages/ui/`, dashboard-specific in `apps/[app]/src/components/ui/`

**State Management:**
- React Query for server state (TanStack React Query v5)
- React hooks for UI state (useState, useContext)
- No prop drilling (use custom hooks or context)

**No Hardcoding:**
- All colors via CSS variables or token imports
- All spacing via token values
- All typography via token scale
- All animations via motion tokens

**Accessibility (WCAG AA minimum):**
- Touch targets 44px minimum
- Focus rings visible on all interactive elements
- Contrast ratios 4.5:1 for text, 3:1 for UI
- Alt text on all images
- Keyboard navigation on all components

**No Console Logs in Production:**
- `console.log` allowed in dev/test only
- Use structured logging in backend (Winston, Pino, etc.)

---

## 🤖 AI WORKFORCE: Skills & Subagents

ComfyTag is built by a team of specialized AI workers. Each can be triggered individually or routed via the orchestrator.

### How to Use

#### Option 1: Full Orchestrator (Recommended for Complex Tasks)
```
/comfytag-orchestrator Build TASK-027 (Incoming Transfer Screen)
```
Routes to all 6 subagents automatically. Delivers complete, tested feature.

#### Option 2: Individual Skills (For Specific Work)
```
/design-review apps/mobile/src/screens/onboarding/FaceEnrollmentScreen.tsx
/backend-build POST /tickets/transfer/accept
/mobile-build IncomingTransferScreen (ticket transfer UI)
/qa-review [code path]
/deploy-plan [feature]
```

#### Option 3: Resume Project (For Continuity)
```
resume project
```
Loads project-session.md, shows kanban, picks next TASK to build.

### 6 Core Subagents

| Agent | Role | Triggers | Input | Output | Token Cost |
|-------|------|----------|-------|--------|------------|
| **PM/Architect** | Requirement analysis, breakdown, risk assessment | `/pm-breakdown`, `analyze this` | High-level task | Subtasks, dependencies, estimates, risks | 2–3K |
| **Backend Engineer** | APIs, models, business logic, security | `/backend-build`, `build endpoint` | Subtask + design | Verified endpoint (code, tests, docs) | 3–4K |
| **Mobile/Frontend** | React Native screens, state, animations | `/mobile-build`, `build screen` | Subtask + design + API contract | Production screen (7+ states, tests) | 3–4K |
| **Designer/UX** | Psychology, brand consistency, accessibility | `/design-review`, `design this` | Feature request | Design spec (prototype, states, a11y audit) | 1.5–2K |
| **QA/Security** | Code review, testing, security, performance | `/qa-review`, `code review` | Built code | Review report (✅ or 🚫 with fixes) | 2–3K |
| **DevOps/Infrastructure** | Deployment, monitoring, scaling | `/deploy-plan`, `deployment` | Feature code | Deployment checklist (pre/post, monitoring) | 1.5–2K |

### 15 Core Skills (Detailed List)

**Foundational (7):**
1. `comfytag-orchestrator` — Master conductor, routes to subagents
2. `comfytag-pm-architect` — PM breakdown, dependency mapping
3. `comfytag-backend-engineer` — API + database work
4. `comfytag-mobile-frontend` — React Native screens
5. `comfytag-design-ux` — Design + UX psychology + a11y
6. `comfytag-qa-security` — Code review + security audit
7. `comfytag-devops-infra` — Deployment + monitoring

**Specialist (3):**
8. `comfytag-face-sdk` — Face enrollment, verification, liveness
9. `comfytag-ticket-transfer` — Transfer flow, state machine
10. `comfytag-mobile-screen-builder` — Quick screen generation

**Utility (5):**
11. `comfytag-api-endpoint-builder` — Quick endpoint generation
12. `comfytag-design-review` — Design validation + a11y audit
13. `comfytag-seo-optimization` — Google ranking + Core Web Vitals
14. `comfytag-aeo-optimization` — AI search engine optimization
15. `comfytag-code-quality` — Pattern audit, duplication detection

---

## 💾 PROJECT STATE & MEMORY

### Session State
- **File:** `project-session.md` (49 KB, source of truth)
- **Contains:** Milestone decisions, component registry, kanban status, bug history
- **Updated:** After each major task completion

### Memory Rules (ENFORCED)
1. **DRY Components:** Pages are thin; all reusable UI is extracted to `src/components/` before use
2. **No Auto-Installs:** Never run `pnpm add`; write the command and wait for user output
3. **Playwright Manual:** Never auto-run Playwright; output command and stop
4. **Bug Fix History:** All fixes applied (JWT, routes, schemas, imports, session.user.id)

---

## 🚀 QUICK-START COMMANDS

### Development

**Start all dev servers:**
```bash
pnpm dev
```
- web: http://localhost:3000
- partner: http://localhost:3001
- admin: http://localhost:3002
- api: http://localhost:4002

**Start one app:**
```bash
cd apps/web && pnpm dev      # attendee site
cd apps/partner && pnpm dev  # organizer dashboard
cd apps/admin && pnpm dev    # admin dashboard
cd apps/api && pnpm dev      # API backend
```

**Mobile (iOS simulator):**
```bash
cd apps/mobile && pnpm ios
```

### Database

**MongoDB (Docker):**
```bash
docker-compose up -d mongo
# Mongo runs on localhost:27017
```

**Seed dev data:**
```bash
cd apps/api && node scripts/seed-dev-users.js
```

### Testing

**Type check all apps:**
```bash
pnpm typecheck
```

**Run Playwright E2E tests:**
```bash
pnpm playwright test
```

**Run specific test:**
```bash
pnpm playwright test tests/e2e/01-public-pages.spec.ts
```

### Build & Deploy

**Build all apps (production):**
```bash
pnpm build
```

**Build one app:**
```bash
pnpm build --filter=web
```

### Production Docker Testing

**REQUIRED before pushing Dockerfile changes:**
```bash
./scripts/test-docker-builds.sh
```

This script:
- ✓ Builds all Docker images
- ✓ Validates docker-compose.prod.yml
- ✓ Starts containers
- ✓ Checks containers stay running (no restart loop)
- ✓ Verifies critical files exist (server.js)
- ✓ Tests all endpoints respond

**Do NOT push to GitHub if this script fails!**

Related docs:
- `docs/DOCKER_SETUP.md` — Docker & monorepo explained
- `docs/DEPLOYMENT_GUIDE.md` — Deployment procedures
- `docs/MONITORING_SETUP.md` — Monitoring & alerting

---

## 📚 KEY DOCUMENTATION FILES

| File | Purpose | Owner |
|------|---------|-------|
| `design.md` | Design system v1.1 (LOCKED) | UI/UX Council |
| `PROJECT_CONTEXT.md` | Design + business context | PM Council |
| `project-session.md` | Session state + kanban (SOURCE OF TRUTH) | Project Builder |
| `system_overview.md` | Auto-generated audit | Audit Skill |
| `discussion/` | Council decisions + role notes | All Roles |

---

## 🎯 CURRENT MILESTONES

✅ **Milestone 0:** Security & cleanup  
✅ **Milestone 1:** Backend stabilization  
✅ **Milestone 2:** Monorepo + shared packages  
✅ **Milestone 3:** Core features (face, events, tickets)  
✅ **Milestone 4:** Web + partner + admin dashboards  
🚧 **Milestone 5:** Mobile app + E2E tests (IN PROGRESS)  

See `project-session.md` for detailed kanban.

---

## ⚠️ CRITICAL RULES

- **NEVER modify design.md** — it's locked (design council agreed v1.1 is final)
- **NEVER hardcode colors, spacing, fonts** — use tokens only
- **NEVER duplicate components** — extract to `src/components/` first
- **NEVER use `any` in TypeScript** — type everything strictly
- **NEVER log sensitive data** — no tokens, passwords, face data in logs
- **NEVER push untyped endpoints** — all routes must have request/response types
- **NEVER modify memory rules** — these are sacred (ask before changing)
- **NEVER push Dockerfile changes without testing** — run `./scripts/test-docker-builds.sh` before every Docker change (incident: June 6, 2026)

---

## 🔗 HOW TO GET HELP

**For Code Questions:**
- Use individual skills: `/design-review`, `/qa-review`, `/backend-build`

**For Architecture Questions:**
- Use PM/Architect: `/pm-breakdown [task]`

**For Full Feature Build:**
- Use Orchestrator: `/comfytag-orchestrator Build TASK-XXX`

**For Continuous Work:**
- Use Resume: `resume project`

---

**Last Updated:** May 17, 2026  
**Next Review:** After Milestone 5 completion  
**Contacts:** See `discussion/role-decisions/` for role owners
