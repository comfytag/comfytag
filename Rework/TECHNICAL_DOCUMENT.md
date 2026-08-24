# ComfyTag — Current Technical Architecture

**Purpose:** This document is a factual snapshot of what actually exists in the ComfyTag monorepo today (repo root: `C:\Users\HOMEPC\Desktop\Web_Projects\Personal\comfytag`), verified directly against source and config files rather than against the project's own `CLAUDE.md` summary. It exists to feed a "rework" planning exercise — deciding what to keep, fix, or redo. Every claim below is backed by a specific file path (and line number where useful); the final section catalogs every place this document's findings diverge from `CLAUDE.md`.

ComfyTag is a Nigerian biometric ("face is your ticket") event-ticketing platform built as a pnpm/Turborepo monorepo with five apps — a plain-JavaScript Express API, three Next.js 16 / React 19 frontends (attendee `web`, organizer `partner`, `admin`), and one Expo/React Native `mobile` app — sharing three internal packages (`@comfytag/types`, `@comfytag/utils`, `@comfytag/ui`). The codebase is mid-flight: the working branch (`mobile-redesign-updates`) currently carries 129 uncommitted file changes, and the last recorded full E2E run (July 2026) had a meaningful failure rate.

---

## 1. Monorepo & Build Pipeline

**Workspace definition** — `pnpm-workspace.yaml:1-3`:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```
Five apps (`web`, `partner`, `admin`, `mobile`, `api`, plus a stray `apps/web-main-deploy-tmp` directory not part of the workspace glob's intent but matched by it) and three packages (`types`, `ui`, `utils`).

`allowBuilds` (pnpm-workspace.yaml:5-14) allow-lists native/postinstall builds for `@parcel/watcher`, `cpu-features`, `esbuild`, `mongodb-memory-server`, `sharp`, `ssh2`, `unrs-resolver`, `yarn` (and explicitly disables `msgpackr-extract`).

**Package manager & Node:** `package.json:24` pins `packageManager: "pnpm@11.0.9"`. There is no root `engines` field pinning a Node version. CI (`.github/workflows/deploy.yml`) uses Node `22.13`; every app's `Dockerfile` uses `node:22-alpine`. No file in the repo specifies Node 20.

**Root scripts** (`package.json:4-15`):
| Script | Command | Notes |
|---|---|---|
| `dev` | `turbo run dev` | fans out to each app's own `dev` script (see per-app ports below) |
| `dev:mobile` | `turbo run dev:mobile` | LAN-bound variant (`-H 0.0.0.0`) for testing on a physical device |
| `build` | `turbo run build` | |
| `lint` | `turbo run lint` | |
| `test` | `turbo run test` | |
| `test:ci` | `turbo run test -- --run` | |
| `typecheck` | `turbo run typecheck` | |
| `predev`/`predev:mobile` | `node scripts/kill-dev-ports.js` | frees dev ports before starting |
| `prepare` | `husky install` | |

**Turbo pipeline** (`turbo.json:4-27`):
- `build`: `dependsOn: ["^build"]` (topological — packages build before the apps that consume them), caches `.next/**` (excluding `.next/cache/**`) and `dist/**`, inputs include `.env*`.
- `dev` / `dev:mobile`: `cache: false, persistent: true` (long-running, no dependency ordering).
- `lint`: `dependsOn: ["^lint"]`.
- `test`: `dependsOn: ["^build"]` — tests run **after** a full build of dependency packages, not just typecheck.
- `typecheck`: `dependsOn: ["^typecheck"]`. Note `apps/api/package.json` has **no `typecheck` script** (confirmed — its scripts are `dev`, `dev:mobile`, `start`, `seed:*`, `test*` only), so `pnpm typecheck` silently skips the API entirely; there is nothing type-checking the backend.

Installed/resolved versions verified directly against `node_modules` (not just `package.json` ranges): `turbo` → **2.9.12**, root `pnpm` → **11.0.9** (matches).

---

## 2. Apps Inventory

### 2.1 `apps/web` — attendee-facing site
- **Port:** 3000 (`package.json:6`: `next dev -p 3000`).
- **Purpose:** public event discovery, checkout, ticket wallet, profile, organizer public pages.
- **Framework:** Next.js `16.2.6`, React `19.2.4` / `react-dom 19.2.4` (all verified against resolved `node_modules/next` and `node_modules/react` package.json — matches the version pinned in `package.json`).
- **Build:** `next build --webpack` (explicitly opts out of Turbopack for production build; dev servers in `playwright.config.ts` however use `--turbopack`).
- **Key dependencies (verified/resolved versions in parentheses where checked):** `axios@^1.16.0` (resolved 1.16.0), `@tanstack/react-query@^5.100.9` (resolved 5.100.9) + devtools, `next-auth@^4.24.14`, `@auth/mongodb-adapter@^3.11.2` (present but **unused** — see §9), `socket.io-client@^4.8.3`, `qrcode` + `@vercel/og` (dynamic OG image / ticket QR generation), `resend@^6.12.3` (transactional email from web's own API routes), `ioredis@^5.11.1`, `canvas-confetti`, `embla-carousel-react`, `@ducanh2912/next-pwa` (PWA support), `radix-ui`, `class-variance-authority`, `tailwind-merge`, `tw-animate-css`. **Three separate mapping stacks are installed simultaneously:** `mapbox-gl`, `maplibre-gl` + `react-map-gl`, and `@vis.gl/react-google-maps` — see tech-debt notes.
- **Test stack:** Vitest 2 + `@testing-library/react` 16 + jsdom (`vitest.config.ts`, `src/test-setup.ts`), one test file: `src/__tests__/components.test.tsx`.
- **Folder structure** (`apps/web/src`): `app/` (route segments: `about`, `api`, `category`, `checkout`, `claim-ticket`, `contact`, `events`, `forgot-password`, `handoff`, `hype-link`, `login`, `my-following`, `notifications`, `organizer`, `privacy`, `profile`, `register`, `reset-password`, `saved`, `search`, `terms`, `tickets`, plus root `page.tsx`, `layout.tsx`, `providers.tsx`, `error.tsx`, `not-found.tsx`, `robots.ts`, `sitemap.ts`), `components/`, `contexts/`, `hooks/`, `lib/`, `types/`, plus a top-level `proxy.ts` (see §5) and a `worker/` directory (service worker, excluded from `tsconfig` `include`).
- **tsconfig** (`apps/web/tsconfig.json`): `strict: true`, target `ES2017`, `moduleResolution: "bundler"`, path aliases for `@/*` and explicitly for `@comfytag/types`, `@comfytag/ui`, `@comfytag/utils` pointing at package `src` (not `dist`) — i.e. workspace packages are consumed as source, not as built artifacts.

### 2.2 `apps/partner` — organizer dashboard
- **Port:** 3001.
- **Purpose:** event creation/management, attendee lists, payouts, team, KYC, gate scanner.
- **Framework:** Next.js `16.2.6`, React `19.2.4` (same as web).
- **Build:** `next build --webpack`.
- **Key dependencies:** `next-auth@^4.24.14` (Google OAuth **and** credentials — no `@auth/mongodb-adapter` here, unlike web/admin), `@tanstack/react-query` + `@tanstack/react-table@^8.21.3`, `recharts@^3.8.1` (analytics charts), `@zxing/library` + `html5-qrcode` (two separate QR-scanning libraries — see tech debt), `@google/generative-ai@^0.24.1` (Gemini — used somewhere in the partner app, worth investigating scope during rework), `socket.io-client`, `axios`.
- **Test stack:** same Vitest/RTL setup as web; one test file `src/__tests__/components.test.tsx`.
- **Folder structure**: `app/(auth)/`, `app/(dashboard)/` (route group containing `analytics`, `attendees`, `events`, `kyc`, `notifications`, `overview`, `payouts`, `profile`, `settings`, `team`, `tiers`, `withdraw`), `app/onboarding/` (standalone, outside the dashboard group — one-time onboarding gate), `components/`, `contexts/`, `hooks/` (13 custom hooks incl. `useShellStore.ts`, `useSSE.ts`), `lib/`, `types/`, `proxy.ts`.
- **tsconfig:** `strict: true`, same base options as web, but **no** `@comfytag/*` path aliases (only `@/*`) — resolved instead through node_modules workspace symlinks.
- **Notable:** `apps/partner/src/components/dashboard/PartnerBottomTabBar.tsx` was deleted in the current uncommitted diff (`git status`), consistent with the in-progress "mobile-redesign-updates" branch name.

### 2.3 `apps/admin` — internal admin dashboard
- **Port:** 3002.
- **Purpose:** user/organizer management, KYC review, payouts approval, CMS content editing, audit log, face-log review.
- **Framework:** Next.js `16.2.6`, React `19.2.4`.
- **Build:** `next build` (no `--webpack` flag — inconsistent with web/partner which explicitly force webpack).
- **Key dependencies:** `next-auth` (credentials-only, no OAuth provider registered — see §5), `@auth/mongodb-adapter` (present, unused, same as web), `otplib@^13.4.0` (admin 2FA), `json2csv@6.0.0-alpha.2` (**alpha version pinned in "dependencies"**, worth flagging), `@tanstack/react-table`, `recharts`, `qrcode`.
- **Test stack:** `vitest.config.ts` + full RTL/jsdom devDependency set are present, but **there is no `src/__tests__` directory anywhere in `apps/admin`** — zero unit tests exist despite the tooling being wired up.
- **Folder structure**: `app/(dashboard)/` (`analytics`, `audit`, `categories`, `cms`, `events`, `face-logs`, `kyc`, `organizers`, `overview`, `payouts`, `promoted`, `settings`, `team`, `users`), `app/2fa/`, `app/login/`, `components/`, `contexts/`, `hooks/` (19 hooks — the largest hook surface of the three dashboards, reflecting the CMS-editing responsibilities `useCategories`, `useCuratedSections`, `useFaqs`, `useHowItWorks`, `useLegal`, `useMarquee`, `usePages`, `usePromoBanners`, `useSiteConfig`), `lib/` (`adminApi.ts` separate from `api.ts`, `roleGuard.ts`, `roles.ts`), `proxy.ts`.
- **tsconfig:** `strict: true`, no `@comfytag/*` aliases.

### 2.4 `apps/mobile` — Expo/React Native app
- **Purpose:** attendee + organizer flows on-device, including face enrollment/check-in.
- **Framework:** Expo `~54.0.0`, React Native `0.81.5`, React `19.1.0` / `react-dom 19.1.0` — **note the React version (19.1.0) diverges from the three web apps' React 19.2.4**, a real cross-app version split, not just a documentation error.
- **Navigation:** `@react-navigation/native@^7.2.4`, `bottom-tabs@^7.15.13`, `stack@^7.8.13` — a hand-built navigator tree (`src/navigation/`): `GuestNavigator`, `AttendeeNavigator` (with nested `DiscoverStackNavigator`, `SearchStackNavigator`, `TicketsStackNavigator`, `ProfileStackNavigator`), `OrganizerNavigator` (with nested `OrganizerEventsStackNavigator`, `OrganizerCheckInStackNavigator`, `OrganizerAccountStackNavigator`) — i.e. attendee mode and organizer mode are two entirely separate navigator trees, switched via `store/modeStore.ts`.
- **State:** `zustand@^5.0.13` (`src/store/authStore.ts`, `eventDraftStore.ts`, `modeStore.ts`) — no Redux, no Context-based global store.
- **Data fetching:** `@tanstack/react-query@^5.100.9` (same major/minor as the web apps).
- **Face/camera/media:** `expo-camera`, `expo-image`, `expo-image-manipulator`, `expo-image-picker`. **No KBY-AI SDK dependency exists in `package.json`** — consistent with the "mock adapter, license pending" claim, confirmed by absence rather than a mock flag.
- **Push notifications:** `expo-notifications@~0.32.17`. **There is no Firebase/FCM SDK dependency anywhere in `apps/mobile/package.json`** — push is implemented through Expo's own notification service, not raw FCM as CLAUDE.md's tech stack table claims.
- **Other:** `@gorhom/bottom-sheet`, `@shopify/flash-list` (virtualized lists), `react-native-gifted-charts` (organizer analytics), `react-native-qrcode-svg`, `expo-secure-store` (likely token storage — see §6), `@react-native-async-storage/async-storage` (also used for token storage per `src/lib/api.ts`, see below — two different storage mechanisms coexist).
- **Test stack:** `jest-expo@~54.0.0`, `@testing-library/react-native@^13.0.0`, `react-test-renderer@19.1.0`. `jest.config.js` + `jest-setup.ts` at the app root. Unit tests exist under `src/__tests__/{components,hooks,store}` plus `queryKeys.test.ts`.
- **E2E:** Maestro (`test:e2e`: `maestro test .maestro/flows`), 10 flow files in `apps/mobile/.maestro/flows/`: `01-auth-welcome`, `02-auth-login`, `03-auth-register`, `04-attendee-home`, `05-attendee-search`, `06-attendee-tickets`, `07-attendee-profile`, `08-organizer-dashboard`, `09-organizer-checkin`, `10-organizer-mode-switch`, plus a shared `utils/` helper directory.
- **tsconfig** (`apps/mobile/tsconfig.json`): extends `expo/tsconfig.base`, only override is `strict: true` — minimal, framework-default config.
- **Devtool version note:** mobile's own `typescript` devDependency is pinned `~5.9.2`, distinct from the web apps' `^5` (unpinned major-5 range) — another small but real version-pinning inconsistency across the monorepo.

### 2.5 `apps/api` — Express REST backend
- **Port:** 4002 (`config.js` / `PORT` env, default in `docker-compose.yml:22`).
- **Language:** **Plain JavaScript, ES modules** (`"type": "module"` in `package.json:6`). There is **no `tsconfig.json` in `apps/api`** and no `typecheck` script — the backend is entirely outside the "TypeScript strict, no `any`" rule stated in CLAUDE.md, by construction (it isn't TypeScript at all).
- **Framework:** Express `^4.18.2` (resolved via `node_modules` check not performed individually, but matches CLAUDE.md's Express claim).
- **Database:** Mongoose — `package.json` declares `^6.7.2`, and the **resolved installed version is 6.13.9** (verified via `apps/api/node_modules/mongoose/package.json`). This directly contradicts CLAUDE.md's claim of "Mongoose 8.0.x" — the API is one major version behind what the documentation states.
- **Real-time:** `socket.io@^4.8.3`, own `socket/index.js` module exposing `initializeSocket`/`setGlobalIoInstance`.
- **Background jobs:** `bullmq@^5.78.0` + a Redis connection (`jobs/emailQueue.js` — has an explicit `testRedisConnection()` startup check gated behind `config.features.emailQueue`), plus `node-cron@^4.2.1`. `jobs/` directory: `attendeeWinback.js`, `emailQueue.js`, `eventReminderJob.js`, `faceEnrollmentNudge.js`, `organizerWinback.js`, `updateExpiredTickets.js`.
- **Email:** `nodemailer@^6.9.1`, `resend@^6.12.3`, `handlebars@^4.7.7` templates (`utils/emailTemplates/`) — two different email-sending mechanisms present (nodemailer + Resend) alongside AWS SES env vars (`apps/api/.env.example`: `SES_SENDER_EMAIL`, `AWS_ACCESS_KEY_ID` etc.) and Zeptomail SMTP vars in the root `.env.example` — **at least three distinct email-provider integration paths referenced across env files**, worth consolidating in the rework.
- **Payments:** No Paystack or Stripe **SDK package** is installed (`package.json` dependencies list has neither `paystack` nor `stripe`); Paystack integration is done via raw HTTP (`utils/paystack.js`, route `routes/paystackVerify.js`) using axios/fetch directly rather than an official SDK. **No Stripe dependency of any kind exists** — confirms CLAUDE.md's "future, not yet integrated" claim for Stripe.
- **Auth/2FA:** `jsonwebtoken@^9.0.3`, `bcryptjs@^2.4.3`, `express-jwt@^7.7.7`, `otplib@^13.4.0` + `speakeasy@^2.0.0` (**two different TOTP libraries installed simultaneously** — `otplib` and `speakeasy` — see tech debt).
- **Rate limiting:** `express-rate-limit@^8.5.2`.
- **Misc/likely dead:** `antd@^5.5.2` (a full React admin-UI component library) and `react@^18.2.0` are dependencies of a headless Express API with no view layer — almost certainly vestigial from an earlier architecture; `heroku@^7.67.1`, `telnet-client`/`telnet-stream` also present with no obvious current usage found in a codebase grep during this pass — flagged for verification, not confirmed dead.
- **Structure:**
  - `routes/` — **31 files** (not "18" as CLAUDE.md's folder-structure comment claims): `admin.js`, `alert.js`, `analytics.js`, `audience.js`, `auth.js`, `bank.js`, `category.js`, `cms.js`, `comment.js`, `commentActions.js`, `config.js`, `event.js`, `eventSearch.js`, `face.js`, `follow.js`, `like.js`, `notification.js`, `partner.js`, `paystackVerify.js`, `promos.js`, `pushToken.js`, `referral.js`, `search.js`, `team.js`, `testimonial.js`, `ticketToken.js`, `transfer.js`, `upload.js`, `users.js`, `wallet.js`, `withdraw.js`.
  - `controllers/` — **25 files** (not "14"): `admin.js`, `analytics.js`, `audience.js`, `auth.js`, `bank.js`, `category.js`, `commerce.js`, `curatedSection.js`, `event.js`, `face.js`, `faq.js`, `howItWorks.js`, `legal.js`, `marquee.js`, `notification.js`, `partner.js`, `promoBanner.js`, `promos.js`, `pushToken.js`, `siteConfig.js`, `social.js`, `team.js`, `testimonial.js`, `transfer.js`, `users.js`.
  - `models/` — **26 files** (not "14"): `Alert.js`, `Audience.js`, `Bank.js`, `Category.js`, `CoOrganizer.js`, `Comment.js`, `CuratedSection.js`, `Event.js`, `EventLike.js`, `FaqItem.js`, `Follow.js`, `HowItWorksStep.js`, `LegalDocument.js`, `MarqueeItem.js`, `Notification.js`, `PageContent.js`, `PromoBanner.js`, `PushToken.js`, `Referral.js`, `SiteConfig.js`, `Testimonials.js`, `User.js`, `Wallet.js`, `WebPushSubscription.js`, `Withdraw.js`, `token.js`.
  - `middleware/` — **contains only `upload.js`.** Auth verification (`verifyToken.js`, `verifyAdminRole.js`) actually lives in `utils/`, not `middleware/` as CLAUDE.md's folder tree implies — there is no single generic "`verifyUser`" middleware file; each route wires `verifyToken`/`verifyAdminRole` from `utils/` directly.
  - `services/` — one file, `ticketCreation.js`.
  - `src/__tests__/` — **TypeScript** test files (`bank.test.ts`, `middleware.test.ts`, `referral.test.ts`, `routes.test.ts`, `transfer.test.ts`) sitting inside an otherwise plain-JS project with no `tsconfig.json` — Vitest transpiles them on the fly, but nothing statically type-checks them.
- **Docker build note:** `apps/api/Dockerfile` runs plain `npm install --omit=dev --legacy-peer-deps` against `apps/api/package.json` directly — it does **not** use pnpm or the workspace lockfile at all (unlike `apps/web/Dockerfile`, which copies `pnpm-workspace.yaml`/`pnpm-lock.yaml` and runs `pnpm install`). The API also carries its own `apps/api/package-lock.json` alongside the root `pnpm-lock.yaml` — two parallel lockfile mechanisms for the same monorepo.

---

## 3. Shared Packages (API Surface)

### 3.1 `@comfytag/types` (`packages/types/src/index.ts`, 524 lines, single file)

Not "18 exports" as CLAUDE.md states — the file exports **over 40** interfaces/types, grouped by comment banners:
- **User & Auth:** `User`, `SessionUser` (extends `User` +`token`,+`logo`), `AuthResponse`.
- **Event:** `TicketTier`, `Performer`, `Event`.
- **Ticket/Audience:** `Ticket` (includes a large block of backend-enriched event fields: `eventDate`, `eventTime`, `eventEndTime`, `eventVenue`, `eventLocation`, `eventState`, `eventSlug`, `eventImage`).
- **Bank & Payouts:** `BankAccount`, `WithdrawRequest`.
- **Category:** `Category`.
- **Notification:** `NotificationType` (union of 15 string literals split "Partner/Attendee" vs "Admin"), `Notification`.
- **Promo Codes:** `PromoCode`.
- **Admin:** `AdminRole` (union: `super_admin`, `finance`, `kyc_reviewer`, `support`, `moderator`), `AdminUser`, `AuditLog`, `UserAdminProfile`, `KycApprovalPayload`, `KycRejectPayload`, `PayoutProcessPayload`, `PayoutRejectPayload`, `AdminPaginatedResponse<T>`.
- **API envelope:** `ApiResponse<T>`, `PaginatedResponse<T>`.
- **CMS:** `SiteConfig`, `MarqueeItem`, `PromoBanner`, `HowItWorksStep`, `CuratedSection`, `FaqItem`, `LegalSection`, `LegalDocument`, `PageSection`, `PageContent`.
- **Face:** `FaceLog`.
- **Partner Analytics:** `TierStats`, `EventAnalytics`, `PartnerRevenue`, `PartnerAnalytics`, `CheckInStats`, `AudienceExportRow`.

Note: `AdminRole` in the `admin` app (`apps/admin/src/lib/roles.ts`) — worth reconciling during rework whether it re-declares or imports this shared type (not verified in this pass).

### 3.2 `@comfytag/utils`

`src/index.ts` re-exports `constants.ts`, `auth.ts`, `geo.ts`, plus defines directly:
| Export | Purpose |
|---|---|
| `formatNaira(amount)` | NGN currency formatting via `Intl.NumberFormat` |
| `formatDate(dateString)` | `en-NG` locale date string |
| `formatTime(timeString)` | Handles both bare `"HH:MM"`/`"HH:MM AM/PM"` strings and full date strings |
| `isToday(dateString)` | Same-calendar-day check |
| `isUpcoming(dateString)` | Future-date check |
| `timeUntil(dateString)` | Human "Xd Yh away" countdown string |
| `slugify(text)` | URL-safe slug |
| `truncate(text, maxLength)` | Ellipsis truncation |
| `initials(name)` | Up to 2-letter avatar initials |
| `maskIdentifier(identifier)` | Masks phone or email for display (e.g. `08******1234`, `ab***@domain`) |
| `calculatePlatformFee(amount, feePercent=5)` | Platform's own cut |
| `calculatePaystackFee(amount)` | Paystack's fee formula (1.5% + ₦100, capped ₦2000) |
| `totalCharges(amount)` | Combines the two above into `{platformFee, paystackFee, total}` |
| `isValidEmail(email)` | Regex email check |
| `isValidNigerianPhone(phone)` | Regex `+234`/`0` + carrier-prefix check |
| `STORAGE_KEYS` | Const object of local/async-storage key names (`AUTH_TOKEN`, `USER`, `APP_MODE`, `PUSH_TOKEN`, `TICKETS`, `EVENT_DRAFT`) — shared naming convention across web (localStorage) and mobile (AsyncStorage) |

`auth.ts`: `authHeader(token)` (returns an `{headers}` object or `{}`), `decodeJwtPayload<T>(token)` (raw base64 JWT payload decode, no signature verification — client-side convenience only), `decodeUserId(token)`.

`geo.ts`: hand-curated **static lookup tables** (no geocoding API) — `NIGERIA_VENUE_COORDS` (~40 named venues), `NIGERIA_AREA_COORDS` (~34 Lagos/Abuja/state-capital areas), `NIGERIA_STATE_COORDS` (36 states), `DEFAULT_NIGERIA_COORD`, and `getVenueCoords(venue, location, state)` — a venue→area→state→default fallback chain used by both the web map view and the mobile ticket-detail map, per the file's own header comment (`geo.ts:1-5`). This is a real architectural fact for the rework: **there is no geocoding service** — location precision is entirely dependent on this hand-maintained table matching an organizer's free-text venue string.

`constants.ts`: `NIGERIAN_STATES` (37 entries incl. `'FCT - Abuja'`), `EVENT_CATEGORIES` (15 entries), `WHATSAPP_GREEN` (`#25D366`) — a hardcoded third-party brand color, exempted from the design-token rule by its own comment banner ("Third-party brand colours").

### 3.3 `@comfytag/ui`

Exports **17 components**, not "8 universal primitives" as CLAUDE.md's tech-stack description claims. Design tokens (`colors`, `spacing`, `containers`, `radius`, `motion`, `typography`, `layout`) are re-exported from `./tokens`. Component API surface (technical only, no visual detail — see the separate design document for that):

| Component | Props | Notes |
|---|---|---|
| `Button` | `children, variant?('primary'|'secondary'|'ghost'|'danger'), size?('sm'|'md'|'lg'), loading?, disabled?, type?, form?, onClick?, fullWidth?, className?` | `'use client'`; internally uses `useState` for hover styling |
| `Input` | `label?, id?, type?, value, onChange, placeholder?, error?, required?, disabled?, leftIcon?, className?` | `'use client'`; has built-in password show/hide eye icon toggle |
| `Textarea` | `label?, id?, value, onChange, placeholder?, error?, required?, disabled?, rows?(default 4), className?` | `'use client'` |
| `Select` / `SelectItem` | `Select: label?, id?, value, onChange, children, error?, required?, disabled?, className?`; `SelectItem: value, children, disabled?` | thin wrapper over native `<select>`/`<option>` |
| `Badge` | `status: string, className?` | looks up color via `colors.badges[status]`, falls back to a muted default for unknown statuses |
| `Skeleton` | `width?, height?, borderRadius?, className?` | CSS-in-JS pulse animation via injected `<style>` keyframes |
| `Modal` | `isOpen, onClose, title, children, footer?, closeOnBackdropClick?(default true)` | focus-trap/restore via `triggerRef`, respects `prefers-reduced-motion` |
| `EmptyState` | `title, subtitle?, action?({label,href}), className?` | fade-in entrance animation, reduced-motion-aware |
| `LoadingSpinner` | `size?('sm'|'md'|'lg'), centered?, className?` | |
| `ErrorMessage` | `message, onRetry?, className?` | |
| `PageHeader` | `title, subtitle?, action?(ReactNode), align?('start'|'center'), titleSize?('md'|'lg')` | |
| `StatCard` | `icon(ComponentType), value, label, isLoading?` | shows a `Skeleton` in place of the value while loading |
| `DataTable<T>` | `columns: ColumnDef<T>[], data: T[], isLoading?, keyField?, emptyTitle?, emptySubtitle?` — `ColumnDef<T>: {key, header, render(row)=>ReactNode, width?}` | renders `EmptyState` when `data.length===0`, skeleton rows (5) while loading |
| `AvatarInitials` | `name, src?, size?(default 40), fontSize?, className?` | falls back to initials (via `@comfytag/utils#initials`) when no `src` |
| `InfoField` | `label, value(ReactNode), className?` | read-only label/value pair |
| `FullScreenLoader` | `message?` | full-viewport centered `LoadingSpinner` |
| `MediaUploader` | `label, accept('image'|'video'), multiple?, urls: string[], onAdd(newUrls), onRemove(url), uploadFn(file)=>Promise<string>` | not exported with a typed `Props` interface (the internal type is literally named `Props`, not `MediaUploaderProps` like every sibling — inconsistent naming, `index.ts:36-37` even exports an empty `export type {}` for it) |

`packages/ui/src/tokens/effects.ts` — marked deprecated by its own header comment ("Glass morphism, glow effects, and the fire gradient... removed as of design.md v2.0"). Verified via repo-wide grep: **no file anywhere in `apps/` or `packages/` imports from `tokens/effects.ts`** — it is fully dead code, safe to delete outright in the rework rather than merely "not used for new work."

---

## 4. State Management Patterns

**Server state — TanStack React Query v5** (resolved `5.100.9`, consistent across web/partner/admin/mobile) is the exclusive server-state layer on every app. Convention, consistent across web/partner/admin/mobile: a `hooks/queryKeys.ts` file per app exporting namespaced key-factory objects, e.g. web's `apps/web/src/hooks/queryKeys.ts`:
```ts
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (filters: object) => [...eventKeys.lists(), filters] as const,
  detail: (slug: string) => [...eventKeys.all, 'detail', slug] as const,
  ...
}
```
Each domain (`eventKeys`, `ticketKeys`, `profileKeys`, `notificationKeys` in web; equivalents per app) gets its own key factory, and one dedicated hook file per feature area wraps `useQuery`/`useMutation` (e.g. `useEvents.ts`, `useTickets.ts`, `useNotifications.ts`). This is applied uniformly — web has 11 hook files, partner 13, admin 19 (the largest, reflecting CMS-editing surface), mobile 12.

**Client/UI state:**
- Web/partner/admin: plain `useState`/`useContext` (`src/contexts/` per app), no Redux/Zustand on the frontend Next.js apps.
- Partner has one Zustand-flavored exception: `useShellStore.ts` (dashboard shell UI state, e.g. sidebar collapse) — worth checking during rework whether it's actually Zustand or a custom hook of the same naming convention (not opened in this pass).
- Mobile: **Zustand** (`src/store/authStore.ts`, `eventDraftStore.ts`, `modeStore.ts`) is the single global-state mechanism — `authStore` holds `{user, token, isLoggedIn}` plus `setUser`, `updateUser` (partial-patch merge), and `logout` (which also clears the local ticket cache via `clearTicketCache`).

**Real-time state:** all three Next.js apps and mobile have a `useSocket.ts`/`socket.ts` (Socket.io client) and a `useNotificationSocket.ts` hook layering live notification pushes on top of the React Query cache (presumably via `queryClient.invalidateQueries`/`setQueryData` — not individually verified per hook in this pass). Partner additionally has `useSSE.ts` — **a second live-update transport (Server-Sent Events) alongside Socket.io**, worth reconciling into one mechanism during rework.

---

## 5. Cross-App Authentication Architecture

All three Next.js apps use **NextAuth.js v4 (`^4.24.14`)** with the **JWT session strategy** (no database sessions), each with its own `apps/<app>/src/lib/auth.ts` and its own `apps/<app>/src/proxy.ts`.

**Cookie namespacing:** because all three apps run on `localhost` in dev (different ports only) and browser cookies aren't port-scoped, each app's `auth.ts` explicitly renames every NextAuth cookie (`sessionToken`, `callbackUrl`, `csrfToken`, `state`, `pkceCodeVerifier`, `nonce`) with a `.web`/`.partner`/`.admin` suffix, documented inline in each file — otherwise logging into one app silently clobbers another's session cookie.

**Providers per app:**
| App | Providers | Notes |
|---|---|---|
| `web` | Credentials (email/password), Credentials (`id: 'token'`, backend-token exchange for handoff flows), Google (conditional on `GOOGLE_CLIENT_ID`/`SECRET` env presence), **Apple** (conditional on `APPLE_ID`/`APPLE_TEAM_ID`) | **CLAUDE.md's "Gmail OAuth (Social Login)" section only documents Google — Apple Sign-In is a real, wired-up provider (`apps/web/src/lib/auth.ts:3,148-155`) that goes entirely undocumented.** |
| `partner` | Credentials (email/password, with optional `otp` field for 2FA), Credentials (`id:'token'`), Google (unconditional — no env-presence guard, unlike web) | signIn callback rejects Google sign-in unless the backend returns `isPartner` or `isAdmin`; unlocks a one-time onboarding gate via `proxy.ts` |
| `admin` | Credentials only (email/password + optional `otp`) | No OAuth provider at all; rejects sign-in unless `user.isAdmin` |

**Session shape:** each app augments the `next-auth` module types with its own `Session`/`User`/`JWT` interfaces (module augmentation blocks at the top of each `auth.ts`). `web` and `partner` both attach the full `SessionUser` (from `@comfytag/types`) plus a bespoke `token` field; `admin`'s session is much leaner (`id, name, email, token, role: AdminRole`) since it doesn't need the attendee/organizer profile shape.

**Route protection — NOT via a file literally named `middleware.ts`.** Next.js 16 has renamed the middleware convention to `proxy.ts`, and all three apps use that new filename (`apps/{web,partner,admin}/src/proxy.ts`), each wrapping `withAuth` from `next-auth/middleware`:
- `web/proxy.ts`: allow-lists a `PROTECTED_PATHS` array (`/checkout`, `/tickets`, `/my-following`, `/notifications`, `/profile`, `/hype-link`, `/saved`) — everything else is public by default.
- `partner/proxy.ts`: protects everything **except** an explicit `PUBLIC_PATHS` list (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/handoff`) — i.e. the opposite default from web (deny-by-default vs allow-by-default) — plus custom logic redirecting authenticated users away from auth pages, and enforcing the one-time onboarding gate (`token.onboarding.completed`).
- `admin/proxy.ts`: protects everything except `/` and `/login`.
- **In addition**, `partner` and `admin` (but not `web`) also do a second, server-side `getServerSession()` check + `redirect('/login')` inside their `app/(dashboard)/layout.tsx` — defense-in-depth duplicate of the proxy-level check. `web` relies on `proxy.ts` alone.

**Mobile authentication is entirely separate and does not use NextAuth:** `apps/mobile/src/store/authStore.ts` is a plain Zustand store holding `{user, token}`; `apps/mobile/src/lib/api.ts` reads the bearer token out of `AsyncStorage` (key from `@comfytag/utils#STORAGE_KEYS.AUTH_TOKEN`) via an axios request interceptor on every call. Confirms CLAUDE.md's "mobile: email/password only, no Gmail OAuth" claim. Note `expo-secure-store` is also a dependency (typically the more secure choice for tokens on-device) but the actual token read/write path found in `lib/api.ts` goes through `AsyncStorage`, not `SecureStore` — worth confirming during rework whether `SecureStore` is used elsewhere (e.g. for the face-template key) or is unused.

---

## 6. API Client Layer

| App | File | Base URL | Auth injection | Error handling |
|---|---|---|---|---|
| `web` | `src/lib/api.ts` | `NEXT_PUBLIC_API_URL ?? 'http://localhost:4002'` | `setApiToken(token)` mutates `api.defaults.headers.common['Authorization']` imperatively (called from wherever the session is read, not an interceptor) | none built into the client itself |
| `partner` | `src/lib/api.ts` | same pattern (not opened line-by-line, inferred consistent from `adminApi.ts`/`api.ts` split pattern seen elsewhere) | — | — |
| `admin` | `src/lib/api.ts` **and** `src/lib/adminApi.ts` | two separate axios instances | — | `adminApi.ts` likely scopes to `/admin/*` backend routes vs general `/*` — exact split not verified line-by-line in this pass |
| `mobile` | `src/lib/api.ts` | `EXPO_PUBLIC_API_URL`, `timeout: 10000` | **Request interceptor** reads token from `AsyncStorage` on every call (`api.interceptors.request.use`) — different mechanism from the web apps' imperative `setApiToken` | **Response interceptor** normalizes backend `{data:{message}}` errors onto `error.message` so calling code can just read `err.message`; exports typed `get/post/put/del<T>()` convenience wrappers around a default-exported axios instance |

The web apps rely on NextAuth's `session.user.token` (the backend JWT re-exposed through the NextAuth JWT/session callbacks — see §5) as the source of truth for the bearer token, imperatively synced into the axios instance; mobile has no NextAuth layer and instead persists/reads the raw JWT directly via AsyncStorage on both write (login) and every read (interceptor). These are two structurally different auth-token plumbing strategies for what is nominally the same backend JWT contract — a good rework normalization target (a single `@comfytag/api-client` package is a plausible outcome, though none exists today; each app hand-rolls its own axios instance).

---

## 7. Testing Setup & Current Coverage

### 7.1 Playwright (web/partner/admin E2E)

`playwright.config.ts` (root): three `projects`, each pointed at a different `testDir` and `baseURL`:
| Project | testDir | baseURL |
|---|---|---|
| `web` | `./tests/e2e` | `http://localhost:3000` |
| `partner` | `./tests/e2e-partner` | `http://localhost:3001` |
| `admin` | `./tests/e2e-admin` | `http://localhost:3002` |

`webServer` config auto-starts all three Next dev servers (`--turbopack`) with `reuseExistingServer: true`.

Actual spec files:
- `tests/e2e/` (8 files, all against the **web** app despite the directory name being shared with the project name): `01-public-pages.spec.ts`, `02-components.spec.ts`, `03-auth-flows.spec.ts`, `04-ticket-flows.spec.ts`, `05-partner-dashboard.spec.ts`, `06-admin-dashboard.spec.ts`, `07-event-detail.spec.ts`, `07-realtime-notifications.spec.ts`. **Files `05-partner-dashboard.spec.ts` and `06-admin-dashboard.spec.ts` live in `tests/e2e/` (the web project's testDir) rather than `tests/e2e-partner/` or `tests/e2e-admin/`** — given Playwright's config, these two files are actually exercised as part of the **`web`** project run (against `localhost:3000`), which is very likely not the intent given their names; needs verification/fix in the rework.
- `tests/e2e-partner/` — **one file**, `01-partner.spec.ts`.
- `tests/e2e-admin/` — **one file**, `01-admin.spec.ts`.

**Current recorded pass/fail state:** two different, both stale, artifacts exist:
- `tests/test_output.log` / `tests/test_error.log` — dated **May 14, 2026** — the tail of `test_output.log` shows a clean `34 passed (52.3s)` run, but that run only covers `01-public-pages.spec.ts` and `02-components.spec.ts` (34 tests total), not the full suite. `test_error.log` from the same date captured a **since-fixed bug**: `packages/ui/src/components/Button.tsx` was crashing every server-rendered page with `TypeError: useState only works in Client Components... Add "use client"` — confirmed via `git log -p` that a `'use client'` directive was added to `Button.tsx` in commit `02127e3 "Fix Day 1 P1: Button ghost variant, EventCard overlay, Footer, city localStorage"`, and the current file (`packages/ui/src/components/Button.tsx:1`) does have it. This log is historical, not current signal.
- `tests/results.json` — dated **July 11, 2026** (`Jul 11 00:35`), a fuller run: **30 expected (passed), 105 skipped, 16 unexpected (failed), 1 flaky.** Failures/timeouts cluster in `03-auth-flows.spec.ts` (signup form fields, weak-password validation, password-mismatch validation, login-with-valid-credentials redirect, invalid-credentials error, submit-button-disabled-state, all four forgot-password cases) and `04-ticket-flows.spec.ts` (event-detail view, ticket-tier/pricing display, tier+quantity selection, an "interrupted" purchase-requires-login case) — i.e. the entire authenticated/transactional path was failing or timing out as of that run, while static/public-page tests (`01-public-pages`, `02-components`) were largely green.
- **Neither log reflects the current state of the repo** (today is Aug 21, 2026; both predate the current uncommitted 129-file diff on `mobile-redesign-updates`). The rework team should treat "does the E2E suite currently pass" as an open, re-verify-first question, not something this document can answer from stale artifacts. Per project memory rules, Playwright must not be auto-run — the command to re-verify is `pnpm playwright test` (or `pnpm playwright test tests/e2e/03-auth-flows.spec.ts` for just the failing file), to be run and pasted back by the user.

### 7.2 Vitest (unit/integration)

Every app except mobile uses Vitest 2 + `@vitest/coverage-v8`:
- `web`: `src/__tests__/components.test.tsx` (1 file).
- `partner`: `src/__tests__/components.test.tsx` (1 file).
- `admin`: **zero test files** despite full Vitest/RTL tooling being configured (`vitest.config.ts`, `test-setup.ts`, devDependencies all present) — the largest coverage gap in the frontend layer.
- `api`: `src/__tests__/{bank,middleware,referral,routes,transfer}.test.ts` (5 files) — written in **TypeScript** despite the app itself having no `tsconfig.json`; uses `mongodb-memory-server@^9.0.0` + `supertest@^7.0.0` for integration-style route tests against an in-memory Mongo instance.
- `packages/ui`: `src/__tests__/components.test.tsx` (782 lines — the single largest test file in the repo, presumably covering most/all 17 exported components).
- `packages/utils`: `src/__tests__/utils.test.ts` (387 lines).

### 7.3 Mobile

Jest (`jest-expo` preset) with tests under `apps/mobile/src/__tests__/{components,hooks,store}/` plus `queryKeys.test.ts`. Maestro E2E flows listed in §2.4.

---

## 8. Build & Deployment Setup

**Dockerfiles** — one per deployable app (`apps/{web,partner,admin,api}/Dockerfile`), all multi-stage:
- `web`/`partner`/`admin`: `node:22-alpine` base, `corepack enable`, copy `pnpm-workspace.yaml`/`pnpm-lock.yaml`/`package.json`/`turbo.json` + `packages/` + the specific app dir, `pnpm install --frozen-lockfile`, then `pnpm --filter @comfytag/<app> build`, then a slim `runner` stage running Next's **standalone output** as a non-root user (`nextjs:1001`). `web`'s Dockerfile has an inline comment-flagged workaround ("🛠️ THE FIX") manually copying `.next/static` and `public/` into the standalone output directory — standard Next-standalone footgun, not automatically handled.
- `api`: `node:22-alpine`, but **does not use pnpm at all** — copies only `apps/api/package.json` and runs plain `npm install --omit=dev --legacy-peer-deps` against it, i.e. it is built and dependency-resolved as if it were a standalone npm project, not a workspace member. It carries its own `package-lock.json` (npm) alongside the monorepo's `pnpm-lock.yaml` — two independent lockfiles covering overlapping dependency sets, a real drift risk (the API's actually-installed versions can silently diverge from what `pnpm-lock.yaml` would resolve).

**docker-compose.yml** (dev): `redis` (7.2-alpine, port 6380→6379) + `api` (built from `apps/api`, port 4002, `NODE_ENV=development`, bind-mounts `./apps/api:/app` for live reload). **Only the API runs in dev-compose** — the three Next.js apps are expected to run via `pnpm dev` directly on the host, not containerized in dev.

**docker-compose.prod.yml**: adds `nginx` (1.27-alpine, reverse proxy, port 80, health-checked), `web`, `partner`, `admin` (each built from repo root using their own Dockerfile, each with a `wget --spider` healthcheck), `api` (`nc -z localhost 4002` healthcheck), `redis` (named `comfytag-redis-prod`, `redis-cli ping` healthcheck). No TLS termination visible in this compose file itself (likely handled by `nginx/nginx.conf`, not read in this pass).

**`scripts/test-docker-builds.sh`** (165 lines, referenced by CLAUDE.md as a mandatory pre-push gate): 6-stage script — (1) `docker compose -f docker-compose.prod.yml build --no-cache`, (2) `docker compose ... config` validation, (3) `docker compose ... up -d` with a 60s timeout, (4) checks every container's `Up`/`Restarting` status via `docker compose ps`, (5) verifies `/app/apps/<app>/server.js` exists inside each of `web`/`partner`/`admin`'s built images, (6) curls each of the four service URLs (`localhost:3000/3001/3002`, `localhost:4002/api/health`) plus `redis`/`nginx` in the container-status check. Exits non-zero (with an explicit "do not push" message) on any failure, and cleans up (`docker compose down`) at the end regardless of outcome.

**CI (`.github/workflows/deploy.yml`)** — the **only** GitHub Actions workflow in the repo (no separate PR-check workflow — `deploy.yml` only triggers on `push` to `main`, meaning there is no CI gate on feature branches/PRs before merge):
1. `quality-gate` job: spins up a `mongo:7.0` service container, `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm --filter !@comfytag/partner lint` (**partner is explicitly excluded from the lint gate** — no comment explaining why, worth investigating), `pnpm build`, then `pnpm test:ci` — **with `continue-on-error: true`**, meaning a failing test suite does not block the deploy pipeline from proceeding to `docker-build`/`deploy-production`.
2. `docker-build`: builds `docker-compose.prod.yml` images, tags and pushes to GHCR (`ghcr.io/<owner>/comfytag-{api,web,partner,admin}:latest`), injects `NEXT_PUBLIC_*` build-time env vars inline in the workflow (since `NEXT_PUBLIC_*` values are baked at build time and the GH runner never sees the VPS's real `.env`), and runs a trivial `node -e "console.log(...)"` smoke check inside each built image.
3. `deploy-production`: SSHes into `PRODUCTION_HOST`, pulls the pushed images, retags them locally, `docker compose -f docker-compose.prod.yml up -d --no-build`, reloads nginx, polls `https://comfytag.com` up to 10 times for a health check.
4. `production-health`: post-deploy SSH check for restarting containers / elevated error-log volume.
5. `notify-failure`: on any job failure, opens a GitHub issue and posts to a Slack webhook.

**Env var inventory (names only, no values read):**
| File | Vars |
|---|---|
| root `.env.example` | `CLOUDINARY_*` (3), `EMAIL_SENDER_*` (5: DEFAULT/EVENTS/HELLO/PARTNER/PAYOUTS/SUPPORT/TICKETS), `JWT_SECRET`, `KBYAI_LICENSE_KEY`, `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY`, `RESEND_API_KEY`, `SLACK_WEBHOOK_URL`, `TERMII_API_KEY`, `TERMII_SENDER_ID`, `YCLOUD_API_KEY`, `ZEPTOMAIL_SMTP_{HOST,PORT,TOKEN,USER}` |
| `apps/api/.env.example` | `ADMIN_URL`, `AWS_{ACCESS_KEY_ID,REGION,SECRET_ACCESS_KEY}`, `CLOUDINARY_*` (3), `JWT_SECRET`, `MONGO` (note: **not** `MONGODB_URI` — a different variable name than the root example for the same concern), `NODE_ENV`, `PARTNER_URL`, `PAYSTACK_*` (2), `PORT`, `REDIS_{HOST,PORT,URL}`, `SES_SENDER_EMAIL`, `WEB_URL` |
| `apps/web/.env.example` | `GOOGLE_CLIENT_{ID,SECRET}`, `NEXTAUTH_{SECRET,URL}`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_{API_KEY,MAP_ID}`, `NEXT_PUBLIC_PARTNER_URL`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `RESEND_API_KEY`, `RESEND_FROM_{DEFAULT,TICKETS}` |
| `apps/partner/.env.example` | **file does not exist** |
| `apps/admin/.env.example` | **file does not exist** |
| `apps/mobile/.env.example` | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_FACE_SDK_KEY`, `EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY` |

Note `AppleProvider` in `apps/web/src/lib/auth.ts` reads `APPLE_ID`/`APPLE_TEAM_ID`/`APPLE_PRIVATE_KEY`, none of which appear in **any** `.env.example` file in the repo — an undocumented required-for-Apple-Sign-In env surface.

---

## 9. Discrepancies Found vs CLAUDE.md

| # | CLAUDE.md claim | What's actually in the repo | Where verified |
|---|---|---|---|
| 1 | "Mongoose 8.0.x" | `package.json` pins `^6.7.2`; **installed/resolved version is 6.13.9** | `apps/api/package.json:40`, `apps/api/node_modules/mongoose/package.json` |
| 2 | "Axios 1.6.5" | resolved `1.16.0` in web (and same range `^1.16.0` in partner/admin/mobile/api) | `apps/web/node_modules/axios/package.json` |
| 3 | "TanStack React Query 5.0.0" | resolved `5.100.9` everywhere it's used | `apps/web/node_modules/@tanstack/react-query/package.json` |
| 4 | "8 universal primitives: Button, Input, Badge, Modal, Skeleton, EmptyState, LoadingSpinner, ErrorMessage" | **17** exported components — the 8 named plus `Textarea`, `Select`/`SelectItem`, `MediaUploader`, `PageHeader`, `StatCard`, `DataTable`, `AvatarInitials`, `InfoField`, `FullScreenLoader` | `packages/ui/src/index.ts:16-49` |
| 5 | "@comfytag/types — 18 exports" | **40+** exported interfaces/types in a single 524-line file | `packages/types/src/index.ts` |
| 6 | "@comfytag/utils — 15 exports" | ~16 functions/consts directly in `index.ts` **plus** everything re-exported from `auth.ts` (3 more) and `geo.ts` (5 more, including large static coordinate tables) — the file count undercounts the actual surface | `packages/utils/src/index.ts`, `auth.ts`, `geo.ts` |
| 7 | "18 route files, 14 controllers, 14 Mongoose schemas" | **31 route files, 25 controllers, 26 models** | `apps/api/routes/`, `apps/api/controllers/`, `apps/api/models/` (directory listings) |
| 8 | "middleware/ [auth, upload, validation]" | `middleware/` contains **only `upload.js`**; auth verification (`verifyToken.js`, `verifyAdminRole.js`) lives in `utils/`, not `middleware/`; no dedicated request-validation middleware file was found | `apps/api/middleware/`, `apps/api/utils/` |
| 9 | "All endpoints protected by `verifyUser` middleware" | No function or file named `verifyUser` exists; the actual functions are `verifyToken`/`verifyAdminRole` in `apps/api/utils/` | grep across `apps/api` |
| 10 | Route protection via "middleware.ts" | Next.js 16's convention has renamed this file to **`proxy.ts`** in all three apps — there is no `middleware.ts` anywhere in the repo | `apps/{web,partner,admin}/src/proxy.ts` |
| 11 | "Gmail OAuth (Social Login)... Applies to: Web app + Partner dashboard" | Web also wires up **Apple Sign-In** (`AppleProvider`), entirely undocumented, with required env vars (`APPLE_ID`, `APPLE_TEAM_ID`, `APPLE_PRIVATE_KEY`) present in neither `.env.example` file | `apps/web/src/lib/auth.ts:3,148-155` |
| 12 | "Firebase Cloud Messaging SDK 9.x" for push | No Firebase/FCM dependency exists anywhere in `apps/mobile/package.json`; push is implemented via `expo-notifications` | `apps/mobile/package.json` |
| 13 | "Node.js 20 LTS" runtime | Every Dockerfile uses `node:22-alpine`; CI pins Node `22.13` | `apps/*/Dockerfile`, `.github/workflows/deploy.yml` |
| 14 | Node.js implied as the whole stack's TypeScript-everywhere posture ("strict, no `any`, all endpoints typed") | `apps/api` is plain JavaScript with **no `tsconfig.json` and no `typecheck` script** — it is fully outside this rule by construction, not merely inconsistently following it | `apps/api/package.json`, absence of `apps/api/tsconfig.json` |
| 15 | Partner routes listed: `/login, /overview, /events, /events/[id], /events/create, /settings, /withdraw, /notifications` | Actual `(dashboard)` route group also contains `/analytics`, `/attendees`, `/kyc`, `/profile`, `/team`, `/tiers` — six additional top-level routes not mentioned | `apps/partner/src/app/(dashboard)/` listing |
| 16 | Admin routes listed (13 named) | Matches closely but omits `/categories` and `/cms`, both real routes | `apps/admin/src/app/(dashboard)/` listing |
| 17 | Turbo "2.9.12" | Confirmed accurate | `node_modules/turbo/package.json` |
| 18 | pnpm "11.0.9" | Confirmed accurate | `package.json:24` |
| 19 | Next.js "16.2.6" / React "19.2.4" for web/partner/admin | Confirmed accurate for those three apps; **mobile runs React 19.1.0**, a real cross-app split not mentioned anywhere | `apps/mobile/package.json:46-47` |
| 20 | Playwright "1.46+" | root devDependency is `^1.60.0` — satisfies the claim but is a much newer minimum than stated | `package.json:19` |

---

## 10. Observations & Risks

**Repository stability signal:** the current branch (`mobile-redesign-updates`) has **129 uncommitted changes** (`git status --short`: 104 modified, 15 deleted, 10 untracked) at the time of this audit — including a deleted component (`apps/partner/src/components/dashboard/PartnerBottomTabBar.tsx`) and modified files spanning `apps/api`, `apps/mobile`, and nearly every file under `apps/partner`. This is mid-flight, not a stable baseline; any rework decision should treat the currently-committed `main`/last-merge state, not this working tree, as the reference point unless the user intends to carry these changes forward.

**Test infrastructure gaps:**
- `apps/admin` has zero unit tests despite full Vitest tooling being configured — the largest coverage gap among the four frontends (`apps/admin` has no `__tests__` directory anywhere).
- Two of the E2E project's spec files (`05-partner-dashboard.spec.ts`, `06-admin-dashboard.spec.ts`) are physically located in `tests/e2e/` (the `web` project's testDir), so per `playwright.config.ts` they run against `localhost:3000` rather than the partner/admin apps their names imply — likely a misplacement bug in the test suite itself, not the apps under test.
- CI's `pnpm test:ci` step has `continue-on-error: true` (`.github/workflows/deploy.yml`), so a red test suite does not block production deploys — the "quality gate" job name is aspirational for this step specifically.
- CI's lint step explicitly excludes partner (`pnpm --filter !@comfytag/partner lint`), with no comment explaining why — worth investigating whether partner currently fails lint.
- The last full Playwright run on record (`tests/results.json`, dated July 11, 2026) showed the entire authenticated/transactional flow (login, signup, forgot-password, ticket purchase) failing or timing out (16 failed, 1 flaky out of 46 non-skipped). This predates the current uncommitted diff and cannot be assumed to reflect current behavior — re-running the suite (`pnpm playwright test`, not auto-run per project memory rules) should be an early step in the rework, not an afterthought.

**Duplicated/competing dependencies (candidates for consolidation):**
- Three mapping libraries installed simultaneously in `web`: `mapbox-gl`, `maplibre-gl` (+`react-map-gl`), and `@vis.gl/react-google-maps`.
- Two QR-scanning libraries in `partner`: `@zxing/library` and `html5-qrcode`.
- Two TOTP/2FA libraries in `api`: `otplib` and `speakeasy`.
- Two real-time transports across the stack: Socket.io (used everywhere) and, additionally, Server-Sent Events in `partner` (`useSSE.ts`) — a second live-update mechanism whose scope vs Socket.io wasn't reconciled in this pass.
- At least three email-sending paths referenced across env files/dependencies: Resend (`resend` package, `RESEND_*` vars in root and web `.env.example`), AWS SES (`SES_SENDER_EMAIL`, `AWS_*` vars in api `.env.example`), and Zeptomail SMTP (`ZEPTOMAIL_SMTP_*` in root `.env.example`), plus `nodemailer` as the sending library in `apps/api`.
- Two parallel lockfile mechanisms for the API: the monorepo's `pnpm-lock.yaml` and `apps/api/package-lock.json` (npm) — the API's Dockerfile builds from the npm lockfile directly, bypassing pnpm/workspace resolution entirely, which is a real supply-chain/drift risk (the versions actually shipped to production for the API are not guaranteed to match what `pnpm-lock.yaml` would resolve).

**Dead/orphaned code:**
- `@auth/mongodb-adapter` is a dependency of `apps/web` and `apps/admin` but is never imported anywhere in either app's source — both use pure JWT-strategy NextAuth with no database adapter wired up.
- `packages/ui/src/tokens/effects.ts` is marked deprecated in its own header comment and confirmed (via repo-wide grep) to have zero remaining imports — safe to delete rather than merely avoid.
- `apps/api` depends on `antd` (a full React component library) and `react@^18.2.0` despite being a headless Express API with no view layer — near-certainly vestigial. `heroku`, `telnet-client`, `telnet-stream` are also present with no obvious current call site found in this pass and should be re-verified for removal.

**Documentation gaps:**
- `apps/partner` and `apps/admin` have **no `.env.example` file at all** — the only documentation of their required env vars is the live (gitignored) `.env`/`.env.local` files nobody outside the current developer can see. This is the single most actionable gap for onboarding a rework team.
- The `apps/api/.env.example` uses `MONGO` as its Mongo connection-string variable name while the root `.env.example` uses `MONGODB_URI` for the apparently same concern — inconsistent naming that risks silent misconfiguration.
- Apple Sign-In's three required env vars (`APPLE_ID`, `APPLE_TEAM_ID`, `APPLE_PRIVATE_KEY`) appear in no `.env.example` anywhere despite being live code paths in `apps/web/src/lib/auth.ts`.

**Naming/convention inconsistencies:**
- `MediaUploader`'s prop interface is named `Props` internally instead of `MediaUploaderProps` like every other component in `@comfytag/ui`, and its type isn't exported (`export type {}` is a no-op re-export) — inconsistent with the package's own established pattern.
- `apps/admin` builds with plain `next build` while `apps/web`/`apps/partner` explicitly force `next build --webpack` — an unexplained build-tool divergence worth resolving one way or the other (Turbopack production builds may or may not be intended for admin).
- TypeScript devDependency pinning is inconsistent: web/partner/admin use `"typescript": "^5"` (floating major-5), mobile pins `"typescript": "~5.9.2"` (patch-locked) — different tolerance for drift across apps in the same monorepo.

**Architectural facts worth flagging for the rework decision, not necessarily "bugs":**
- There is no geocoding service anywhere in the stack; all map placement (web + mobile) depends on `@comfytag/utils`'s hand-curated ~40-venue/~34-area/36-state static coordinate tables (`packages/utils/src/geo.ts`) matching an organizer's free-text venue/location/state strings. This will not scale past the currently-covered cities without ongoing manual table maintenance.
- Payments integrations (Paystack) are hand-rolled over raw HTTP rather than an official SDK (no `paystack`-family package in `apps/api/package.json`) — a legitimate choice, but one to make deliberately rather than by default in a rework.
- Auth-token plumbing differs structurally between the three Next.js apps (NextAuth JWT/session, imperatively synced into axios) and mobile (raw JWT in AsyncStorage, injected via an axios request interceptor) — there is no shared `@comfytag/api-client` package; each app hand-rolls its own axios instance and auth-injection strategy.
