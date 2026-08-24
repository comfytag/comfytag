# ComfyTag Backend — Current State Documentation

**Purpose:** This document is a factual snapshot of the ComfyTag Express/Mongoose API (`apps/api/`) as it exists today, produced to support a "rework" planning exercise. It is pure documentation — nothing in the codebase was changed to produce it. It covers every route, controller, model, middleware, utility, third-party integration, and environment variable in the API, plus an "Observations & Risks" section flagging tech debt and security concerns for the advisory team to triage (flagged, not fixed).

Repo root: `c:\Users\HOMEPC\Desktop\Web_Projects\Personal\comfytag`
API root: `apps/api/` — Express 4.18 (ES modules), Mongoose 6.7, MongoDB, Node 20, port 4002 (`apps/api/config.js:17`).

---

## 1. API Route Inventory

The Express app (`apps/api/app.js`) mounts the same route files under **three different prefixes** for three different frontends (public/attendee, `/partner/*`, and legacy `/admin/*` + newer `/api/admin/*`). This means most controllers are reachable from multiple paths with different auth middleware applied at the mount point. See `apps/api/app.js:105-190` for every `app.use(...)` mount.

Auth middleware used below (defined in `apps/api/utils/verifyToken.js` and `apps/api/utils/verifyAdminRole.js`):
- **none** — fully public
- **optionalAuth** — public, but personalizes response if a valid token is present
- **verifyToken** — any authenticated user (valid JWT)
- **verifyUser** — authenticated AND ( `req.user._id/id` matches `:id`/`:userId`/`:uid` route param OR `req.user.isAdmin` )
- **verifyAdmin** — authenticated AND `req.user.isAdmin === true`
- **verifyPartner** — authenticated AND ( `req.user.isPartner` OR `req.user.isAdmin` )
- **verifyAdminRole([roles])** — authenticated AND `req.user.isAdmin` AND ( role in `[roles]` OR role === `super_admin` )

### 1.1 `routes/auth.js` — mounted at `/auth`, `/admin/auth`, `/partner/auth`
| Method | Path | Controller fn | Auth | Notes |
|---|---|---|---|---|
| POST | `/register` | `register` | none | rate-limited only via shared limiter below on other routes; this one is NOT rate-limited |
| POST | `/register-partner` | `register` (via wrapper forcing `isPartner=true`) | none | |
| POST | `/login` | `login` | none | `authLimiter`: 10 req / 15 min per IP |
| POST | `/google-signin` | `googleSignIn` | none | |
| GET | `/me` | `getMe` | verifyToken | |
| GET | `/:id/verify/:token/` | `verifyEmail` | none | legacy link-based verify |
| PUT | `/:id/verifykyc/:kyc/` | `verifyID` | verifyAdmin | legacy KYC approve/reject path |
| POST | `/resend-verification` | `sendVerifyEmail` | none | `authLimiter` |
| GET | `/verify/:email/` | `sendVerifyEmail` | verifyUser | |
| PUT | `/register-organizer/:userId` | `registerAsOrganizer` | verifyUser | |
| POST | `/verify-email-otp` | `verifyEmailOTP` | none | `authLimiter`; also doubles as passwordless login |
| POST | `/request-otp` | `requestLoginOtp` | none | `authLimiter` |
| POST | `/forgot-password` | `forgotPassword` | none | `authLimiter` |
| POST | `/verify-otp` | `verifyOtp` | none | `authLimiter` |
| POST | `/reset-password` | `resetPassword` | none | not rate-limited |
| POST | `/change-password` | `changePassword` | verifyUser | |

### 1.2 `routes/event.js` — mounted at `/event`, `/events`, `/admin/event`, `/partner/event` (partner mount also wrapped with `verifyPartner`)
| Method | Path | Controller fn | Auth | Notes |
|---|---|---|---|---|
| GET | `/feed` | `getEventFeed` | none | |
| GET | `/nearby` | `getEventsByState` | none | |
| GET | `/categories` | `getEventCategories` | none | |
| GET | `/category-counts` | `getCategoryCounts` | none | |
| GET | `/states` | `getEventStates` | none | |
| GET | `/category/byCategory` | `eventsByCategory` | none | |
| GET | `/filter/byType` | `eventsByFilter` | none | |
| GET | `/filter/single` | `eventsBySingleFilter` | none | |
| GET | `/pick/toppick` | `eventsByPick` | none | |
| GET | `/pick/sold` | `eventsBySales` | none | |
| GET | `/state/byState` | `eventsByState` | none | |
| GET | `/payment/byPayment` | `eventsByPayment` | none | |
| GET | `/user/:userId` | `getPlannerEvents` | none | returns ALL of a planner's events incl. drafts, publicly |
| POST | `/:userId` | `createEvent` | verifyUser | `:userId` unused for auth — ownership derived from JWT |
| GET | `/:id/activity` | `getEventActivity` | verifyToken | ownership checked in controller |
| GET | `/:id/tiers/stats` | `getTicketTierStats` | none | |
| PUT | `/:id/tiers/:tierId` | `updateTicketTier` | verifyToken | ownership checked in controller |
| DELETE | `/:id/tiers/:tierId` | `deleteTicketTier` | verifyToken | ownership checked in controller |
| POST | `/:id/publish` | `publishEvent` | verifyToken | ownership checked in controller |
| POST | `/:id/cancel` | `cancelEvent` | verifyToken | ownership checked in controller |
| PUT | `/:id` | `updateEvent` | verifyToken | ownership checked in controller |
| PATCH | `/:id` | `updateEvent` | verifyToken | ownership checked in controller |
| DELETE | `/:id` | `deleteEvent` | verifyToken | ownership checked in controller |
| GET | `/:id` | `getEvent` | none | looks up by slug first, then `_id` |
| GET | `/` | `getAllEvents` | none | |

### 1.3 `routes/eventSearch.js` — mounted at `/events`
| GET | `/search` | `searchEvents` (commerce.js) | none |

### 1.4 `routes/team.js` — mounted at `/events`, `/partner/event` (with `verifyPartner`)
| Method | Path | Controller fn | Auth |
|---|---|---|---|
| GET | `/:id/team` | `listTeam` | verifyPartner |
| POST | `/:id/team` | `addTeamMember` | verifyPartner |
| DELETE | `/:id/team/:userId` | `removeTeamMember` | verifyPartner |

### 1.5 `routes/like.js` — mounted at `/events`
| GET | `/saved` | `getSavedEvents` | verifyToken |
| GET | `/:id/like/status` | `getLikeStatus` | optionalAuth |
| POST | `/:id/like` | `toggleLike` | verifyToken |

### 1.6 `routes/comment.js` — mounted at `/events`
| POST | `/:id/comments` | `postComment` (social.js) | verifyToken |
| GET | `/:id/comments` | `getComments` (social.js) | none |

### 1.7 `routes/commentActions.js` — mounted at `/comments`
| DELETE | `/:id` | `deleteComment` | verifyToken |
| POST | `/:id/pin` | `pinComment` | verifyToken |
| POST | `/:id/report` | `reportComment` | verifyToken |

### 1.8 `routes/follow.js` — mounted at `/organizers`
| GET | `/following` | `getMyFollowing` | verifyToken |
| GET | `/:id/follow/status` | `getFollowStatus` | optionalAuth |
| GET | `/:id/stats` | `getOrganizerStats` | none |
| POST | `/:id/follow` | `toggleFollow` | verifyToken |

### 1.9 `routes/category.js` — mounted at `/category`, `/categories`, `/admin/category`, `/partner/category`
| POST | `/` | `createCategory` | verifyAdmin |
| PUT | `/:id` | `updateCategory` | verifyAdmin |
| DELETE | `/:id` | `deleteCategory` | verifyAdmin |
| GET | `/:id` | `getCategory` | none |
| GET | `/` | `getAllCategories` | none |

### 1.10 `routes/audience.js` — mounted at `/audience`, `/admin/audience`, `/partner/audience` (with `verifyPartner`)
| Method | Path | Controller fn | Auth | Notes |
|---|---|---|---|---|
| POST | `/free/:eventId` | `createFreeAudience` | none | free-ticket claim, no auth |
| POST | `/checkin-by-ref` | `checkInByReference` | verifyPartner | ownership re-checked in controller |
| POST | `/:id/checkin` | `manualCheckIn` | verifyPartner | ownership re-checked in controller |
| POST | `/:userId/:eventId` | `createAudience` | verifyToken | paid/free ticket purchase |
| GET | `/my` | `getMyTickets` | verifyToken | |
| GET | `/user/:userId` | `getUserAudience` | verifyToken | |
| GET | `/event/:eventId` | `getEventAudience` | verifyPartner | ownership re-checked |
| GET | `/events/:eventId/audience/export` | `exportEventAudienceCSV` | verifyPartner | ownership re-checked |
| GET | `/ref/:reference` | `getAudienceByReference` | none | public ticket preview |
| PUT | `/:id` | `updateAudience` | verifyPartner | ownership re-checked, whitelist fields |
| DELETE | `/:id/:userId` | `deleteAudience` | verifyToken | self/partner/admin checked in controller |
| GET | `/:id` | `getAudience` | verifyToken | self/admin checked in controller |
| GET | `/` | `getAllAudience` | verifyAdmin | |

### 1.11 `routes/bank.js` — mounted at `/bank` (with `verifyPartner` at app.js), `/admin/bank`, `/partner/bank` (with `verifyPartner`)
| POST | `/:userId` | `createBank` | verifyUser |
| PUT | `/edit/:id` | `updateBank` | verifyUser |
| DELETE | `/:id` | `deleteBank` | verifyToken (ownership checked in controller) |
| GET | `/list` | `getBankList` | none |
| GET | `/:userId` | `getBank` | verifyUser |
| GET | `/` | `getAllBanks` | verifyAdmin |
| PUT | `/:userId/:bankId` | `updateBankStatus` | verifyUser |

