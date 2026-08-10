# ComfyTag API

Express.js REST backend for **ComfyTag** — "your face is your ticket," a Nigerian event ticketing platform. This service backs four client apps: the attendee web app (`apps/web`), the organizer dashboard (`apps/partner`), the admin dashboard (`apps/admin`), and the mobile app (`apps/mobile`).

This README is written for a backend developer picking up this codebase for the first time. It documents **every route this API exposes**, grouped by feature area, with the actual auth requirement, request shape, response shape, and — where it matters — the real behavior found in the code (including a few sharp edges you should know about before you touch them). If a description here ever disagrees with the code, trust the code and update this file.

---

## 1. Quick Start

```bash
cd apps/api
pnpm dev          # nodemon app.js — auto-restarts on file change, http://localhost:4002
pnpm start        # node app.js — no auto-restart, for prod-like runs
```

Seed scripts (run once against a fresh DB):

```bash
pnpm seed:dev          # dev user accounts
pnpm seed:events       # sample events
pnpm seed:categories   # event categories
pnpm seed:testimonials # homepage testimonials
```

Tests (Vitest):

```bash
pnpm test           # run once
pnpm test:watch     # watch mode
pnpm test:coverage  # with coverage report
```

**Do not run `pnpm add`/`pnpm install` yourself** — per project convention, write the command and its target location and wait for the user to run it and paste back the output.

### Environment variables

Copy `.env.example` to `.env` and fill in real values. Groups, and what breaks without them:

