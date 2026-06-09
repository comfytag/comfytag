# ComfyTag Email System — Phase 5 Integration & Testing Guide

**Status:** 31 emails + 3 cron jobs complete. Ready for production integration.

---

## STEP 1: Add Cron Job Imports to app.js

**File:** `apps/api/app.js`  
**Location:** After line 62 (other imports), before `const whitelist = [...]`

Add these imports:
```javascript
import { startFaceEnrollmentNudgeCron } from './jobs/faceEnrollmentNudge.js'
import { startAttendeeWinbackCron } from './jobs/attendeeWinback.js'
import { startOrganizerWinbackCron } from './jobs/organizerWinback.js'
```

---

## STEP 2: Initialize Cron Jobs on Server Start

**File:** `apps/api/app.js`  
**Location:** Inside the `app.listen()` callback (line 299-301)

Change this:
```javascript
app.listen(process.env.PORT || PORT, () => {
  console.log(`Listening to port ${process.env.PORT}`)
})
```

To this:
```javascript
app.listen(process.env.PORT || PORT, () => {
  console.log(`Listening to port ${process.env.PORT}`)
  
  // Initialize retention cron jobs (runs automatically at scheduled times)
  startFaceEnrollmentNudgeCron()
  startAttendeeWinbackCron()
  startOrganizerWinbackCron()
  
  console.log('✓ Email retention cron jobs started')
})
```

---

## STEP 3: Verify Dependencies in package.json

**File:** `apps/api/package.json`

Ensure these are installed (should already be from Phase 0):
```json
{
  "dependencies": {
    "handlebars": "^4.7.9",
    "bullmq": "^5.78.0",
    "resend": "^6.12.3",
    "node-cron": "^3.x.x"
  }
}
```

If `node-cron` is missing:
```bash
cd apps/api
pnpm add node-cron
```

---

## STEP 4: Environment Variables Required

**File:** `.env` (in apps/api/)

Ensure these are set:
```
# Email
RESEND_API_KEY=re_xxxxxxxxxxxx
BASE_URL=https://comfytag.com
WEB_URL=https://app.comfytag.com
PARTNER_URL=https://partner.comfytag.com

# Redis (for BullMQ)
REDIS_URL=redis://localhost:6379

# Database
MONGO=mongodb://localhost:27017/comfytag
```

---

## STEP 5: E2E Testing Checklist

### ✅ Attendee Registration Flow
```
1. POST /auth/register { email, name, password, isPartner: false }
   ✓ User created with notificationPreferences.email = true
   ✓ Email verification email queued from sendEmail.js
   ✓ Welcome series jobs queued (emails 1, 2, 3)

2. Wait 24 hours (or test manually with BullMQ queue pause/resume)
   ✓ Email 2 fires (+24h)
   ✓ Email 3 fires (+72h, if faceEnrolled still false)
   
3. POST /api/face/enroll { userId, template }
   ✓ User.faceEnrolled = true
   ✓ Email 3 suppressed (already completed)
```

### ✅ Ticket Purchase Flow
```
1. POST /audience/[userId]/[eventId] { amount, type }
   ✓ Ticket created
   ✓ Confirmation email sent (tickets@comfytag.com)
   ✓ Reminder jobs queued (48h + 4h)

2. Wait 48 hours
   ✓ "You're going in 2 days" email fires
   
3. Wait 4 hours from event start
   ✓ "Event starts in 4 hours" email fires (conditional face block)
```

### ✅ Organizer Registration Flow
```
1. PUT /auth/register-organizer/[userId]
   ✓ User.isPartner = true
   ✓ Welcome series jobs queued (5 emails)

2. Timeline:
   +2d: KYC email
   +4d: Bank account email
   +7d: Create event email
   +12d: Final nudge email

3. At each stage, condition re-checked:
   POST /auth/verifykyc → Email 2 suppressed (KYC complete)
   PUT /bank → Email 3 suppressed (Bank added)
   POST /event → Email 4 & 5 suppressed (Event created)
```

### ✅ Post-Event Flow
```
1. PUT /event/[eventId] { status: "ended" }
   ✓ Recap email 1 sent to all attendees (immediate)
   ✓ Recap email 2 queued (+5 days, with recommendations)
   ✓ Organizer performance report sent (payouts@comfytag.com)

2. Check inbox:
   ✓ Report includes: revenue, attendance %, check-in breakdown
   ✓ Payout CTA included if no pending withdraw
```