### 1.12 `routes/withdraw.js` — mounted at `/withdraw` (with `verifyPartner` at app.js), `/partner/withdraw` (with `verifyPartner`)
| POST | `/:userId` | `createWithdraw` | verifyUser |
| PUT | `/edit/:id` | `updateWithdraw` | verifyUser |
| DELETE | `/:id` | `deleteWithdraw` | verifyUser |
| GET | `/show/:id` | `getWithdraw` | verifyUser |
| GET | `/:userId` | `getUserWithdraw` | verifyUser |
| GET | `/` | `getAllWithdraws` | verifyAdmin |

### 1.13 `routes/face.js` — mounted at `/face`
| POST | `/enroll/:userId` | `enrollFace` | verifyUser |
| POST | `/verify` | `verifyFace` | verifyToken |
| DELETE | `/remove/:userId` | `removeFace` | verifyUser |

### 1.14 `routes/transfer.js` — mounted at `/tickets/transfer`
| POST | `/initiate` | `initiateTransfer` | verifyToken |
| POST | `/accept` | `acceptTransfer` | verifyToken |
| POST | `/decline` | `declineTransfer` | verifyToken |
| POST | `/claim` | `claimTicket` | verifyToken |
| GET | `/incoming` | `getIncomingTransfers` | verifyToken |

### 1.15 `routes/notification.js` — mounted at `/notifications`, `/notification`
| GET | `/` | `getNotifications` | verifyToken |
| PUT | `/read-all` | `markAllAsRead` | verifyToken |
| PUT | `/:id/read` | `markAsRead` | verifyToken |
| POST | `/web-push/subscribe` | `subscribePush` | verifyToken |
| DELETE | `/web-push/unsubscribe` | `unsubscribePush` | verifyToken |

### 1.16 `routes/pushToken.js` — mounted at `/push-tokens`
| POST | `/` | `registerPushToken` | verifyToken |
| DELETE | `/` | `deregisterPushToken` | verifyToken |

### 1.17 `routes/search.js` — mounted at `/search`
| GET | `/suggestions` | `getSearchSuggestions` (commerce.js) | none |
| GET | `/trending` | `getTrending` (commerce.js) | none |

### 1.18 `routes/alert.js` — mounted at `/alerts`
| POST | `/` | `createAlert` (commerce.js) | verifyToken |

### 1.19 `routes/referral.js` — mounted at `/referral`
| POST | `/apply` | `applyReferral` (commerce.js) | verifyToken |
| GET | `/:eventId` | `getReferralCode` (commerce.js) | verifyToken |

### 1.20 `routes/wallet.js` — mounted at `/wallet`, `/partner/wallet` (with `verifyPartner`)
| GET | `/` | `getWallet` (commerce.js) | verifyToken |

### 1.21 `routes/ticketToken.js` — mounted at `/tickets`
| GET | `/:id/token` | `getTicketToken` (commerce.js) | verifyToken |
| GET | `/:id/status` | `getTicketStatus` (commerce.js, SSE) | verifyToken |

### 1.22 `routes/config.js` — mounted at `/config`
| GET | `/seasonal` | `getSeasonalConfig` (commerce.js) | none |
| GET | `/site` | `getPublicSiteConfig` (siteConfig.js) | none |

### 1.23 `routes/cms.js` — mounted at `/cms`
Aggregates 6 sub-resources (marquee, how-it-works, banners, faqs, legal, pages, curated-sections). Public GET for the "active" view; `verifyAdminRole(['moderator'])` for the "all" view and all writes.
| Method | Path | Controller | Auth |
|---|---|---|---|
| GET | `/marquee/all` | `getAllMarqueeItems` | verifyAdminRole(['moderator']) |
| GET | `/marquee` | `getActiveMarqueeItems` | none |
| POST/PUT/DELETE | `/marquee[/:id]` | marquee CRUD | verifyAdminRole(['moderator']) |
| GET | `/how-it-works/all` | `getAllSteps` | verifyAdminRole(['moderator']) |
| GET | `/how-it-works` | `getActiveSteps` | none |
| POST/PUT/DELETE | `/how-it-works[/:id]` | steps CRUD | verifyAdminRole(['moderator']) |
| GET | `/banners/all` | `getAllBanners` | verifyAdminRole(['moderator']) |
| GET | `/banners` | `getActiveBanners` | none |
| POST/PUT/DELETE | `/banners[/:id]` | banners CRUD | verifyAdminRole(['moderator']) |
| GET | `/faqs/all` | `getAllFaqs` | verifyAdminRole(['moderator']) |
| GET | `/faqs` | `getActiveFaqs` | none |
| POST/PUT/DELETE | `/faqs[/:id]` | FAQ CRUD | verifyAdminRole(['moderator']) |
| GET | `/legal/:docType` | `getLegalDocument` | none |
| PUT | `/legal/:docType` | `upsertLegalDocument` | verifyAdminRole(['moderator']) |
| GET | `/pages/:key` | `getPageContent` | none |
| PUT | `/pages/:key` | `upsertPageContent` | verifyAdminRole(['moderator']) |
| GET | `/curated-sections/:key` | `getCuratedSection` | none |
| PUT | `/curated-sections/:key` | `upsertCuratedSection` | verifyAdminRole(['moderator']) |

### 1.24 `routes/paystackVerify.js` — mounted at `/paystack`
| POST | `/verify/:reference` | `verifyPaystackPayment` | verifyToken |
| POST | `/webhook` | `handlePaystackWebhook` | none (HMAC-SHA512 signature validated in controller) |

### 1.25 `routes/testimonial.js` — mounted at `/testimonials`
| POST | `/` | `createTestimonial` | verifyAdmin |
| DELETE | `/:id` | `deleteTestimonial` | verifyAdmin |
| GET | `/:id` | `getTestimonial` | none |
| GET | `/` | `getAllTestimonials` | none |

### 1.26 `routes/upload.js` — mounted at `/upload`
| POST | `/` | inline handler (Cloudinary upload) | verifyToken |

### 1.27 `routes/analytics.js` — mounted at `/` (root)
| GET | `/partner/:userId/revenue` | `getPartnerRevenue` | verifyToken |
| GET | `/events/:id/analytics` | `getEventAnalytics` | verifyToken |
| GET | `/partner/:userId/analytics` | `getPartnerAnalytics` | verifyToken |
| GET | `/events/:id/checkin-stats` | `getCheckInStats` | verifyToken |

### 1.28 `routes/promos.js` — mounted at `/` (root)
| POST | `/promo/validate` | `validatePromoCode` | none |
| POST | `/events/:id/promos` | `createPromoCode` | verifyToken |
| GET | `/events/:id/promos` | `getPromoCodesForEvent` | verifyToken |
| PUT | `/events/:id/promos/:code` | `updatePromoCode` | verifyToken |
| DELETE | `/events/:id/promos/:code` | `deletePromoCode` | verifyToken |

### 1.29 `routes/users.js` — mounted at `/users`, `/admin/users`, `/partner/users`
| PUT | `/onboard/:id` | `onboardUser` | verifyUser |
| PUT | `/:id` | `updateUser` | verifyUser |
| PATCH | `/:id` | `updateUser` | verifyUser |
| PUT | `/verify/:id` | `userVerification` | verifyUser |
| PUT | `/isverify/:id` | `isUserVerified` | verifyAdmin |
| PUT | `/:id/kyc` | `uploadKYC` | verifyUser |
| GET | `/:id/stats` | `getUserStats` | none |
| DELETE | `/:id` | `deleteUser` | verifyUser |
| GET | `/:id` | `getUser` | none (public profile) |
| GET | `/` | `getAllUsers` | verifyAdmin |

### 1.30 `routes/partner.js` — mounted at `/partner` (with `verifyPartner` at app.js)
| GET | `/kyc/:userId` | `getKycStatus` | verifyUser (nested under app-level verifyPartner) |

### 1.31 `routes/admin.js` — mounted at `/api/admin`, granular RBAC
40+ endpoints across KYC, user management, payouts, events, analytics, settings, audit/logs, notifications. Every route uses `verifyAdminRole([...])`; empty array `[]` means super_admin-only. Full detail — see file `apps/api/routes/admin.js`. Highlights:
- `POST /kyc/approve`, `/kyc/reject` — `kyc_reviewer`/`finance`
- `GET /kyc/queue`, `/kyc/:userId` — `kyc_reviewer`/`finance`/`support`
- `GET /users`, `/users/:id` — `support`/`moderator`/`finance`
- `POST /users/create-admin` — super_admin only
- `PATCH /users/:id/suspend`, `/restore` — `moderator`/`support`
- `DELETE /users/:id`, `PATCH /users/:id/role` — super_admin only
- `POST /payouts/process`, `/payouts/reject` — `finance`
- `GET /payouts/pending`, `/payouts/:id` — `finance`/`support`
- `GET /events`, `/events/:id` — `moderator`/`support`/`finance`
- `PATCH /events/:id/suspend`, `/restore` — `moderator`
- `DELETE /events/:id` — super_admin only
- `GET /analytics/overview` — `finance`/`support`/`moderator`
- `GET /analytics/revenue` — `finance` (returns HTTP 501, unimplemented)
- `GET /analytics/users` — `support`/`finance`
- `GET/PUT /settings`, `PATCH /settings/feature-flags` — super_admin only (feature-flags returns 501)
- `GET /audit-log` — super_admin only (returns 501, unimplemented — no AuditLog model)
- `GET /face-logs` — super_admin only
- `POST /notifications/broadcast` — `moderator`/`support`

---

## 2. Data Models

All 26 Mongoose model files were copied verbatim into `Rework/schemas/` (same filenames) for direct review. Summaries below.

### 2.1 User (`Rework/schemas/User.js`)
Central account model for attendees, organizers ("partners"), and staff/admins — one collection for all three roles, discriminated by `isPartner`/`isAdmin`/`role`.