| Group | Vars | Required? |
|---|---|---|
| Core | `PORT`, `JWT_SECRET`, `NODE_ENV` | Always |
| Database | `MONGO` (MongoDB URI) | Always |
| Redis / email queue | `REDIS_HOST`, `REDIS_PORT`, `REDIS_URL` | Only when the email queue feature is enabled (production) — see `config.js`. In dev, emails send directly via SES instead of queueing. |
| Frontend URLs | `WEB_URL`, `PARTNER_URL`, `ADMIN_URL` | Always — used to build email deep links (ticket confirmations, transfer accept/decline links, referral share links, etc.) |
| Email (AWS SES) | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `SES_SENDER_EMAIL` | Required in production; the sender must be a verified SES identity |
| Uploads (Cloudinary) | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Required for `/upload` and KYC document upload — the API responds `503` if any are missing, even before checking auth |
| Payments (Paystack) | `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` | Required for `/paystack/*` |
| Push notifications | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` (not in `.env.example` yet — generate via `scripts/generate-vapid-keys.js`) | Web Push silently no-ops if missing; doesn't crash the server |

The server validates required env vars at startup (`startup.js`) and will fail fast with a clear error if something critical is missing, rather than starting in a broken state.

### What happens on startup (`app.js`)

1. Validates environment variables.
2. If the email queue feature is on, verifies the Redis connection (exits the process if it can't connect).
3. Connects to MongoDB.
4. Drops a legacy strict unique index on `users.referralFallbackCode` if present (one-shot migration so Mongoose can recreate it as sparse — this silently no-ops on every startup after the first).
5. Wraps the Express app in a raw `http.Server` and attaches Socket.io to it (real-time notifications, live check-in feeds, dashboard updates).
6. Schedules two cron jobs: an hourly job that flips expired events'/tickets' status, and event-reminder emails (24h + 2h before each event). Both also run once immediately on boot to catch anything missed during downtime.
7. Starts listening.

---

## 2. Architecture at a Glance

```
apps/api/
├── app.js              Express app setup, all route mounting, Socket.io + cron bootstrap
├── config.js           Central config/feature-flag object (reads env vars)
├── startup.js          Environment validation
├── routes/             31 route files — thin, just wires paths to controller functions + middleware
├── controllers/        Business logic. NOT a 1:1 mapping to route files — several route files
│                        share one controller (e.g. commerce.js backs audience, wallet, referral,
│                        ticketToken, search, config, paystackVerify)
├── models/              Mongoose schemas — 25 collections
├── middleware/          upload.js (Cloudinary/multer config)
├── utils/               verifyToken.js (JWT/auth middleware), verifyAdminRole.js (RBAC),
│                        error.js, otp.js, referralCode.js, QRCode.js, sendEmail.js,
│                        emailProviders.js, emailTemplates/ (Handlebars templates)
├── jobs/                Cron job implementations (ticket expiry, event reminders), emailQueue.js
└── socket/index.js      Socket.io server setup + typed emit helpers
```

### The most important thing to understand: one router, many mount points

Several route files (`auth.js`, `users.js`, `event.js`, `category.js`, `audience.js`, `bank.js`, `withdraw.js`, `wallet.js`, `team.js`) are **mounted at multiple URL prefixes** in `app.js` — often `/thing`, `/admin/thing`, and `/partner/thing` all point at the *same* router file and controller. There is no separate "admin version" or "partner version" of the code — the differences in behavior come entirely from:

1. Whether `app.js` wraps that particular mount in `verifyPartner`/`verifyAdmin` at the mount level (some prefixes add a guard on top; others don't — see the per-route auth notes below, several routes behave differently than their prefix implies), and
2. What the controller itself checks (`req.user.isAdmin`, `req.user.isPartner`, ownership comparisons).

**This has produced a few real inconsistencies that are worth knowing before you build on top of them** — flagged inline below wherever found, e.g. some `/admin/*` routes are not actually admin-gated, and a few routes using `verifyUser` have no `:id`-shaped param for it to check ownership against (making them effectively admin-only in practice, regardless of what the route name suggests).

### Auth middleware (`utils/verifyToken.js`, `utils/verifyAdminRole.js`)

All JWT middlewares read the token from either the `access_token` cookie or an `Authorization: Bearer <token>` header, and verify it with `jwt.verify(token, process.env.JWT_SECRET, ...)`.

| Middleware | Requires |
|---|---|
| `verifyToken` | Any valid JWT. No ownership/role check — "is logged in," nothing more. |
| `optionalAuth` | Decodes the JWT if present but never rejects the request. Used on public routes that personalize their response (e.g. "have I liked this?") without requiring login. |
| `verifyUser` | Valid JWT **and** the token's user id equals `req.params.id` / `req.params.userId` / `req.params.uid` — OR the caller is an admin. **Gotcha:** if the route's actual param is named something else (e.g. `:email`, or there's no id param at all), this check always fails for non-admins, since it's comparing against `undefined`. Several routes below hit exactly this trap — they read like self-service endpoints but are admin-only in practice. |
| `verifyAdmin` | Valid JWT and `req.user.isAdmin === true`. |
| `verifyPartner` | Valid JWT and (`req.user.isPartner === true` OR `req.user.isAdmin === true`). |
| `verifyAdminRole(allowedRoles)` | Valid JWT, `req.user.isAdmin === true`, **and** `req.user.role` is in `allowedRoles` (or `'super_admin'`, which always passes regardless of the list; pass `[]` to mean "super_admin only"). Only used by the granular `/api/admin/*` RBAC surface and the `/cms/*` admin-mutation routes. Tokens minted before the `role` claim existed default to `'viewer'` (least privilege) until the user logs in again. |

### Response shape convention

Most endpoints return `{ success: boolean, data/message, ... }`. **Not all of them do** — a number of older routes (mostly plain `PUT`/`DELETE` on the legacy `auth`/`users`/`bank`/`withdraw`/`category`/`testimonial` routers) return a bare document or even a plain string like `"Bank has been deleted"` instead of a JSON object. This is called out per-route below; don't assume the wrapper is universal.

---

## 3. Full Route Reference

Legend for **Auth**: `none` = public, `optionalAuth` = public but personalizes if logged in, `verifyToken` = any logged-in user, `verifyUser` = self-or-admin (see gotcha above), `verifyPartner` = organizer-or-admin, `verifyAdmin` = admin only, `verifyAdminRole([...])` = admin with specific role.

### 3.1 Authentication

`routes/auth.js` → `controllers/auth.js`. Mounted at **`/auth`**, **`/admin/auth`**, and **`/partner/auth`** — identical router/controller in all three; only who ends up calling it differs (attendee login vs. admin login vs. partner login all hit the same code).

| Method & Path | Auth | What it does |
|---|---|---|
| `POST /register` | none | Creates an attendee account. Joi-validated, password hashed, referral code generated (retries up to 5x on collision), OTP emailed for verification, welcome-email drip enqueued (non-blocking). If `isPartner: true`, notifies support admins instead of sending the attendee welcome series. |
| `POST /register-partner` | none | Same as `/register` with `isPartner` forced to `true` — organizer sign-up. |
| `POST /login` | none, rate-limited (10/15min/IP) | Email+password login, optional TOTP 2FA. Returns JWT (cookie + body). `403` if email unverified. `401`/`TWO_FACTOR_REQUIRED` for bad creds/missing OTP. |
| `POST /google-signin` | none | OAuth sign-in/up. Creates an account on first sign-in (no OTP needed) or upgrades an existing attendee to partner if `isPartner: true` is passed. |
| `GET /me` | verifyToken | Returns current user + a freshly re-issued token. Strips `isAdmin` from the response. Lazily backfills missing referral codes. |
| `GET /:id/verify/:token` | none | Legacy click-through email verification link (distinct from the OTP flow). Single-use — deletes the token on success. |
| `PUT /:id/verifykyc/:kyc` | verifyAdmin | Legacy admin KYC approve/reject for one element (`photo`/`idcard`/`address`/`reject`). Superseded by `/api/admin/kyc/*` but still functional. **Bug:** passing anything other than the three valid `kyc` values silently produces a no-op update with no error. |
| `POST /resend-verification` | none, rate-limited | Re-sends the OTP. Anti-enumeration — always returns the same generic message. |
| `GET /verify/:email` | verifyUser | Older resend-verification variant. **Effectively admin-only** — the route param is `:email`, not `:id`/`:userId`/`:uid`, so `verifyUser`'s ownership check always fails for non-admins. |
| `PUT /register-organizer/:userId` | verifyUser | Upgrades an attendee to organizer without re-registering. Issues a fresh token with the updated `isPartner` claim. Enqueues organizer welcome series + notifies support admins. |
| `POST /verify-email-otp` | none, rate-limited | Verifies a 6-digit OTP; on success also logs the user in (unless the account has 2FA, in which case it only confirms email and asks for a password). Single-use OTP. |
| `POST /request-otp` | none, rate-limited | Requests a passwordless-login OTP. 2FA accounts are excluded (can't bypass a configured second factor via email OTP). Strict anti-enumeration response. |
| `POST /forgot-password` | none, rate-limited | Emails an OTP for password reset (bcrypt-hashed before storage). Unlike `/request-otp`, this one **does** 404 for unknown accounts. |
| `POST /verify-otp` | none, rate-limited | Verifies the forgot-password OTP, issues a short-lived (5 min) `resetToken` JWT. |
| `POST /reset-password` | none (resetToken is the real auth) | Sets a new password given a valid `resetToken`. Checks the token's `userId` matches the looked-up user to prevent cross-account replay. |
| `POST /change-password` | verifyUser | Self-service password change (current + new password). **Same gotcha as `/verify/:email`** — no `:id` param, so `verifyUser` degrades to admin-only in practice. Worth fixing before shipping a "change my password" UI against it. |

### 3.2 Users

`routes/users.js` → `controllers/users.js` (model `User.js`). Mounted at **`/users`**, **`/admin/users`**, **`/partner/users`** — same code at all three; the latter two carry no extra outer guard, so effective auth is identical everywhere.

| Method & Path | Auth | What it does |
|---|---|---|
| `PUT /onboard/:id` | verifyUser | Saves onboarding questionnaire answers (experience level, team size, interests, etc.) under `user.onboarding`. |
| `PUT /:id` / `PATCH /:id` | verifyUser | General profile update. Hard field whitelist: `username, name, email, phone, businessName, address, image, avatar, bgImg, notificationPreferences, privacySettings` — anything else is silently dropped. `400` empty/invalid username, `409` username taken. |
| `PUT /verify/:id` | verifyUser | Overwrites the `verify` sub-document (KYC doc URLs) wholesale. Legacy — prefer `PUT /:id/kyc` below. |
| `PUT /isverify/:id` | verifyAdmin | Admin override of `isVerify` booleans. Legacy — doesn't update `kycStatus`, so using this instead of the `/api/admin/kyc/*` endpoints will desync the two fields. |
| `PUT /:id/kyc` | verifyUser + `upload.single('file')` | Multipart KYC document upload straight to Cloudinary (`comfytag/kyc` folder). Sets `kycStatus: 'pending'`. Allowed types: jpeg/png/webp/gif/mp4/mov/webm, 100MB cap. Notifies `kyc_reviewer` admins. |
| `GET /:id/stats` | none | Public organizer stats card: `{ followers, upcomingEvents }`. |
| `DELETE /:id` | verifyUser | Hard-deletes the user. **No cascade** to their events/tickets. Returns a bare string, not JSON. |
| `GET /:id` | none | Public profile — looks up by `username` first, falls back to `_id`. Returns profile + events + follower/event/tickets-sold counts. Fairly heavy for an unauthenticated route; consider caching if traffic grows. |
| `GET /` | verifyAdmin | Dumps **every** user, no pagination. Prefer `GET /api/admin/users` (paginated) for anything real. |

### 3.3 Partner (Organizer) Profile & KYC

`routes/partner.js` → `controllers/partner.js`. Mounted once at **`/partner`**, wrapped in `verifyPartner` at the mount level — every route below is checked twice (outer `verifyPartner`, plus its own declared auth).

| Method & Path | Auth | What it does |
|---|---|---|
| `GET /partner/kyc/:userId` | verifyPartner (outer) + verifyUser (inner) | Lightweight KYC status view — returns `isVerify` booleans **and** the raw `verify` doc URLs (so the frontend can tell "never submitted" from "submitted, pending review"), plus `kycStatus`. |

### 3.4 Team / Co-Organizers

`routes/team.js` → `controllers/team.js` (model `CoOrganizer.js`). Mounted at **`/events`** and **`/partner/event`**, both registered *before* `eventRouter`'s `/:id` wildcard so `/team` paths aren't swallowed. Every route applies its own `verifyPartner` directly.

| Method & Path | Auth | What it does |
|---|---|---|
| `GET /:id/team` | verifyPartner + owner/admin check | Lists an event's co-organizer team (excludes removed members). |
| `POST /:id/team` | verifyPartner + owner/admin check | Invites a co-organizer by email with a permission set (`checkin`, `analytics`, `edit`, `manage_tickets`; defaults to `['checkin']`). Immediately `active` if the email matches an existing account, else `pending`. Re-activates a previously-removed invite instead of duplicating. **No email is actually sent** despite the "invite" language — worth confirming with product whether that's expected. |
| `DELETE /:id/team/:userId` | verifyPartner + owner/admin check | Soft-removes a co-organizer (`status: 'removed'`, not a hard delete). |

### 3.5 Admin (Granular RBAC)

`routes/admin.js` → `controllers/admin.js`. Mounted once at **`/api/admin`** — the newer, granular-role admin surface, distinct from the legacy `/admin/*` mounts above. Every route uses `verifyAdminRole([...])`.

**KYC**
| Method & Path | Roles | What it does |
|---|---|---|
| `POST /api/admin/kyc/approve` | `kyc_reviewer`, `finance` | Approves one KYC element (`photo`/`idcard`/`address`). Notifies user in-app. |
| `POST /api/admin/kyc/reject` | `kyc_reviewer`, `finance` | Rejects overall KYC with a reason. Notifies user in-app. |
| `GET /api/admin/kyc/queue` | `kyc_reviewer`, `finance`, `support` | Paginated queue of organizers with `kycStatus: 'pending'`. |
| `GET /api/admin/kyc/:userId` | `kyc_reviewer`, `finance`, `support` | Full KYC detail for one user. |

**Users**
| Method & Path | Roles | What it does |
|---|---|---|
| `GET /api/admin/users` | `support`, `moderator`, `finance` | Paginated, filterable user directory (`role`, `isPartner`, `suspended`). Password/`totpSecret`/`faceTemplate`/`faceEnrollmentDevice` always excluded. |
| `POST /api/admin/users/create-admin` | `[]` (super_admin only) | Creates a staff account with an explicit role — the *only* way to create an admin, since public registration never honors `isAdmin`/`role` from the body. New staff accounts skip email verification. |
| `GET /api/admin/users/:id` | `support`, `moderator`, `finance` | Full user detail. |
| `PATCH /api/admin/users/:id/suspend` / `/restore` | `moderator`, `support` | Flags `suspended: true`/`false`. **Note:** nothing currently blocks login based on this flag — confirm whether enforcement is expected elsewhere before relying on it. |
| `DELETE /api/admin/users/:id` | `[]` (super_admin only) | Hard delete, no cascade. |
| `PATCH /api/admin/users/:id/role` | `[]` (super_admin only) | Changes `role`; keeps `isAdmin` in lockstep (`'viewer'` → `isAdmin:false`, anything else → `true`). |

**Payouts**
| Method & Path | Roles | What it does |
|---|---|---|
| `POST /api/admin/payouts/process` | `finance` | Marks a withdrawal as sent (manual confirmation — no real funds-transfer integration exists). Notifies user. |
| `POST /api/admin/payouts/reject` | `finance` | Rejects a withdrawal with a reason. Notifies user. |
| `GET /api/admin/payouts/pending` | `finance`, `support` | Paginated pending-withdrawal queue. |
| `GET /api/admin/payouts/:id` | `finance`, `support` | Single withdrawal detail. |

**Events**
| Method & Path | Roles | What it does |
|---|---|---|
| `GET /api/admin/events` | `moderator`, `support`, `finance` | Paginated event listing. |
| `GET /api/admin/events/:id` | `moderator`, `support`, `finance` | Single event detail. |
| `PATCH /api/admin/events/:id/suspend` | `moderator` | Sets status to `'cancelled'` — there's no dedicated "suspended" status, so this is indistinguishable from an organizer cancellation by status alone. |
| `PATCH /api/admin/events/:id/restore` | `moderator` | Sets status to `'published'` **unconditionally**, regardless of what it was before suspension (e.g. a suspended draft comes back as published — worth flagging if drafts can hit this path). |
| `DELETE /api/admin/events/:id` | `[]` (super_admin only) | Hard delete, no cascade to tickets/orders. |

**Analytics**
| Method & Path | Roles | What it does |
|---|---|---|
| `GET /api/admin/analytics/overview` | `finance`, `support`, `moderator` | `{ totalUsers, totalEvents, pendingKyc, pendingPayouts }`. |
| `GET /api/admin/analytics/revenue` | `finance` | **Not implemented** — always `501`. |
| `GET /api/admin/analytics/users` | `support`, `finance` | `{ totalUsers, newUsersLast30Days, totalPartners }` (fixed 30-day window). |

**Settings** (all super_admin only, `[]`)
| Method & Path | What it does |
|---|---|
| `GET /api/admin/settings` | Fetches the singleton `SiteConfig` doc, creating defaults if none exists. |
| `PUT /api/admin/settings` | Updates it (upserts). No field whitelist — check the `SiteConfig` model before wiring a form to this. |
| `PATCH /api/admin/settings/feature-flags` | **Not implemented** — always `501`. |

**Audit** (all super_admin only, `[]`)
| Method & Path | What it does |
|---|---|
| `GET /api/admin/audit-log` | **Not implemented** — always `501`. No `AuditLog` model exists yet, and none of the mutation endpoints above currently write audit entries anywhere. |
| `GET /api/admin/face-logs` | Paginated list of users with `faceEnrolled: true`. Despite the name, this is just a filtered user list, not a log of individual verification attempts. |

**Notifications**
| Method & Path | Roles | What it does |
|---|---|---|
| `POST /api/admin/notifications/broadcast` | `moderator`, `support` | Sends an in-app + Socket.io notification to users matching a Mongo `filter` object (defaults to `{}`, i.e. everyone). **Security note:** `filter` is passed straight to `User.find()` with no key whitelist — this is effectively a raw query builder gated only by role. Worth restricting before exposing it in a less-trusted UI. |

---

### 3.6 Events

`routes/event.js` → `controllers/event.js` (model `Event.js`). Mounted at **`/admin/event`**, **`/event`**, **`/events`**, and **`/partner/event`** (this last one wrapped in `verifyPartner` at the mount, applying to the *entire* router — including routes that are normally public elsewhere).

**Route-ordering note:** all the static-path GETs below (`/feed`, `/nearby`, `/categories`, etc.) are declared before the `GET /:id` wildcard in the file — if they weren't, `/:id` would swallow them.

| Method & Path | Auth | What it does |
|---|---|---|
| `GET /feed` | none | Paginated upcoming-published-events feed for the attendee home screen (only events with ≥1 ticket tier configured). |
| `GET /nearby` | none | Published events filtered by Nigerian state (case-insensitive partial match), paginated. |
| `GET /categories` | none | Distinct primary categories currently in use by published events. |
| `GET /category-counts` | none | Count of upcoming published events per category (primary + secondary), sorted descending. |
| `GET /states` | none | Distinct Nigerian states with ≥1 published event. |
| `GET /category/byCategory` | none | Legacy — comma-separated categories, returns an **array of arrays** (one per category, not flattened). Throws if `categories` query param is omitted. |
| `GET /filter/byType` | none | Legacy multi-value filter (free/paid/online/offline/today/active/ended). Returns array of arrays. **The free/paid branch is effectively broken** — it filters `ticketType` as if it were a string, but the schema now stores it as an array of tier objects. Treat as legacy/dead code. |
| `GET /filter/single` | none | Legacy single `$or` filter across state/category/ticketType/planner_id. Throws if `eventsfilter` omitted. |
| `GET /pick/toppick` | none | Events flagged `pick: true` (editorial "top pick"). |
| `GET /pick/sold` | none | All events sorted by `sold` descending ("best selling"). |
| `GET /state/byState` | none | Events matching an exact state value. |
| `GET /payment/byPayment` | none | Legacy multi-value filter, same broken free/paid logic as `/filter/byType`. Throws if `paymentType` omitted. |
| `GET /user/:userId` | none | All events by an organizer — **no status filter**, includes drafts, no pagination. |
| `POST /:userId` | verifyUser | Creates an event. `planner_id`/`planner`/`slug` are always derived server-side (slug = slugified name + base36 timestamp), never trusted from the body. Strips `promos[]` entries missing a `code`. |
| `GET /:id/activity` | verifyToken (ownership checked manually against `event.planner_id`) | Merges the 8 most recent purchases + 8 most recent check-ins into one timeline (max 10 items), attendee names redacted to "First L." |
| `GET /:id/tiers/stats` | none | Per-tier price/capacity/sold/available breakdown. `sold` is computed live from non-refunded `Audience` records (case-insensitive tier-name match), not read off the event doc directly. Unauthenticated despite being tier-management data. |
| `PUT /:id/tiers/:tierId` | verifyToken (ownership checked in controller) | Updates a tier's `name`/`price`/`capacity`. |
| `DELETE /:id/tiers/:tierId` | verifyToken (ownership checked in controller) | Deletes a tier. `400` if any tickets have already sold in it. |
| `POST /:id/publish` | verifyToken (ownership checked in controller) | Sets `status: 'published'`. Fire-and-forget afterward: notifies all the organizer's followers (in-app + email), with an "urgency" badge if remaining capacity <20%. |
| `POST /:id/cancel` | verifyToken (ownership checked in controller) | Sets `status: 'cancelled'`, emits Socket.io `event:cancelled` to the organizer's room. |
| `PUT /:id` / `PATCH /:id` | verifyToken (ownership checked in controller) | General update. Strips immutable fields (`_id, __v, planner_id, planner, slug, sold`) from the body. Recomputes `totalCapacity` if `ticketType` changes (`null` = unlimited, if any tier has `capacity: null`). **Side effects based on `status` in the body** (best-effort, failures only logged): `'ended'` → queues attendee recap emails + a 5-day-later recommendation email, and an organizer performance-report email; `'published'` → same follower-notification flow as `/publish`. |
| `DELETE /:id` | verifyToken (ownership checked in controller) | Permanently deletes the event, removes it from the owner's `User.events`, emits `event:deleted`. |
| `GET /:id` | none | Fetch by **slug first, then `_id`** as fallback. `Cache-Control: no-cache` (always fresh sold/capacity numbers). |
| `GET /` | none | Main paginated public listing. Filters: `status` (default `'published'`), `planner_id`, `state`, `showPast`, `category`, `priceMin`/`priceMax`, `page`, `limit` (capped at 100). |

### 3.7 Event Search & Discovery

`routes/eventSearch.js` → `controllers/commerce.js`. Mounted at **`/events`**, registered **before** `eventRouter`, so `GET /events/search` never gets mistaken for `GET /events/:id`.

| Method & Path | Auth | What it does |
|---|---|---|
| `GET /events/search` | none | Main search bar. Filters: `q` (text match on name/venue/planner/address/state, regex-escaped), `category`, `city`/`state`, `priceMin`/`priceMax`, `date` (`today`/`tomorrow`/`weekend`), `featured`, `showPast`, `page`, `limit`. Defaults to future published events only unless `showPast`/`date` says otherwise. |

`routes/search.js` → `controllers/commerce.js`. Mounted at **`/search`**.

| Method & Path | Auth | What it does |
|---|---|---|
| `GET /search/suggestions` | none | Typeahead across events (max 3), organizers (max 3), and artists/performers (max 3). Empty if `q` is missing or <2 chars. |
| `GET /search/trending` | none | Top 6 upcoming published events by tickets sold. |

### 3.8 Categories

`routes/category.js` → `controllers/category.js` (model `Category.js`). Mounted at **`/categories`**, **`/category`**, **`/partner/category`** (no extra guard on the partner mount).

| Method & Path | Auth | What it does |
|---|---|---|
| `POST /` | verifyAdmin | Creates a category (title stored lowercase; icon/gradient/sort-order defaults). Returns `200`, not `201`. |
| `PUT /:id` | verifyAdmin | Updates a category (no explicit 404 if id doesn't exist). |
| `DELETE /:id` | verifyAdmin | Deletes; returns a bare string. |
| `GET /:id` | none | Fetch one. |
| `GET /` | none | List all, or `?featured=true` for the homepage chip set (active + featured, sorted by `featuredSortOrder`). |

### 3.9 Audiences (Tickets)

`routes/audience.js` → `controllers/audience.js` (model `Audience.js`) — an "Audience" document *is* a purchased/claimed ticket + check-in state. Mounted at **`/audience`** and **`/partner/audience`** (the latter wrapped in mount-level `verifyPartner`, which also gates the otherwise-public free-ticket route when accessed through that prefix).

| Method & Path | Auth | What it does |
|---|---|---|
| `POST /free/:eventId` | none (public; partner-gated only via `/partner/audience`) | Claims a free ticket without payment. Caps at 10 free tickets/email/event. Generates TOTP secret + QR code, increments tier/event `sold` counts (non-atomic here — see below), sends confirmation email + organizer notification (fire-and-forget). |
| `POST /checkin-by-ref` | verifyPartner | QR/barcode scanner check-in by raw reference string. Returns `alreadyCheckedIn: true` (still `200`, not an error) if already used. `403` if the partner doesn't own the event. |
| `POST /:id/checkin` | verifyPartner | Manual check-in toggle from the attendee list. |
| `POST /:userId/:eventId` | verifyToken | **Primary paid-ticket-creation endpoint**, called post-payment. Server derives `amount` itself (never trusts the client): `tier.price * qty * 1.05` — the platform's 5% fee baked directly into the stored charge. Requires `reference` (Paystack transaction ref) unless the tier is free. Capacity is enforced **atomically** via a single guarded `findOneAndUpdate` (`sold <= capacity - qty`) to close a check-then-increment race. Sends buyer + organizer notifications and a confirmation email (this email is awaited on the critical path, unlike most others in this codebase). |
| `GET /my` | verifyToken | The caller's own tickets, enriched with event date/time/venue/slug. Matches by `user_id` *or* email (covers guest-purchased tickets), batched event lookups to avoid N+1. |
| `GET /user/:userId` | verifyToken | Legacy equivalent of `/my` without enrichment. Also silently migrates any `user_id: 'guest'` tickets matching the caller's email over to their real id, fire-and-forget. |
| `GET /event/:eventId` | verifyPartner (must own the event, or admin) | Paginated attendee list for the organizer dashboard. |
| `GET /events/:eventId/audience/export` | verifyPartner (must own the event, or admin) | CSV export of all attendees. Note: combined with the mount prefix, the literal path is `/audience/events/:eventId/audience/export` (yes, "audience" twice) — that's how it's declared in the file. |
| `GET /ref/:reference` | none | Lightweight ticket lookup by reference, for the public pre-auth "claim ticket" preview page. Projected fields only. |
| `PUT /:id` | verifyPartner (must own the ticket's event) | Lets an organizer correct attendee contact info — strict whitelist, only `name`/`phone` accepted. |
| `DELETE /:id/:userId` | verifyToken (self, event-owning partner, or admin) | Deletes a ticket. Returns a bare string. |
| `GET /:id` | verifyToken (self or admin) | Fetch one ticket. |
| `GET /` | verifyAdmin | Every ticket in the system, paginated (default 50, max 100). |

**Business logic worth knowing:** the free-ticket claim (`POST /free/:eventId`) increments `sold` counters directly rather than through the atomic guarded update used by the paid path — under concurrent load this is more susceptible to a race than the paid-ticket flow.

### 3.10 Face Recognition & Check-in

`routes/face.js` → `controllers/face.js` (model fields on `User.js`). Mounted at **`/face`**.

This is the backend half of "your face is your ticket." The mobile app's `apps/mobile/src/lib/faceSDK.ts` adapter wraps the KBY-AI SDK (currently mock mode) and does capture/processing **on-device**; only the resulting encoded template crosses the wire.

> **Two things every backend dev on this feature needs to know up front:**
> 1. **No server-side encryption.** `User.faceTemplate` is a plain `String` field with `select: false` (excluded by default; must `.select('+faceTemplate')` to read it). `enrollFace` writes `req.body.faceTemplate` straight to that field with no encryption/hashing/validation. Whatever the mobile SDK sends is what gets persisted, verbatim. The "encrypted, never raw" guarantee is entirely a client-side (KBY-AI on-device) responsibility today — there's no additional server-side layer.
> 2. **Matching is mocked.** `verifyFace`'s comparison helper `compareFaceTemplates(captured, stored)` is **not** real biometric matching — it literally just checks both strings are non-empty (`Boolean(captured) && Boolean(stored)`). In practice, whichever face-enrolled active ticket for the event is found *first* will "match," regardless of whose face was actually captured. This is a known placeholder (there's a `TODO` in the code) pending the KBY-AI SDK license — **do not treat this as a real security boundary** until real matching lands.

| Method & Path | Auth | What it does |
|---|---|---|
| `POST /face/enroll/:userId` | verifyUser | Stores the template, sets `faceEnrolled: true`. `deviceId` stored as `faceEnrollmentDevice` (audit only). Notifies the user in-app (fire-and-forget). |
| `POST /face/verify` | verifyToken (any authenticated user — **not** partner-scoped, see security note below) | 1:N identification: given `{ faceTemplate, eventId }`, searches every `active` ticket for that event with a non-null `faceOwner`, loads each owner's template, looks for a match (see mock-matching caveat above). On match: sets `checkedIn: true`, `checkedInMethod: 'face'`, `status: 'used'` (terminal — a ticket can only be face-checked-in once). |
| `DELETE /face/remove/:userId` | verifyUser | Wipes the stored template (`faceEnrolled: false`, `faceTemplate: null`, etc.). **Not** actually wired into the ticket-transfer flow despite a code comment suggesting it runs "on transfer" — transfers instead reset `faceLinkedAt` on the *ticket*, not the user's template. No cascade to tickets still pointing `faceOwner` at this user; they'll just fail to match on the next scan since the owner gets filtered out (`faceEnrolled` now false). |

**Security note worth flagging to whoever owns this feature:** `POST /face/verify` only requires *any* valid JWT, not `verifyPartner`/event-staff ownership. Any authenticated ComfyTag user can currently call it against any `eventId` and force a check-in. Tightening this to `verifyPartner` + an event-ownership check is a reasonable hardening candidate. Also note: no Socket.io emit or organizer notification fires on a face check-in (unlike ticket transfers) — if organizers need a live check-in feed, it isn't there yet for this method.

### 3.11 Ticket Tokens / QR

`routes/ticketToken.js` → `controllers/commerce.js`. Mounted at **`/tickets`**. The fallback check-in surface for attendees not using face check-in — a rotating TOTP code plus a live status stream.

| Method & Path | Auth | What it does |
|---|---|---|
| `GET /tickets/:id/token` | verifyToken (must own the ticket) | Generates the current 30-second TOTP code from the ticket's `totpSecret` (via `otplib`). Returns `{ token, validFor }` (seconds left in the current step). No corresponding "validate this code at the door" route exists in this file — this endpoint only *issues* the code. |
| `GET /tickets/:id/status` | verifyToken | **Server-Sent Events** stream (`text/event-stream`), not JSON. Pushes `{ checkedIn, checkedInAt }` immediately on connect and every 5 seconds after (poll-based against the DB, not a change-stream), until the client disconnects. No ownership check beyond being logged in — any authenticated user who knows a ticket id can subscribe to its status. |

### 3.12 Ticket Transfers

`routes/transfer.js` → `controllers/transfer.js`. Mounted at **`/tickets/transfer`**.

**State machine:** `active` (normal ticket) → a **partial** transfer spins off an `escrow` child ticket that exists only until accepted/declined → `cancelled` (declined/rolled-back escrow child). A **full** transfer doesn't change `status` at all — only `transferredTo`/`transferToken` track the pending handoff.

| Method & Path | Auth | What it does |
|---|---|---|
| `POST /tickets/transfer/initiate` | verifyToken (must own the ticket) | Starts a transfer to another user by email/phone, optionally partial via `shareQuantity`. Safety ordering: the escrow child is saved *first*, then the parent is atomically decremented with a `$gte` guard; if that guarded update loses a race, the already-saved child is rolled back to `cancelled` and the client gets `409` — never leaves the parent decremented with no corresponding child. Generates a crypto-random `transferToken` gating acceptance. Fire-and-forget: Socket.io notification + `transferInitiated.hbs` email with accept/decline deep links. |
| `POST /tickets/transfer/accept` | verifyToken (must be the named recipient) | Reassigns `user_id` **and** `faceOwner` to the recipient, resets check-in state and `faceLinkedAt`. Escrow children "graduate" to `active` on acceptance. Does **not** touch the *previous* owner's `User.faceTemplate` (see the `/face/remove` caveat). |
| `POST /tickets/transfer/decline` | verifyToken (must be the named recipient) | For an escrow child: restores the parent's `numOfTicket` *before* marking the child `cancelled` (same failure-safe ordering as initiate). For a full transfer: ticket just stays with the original owner. |
| `POST /tickets/transfer/claim` | verifyToken | Open, link-based claim by `reference` (not a targeted invite) — anyone with the reference can claim it, as long as it isn't already mid-transfer (`409`) or not `active` (`410`). Same ownership-reassignment side effects as `accept`, but silently — no notification/email. |
| `GET /tickets/transfer/incoming` | verifyToken | Lists pending transfers addressed to the caller. `transferToken` is fetched internally to filter but stripped before the response — clients only get the real token via the emailed deep link. |

### 3.13 File Uploads

`routes/upload.js` (`middleware/upload.js`). Mounted at **`/upload`**. Generic Cloudinary-backed media upload (event cover images/video) — not used by face enrollment, which sends the template as an inline JSON string.

| Method & Path | Auth | What it does |
|---|---|---|
| `POST /upload` | verifyToken (but the Cloudinary-config check middleware runs **before** auth — see note) | Single-file multipart upload (`file` field) to `comfytag/events`. Allowed types: jpeg/png/webp/gif/mp4/mov/webm, 100MB max, buffered in memory (no disk write). 60-second hard timeout → `504` if Cloudinary is slow. Cloudinary auth failures (401/403) are deliberately **remapped to `503`** so the frontend doesn't confuse a Cloudinary credentials problem with the user's own session expiring. |

### 3.14 Bank Accounts

`routes/bank.js` → `controllers/bank.js` (model `Bank.js`). Mounted at **`/bank`** and **`/partner/bank`** (both wrapped in mount-level `verifyPartner`) and **`/admin/bank`** (⚠️ **no mount-level wrapper** — despite the name, this prefix does not imply admin-only access; only the route's own declared middleware applies).

| Method & Path | Auth | What it does |
|---|---|---|
| `POST /bank/:userId` | verifyUser (+ verifyPartner on the `/bank`/`/partner/bank` mounts only — **not** on `/admin/bank`) | Creates a bank account. `acctName` is looked up from the user record, not taken from the body. `isActive` hardcoded `true` on creation — no verification gate before a bank account can receive a payout. |
| `PUT /bank/edit/:id` | verifyUser | Updates `bankName`/`acctName`/`acctNumber` (whitelisted). **Gotcha:** `:id` here is the *bank document's* id, not the caller's user id — `verifyUser`'s ownership check compares against `undefined` and fails for every non-admin. **In practice only admins can call this successfully**; a partner cannot edit their own bank details through this route today. |
| `DELETE /bank/:id` | verifyUser | Same `:id`-mismatch gotcha as above — effectively admin-only. The controller itself does **zero** ownership check before deleting, so if a non-admin ever did get through, there'd be no second line of defense. |
| `GET /bank/:userId` | verifyUser | Correctly scoped (`:userId` matches the JWT). Returns all bank accounts for that user. |
| `GET /bank/` | verifyAdmin | Every bank record, system-wide, no pagination. |
| `PUT /bank/:userId/:bankId` | verifyUser (correctly scoped to `:userId`) | **⚠️ IDOR:** updates `bankId` with `$set: req.body` verbatim — no check that `bankId` actually belongs to `userId`, and no field whitelist. Since `verifyUser` only validates the caller's own id against the `:userId` segment (which the caller controls), **any authenticated partner can pass a `bankId` belonging to a different user and overwrite it** — including redirecting someone else's payout account. This needs a `Bank.findOne({_id: bankId, user_id: userId})` guard and a field whitelist before it's safe. Flag this prominently to whoever owns payments security. |

### 3.15 Withdrawals

`routes/withdraw.js` → `controllers/bank.js` (model `Withdraw.js`). Mounted at **`/withdraw`**, **`/partner/withdraw`** (both `verifyPartner`-wrapped), **`/admin/withdraw`** (no wrapper, same caveat as bank routes). State: `pending` (default) → `approved`/`rejected` → `sent`, with no code-level enforcement of valid transitions.

| Method & Path | Auth | What it does |
|---|---|---|
| `POST /withdraw/:userId` | verifyPartner (mount) + verifyUser (route) | Creates a payout request. Correctly hardcodes `user_id` from the JWT (ignores the `:userId` param for ownership — good). **⚠️ But `amount`, `bankName`, `acctName`, `acctNumber` are all taken from the client body with zero server-side validation** — nothing checks `amount` against the partner's actual computed balance (see §3.18), and nothing cross-checks the bank details against a verified `Bank` record the partner owns. This is the single biggest "trusting client input" concern in the whole API — flag it before this handles real payout volume. Notifies finance-role admins in real time. |
| `PUT /withdraw/edit/:id` | verifyUser | Updates status (`approved`/`rejected`/`sent`) + sends notifications. Same `:id`-mismatch gotcha as bank routes — effectively admin-only, which happens to match intent here, but also means a partner can never cancel their own pending request through this route. `$set: req.body` applies the whole body, not just `status` — no schema-level state-machine guard. |
| `DELETE /withdraw/:id` | verifyUser | Same mismatch — admin-only in practice, no ownership check in the controller either. |
| `GET /withdraw/show/:id` | verifyUser | Fetch one by id (again, effectively admin-only via the same param mismatch). Returns `null` rather than 404 if missing. |
| `GET /withdraw/:userId` | verifyUser (correctly scoped) | All withdrawal requests for a given user. |
| `GET /withdraw/` | verifyAdmin | Every withdrawal, system-wide, no pagination/filter. |

### 3.16 Wallet

`routes/wallet.js` → `controllers/commerce.js` (model `Wallet.js`). Mounted at **`/wallet`** and **`/partner/wallet`** (only the latter adds `verifyPartner`).

| Method & Path | Auth | What it does |
|---|---|---|
| `GET /wallet` | verifyToken | The caller's own wallet — self-scoped via JWT, no path param, no IDOR risk. Returns `{ balance, transactions[] }`; synthesizes `{balance:0, transactions:[]}` if no document exists yet rather than creating one. |

**Know before you build on this:** the wallet is currently **credit-only** — the sole credit path is the referral-conversion flow below (+₦500/conversion). **There is no endpoint anywhere that debits or cashes out a wallet balance.** It's informational today, and it's a completely separate ledger from the ticket-sales balance computed in the analytics endpoints (§3.18) — the two "balance" concepts never interact.

### 3.17 Referrals

`routes/referral.js` → `controllers/commerce.js` (model `Referral.js`). Mounted at **`/referral`**.

> Note: this is a **separate system** from the user/affiliate referral codes generated at signup (`utils/referralCode.js`, used by `auth.js`/`users.js`/`admin.js`). Event-level referral codes here are generated inline as `'ref_' + Math.random().toString(36).substr(2, 8)` with no collision-retry against the unique index — two unrelated features that happen to share the word "referral."

| Method & Path | Auth | What it does |
|---|---|---|
| `GET /referral/:eventId` | verifyToken | Gets-or-creates the caller's shareable referral code for an event. Self-scoped (`referrer_id` from JWT), unique per `(referrer_id, event_id)`. |
| `POST /referral/apply` | verifyToken | Applies a code to a ticket purchase, crediting the referrer's wallet ₦500. |

**⚠️ Flag this one loudly:** `POST /referral/apply` has **no check that the caller actually owns `ticketId`**, and **no idempotency guard** — nothing on the `Audience` schema records that a referral was already applied to a ticket. The same `(ticketId, code)` pair can be resubmitted any number of times, and **every call credits another ₦500** via `$inc`. This is a real, exploitable financial bug — an attacker who knows any valid ticket id for an event (their own, or one they've merely seen a reference to) and that event's referral code can loop this endpoint to mint unlimited wallet credit for the referrer. Needs a uniqueness constraint (e.g. a `referralApplied` flag on the ticket, or a unique index on `(ticketId)` in a redemption-tracking collection) before this is safe at any real traffic volume.

### 3.18 Analytics (Partner Dashboard)

`routes/analytics.js` → `controllers/analytics.js`. Mounted at **`/`** (no prefix, no mount-level guard — every route relies solely on its own declared middleware).

| Method & Path | Auth | What it does |
|---|---|---|
| `GET /partner/:userId/revenue` | verifyToken (⚠️ **no ownership check** — any logged-in user can view any organizer's revenue by guessing/knowing their id) | Computes `availableBalance` = ticket revenue minus pending/approved/sent withdrawals. **Business-logic bug:** `totalRevenue` sums `Audience.amount`, which per §3.9 already includes the 5% platform fee the buyer was charged — so the computed `availableBalance` includes the platform's own cut. The fee is never actually subtracted anywhere in this calculation. Worth fixing (e.g. divide by 1.05, or store organizer-net separately at ticket-creation time) before organizers start withdrawing based on this number. |
| `GET /events/:id/analytics` | verifyToken (⚠️ no organizer-ownership check) | Revenue, tickets sold, check-in rate, daily sales, per-tier breakdown for one event. |
| `GET /partner/:userId/analytics` | verifyToken (⚠️ no ownership check) | Lifetime revenue/tickets/followers/monthly trend/top-5-events for a partner. Same platform-fee-inclusion caveat as `/revenue` applies to every revenue figure here too. |
| `GET /events/:id/checkin-stats` | verifyToken (⚠️ no ownership check) | Real-time check-in totals, per-tier, and by method (`face`/`qr`/`manual`) for the door/gate view. Lower sensitivity (no money figures) but still exposes attendance data to any logged-in user for any event. |

**Pattern across this whole controller:** none of the four routes check that the caller is the event/partner's actual owner or an admin — every one of them should probably be `verifyPartner` + an ownership comparison (or `verifyAdmin` for cross-account access). Worth a dedicated pass before relying on these dashboards being private to the organizer they describe.

### 3.19 Paystack Payment Verification

`routes/paystackVerify.js` → `controllers/commerce.js`. Mounted at **`/paystack`**.

Two independent confirmation paths exist — a client-initiated verify call, and a Paystack-initiated webhook. **Neither creates the ticket itself** — that only happens via `POST /audience/:userId/:eventId` (§3.9), which requires the client to already have a `reference` for paid tiers. Realistic flow: client charges via Paystack → calls `POST /paystack/verify/:reference` to confirm → calls the ticket-creation endpoint with that same reference.

| Method & Path | Auth | What it does |
|---|---|---|
| `POST /paystack/verify/:reference` | verifyToken (deliberately, "to prevent reference enumeration" per an in-code comment) | Calls Paystack's server-to-server verify endpoint, relays `{status, amount, paid_at, charged}`. `409` if a ticket already exists for that reference (idempotency guard). Read-only against Paystack — never mutates ticket state itself; the actual amount charged to the ticket is independently re-derived server-side in `createAudience`, not trusted from this call. |
| `POST /paystack/webhook` | none (JWT) — authenticity via HMAC signature instead | Validates `x-paystack-signature` via HMAC-SHA512 (keyed with `PAYSTACK_SECRET_KEY`) using `crypto.timingSafeEqual` (constant-time — good practice). **Caveat:** the signature is computed over `JSON.stringify(req.body)` (parsed-then-reserialized), not the raw request bytes — if key ordering/whitespace ever diverges from what Paystack originally sent, a legitimate signature could fail to match. Worth confirming the raw body is preserved, or switching to verifying against it directly. **Currently a stub beyond signature validation** — for `charge.success` it only does a fire-and-forget existence check and leaves a `// this can be used to trigger recovery logic` comment; no actual reconciliation/ticket-creation-on-behalf-of-a-dropped-client-flow is implemented yet, and no other event types (`charge.failed`, refunds) are handled at all. |

### 3.20 Alerts ("Notify Me")

`routes/alert.js` → `createAlert` in `controllers/commerce.js` (model `Alert.js`). Mounted at **`/alerts`**.

| Method & Path | Auth | What it does |
|---|---|---|
| `POST /alerts` | verifyToken | Creates/upserts a "notify me" preference for `{ type: 'artist'|'organizer'|'category', value }`. Idempotent via a unique `(user_id, type, value)` index. |

**Notes:** there is no `GET`/`DELETE` for alerts yet — a user can create one but can't list or remove it via the API. The `triggered` boolean on the model is a placeholder — **nothing in the codebase currently sets it**; there's no job that scans new events against existing alerts. (This is unrelated to the "new event from a followed organizer" email flow, which uses the `Follow` model instead, triggered from `event.js`'s publish/update handlers.)

### 3.21 Comments

`routes/comment.js` → `controllers/social.js` (model `Comment.js`). Mounted at **`/events`**.

| Method & Path | Auth | What it does |
|---|---|---|
| `POST /events/:id/comments` | verifyToken | Posts a comment (max 500 chars, schema-enforced). No synchronous moderation — visible immediately. |
| `GET /events/:id/comments` | none | Paginated, pinned-first-then-newest. Excludes soft-deleted comments. Bulk-loads commenter name/avatar to avoid N+1. |

### 3.22 Comment Actions

`routes/commentActions.js` → `controllers/social.js`. Mounted at **`/comments`**.

| Method & Path | Auth | What it does |
|---|---|---|
| `DELETE /comments/:id` | verifyToken | Soft-deletes (`isDeleted: true`, never physically removed). Allowed for the comment's author, any admin, **or any partner** — note this means any partner can delete any comment on any event, not just their own. |
| `POST /comments/:id/pin` | verifyToken (organizer-only, checked manually against `event.planner_id`) | Pins a comment to the top; unpins any other currently-pinned comment for that event first (only one pin per event). |
| `POST /comments/:id/report` | verifyToken | Increments `reportCount`. No dedupe (same user can report the same comment repeatedly) and no auto-hide threshold — a human has to act on a high count via the delete route. |

### 3.23 Follows (Organizers)

`routes/follow.js` → `controllers/social.js` (model `Follow.js`). Mounted at **`/organizers`**.

| Method & Path | Auth | What it does |
|---|---|---|
| `GET /organizers/following` | verifyToken | Every organizer the caller follows (name/image/isPartner/isVerify only). No pagination. Registered ahead of `/:id/...` so `following` is never mistaken for an id. |
| `GET /organizers/:id/follow/status` | optionalAuth | Follower count + (if authenticated) whether the caller follows them. |
| `GET /organizers/:id/stats` | none | `{ followerCount, eventCount, totalTicketsSold }` — the sold total includes cancelled events' `sold` figures. |
| `POST /organizers/:id/follow` | verifyToken | Toggles follow/unfollow. Self-follow blocked (`400`). Uniqueness enforced by a compound index on `(follower_id, organizer_id)`. |

### 3.24 Likes / Saved Events

`routes/like.js` → `controllers/social.js` (model `EventLike.js`). Mounted at **`/events`**, registered **before** `eventRouter` (so `/events/saved` isn't captured by the `/:id` wildcard).

| Method & Path | Auth | What it does |
|---|---|---|
| `GET /events/saved` | verifyToken | The caller's liked/saved events (full `Event` docs). No pagination. |
| `GET /events/:id/like/status` | optionalAuth | Like count + (if authenticated) whether the caller liked it. |
| `POST /events/:id/like` | verifyToken | Toggles like/unlike. Unique `(user_id, event_id)` index. |

### 3.25 Notifications

`routes/notification.js` → `controllers/notification.js` (models `Notification.js`, `WebPushSubscription.js`). Mounted at **both `/notifications` and `/notification`** (same router — the singular form exists for backward compatibility with older clients; prefer the plural form for new code).

| Method & Path | Auth | What it does |
|---|---|---|
| `GET /notifications` | verifyToken | Paginated, newest-first, `?unread=true` filter, includes `unreadCount`. Documents auto-expire after 90 days via a MongoDB TTL index — old ones are deleted by Mongo itself, not app code. |
| `PUT /notifications/read-all` | verifyToken | Bulk marks everything read, then broadcasts `emitAllNotificationsRead` + a zeroed `emitUnreadCountUpdate` over Socket.io so other open tabs sync instantly. |
| `PUT /notifications/:id/read` | verifyToken | Marks one as read, scoped to `{_id, user_id}` (another user's notification id just 404s, not 403 — the query simply won't match). Emits real-time badge updates. |
| `POST /notifications/web-push/subscribe` | verifyToken | Saves/upserts a browser Web Push subscription on `(user_id, endpoint)`. |
| `DELETE /notifications/web-push/unsubscribe` | verifyToken | Removes a subscription by endpoint. No-op success if none matched. |

**Internal plumbing worth knowing about (not routes, but used everywhere):** `createNotification(...)` is the shared helper other controllers call to fan a notification out three ways — Socket.io (if the user has a live connection), Web Push (VAPID-based, silently no-ops if `VAPID_PUBLIC_KEY` isn't configured; 410 responses auto-delete the stale subscription), and the DB record itself. `notifyAdmins(...)` does the same for admins filtered by role.

### 3.26 Push Tokens (Mobile)

`routes/pushToken.js` → `controllers/pushToken.js` (model `PushToken.js`). Mounted at **`/push-tokens`**. The mobile/FCM equivalent of the web-push routes above (used by the Expo app, not the browser).

| Method & Path | Auth | What it does |
|---|---|---|
| `POST /push-tokens` | verifyUser (no `:id` param on this route, so this behaves like a plain "must be logged in" check — the ownership branch never applies) | Registers/updates a device token. Upserted by `token` alone (globally unique) — if the same physical token later shows up under a different logged-in user, the row's `user_id` is silently overwritten. |
| `DELETE /push-tokens` | verifyUser (same note) | Deactivates (soft — `active:false`, not deleted) a token, scoped to `{token, user_id}` so you can't deactivate someone else's. |

### 3.27 Testimonials

`routes/testimonial.js` → `controllers/testimonial.js` (model `Testimonials.js`). Mounted at **`/testimonials`**.

| Method & Path | Auth | What it does |
|---|---|---|
| `POST /testimonials` | verifyAdmin | Creates a testimonial directly from the body — admin-authored content, no public submission flow exists. |
| `DELETE /testimonials/:id` | verifyAdmin | Hard delete (unlike comments' soft-delete pattern). No existence check — deleting a nonexistent id still returns `200`. |
| `GET /testimonials/:id` | none | Single testimonial by id, regardless of `isApproved` — no approval filter on this one route (only matters if ids are guessable/exposed). |
| `GET /testimonials` | none | List, sorted by `sortOrder` then newest. Only `isApproved: true` by default; `?all=true` bypasses that filter with **no auth gate on the query param itself** — minor content-exposure gap, not security-critical, but inconsistent with the admin-only intent. |

### 3.28 CMS / Site Content

`routes/cms.js`, mounted at **`/cms`**. Backs several independent content types, each with its own controller/model. Every admin-mutation route uses `verifyAdminRole(['moderator'])`.

| Content type | Public read | Admin write |
|---|---|---|
| Marquee ticker (`MarqueeItem.js`) | `GET /cms/marquee` — active + in-window items only, `[{text, pulse, dotColor}]` | `GET .../all`, `POST`, `PUT /:id`, `DELETE /:id` |
| How It Works steps (`HowItWorksStep.js`) | `GET /cms/how-it-works` — active only | `GET .../all`, `POST`, `PUT /:id`, `DELETE /:id` |
| Promo banners (`PromoBanner.js`) | `GET /cms/banners` (optional `?key=` for a specific slot) | `GET .../all`, `POST`, `PUT /:id`, `DELETE /:id` |
| FAQ (`FaqItem.js`) | `GET /cms/faqs` — active only, sorted | `GET .../all`, `POST`, `PUT /:id`, `DELETE /:id` |
| Legal docs (`LegalDocument.js`) | `GET /cms/legal/:docType` (`terms`/`privacy` only; `400` for anything else, `null` not 404 if never created) | `PUT /cms/legal/:docType` (upsert) |
| Static pages (`PageContent.js`) | `GET /cms/pages/:key` (currently only `about`; only if `isPublished`) | `PUT /cms/pages/:key` (upsert) |
| Curated homepage sections (`CuratedSection.js`) | `GET /cms/curated-sections/:key` | `PUT /cms/curated-sections/:key` (upsert) |

Note: `controllers/siteConfig.js`/`models/SiteConfig.js` exist but are **not** wired into `routes/cms.js` — see `GET /config/site` below instead, which is a different route file entirely.

### 3.29 Site Config

`routes/config.js`. Mounted at **`/config`**.

| Method & Path | Auth | What it does |
|---|---|---|
| `GET /config/seasonal` | none | Computed (not persisted) "Detty December" seasonal banner flag — purely a `new Date().getMonth()` check for Nov/Dec/Jan, no DB involved, no way to toggle without a code change. |
| `GET /config/site` | none | Public-safe subset of the `SiteConfig` singleton (support email, hero copy/stats) via an explicit `.select()` allowlist. Falls back to a hardcoded default object if no document exists yet, rather than erroring. No `PUT`/`PATCH` exists in this file for editing it — that happens via `/api/admin/settings` (§3.5) instead, which edits the same underlying `SiteConfig` collection. |

### 3.30 Promotions (Promo Codes)

`routes/promos.js` → `controllers/promos.js`. Mounted at **`/`** (root — the paths below are the final paths, no extra prefix). Promo codes live as an embedded `promos[]` array directly on the `Event` document, not a separate collection.

| Method & Path | Auth | What it does |
|---|---|---|
| `POST /promo/validate` | none | Validates a code for an event at checkout time — returns the discount but does **not** redeem/increment usage itself. All invalid states (expired/inactive/over-cap/not-found) return the same generic message, deliberately not leaking which condition failed. |
| `POST /events/:id/promos` | verifyToken (⚠️ **no event-ownership check** — any logged-in user can add a promo to any event id) | Creates a promo code (`code`, `discountType`, `discountValue`, `maxUses`, `expiresAt`). `409` if the code already exists on that event. |
| `GET /events/:id/promos` | verifyToken | Lists an event's promo codes. |
| `PUT /events/:id/promos/:code` | verifyToken (⚠️ same no-ownership-check gap) | Updates discount/cap/expiry/active flag. |
| `DELETE /events/:id/promos/:code` | verifyToken (⚠️ same gap) | Removes a code. |

**Flag this section too:** unlike the equivalent ticket-tier and event-update endpoints (which check `event.planner_id` against the caller), none of the promo-mutation routes verify the caller actually owns the target event. Any logged-in user can currently create/edit/delete promo codes on any event by id.

---

## 4. Known Gaps & Things To Fix First

If you're picking this codebase up fresh, these are the items worth triaging before you build much on top of the affected areas — roughly in order of how much they matter:

1. **Referral double-credit (`POST /referral/apply`, §3.17)** — no ownership check, no idempotency guard. Repeated calls mint unlimited ₦500 wallet credits. Financial abuse risk.
2. **Bank account IDOR (`PUT /bank/:userId/:bankId`, §3.14)** — any partner can overwrite any other user's bank record by id, including redirecting their payout destination.
3. **Withdrawal amounts are unvalidated (`POST /withdraw/:userId`, §3.15)** — no check against actual earned balance, no cross-check against a verified `Bank` record.
4. **Analytics endpoints have no ownership check (§3.18)** — any logged-in user can view any organizer's revenue/analytics by id, and the revenue figure itself incorrectly includes the platform's 5% fee.
5. **Promo code mutation has no event-ownership check (§3.30)** — anyone can edit anyone's promo codes.
6. **`/face/verify` isn't partner-scoped (§3.10)** — any logged-in user can trigger a face check-in against any event, and matching itself is currently mocked (non-functional as a security control until KBY-AI integration lands).
7. **A handful of `verifyUser` routes have no `:id`-shaped param** (`/auth/change-password`, `/auth/verify/:email`, `PUT/DELETE /bank/...`, `PUT/DELETE /withdraw/edit|show/:id`, `POST/DELETE /push-tokens`) — these silently degrade to admin-only (or, for push tokens, plain "logged in") rather than behaving like the self-service endpoints their names imply. Worth an audit pass to either fix the middleware usage or confirm the current behavior is intentional.
8. **Several `/admin/*`-prefixed mounts carry no actual admin guard** (`/admin/bank`, `/admin/withdraw` — only whatever the route itself declares applies). Don't assume the `/admin/` prefix means admin-only; check the per-route auth column above.
9. **Paystack webhook is a stub** (§3.19) — signature validation works, but there's no reconciliation logic yet for a payment that succeeds on Paystack's side but never gets a corresponding ticket created client-side.
10. **Three RBAC admin endpoints are intentionally unimplemented stubs** (`GET /api/admin/analytics/revenue`, `PATCH /api/admin/settings/feature-flags`, `GET /api/admin/audit-log`) — they return `501` on purpose, not a bug, just not built yet.