### ✅ Retention Crons (Manual Testing)
```
1. Test Face Nudge Cron (runs 9am WAT daily)
   - Create test user with createdAt = 7 days ago, faceEnrolled = false
   - Cron should queue Email 1
   - Create user with createdAt = 14 days ago
   - Cron should queue Email 2

2. Test Attendee Win-Back Cron (runs 10am WAT daily)
   - Create Audience with createdAt = 90 days ago
   - Cron should queue Email 1 (Day 90)
   - Cron should queue Email 2 at day 105
   - Cron should queue Email 3 + suppress at day 120 (if no clicks)

3. Test Organizer Win-Back Cron (runs 11am WAT daily)
   - Same pattern as attendee (days 60, 75, 90)
```

---

## STEP 6: Mail-tester.com SPF/DKIM/DMARC Validation

**Before sending to real users:**

1. Go to https://www.mail-tester.com/
2. Copy the temporary email address (e.g., `test-xxxxx@mail-tester.com`)
3. Send a test email from your application:
   ```bash
   curl -X POST http://localhost:4002/api/send-test-email \
     -H "Content-Type: application/json" \
     -d '{
       "to": "test-xxxxx@mail-tester.com",
       "subject": "Test Email",
       "template": "attendeeWelcome1.hbs",
       "data": { "name": "Test User" }
     }'
   ```
4. In mail-tester, click "Then check your score"
5. **Target:** SPF, DKIM, DMARC all ✓ (green) — score ≥ 9/10

---

## STEP 7: Monitor Bounce/Complaint Rates

**After first 500 sends:**

Check Resend dashboard:
- **Bounce rate** should be < 2%
- **Complaint rate** should be < 0.08% (Gmail/Yahoo threshold)
- **Hard bounces** = invalid email → mark user email as invalid, stop sending
- **Soft bounces** = temporary failure → retry up to 3 times

---

## STEP 8: Verify Conditional Logic Works

**Test suppressed_inactive Tagging:**

```javascript
// After attendee has received 3 win-back emails with NO clicks
const user = await User.findOne({ email: "inactive@example.com" })
console.log(user.suppressed_inactive) // Should be true
console.log(user.emailSuppressed) // { reason: "win-back-no-response", date: ... }

// Verify no more win-back emails are sent
// (cron should skip users with suppressed_inactive = true)
```

**Test Re-engagement Detection:**

```javascript
// If user clicks Email 1 before Email 3 sends
const user = await User.findOne({ email: "engaged@example.com" })
console.log(user.emailEngaged) // Should be true
console.log(user.suppressed_inactive) // Should still be false (NOT suppressed)
```

---

## STEP 9: Production Readiness Checklist

- [ ] Resend account created + domain verified
- [ ] SPF/DKIM/DMARC records added to DNS
- [ ] All 3 cron job imports added to app.js
- [ ] Cron jobs initialized on server start
- [ ] node-cron installed
- [ ] RESEND_API_KEY in .env
- [ ] Test email sent to mail-tester.com (score ≥ 9/10)
- [ ] Manual E2E tests passed (registration, ticket purchase, post-event, retention)
- [ ] Bounce/complaint rates monitored for first 500 sends
- [ ] suppressed_inactive tagging verified
- [ ] Re-engagement click tracking verified

---

## COMMON ISSUES & DEBUGGING

### Issue: Cron jobs not running
**Fix:** Verify node-cron is installed + imports are correct
```bash
pnpm list node-cron
```

### Issue: Emails not sending
**Fix:** Check Redis is running for BullMQ queue
```bash
redis-cli ping
# Should return: PONG
```

### Issue: "Condition re-check" logic missing in cron
**Fix:** Each email loop queries User/Event doc again before sending
```javascript
const user = await User.findById(userId) // Re-query at send time
if (user.faceEnrolled === false) { // Re-check condition
  await enqueueEmail(...)
}
```

### Issue: Suppression not working
**Fix:** Ensure User schema has these fields:
```javascript
suppressed_inactive: Boolean // default: false
emailSuppressed: {
  reason: String, // "win-back-no-response", "organizer-winback-no-response"
  date: Date
}
emailEngaged: Boolean // default: false
```

---

## Summary

**31 emails + 3 cron jobs** ready to deploy:
- ✅ Phase 0: Foundation (multi-sender, Handlebars, BullMQ)
- ✅ Phase 1: Onboarding (welcome series)
- ✅ Phase 2: Transactional (confirmations, KYC, payouts)
- ✅ Phase 3: Behavioral (reminders, recap, reports)
- ✅ Phase 4: Retention (face nudge, win-back, suppression)
- 🎯 Phase 5: Integration (this guide)

**Next steps:** Follow the 9 integration steps above, run E2E tests, validate with mail-tester, deploy!