| Field | Type | Notes |
|---|---|---|
| username | String | required, unique, lowercase |
| name | String | required |
| email | String | required, lowercase (no unique index at schema level — see risk) |
| businessName | String | lowercase |
| phone | String | |
| password | String | required, bcrypt hash |
| events | [String] | raw string event ids, no `ref` |
| isAdmin | Boolean | default false |
| role | enum | `super_admin, finance, kyc_reviewer, support, moderator, viewer`; default `viewer` |
| suspended | Boolean | default false |
| isPartner | Boolean | default false |
| image, avatar, bgImg | String | |
| address | String | lowercase |
| verify | `{photo, idType, idDocument}` | KYC document URLs |
| isVerify | `{email: Boolean}` | |
| onboarding | `{experience, team, event_per_year, event_turnout, interest[], completed}` | |
| premium | Boolean | default false |
| kycStatus | enum | `unverified, pending, verified, rejected` |
| kycRejectionReason, kycRejectedAt | String/Date | |
| faceEnrolled | Boolean | default false |
| faceTemplate | String | `select: false`; comment says "encrypted", no field-level encryption visible in code |
| faceEnrolledAt, faceEnrollmentDevice | Date/String | `faceEnrollmentDevice` also `select: false` |
| totpSecret | String | `select: false`, for 2FA |
| twoFactorEnabled | Boolean | default false, but login flow checks `user.totpSecret` presence, not this flag (dead field — see risk) |
| emailStatus | enum | `active, BOUNCED, COMPLAINED` |
| notificationPreferences | `{email, sms}` | default true/true |
| privacySettings | `{publicProfile, showInSearch}` | default true/true |
| referralCode | String | unique, sparse |
| referralFallbackCode | String | unique, sparse, no default (left absent until generated) |

Instance method `generateAuthToken()` signs a JWT with `{id, _id, email, isPartner, isAdmin, role}`, `expiresIn: '7d'`. Exports Joi validators `validatRegister` and `validatePasswordReset` from this file (schema file also doubles as a validation module — see risk).

### 2.2 Event (`Rework/schemas/Event.js`)
| Field | Type | Notes |
|---|---|---|
| name | String | required, lowercase |
| planner_id | String | required, no `ref` (raw string, not ObjectId ref) |
| planner | String | required (denormalized organizer name) |
| category, secondaryCategory | String | |
| description | String | required |
| headline | String | maxlength 150 |
| date | Date | |
| ticketType | `[{name, price, capacity, sold}]` | embedded array, default `[]` |
| venue, startTime, endTime | String | |
| table | `[Object]` | untyped |
| ticket_end, event_date | Date | legacy duplicate of `date` (see risk) |
| status | enum | `draft, published, ended, cancelled`; default `draft` |
| pick | Boolean | "top pick" flag |
| images | [String] | |
| address | String | required, lowercase |
| location | String | lowercase |
| state | String | required, lowercase |
| sold | Number | default 0 |
| totalCapacity | Number | auto-computed in `pre('save')` hook from `ticketType[].capacity` |
| videoUrl | String | |
| recapPhotos, gateRules | [String] | |
| featured | Boolean | indexed |
| slug | String | indexed, generated as `slugify(name) + '-' + Date.now().toString(36)` in controller |
| promos | `[{code, discountType, discountValue, maxUses, usedCount, expiresAt, isActive, createdAt}]` | embedded promo codes |

Text index: `{name: 'text', description: 'text', address: 'text'}`. `pre('save')` recomputes `totalCapacity`, but `updateEvent` uses `findByIdAndUpdate` (bypasses this hook) and separately recomputes `totalCapacity` inline — two code paths doing the same calculation (see risk).

### 2.3 Audience (`Rework/schemas/Audience.js`) — the "Ticket" model
| Field | Type | Notes |
|---|---|---|
| name, eventname | String | required |
| event_id, user_id | String | required, no `ref` |
| amount | Number | required |
| isFreeTicket | Boolean | default false |
| numOfTicket | Number | required |
| ticketNumber | Number | default null |
| reference | String | uppercase, unique, sparse |
| type | String | required, lowercase (tier name, lowercased — see event.js risk re: case mismatch) |
| date | Date | default now |
| phone | Number | **typed as Number**, not String (see risk — leading zeros / +234 loss) |
| email | String | lowercase, trim |
| status | enum | `active, used, transferred, refunded, ended, escrow, cancelled` |
| referralRedeemed, referralCreditedAt | Boolean/Date | |
| parentTicketId | ObjectId ref `Audience` | for split/partial transfers |
| qrCode | String | |
| faceOwner, faceLinkedAt | String/Date | |
| transferredTo, transferredFrom, transferredAt | String/Date | |
| transferToken | String | `select: false` |
| checkedIn, checkedInAt, checkedInMethod | Boolean/Date/enum(`face,qr,manual,null`) | |
| totpSecret | String | `select: false`, per-ticket TOTP for live-token display |

No compound index on `{event_id, user_id}` or `{event_id, status}` despite being queried constantly (see risk).

### 2.4 Bank (`Rework/schemas/Bank.js`)
`user_id` (String, required), `bankName`, `bankCode` (nullable), `acctName`, `acctNumber` (all required except bankCode), `recipientCode` (Paystack transfer recipient, nullable until resolved), `isActive`. Model name registered as `"Banks"` (plural) while file/import is `Bank.js` (see risk — naming inconsistency).

### 2.5 Withdraw (`Rework/schemas/Withdraw.js`)
`user_id`, `bankId` (ref `Banks`), `bankName`, `acctName`, `acctNumber`, `eventName`, `amount` (all required except bankId), `status` (enum `pending, approved, processing, sent, failed, rejected`; default `pending`), `transferCode`, `transferReference`, `failureReason`.

### 2.6 Category (`Rework/schemas/Category.js`)
`title` (required, lowercase), `image`, `description`, `slug` (lowercase), `icon` (default 🎵 emoji), `gradient` (default hardcoded hex gradient — inline color, not a token), `isActive`/`isFeatured` (indexed booleans), `sortOrder`/`featuredSortOrder`.

### 2.7 CoOrganizer (`Rework/schemas/CoOrganizer.js`)
`event_id` (ref `Event`), `user_id` (ref `User`, nullable until account exists), `email` (required, lowercase), `permissions` ([String] enum `checkin, analytics, edit, manage_tickets`), `status` (enum `pending, active, removed`), `invitedBy` (ref `User`, required). Unique compound index `{event_id, email}`.

### 2.8 Comment (`Rework/schemas/Comment.js`)
`event_id`, `user_id` (String, indexed, no `ref`), `text` (maxlength 500), `likes`, `isPinned`, `isDeleted` (soft-delete flag), `reportCount`.

### 2.9 CuratedSection (`Rework/schemas/CuratedSection.js`)
`sectionKey` (unique), `title`, `eyebrow`, `isActive`, `maxItems` (1–20, default 8). CMS-managed homepage section config.

### 2.10 EventLike (`Rework/schemas/EventLike.js`)
`user_id`, `event_id` (both String, indexed). Unique compound index `{user_id, event_id}` prevents duplicate likes.

### 2.11 FaqItem (`Rework/schemas/FaqItem.js`)
`question`, `answer` (required), `category`, `sortOrder`, `isActive` (indexed).

### 2.12 Follow (`Rework/schemas/Follow.js`)
`follower_id`, `organizer_id` (String, indexed). Unique compound index prevents duplicate follows.

### 2.13 HowItWorksStep (`Rework/schemas/HowItWorksStep.js`)
`stepNumber`, `title`, `description`, `iconType` (all required), `isComingSoon`, `isActive`, `sortOrder`.

### 2.14 LegalDocument (`Rework/schemas/LegalDocument.js`)
`docType` (enum `terms, privacy`, unique), `lastUpdated` (String, not Date — see risk), `version`, `sections: [{heading, body}]`.

### 2.15 MarqueeItem (`Rework/schemas/MarqueeItem.js`)
`text` (required), `pulse` (Boolean), `dotColor` (enum `red, violet`), `isActive`, `cityTarget`, `sortOrder`, `startsAt`/`expiresAt` (time-windowed display).

### 2.16 Notification (`Rework/schemas/Notification.js`)
`user_id` (String, indexed), `type` (enum, 15 values covering ticket/transfer/payout/KYC/admin events), `title`, `message` (both required), `read` (Boolean, indexed), `data` (Mixed, freeform deep-link payload). Compound index `{user_id, read, createdAt}`; TTL index auto-deletes after 90 days.

### 2.17 PageContent (`Rework/schemas/PageContent.js`)
`pageKey` (enum `['about']` only — single value enum, see risk), `title`, `sections: [{heading, body}]`, `isPublished`.

### 2.18 PromoBanner (`Rework/schemas/PromoBanner.js`)
`bannerKey` (indexed), `title`, `body` (required), `isActive`, `targetPage`, `targetAudience`, `startsAt`/`expiresAt`.

### 2.19 PushToken (`Rework/schemas/PushToken.js`)
Mobile push (FCM-style) tokens: `user_id` (indexed), `token` (unique), `platform` (enum `ios, android`), `deviceId`, `active` (indexed).

### 2.20 Referral (`Rework/schemas/Referral.js`)
`referrer_id` (indexed), `event_id`, `code` (unique), `uses`, `conversions`, `total_credited`. Unique compound index `{referrer_id, event_id}`.

### 2.21 SiteConfig (`Rework/schemas/SiteConfig.js`)
Singleton-style doc (no unique key, code assumes one document via `findOne({})`): `supportEmail`, `heroHeadline`, `heroSubtitle`, `statAttendees`, `statEvents`, `statCities`. Doubles as the admin "platform settings" model (`admin.js` `getSettings`/`updateSettings`), despite the model name/purpose implying only public site copy — no dedicated Settings model exists (see risk).

### 2.22 Testimonials (`Rework/schemas/Testimonials.js`)
`userName`, `quote` (required), `userImage`, `rating` (1–5, default 5), `dateAttended`, `isApproved` (indexed), `isFeatured`, `sortOrder`, plus legacy alias fields `name`/`text` kept for backward compatibility.

### 2.23 Wallet (`Rework/schemas/Wallet.js`)
`user_id` (unique, indexed), `balance` (default 0), `transactions: [{type: credit/debit, amount, reason, referenceId, createdAt}]`. Used for referral-conversion credits (₦500 per redemption).

### 2.24 WebPushSubscription (`Rework/schemas/WebPushSubscription.js`)
`user_id` (indexed), `endpoint` (required), `keys: {p256dh, auth}` (required). Unique compound index `{user_id, endpoint}`.

