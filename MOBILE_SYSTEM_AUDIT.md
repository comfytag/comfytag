# MOBILE_SYSTEM_AUDIT.md
## ComfyTag — Mobile App Flow & Implementation Audit (`apps/mobile` + `apps/api`)

**Generated:** 2026-08-05
**Auditor:** Read-only traversal of `apps/mobile/src` (38 screens, 11 hooks, navigation tree) cross-checked against `apps/api` (30 route files, 25 controllers, route mount order in `app.js`)
**Companion doc:** `SYSTEM_AUDIT.md` covers `apps/web` + `apps/api` (2026-06-20) — this doc does the same job for the mobile app, which was never audited before. Where the two apps share a backend bug, this doc says so instead of re-deriving it.

This is not a design review — `Comfytag_Designs` (the mockup folder) was already covered separately. This is an audit of the **actual built app on disk**: does each screen call real endpoints and render real data, does that endpoint actually exist and work server-side, and where the wiring breaks down between the two.

---

## Face Verification — Deferred to v2 (2026-08-05)

Product decision: face enrollment and face-based check-in (both the attendee's own screen and the organizer/staff scanner) are being held back for a v2 launch rather than shipped now. Per instruction, this was done as a **feature flag, not by commenting out or deleting code** — commenting out working, type-checked screens tends to rot silently and is genuinely painful to "get back to" (imports go stale, the code drifts out of sync with everything around it, nobody remembers every place a `//` needs removing). A single flag achieves the actual goal — "easy to get back to" — far more reliably.

**The flag:** `FEATURES.faceVerification` in `apps/mobile/src/lib/features.ts`, currently `false`. **To relaunch: flip it to `true`. Nothing else needs to change** — every screen, hook, and backend endpoint involved is still real, wired, and working exactly as described in issues #3 and #4 below; the flag only hides the doors into them.

What's gated behind it (all UI *entry points*, not the destination screens themselves):

- `ProfileScreen.tsx` — the "Face Entry" row (only entry point into enrollment)
- `TicketDetailScreen.tsx` — the biometric-identity panel, the "Face Entry: Linked/Not linked" status row, the "Zero-Contact Face Entry" trust card, and the "Use face check-in" button (Transfer becomes the sole, full-width action when hidden)
- `organizer/checkin/CheckInScreen.tsx` — tapping an event now routes straight to `ManualCheckInScreen` instead of the face scanner (this was the **only** path into check-in at all before this fix routed it elsewhere, so this redirect is load-bearing, not cosmetic — without it, organizers would have had zero way to check anyone in)
- `EventDetailScreen.tsx` / `IncomingTransferScreen.tsx` — copy that referenced face check-in, adjusted or hidden

Deliberately **not** touched: the backend `/face/*` routes (shared infra, harmless to leave live), the `Stack.Screen` registrations for the face screens in their navigators (harmless if unreachable, and removing/re-adding them is exactly the kind of busywork the flag is meant to avoid), and the screens/hooks themselves.

Still true and unresolved regardless of the flag: whether attendee **self-service** face check-in (as opposed to staff-operated only) should exist at all is an open product question, not something this deferral or the earlier fix decided.

---

## TL;DR — Critical Issues, Ranked by Impact

| # | Issue | Impact |
|---|---|---|
| 1 | ~~**Paid ticket checkout is completely broken.**~~ **FIXED 2026-08-05.** `CheckoutScreen.tsx` called `useInitiatePayment()` → `POST /tickets/initiate`, a route that never existed server-side. Fixed by removing the phantom "initiate" round-trip entirely: the mobile client now mints its own Paystack reference client-side (matching the pattern `createFreeAudience` already uses server-side for free tickets), opens Paystack directly, then on success calls the two endpoints that actually exist and already do real work — `POST /paystack/verify/:reference` (confirms the charge) followed by `POST /audience/:userId/:eventId` (creates the ticket, same endpoint the free-ticket path uses). See `apps/mobile/src/hooks/useCheckout.ts` and `CheckoutScreen.tsx`. **Bonus find while fixing this:** the free-ticket path (`usePurchaseFreeTicket`) had the same class of bug, just silently instead of via 404 — it was sending `tierId`/`guestName`/`guestEmail`/`guestPhone`, but `createFreeAudience` reads `type` (tier *name*, not id) and `eventname` from the body. Since neither existed in the payload, every free ticket was being created with `type: undefined` and `eventname: undefined`, and the tier's `sold` counter was **never incremented** (the decrement query matches on `ticketType.name`, which was `undefined`) — meaning sold-out limits were silently unenforceable on the free-ticket path. Fixed as part of the same change. | **No one could buy a paid ticket on the mobile app; free tickets were being created with broken/missing tier data and no capacity enforcement.** Both now use the same, verified-real ticket-creation endpoint with correctly-named fields. |
| 2 | ~~**Organizer KYC submission is completely broken.**~~ **FIXED 2026-08-05.** `KycScreen.tsx` called `post('/kyc/${user._id}', ...)` → `POST /kyc/:userId`, a route that was never mounted anywhere. The real endpoint, `PUT /users/:id/kyc` (`uploadKYC` in `apps/api/controllers/users.js`), requires a `selfie` photo **and** an `idDocument` photo in the same multipart request, plus an `idType` restricted to exactly `nin`/`passport`/`voters_card` — none of which the old screen collected at all (it only had text fields for full name/ID number/address, none of which the backend even has a field for). Rewrote `useKyc.ts` to match the real request/response shapes exactly (including the status enum — the old code checked for `overallStatus`/`'partial'`, neither of which exist; the real field is `kycStatus` with values `unverified\|pending\|verified\|rejected`) and rewrote `KycScreen.tsx` to actually capture both photos via the camera (`expo-image-picker`, mirroring the pattern `CreateEventScreen` already uses) before submitting. Also added a `rejected` display state with the rejection reason shown — previously a rejected organizer would see the same "not submitted" form with no explanation, since that status wasn't handled at all. | **No organizer could complete KYC verification on mobile; now they can, and rejected submissions are explained instead of silently looking identical to "never submitted."** |
| 3 | ~~**Face enrollment never reaches the server.**~~ **FIXED 2026-08-05, then deferred to v2 (see dedicated section below) — hidden behind a flag, not removed.** `FaceEnrollmentScreen.tsx` got a real template from the mock SDK, then only called an `onEnrollmentComplete` prop callback — never `POST /face/enroll/:userId`. It's registered in `ProfileStackNavigator` as a plain `Stack.Screen`, so React Navigation never supplied that prop; the callback was always `undefined` (confirmed — grepped every caller, both navigate to it with no params at all). Fixed by calling `POST /face/enroll/:userId` directly after a successful capture, then updating `user.faceEnrolled`/`faceEnrolledAt` via a new `updateUser()` action added to the Zustand auth store (needed because `FaceEnrollmentStatusScreen` reads `user.faceEnrolled` straight from that store, not from a query — a plain cache invalidation wouldn't have reached it). | Enrollment now actually registers server-side and `FaceEnrollmentStatusScreen` reflects reality. |
| 4 | ~~**Attendee's own face check-in is 100% fake.**~~ **FIXED 2026-08-05, then deferred to v2 (see dedicated section below) — hidden behind a flag, not removed.** `attendee/tickets/FaceCheckInScreen.tsx` verified against a hardcoded literal `'mock_stored_template'` and never called the server. Wiring this one needed care: `POST /face/verify` is a **1:N venue-scanner endpoint** — it searches every active ticket for an event and, on match, immediately marks that ticket `used`/checked-in. It is not a preview/test call. Confirmed via `apps/api/controllers/face.js` before touching anything, since calling it naively from an attendee's phone at home would silently burn their own ticket. Fixed by: fetching the ticket's real `event_id` via the already-real `useTicketDetail` hook (the screen only had `ticketId` before), calling the real endpoint with it, and — since this is now a genuinely irreversible action instead of a harmless mock — adding an explicit warning on the idle screen ("This checks you in for entry — only do this once you've arrived at the venue"), which didn't need to exist before. | An attendee's own face check-in now performs a real check-in against the real endpoint, with appropriate warning copy given the stakes changed from "harmless demo" to "actually ends your ticket's usability." Whether a **self-service** face check-in (as opposed to staff-operated) is the intended product behavior at all is a product question this fix doesn't resolve — flagging for a deliberate decision, not assuming. |
| 5 | ~~**Ticket transfer "incoming" flow is unreachable, and broken even if you could reach it.**~~ **FIXED 2026-08-05 — with a real architectural gap found and closed, not just a wiring bug.** `IncomingTransferScreen.tsx` wasn't registered in any navigator; its query read `res.data.data` but the backend returns `{ count, transfers }` with no `data` wrapper; and its Accept button called `useClaimTicket` (`POST /tickets/transfer/claim`), which the backend explicitly **rejects** (409) for tickets with a pending transfer — the correct call, `POST /tickets/transfer/accept`, had no hook at all. Fixing the wiring surfaced a deeper problem: **the backend never actually sent the `transferToken` to the recipient through any channel the app could reach.** `GET /tickets/transfer/incoming` deliberately strips `transferToken` from its response (security — correct), and `GET /audience/:id` 403s for a ticket you don't own yet (also correct — you're not the owner until you accept), so the *only* place the token existed was a query param in the transfer-initiated **email**, which the in-app notification payload never carried. There was no code path by which the token could ever reach a screen inside the app at all — this wasn't a bug to patch, it was a missing piece of the design. Fixed by adding `transferToken` to the `transfer_received` notification's `data` payload server-side (`apps/api/controllers/transfer.js`) — no worse a security posture than the existing email link, since it's delivered to the same authorized recipient over the same authenticated channel as the rest of their private data — then wiring `InboxScreen`'s notification tap to extract `{ticketId, transferToken, senderName}` from that payload and navigate straight into a newly-registered `IncomingTransfer` route (added to `TicketsStackParamList`). Added `useIncomingTransfers`/`useAcceptTransfer`/`useDeclineTransfer` hooks to `useTickets.ts` with the correct real request/response shapes throughout. | A friend sending you a ticket now actually reaches you: tapping the notification opens a real accept/decline screen wired to the correct endpoints. **Known follow-up, not fixed:** this only covers the in-app notification tap — a *push* notification tapped while the app is backgrounded/closed isn't deep-linked into this screen yet (no `expo-notifications` response listener wired to navigation), and the open-share-link claim feature (`POST /tickets/transfer/claim`, a distinct legitimate feature for claiming by reference/link rather than by direct transfer) has a real, correct hook (`useClaimTicket`) but no UI anywhere calls it. |
| 6 | ~~**Saving/bookmarking an event 404s.**~~ **FIXED 2026-08-06 — turned out to be simpler than it looked.** `useSaveEvent()` called a `POST /events/:id/save` that never existed. Investigating why revealed "save" was never meant to be a separate feature: there's one `EventLike` collection, one toggle route (`POST /events/:id/like`), and `GET /events/saved` (already real and working) just reads that same collection back. No new backend endpoint needed — repointed the hook at the real `/like` route. Also worth noting: `useSaveEvent` isn't actually called from any screen right now, so nothing was silently failing in practice today — it's now correct for whenever a Save/bookmark button does get built. | Whenever a save/bookmark UI is added, it'll work correctly against the real endpoint from day one. |
| 7 | ~~**Live check-in status polling is mismatched with the server.**~~ **FIXED 2026-08-06 — and led to two more real bugs in adjacent code.** `useTicketStatus` polled `GET /tickets/:id/status` every 10s expecting JSON; the backend serves it as a genuine, permanently-open **Server-Sent-Events stream** that never closes the response, so every poll just hung until axios's global 10s timeout fired. Repointed it to poll `GET /audience/:id` instead — already real, already returns `checkedIn`/`checkedInAt`/`status` on the same document. Checking that endpoint's actual response shape surfaced two more bugs, previously unflagged: **`useTicketDetail` and `useTicketByRef` both read `r.data.data`, but `GET /audience/:id` and `GET /audience/ref/:reference` return the bare ticket document, not an `{success, data}` envelope** — both hooks always resolved to `undefined`. `useTicketDetail` is actively used by `TicketDetailScreen`; `useTicketByRef` isn't called anywhere yet. Fixed both to read `r.data` directly. Also added `checkedIn`/`checkedInAt`/`checkedInMethod` to the shared `Ticket` type in `packages/types` — the fields are real on the `Audience` model and several controllers already read/write them, the shared type just never declared them. Verified with a full root-level `pnpm typecheck` across all four apps (web/partner/admin/mobile) since this is a shared-package change — clean. | The ticket detail screen's core data fetch — previously silently resolving to `undefined` on every load — now actually works, not just the live-status indicator that was originally flagged. |

---

## What's Genuinely Solid (verified, don't second-guess these)

- **Event discovery & search** — Home, Explore, Category, Search, Event Detail all use real hooks (`useEvents`, `useCategories`, `useEventBySlug`, `useSearchEvents`, `useTrendingSearch`), with real loading/error/empty states.
- **Social layer** — like, comment, follow are all real end-to-end (only *save* is broken, see #6 above).
- **Notifications** — real REST + a live Socket.io listener that invalidates the query cache on new notifications.
- **Ticket wallet & ticket detail** — real, with an offline-first cache (`ticketCache.ts`) that serves cached tickets instantly and refreshes in the background.
- **Ticket transfer — sending half** — `TransferTicketScreen.tsx` → `POST /tickets/transfer/initiate` is correctly wired, and the backend transfer logic (`apps/api/controllers/transfer.js`) is genuinely sophisticated: partial-quantity splits, atomic guards against race conditions, email + in-app notifications at every state change. It's only the *receiving* half that's broken (#5).
- **Auth** — login, register, forgot/reset password (3-step OTP flow), 2FA branch — all real, all states covered.
- **Organizer dashboard, event creation, event management** — genuinely well built. `CreateEventScreen.tsx` even autosaves a draft to `AsyncStorage` via a dedicated `eventDraftStore` and restores it across navigation. Multi-step wizard with per-step validation, real image upload, real publish/cancel mutations.
- **Attendee management & manual check-in (organizer side)** — real, with optimistic UI and rollback on error.
- **Organizer face check-in (staff scanner)** — real, calls the actual `/face/verify` endpoint, has all 7 UI states, and a manual-ID fallback at every stage.
- **Bank accounts & payout requests (organizer)** — real, with client-side balance validation mirroring the server-side guard.
- **Attendee ↔ Organizer mode switching** — fully wired. `modeStore` (Zustand) is set automatically post-login based on `user.isPartner`, with real UI toggles on both `ProfileScreen` (attendee → organizer, gated behind `isPartner`) and `DashboardScreen`/`AccountScreen` (organizer → attendee).
- **Face SDK adapter (`lib/faceSDK.ts`)** — cleanly built. It's the single, well-documented integration point for the real KBY-AI SDK once licensed; every screen that uses it correctly goes through the same four functions (`enrollFace`, `verifyFace`, `checkLiveness`, `getSDKStatus`). The mock behavior (2s enroll delay, match-if-both-non-empty verify) is intentional and clearly commented — this is not a bug, it's a placeholder waiting on a license.

---

## Full Flow Walkthrough: Guest → Attendee → Partner

Legend: ✅ works end-to-end · ⚠️ works but has a real gap · ❌ broken/dead end

### 1. Guest & Onboarding

| Screen | Status | Notes |
|---|---|---|
| `SplashScreen` | ✅ | Hydrates auth from `AsyncStorage`, routes accordingly. |
| `WelcomeScreen` | ✅ | Static carousel, no data needed. |
| `LoginScreen` | ⚠️ | Real `POST /auth/login` incl. 2FA branch. "Continue with Google" has no `onPress`; "Continue with Facebook" is wired to a no-op. Sets `modeStore` correctly based on `user.isPartner`. |
| `RegisterScreen` | ✅ | Real `POST /auth/register`, full state coverage. |
| `ForgotPasswordScreen` | ✅ | Real 3-step OTP flow (`forgot-password` → `verify-otp` → `reset-password`), resend cooldown, all states. |
| Guest browsing | ✅ | `GuestNavigator` nests the attendee tab experience directly — a logged-out user can browse Discover/Search freely; tapping Tickets/Inbox/Profile redirects to Login rather than showing a dead-end gate screen. Clean pattern. |

### 2. Attendee — Discover & Purchase

| Screen | Status | Notes |
|---|---|---|
| `HomeScreen` | ⚠️ | Real events/categories. Newsletter "Subscribe" is local-only — no backend endpoint exists for it (explicitly commented in code). |
| `ExploreScreen` | ✅ | Real featured + general event queries. |
| `CategoryScreen` | ✅ | Real, skeleton loading states. |
| `EventDetailScreen` | ⚠️ | Real event/comments/like/related-events. "Copy link" button doesn't actually copy (marked TODO — `expo-clipboard` is installed but not wired here). Save/bookmark button calls the 404ing endpoint (issue #6). |
| `OrganizerProfileScreen` | ⚠️ | Real event list + follow mutation, but Follow button always starts as "Follow" — it never checks the real follow status on mount, only flips local state optimistically after a tap. |
| `SearchScreen` | ✅ | Real search/trending/recent-searches (persisted locally). |
| `CheckoutScreen` | ✅ *Fixed 2026-08-05* | Was blocked entirely by the missing `/tickets/initiate` route (issue #1) — now mints its own Paystack reference client-side and calls the real verify + ticket-creation endpoints. Free tickets (`usePurchaseFreeTicket` → `POST /audience/free/:eventId`) were also silently broken (wrong field names) and are now fixed too. |
| `OrderConfirmationScreen` | ✅ | Pure display of route params, nothing to break. |

### 3. Attendee — Tickets, Face, Transfer

| Screen | Status | Notes |
|---|---|---|
| `MyTicketsScreen` | ✅ | Real, cache-first with background refresh. |
| `TicketDetailScreen` | ✅ *Fixed 2026-08-06* | Its core data fetch (`useTicketDetail`) was silently resolving to `undefined` on every load (response-envelope mismatch) — not just the live-status polling originally flagged as issue #7. Both fixed. |
| `TransferTicketScreen` (send) | ✅ | Correctly wired. |
| `IncomingTransferScreen` (receive) | ✅ *Fixed 2026-08-05* | Was unreachable + broken even if reached (issue #5) — now reachable via the notification tap with a real accept/decline flow. |
| `FaceCheckInScreen` (attendee's own) | ✅ *Built, gated off* | Was 100% mocked (issue #4), now calls the real endpoint correctly with a real-stakes warning — but unreachable from `TicketDetailScreen` pending the v2 face-verification launch (see dedicated section above). |
| `FaceEnrollmentScreen` | ✅ *Built, gated off* | Was a dead end after the success animation (issue #3), now syncs to the server and updates local auth state — but unreachable from `ProfileScreen` pending v2. |
| `FaceEnrollmentStatusScreen` | ✅ *Built, gated off* | Reads `user.faceEnrolled` from the auth store correctly, but its only entry point (`ProfileScreen`'s "Face Entry" row) is hidden pending v2. |

### 4. Attendee — Profile & Social

| Screen | Status | Notes |
|---|---|---|
| `ProfileScreen` | ⚠️ | Real profile/following data. "Events Attended" stat is hardcoded to `0`, not backed by any query. Mode-switch toggle to organizer works (gated on `isPartner`); non-partners get an `Alert` stub instead of a real "become an organizer" flow. |
| `EditProfileScreen` | ⚠️ | Real `PUT /users/:id`. "Change Photo" is an explicit `Alert.alert('Coming Soon')` stub — no image picker wired. |
| `FollowingScreen` | ✅ | Real list + unfollow with manual optimistic update/rollback. |
| `InboxScreen` | ✅ | Real notifications + live socket updates. |

### 5. Organizer — Onboarding, Dashboard, Account

| Screen | Status | Notes |
|---|---|---|
| `AccountScreen` | ✅ | Real user data, navigates correctly, logout clears ticket cache too. |
| `BankScreen` | ✅ | Real bank account CRUD, full validation. |
| `KycScreen` | ✅ *Fixed 2026-08-05* | Was calling a phantom endpoint with the wrong fields entirely (issue #2) — now captures both required photos via camera and submits to the real endpoint, with a proper rejected-state explanation. |
| `DashboardScreen` | ✅ | Real revenue/analytics/events, skeleton/error/empty/pull-to-refresh all present. "Switch Mode" toggle works. |

### 6. Organizer — Events & Check-in

| Screen | Status | Notes |
|---|---|---|
| `EventsListScreen` | ✅ | Real, status filter pills, skeleton/error/empty. |
| `CreateEventScreen` | ✅ | Real multi-step wizard with autosaved draft, real image upload, real publish/save-draft mutations. |
| `EditEventScreen` | ✅ | Real, dirty-tracking disables Save until something changes. |
| `EventDetailScreen` (organizer) | ✅ | Real event + analytics, correct routing to sub-screens. |
| `TicketTiersScreen` | ⚠️ | Functionally real (hits the correct endpoints) but hand-rolls its own fetch logic instead of using the existing `useUpdateTier`/`useDeleteTier` hooks — edits here won't invalidate the React Query cache used elsewhere, so other screens showing the same event's tiers may show stale data until manually refreshed. |
| `PromoCodesScreen` | ⚠️ | Same pattern as above — real endpoints, bypassed hooks, same stale-cache risk. |
| `AudienceScreen` | ✅ | Real read-only attendee list with stats. |
| `CheckInScreen` (event picker) | ✅ *Updated 2026-08-05* | Now routes to `ManualCheckInScreen` by default — face verification is deferred to v2 (see dedicated section above), and this was the only entry point into check-in at all, so the redirect is load-bearing. |
| `ManualCheckInScreen` | ✅ | Real, optimistic toggle with rollback. The default v1 check-in method now that face is gated off. |
| `FaceCheckInScreen` (organizer/staff) | ✅ *Built, gated off* | Fully real end-to-end (calls `/face/verify` correctly) — see "What's Genuinely Solid" above — but no longer reachable from `CheckInScreen` pending the v2 face-verification launch. |

### 7. Organizer — Payouts

| Screen | Status | Notes |
|---|---|---|
| `PayoutsScreen` | ✅ | Real revenue/withdrawal/bank data, client-side balance validation mirrors the server guard, full state coverage. |

---

## Backend Endpoint Status (grouped by feature)

Everything below was verified by reading the actual route file *and* the controller function it points to — not just the route declaration.

**Events & social** — ✅ all real: list/detail/categories/comments/like/follow. ❌ `POST /events/:id/save` does not exist (only `GET /events/saved` and `POST /events/:id/like` do).

**Tickets & payment** — ✅ `POST /audience/free/:eventId`, `GET /audience/my`, `/audience/:id`, `/audience/ref/:reference`, `POST /paystack/verify/:reference` (verifies payment only — does *not* create the ticket, that's a separate step), and `POST /audience/:userId/:eventId` (the real paid-ticket-creation endpoint) are all real with proper capacity/idempotency guards. `POST /tickets/initiate` still does not exist server-side, but as of the 2026-08-05 fix (issue #1 above) the mobile client no longer calls it. ⚠️ `GET /tickets/:id/status` is SSE, not JSON (still open).

**Transfers** — ✅ `POST /tickets/transfer/{initiate,accept,decline,claim}` and `GET /tickets/transfer/incoming` are all real and well-built server-side (escrow-style partial splits, atomic guards, notifications). The backend is fine — the breakage is entirely on the mobile client side (issue #5).

**Face** — ✅ `POST /face/enroll/:userId`, `POST /face/verify`, `DELETE /face/remove/:userId` all do real database work (real check-in writes, real template storage). ⚠️ The actual biometric comparison (`compareFaceTemplates`) is a placeholder (`Boolean(captured) && Boolean(stored)`) pending the KBY-AI license — this is documented, intentional, and checks in the *first* matching active ticket rather than verifying identity. Not a new bug, but worth knowing the "verify" step doesn't yet verify anything biometrically.

**Users / auth / KYC** — ✅ profile CRUD, change-password, register-as-organizer, onboarding, and `PUT /users/:id/kyc` (the real document-upload KYC endpoint) are all real. `POST /kyc/:userId` still does not exist anywhere, but as of the 2026-08-05 fix (issue #2 above) the mobile client no longer calls it — it now calls `PUT /users/:id/kyc` correctly.

**Partner / payouts** — ✅ revenue, analytics, wallet, KYC status, bank accounts, withdrawals — all real with ownership checks and balance validation.

**CMS / promo / notifications / search** — ✅ all real.

**Recently-modified files** (currently uncommitted in git) — `analytics.js`, `bank.js`, `commerce.js`, `face.js`, `promos.js` controllers, `Audience.js` model, `routes/bank.js`, `routes/pushToken.js` were all read in full: no stubs, no TODOs, no syntax issues. Whatever's mid-edit here is already in a complete, working state.

---

## Recommended Fix Order

1. ~~Fix or remove `/tickets/initiate`.~~ **Done 2026-08-05** — see issue #1 above.
2. ~~Fix organizer KYC submission.~~ **Done 2026-08-05** — see issue #2 above.
3. ~~Wire face enrollment to the server.~~ **Done 2026-08-05** — see issue #3 above.
4. ~~Wire the attendee's own face check-in screen to `POST /face/verify`.~~ **Done 2026-08-05, with a flagged product question** — see issue #4 above. Worth a deliberate product decision on whether self-service face check-in should exist at all, separate from whether it's wired correctly.
5. ~~Register `IncomingTransferScreen` in a navigator, fix the response-envelope mismatch, wire real accept/decline endpoints.~~ **Done 2026-08-05** — see issue #5 above. Follow-up still open: push-notification deep-linking into this screen when the app is backgrounded, and a UI for the separate open-share-link claim feature (`useClaimTicket`).
6. ~~Add `POST /events/:id/save` server-side.~~ **Done 2026-08-06** — no new endpoint needed, see issue #6 above.
7. ~~Make `GET /tickets/:id/status` consumable, and check the rest of the audience endpoints for the same envelope mismatch.~~ **Done 2026-08-06** — see issue #7 above; also fixed `useTicketDetail` and `useTicketByRef`, and added `checkedIn`/`checkedInAt`/`checkedInMethod` to the shared `Ticket` type.
8. Lower priority polish:
   - ~~Wire "Change Photo" on `EditProfileScreen`.~~ **Done 2026-08-06** — real `expo-image-picker` capture, uploads via the generic `/upload` endpoint (added `useUploadProfilePhoto`), saves through the already-real `useUpdateProfile({image})`.
   - ~~Wire "copy link" on `EventDetailScreen`.~~ **Done 2026-08-06** — `expo-clipboard` was already a dependency, just never called.
   - ~~Make `OrganizerProfileScreen`'s follow button read real initial state.~~ **Done 2026-08-06** — now fetches `GET /organizers/:id/follow/status` on mount; also added error rollback to the toggle, which had none before (a failed follow/unfollow left the UI stuck on the optimistic value).
   - ~~Wire or remove the Google/Facebook SSO buttons on `LoginScreen`.~~ **Done 2026-08-06 — removed.** CLAUDE.md is explicit that OAuth is web/partner-only and mobile is email/password-only, so wiring a mobile OAuth flow would have contradicted the documented product decision; removed the buttons, the now-dead styles, and the unused `GOOGLE_LOGO`/`Image` import instead.
   - **Not done:** migrate `TicketTiersScreen`/`PromoCodesScreen` onto the existing `useUpdateTier`/`useDeleteTier`/`useEventPromos`/`useCreatePromo`/`useDeletePromo` hooks. Both screens work correctly today (real endpoints, real states) — this is a ~1,280-line internal-consistency refactor across two files with no user-facing bug behind it, held back pending a decision on whether that risk/effort is worth it for a non-bug.

---

## Methodology

Read directly: `apps/mobile/src/lib/api.ts`, all 11 files in `apps/mobile/src/hooks/`, all files in `apps/mobile/src/navigation/`, `apps/api/app.js` (full route mount map), `apps/api/utils/verifyToken.js`, `apps/mobile/src/lib/faceSDK.ts`, `apps/mobile/src/screens/onboarding/FaceEnrollmentScreen.tsx`, `apps/mobile/src/screens/attendee/checkout/CheckoutScreen.tsx`, `apps/mobile/src/screens/organizer/account/KycScreen.tsx`, `apps/api/routes/{face,transfer,partner}.js`, plus prior project audit docs (`SYSTEM_AUDIT.md`, `PHASE_3_FINDINGS.md`, `DEVELOPMENT_CONTRACTS.md`) for historical context — cross-checked against current code rather than trusted at face value (the `verifyUser` middleware bug `PHASE_3_FINDINGS.md` documented on 2026-06-05, for example, has since been fixed and is correctly *not* reported as broken above).

Delegated, then verified for consistency: a full read of every attendee/onboarding screen (24 files), every organizer screen (15 files), and every backend route/controller the mobile app calls, each cross-referenced against the route mount map and the hooks' expected request/response shapes rather than assumed from naming alone.

Not covered in this pass: `apps/partner`, `apps/admin`, `apps/web` (see `SYSTEM_AUDIT.md` for web), Maestro/Jest test suite results (test *files* exist and were referenced for context, but suites were not executed), and the real KBY-AI SDK integration (intentionally still mocked — not in scope until licensed).

---

*End of MOBILE_SYSTEM_AUDIT.md*
