/**
 * Feature flags — single source of truth for features that are fully built
 * but deliberately hidden from users for now. Flip a flag to `true` to
 * relaunch a feature; no other code changes should be needed.
 *
 * Convention: gate at the UI *entry points* (buttons, nav rows, copy) that
 * lead a user into a feature — not inside the destination screens/hooks/API
 * calls themselves. That keeps the underlying implementation live, real,
 * and type-checked the whole time it's "off," so turning it back on is a
 * one-line change instead of an archaeology project.
 */
export const FEATURES = {
  // Face enrollment ("Your face is your ticket") + face-based check-in, both
  // the attendee's own screen and the organizer/staff scanner. Deferred to
  // v2. The screens, hooks, and backend endpoints (POST /face/enroll/:userId,
  // POST /face/verify, DELETE /face/remove/:userId) are all real and working
  // — see MOBILE_SYSTEM_AUDIT.md — this flag only hides the doors into them.
  faceVerification: false,
} as const