### 2.25 token (`Rework/schemas/token.js`) — model name `"token"` (lowercase, inconsistent with all other PascalCase model names)
`userId` (ref `User`, required), `token` (required, plaintext for verify-type OTPs, bcrypt-hashed for reset-type — inconsistent handling, see risk), `type` (enum `verify, reset`), `createdAt` (TTL: expires after 3600s / 1 hour). Unique compound index `{userId, type}` — only one outstanding token per (user, purpose).

### 2.26 Alert (`Rework/schemas/Alert.js`)
`user_id` (indexed), `type` (enum `artist, organizer, category`), `value`, `triggered`. Unique compound index `{user_id, type, value}`.

---

## 3. Controllers Deep Dive

### 3.1 `controllers/auth.js`
Largest controller (~1120 lines). Exports: `register`, `verifyEmail`, `login`, `googleSignIn`, `verifyEmailOTP`, `requestLoginOtp`, `sendVerifyEmail`, `verifyID`, `adminLogin` (dead/unused — not wired to any route), `getMe`, `registerAsOrganizer`, `forgotPassword`, `verifyOtp`, `resetPassword`, `changePassword`. See section 8 (Authentication & Authorization Flow) for the full narrative. Key side effects: sends OTP/welcome/KYC emails via `enqueueEmail`/`issueVerifyOtp`, creates in-app notifications, notifies admins on new organizer signups.

Security-relevant details:
- `register` (`auth.js:172`): validates via Joi (`validatRegister`), lowercases nothing on `req.body.email` before the duplicate check inconsistently (uses `req.body.email.toLowerCase()` for lookup but saves `safeBody.email` which is not explicitly lowercased at this call site — relies on schema `lowercase: true` to normalize on save). Retries up to 5 times on `referralCode` collision (E11000).
- `login` (`auth.js:318`): accepts `email` field as either email or username; looks up via `$or`. Requires `isVerify.email` before allowing login (403 if not verified). If `user.totpSecret` is set, requires a `speakeasy` TOTP code with `window: 1` (±30s drift tolerance) as a second factor.
- `verifyEmailOTP` (`auth.js:484`): dual-purpose — verifies email AND can issue a full session token if there's no 2FA. Uses the SAME generic error message for "no such user" and "wrong code" to avoid account enumeration.
- `requestLoginOtp` / `sendVerifyEmail`: deliberately return a generic "if an account exists..." message regardless of whether the account exists, to prevent enumeration.
- `forgotPassword`/`verifyOtp`/`resetPassword`: OTP hashed with bcrypt before storage in the `token` collection (type `reset`); reset flow issues a short-lived (5 min) JWT (`reset_password_allowed: true`) that must be presented to `resetPassword`.
- Password reset/forgot-password lookups explicitly avoid interpolating user input into a `RegExp` (commented "ReDoS risk" — a fix already applied here, worth noting as good practice).
- `verifyID` (`auth.js:625`, legacy KYC endpoint) has a bug: the `$set` object uses `verify == "address" && {...}` — if `verify !== 'photo' && !== 'idcard' && !== 'address'`, the resulting `$set` value is the boolean `false` or the string result of `&&`, not an object, which would silently no-op or throw depending on Mongoose's handling (dead/fragile code path — see risk).
- `adminLogin` exported but never imported by any route file (dead code, and it also signs a JWT with **no expiry and no `role` claim** — a landmine if it's ever wired up).

### 3.2 `controllers/users.js`
`onboardUser`, `updateUser`, `userVerification`, `isUserVerified`, `deleteUser`, `getUser` (public profile), `getUserStats`, `getAllUsers`, `uploadKYC`.
- `updateUser` uses an explicit field whitelist (`allowedFields`) — good practice, prevents mass-assignment/privilege escalation via this endpoint.
- `uploadKYC` accepts `selfie` + `idDocument` via `multer` memory storage, uploads both to Cloudinary, sets `kycStatus: 'pending'`, notifies `kyc_reviewer` admins.
- `getUser` dynamically `import()`s `Event.js` and `Follow.js` inside the request handler rather than importing at module top (unusual pattern — works but adds per-request module-cache lookups; also raises the question of a circular-import workaround, see risk).
- Multiple controllers (`auth.js`, `users.js`) contain duplicated ad-hoc `sanitizeString()` functions stripping corrupted UTF-8 mojibake sequences from `phone`/`avatar` fields — a symptom of a historical data-corruption bug being patched at read-time rather than fixed at the source (see risk; also referenced in root `PROFILE_CORRUPTION_FIX.md`).

### 3.3 `controllers/event.js`
`createEvent`, `updateEvent`, `publishEvent`, `cancelEvent`, `deleteEvent`, `getEvent`, `getAllEvents`, `getPlannerEvents`, `eventsBySingleFilter`, `eventsByState`, `eventsByPick`, `eventsBySales`, `getEventCategories`, `getCategoryCounts`, `getEventStates`, `eventsByFilter`, `updateTicketTier`, `deleteTicketTier`, `getTicketTierStats`, `eventsByPayment`, `eventsByCategory`, `getEventFeed`, `getEventsByState`, `getEventActivity`.
- Ownership consistently derived from JWT (`req.user._id ?? req.user.id`), never trusted from route params — good pattern, applied uniformly across this file.
- `updateEvent` has a large fire-and-forget async block (unbounded IIFE, not awaited) that on `status: 'ended'` sends attendee recap emails + organizer performance report, and on `status: 'published'` notifies + emails all followers in batches of 50. This runs after the HTTP response is already sent; errors are swallowed to a `console.error` only (no retry, no dead-letter queue beyond BullMQ's own retry for the email jobs themselves).
- `eventsByFilter`/`eventsByPayment`/`eventsBySingleFilter` build MongoDB queries using ternary chains keyed off free-text query params (e.g. `type == "today" ? {...} : type == "active" ? {...} : ... : req.query`) — the final fallback branch is `req.query` itself, meaning an unrecognized `filterType` value causes the entire raw query string object to be passed to `Event.find()` (NoSQL injection surface if the client can supply nested `$`-operator objects as query params — see risk).
- `deleteTicketTier` correctly blocks deletion when tickets are already sold for that tier.

### 3.4 `controllers/audience.js` (ticket purchase & check-in)
`createFreeAudience`, `createAudience`, `updateAudience`, `deleteAudience`, `getAudienceByReference`, `getAudience`, `getAllAudience`, `getUserAudience`, `getMyTickets`, `getEventAudience`, `manualCheckIn`, `exportEventAudienceCSV`, `checkInByReference`.
- `createAudience` never trusts client-supplied `amount`/`isFreeTicket` — recomputes `serverAmount` server-side from the tier price (`tier.price * numOfTicket * 1.05`, a 5% platform fee) and re-verifies the Paystack reference server-side via `verifyAndCheckPaystackReference` before minting a ticket. This is a solid anti-fraud pattern.
- Delegates actual ticket creation/capacity-decrement to `services/ticketCreation.js::createPaidTicket`, which uses an atomic `findOneAndUpdate` with an `$elemMatch` capacity guard to avoid overselling under concurrent purchases.
- `createFreeAudience` has no auth requirement at all (by design — anonymous free-ticket claim) but is capped at 10 tickets per (event, email) pair.
- `checkInByReference`/`manualCheckIn` re-verify event ownership via `assertPartnerOwnsEvent` even though the route already applies `verifyPartner` — defense in depth, since `verifyPartner` only proves "is *a* partner", not "owns *this* event".

### 3.5 `controllers/commerce.js` (grab-bag: search, alerts, referrals, wallet, TOTP, SSE, Paystack webhook, seasonal config)
- `searchEvents`: escapes regex special characters in the free-text `q` param before building a `RegExp` (`q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`) — correct defensive practice against regex injection/ReDoS.
- `handlePaystackWebhook`: validates `x-paystack-signature` via HMAC-SHA512 over the JSON body using `crypto.timingSafeEqual` (constant-time compare) — correctly implemented against timing attacks. Acknowledges the webhook (200) before doing any async work, per Paystack's 5-second timeout requirement, then processes `charge.success` as a fire-and-forget recovery path (creates a ticket if the client-side flow never completed one, re-deriving the amount server-side rather than trusting the webhook payload's `amount`).
- `getTicketStatus`: implements Server-Sent Events (SSE) by polling MongoDB every 5 seconds per open connection (`setInterval`) rather than pushing on write — works, but doesn't scale well with many concurrent open ticket-status views and re-queries the DB unconditionally every 5s per client regardless of whether the value changed (see risk).
- `applyReferral`: atomic claim via `findOneAndUpdate({_id, referralRedeemed: {$ne: true}}, ...)` to prevent double-crediting under a race; correct pattern.

### 3.6 `controllers/bank.js`
`getBankList` (cached 24h in-process), `createBank`, `updateBank`, `deleteBank`, `getBank`, `getAllBanks`, `updateBankStatus`, `createWithdraw`, `updateWithdraw`, `deleteWithdraw`, `getWithdraw`, `getUserWithdraw`, `getAllWithdraws`.
- `createBank` resolves the account against Paystack (`resolveAccountNumber`) before ever trusting the account holder's name from the client, and creates a Paystack transfer-recipient in the same call — solid pattern.
- `updateBank` deliberately blocks editing bank/account fields in place (must delete + re-add) so a stale Paystack `recipientCode` never silently points at a different, unverified account — good design decision, documented in a code comment.
- `createWithdraw` re-derives `userId` from the JWT (never `req.params`), checks `computeAvailableBalance` (from `analytics.js`) before allowing the withdrawal amount, and has a 5-minute duplicate-submission guard.
- **In-process 24h bank-list cache (`bankListCache`) is not shared across server instances** — in a multi-instance/horizontally-scaled deployment each process independently caches and re-fetches, which is harmless but wasteful, and stale data could differ between instances for up to 24h (see risk).
- `deleteWithdraw` (`bank.js:329`) has **no ownership check at all** — any authenticated user with a valid `verifyUser` token satisfying `:id` (which here is the *withdraw record's* id, not the caller's own id) could potentially delete another user's withdrawal record, because `verifyUser`'s self-match compares `req.user.id` against `req.params.id`, and here `:id` is the Withdraw document id, not a user id — meaning `verifyUser`'s ownership check silently degrades to "any authenticated user, since ids will never match" **unless** `req.user.isAdmin` — wait: re-reading `verifyUser`, if the ids never match and the user isn't admin, the middleware itself 403s. So in practice `deleteWithdraw` is effectively **admin-only in practice due to the middleware bug**, not open to all users, but also not usable by the legitimate owner. This is the same "id-param-shape mismatch" class of bug already called out and fixed elsewhere in this codebase (event.js `/:id/activity`, bank.js `/:id` DELETE) — this route was evidently missed. Flag for verification by the security reviewer. (See risk 4.4.)

### 3.7 `controllers/analytics.js`
`computeAvailableBalance` (exported helper, reused by `bank.js`), `getPartnerRevenue`, `getEventAnalytics`, `getPartnerAnalytics`, `getCheckInStats`. All manually check `req.user.isAdmin` vs. resource ownership in-controller (route-level middleware is only `verifyToken`, i.e. "logged in", not ownership-aware) — consistent pattern across the file. All analytics endpoints load full `Audience` document arrays into memory and reduce/aggregate in JS rather than using MongoDB aggregation pipelines — fine at current scale, will not scale to large ticket volumes (see risk).

### 3.8 `controllers/admin.js`
Implements the RBAC admin surface (KYC, users, payouts, events, analytics, settings, audit, notifications) mounted under `/api/admin` with `verifyAdminRole`. Several endpoints are explicit stubs returning HTTP 501: `getRevenueAnalytics`, `toggleFeatureFlags`, `getAuditLog` — the audit-log endpoint in particular means **there is currently no audit trail for admin actions** (approvals, suspensions, deletions) despite the route existing (see risk). `createAdminUser` is the only path that can mint new staff accounts (the public `/auth/register` endpoint ignores `role`/`isAdmin` from the body by design).

### 3.9 `controllers/face.js`
`enrollFace`, `verifyFace`, `removeFace`. Stores `faceTemplate` as an opaque string from the client with **no server-side validation of its shape/format**. `compareFaceTemplates` (`face.js:60`) is an explicit mock — `Boolean(captured) && Boolean(stored)` — meaning **any non-empty face template "matches" any other non-empty stored template**. This is called out in a code comment as a placeholder pending the real KBY-AI SDK license, but as shipped, `verifyFace` provides **no actual biometric security** — it would grant entry to anyone presenting any captured template against any enrolled attendee at the event, effectively acting as "is there at least one face-enrolled ticket for this event" rather than real face matching. This is the single most significant functional/security gap for a product whose core value proposition is "your face is your ticket" (see risk 4.1 — flagged as the top risk).

### 3.10 `controllers/transfer.js`
`initiateTransfer`, `acceptTransfer`, `declineTransfer`, `claimTicket`, `getIncomingTransfers`. Implements partial-ticket-quantity transfers via a parent/child "escrow" document split, with careful ordering (child persisted before parent decremented) and rollback logic on race conditions (`$gte` guard). `transferToken` (32-byte random hex) gates accept/decline; `select: false` on the schema field, explicitly stripped from `getIncomingTransfers`'s response but round-tripped via the notification `data` payload for the in-app "accept" action, and via the email deep link — token is thus present in email content and Socket.io/notification payloads (acceptable, but worth being explicit about the token's full distribution surface during the security review).

