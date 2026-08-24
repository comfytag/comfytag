# ComfyTag — Design System & UI Implementation: Current State

**Prepared:** August 21, 2026
**Purpose:** Pure documentation of the design system and UI implementation as it exists in the repository today, for use by an advisory team deciding what to keep, fix, or redo. This document changes nothing outside `Rework/`; `design.md` was read only, never modified.

ComfyTag is a Nigerian biometric event-ticketing platform ("your face is your ticket") built as a pnpm/Turborepo monorepo with four apps — `web` (attendee, Next.js), `partner` (organizer dashboard, Next.js), `admin` (Next.js), and `mobile` (Expo/React Native) — sharing three packages: `@comfytag/types`, `@comfytag/utils`, and `@comfytag/ui` (the design-token and component library). The findings below come from reading the token source files, every universal and dashboard-specific UI component, the app route trees, and repo-wide greps for hardcoded colors, inline styling, and accessibility markers — not from documentation claims.

---

## 1. Design System Version Conflict — v1.1 "Locked" vs. v2.0 Described Direction

**This is not a hypothetical conflict to reconcile — it is already partially resolved in one place and unresolved in another, and the two places disagree with each other.**

**What `files/design.md` actually says (read in full):** the file at the repo's documented design.md location is headed *"Version 2.0 — July 2026"* and is **already** the v2.0 document, not v1.1. It:
- States the v2 philosophy explicitly: "premium reads as calm, not energetic... depth and emphasis come from typography weight, spacing, and colour contrast — never from shadow, blur, or glow," applied platform-wide.
- Documents a tightened border-radius scale (`sm 4px / md 6px / lg 8px / xl 10px / 2xl 10px` — 2xl merged into xl), replacing a "v1 scale" it references but doesn't fully restate.
- Documents "Elevation via Border + Contrast" as the sole depth mechanism, replacing the v1.1 box-shadow ladder, and states this explicitly removes shadow, `backdrop-filter`, and glow on any surface in either system.
- Formalizes Anybody Variable (display) and Space Grotesk (labels) as typefaces that were "already shipped in code... but never documented" before v2.
- Contains a **Version History table** (1.0 → 1.1 → 2.0) that itself documents the reconciliation: v2.0's entry explicitly calls out that the "Afterdark Kinetic" effort (May–Jun 2026) introduced glass morphism, glow, and a fire gradient (`#a078ff→#ff516a`) *undocumented*, and that these are now deprecated/removed.
- Contains an explicit closing note stating `AFTERDARK_KINETIC_SUMMARY.md`'s claim of being "PRODUCTION READY... locked in code, no further design changes needed" is **superseded** by v2.0, and that `AFTERDARK_KINETIC_SUMMARY.md` should be treated as historical record only.

So `design.md` on disk has already resolved its own internal history and states unambiguously that v2.0, not v1.1, is current.

**What `CLAUDE.md` (project root) says — and where it contradicts itself:**
- The "Key Documentation Files" table lists `design.md` as *"Design system v1.1 (LOCKED)"* — stale, referencing a superseded version.
- The "CRITICAL RULES" section says *"NEVER modify design.md — it's locked (design council agreed v1.1 is final)"* — this is factually wrong against the file's own contents; v1.1 is not final, v2.0 superseded it in the same document.
- Yet the same `CLAUDE.md`'s own "Design System" section is headed *"v2.0 — LOCKED"* and accurately summarizes the v2.0 direction (tightened radius, no shadows, no glass/glow, border+contrast elevation), pointing readers to `design.md` v2.0 "for full detail."

**Net effect:** `design.md` is internally consistent and is v2.0. `CLAUDE.md` is internally inconsistent — one section correctly describes v2.0 as current and locked, while a different section (written earlier, not updated) still calls `design.md` "v1.1 (LOCKED)" and cites "v1.1 is final" as the reason not to touch it.