### 3.11 `controllers/notification.js`
`getNotifications`, `markAsRead`, `markAllAsRead`, `createNotification` (internal helper, not routed), `subscribePush`/`unsubscribePush` (Web Push), `notifyAdmins` (internal helper). Fans out every notification to three channels: MongoDB doc + Socket.io emit (if tab open) + Web Push (if subscribed, works when tab closed). VAPID keys optional — Web Push silently no-ops if `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` are unset.

### 3.12 `controllers/team.js`
`listTeam`, `addTeamMember`, `removeTeamMember` — co-organizer invites scoped to a single event, with `permissions` array (`checkin, analytics, edit, manage_tickets`). **Note:** these `permissions` are stored on the `CoOrganizer` model but are not visibly enforced anywhere else in the codebase found during this review (e.g. `verifyPartner` only checks `isPartner`/`isAdmin`, not co-organizer permission grants) — the permission system appears to be schema-only / not yet wired into any authorization check (see risk).

### 3.13 `controllers/social.js`
Likes, comments, follows in one file. `deleteComment` allows the comment owner, any admin, OR any partner (not just the event's own organizer) to delete a comment — `isPartner` is a global flag, not scoped to the specific event, so **any organizer account can soft-delete any comment on any event**, not just their own (see risk). `pinComment` correctly scopes to the specific event's `planner_id`.

### 3.14 CMS controllers (`faq.js`, `howItWorks.js`, `legal.js`, `marquee.js`, `promoBanner.js`, `curatedSection.js`, `siteConfig.js`)
Uniform, simple CRUD pattern: public GET for "active" content, `verifyAdminRole(['moderator'])`-gated GET-all/POST/PUT/DELETE for management. Straightforward, low risk, minimal duplication of the same find/create/update/delete shape across seven near-identical files (see risk — candidate for a generic CMS-CRUD factory).

### 3.15 `controllers/promos.js`
Promo codes are embedded inside the `Event.promos` array (not a separate collection). `validatePromoCode` is public (needed at checkout before auth in some flows) and correctly checks `isActive`, expiry, and `usedCount >= maxUses`. **No code path was found that increments `usedCount` after a successful redemption** (`createAudience`/`createPaidTicket` do not reference promos at all) — meaning promo code usage limits are validated at preview time but **not actually enforced/decremented at purchase time**, and the discount itself does not appear to be applied to the charged amount anywhere in the ticket-creation flow (see risk — promo codes appear to be a partially-wired feature).

### 3.16 `controllers/pushToken.js`, `partner.js`, `category.js`, `testimonial.js`
Small, single-purpose controllers; straightforward CRUD or lookup with no notable deviations from the patterns already described.

---

## 4. Middleware Inventory

- **`middleware/upload.js`** — `multer` memory-storage config. Allows `image/jpeg, image/png, image/webp, image/gif, video/mp4, video/quicktime, video/webm`; 100MB file-size limit; rejects other MIME types via `fileFilter`. Used by `routes/upload.js` (event media) and `routes/users.js` (KYC selfie + ID document, via `.fields()`).
- **`utils/verifyToken.js`** — the de facto auth middleware module (not literally in `middleware/` but functions as such): `verifyToken`, `optionalAuth`, `verifyUser`, `verifyAdmin`, `verifyPartner`. All read the JWT from either the `access_token` httpOnly cookie or an `Authorization: Bearer` header, verified with `jsonwebtoken` against `process.env.JWT_SECRET`. See section 8 for JWT payload shape and section 4.4/risks for the `verifyUser` param-matching caveat.
- **`utils/verifyAdminRole.js`** — RBAC factory `verifyAdminRole(allowedRoles)`, layered on top of `verifyToken`. Treats a decoded token with no `role` claim as `'viewer'` (least privilege) — noted in comments as intentional for tokens minted before the RBAC rollout.
- **No global rate limiter** — `express-rate-limit` (`authLimiter`, 10 req/15 min) is applied only to a subset of `routes/auth.js` endpoints (`login`, `verify-email-otp`, `request-otp`, `forgot-password`, `verify-otp`). It is NOT applied to `register`, `register-partner`, or `reset-password`, nor to any non-auth route (ticket purchase, promo validation, search, etc.) — see risk.
- **No request-body validation middleware library** (e.g. `zod`, `express-validator`, or consistent `Joi` schema middleware) is wired centrally. Joi is used only in `register`/`resetPassword` (via `User.js`'s exported validators) — every other endpoint hand-rolls its own presence/type checks inline in the controller, with inconsistent coverage (see risk).
- **Error handling middleware** — defined inline in `app.js:192-204` (not a separate file). See section 9.
- **CORS** — configured in `app.js:78-102` and separately (with a slightly different, hardcoded origin list) in `socket/index.js:10-19` for Socket.io — two independent CORS configurations that can drift out of sync (see risk).

---

## 5. Utilities Inventory

| File | Purpose | Third-party calls |
|---|---|---|
| `utils/QRCode.js` | Generates a QR code PNG (via `qrcode` npm package) for a ticket reference, uploads it to Cloudinary, falls back to an inline base64 data URL if the Cloudinary upload fails. | `qrcode`, Cloudinary |
| `utils/emailProviders.js` | Low-level email transport: Handlebars template compile/cache (partials + layouts), ZeptoMail (SMTP via Nodemailer) as primary, Resend (HTTP API via native `fetch`) as fallback. Checks `User.emailStatus` (BOUNCED/COMPLAINED) before sending — suppression list gate. | ZeptoMail (SMTP), Resend (REST API) |
| `utils/sendEmail.js` | Higher-level wrapper: checks `user.notificationPreferences.email` before delegating to `emailProviders.js`. Exports convenience wrappers `sendEmails`, `sendTicket`, `sendOTP`, `sendWelcome` (legacy call sites) plus `FROM_*` sender-address constants. | (delegates to emailProviders.js) |
| `utils/error.js` | `createError(status, message)` factory — the one-line helper used everywhere to build an `Error` with `.status`/`.message` for the central error handler. | none |
| `utils/otp.js` | `issueVerifyOtp(user, purpose)` — mints a 6-digit numeric OTP, atomically upserts it into the `token` collection (`type: 'verify'`), enqueues the `otp.hbs` email. | (delegates to jobs/emailQueue.js) |
| `utils/paystack.js` | The single point of contact with the Paystack REST API (per its own header comment). Exports `verifyTransaction`, `verifyAndCheckPaystackReference` (the canonical "is this a real, successful, correctly-amounted charge" check), `listBanks`, `resolveAccountNumber`, `createTransferRecipient`, `initiateTransfer`. | Paystack REST API (`api.paystack.co`) |
| `utils/referralCode.js` | `generateFallbackCode` (deterministic 8-digit code from ObjectId hex tail) and `generateReferralCode` (username-seeded + 3 random alphanumeric chars). | none |
| `utils/verifyAdminRole.js` | See Middleware section. | none |
| `utils/verifyToken.js` | See Middleware section. | none |

Additional supporting modules outside `utils/` that function as shared infrastructure:
- `jobs/emailQueue.js` — BullMQ queue + worker wrapping `sendEmail`. Queue is only active when `NODE_ENV === 'production'` or `EMAIL_QUEUE_ENABLED === 'true'`; in dev, `enqueueEmail` sends synchronously (or silently drops delayed emails, logging only). Worker also creates in-app `Notification` docs + Socket.io emits for `event_reminder`/`event_recap` jobs specifically (unusual coupling — the email worker also does non-email side effects for two notification types only, not a generalized pattern).
- `jobs/updateExpiredTickets.js` — hourly cron (`node-cron`, scheduled in `app.js`), flips `Audience.status` from `active` to `ended` for events whose `date` has passed.
- `jobs/eventReminderJob.js` — cron every 30 min, sends 24h/2h-before in-app + email reminders to ticket holders, and separately emails followers who haven't purchased yet.
- `jobs/attendeeWinback.js`, `jobs/organizerWinback.js`, `jobs/faceEnrollmentNudge.js` — daily cron-scheduled lifecycle/re-engagement email sequences. **None of these three are invoked anywhere in `app.js`** (only `updateExpiredTickets` and `scheduleEventReminders` are started at server boot) — these cron jobs are defined but never started (dead/unwired code — see risk). They also contain a live bug: `attendeeWinback.js` references `baseUrl2`/`baseUrl3` (undefined variables — only `baseUrl` is declared) inside the day-105 and day-120 email blocks, which would throw a `ReferenceError` at runtime if this job were ever wired up (see risk).
- `services/ticketCreation.js` — the single ticket-issuance code path (`createPaidTicket`), used by both the direct-purchase flow and the Paystack webhook's recovery branch. Atomic capacity decrement, QR generation, fire-and-forget post-purchase notifications/email.
- `socket/index.js` — Socket.io server setup, JWT-authenticated handshake, per-user room (`user:<userId>`), and the `emitNotification`/`emitUnreadCountUpdate`/`emitNotificationRead`/`emitAllNotificationsRead` helpers plus a module-level `globalIoInstance` singleton so BullMQ job processors (which don't have `req.app.locals`) can still emit.

---

## 6. Third-Party Integrations

| Service | Purpose | Where configured / called | Auth mechanism |
|---|---|---|---|
| **MongoDB** (Atlas in prod) | Primary datastore | `apps/api/app.js:31` (`mongoose.connect`), URI from `MONGODB_URI`/`MONGO` | connection string with embedded credentials |
| **Redis** | BullMQ email queue backend | `jobs/emailQueue.js`, tested at startup in `startup.js`/`app.js` | host/port, no auth shown in config (assumes trusted network or `REDIS_URL` embeds creds) |
| **Cloudinary** | Image/video hosting: event media (`routes/upload.js`), QR codes (`utils/QRCode.js`), KYC selfie + ID docs (`controllers/users.js`) | `cloud_name`/`api_key`/`api_secret` from env, configured independently in 3 separate files (`routes/upload.js`, `utils/QRCode.js`, `controllers/users.js`) — three separate `cloudinary.config()` calls rather than one shared init (see risk) | API key/secret |
| **Paystack** | Payment verification (ticket purchase), bank account resolution, transfer-recipient creation, payouts (transfers), webhook (charge.success) | `utils/paystack.js` (single point of contact, per its own comment), webhook consumed in `controllers/commerce.js::handlePaystackWebhook` | `PAYSTACK_SECRET_KEY` bearer token for outbound calls; inbound webhook validated via HMAC-SHA512 signature header |
| **ZeptoMail** | Primary transactional email (SMTP via Nodemailer) | `utils/emailProviders.js` | SMTP user/token |
| **Resend** | Fallback transactional email (REST API) | `utils/emailProviders.js` | API key bearer token |
| **Web Push (VAPID)** | Browser push notifications | `controllers/notification.js` (`web-push` npm package) | VAPID key pair, optional — feature no-ops if unset |
| **Firebase Cloud Messaging** | Referenced in project docs (`CLAUDE.md`) as the mobile push provider; **no FCM SDK code, import, or credentials were found anywhere in `apps/api/`** during this review. Mobile push registration exists (`models/PushToken.js`, `routes/pushToken.js`) storing raw device tokens with `platform: ios/android`, but nothing in the API actually sends to FCM/APNs — the push-token storage appears to be scaffolding for a not-yet-implemented send path (see risk). | — | — |
| **Termii SMS** | Referenced in project docs as an OTP/SMS fallback provider; **no Termii code, import, or credentials were found anywhere in `apps/api/`** during this review. `User.notificationPreferences.sms` exists as a schema field but nothing reads or acts on it for actual SMS sending. | — | — |
| **KBY-AI face SDK** | Referenced in project docs as the biometric matching engine, with the adapter pattern living in `apps/mobile/src/lib/faceSDK.ts` (out of scope for this backend-only review — not inspected here). On the API side, `controllers/face.js` only stores/compares an opaque `faceTemplate` string with a mock comparator (`Boolean(a) && Boolean(b)`) — there is no KBY-AI SDK call, license check, or real biometric distance calculation anywhere in `apps/api/`. | `controllers/face.js` | n/a (mock) |
| **Stripe Connect** | Referenced in project docs as a "future, not yet integrated" payment processor; confirmed — **zero Stripe code found in `apps/api/`**. | — | — |
| **speakeasy** | TOTP generation/verification for account 2FA (`auth.js` login flow) — distinct from the per-ticket TOTP (`otplib`, used in `commerce.js::getTicketToken` and `services/ticketCreation.js` for `generateSecret`). Two different TOTP libraries are used for two different purposes in the same codebase (see risk — minor, not necessarily wrong, but worth normalizing). | `controllers/auth.js` | n/a |

---

## 7. Environment Variables Reference

From `apps/api/.env.example` (names and purpose only — no secret values reproduced) plus additional variables referenced in code but not present in the example file (marked "code only" below):

### Core
- `PORT` — HTTP port (default 4002)
- `JWT_SECRET` — JWT signing secret (required in all environments; some legacy code paths also fall back to `process.env.JWT`, an undocumented alias — see risk)
- `NODE_ENV` — `development`/`production`, gates queue/notification feature flags in `config.js`

### Database & Cache
- `MONGO` — MongoDB connection URI (also accepted as `MONGODB_URI`, normalized in `startup.js`)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_URL` — Redis connection for BullMQ email queue

### Web URLs
- `WEB_URL`, `PARTNER_URL`, `ADMIN_URL` — used for CORS allow-list and for building links inside emails/deep-links

### Email (AWS SES section header present, but code actually uses ZeptoMail + Resend — see risk 4.9)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `SES_SENDER_EMAIL` — present in `.env.example` under an "AWS SES" heading, but no AWS SES SDK code was found anywhere in `apps/api/` — appears to be stale/leftover from a prior email-provider migration
- `ZEPTOMAIL_SMTP_HOST`, `ZEPTOMAIL_SMTP_PORT`, `ZEPTOMAIL_SMTP_USER`, `ZEPTOMAIL_SMTP_TOKEN` — (code only, required in production per `startup.js`) actual primary email transport
- `RESEND_API_KEY` — (code only, required in production) fallback email transport
- `EMAIL_SENDER_DEFAULT` — (code only, required in production) default From address
- `EMAIL_SENDER_TICKETS`, `EMAIL_SENDER_EVENTS`, `EMAIL_SENDER_PAYOUTS`, `EMAIL_SENDER_SUPPORT`, `EMAIL_SENDER_HELLO`, `EMAIL_SENDER_PARTNER` — (code only, optional, each falls back to `EMAIL_SENDER_DEFAULT`) per-purpose From addresses
- (commented out in `.env.example`) `RESEND_FROM_DEFAULT`, `RESEND_FROM_TICKETS` — noted as legacy, kept for reference

### Uploads
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — media/QR/KYC document hosting

### Payments
- `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` — Paystack API credentials; webhook URL registered manually in the Paystack dashboard (not an env var)

### Other (code only, not in `.env.example` — should be added for completeness)
- `SALT` — bcrypt salt rounds (used inconsistently: some call sites use `Number(process.env.SALT)` with no fallback which yields `NaN` → bcrypt default behavior if unset, others use `Number(process.env.SALT) || 10` or `parseInt(process.env.SALT ?? '12', 10)` — three different fallback strategies across the codebase, see risk)
- `BASE_URL` — used throughout for building email links/deep-links; falls back to hardcoded `https://comfytag.com` if unset
- `MOBILE_DEEP_LINK_BASE` — mobile app deep-link scheme prefix, falls back to `comfytag://`
- `CORS_MOBILE_ORIGINS` — comma-separated extra CORS origins for LAN-IP mobile testing
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` — Web Push credentials, generated via `scripts/generate-vapid-keys.js`; feature silently disabled if unset
- `EMAIL_QUEUE_ENABLED` — force-enables the BullMQ queue outside production
- `LOG_LEVEL` — referenced in `config.js` but no logging library reads it anywhere found (`console.log`/`console.error` used throughout instead — see risk)

---

## 8. Authentication & Authorization Flow

**Session mechanism:** JWT, signed with `JWT_SECRET`, `expiresIn: '7d'` (`User.generateAuthToken()` in `Rework/schemas/User.js`). Payload: `{id, _id, email, isPartner, isAdmin, role}` — no `iat`/session-versioning field, so **a token cannot be invalidated server-side before its 7-day expiry** (no logout/revocation list, no token blacklist — see risk). Delivered to the client two ways simultaneously on login: as an httpOnly cookie (`access_token`, no `secure`/`sameSite` flags set — see risk) AND in the JSON response body (`token` field) for clients that store it themselves (mobile). Subsequent requests are authenticated via either the cookie OR an `Authorization: Bearer <token>` header (`utils/verifyToken.js`).

**Registration (`POST /auth/register`):**
1. Joi-validates the body (`validatRegister`: username, name, email, password-complexity, confirm_password, optional isPartner).
2. Rejects duplicate email or username (409).
3. Hashes password with bcrypt (`bcrypt.genSalt(Number(process.env.SALT))` — note: no fallback if `SALT` is unset, see risk).
4. Creates the `User` doc with a generated `referralCode`, retrying up to 5 times on a random collision.
5. Generates and persists a deterministic `referralFallbackCode` from the new `_id`.
6. If a `?ref=` query param was present, looks up the referrer for logging only — **no referral record or reward is actually created at registration time** (a `TODO` comment marks this as unimplemented — see risk).
7. Sends a 6-digit OTP verification email via `issueVerifyOtp` (upserts into the `token` collection, type `verify`, 1-hour TTL via the schema's `expires: 3600`).
8. Enqueues a multi-part welcome email series (3 emails for attendees, 5 for organizers) via BullMQ with staggered `delay`s.
9. Returns 201 with the created user (password stripped) — **the account is not yet email-verified at this point** (`isVerify.email: false`), so `login` will 403 until verification completes.

**Email verification / passwordless login (two convergent flows, same endpoint):**
- `POST /auth/verify-email-otp {email, otp}` — looks up the `token` doc (type `verify`), deletes it on match, sets `isVerify.email = true`, and — critically — **also logs the user in** (returns a full session token) unless the account has 2FA (`totpSecret`) configured, in which case it returns `requiresPassword: true` and stops short of issuing a session. This single endpoint serves both "finish verifying a freshly registered account" and "cold-start passwordless sign-in via `request-otp`."
- `POST /auth/request-otp {email}` — anti-enumeration: always returns the same generic success message whether or not the account exists; routes 2FA accounts to `requiresPassword: true` instead of emailing a bypass code.

**Login (`POST /auth/login`):**
1. Rate-limited (10/15min per IP).
2. Looks up by email OR username (`$or`).
3. `bcrypt.compare` password.
4. Requires `isVerify.email === true` (403 with a specific message otherwise).
5. If `totpSecret` is set: requires `otp` in the body; verifies via `speakeasy.totp.verify` (base32, window 1). First call without `otp` returns `{error: 'TWO_FACTOR_REQUIRED'}` so the client can prompt for a code.
6. Issues JWT, sets the `access_token` cookie, returns user + token in the body.

**Google Sign-In (`POST /auth/google-signin`):** Client-side Google OAuth is assumed to have already proven email ownership (no ID-token verification happens server-side in this handler — the endpoint trusts whatever `email`/`name`/`image` the client sends, see risk 4.2). Creates a new account (random unusable password) if the email is unseen, or upgrades an existing attendee to partner if `isPartner` intent is passed and the account isn't already a partner/admin.

**Password reset:** `forgot-password` (issues bcrypt-hashed OTP, type `reset`) → `verify-otp` (compares, issues a 5-minute JWT with `reset_password_allowed: true`) → `reset-password` (verifies that JWT + Joi password-complexity, updates password, deletes the reset token). `change-password` (authenticated) is a separate, simpler current-password-check flow.

**Authorization layers actually enforced:**
1. Middleware-level: `verifyToken`/`verifyUser`/`verifyAdmin`/`verifyPartner`/`verifyAdminRole` (see section 4).
2. Controller-level ownership checks: pervasive pattern of `event.planner_id.toString() !== requesterId && !req.user.isAdmin` (events, tickets, promos, team, bank, withdraw) — necessary because route params frequently don't match the resource-owner's user id shape (e.g. `:id` = event id, not user id), so `verifyUser`'s built-in param-matching cannot be relied on for those routes and controllers re-derive ownership from the resource document itself. This pattern is applied correctly in most places but was evidently missed in at least one spot (`bank.js::deleteWithdraw` — see risk 4.4).
3. RBAC roles (`super_admin, finance, kyc_reviewer, support, moderator, viewer`) only apply to the `/api/admin/*` surface; the legacy `/admin/*` mount (reusing `auth.js`/`event.js`/etc.) is gated only by the coarser `verifyAdmin` (boolean `isAdmin`), not by role — meaning the two admin surfaces (`/admin/*` legacy and `/api/admin/*` RBAC) have inconsistent authorization granularity for what is nominally the same "admin" concept (see risk).

---

## 9. Error Handling Patterns (current state)

Two entirely different error-response shapes coexist in the codebase, split roughly along file-age lines:

**Pattern A — "new" controllers (`createError` + `next(err)`):** e.g. `admin.js`, `analytics.js`, `bank.js`, `event.js`, `commerce.js`, `notification.js`, `team.js`, all CMS controllers. Calls `createError(status, message)` (`utils/error.js`) and passes to `next(err)`, which is caught by the single centralized handler in `app.js:192-204`:
```js
app.use((err, req, res, next) => {
  const errorStatus = err.status || err.http_code || 500
  const errorMessage = err.message || "Something went wrong"
  return res.status(errorStatus).json({
    success: false, status: errorStatus, message: errorMessage,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
})
```
This is a reasonable, consistent shape: `{success: false, status, message, stack?}`, and correctly gates stack-trace exposure behind `NODE_ENV !== 'production'`.

**Pattern B — "legacy" controllers (`auth.js`, `users.js`, `category.js`, `testimonial.js`, older parts of `bank.js`/`audience.js`):** many `try { ... } catch (error) { res.status(500).send({ message: "Internal Server Error" + error}) }` blocks that respond directly rather than calling `next(err)`. Several of these **concatenate the raw error object into the message string** (e.g. `auth.js:288`: `res.status(500).send({ message: "Internal Server Error" + error})`, `auth.js:385`, `auth.js:961`, `auth.js:1019`, `auth.js:1081`, `auth.js:1121` all do `error: error.message`), which leaks internal error detail (potentially including stack-adjacent info or library-specific messages, e.g. raw Mongoose/MongoDB driver errors) directly to the client regardless of environment — this bypasses the `NODE_ENV` gate that Pattern A respects, because it never goes through the central handler (see risk 4.3).

**Status code usage** is mostly conventional (400 validation, 401 auth, 403 authorization, 404 not-found, 409 conflict, 500 server error) but inconsistent in a few spots:
- Some "not found" cases return 400 instead of 404 (e.g. `auth.js::verifyEmail`, `auth.js::verifyID` both return 400 for "user does not exist").
- `admin.js`'s unimplemented endpoints correctly use 501 (Not Implemented) — good practice, rare to see done correctly.
- A few endpoints return `200` for what is semantically a failure the client should branch on (e.g. `face.js::verifyFace` returns `200` with `{success: false, message: '...'}` for a non-match, rather than 401/403) — defensible for a check-in UX (avoid an HTTP-level "error" flash for an expected outcome) but inconsistent with the rest of the API's use of real status codes for failure states.

No centralized request-ID/correlation-ID is attached to error responses or logs, making it hard to correlate a client-reported error with server-side log lines in production (see risk).

---

## 10. Observations & Risks

This section is explicitly separated from the factual documentation above. Items are flagged for the advisory team's triage — nothing here has been fixed, and severity/priority judgment calls are left to the review team.

### 4.1 Face verification is a non-functional mock (Critical — product-defining risk)
`controllers/face.js:60` — `compareFaceTemplates = (captured, stored) => Boolean(captured) && Boolean(stored)`. As shipped, `POST /face/verify` grants entry to **any** captured template as long as *some* face-enrolled ticket exists for the event — there is no actual biometric comparison. This is explicitly commented as a placeholder pending the real KBY-AI SDK license, but given the product's entire value proposition is "your face is your ticket," this is the single highest-priority item for the rework team to scope, regardless of how the rest of the backend is treated.

### 4.2 Google Sign-In trusts client-asserted identity (High — auth security)
`controllers/auth.js::googleSignIn` (`auth.js:389`) accepts `email`/`name`/`image` directly from the request body with no server-side verification of a Google ID token (e.g. via `google-auth-library`). Any client can `POST /auth/google-signin {email: "victim@example.com"}` and receive a full session for that email address if no account exists yet (account takeover / pre-registration), or, if the account does exist, this path is only reachable for upgrading to partner — but the missing ID-token verification is the core issue regardless.

### 4.3 Inconsistent error handling leaks internals in legacy controllers (High — info disclosure)
See section 9, Pattern B. Multiple endpoints in `auth.js` (registration, login GET routes, OTP flows, password reset) return `"Internal Server Error" + error` or `error: error.message` directly to the client in all environments (not gated by `NODE_ENV`), unlike the centralized handler used by newer controllers. A reviewer should decide whether to standardize all controllers on `next(createError(...))`.

### 4.4 `bank.js::deleteWithdraw` route/middleware mismatch (Medium/High — needs verification)
`routes/withdraw.js: DELETE /:id` is guarded by `verifyUser`, but `:id` here is the Withdraw document's own `_id`, not the caller's user id — the same class of bug the codebase's own comments say was already fixed elsewhere (`event.js` `/:id/activity`, `bank.js` `/:id` DELETE bank). `controllers/bank.js::deleteWithdraw` (`bank.js:329`) also performs **no ownership check in the controller body** (unlike `deleteBank`, which does check `bank.user_id.toString() !== requesterId`). Net effect: because `verifyUser`'s param-match will essentially never succeed (Withdraw id ≠ User id), the middleware forces this route to admin-only in practice, meaning **the intended feature — a partner deleting their own pending withdrawal request — may not work for legitimate owners**, while the controller itself has no defense if the middleware behavior is ever changed. Worth a direct functional test.

### 4.5 Global/other authorization gaps
- `controllers/social.js::deleteComment` — any user with `isPartner: true` can delete **any** comment on **any** event, not just their own event's comments (`social.js:153`, checks `req.user.isPartner` globally rather than checking `event.planner_id`).
- `CoOrganizer.permissions` (`checkin, analytics, edit, manage_tickets`) are stored but not visibly enforced by any middleware or controller found in this review — co-organizer routes/features appear to check only `verifyPartner` (global partner flag) rather than the specific per-event permission grant.
- The legacy `/admin/*` route mount reuses `verifyAdmin` (boolean) while `/api/admin/*` uses granular `verifyAdminRole`; both are "admin surfaces" with different authorization models mounted side-by-side.

### 4.6 JWT has no revocation mechanism (Medium — auth)
7-day tokens with no `iat`/version claim, no server-side blacklist, no way to force-logout a compromised session, change password and invalidate outstanding tokens, or handle role-downgrade/de-admin immediately (an admin demoted to `viewer` keeps `isAdmin: true` in already-issued tokens for up to 7 days — noted in `verifyAdminRole.js`'s own comment as a known tradeoff).

### 4.7 Cookie flags (Medium — auth/session security)
`res.cookie("access_token", token, { httpOnly: true })` — no `secure`, `sameSite`, or `maxAge`/`expires` set (multiple call sites: `auth.js:380`, `auth.js:548`). Without `secure`, the cookie could be sent over plain HTTP; without `sameSite`, weaker CSRF posture; without `maxAge`, it's a session cookie client-side even though the JWT itself is valid for 7 days server-side (inconsistent lifetimes).

### 4.8 Rate limiting is narrow (Medium — abuse/DoS)
Only 5 of the ~150+ routes carry `express-rate-limit` (all in `auth.js`, and notably NOT `register`/`register-partner`/`reset-password`). No rate limiting anywhere on ticket purchase, promo validation, search, comment posting, or the free-ticket claim endpoint (`POST /audience/free/:eventId`, fully public, capped only by a 10-per-email application-level check that itself could be bypassed by varying the email).

### 4.9 Env var / docs drift (Low/Medium — operational risk)
`.env.example` documents AWS SES variables under an "Email (AWS SES)" heading, but the actual code (`utils/emailProviders.js`) uses ZeptoMail + Resend exclusively — no AWS SDK/SES code exists in the repo. The required-in-production ZeptoMail/Resend variables are absent from `.env.example` entirely (only discoverable by reading `startup.js`). This will actively mislead anyone provisioning a new environment from the example file.

### 4.10 Referenced third-party integrations that don't exist in the API (Medium — docs/scope mismatch)
Per `CLAUDE.md`, the platform is meant to use Firebase Cloud Messaging and Termii SMS. Neither has any code, SDK import, or credential handling anywhere in `apps/api/`. `PushToken` storage exists but nothing sends to FCM/APNs; `notificationPreferences.sms` exists on `User` but nothing sends SMS. These are either unimplemented (roadmap) or removed and the docs weren't updated — worth clarifying before the rework team scopes "what to keep."

### 4.11 Winback/nudge cron jobs are dead code with a live bug (Low — but a landmine if ever enabled)
`jobs/attendeeWinback.js`, `jobs/organizerWinback.js`, `jobs/faceEnrollmentNudge.js` export `start*Cron()` functions that are never called from `app.js` (only `updateExpiredTickets` and `scheduleEventReminders` are started at boot). If someone wires these up without reading them first: `attendeeWinback.js` references `baseUrl2` and `baseUrl3` (`attendeeWinback.js:34`, `:51`) which are never declared anywhere in the file (only `baseUrl` is) — this would throw `ReferenceError: baseUrl2 is not defined` at runtime inside the day-105/day-120 email blocks.

### 4.12 Promo codes: validated but not enforced at purchase (Medium — business logic gap)
`validatePromoCode` (`controllers/promos.js`) correctly checks active/expiry/max-uses at checkout-preview time, but no code path in `createAudience`/`createPaidTicket`/`services/ticketCreation.js` was found that (a) applies the discount to the charged amount, or (b) increments `promo.usedCount` after a successful purchase. As implemented, promo codes appear to be front-end-only UX (show a "valid code" checkmark) with no server-side price effect or usage-limit enforcement.

### 4.13 Referral rewards at registration are a no-op (Low — business logic gap)
`auth.js::register` (`auth.js:230-240`) looks up the referrer when a `?ref=` param is present but only `console.log`s it — a `// TODO: persist referral record or increment referrer reward counter` marks this as intentionally unfinished. The separate `Referral`/event-level referral system (`commerce.js::getReferralCode`/`applyReferral`, ₦500 wallet credit) is fully wired, but this is a second, unconnected referral concept (signup referral vs. event-ticket referral) that share naming but not implementation.

### 4.14 Data modeling inconsistencies
- Cross-collection references are inconsistently typed: some use real Mongoose `ObjectId` refs (`CoOrganizer.event_id`, `Withdraw.bankId`), most use plain `String` with no `ref` at all (`Event.planner_id`, `Audience.event_id`/`user_id`, `Comment.user_id`, `Follow.*`, `EventLike.*`, `Notification.user_id`) — this forecloses `.populate()` and requires manual batch-fetch/`Map` joins throughout the controllers (seen repeatedly, e.g. `audience.js::getMyTickets`, `transfer.js::getIncomingTransfers`).
- `Audience.phone` is typed `Number`, not `String` — will silently corrupt phone numbers with a leading `0` (Nigerian local format) or drop a `+` international prefix.
- `Event.date` and `Event.event_date` are two separate, overlapping date fields (`Event.js:36,60`) — controllers routinely do `e.date ?? e.event_date ?? null` fallback logic in multiple places (`event.js`, `commerce.js`) to paper over which one is actually populated for a given document, implying historical inconsistent writes.
- `Audience.type` is schema-forced `lowercase: true` while `Event.ticketType[].name` is not — controllers have to remember to `.toLowerCase()` tier names before comparing against ticket records (explicitly called out in code comments at `event.js:730` and `event.js:764` as a footgun that was already hit once).
- Model `Bank.js` registers as `mongoose.model("Banks", ...)` (plural) while the file and every import elsewhere is singular `Bank` — cosmetic but a recurring source of confusion, and `Withdraw.bankId` refs `'Banks'` (has to match the plural registration).
- `models/token.js` registers as `mongoose.model("token", ...)` — lowercase, the only model in the codebase not PascalCase.
- `SiteConfig` model is used both for public site copy (hero headline, stats) AND as the de facto "platform settings" singleton for admin (`admin.js::getSettings/updateSettings` writes/reads arbitrary fields onto it) — no dedicated `Settings`/`PlatformConfig` model exists despite `admin.js` routes implying one (`/api/admin/settings`).
- `User.js` doubles as both the Mongoose schema file AND a Joi validation module (exports `validatRegister`, `validatePasswordReset` alongside the schema) — unconventional co-location.

### 4.15 Duplicated logic / missing shared validation layer
- No centralized request-validation middleware (Joi/Zod/express-validator) — validation is ad hoc per controller, ranging from thorough (`bank.js`, `event.js` ownership checks) to entirely absent (many CMS controllers only check `?.trim()` truthiness).
- `sanitizeString()` (mojibake/corrupted-UTF-8 cleanup) is copy-pasted independently in `auth.js` (twice: `login`'s response path doesn't have it, but `adminLogin` and `getMe` each define their own copy) and `users.js::getUser` — same regex, three separate inline definitions rather than one shared utility. Root-level `PROFILE_CORRUPTION_FIX.md` suggests this was a historical incident being patched at read-time rather than at the source of the corruption.
- Seven near-identical CMS controllers (`faq.js`, `howItWorks.js`, `marquee.js`, `promoBanner.js`, plus the two sub-resources in `legal.js`, plus `curatedSection.js`) each hand-roll the same "public active list / admin all list / create / update / delete" CRUD shape — a strong candidate for a generic factory if the rework keeps this CMS pattern.
- Ticket-tier "sold" totals are computed independently (and correctly, but redundantly) in at least four places: `event.js::getTicketTierStats`, `event.js::deleteTicketTier`, `analytics.js::getEventAnalytics`, `analytics.js::getCheckInStats` — same reduce-over-Audience-array logic re-implemented per endpoint rather than shared.
- `SALT` env var fallback is handled three different ways across the codebase (`Number(process.env.SALT)` with no fallback in `register`; `Number(process.env.SALT) || 10` in several other password-hashing call sites; `parseInt(process.env.SALT ?? '12', 10)` in `googleSignIn`) — should be a single constant.

### 4.16 Scalability / performance notes (not urgent, but relevant to "redo properly")
- `getTicketStatus` (SSE) polls MongoDB every 5 seconds per open connection rather than using change streams or a pub/sub push — will not scale with many simultaneous open ticket-status views.
- Several analytics endpoints (`getEventAnalytics`, `getPartnerAnalytics`, `getCheckInStats`) load full `Audience` arrays into Node memory and reduce in JavaScript rather than using MongoDB's aggregation pipeline — fine at current data volume, will degrade as ticket volume grows.
- `Audience` has no compound indexes despite being queried heavily by `{event_id, status}`, `{event_id, user_id}`, and `{user_id}` combinations across almost every controller in the file.
- The Cloudinary SDK is configured independently (three separate `cloudinary.config()` calls) in `routes/upload.js`, `utils/QRCode.js`, and `controllers/users.js` rather than once in a shared module.
- CORS is configured twice, independently, with different origin lists: `app.js` (env-driven, includes `CORS_MOBILE_ORIGINS`) vs. `socket/index.js` (a separate, hardcoded-plus-env list) — these can drift.

### 4.17 No tests found covering the bulk of business logic
`apps/api/package.json` wires up `vitest` + `mongodb-memory-server` + `supertest`, and `apps/api/src/__tests__/` and `test-utils/` directories exist, but this review did not enumerate individual test files/coverage (out of scope for this pass — flagged here only so the rework team knows to check `apps/api/src/__tests__/` coverage explicitly before deciding what's safe to refactor without a regression net).

### 4.18 Dead code
- `controllers/auth.js::adminLogin` (`auth.js:777`) is fully implemented but not imported by any route file — and if it were wired up, it signs a JWT with **no `expiresIn`** (permanent token) and no `role` claim, which would be a meaningful downgrade from the main `login` flow's token shape.
- Large commented-out blocks throughout `app.js` (email-validation-via-MX-record feature, ~90 lines) and `controllers/users.js` (an old `login` implementation, ~50 lines) left in place rather than removed.

---

## Appendix: Files copied for direct review

All 26 Mongoose model files were copied verbatim (same filenames) into `Rework/schemas/`:
Alert.js, Audience.js, Bank.js, Category.js, CoOrganizer.js, Comment.js, CuratedSection.js, Event.js, EventLike.js, FaqItem.js, Follow.js, HowItWorksStep.js, LegalDocument.js, MarqueeItem.js, Notification.js, PageContent.js, PromoBanner.js, PushToken.js, Referral.js, SiteConfig.js, Testimonials.js, User.js, Wallet.js, WebPushSubscription.js, Withdraw.js, token.js