**Open questions for the rework team:**
1. Which statement governs: "v1.1 is final" (CLAUDE.md's critical-rules section) or "v2.0 is current, v1.1 is superseded" (design.md's own version history and CLAUDE.md's design-system section)? CLAUDE.md needs an internal fix regardless of what the rework decides, since it currently contradicts itself.
2. Section 3 and Section 6 below show that the *code* has only partially caught up to v2.0 — `packages/ui/src/tokens/base.ts` and the Tailwind config for web-based apps have migrated to the v2.0 radius scale, but `packages/ui/src/tokens.native.ts` (the file mobile actually consumes) is still on the **v1.1** radius scale (`sm:6, md:12, lg:16, xl:20, 2xl:24`), and most mobile screens hardcode values outside the token system entirely (Section 6, Section 8). So even "is v2.0 actually shipped" has no single answer — it depends which app you ask.
3. `design.md`'s own "Tailwind Config (shared)" code sample near the bottom of the file (the `borderRadius` block showing `sm:'6px', md:'12px', lg:'16px', xl:'20px', '2xl':'24px'`) was never updated to match the v2.0 radius section earlier in the same document — the actual `packages/ui/tailwind.config.ts` in code has the *correct* v2.0 values, but design.md's illustrative snippet is stale and would mislead anyone copying from it. Since design.md is locked/not to be edited per project rules, this should be flagged to whoever owns it rather than silently fixed.

---

## 2. Design Tokens As-Implemented

Source: `packages/ui/src/tokens/base.ts` (web/dashboard, CSS-string values), `packages/ui/src/tokens.native.ts` (React Native, numeric values — Metro prefers this over base.ts on mobile), `packages/ui/src/tokens/effects.ts` (deprecated), `packages/ui/tailwind.config.ts`.

### 2.1 Colors (`tokens/base.ts`, exported as `colors`)

| Group | Token | Value |
|---|---|---|
| Brand | `brand.DEFAULT` / `.dark` / `.light` | `#7C3AED` / `#5B21B6` / `#EDE9FE` |
| Public surfaces | `public.bg` / `.surface` / `.surfaceAlt` / `.border` / `.borderFocus` / `.overlay` | `#FAFAF9` / `#FFFFFF` / `#F5F3FF` / `#E8E5E0` / `#7C3AED` / `rgba(28,25,23,0.60)` |
| Dashboard surfaces | `dashboard.bg` / `.surface` / `.surfaceAlt` / `.surfaceHover` / `.border` / `.borderLight` / `.borderFocus` | `#0F0F0F` / `#1A1A1A` / `#242424` / `#2E2E2E` / `#2E2E2E` / `#3D3D3D` / `#7C3AED` |
| Text — public | `textPublic.primary/secondary/muted/onBrand` | `#1C1917` / `#78716C` / `#A8A29E` / `#FFFFFF` |
| Text — dashboard | `textDashboard.primary/secondary/muted/onBrand` | `#F5F5F4` / `#A8A29E` / `#78716C` / `#FFFFFF` |
| Semantic | `success` / `energy` / `financial` / `warning` / `error` / `info` | `#10B981` / `#F59E0B` / `#D97706` / `#F59E0B` / `#EF4444` / `#3B82F6` (each with a `bg` tint) |
| Gradients | `gradients.hero` / `.cardOverlay` | `linear-gradient(135deg,#7C3AED,#C026D3)` / `linear-gradient(to top, rgba(28,25,23,.85) 0%, transparent 60%)` — comment confirms "fire gradient removed in v2.0" |
| Chart series | `chart[0..4]` | `#7C3AED, #F59E0B, #10B981, #3B82F6, #EC4899` |
| Badges | `badges.{upcoming,live,ended,soldOut,draft,trending,tonight,sellingFast,verified,pending,rejected,approved}` | 12 explicit bg/text pairs, e.g. `live: {bg:'#D1FAE5', text:'#065F46'}` |
| Mobile-only palette | `mobile.{bg,surface,surfaceRaised,border,borderFocus,textPrimary,textSecondary,textMuted,textOnBrand,btnPrimaryBg,btnPrimaryText,btnBrandBg,btnGhostBorder,success,error,energy}` | A **third, separate dark palette** distinct from both `public` and `dashboard` — `bg:'#0D0D0D'` (not `#0F0F0F`), `textMuted:'#555555'` (not `#78716C`/`#A8A29E`), described in a comment as "Dice.fm-inspired." This palette exists in code but is **not documented anywhere in design.md**, which only describes two systems (Public, Dashboard). See Section 9. |

### 2.2 Spacing (4pt grid, `tokens/base.ts`)
`1:4px, 2:8px, 3:12px, 4:16px, 5:20px, 6:24px, 8:32px, 10:40px, 12:48px, 16:64px, 20:80px, 24:96px` — matches design.md's spacing scale exactly.

`tokens.native.ts`'s numeric `sp` export only goes up to key `12` (48px) — the larger tiers (`16/20/24` → 64/80/96px) that exist in `base.ts` are **absent from the native token file**, so mobile has no token for large section gaps.

### 2.3 Border Radius
- `tokens/base.ts` (`radius`, web/dashboard): `sm:4px, md:6px, lg:8px, xl:10px, 2xl:10px, full:9999px` — matches design.md v2.0 exactly, comment explicitly notes 2xl merged into xl.
- `packages/ui/tailwind.config.ts`: same v2.0 values (`4/6/8/10/10`) — correctly migrated.
- `tokens.native.ts` (`rd`, what mobile actually imports): `sm:6, md:12, lg:16, xl:20, 2xl:24, full:9999` — this is the **old v1.1 scale**, not migrated to v2.0. Mobile's token file and web/dashboard's token file now disagree with each other by roughly 2x on every tier except `full`.

### 2.4 Motion (`tokens/base.ts`)
Durations: `micro:100ms, fast:200ms, default:250ms, entrance:300ms`. Easings: `entrance: cubic-bezier(0,0,.2,1)`, `exit: cubic-bezier(.4,0,1,1)`, `standard: cubic-bezier(.4,0,.2,1)`. Matches design.md exactly. **`tokens.native.ts` exports no motion tokens at all** — mobile animations, where present, are hardcoded per-screen (confirmed in Section 8).

### 2.5 Typography (`tokens/base.ts`)
```
fontFamily.sans:    ['Inter Variable', 'Inter', 'sans-serif']
fontFamily.display: ['Anybody Variable', 'Anybody', 'sans-serif']
fontFamily.label:   ['Space Grotesk', 'Space Mono', 'sans-serif']
fontFamily.mono:    ['JetBrains Mono', 'monospace']
```
Type scale `xs`(12/16/400) through `5xl`(48/52/800) matches design.md's table exactly. Weight scale adds `black:900` "for Anybody headers" beyond design.md's documented 400–800 range. **`tokens.native.ts` exports no typography tokens** — no font-family or type-scale constants available to mobile at all (see Section 7).

### 2.6 Effects (`tokens/effects.ts` — deprecated)
File is functionally emptied of the deprecated content: only a `keyframes.shimmer` (for loading skeletons) and `animationDurations.shimmer: '2s'` remain, both explicitly kept as "not glow-related." The file's header comment documents that `glassMorphism`/`glow`/`shadowExtensions`/fire-gradient tokens used to live here and were removed for v2.0, with an explicit instruction not to reintroduce them. It is still exported from `tokens/index.ts` (`export * from './effects'`) — dead but harmless, since it now only exports the shimmer keyframe.

### 2.7 Layout dimensions (`tokens/base.ts`)
`navHeight:64px, sidebarWidth:240px, sidebarCollapsed:64px, tabBarHeight:80px, mobileNavHeight:56px` — matches design.md.

**Summary:** the canonical token source (`tokens/base.ts`, `tailwind.config.ts`) is fully migrated to v2.0 and matches design.md closely. The mobile-specific token file (`tokens.native.ts`) was never migrated and is missing whole categories (typography, motion, upper spacing tiers) — it is stale relative to its own sibling file in the same package.

---

## 3. Universal Component Inventory (`packages/ui/src/components/`)

12 components, barrel-exported from `packages/ui/src/index.ts`. All are plain React (web-targeted; none are cross-platform RN components — mobile has its own separate `apps/mobile/src/components/ui/` implementations, not covered by this package).

| Component | Purpose | Variants/Props | Token compliance | Accessibility |
|---|---|---|---|---|
| **Button** (`Button.tsx`) | Primary interactive action | `variant: primary/secondary/ghost/danger`, `size: sm/md/lg`, `loading`, `disabled`, `fullWidth` | Uses `var(--color-brand)`, `var(--radius-md)`, etc. for the base styles; hover overrides use raw `rgba(124,58,237,0.06)` / `rgba(124,58,237,0.10)` instead of a token (hardcoded brand-tint, `Button.tsx:51,53`) | `:focus-visible` outline defined via injected `<style>` (`Button.tsx:78`); disabled state sets `pointer-events:none` and `cursor:not-allowed`; no explicit `aria-busy` on `loading` |
| **Input** (`Input.tsx`) | Text field incl. password toggle | `type`, `error`, `required`, `disabled`, `leftIcon` | Token-driven (`--color-surface-2`, `--color-border`, `--color-brand`, `--radius-md`); font-size hardcoded to `16px` (correct per a11y rule to prevent iOS zoom, but not sourced from the `xs..5xl` scale) | `<label htmlFor>` associates label to input; password-toggle button has no `aria-label` (icon-only, `Input.tsx:116-136` — screen readers get no name for "show/hide password") |
| **Textarea** (`Textarea.tsx`) | Multi-line text field | `rows`, `error`, `required`, `disabled` | Same pattern as Input, fully token-driven | Labeled via `htmlFor`; no other a11y-specific markup |
| **Select** (`Select.tsx`) + `SelectItem` | Native `<select>` wrapper | `error`, `required`, `disabled` | Token-driven; custom chevron icon is an inline SVG data-URI with a **hardcoded stroke color `%23A8A29E`** (`Select.tsx:63`) instead of referencing a token (can't easily be theme-reactive) | Labeled via `htmlFor`; native `<select>` gives baseline keyboard/AT support for free |
| **Badge** (`Badge.tsx`) | Status pill | `status: string` (looked up in `colors.badges` map) | Fully token-driven via the `colors.badges` map from `tokens/base.ts`; unknown status falls back to `--color-surface-2`/`--color-text-muted` | No `role`/`aria-label`; relies on visible text label only (acceptable — color is never the sole indicator here) |
| **Modal** (`Modal.tsx`) | Dialog overlay | `isOpen`, `onClose`, `title`, `footer`, `closeOnBackdropClick` | Fully token-driven (`--color-overlay`, `--color-surface`, `--radius-xl`, motion tokens) | Strongest a11y implementation in the set: `role="dialog"`, `aria-modal="true"`, `aria-label={title}`, focus trap with Tab/Shift+Tab cycling, Escape-to-close, restores focus to the trigger element on close, respects `prefers-reduced-motion` |
| **Skeleton** (`Skeleton.tsx`) | Loading placeholder | `width`, `height`, `borderRadius` | Uses `--color-surface-2`; default `borderRadius` prop is a **hardcoded `'6px'`** default value rather than `radius.md` | No `aria-hidden` or `role="status"` — screen readers may announce empty/changing content during load |
| **EmptyState** (`EmptyState.tsx`) | No-data placeholder | `title`, `subtitle`, `action` | Token-driven; entrance animation respects `prefers-reduced-motion` via a media-query override in an injected `<style>` block | Icon SVG has no `aria-hidden`; decorative icon should be hidden from AT but isn't marked as such |
| **LoadingSpinner** (`LoadingSpinner.tsx`) | Spinner | `size: sm/md/lg`, `centered` | Token-driven (`--color-border`, `--color-brand`) | No `role="status"` / `aria-live` / accessible label — a bare spinning `<div>` is invisible to screen readers |
| **ErrorMessage** (`ErrorMessage.tsx`) | Inline error banner | `message`, `onRetry` | Uses `color-mix(in srgb, var(--color-error) 10%, transparent)` for the tint background — a modern CSS token-composition approach, not hardcoded | No `role="alert"` — an error banner that should probably announce itself doesn't |
| **AvatarInitials** (`AvatarInitials.tsx`) | Avatar w/ image or initials fallback | `name`, `src`, `size`, `fontSize` | Uses `--color-brand` for fallback background, but **initials text color is a hardcoded `'#ffffff'`** (`AvatarInitials.tsx:49`) instead of `--color-text-on-brand` | `<img>` uses `name` as `alt` text (reasonable default) |
| **MediaUploader** (`MediaUploader.tsx`) | Image/video upload dropzone | `label`, `accept: image/video`, `multiple`, `urls`, `onAdd`, `onRemove`, `uploadFn` | Mostly token-driven; remove-button background uses `var(--color-error, #ef4444)` (fallback value embedded in the `var()`, a defensible pattern but still a literal hex present in the file, `MediaUploader.tsx:103,164`) | Dropzone is a `role="button"` with `tabIndex={0}` and `onKeyDown` Enter handling — keyboard accessible; preview `<img alt="">` for uploaded images (empty alt — arguably correct since it's a redundant preview, but not labeled either way) |
| **PageHeader** (`PageHeader.tsx`) | Page title + subtitle + action slot | `title`, `subtitle`, `action`, `align`, `titleSize` | Token-driven, explicitly wires `var(--font-anybody)` and `var(--font-label)` (comments mark these `// NEW`) | Semantic `<h1>` used correctly |
| **StatCard** (`StatCard.tsx`) | Dashboard KPI tile | `icon`, `value`, `label`, `isLoading` | Fully token-driven; comment explicitly documents v2.0 compliance ("flat surface + border, no glass/glow") | No specific a11y markup beyond semantic text |
| **DataTable** (`DataTable.tsx`) | Generic sortable-less data table | `columns`, `data`, `isLoading`, `keyField`, `emptyTitle/emptySubtitle` | Fully token-driven, uses `var(--font-label)` for headers | Semantic `<table>/<thead>/<tbody>`; no `scope="col"` on `<th>` elements |
| **InfoField** (`InfoField.tsx`) | Label/value display pair | `label`, `value` | Token-driven | Plain text, no specific a11y concerns |
| **FullScreenLoader** (`FullScreenLoader.tsx`) | Full-page loading state | `message` | Token-driven, composes `LoadingSpinner` | Inherits `LoadingSpinner`'s lack of `role="status"` |

**Overall assessment:** the universal component set is largely token-compliant — nearly all color/radius/motion values reference CSS custom properties rather than literals. The handful of hardcoded values found (`Button.tsx` hover tints, `Select.tsx` chevron stroke, `Skeleton.tsx` default radius, `AvatarInitials.tsx` white text) are small and localized, not systemic. Accessibility is uneven: `Modal` is exemplary (focus trap, ARIA, reduced-motion), but `LoadingSpinner`, `Skeleton`, and `ErrorMessage` lack the `role="status"`/`role="alert"`/`aria-live` markup that would make loading and error states legible to screen-reader users — a real gap since those three components are used pervasively across all three dashboard/web apps.

---

## 4. Dashboard-Specific Component Inventory

### 4.1 `apps/partner/src/components/ui/` (8 components)

| Component | Purpose | Token compliance | Notes |
|---|---|---|---|
| `Breadcrumb.tsx` | Nav trail | Fully token-driven | Clean, simple |
| `ChartCard.tsx` | Chart container | **Mixed** — wraps `--color-surface`/`--color-border` via Tailwind's arbitrary-property syntax (`bg-(--color-surface)`) but the header divider and subtitle use raw Tailwind gray-scale classes `border-zinc-800` and `text-zinc-500` (`ChartCard.tsx:25,28`) instead of `--color-border`/`--color-text-muted` — these will not respond to the same token source as the rest of the card |
| `EventCard.tsx` | Organizer's event card | Token-driven for most surfaces, but the status-badge and FOMO-pill backgrounds use raw `rgba(0,0,0,0.5)`, `rgba(255,255,255,0.15)`, `rgba(0,0,0,0.7)`, `rgba(0,0,0,0.45)`, `rgba(0,0,0,0.85)/rgba(0,0,0,0.3)` gradient stops (`EventCard.tsx:72,78,163,194,225`) instead of the `--color-overlay`/`badges` token map | Otherwise well-built: focus-visible ring, `aria-label`/`aria-expanded`/`aria-haspopup` on the manage-menu button, `role="menu"` on the popover |
| `ImageUploadInput.tsx` | Image upload w/ preview | **Broken tokens**: uses `var(--color-text-primary)` and `var(--color-text-secondary)` (`ImageUploadInput.tsx:42,80`) — these custom properties are **not defined anywhere** in `apps/partner/src/app/globals.css` (which defines `--color-text` and `--color-text-muted` instead). An undefined CSS custom property resolves to its initial value, so this text likely renders with browser-default color rather than the intended token — a real, shippable bug, not just a style-guide violation |
| `NotificationBadge.tsx` | Unread-count pill | **Hardcoded Tailwind color**: `bg-red-500` (`NotificationBadge.tsx:76`) instead of the `--color-error` token — visually close to `#EF4444` but not the same value and won't track future token changes | Has `aria-label` and `role="status"` — good a11y |
| `OtpInput.tsx` | 6-digit OTP boxes | Token-driven | Auto-advances focus on input, backspace-to-previous — good UX, no ARIA beyond native input semantics |
| `Sheet.tsx` | Slide-in side panel | **Hardcoded hex**: close-button background/color use raw `#27272a` / `#a1a1aa` (`Sheet.tsx:81,83`) and placeholder text also uses `#a1a1aa` (`Sheet.tsx:93`) instead of `--color-surface-2`/`--color-text-muted` | Has `role="dialog"`, `aria-modal`, `aria-label`; no focus trap (unlike the shared `Modal` component) and no Escape-key handler |
| `ViewToggle.tsx` | Table/grid toggle | Fully token-driven | `aria-label` + `aria-pressed` on both buttons — good a11y |

### 4.2 `apps/admin/src/components/ui/` (3 components)

| Component | Purpose | Token compliance | Notes |
|---|---|---|---|
| `DangerZone.tsx` | Destructive-action panel | Fully token-driven (uses `color-mix()` for the tinted border) | Clean |
| `EventCard.tsx` | Admin's read-only event card | Fully token-driven, composes `@comfytag/ui`'s `Badge` | Simplest of the three EventCard variants (web/partner/admin each have their own, not shared — see Section 9) |
| `ProfileCard.tsx` | User/organizer profile summary | Mostly token-driven; **hardcoded `color: '#fff'`** for the avatar-fallback initials text (`ProfileCard.tsx:62`), same pattern as `packages/ui`'s `AvatarInitials.tsx` | Uses `<img alt={name}>` correctly for the avatar |

**Note:** `apps/web/src/components/ui/` also has 18 files (button.tsx, EventCard.tsx, CategoryCard.tsx, OrganizerCard.tsx, DigitalStub.tsx, BottomSheet.tsx, TabBar.tsx, etc.) — these are public-site-specific, not covered in the "dashboard-specific" scope the task defined, but are cataloged for completeness since they represent a third parallel component tier (public web has its own `ui/` folder distinct from both `@comfytag/ui` and the dashboard `ui/` folders). This three-tier structure (universal / dashboard-specific / public-web-specific) means there are effectively **three separate `EventCard` implementations** (`packages/ui` has none; `apps/web`, `apps/partner`, and `apps/admin` each define their own) with no shared base — a duplication pattern worth flagging for the rework team (Section 9).

---

## 5. Screen/Route Inventory

### 5.1 `apps/web` (attendee, 26 top-level pages)
| Route | Purpose |
|---|---|
| `/` | Home / discovery feed |
| `/events`, `/events/[slug]` | Event listing and detail |
| `/category/[slug]` | Category-filtered event listing |
| `/organizer/[slug]` | Public organizer profile |
| `/search` | Search results |
| `/checkout`, `/checkout/success` | Ticket purchase flow |
| `/claim-ticket` | Claim a transferred/gifted ticket |
| `/tickets`, `/tickets/[id]` | Attendee's ticket wallet and detail |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Auth |
| `/handoff` | Cross-app auth handoff (likely to/from partner or mobile) |
| `/profile`, `/profile/bank`, `/profile/security` | Account settings |
| `/saved`, `/my-following` | Saved events / followed organizers |
| `/notifications` | Notification center |
| `/about`, `/contact`, `/privacy`, `/terms` | Static/legal pages |
| `/hype-link` | Likely a shareable promo/referral link page |
| `/api/auth/*`, `/api/contact`, `/api/og` | Next.js route handlers (NextAuth, contact form, OG image generation) |

### 5.2 `apps/partner` (organizer dashboard)
Auth group `(auth)`: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/handoff`.
Dashboard group `(dashboard)`: `/overview`, `/events`, `/events/create`, `/events/[id]`, `/events/[id]/edit`, `/events/[id]/analytics`, `/events/[id]/gate` (check-in scanner), `/events/[id]/promos`, `/attendees`, `/analytics`, `/payouts`, `/withdraw`, `/tiers`, `/kyc`, `/team`, `/notifications`, `/profile`, `/settings`.
Standalone: `/onboarding`, `/` (root).

### 5.3 `apps/admin`
Root: `/login`, `/2fa`, `/` .
Dashboard group `(dashboard)`: `/overview`, `/users`, `/users/[id]`, `/organizers`, `/organizers/[id]`, `/events`, `/events/[id]`, `/payouts`, `/payouts/[id]`, `/kyc`, `/kyc/[id]`, `/face-logs`, `/face-logs/[id]`, `/promoted`, `/promoted/create`, `/promoted/[id]`, `/analytics`, `/audit`, `/categories`, `/team`, `/team/invite`, `/team/[id]`, `/settings`, and a `/cms/*` cluster: `/cms/banners`, `/cms/curated`, `/cms/faqs`, `/cms/how-it-works`, `/cms/legal`, `/cms/marquee`, `/cms/pages`, `/cms/settings`.

### 5.4 `apps/mobile` (38 screens across 3 navigator flows)
**Onboarding/Guest:** Splash, Welcome, Login, Register, ForgotPassword, FaceEnrollment.
**Attendee flow:** Home, Explore, Category, EventDetail, OrganizerProfile (discover); Search; MyTickets, TicketDetail, TransferTicket, IncomingTransfer, FaceCheckIn (tickets); Checkout, OrderConfirmation (checkout); Profile, EditProfile, Following, FaceEnrollmentStatus (profile); Inbox.
**Organizer flow:** Dashboard; EventsList, EventDetail, CreateEvent, EditEvent, TicketTiers, PromoCodes, Audience (events); CheckIn, FaceCheckIn, ManualCheckIn (checkin); Account, Bank, Kyc (account); Payouts.

---

## 6. Hardcoding Violations Audit

Repo-wide grep for hex literals (`#[0-9a-fA-F]{3,8}`) in `.ts`/`.tsx` under `apps/`:

**380 occurrences across 104 files.** By app:
- `mobile`: 208 occurrences (heaviest by far — nearly 55% of all hardcoded hex in the app layer)
- `web`: 84 occurrences
- `partner`: 80 occurrences
- `admin`: 64 occurrences

`packages/ui/src/components/` itself has 2 files with hardcoded hex (`AvatarInitials.tsx:49` — `color:'#ffffff'`; `MediaUploader.tsx:103,164` — hex embedded as a `var(--color-error, #ef4444)` fallback, a more defensible pattern).

**Representative worst offenders (file:line):**
- `apps/admin/src/components/notifications/NotificationsDropdown.tsx:44-72` — 15 hardcoded hex values in a single icon-color lookup table (`iconBg:'#1e3a5f', iconColor:'#60a5fa'`, etc.) that duplicates the `colors.badges` pattern already established in `packages/ui` but reimplements it locally with different, non-token values.
- `apps/admin/src/app/(dashboard)/users/page.tsx:13-17` — a role-badge color map using raw `rgba(124,58,237,0.20)` / `#C4B5FD` / `#FCD34D` / `#A78BFA` / `#7DD3FC` / `#6EE7B7` instead of `colors.badges`.
- `apps/partner/src/components/notifications/NotificationRow.tsx` — 27 hardcoded hex occurrences, the single worst offender file in the partner app, largely duplicating the same icon-bg/icon-color/badge-color pattern as admin's `NotificationsDropdown.tsx` with different literal values (i.e., the same UI pattern was hand-rolled twice with drifted colors).
- `apps/mobile/src/screens/organizer/payouts/PayoutsScreen.tsx:28-665` — 10 occurrences including a locally-defined `const GOLD = '#D97706'` (`:28`) that duplicates the `financial`/`colors.dashboard` token rather than importing it, plus repeated raw `#FFFFFF`/`#F59E0B`/`#EF4444` in `StyleSheet` objects.
- `apps/mobile/src/screens/attendee/inbox/InboxScreen.tsx` — 17 hardcoded hex occurrences, the single worst offender file in mobile.
- `apps/admin/src/components/dashboard/Topbar.tsx:26` — `support: { bg: '#0EA5E9', ... }`, an entirely new color not present in any documented token set.
- `apps/mobile/src/components/feed/FeedEventCard.tsx` — 12 occurrences.
- `apps/web/src/components/search/MapLibreMapView.tsx` and `GoogleMapView.tsx` — 19 occurrences each (map pin/cluster styling — arguably more defensible since map SDKs often require literal color strings, but still outside the token system and duplicated between two near-identical map implementations).

**Broken/undefined token references** (more severe than a hardcoded literal, since these silently fail rather than just being inconsistent):
- `apps/partner/src/components/ui/ImageUploadInput.tsx:42,80` — references `var(--color-text-primary)` / `var(--color-text-secondary)`, neither of which exists in `apps/partner/src/app/globals.css`. The file defines `--color-text` / `--color-text-muted` instead.

**Cross-app CSS variable drift** (the same token *name* resolves to a different literal color per app, sometimes contradicting `design.md`'s stated single value):
- `--color-brand-dark`: design.md / `tokens/base.ts` say `#5B21B6`. `apps/admin/src/app/globals.css:—` (not overridden, inherits correctly). `apps/partner/src/app/globals.css:63` defines it locally as **`#6d28d9`** (Tailwind `violet-700`) — a different literal value than the documented brand-dark.
- `--color-brand-light`: design.md says `#EDE9FE`. `apps/admin/src/app/globals.css:5` defines it as **`#8B5CF6`** — a mid-saturation purple, not the pale tint documented; visually and functionally a very different color for what's meant to be a "tinted background" token.
- Dashboard base surfaces: design.md specifies `#0F0F0F` (bg) / `#1A1A1A` (surface) / `#2E2E2E` (border). `apps/admin/src/app/globals.css:6-14` matches this closely (border is `#2A2A2A`, a small drift from `#2E2E2E`). `apps/partner/src/app/globals.css:65-70` instead uses **Tailwind's zinc scale** — `--color-bg:#09090b` (zinc-950), `--color-surface:#18181b` (zinc-900), `--color-surface-2:#27272a` (zinc-800), `--color-text:#fafafa` (zinc-50), `--color-text-muted:#a1a1aa` (zinc-400) — none of which match the documented hex values, even though they're visually similar warm-adjacent darks. Partner's dashboard is, in effect, running a *different* dark palette than admin's, despite design.md describing one shared "Dashboard system."
- `apps/partner/src/app/globals.css` additionally carries an entire second, unused shadcn/ui-style token layer (`--color-card`, `--color-primary`, `--color-secondary`, `--color-muted`, etc., lines 9-24) that maps to `var(--background)`/`var(--foreground)` etc. — variables that are not defined anywhere else found in this file, suggesting leftover shadcn scaffolding parallel to the app's actual, separately-defined `--color-brand`/`--color-bg`/etc. tokens (lines 62-78).

**Rough scale of inline px (non-token spacing/sizing):** Nearly every component read for this audit (Sections 3-4) uses raw pixel strings (`'12px'`, `'20px'`, `16`, etc.) directly in inline `style={{}}` objects rather than importing `spacing[n]` from `@comfytag/ui`. This is the dominant pattern across all four apps, not a handful of outliers — the `spacing` export exists and matches design.md's 4pt grid, but it is essentially unused in favor of literal strings that happen to often (not always) land on 4px multiples. This is a much larger-scale, more diffuse violation than the hex-color audit above and was not counted precisely (it would run into the thousands of occurrences), but a rework team should treat "spacing values are almost never sourced from the token file" as a baseline fact about the current codebase, not an edge case.

---

## 7. Font Implementation Check

design.md specifies four typefaces: **Inter** (body), **JetBrains Mono** (data/IDs), **Anybody Variable** (display/headings), **Space Grotesk** (labels).

| App | Inter | JetBrains Mono | Anybody | Space Grotesk | Notes |
|---|---|---|---|---|---|
| **web** | ✅ | ✅ | ✅ | ✅ | `apps/web/src/app/layout.tsx:2,11-16` loads all four via `next/font/google`, applies all four CSS variables to `<html>`, and `apps/web/src/app/globals.css:61-64` maps `--font-sans`→Inter, `--font-mono`→JetBrains Mono, `--font-display`→Anybody+Space Grotesk. This is the one app where all four fonts are correctly wired end-to-end. |
| **partner** | ❌ | ❌ | ✅ | ✅ | `apps/partner/src/app/layout.tsx:2,7-9,29` loads only Anybody and Space Grotesk. **Body text font is set in `globals.css:140` to `'Plus Jakarta Sans'`** — a typeface not documented anywhere in design.md and never loaded via `next/font` or any `<link>`/`@font-face` found in the app. Since it's never loaded, the browser falls back to the next names in the stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`) — meaning partner's actual rendered body text is the OS system font, not any of the four documented typefaces, and not the CSS-declared "Plus Jakarta Sans" either. |
| **admin** | ⚠️ broken | ❌ | ✅ | ✅ | `apps/admin/src/app/layout.tsx:2` imports **Geist and Geist Mono** from `next/font/google` (Next.js's own default fonts) instead of Inter/JetBrains Mono, and applies `geistSans.variable`/`geistMono.variable` to `<html>` alongside Anybody/Space Grotesk. Meanwhile `apps/admin/src/app/globals.css:52` sets `body { font-family: 'Inter Variable', Inter, sans-serif; }` — but Inter is never loaded anywhere in the app, so this declaration resolves to the fallback `sans-serif` (OS default), not Inter. The net result: admin loads Geist fonts it doesn't reference in CSS, and references an Inter font family in CSS that it never loads — two separate, disconnected font configurations that don't actually deliver Inter to the page. |
| **mobile** | ❌ | ❌ (generic `'monospace'` only) | ❌ | ❌ | No font-loading mechanism found anywhere in `apps/mobile` — no `expo-font`/`useFonts` call, no bundled `.ttf`/`.otf` assets, no font-related dependency in `package.json`. The only typography customization found is `fontFamily: 'monospace'` used for ticket-ID/OTP display (`OrderConfirmationScreen.tsx:207`, `TransferTicketScreen.tsx:414`, `TicketDetailScreen.tsx:711`, `DigitalStub.tsx:215,227`, `QRDisplay.tsx:58`) — this uses the OS's generic monospace font, not JetBrains Mono specifically, and everything else renders in React Native's default system font. Of the four apps design.md's "Public system" section says should share typography (web + mobile), mobile has none of it. |

**Summary:** only `web` fully implements the documented type system. `partner` and `admin` each partially implement it (2 of 4 fonts genuinely loaded) but both have a broken/unloaded body-text declaration that silently falls back to system fonts. `mobile` implements none of it.

---

## 8. Hardcoding Violations — Mobile Token Adoption

Beyond the raw hex count in Section 6, mobile's relationship to the shared token system is worth calling out specifically: only **10 files** in `apps/mobile/src` import anything from `@comfytag/ui` or reference `colors.mobile`/`tokens.native` at all, out of 38 screens plus a further set of shared mobile components. The overwhelming majority of mobile screens define colors, spacing, and typography as local literals inside `StyleSheet.create()` calls rather than consuming the shared package — consistent with `tokens.native.ts` (Section 2) being both stale (old radius scale) and incomplete (no typography/motion exports), which removes much of the incentive/ability to adopt it consistently.

---

## 9. Accessibility Current State

**Tooling:** no automated accessibility testing exists anywhere in the repo. No `jest-axe`, `axe-core`, or `@axe-core/*` dependency found in any `package.json`. No `toHaveNoViolations` or similar assertions in any test file. No `eslint-plugin-jsx-a11y` configured. The Playwright E2E suite (`tests/e2e/`) contains no accessibility-specific checks. Accessibility, where present, is manual/incidental in component authorship, not verified or gated by tooling.

**`aria-*` usage (web-app-family, `aria-label` specifically):**
| App | Files using `aria-label` |
|---|---|
| web | 23 |
| partner | 25 |
| admin | **1** |
| mobile (`accessibilityLabel`, RN's equivalent) | 4 |

Admin's near-total absence of `aria-label` usage (1 file across the entire app, versus 23-25 in web/partner) stands out — most of admin's interactive icon-only controls (e.g., the notification/topbar buttons seen in Section 6's hardcoded-color findings) likely have no accessible name.

**`accessibilityRole`/`accessible` (mobile, RN's role/exposure props):** only 1 file uses either, across an app with 38 screens — mobile's screen-reader (VoiceOver/TalkBack) support is effectively unaddressed at the screen level; the 4 files with `accessibilityLabel` and the 1 with `accessibilityRole`/`accessible` are not necessarily the same files, meaning coverage may be even thinner than the raw counts suggest.

**`focus-visible` usage:** 38 files across the web-based apps reference `focus-visible`/`focusVisible` (mostly the injected inline `<style>` pattern seen in `packages/ui`'s `Button.tsx` and `apps/partner`'s `EventCard.tsx`). This is a meaningful chunk of the codebase but far from universal — most raw inline-styled buttons/links/cards found during this audit (Sections 3-4) have no focus-visible treatment beyond whatever the browser's default outline provides (which many of the inline styles set `outline:'none'` and never replace, e.g. `Input.tsx:60`, `Select.tsx:57` — these do rely on a wrapping border-color change on focus instead, but the box-focus-ring the design.md accessibility section requires ("Focus rings: always visible, `--border-focus` colour, 2px offset") is not what these components implement; they change border color, not add a ring).

**Alt text:** 48 files across web/partner/admin contain `<img>` or `next/image` usage; 10 instances of explicit `alt=""` (empty alt, appropriate only for decorative images) were found. Spot-checked components (`AvatarInitials.tsx`, `ProfileCard.tsx`, `EventCard.tsx` variants) generally pass a meaningful `alt` (event name, person name). No systematic audit of every image was performed, but no obvious pattern of missing `alt` attributes altogether emerged from the files read — the risk is more in the icon-only-button `aria-label` gap (above) than in `<img alt>` coverage.

**Design.md's accessibility section vs. reality:** design.md states "Focus rings: always visible, `--border-focus` colour, 2px offset" and "Touch targets: minimum 44×44px (mobile), 32×32px (desktop)." Neither claim was verified as universally true in code — `Modal` and `Button` implement a real focus-visible outline; many form inputs (Input/Select/Textarea) implement a border-color change instead of a ring; touch-target sizing was not systematically measured across mobile screens (out of scope for a text-based audit) but several mobile icon-only touch targets seen in passing (e.g., `IncomingTransferScreen.tsx`, `QRDisplay.tsx`) use small fixed pixel dimensions inherited from hardcoded styles rather than an enforced minimum.

---

## 10. Observations & Risks

1. **The version-conflict problem is really a "CLAUDE.md is stale" problem, not a "design.md is ambiguous" problem.** `design.md` already resolved v1.1 vs v2.0 cleanly, including reconciling the undocumented Afterdark Kinetic effort. `CLAUDE.md`'s critical-rules section citing "v1.1 is final" is simply out of date and self-contradicts the design-system section three paragraphs earlier in the same file. This should be a five-minute fix for whoever owns CLAUDE.md, independent of any rework decision — but until it's fixed, any AI agent or new engineer reading CLAUDE.md's critical rules first will draw the wrong conclusion about which version governs.

2. **The three apps that should share one "Dashboard system" (design.md's own framing) currently run three different color implementations.** Admin is closest to the documented values (one border-color drift, one brand-light drift). Partner has drifted to a Tailwind zinc palette with different literal hex values for bg/surface/border/text, plus a vestigial unused shadcn token layer. This means partner and admin, despite being designed as one visual system, will render visibly different shades of "black" and "dark surface" side by side if a user has both open — a concrete, checkable inconsistency for the rework team to resolve either by re-aligning partner to admin's values or by deciding the zinc palette is actually preferred and updating admin/design.md instead.

3. **Font delivery is broken, not just undocumented, in 2 of 4 apps.** Partner's body text isn't rendering in "Plus Jakarta Sans" (its own CSS declaration) or in Inter (the documented brand font) — it's silently falling back to the OS system font because neither is loaded. Admin has the same failure mode in reverse (loads Geist, declares Inter in CSS, delivers neither as intended — Geist is unused, "Inter Variable" never loads). These aren't stylistic quibbles; they're functional bugs where the intended typeface never reaches the browser. Fixing font loading in these two apps is likely higher-value, lower-effort than most other findings here.

4. **Mobile is the least aligned surface across every axis measured:** worst hex-hardcoding count (208 of 380 occurrences, over half), zero font wiring, a stale/incomplete native token file (old radius scale, no typography/motion tokens), minimal accessibility API usage (`accessibilityLabel`/`accessibilityRole` in only a handful of files across 38 screens), and only 10 of dozens of files touching the shared token system at all. Given CLAUDE.md states Milestone 5 (mobile app) is the one currently "IN PROGRESS," this is plausibly a timing/sequencing issue rather than neglect — but it means mobile is the app furthest from whatever the rework team decides "the design system" should mean going forward, and probably needs the largest scoped effort.

5. **Component duplication across app boundaries.** `EventCard` exists as three separate, non-shared implementations (web, partner, admin), each reimplementing similar layout/badge/gradient logic with its own hardcoded values rather than one shared component with app-specific slots. The same pattern repeats for notification icon-color lookup tables (admin's `NotificationsDropdown.tsx` and partner's `NotificationRow.tsx` — 15 and 27 hardcoded hex values respectively, implementing what is conceptually the same "icon background + icon color + label" mapping with different literal colors). This is exactly the kind of duplication CLAUDE.md's own "DRY Components" memory rule and "Component Organization" architecture section are meant to prevent, and it has happened anyway across at least two clearly identifiable feature areas.

6. **Design.md itself has one internal staleness bug worth flagging to its owner** (not fixed here, since it's locked): the "Tailwind Config (shared)" illustrative code block near the end of the document still shows the old v1.1 border-radius values, even though the "Border Radius (v2 — drastically tightened)" section earlier in the same document — and the actual `packages/ui/tailwind.config.ts` in code — both correctly show v2.0 values. Anyone copying from that code sample in the future would reintroduce the old radius scale.

7. **The "no hardcoding" rule (CLAUDE.md, "NON-NEGOTIABLE") is not currently true of the codebase**, at the scale of hundreds of hex-color instances and what appears to be near-universal use of raw pixel strings instead of the `spacing` token export for inline styles. This isn't a handful of outliers to spot-fix; it's the dominant authoring pattern across all four apps (even inside `packages/ui` itself, in 2 of 12 components). A rework decision here has two honest paths: either invest in a real enforcement mechanism (lint rule banning raw hex/px in style objects, codemod to convert existing usage) or accept that the "no hardcoding" rule as currently worded is aspirational rather than descriptive and rewrite it to something enforceable.

8. **A third, undocumented "mobile dark" color palette exists in code** (`colors.mobile` in `tokens/base.ts`, `bg:#0D0D0D` etc.) alongside the two systems ("Public," "Dashboard") design.md actually describes. Whether this is an intentional third system for mobile's attendee-facing dark mode, an abandoned experiment, or something that should be merged into "Public" (since design.md says mobile belongs to the Public system) is a genuine open question — the palette differs from both Public and Dashboard in specific values (e.g., `textMuted:'#555555'` matches neither system's muted-text token), so it can't be assumed to be a simple alias for either.
